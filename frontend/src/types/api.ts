// API Interfaces

export interface Transformation {
  field_name: string;
  function_name: string;
  params: { name: string; type: string; value: string }[];
  transformation_type: 'replace' | 'add';
}

export interface MetaDataApi {
  getLabelMappings(): Promise<{
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
    table_names: { [id: string]: string };
  }>;

  getStage1ArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_stage_1';
    transformations: Transformation[];
  }>;


  getUpsertArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_upsert';
    primary_key: string[];
    order_by: string[];
  }>;

  getCustomArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_custom';
    records_query: string;
    statement_type: 'insert' | 'merge';
    custom_params: { [key: string]: string };
  }>;

  getProjectIDs(source_ids: string[]): Promise<{
    [source_id: string]: {
      project_id: string;
      // other metadata
    }
  }>;

  getDatafactoryIDs(source_ids: string[]): Promise<{
    [source_id: string]: {
      datafactory_id: string;
      // other metadata
    }
  }>;


}
export type OperationType = 'insert_stage_0' | 'insert_stage_1' | 'insert_upsert' | 'insert_custom' | 'wait';
export type OperationStatus = 'pending' | 'in_progress' | 'failure' | 'hold';
export type OperationParamsType = 'batch_ids' | 'time_range';

export interface Operation {
  source_table_id: string;
  sink_table_id: string;
  datafactory_id: string;
  operation_type: OperationType;
  is_running: boolean;
  status: OperationStatus;
  params_type: OperationParamsType;
  created_at: Date;
  last_update_time: Date;
}

export interface OperationsManagerApi {
  getActiveOperations(): Promise<{
    operations: Operation[];
  }>;
}

// Additional types for Trino service
export interface Event { // should describe changes in a given table from a given operation on a given table
  source_table_id: string;
  sink_table_id: string;
  datafactory_id: string;
  operation_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  batch_id: number; // timestamp in nanoseconds
  operation_type: string; // insert_stage_0, insert_stage_1, insert_upsert, insert_custom
  params_type: string; // batches, time_range
  params: (string | number)[]; // array of strings or numbers
  rows_added: number; // number of rows added
  bytes_added: number; // number of bytes added
  event_time: Date; // timestamp of the event
}


export interface AggregatedEvent { // should describe changes in a given table from a given operation on a given table
  source_table_id: string;
    sink_table_id: string;
    datafactory_id: string;
    operation_type: string;
    params_type: string;
    total_rows: number;
    total_size: number;
    batches_count: number;
    events_count: number;
    last_updated: Date;
}






export interface Table {
  source_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  source_name: string; // name of the source of the table - e.g ("events-raw", "daily-events-org")
  datafactory_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  datafactory_name: string; // name of the datafactory of the table - e.g ("weather")
  project_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  project_name: string; // name of the project of the table - e.g ("stations")
  table_name: string; // name of the table - e.g ("weather__stations.events_raw", "weather__stations.daily_events_org")
  row_count: number; // number of rows in the table
  size_in_mb: number; // size of the table in mb
  last_updated: Date; // last updated timestamp of the table
  columns?: TableColumn[]; // columns of the table
  position?: { x: number; y: number }; // position of the table in the graph
  query_count?: number;
  primary_key?: string;
  ordered_by?: string;
  partitioned_by?: string;
}

export interface TableColumn {
  name: string; // name of the column ('location', 'date', 'temperature', 'humidity', 'wind_speed', 'precipitation')
  type: string | TableColumn[] | { [key: string]: TableColumn } | Map<string, TableColumn>; // type of the column ('string', 'int', 'float', 'date', 'boolean', 'array', 'record', 'map')
}

export interface TableFilter {
  datafactory_id?: string[];
  project_id?: string[];
  source_id?: string[];
  operation_type?: OperationType[];
  time_range?: [Date, Date];
  params_type?: OperationParamsType[];
  operation_status?: OperationStatus[];
}

export interface TableSearch {
  searchTerm: string;
  searchFields: ('source_id' | 'project_id' | 'datafactory_id')[];
}

export interface TrinoApi {
  getEventsAggregation(filters?: TableFilter, search?: TableSearch): Promise<Array<AggregatedEvent>>;
  getAllEvents(): Promise<{ events: Event[] }>;
}
export interface ArchEvent {
  timestamp: Date;
  rows_affected: number;
  duration_ms: number; // Made required as per linter error for DetailsSidebar
}

export interface ArchDetails {
  id: string;
  source: string;
  target: string;
  insertion_type: OperationType;
  events: ArchEvent[];
  primary_key?: string;
  order_by?: string;
  merge_statement?: string;
  sql_query?: string;
  operation: Operation;
}


export interface FilterOptions {
  datafactory_id?: string;
  project_id?: string;
  startDate?: Date;
  endDate?: Date;
  tableId?: string;
}
