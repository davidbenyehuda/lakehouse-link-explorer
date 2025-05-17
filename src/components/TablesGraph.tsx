import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  MarkerType,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, ArchDetails, FilterOptions } from '../types/tables';
import TableNode from './TableNode';
import DetailsSidebar from './DetailsSidebar';
import TableSearch from './TableSearch';
import TableFilterBar from './TableFilterBar';
import CreateTableDialog from './CreateTableDialog';
import CreateArchDialog from './CreateArchDialog';
import { v4 as uuidv4 } from 'uuid';

interface TablesGraphProps {
  tables: Table[];
  arches: ArchDetails[];
  onAddTable?: (newTable: Table, newArch?: ArchDetails) => void;
  onAddArch?: (newArch: ArchDetails) => void;
}

// Custom node types
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const TablesGraph: React.FC<TablesGraphProps> = ({ tables, arches, onAddTable, onAddArch }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedArch, setSelectedArch] = useState<ArchDetails | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  
  const reactFlowInstance = useReactFlow();

  // Extract unique data factories and projects for filters
  const dataFactories = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.datafactory_id)));
  }, [tables]);
  
  const projects = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.project_id)));
  }, [tables]);

  // Filter tables and arches based on selected criteria
  const filteredTables = useMemo(() => {
    if (focusedTable) {
      // If we have a focused table, filter to show only its connections
      const tableId = focusedTable;
      const connectedTableIds = new Set<string>();
      
      // Add the focused table
      connectedTableIds.add(tableId);
      
      // Find all upstream tables (sources)
      const findUpstream = (id: string) => {
        arches.forEach(arch => {
          if (arch.target === id) {
            connectedTableIds.add(arch.source);
            findUpstream(arch.source);
          }
        });
      };
      
      // Find all downstream tables (targets)
      const findDownstream = (id: string) => {
        arches.forEach(arch => {
          if (arch.source === id) {
            connectedTableIds.add(arch.target);
            findDownstream(arch.target);
          }
        });
      };
      
      findUpstream(tableId);
      findDownstream(tableId);
      
      return tables.filter(table => connectedTableIds.has(table.id));
    }
    
    if (!Object.keys(filters).length) return tables;
    
    return tables.filter(table => {
      let match = true;
      
      if (filters.datafactory_id && filters.datafactory_id !== 'all' && table.datafactory_id !== filters.datafactory_id) {
        match = false;
      }
      
      if (filters.project_id && filters.project_id !== 'all' && table.project_id !== filters.project_id) {
        match = false;
      }
      
      return match;
    });
  }, [tables, filters, focusedTable, arches]);
  
  const filteredArchIds = useMemo(() => {
    const tableIds = new Set(filteredTables.map(t => t.id));
    
    return arches
      .filter(arch => {
        // Keep arches where both source and target are in filtered tables
        const sourceTargetMatch = tableIds.has(arch.source) && tableIds.has(arch.target);
        
        // Apply date filters
        let dateMatch = true;
        if (filters.startDate || filters.endDate) {
          // Get the most recent event timestamp
          const latestEvent = arch.events.reduce((latest, event) => {
            const eventDate = new Date(event.timestamp);
            return !latest || eventDate > latest ? eventDate : latest;
          }, null as Date | null);
          
          if (latestEvent) {
            if (filters.startDate && latestEvent < filters.startDate) {
              dateMatch = false;
            }
            if (filters.endDate) {
              // Add one day to include the end date fully
              const endDatePlusDay = new Date(filters.endDate);
              endDatePlusDay.setDate(endDatePlusDay.getDate() + 1);
              if (latestEvent > endDatePlusDay) {
                dateMatch = false;
              }
            }
          }
        }
        
        return sourceTargetMatch && dateMatch;
      })
      .map(arch => arch.id);
  }, [filteredTables, arches, filters]);

  // Position trees with better separation between data factories
  const positionTables = useCallback((tablesToPosition: Table[]) => {
    // Group tables by datafactory
    const dataFactoryGroups: Record<string, Table[]> = {};
    
    tablesToPosition.forEach(table => {
      const groupKey = table.datafactory_id;
      if (!dataFactoryGroups[groupKey]) {
        dataFactoryGroups[groupKey] = [];
      }
      dataFactoryGroups[groupKey].push(table);
    });
    
    const positionedTables = [...tablesToPosition];
    let factoryY = 50;
    const verticalGapBetweenFactories = 600; // Increased from 400
    
    // Position each data factory group
    Object.entries(dataFactoryGroups).forEach(([factoryId, factoryTables]) => {
      // Further group by project within each factory
      const projectGroups: Record<string, Table[]> = {};
      
      factoryTables.forEach(table => {
        const projectKey = table.project_id;
        if (!projectGroups[projectKey]) {
          projectGroups[projectKey] = [];
        }
        projectGroups[projectKey].push(table);
      });
      
      let projectX = 100; // Increased from 50
      const horizontalGapBetweenProjects = 800; // Increased from 600
      
      // Position each project group within this factory
      Object.entries(projectGroups).forEach(([projectId, projectTables]) => {
        // Find source tables (tables that are not targets in any arch)
        const targetIds = new Set(arches.filter(a => 
          projectTables.some(t => t.id === a.source)
        ).map(a => a.target));
        
        const sourceTables = projectTables.filter(table => 
          !targetIds.has(table.id) || 
          !arches.some(a => a.target === table.id && projectTables.some(t => t.id === a.source))
        );
        
        if (sourceTables.length === 0 && projectTables.length > 0) {
          // If no source tables found but we have tables, use the first one
          sourceTables.push(projectTables[0]);
        }
        
        // Position trees starting from source tables
        let treeX = projectX;
        const horizontalGapBetweenTrees = 400; // Increased from 300
        
        sourceTables.forEach(sourceTable => {
          // Start a new tree at this X position
          const currentX = treeX;
          let currentY = factoryY;
          
          // Position the source table
          const sourceTableIndex = positionedTables.findIndex(t => t.id === sourceTable.id);
          if (sourceTableIndex !== -1) {
            positionedTables[sourceTableIndex].position = { x: currentX, y: currentY };
          }
          
          // Track positioned tables to avoid duplicates
          const positionedIds = new Set<string>([sourceTable.id]);
          
          // Function to recursively position downstream tables
          const positionDownstreamTables = (tableId: string, level: number, branchY: number) => {
            const downstreamArches = arches.filter(arch => 
              arch.source === tableId && 
              projectTables.some(t => t.id === arch.target)
            );
            
            const verticalGap = 200; // Increased from 150
            let yOffset = 0;
            
            downstreamArches.forEach((arch, index) => {
              const targetTable = projectTables.find(t => t.id === arch.target);
              if (targetTable && !positionedIds.has(targetTable.id)) {
                positionedIds.add(targetTable.id);
                
                const targetY = branchY + yOffset;
                const targetX = currentX + (level * 250); // Increased from 200
                
                const targetTableIndex = positionedTables.findIndex(t => t.id === targetTable.id);
                if (targetTableIndex !== -1) {
                  positionedTables[targetTableIndex].position = { x: targetX, y: targetY };
                }
                
                // Position further downstream tables
                positionDownstreamTables(targetTable.id, level + 1, targetY);
                
                yOffset += verticalGap;
              }
            });
            
            return Math.max(branchY + yOffset, branchY + 100);
          };
          
          // Position all downstream tables in this tree
          const treeHeight = positionDownstreamTables(sourceTable.id, 1, currentY) - factoryY;
          
          // Move to next tree position
          treeX += horizontalGapBetweenTrees;
        });
        
        // Move to next project position
        projectX = treeX + horizontalGapBetweenProjects - horizontalGapBetweenTrees;
      });
      
      // Move to next factory position (vertical)
      factoryY += verticalGapBetweenFactories;
    });
    
    return positionedTables;
  }, [arches]);

  // Convert tables to nodes
  const initializeGraph = useCallback(() => {
    // Position the tables first
    const positionedTables = positionTables([...filteredTables]);
    
    const initialNodes: Node[] = positionedTables.map((table) => ({
      id: table.id,
      type: 'tableNode',
      data: { table, isFocused: focusedTable === table.id },
      position: table.position || { x: 0, y: 0 },
      draggable: false,
    }));

    // Convert filtered arches to edges
    const initialEdges: Edge[] = arches
      .filter(arch => filteredArchIds.includes(arch.id))
      .map((arch) => {
        const archColor = getArchColor(arch.insertion_type);
        
        return {
          id: arch.id,
          source: arch.source,
          target: arch.target,
          animated: false,
          style: { stroke: archColor, strokeWidth: 3 }, // Increased stroke width
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 35,  // Increased marker width
            height: 35, // Increased marker height
            color: archColor,
          },
          data: { ...arch },
        };
      });

    setNodes(initialNodes);
    setEdges(initialEdges);
    
    // Reset selections if they are no longer in the filtered data
    if (selectedTable && !filteredTables.some(t => t.id === selectedTable.id)) {
      setSelectedTable(null);
    }
    
    if (selectedArch && !filteredArchIds.includes(selectedArch.id)) {
      setSelectedArch(null);
    }
    
    // Center view to fit all nodes
    if (reactFlowInstance) {
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
    }
  }, [filteredTables, arches, filteredArchIds, setNodes, setEdges, selectedTable, selectedArch, positionTables, reactFlowInstance, focusedTable]);
  
  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const arch = arches.find((a) => a.id === edge.id);
    if (arch) {
      setSelectedArch(arch);
      setSelectedTable(null);
    }
  }, [arches]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const table = tables.find((t) => t.id === node.id);
    if (table) {
      if (sourceNode && sourceNode !== node.id) {
        // If source is already selected and we're selecting a different node, this is the target
        setTargetNode(node.id);
      } else {
        // Otherwise update selected table and reset source/target if it's a different node
        setSelectedTable(table);
        setSelectedArch(null);
        
        // Double click detection
        const clickTimestamp = new Date().getTime();
        if (selectedTable?.id === table.id) {
          const lastClick = (table as any).lastClickTime || 0;
          if (clickTimestamp - lastClick < 300) { // 300ms threshold for double-click
            // Toggle focus mode
            setFocusedTable(focusedTable === table.id ? null : table.id);
          }
        }
        (table as any).lastClickTime = clickTimestamp;
      }
    }
  }, [tables, selectedTable, focusedTable, sourceNode]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFocusedTable(null); // Clear focused table when filters change
  }, []);
  
  // Get color based on insertion type
  const getArchColor = (insertionType: string): string => {
    switch (insertionType) {
      case 'insert_stage_0':
        return '#4361ee';
      case 'insert_stage_1':
        return '#4cc9f0';
      case 'insert_upsert':
        return '#7209b7';
      case 'insert_custom':
        return '#f72585';
      default:
        return '#aaa';
    }
  };

  // Close sidebar
  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedArch(null);
  };

  // Handle table search selection
  const handleTableSelect = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setSelectedArch(null);

      // Find the node and center the view on it
      const node = nodes.find((n) => n.id === tableId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(
          node.position.x,
          node.position.y,
          { zoom: 1.5, duration: 800 }
        );
      }
    }
  };

  // Reset focus mode
  const handleResetFocus = () => {
    setFocusedTable(null);
  };

  // Set source node for connection
  const handleSetSourceNode = () => {
    if (selectedTable) {
      setSourceNode(selectedTable.id);
      toast({
        title: "Source Selected",
        description: "Now select a target table to create a connection."
      });
    }
  };

  // Clear connection selection
  const handleClearConnectionSelection = () => {
    setSourceNode(null);
    setTargetNode(null);
  };

  // Open connection dialog when both source and target are selected
  useEffect(() => {
    if (sourceNode && targetNode) {
      // Here you would trigger the create connection dialog
      // For now, we'll just reset the selection
      setSourceNode(null);
      setTargetNode(null);
    }
  }, [sourceNode, targetNode]);

  // Handle table creation
  const handleCreateTable = (tableData: Partial<Table>, sourceTableId?: string, createAsSelect?: boolean) => {
    if (!onAddTable) return;
    
    const newTable: Table = {
      id: uuidv4(),
      source_id: tableData.source_id || 'New Table',
      datafactory_id: tableData.datafactory_id || dataFactories[0],
      project_id: tableData.project_id || projects[0],
      row_count: tableData.row_count || 0,
      size_in_mb: tableData.size_in_mb || 0,
      columns: tableData.columns || []
    };

    // If source table is specified, create an arch
    let newArch: ArchDetails | undefined = undefined;
    if (sourceTableId && tableData.insertion_type) {
      newArch = {
        id: uuidv4(),
        source: sourceTableId,
        target: newTable.id,
        insertion_type: tableData.insertion_type,
        events: [{
          timestamp: new Date(),
          rows_affected: 0,
          duration_ms: 0
        }],
        primary_key: tableData.primary_key,
        order_by: tableData.order_by,
        merge_statement: tableData.merge_statement,
        sql_query: tableData.sql_query
      };
    }

    onAddTable(newTable, newArch);
  };

  // Handle arch creation
  const handleCreateArch = (archData: Partial<ArchDetails>) => {
    if (!archData.source || !archData.target || !archData.insertion_type || !onAddArch) return;

    const newArch: ArchDetails = {
      id: uuidv4(),
      source: archData.source,
      target: archData.target,
      insertion_type: archData.insertion_type,
      events: [{
        timestamp: new Date(),
        rows_affected: 0,
        duration_ms: 0
      }],
      primary_key: archData.primary_key,
      order_by: archData.order_by,
      merge_statement: archData.merge_statement,
      sql_query: archData.sql_query
    };

    onAddArch(newArch);
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Top Search Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-md p-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow md:flex-grow-0 md:w-1/4">
              <TableFilterBar 
                dataFactories={dataFactories}
                projects={projects}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex-grow">
              <TableSearch tables={filteredTables} onTableSelect={handleTableSelect} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Flow Area */}
      <div className="flex-grow pt-24 pb-16"> {/* Add padding to account for top and bottom bars */}
        {focusedTable && (
          <div className="absolute top-24 left-4 z-10">
            <button 
              onClick={handleResetFocus}
              className="px-3 py-1 bg-blue-500 text-white rounded flex items-center gap-1"
            >
              <span>Exit Focus Mode</span>
            </button>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white z-10 p-4 border-t shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            {selectedTable && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected: {selectedTable.source_id}</span>
                <button 
                  onClick={handleSetSourceNode}
                  className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                >
                  Set as Source
                </button>
                {sourceNode && (
                  <button 
                    onClick={handleClearConnectionSelection}
                    className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}
            {sourceNode && !selectedTable && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Source selected. Select a target table.</span>
                <button 
                  onClick={handleClearConnectionSelection}
                  className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <CreateTableDialog 
              tables={tables}
              dataFactories={dataFactories}
              projects={projects}
              onTableCreate={handleCreateTable}
            />
            <CreateArchDialog
              tables={tables}
              onArchCreate={handleCreateArch}
            />
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      {(selectedTable || selectedArch) && (
        <DetailsSidebar 
          selectedTable={selectedTable} 
          selectedArch={selectedArch} 
          onClose={handleCloseSidebar} 
        />
      )}
    </div>
  );
};

export default TablesGraph;
