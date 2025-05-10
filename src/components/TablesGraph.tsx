
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
import '@xyflow/react/dist/style.css'; // Fixed import path for styles

import { Table, ArchDetails, FilterOptions } from '../types/tables';
import TableNode from './TableNode';
import DetailsSidebar from './DetailsSidebar';
import TableSearch from './TableSearch';
import TableFilterBar from './TableFilterBar';

interface TablesGraphProps {
  tables: Table[];
  arches: ArchDetails[];
}

// Custom node types
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const TablesGraph: React.FC<TablesGraphProps> = ({ tables, arches }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedArch, setSelectedArch] = useState<ArchDetails | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  
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

  // Position trees with better separation
  const positionTables = useCallback((tablesToPosition: Table[]) => {
    // Group tables by datafactory and project
    const treeGroups: Record<string, Table[]> = {};
    
    tablesToPosition.forEach(table => {
      const groupKey = `${table.datafactory_id}_${table.project_id}`;
      if (!treeGroups[groupKey]) {
        treeGroups[groupKey] = [];
      }
      treeGroups[groupKey].push(table);
    });
    
    const groupedTables = { ...tablesToPosition };
    let currentX = 50;
    const yStart = 50;
    const horizontalGap = 300;
    const verticalGap = 150;
    const columnWidth = 250;
    
    // Position each tree group with proper spacing
    Object.entries(treeGroups).forEach(([groupKey, tables]) => {
      // Find the raw/source tables (tables that are not targets in any arch)
      const targetIds = new Set(arches.map(arch => arch.target));
      const sourceTables = tables.filter(table => !targetIds.has(table.id) || arches.every(arch => 
        arch.target === table.id && !tables.some(t => t.id === arch.source)
      ));
      
      // Position each source table and its downstream tables
      sourceTables.forEach(sourceTable => {
        // For each source table, start a new column
        let x = currentX;
        let y = yStart;
        
        // Position the source table
        sourceTable.position = { x, y };
        y += verticalGap;
        
        // Function to position downstream tables
        const positionDownstream = (tableId: string, level: number, branchY: number) => {
          const downstreamArches = arches.filter(arch => arch.source === tableId);
          
          downstreamArches.forEach((arch, index) => {
            const targetTable = tables.find(t => t.id === arch.target);
            if (targetTable) {
              targetTable.position = { 
                x: x + (level * columnWidth), 
                y: branchY + (index * verticalGap)
              };
              
              // Position further downstream tables
              positionDownstream(targetTable.id, level + 1, branchY + (index * verticalGap));
            }
          });
        };
        
        // Position all downstream tables for this source
        positionDownstream(sourceTable.id, 1, y);
        
        // Move to the next tree with a gap
        currentX += horizontalGap * 2;
      });
    });
    
    return tablesToPosition;
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
      draggable: !focusedTable, // Only allow dragging when not focused
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
          style: { stroke: archColor, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,  // Increased marker width
            height: 25, // Increased marker height
            color: archColor,
          },
          data: { ...arch }, // Fixed: Now spread arch data into a new object
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
  }, [tables, selectedTable, focusedTable]);
  
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

  return (
    <div className="flex h-screen w-full">
      <div className="flex-grow relative">
        <div className="absolute top-4 left-4 right-4 z-10">
          <TableFilterBar 
            dataFactories={dataFactories}
            projects={projects}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        <div className="absolute bottom-4 left-4 z-10">
          <TableSearch tables={filteredTables} onTableSelect={handleTableSelect} />
        </div>
        
        {focusedTable && (
          <div className="absolute top-20 left-4 z-10">
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
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
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
