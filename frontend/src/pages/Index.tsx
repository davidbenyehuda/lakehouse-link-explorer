import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { Table, ArchDetails, ArchEvent, Operation, Event as ApiEvent, OperationType } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import ImportExportButtons from '../components/ImportExportButtons';
import { ServiceFactory } from '../services/ServiceFactory';

const generateArchesFromData = (operations: Operation[], apiEvents: ApiEvent[]): ArchDetails[] => {
  return operations.map(op => {
    const archId = `${op.datafactory_id}-${op.source_table_id}-${op.sink_table_id}-${op.operation_type}-${op.created_at.toISOString()}`;
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

        const tablesResponse = await metaDataService.getAllTables();
        const operationsResponse = await operationsManagerService.getActiveOperations();
        const eventsResponse = await (trinoService as any).getAllEvents();

        const fetchedTables = tablesResponse.tables;
        const fetchedOperations = operationsResponse.operations;
        const fetchedEvents = eventsResponse.events;

        const generatedArches = generateArchesFromData(fetchedOperations, fetchedEvents);

        setTables(fetchedTables);
        setArches(generatedArches);

        toast({
          title: "Data Loaded from Mock Services",
          description: "Displaying data fetched via mock API services."
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
