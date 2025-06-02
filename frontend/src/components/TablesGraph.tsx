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

import { Table, OperationType, OperationParamsType, ArchDetails, MetaDataApi, TrinoApi, FilterOptions } from '@/types/api';
import TableNode from './TableNode';
import DetailsSidebar from './DetailsSidebar';
import TableSearch from './TableSearch';
import { useToast } from '@/hooks/use-toast';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { ServiceFactory } from '@/services/ServiceFactory';
import { TableMappings, applyTableFilters, applyArchFilters, LayoutConfig, ContainerSize, positionTables, getArchColor, TablesGraphProps } from '@/utils/tableGraphUtils';


const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const metadataService: MetaDataApi = ServiceFactory.createMetaDataService();
const trinoService: TrinoApi = ServiceFactory.createTrinoService();

const TablesGraph: React.FC<TablesGraphProps> = ({
  tables,
  arches,
  tableMappings,
  currentFilters
}) => {

  const layoutConfig: LayoutConfig = useMemo(() => ({
    horizontalSpacing: 0.15,
    verticalSpacing: 0.2,
    startX: 0.1,
    startY: 0.1,
    maxWidth: 0.8,
    maxHeight: 0.8,
  }), []);

  const containerSize: ContainerSize = useMemo(() => ({ width: 2000, height: 1500 }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedArch, setSelectedArch] = useState<ArchDetails | null>(null);
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  const initialFitDone = useRef(false);

  const QueryEventLimit = import.meta.env.QueryEventLimit || 200;
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  const filteredTables = useMemo(() => {
    return applyTableFilters(tables, arches, currentFilters, focusedTable, tableMappings);
  }, [tables, arches, currentFilters, focusedTable, tableMappings]);

  const filteredArchIds = useMemo(() => {
    return applyArchFilters(arches, filteredTables, currentFilters);
  }, [arches, filteredTables, currentFilters]);

  const initializeGraph = useCallback(() => {
    console.log("Filtered tables for graph:", filteredTables);
    const tablesToRender = positionTables([...filteredTables], arches, layoutConfig, containerSize);

    const initialNodes: Node[] = tablesToRender.map((table) => ({
      id: table.table_id,
      type: 'tableNode',
      data: { table, isFocused: focusedTable === table.table_id, isLocked: table.locked },
      position: table.position || { x: Math.random() * 500, y: Math.random() * 500 },
      draggable: true,
    }));

    const archIdsToRenderSet = new Set(filteredArchIds);
    const initialEdges: Edge[] = arches
      .filter(arch => archIdsToRenderSet.has(arch.get_id()))
      .map((arch) => {
        const archColor = getArchColor(arch.insertion_type, arch.status);
        return {
          id: arch.get_id(),
          source: arch.source,
          target: arch.target,
          animated: arch.is_active() || false,
          style: { stroke: archColor, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, width: arch.status === 'failure' ? 25 : 15, height: arch.status === 'failure' ? 25 : 15, color: archColor },
          data: { ...arch },
          selectable: true,
          interactionWidth: 20,
        };
      });

    setNodes(initialNodes);
    setEdges(initialEdges);

    if (selectedTable && !tablesToRender.some(t => t.table_id === selectedTable.table_id)) {
      setSelectedTable(null);
    }
    if (selectedArch && !archIdsToRenderSet.has(selectedArch.get_id())) {
      setSelectedArch(null);
    }
  }, [
    filteredTables,
    arches,
    filteredArchIds,
    focusedTable,
    selectedTable,
    selectedArch,
    layoutConfig,
    containerSize,
  ]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        console.log("Attempting to fit view. Nodes:", nodes.length, "Edges:", edges.length);
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, reactFlowInstance]);

  const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const arch = arches.find((a) => a.get_id() === edge.id);
    if (arch) {
      try {
        const startDateToUse = currentFilters.startDate;
        const endDateToUse = currentFilters.endDate;
        if (!arch.events || arch.events.length === 0 || arch.events_date_range?.start !== startDateToUse || arch.events_date_range?.end !== endDateToUse) {
          const eventsData = await trinoService.getEvents({
            source_id: [arch.source_table_source_id],
            sink_id: [arch.sink_table_source_id],
            operation_type: [arch.insertion_type],
            startDate: startDateToUse,
            endDate: endDateToUse,
          }, undefined, QueryEventLimit);
          arch.events = eventsData.map(ev => ({
            timestamp: ev.event_time ? new Date(ev.event_time) : new Date(),
            params_type: ev.params_type as OperationParamsType,
            batch_id: String(ev.batch_id),
            batches: ev.batches,
            rows_affected: ev.rows_added,
            duration_ms: (ev.finished_time && ev.start_time) ? new Date(ev.finished_time).getTime() - new Date(ev.start_time).getTime() : 0,
            bytes_added: ev.bytes_added
          }));
          arch.events_date_range = { start: startDateToUse, end: endDateToUse };
          const archmetadata = await metadataService.getArchMetadata(arch.source_table_source_id, arch.sink_table_source_id, arch.insertion_type, arch.merge_statement);
          arch.add_metadata(archmetadata);
        }
        setSelectedArch(arch);
        setSelectedTable(null);
      } catch (error) {
        console.error('Error fetching arch events:', error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch connection events" });
      }
    }
  }, [arches, toast, currentFilters.startDate, currentFilters.endDate, QueryEventLimit]);

  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    const table = tables.find((t) => t.table_id === node.id);
    if (table) {
      try {
        if (!table.columns || table.columns.length === 0) {
          const columns = await metadataService.getTableColumns(table.source_id);
          table.columns = columns;
        }
        setSelectedTable(prevSelected => prevSelected?.table_id === table.table_id && prevSelected !== table ? table : (prevSelected?.table_id === table.table_id ? prevSelected : table));
        setSelectedArch(null);
        const clickTimestamp = new Date().getTime();
        const lastClick = (table as any).lastClickTime || 0;
        if (selectedTable?.table_id === table.table_id && clickTimestamp - lastClick < 300) {
          setFocusedTable(focusedTable === table.table_id ? null : table.table_id);
        }
        (table as any).lastClickTime = clickTimestamp;
      } catch (error) {
        console.error('Error fetching table columns:', error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch table columns" });
      }
    }
  }, [tables, selectedTable, focusedTable, toast]);

  const handleCloseSidebar = () => {
    setSelectedTable(null);
    setSelectedArch(null);
  };

  const handleTableSelect = (tableId: string) => {
    const table = tables.find((t) => t.table_id === tableId);
    if (table) {
      setSelectedTable(table);
      setSelectedArch(null);
      const nodeToFocus = nodes.find((n) => n.id === tableId);
      if (nodeToFocus && reactFlowInstance) {
        const x = nodeToFocus.position?.x ?? 0;
        const y = nodeToFocus.position?.y ?? 0;
        reactFlowInstance.setCenter(x + (nodeToFocus.width ?? 180) / 2, y + (nodeToFocus.height ?? 50) / 2, { zoom: 1.2, duration: 600 });
      }
    }
  };

  const handleResetFocus = () => setFocusedTable(null);

  return (
    <div className="flex h-full w-full flex-col bg-gray-50">
      <div className="flex-grow relative">
        {focusedTable && (
          <div className="absolute top-3 left-4 z-10">
            <button
              onClick={handleResetFocus}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm shadow flex items-center gap-1.5"
            >
              <span>Exit Focus Mode on "{tables.find(t => t.table_id === focusedTable)?.table_name}"</span>
            </button>
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className="h-full">
          {(selectedTable || selectedArch) && (
            <>
              <ResizablePanel id="details-panel" defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full overflow-auto bg-white border-r p-1">
                  <DetailsSidebar selectedTable={selectedTable} selectedArch={selectedArch} onClose={handleCloseSidebar} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel id="graph-panel" defaultSize={(selectedTable || selectedArch) ? 70 : 100}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
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
              <Panel position="top-left" className="m-2">
                <TableSearch tables={filteredTables} onTableSelect={handleTableSelect} />
              </Panel>
            </ReactFlow>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default TablesGraph;
