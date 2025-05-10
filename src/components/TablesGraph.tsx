
import React, { useState, useCallback, useEffect } from 'react';
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

import { Table, ArchDetails } from '../types/tables';
import TableNode from './TableNode';
import DetailsSidebar from './DetailsSidebar';
import TableSearch from './TableSearch';

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
  
  const reactFlowInstance = useReactFlow();

  // Convert tables to nodes
  const initializeGraph = useCallback(() => {
    const initialNodes: Node[] = tables.map((table) => ({
      id: table.id,
      type: 'tableNode',
      data: { table },
      position: table.position || { x: 0, y: 0 },
    }));

    // Convert arches to edges
    const initialEdges: Edge[] = arches.map((arch) => {
      const archColor = getArchColor(arch.insertion_type);
      
      return {
        id: arch.id,
        source: arch.source,
        target: arch.target,
        animated: false,
        style: { stroke: archColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: archColor,
        },
        data: { ...arch }, // Fixed: Now spread arch data into a new object
      };
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [tables, arches, setNodes, setEdges]);
  
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
    }
  }, [tables]);
  
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

  return (
    <div className="flex h-screen w-full">
      <div className="flex-grow relative">
        <TableSearch tables={tables} onTableSelect={handleTableSelect} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
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
