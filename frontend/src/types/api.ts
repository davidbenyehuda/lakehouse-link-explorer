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

  getTableMetadata(tableId: string): Promise<{
    full_name: string;
    // other metadata
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

export interface Table {
  source_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  source_name: string; // name of the source of the table - e.g ("weather-events", "daily-weather-events","latest-weather-events")
  datafactory_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  project_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  row_count: number; // number of rows in the table
  size_in_mb: number; // size of the table in mb
  columns?: TableColumn[]; // columns of the table
  position?: { x: number; y: number }; // position of the table in the graph
  query_count?: number;
  insertion_type?: string;
  primary_key?: string;
  order_by?: string;
  merge_statement?: string;
  sql_query?: string;
}

export interface TableColumn {
  name: string; // name of the column ('location', 'date', 'temperature', 'humidity', 'wind_speed', 'precipitation')
  type: string; // type of the column ('string', 'int', 'float', 'date', 'boolean', 'array', 'record', 'map')
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
  getEventsAggregation(filters: TableFilter, search?: TableSearch): Promise<Array<{
    source_table_id: string;
    sink_table_id: string;
    datafactory_id: string;
    operation_type: string;
    params_type: string;
    total_rows: number;
    total_size: number;
    batches_count: number;
    events_count: number;
  }>>;
} 
