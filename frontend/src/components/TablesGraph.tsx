import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  useReactFlow,
  MarkerType,
  NodeTypes,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, OperationType, Event as ApiEvent, Operation, ArchDetails, ArchEvent } from '@/types/api';
import TableNode from './TableNode';
import DetailsSidebar from './DetailsSidebar';
import TableSearch from './TableSearch';
import TableFilterBar from './TableFilterBar';
import CreateTableDialog from './CreateTableDialog';
import CreateArchDialog from './CreateArchDialog';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';

interface TablesGraphProps {
  tables: Table[];
  arches: ArchDetails[];
  onAddTable?: (newTable: Table, newArch?: ArchDetails) => void;
  onAddArch?: (newArch: ArchDetails) => void;
}

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const TablesGraph: React.FC<TablesGraphProps> = ({
  tables,
  arches,
  onAddTable,
  onAddArch
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedArch, setSelectedArch] = useState<ArchDetails | null>(null);
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);

  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  const dataFactories = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.datafactory_id)));
  }, [tables]);

  const projects = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.project_id)));
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (focusedTable) {
      const tableSourceId = focusedTable;
      const connectedTableSourceIds = new Set<string>();
      connectedTableSourceIds.add(tableSourceId);

      const findUpstream = (id: string) => {
        arches.forEach(arch => {
          if (arch.target === id) {
            connectedTableSourceIds.add(arch.source);
            findUpstream(arch.source);
          }
        });
      };

      const findDownstream = (id: string) => {
        arches.forEach(arch => {
          if (arch.source === id) {
            connectedTableSourceIds.add(arch.target);
            findDownstream(arch.target);
          }
        });
      };

      findUpstream(tableSourceId);
      findDownstream(tableSourceId);
      return tables.filter(table => connectedTableSourceIds.has(table.source_id));
    }
    return tables;
  }, [tables, focusedTable, arches]);

  const filteredArchIds = useMemo(() => {
    const tableSourceIds = new Set(filteredTables.map(t => t.source_id));
    return arches
      .filter(arch => tableSourceIds.has(arch.source) && tableSourceIds.has(arch.target))
      .map(arch => arch.id);
  }, [filteredTables, arches]);

  const positionTables = useCallback((tablesToPosition: Table[]) => {
    const dataFactoryGroups: Record<string, Table[]> = {};
    tablesToPosition.forEach(table => {
      const groupKey = table.datafactory_id;
      if (!dataFactoryGroups[groupKey]) dataFactoryGroups[groupKey] = [];
      dataFactoryGroups[groupKey].push(table);
    });

    const positionedTables = [...tablesToPosition];
    let factoryY = 50;
    const verticalGapBetweenFactories = 600;

    Object.values(dataFactoryGroups).forEach(factoryTables => {
      const projectGroups: Record<string, Table[]> = {};
      factoryTables.forEach(table => {
        const projectKey = table.project_id;
        if (!projectGroups[projectKey]) projectGroups[projectKey] = [];
        projectGroups[projectKey].push(table);
      });

      let projectX = 100;
      const horizontalGapBetweenProjects = 800;

      Object.values(projectGroups).forEach(projectTables => {
        const targetSourceIds = new Set(arches
          .filter(a => projectTables.some(t => t.source_id === a.source))
          .map(a => a.target)
        );

        const sourceTables = projectTables.filter(table =>
          !targetSourceIds.has(table.source_id) ||
          !arches.some(a => a.target === table.source_id && projectTables.some(t => t.source_id === a.source))
        );

        if (sourceTables.length === 0 && projectTables.length > 0) {
          sourceTables.push(projectTables[0]);
        }

        let treeX = projectX;
        const horizontalGapBetweenTrees = 400;

        sourceTables.forEach(sourceTable => {
          let currentY = factoryY;
          const sourceTableIndex = positionedTables.findIndex(t => t.source_id === sourceTable.source_id);
          if (sourceTableIndex !== -1) {
            positionedTables[sourceTableIndex].position = { x: treeX, y: currentY };
          }

          const positionedIds = new Set<string>([sourceTable.source_id]);
          const positionDownstreamTables = (tableSourceId: string, level: number, branchY: number): number => {
            const downstreamArches = arches.filter(arch =>
              arch.source === tableSourceId && projectTables.some(t => t.source_id === arch.target)
            );
            let yOffset = 0;
            const verticalGap = 200;

            downstreamArches.forEach(arch => {
              const targetTable = projectTables.find(t => t.source_id === arch.target);
              if (targetTable && !positionedIds.has(targetTable.source_id)) {
                positionedIds.add(targetTable.source_id);
                const targetY = branchY + yOffset;
                const targetX = treeX + (level * 250);
                const targetTableIndex = positionedTables.findIndex(t => t.source_id === targetTable.source_id);
                if (targetTableIndex !== -1) {
                  positionedTables[targetTableIndex].position = { x: targetX, y: targetY };
                }
                positionDownstreamTables(targetTable.source_id, level + 1, targetY);
                yOffset += verticalGap;
              }
            });
            return Math.max(branchY + yOffset, branchY + 100);
          };
          positionDownstreamTables(sourceTable.source_id, 1, currentY);
          treeX += horizontalGapBetweenTrees;
        });
        projectX = treeX + horizontalGapBetweenProjects - horizontalGapBetweenTrees;
      });
      factoryY += verticalGapBetweenFactories;
    });
    return positionedTables;
  }, [arches]);

  const initializeGraph = useCallback(() => {
    const tablesToRender = filteredTables || [];
    const positionedTablesOutput = positionTables([...tablesToRender]);

    const initialNodes: Node[] = positionedTablesOutput.map((table) => ({
      id: table.source_id,
      type: 'tableNode',
      data: { table, isFocused: focusedTable === table.source_id },
      position: table.position || { x: Math.random() * 500, y: Math.random() * 500 },
      draggable: true,
    }));

    const archesToRender = arches || [];
    const archIdsToRenderSet = new Set(filteredArchIds || []);
    const initialEdges: Edge[] = archesToRender
      .filter(arch => archIdsToRenderSet.has(arch.id))
      .map((arch) => {
        const archColor = getArchColor(arch.insertion_type);
        return {
          id: arch.id,
          source: arch.source,
          target: arch.target,
          animated: arch.operation.is_running || false,
          style: { stroke: archColor, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: archColor },
          data: { ...arch },
        };
      });

    setNodes(initialNodes);
    setEdges(initialEdges);

    if (selectedTable && !tablesToRender.some(t => t.source_id === selectedTable.source_id)) {
      setSelectedTable(null);
    }
    if (selectedArch && !archIdsToRenderSet.has(selectedArch.id)) {
      setSelectedArch(null);
    }

    if (reactFlowInstance && initialNodes.length > 0) {
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100);
    }
  }, [
    filteredTables,
    arches,
    filteredArchIds,
    focusedTable,
    positionTables,
    reactFlowInstance,
    selectedTable,
    selectedArch,
  ]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const arch = arches.find((a) => a.id === edge.id);
    if (arch) {
      setSelectedArch(arch);
      setSelectedTable(null);
      setSourceNode(null);
      setTargetNode(null);
    }
  }, [arches]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const table = tables.find((t) => t.source_id === node.id);
    if (table) {
      if (sourceNode && sourceNode !== node.id) {
        setTargetNode(node.id);
      } else {
        setSelectedTable(table);
        setSelectedArch(null);
        const clickTimestamp = new Date().getTime();
        if (selectedTable?.source_id === table.source_id) {
          const lastClick = (table as any).lastClickTime || 0;
          if (clickTimestamp - lastClick < 300) {
            setFocusedTable(focusedTable === table.source_id ? null : table.source_id);
          }
        }
        (table as any).lastClickTime = clickTimestamp;
      }
    }
  }, [tables, selectedTable, focusedTable, sourceNode]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFocusedTable(null);
    console.log("Filter changed (not implemented yet):", newFilters);
  }, []);

  const getArchColor = (insertionType: OperationType | string): string => {
    switch (insertionType) {
      case 'insert_stage_0': return '#4361ee';
      case 'insert_stage_1': return '#4cc9f0';
      case 'insert_upsert': return '#7209b7';
      case 'insert_custom': return '#f72585';
      default: return '#aaa';
    }
  };

  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedArch(null);
  };

  const handleTableSelect = (tableSourceId: string) => {
    const table = tables.find((t) => t.source_id === tableSourceId);
    if (table) {
      setSelectedTable(table);
      setSelectedArch(null);
      const node = nodes.find((n) => n.id === tableSourceId);
      if (node && reactFlowInstance) {
        const x = node.position?.x ?? 0;
        const y = node.position?.y ?? 0;
        reactFlowInstance.setCenter(x + (node.width ?? 0) / 2, y + (node.height ?? 0) / 2, { zoom: 1.5, duration: 800 });
      }
    }
  };

  const handleResetFocus = () => setFocusedTable(null);

  const handleSetSourceNode = () => {
    if (selectedTable) {
      setSourceNode(selectedTable.source_id);
      setTargetNode(null);
      toast({ title: "Source Selected", description: `Table "${selectedTable.source_name}" set as source. Now select a target table.` });
    }
  };

  const handleClearConnectionSelection = () => {
    setSourceNode(null);
    setTargetNode(null);
    if (selectedTable) {
      toast({ description: "Connection creation cancelled." });
    }
  };

  useEffect(() => {
    if (sourceNode && targetNode && sourceNode !== targetNode) {
      const sourceTable = tables.find(t => t.source_id === sourceNode);
      const targetTable = tables.find(t => t.source_id === targetNode);
      if (sourceTable && targetTable) {
        toast({ title: "Connection Ready", description: `Create connection from "${sourceTable.source_name}" to "${targetTable.source_name}"?` });
        console.log(`Attempting to create arch from ${sourceNode} to ${targetNode}`);
      }
    }
  }, [sourceNode, targetNode, tables, toast]);

  const handleCreateTable = (tableData: Partial<Table>, sourceTableSourceId?: string, createAsSelect?: boolean) => {
    if (!onAddTable) return;

    const newTableId = uuidv4();
    const newTable: Table = {
      source_id: newTableId,
      source_name: tableData.source_name || 'New Table',
      datafactory_id: tableData.datafactory_id || (dataFactories.length > 0 ? dataFactories[0] : 'default-df-id'),
      project_id: tableData.project_id || (projects.length > 0 ? projects[0] : 'default-proj-id'),
      row_count: tableData.row_count || 0,
      size_in_mb: tableData.size_in_mb || 0,
      columns: tableData.columns || [],
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      query_count: tableData.query_count || 0,
      insertion_type: tableData.insertion_type,
    };

    let newArch: ArchDetails | undefined = undefined;
    if (sourceTableSourceId && tableData.insertion_type) {
      const archId = uuidv4();
      newArch = {
        id: archId,
        source: sourceTableSourceId,
        target: newTable.source_id,
        insertion_type: tableData.insertion_type as OperationType,
        events: [],
        operation: {
          source_table_id: sourceTableSourceId,
          sink_table_id: newTable.source_id,
          datafactory_id: newTable.datafactory_id,
          operation_type: tableData.insertion_type as OperationType,
          is_running: false,
          status: 'pending',
          params_type: 'batch_ids',
          created_at: new Date(),
          last_update_time: new Date(),
        },
      };
    }
    onAddTable(newTable, newArch);
    toast({ title: "Table Created", description: `Table "${newTable.source_name}" added.` });
  };

  const handleCreateArch = (archData: Partial<ArchDetails>) => {
    if (!archData.source || !archData.target || !archData.insertion_type || !onAddArch) {
      toast({ variant: "destructive", title: "Failed to Create Connection", description: "Missing source, target, or insertion type." });
      return;
    }

    const newArch: ArchDetails = {
      id: uuidv4(),
      source: archData.source,
      target: archData.target,
      insertion_type: archData.insertion_type as OperationType,
      events: [],
      operation: {
        source_table_id: archData.source,
        sink_table_id: archData.target,
        datafactory_id: tables.find(t => t.source_id === archData.source)?.datafactory_id || 'default-df-id',
        operation_type: archData.insertion_type as OperationType,
        is_running: false,
        status: 'pending',
        params_type: 'batch_ids',
        created_at: new Date(),
        last_update_time: new Date(),
      },
      primary_key: archData.primary_key,
      order_by: archData.order_by,
      merge_statement: archData.merge_statement,
      sql_query: archData.sql_query,
    };

    onAddArch(newArch);
    toast({ title: "Connection Created", description: `Connection from "${newArch.source}" to "${newArch.target}" added.` });
    setSourceNode(null);
    setTargetNode(null);
  };

  useEffect(() => {
    if (sourceNode && targetNode) {
    }
  }, [sourceNode, targetNode]);

  return (
    <div className="flex h-full w-full flex-col bg-gray-50">
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b">
        <div className="container mx-auto p-3">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              <div className="md:col-span-4">
                <TableFilterBar
                  dataFactories={dataFactories}
                  projects={projects}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <div className="md:col-span-1">
                <TableSearch tables={filteredTables} onTableSelect={handleTableSelect} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow relative">
        {focusedTable && (
          <div className="absolute top-3 left-4 z-10">
            <button
              onClick={handleResetFocus}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm shadow flex items-center gap-1.5"
            >
              <span>Exit Focus Mode on "{tables.find(t => t.source_id === focusedTable)?.source_name}"</span>
            </button>
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className="h-full">
          {(selectedTable || selectedArch) && (
            <>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full overflow-auto bg-white border-r p-1">
                  <DetailsSidebar
                    selectedTable={selectedTable}
                    selectedArch={selectedArch}
                    onClose={handleCloseSidebar}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={(selectedTable || selectedArch) ? 70 : 100}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25, duration: 300 }}
              minZoom={0.1}
              maxZoom={2.5}
              className="bg-gradient-to-br from-gray-50 to-slate-100"
            >
              <Background color="#ddd" gap={20} size={1.5} />
              <Controls showInteractive={false} />
              <MiniMap nodeStrokeWidth={3} zoomable pannable />

              <Panel position="top-right" className="bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-lg m-2 text-xs">
                <div>Tables: {filteredTables.length}</div>
                <div>Connections: {filteredArchIds.length}</div>
              </Panel>
            </ReactFlow>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="sticky bottom-0 bg-white z-20 p-3 border-t shadow-md">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {selectedTable && !sourceNode && (
              <>
                <span className="text-sm font-medium text-gray-700">Selected: <strong>{selectedTable.source_name}</strong></span>
                <button
                  onClick={handleSetSourceNode}
                  className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm"
                >
                  Set as Source
                </button>
              </>
            )}
            {sourceNode && selectedTable && selectedTable.source_id === sourceNode && !targetNode && (
              <span className="text-sm font-medium text-green-600">Source: <strong>{selectedTable.source_name}</strong>. Select a target table.</span>
            )}
            {sourceNode && targetNode && selectedTable && (selectedTable.source_id === targetNode) && (
              <span className="text-sm font-medium text-green-600">Target: <strong>{selectedTable.source_name}</strong>. Ready to create connection.</span>
            )}
            {(sourceNode) && (
              <button
                onClick={handleClearConnectionSelection}
                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md shadow-sm"
              >
                Clear Selection
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <CreateTableDialog
              tables={tables}
              dataFactories={dataFactories}
              projects={projects}
              onTableCreate={handleCreateTable}
            />
            <CreateArchDialog
              tables={tables}
              sourceNodeId={sourceNode}
              targetNodeId={targetNode}
              onArchCreate={(dialogArchData) => {
                const adaptedArchData: Partial<ArchDetails> = {
                  ...dialogArchData,
                  insertion_type: dialogArchData.insertion_type as OperationType,
                };
                handleCreateArch(adaptedArchData);
                setSourceNode(null);
                setTargetNode(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablesGraph;
