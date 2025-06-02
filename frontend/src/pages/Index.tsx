import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { Table, ArchDetails, OperationStatus,ArchEvent, Operation, Event as ApiEvent, AggregatedEvent, OperationType, TableFilter, TableSearch, BasicArc } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import ImportExportButtons from '../components/ImportExportButtons';
import { ServiceFactory } from '../services/ServiceFactory';






const Index = () => {
  
  const [tables, setTables] = useState<Table[]>([]);
  const [arches, setArches] = useState<ArchDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const generateArchesFromData = (operations: Operation[], apiEvents: AggregatedEvent[],datafactoryData: any): ArchDetails[] => {

    const arches: ArchDetails[] = [];
    const archesFromOperations = operations.filter(op => 
      ['insert_stage_1', 'insert_upsert', 'insert_custom'].includes(op.operation_type))
    .map(op => {
        return {
          source_table_source_id: op.source_table_id,
          sink_table_source_id: op.sink_table_id,
          source: ['insert_stage_1'].includes(op.operation_type) ? 'stage_0.'+op.source_table_id : op.source_table_id,
          target: op.sink_table_id,
          insertion_type: op.operation_type as OperationType,
        status: ["hold", "failure"].includes(op.status)? op.status : 'pending' as OperationStatus,
      } 
    }
  );
  const archesFromEvents = apiEvents.filter(op => 
    ['insert_stage_0', 'insert_stage_1', 'insert_upsert', 'insert_custom'].includes(op.operation_type))
    .map(event => {
    if (event.operation_type == 'insert_stage_0') {
      return {
        source_table_source_id: event.source_table_id,
        sink_table_source_id: event.sink_table_id,
        source: datafactoryData[event.source_table_id]?.datafactory_id || '',
        target: 'stage_0.'+event.source_table_id,
        insertion_type: event.operation_type as OperationType,
        status: 'pending' as OperationStatus,
      }
    
    }
    if (event.operation_type == 'insert_stage_1') {
      return {
      source_table_source_id: event.source_table_id,
      sink_table_source_id: event.sink_table_id,
      source: 'stage_0.'+event.source_table_id,
      target: event.sink_table_id,
      insertion_type: event.operation_type as OperationType,
      status: 'pending' as OperationStatus,
    }
  }
  else {
    return {
    source_table_source_id: event.source_table_id,
    sink_table_source_id: event.sink_table_id,
    source: event.source_table_id ,
    target: event.sink_table_id,
    insertion_type: event.operation_type as OperationType,
    status: 'pending' as OperationStatus,
  }
}});
  
    // Create a Set to track unique arches by source and target
  const uniqueArches = new Map<string, ArchDetails>();
    
    // Add arches from operations first
    archesFromOperations.forEach(arch => {
      const key = `${arch.source}-${arch.target}-${arch.insertion_type}`;
      if (!uniqueArches.has(key) || arch.status != 'pending') {
        uniqueArches.set(key, new ArchDetails(
          arch.source_table_source_id,
          arch.sink_table_source_id,
          arch.source,
          arch.target,
          arch.insertion_type,
          arch.status
        ));
      }
    });
  
    // Add arches from events if not already present
    archesFromEvents.forEach(arch => {
      const key = `${arch.source}-${arch.target}-${arch.insertion_type}`;
      if (!uniqueArches.has(key) || arch.status != 'pending') {
        uniqueArches.set(key, new ArchDetails(
          arch.source_table_source_id,
          arch.sink_table_source_id,
          arch.source,
          arch.target,
          arch.insertion_type,
          arch.status
        ));
      }
    });
  
    return Array.from(uniqueArches.values());
  };



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
          const locked = fetchedOperations.some(op => 
            op.sink_table_id === source_id 
            && op.source_table_id === source_id && op.operation_type == 'wait'
          );
          // Calculate total rows and size from sink events only
          const totalRows = sinkEvents.reduce((sum, event) => sum + event.total_rows, 0);
          const last_updated =  sinkEvents.reduce((max_date: Date | null, event) => 
             event.last_updated > max_date ? event.last_updated : max_date, new Date(0));

          const totalSize = sinkEvents.reduce((sum, event) => sum + event.total_size, 0);
          
          return new Table(
            source_id, // table_id
            source_id, // source_id
            labelMappings.sources[source_id] || '', // source_name
            datafactoryData[source_id]?.datafactory_id || '', // datafactory_id
            labelMappings.datafactories[datafactoryData[source_id]?.datafactory_id] || '', // datafactory_name
            projectData[source_id]?.project_id || '', // project_id
            labelMappings.projects[projectData[source_id]?.project_id] || '', // project_name
            labelMappings.table_names[source_id] || '', // table_name
            totalRows, // row_count
            Math.round(totalSize / (1024 * 1024)), // size_in_mb
            last_updated || new Date(0), // last_updated
            [], // columns
           undefined, // position
            0, // query_count
            undefined, // primary_key
            undefined, // ordered_by
            undefined, // partitioned_by
            locked // locked
          );
        });

        const generatedArches = generateArchesFromData(fetchedOperations, fetchedEvents,datafactoryData);

        const stage0tables: Table[] = fetchedEvents.filter(event => 
          event.operation_type == 'insert_stage_0'
        ).map(event => {
          return new Table(
            "stage_0."+event.source_table_id, // table_id
            event.source_table_id, // source_id
            "stage_0."+labelMappings.sources[event.source_table_id] || '', // source_name
            datafactoryData[event.source_table_id]?.datafactory_id || '', // datafactory_id
            labelMappings.datafactories[datafactoryData[event.source_table_id]?.datafactory_id] || '', // datafactory_name
            projectData[event.source_table_id]?.project_id || '', // project_id
            labelMappings.projects[projectData[event.source_table_id]?.project_id] || '', // project_name
            "stage_0."+labelMappings.table_names[event.source_table_id] || '', // table_name
            event.total_rows, // row_count
            event.total_size, // size_in_mb
            event.last_updated || new Date(0), // last_updated
            [], // columns
            undefined, // position
            0, // query_count
            undefined, // primary_key
            undefined, // ordered_by
            undefined, // partitioned_by
            false // locked
          );
        });
        
        const df_ids =  new Set(stage0tables.map(t => t.datafactory_id))
        const DataFactoryTables: Table[] = Array.from(df_ids).map(df_id => {
          return  Table.fromBasicInfo(
            df_id,
            df_id,
            labelMappings.datafactories[df_id] ,
            df_id,
            labelMappings.datafactories[df_id],
            df_id,
            labelMappings.datafactories[df_id],
            labelMappings.datafactories[df_id],
          )
        })

        setTables([...DataFactoryTables,...stage0tables,...fetchedTables]);
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
