// API Interfaces
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
    transformations: any;
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

export interface OperationsManagerApi {
  getActiveOperations(): Promise<{
    operations: Array<{
      source_table_id: string;
      sink_table_id: string;
      datafactory_id: string;
      operation_type: string;
      is_running: boolean;
      status: 'pending' | 'in_progress' | 'failure' | 'hold';
      params_type: 'batches' | 'time_range';
    }>;
  }>;
}

// Additional types for Trino service
export interface Event {
  source_table_id: string;
  sink_table_id: string;
  datafactory_id: string;
  project_id: string;
  operation_id: string;
  batch_id: number;
  operation_type: string;
  params_type: string;
  params: (string | number)[];
  rows_added: number;
  bytes_added: number;
  event_time: string;
}

export interface TableFilter {
  datafactory_id?: string[];
  project_id?: string[];
  source_id?: string[];
  operation_type?: ('insert_stage_0' | 'insert_stage_1' | 'insert_upsert' | 'insert_custom')[];
  time_range?: [string, string];
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