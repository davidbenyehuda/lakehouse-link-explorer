import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

import { Table, OperationType, Event as ApiEvent, Operation, OperationParamsType, ArchDetails, ArchEvent, MetaDataApi, TrinoApi, FilterOptions } from '@/types/api';
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
import { config } from 'process';

interface TableMappings {
  sourceToProject: { [key: string]: string };
  sourceToDataFactory: { [key: string]: string };
  projectToDataFactory: { [key: string]: string };
  labelMappings: {
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
  };
}

interface TablesGraphProps {
  tables: Table[];
  arches: ArchDetails[];
  onAddTable?: (newTable: Table, newArch?: ArchDetails) => void;
  onAddArch?: (newArch: ArchDetails) => void;
  metadataService: MetaDataApi;
  trinoService: TrinoApi;
  tableMappings: TableMappings;
}

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const TablesGraph: React.FC<TablesGraphProps> = ({
  tables,
  arches,
  onAddTable,
  onAddArch,
  metadataService,
  trinoService,
  tableMappings
}) => {
  // Layout configuration
  const layoutConfig = {
    horizontalSpacing: 0.15,  // 15% of screen width between depth levels
    verticalSpacing: 0.2,     // 20% of screen height between nodes
    startX: 0.1,             // Start at 10% from left
    startY: 0.1,             // Start at 10% from top
    maxWidth: 0.8,           // Use 80% of screen width
    maxHeight: 0.8,          // Use 80% of screen height
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedArch, setSelectedArch] = useState<ArchDetails | null>(null);
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const initialFitDone = useRef(false);

  // Use fixed dimensions for initial layout
  const containerSize = { width: 2000, height: 1500 };
  const QueryEventLimit =  import.meta.env.QueryEventLimit || 200;
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  const dataFactories = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.datafactory_id)));
  }, [tables]);

  const projects = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.project_id)));
  }, [tables]);

  const filteredTables = useMemo(() => {
    let filtered = tables;

    // Apply focus mode filter
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
      filtered = filtered.filter(table => connectedTableSourceIds.has(table.table_id));
    }

    // Apply datafactory filter
    if (currentFilters.datafactory_id) {
      const datafactoryIds = Array.isArray(currentFilters.datafactory_id) 
        ? currentFilters.datafactory_id 
        : [currentFilters.datafactory_id];
      filtered = filtered.filter(table => {
        return datafactoryIds.includes(table.datafactory_id);
      });
    }

    // Apply project filter
    if (currentFilters.project_id) {
      const projectIds = Array.isArray(currentFilters.project_id) 
        ? currentFilters.project_id 
        : [currentFilters.project_id];
      filtered = filtered.filter(table => {
        if (table.is_datafactory_table()) {
          return projectIds.some(projectId => 
            tableMappings.projectToDataFactory[projectId] === table.datafactory_id
          );
        } else {
          return projectIds.includes(table.project_id);
        }
      });
    }

    // Apply locked filter
    if (currentFilters.locked !== undefined) {
      filtered = filtered.filter(table => table.locked === currentFilters.locked);
    }

    return filtered;
  }, [tables, focusedTable, arches, currentFilters, tableMappings]);

  const filteredArchIds = useMemo(() => {
    const tableSourceIds = new Set(filteredTables.map(t => t.table_id));
    let filtered = arches
      .filter(arch => tableSourceIds.has(arch.source) && tableSourceIds.has(arch.target));

    // Apply arch status filter
    if (currentFilters.archStatus && currentFilters.archStatus.length > 0) {
      filtered = filtered.filter(arch => 
        currentFilters.archStatus!.includes(arch.status || 'empty')
      );
    }

    // Apply params type filter
    if (currentFilters.paramsType && currentFilters.paramsType.length > 0) {
      filtered = filtered.filter(arch => {
        // Get the most recent event for this arch
        const latestEvent = arch.events?.[0];
        return latestEvent && currentFilters.paramsType!.includes(latestEvent.params_type);
      });
    }

    return filtered.map(arch => arch.id);
  }, [filteredTables, arches, currentFilters]);

  const positionTables = useCallback((tablesToPosition: Table[]) => {
    // First, find all source tables (tables that are not targets of any arch)
    const sourceTables = tablesToPosition.filter(table => 
      !arches.some(arch => arch.target === table.table_id)
    );

    // Create a map to store the depth of each table
    const tableDepths = new Map<string, number>();
    
    // Set initial depth for source tables
    sourceTables.forEach(table => {
      tableDepths.set(table.table_id, 0);
    });

    // Function to calculate depth of a table
    const calculateDepth = (tableId: string): number => {
      if (tableDepths.has(tableId)) {
        return tableDepths.get(tableId)!;
      }

      // Find all arches where this table is a target
      const incomingArches = arches.filter(arch => arch.target === tableId);
      
      if (incomingArches.length === 0) {
        tableDepths.set(tableId, 0);
        return 0;
      }

      // Calculate depth based on source tables
      const maxSourceDepth = Math.max(
        ...incomingArches.map(arch => calculateDepth(arch.source))
      );
      
      const depth = maxSourceDepth + 1;
      tableDepths.set(tableId, depth);
      return depth;
    };

    // Calculate depths for all tables
    tablesToPosition.forEach(table => {
      calculateDepth(table.table_id);
    });

    // Find maximum depth to determine layout width
    const maxDepth = Math.max(...Array.from(tableDepths.values()));
    
    // Group tables by depth
    const tablesByDepth = new Map<number, Table[]>();
    tablesToPosition.forEach(table => {
      const depth = tableDepths.get(table.table_id)!;
      if (!tablesByDepth.has(depth)) {
        tablesByDepth.set(depth, []);
      }
      tablesByDepth.get(depth)!.push(table);
    });

    // Position tables
    const positionedTables = [...tablesToPosition];
    
    // Calculate available space in pixels
    const availableWidth = containerSize.width * layoutConfig.maxWidth;
    const availableHeight = containerSize.height * layoutConfig.maxHeight;
    
    // Calculate starting positions in pixels
    const startXPixels = containerSize.width * layoutConfig.startX;
    const startYPixels = containerSize.height * layoutConfig.startY;
    
    // Calculate horizontal spacing between depth levels in pixels
    const horizontalGap = availableWidth / (maxDepth + 1);
    
    // Position tables for each depth
    tablesByDepth.forEach((tables, depth) => {
      // Calculate x position in pixels
      const x = startXPixels + (depth * horizontalGap);
      
      // Calculate vertical spacing for this depth level in pixels
      const verticalGap = availableHeight / (tables.length + 1);
      
      // Position tables at this depth vertically
      tables.forEach((table, index) => {
        // Calculate y position in pixels
        const y = startYPixels + (index * verticalGap);
        
        const tableIndex = positionedTables.findIndex(t => t.table_id === table.table_id);
        if (tableIndex !== -1) {
          positionedTables[tableIndex].position = { x, y };
        }
      });
    });

    return positionedTables;
  }, [arches, layoutConfig]);

  const getArchColor = (insertionType: OperationType | string, status?: string): string => {
    if (status === 'failure') {
      return '#000000'; // Black color for failure
    }
    if (status === 'locked') {
      return '#000000'; // Black color for locked
    }
    switch (insertionType) {
      case 'insert_stage_0': return '#4361ee';
      case 'insert_stage_1': return '#4cc9f0';
      case 'insert_upsert': return '#7209b7';
      case 'insert_custom': return '#f72585';
      default: return '#aaa';
    }
  };

  const initializeGraph = useCallback(() => {
    console.log("Initializing graph structure");
    const tablesToRender = filteredTables || [];
    const positionedTablesOutput = positionTables([...tablesToRender]);

    const initialNodes: Node[] = positionedTablesOutput.map((table) => ({
      id: table.table_id,
      type: 'tableNode',
      data: { 
        table, 
        isFocused: focusedTable === table.source_id,
        isLocked: table.locked 
      },
      position: table.position || { x: Math.random() * 500, y: Math.random() * 500 },
      draggable: true,
    }));

    const archesToRender = arches || [];
    const archIdsToRenderSet = new Set(filteredArchIds || []);
    const initialEdges: Edge[] = archesToRender
      .filter(arch => archIdsToRenderSet.has(arch.id))
      .map((arch) => {
        const archColor = getArchColor(arch.insertion_type, arch.status);
        return {
          id: arch.get_id(),
          source: arch.source,
          target: arch.target,
          animated: arch.is_active() || false,
          style: { 
            stroke: archColor, 
            strokeWidth: 2
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            width: arch.status === 'failure' ? 25 : 15, 
            height: arch.status === 'failure' ? 25 : 15, 
            color: archColor 
          },
          data: { ...arch },
          selectable: true,
          interactionWidth: 20,
        };
      });

    setNodes(initialNodes);
    setEdges(initialEdges);
    initialFitDone.current = false;

    if (selectedTable && !tablesToRender.some(t => t.source_id === selectedTable.source_id)) {
      setSelectedTable(null);
    }
    if (selectedArch && !archIdsToRenderSet.has(selectedArch.id)) {
      setSelectedArch(null);
    }
  }, [
    filteredTables,
    arches,
    filteredArchIds,
    focusedTable,
    positionTables,
    selectedTable,
    selectedArch,
  ]);

  const handleNodesChange = useCallback((changes: any) => {
    // Only update positions, don't trigger reinitialization
    onNodesChange(changes);
  }, [onNodesChange]);

  useEffect(() => {
    const shouldInitialize = 
      filteredTables.length > 0 || 
      arches.length > 0 || 
      focusedTable !== null || 
      selectedTable !== null || 
      selectedArch !== null;

    if (shouldInitialize) {
      console.log("Effect triggered - initializing graph structure");
      initializeGraph();
    }
  }, [
    filteredTables,
    arches,
    filteredArchIds,
    focusedTable,
    selectedTable,
    selectedArch,
  ]);

  // Single effect for initial fit view that only runs once
  useEffect(() => {
    if (!initialFitDone.current && reactFlowInstance && nodes.length > 0) {
      console.log("Nodes ready for fit view:", nodes.length);
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
        initialFitDone.current = true;
        console.log("Initial fit view completed");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [reactFlowInstance, nodes.length]);

  const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    console.log("Edge clicked:", edge.id);
    const arch = arches.find((a) => a.get_id() === edge.id);
    console.log("Found arch:", arch);
    
    if (arch) {
      try {
        // Only fetch events if they don't exist
        if (!arch.events || arch.events.length === 0) {
          const events = await trinoService.getEvents({
            source_id: [arch.source_table_source_id],
            sink_id: [arch.sink_table_source_id],
            operation_type: [arch.insertion_type],
            time_range: [startDate, endDate],
          }, undefined, QueryEventLimit);
          arch.events = events.map(event => ({
            timestamp: event.event_time,
            params_type: event.params_type as OperationParamsType,
            batch_id: String(event.batch_id),
            batches: event.batches,
            rows_affected: event.rows_added,
            duration_ms: event.finished_time && event.start_time ? 
              new Date(event.finished_time).getTime() - new Date(event.start_time).getTime() : 
              null,
            bytes_added: event.bytes_added}))
            const archmetadata= await metadataService.getArchMetadata(
              arch.source_table_source_id, arch.sink_table_source_id,arch.insertion_type,arch.merge_statement)
            arch.add_metadata(archmetadata)
        }
        setSelectedArch(arch);
        setSelectedTable(null);
        setSourceNode(null);
        setTargetNode(null);
      } catch (error) {
        console.error('Error fetching arch events:', error);
        toast({ 
          variant: "destructive",
          title: "Error", 
          description: "Failed to fetch connection events" 
        });
      }
    }
  }, [arches, trinoService, toast]);

  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    const table = tables.find((t) => t.table_id === node.id);
    if (table) {
      if (sourceNode && sourceNode !== node.id) {
        setTargetNode(node.id);
      } else {
        try {
          // Only fetch columns if they don't exist
          if (!table.columns || table.columns.length === 0) {
            const columns = await metadataService.getTableColumns(table.source_id);
            table.columns = columns;
            setSelectedTable(table);
          }
          setSelectedTable(table);
          
          
          setSelectedArch(null);
          const clickTimestamp = new Date().getTime();
          if (selectedTable?.table_id === table.table_id) {
            const lastClick = (table as any).lastClickTime || 0;
            if (clickTimestamp - lastClick < 300) {
              setFocusedTable(focusedTable === table.table_id ? null : table.table_id);
            }
          }
          (table as any).lastClickTime = clickTimestamp;
        } catch (error) {
          console.error('Error fetching table columns:', error);
          toast({ 
            variant: "destructive",
            title: "Error", 
            description: "Failed to fetch table columns" 
          });
        }
      }
    }
  }, [tables, selectedTable, focusedTable, sourceNode, metadataService, toast]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFocusedTable(null);
    if (newFilters.startDate) {
      setStartDate(newFilters.startDate);
    }
    if (newFilters.endDate) {
      setEndDate(newFilters.endDate);
    }
    setCurrentFilters(newFilters);
    console.log("Filter changed:", newFilters);
  }, []);

  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedArch(null);
  };

  const handleTableSelect = (tableSourceId: string) => {
    const table = tables.find((t) => t.table_id === tableSourceId);
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
      setSourceNode(selectedTable.table_id);
      setTargetNode(null);
      toast({ title: "Source Selected", description: `Table "${selectedTable.table_name}" set as source. Now select a target table.` });
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
        toast({ title: "Connection Ready", description: `Create connection from "${sourceTable.table_name}" to "${targetTable.table_name}"?` });
        console.log(`Attempting to create arch from ${sourceNode} to ${targetNode}`);
      }
    }
  }, [sourceNode, targetNode, tables, toast]);

  const handleCreateTable = (tableData: Partial<Table>, sourceTableSourceId?: string, createAsSelect?: boolean) => {
    if (!onAddTable) return;

    const newTableId = uuidv4();
    const newTable = new Table(
      newTableId, // table_id
      newTableId, // source_id
      tableData.source_name || 'New Table', // source_name
      tableData.datafactory_id || (dataFactories.length > 0 ? dataFactories[0] : 'default-df-id'), // datafactory_id
      '', // datafactory_name
      tableData.project_id || (projects.length > 0 ? projects[0] : 'default-proj-id'), // project_id
      '', // project_name
      tableData.source_name || 'New Table', // table_name
      tableData.row_count || 0, // row_count
      tableData.size_in_mb || 0, // size_in_mb
      new Date(), // last_updated
      tableData.columns || [], // columns
      { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 }, // position
      tableData.query_count || 0 // query_count
    );

    let newArch: ArchDetails | undefined = undefined;
    if (sourceTableSourceId) {
      const archId = uuidv4();
      newArch = new ArchDetails(
        sourceTableSourceId, // source_table_source_id
        newTable.source_id, // sink_table_source_id
        sourceTableSourceId, // source
        newTable.source_id, // target
        tableData.insertion_type as OperationType, // insertion_type
        'pending' // status
      );
    }
    onAddTable(newTable, newArch);
    toast({ title: "Table Created", description: `Table "${newTable.table_name}" added.` });
  };

  const handleCreateArch = (archData: Partial<ArchDetails>) => {
    if (!archData.source || !archData.target || !archData.insertion_type || !onAddArch) {
      toast({ variant: "destructive", title: "Failed to Create Connection", description: "Missing source, target, or insertion type." });
      return;
    }

    const sourceTable = tables.find(t => t.source_id === archData.source);
    const targetTable = tables.find(t => t.source_id === archData.target);

    const newArch = new ArchDetails(
      archData.source, // source_table_source_id
      archData.target, // sink_table_source_id
      archData.source, // source
      archData.target, // target
      archData.insertion_type as OperationType, // insertion_type
      'pending', // status
      undefined, // id
      [], // events
      archData.primary_key, // primary_key
      archData.order_by, // order_by
      archData.merge_statement, // merge_statement
      archData.sql_query, // sql_query
      archData.transformations // transformations
    );

    onAddArch(newArch);
    toast({ title: "Connection Created", description: `Connection from "${sourceTable?.table_name}" to "${targetTable?.table_name}" added.` });
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
                  tableMappings={tableMappings}
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
              <span>Exit Focus Mode on "{tables.find(t => t.source_id === focusedTable)?.table_name}"</span>
            </button>
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className="h-full">
          {(selectedTable || selectedArch) && (
            <>
              <ResizablePanel id="details-panel" defaultSize={30} minSize={20} maxSize={50}>
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

          <ResizablePanel id="graph-panel" defaultSize={(selectedTable || selectedArch) ? 70 : 100}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25, duration: 300 }}
              minZoom={0.1}
              maxZoom={2.5}
              className="bg-gradient-to-br from-gray-50 to-slate-100"
              elementsSelectable={true}
              selectNodesOnDrag={false}
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
                <span className="text-sm font-medium text-gray-700">Selected: <strong>{selectedTable.table_name}</strong></span>
                <button
                  onClick={handleSetSourceNode}
                  className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm"
                >
                  Set as Source
                </button>
              </>
            )}
            {sourceNode && selectedTable && selectedTable.table_id === sourceNode && !targetNode && (
              <span className="text-sm font-medium text-green-600">Source: <strong>{selectedTable.table_name}</strong>. Select a target table.</span>
            )}
            {sourceNode && targetNode && selectedTable && (selectedTable.table_id === targetNode) && (
              <span className="text-sm font-medium text-green-600">Target: <strong>{selectedTable.table_name}</strong>. Ready to create connection.</span>
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
