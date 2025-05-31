import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { Table, ArchDetails, ArchEvent, Operation, Event as ApiEvent,AggregatedEvent, OperationType, TableFilter, TableSearch } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import ImportExportButtons from '../components/ImportExportButtons';
import { ServiceFactory } from '../services/ServiceFactory';

const generateArchesFromData = (operations: Operation[], apiEvents: AggregatedEvent[]): ArchDetails[] => {
  return operations.map(op => {
    const relatedArchEvents: ArchEvent[] = apiEvents
      .filter(apiEvent =>
        apiEvent.source_table_id === op.source_table_id &&
        apiEvent.sink_table_id === op.sink_table_id &&
        apiEvent.datafactory_id === op.datafactory_id &&
        apiEvent.operation_type === op.operation_type
      )
      .map(apiEvent => ({
        timestamp: new Date(apiEvent.event_time),
        rows_affected: apiEvent.rows_added,
        duration_ms: 0,
      }));

    return {
      id: archId,
      source: op.source_table_id,
      target: op.sink_table_id,
      insertion_type: op.operation_type as OperationType,
      events: relatedArchEvents,
      operation: op,
    };
  });
};

const Index = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [arches, setArches] = useState<ArchDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const metaDataService = ServiceFactory.createMetaDataService();
        const operationsManagerService = ServiceFactory.createOperationsManagerService();
        const trinoService = ServiceFactory.createTrinoService();

        // Get operations and events first
        const operationsResponse = await operationsManagerService.getActiveOperations();
        const filters: TableFilter = {}; // Add appropriate filter values
        const search: TableSearch = { searchTerm: '', searchFields: [] }; // Add appropriate search values if needed
        const events = await trinoService.getEventsAggregation(filters, search);
        const labelMappings = await metaDataService.getLabelMappings();

        const fetchedOperations = operationsResponse.operations;
        const fetchedEvents = events;

        // Extract unique table IDs from operations and events
        const tableIds = new Set<string>();
        fetchedOperations.forEach(op => {
          tableIds.add(op.source_table_id);
          tableIds.add(op.sink_table_id);
        });
        fetchedEvents.forEach(event => {
          tableIds.add(event.source_table_id);
          tableIds.add(event.sink_table_id);
        });

        // Get all project and datafactory IDs in one batch
        const tableIdsArray = Array.from(tableIds);
        const projectData = await metaDataService.getProjectIDs(tableIdsArray);
        const datafactoryData = await metaDataService.getDatafactoryIDs(tableIdsArray);

        // Create table objects from the IDs using label mappings
        const fetchedTables: Table[] = tableIdsArray.map(source_id => {
          // Find events where this table is the sink
          const sinkEvents = fetchedEvents.filter(event => 
            event.sink_table_id === source_id && event.operation_type != 'insert_stage_0'
          );
          
          // Calculate total rows and size from sink events only
          const totalRows = sinkEvents.reduce((sum, event) => sum + event.total_rows, 0);
          const last_updated =  sinkEvents.reduce((max_date: Date | null, event) => 
             event.last_updated > max_date ? event.last_updated : max_date, new Date(0));

          const totalSize = sinkEvents.reduce((sum, event) => sum + event.total_size, 0);
          
          return {
            source_id,
            source_name: labelMappings.sources[source_id] || source_id,
            datafactory_id: datafactoryData[source_id]?.datafactory_id || '',
            project_id: projectData[source_id]?.project_id || '',
            row_count: totalRows,
            size_in_mb: Math.round(totalSize / (1024 * 1024)), // Convert bytes to MB
            columns: [],
            position: { x: 0, y: 0 },
            query_count: 0,
            datafactory_name:  labelMappings.datafactories[datafactoryData[source_id]?.datafactory_id] || '',
            project_name: labelMappings.projects[projectData[source_id]?.project_id] || '',
            table_name: labelMappings.table_names[source_id] || '',
            last_updated: last_updated || new Date(0),
          };
        });

        const generatedArches = generateArchesFromData(fetchedOperations, fetchedEvents);

        setTables(fetchedTables);
        setArches(generatedArches);

        toast({
          title: "Data Loaded from Operations and Events",
          description: "Displaying data derived from operations and events."
        });
      } catch (error) {
        console.error("Error loading data from mock services:", error);
        setTables([]);
        setArches([]);
        toast({
          title: "Error Loading Data",
          description: "There was an issue loading data from mock services.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleAddTable = useCallback((newTable: Table, newArch?: ArchDetails) => {
    setTables(prev => [...prev, newTable]);
    if (newArch) {
      setArches(prev => [...prev, newArch]);
    }
    toast({
      title: "Table Created (In Memory)",
      description: `New table "${newTable.source_name}" has been added to the view.`
    });
  }, [toast]);

  const handleAddArch = useCallback((newArch: ArchDetails) => {
    setArches(prev => [...prev, newArch]);
    toast({
      title: "Connection Created (In Memory)",
      description: `New connection from "${newArch.source}" to "${newArch.target}" has been added to the view.`
    });
  }, [toast]);

  const handleImport = useCallback((importedTables: Table[], importedArches: ArchDetails[]) => {
    setTables(importedTables);
    setArches(importedArches);
    toast({
      title: "Data Imported",
      description: "Data has been imported successfully."
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-graph-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Tables-Tree</h2>
          <p className="text-gray-600">Fetching data from mock services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-graph-background flex flex-col">
      <header className="bg-white z-10 p-4 border-b shadow-sm">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-graph-text">Tables-Tree</h1>
              <ImportExportButtons
                tables={tables}
                arches={arches}
                onImport={handleImport}
              />
            </div>
            <p className="text-gray-600">Visualizing table relationships (data from mock services)</p>
          </div>
        </div>
      </header>

      <div className="flex-grow relative overflow-hidden">
        <ReactFlowProvider>
          <TablesGraph
            tables={tables}
            arches={arches}
            onAddTable={handleAddTable}
            onAddArch={handleAddArch}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Index;
