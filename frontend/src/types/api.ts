import { SOURCE_IDS_TO_COLUMNS } from "@/services/mock/MockData";

// API Interfaces
export interface TableNode {
  source_name: string; // name of the source of the table - e.g ("events-raw", "daily-events-org")
  source_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  datafactory_name: string; // name of the datafactory of the table - e.g ("weather")
  datafactory_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  project_name: string; // name of the project of the table - e.g ("stations")
  project_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
  table_name: string; // name of the table - e.g ("weather__stations.events_raw", "weather__stations.daily_events_org")
}

export interface Event { // should describe changes in a given table from a given operation on a given table
source_table_id: string;
sink_table_id: string;
datafactory_id: string;
operation_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
batch_id: number; // timestamp in nanoseconds
operation_type: string; // insert_stage_0, insert_stage_1, insert_upsert, insert_custom
params_type: string; // batches, time_range
params?: {[key: string]: string | number}; // params of the operation
batches: string[]; // array of batch ids
rows_added: number; // number of rows added
bytes_added: number; // number of bytes added
event_time: Date; // timestamp of the event
}
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



export type OperationType = 'insert_stage_0' | 'insert_stage_1' | 'insert_upsert' | 'insert_custom' | 'wait';
export type OperationStatus = 'pending' | 'in_progress' | 'failure' | 'hold';
export type OperationParamsType = 'batch_ids' | 'time_range';
export interface BasicArc {
id?: string;
source_table_source_id: string;
sink_table_source_id: string;
arch_type: OperationType;
status?: OperationStatus;
}

export interface UpsertArc extends BasicArc {
primary_key: string[];
order_by: string[];
arch_type: 'insert_upsert';
}

export interface CustomArc extends BasicArc {
records_query: string;
statement_type: 'insert' | 'merge';
custom_params?: { [key: string]: string };
arch_type: 'insert_custom';
}

export interface Transformation {
field_name: string;
function_name: string;
params: { name: string; type: string; value: string }[];
transformation_type:  'replace' | 'add';
}


export interface Stage1Arch extends BasicArc {
transformations: Transformation[];
arch_type: 'insert_stage_1';
}
export interface Stage0Arch extends BasicArc {
arch_type: 'insert_stage_0'; 
}



export interface TableColumn {
name: string; // name of the column ('location', 'date', 'temperature', 'humidity', 'wind_speed', 'precipitation')
type: string | TableColumn[] | { [key: string]: TableColumn } | Map<string, TableColumn>; // type of the column ('string', 'int', 'float', 'date', 'boolean', 'array', 'record', 'map')
}










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

  getTableColumns(source_id: string): Promise<TableColumn[]>;



  getStage1ArchMetadata(source_table_id: string, sink_table_id: string): Promise<Stage1Arch>;

  getUpsertArchMetadata(source_table_id: string, sink_table_id: string): Promise<UpsertArc>;

  getCustomArchMetadata(source_table_id: string, sink_table_id: string): Promise<CustomArc>;

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




export interface OperationsManagerApi {
  getActiveOperations(): Promise<{
    operations: Operation[];
  }>;
}

// Additional types for Trino service

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






export class Table {
  constructor(
    public table_id: string,
    public source_id: string,
    public source_name: string,
    public datafactory_id: string,
    public datafactory_name: string,
    public project_id: string,
    public project_name: string,
    public table_name: string,
    public row_count: number,
    public size_in_mb: number,
    public last_updated: Date,
    public columns?: TableColumn[],
    public position?: { x: number; y: number },
    public query_count?: number,
    public primary_key?: string,
    public ordered_by?: string,
    public partitioned_by?: string,
    public locked?: boolean,
    public insertion_type?: OperationType
  ) {}
}

export class TableColumn {
  constructor(
    public name: string,
    public type: string | TableColumn[] | { [key: string]: TableColumn } | Map<string, TableColumn>
  ) {}
}

export interface TableFilter {
  datafactory_id?: string[];
  project_id?: string[];
  source_id?: string[];
  sink_id?: string[];
  operation_type?: OperationType[];
  time_range?: [Date, Date];
  params_type?: OperationParamsType[];
  operation_status?: OperationStatus[];
  locked?: boolean;
}

export interface TableSearch {
  searchTerm: string;
  searchFields: ('source_id' | 'project_id' | 'datafactory_id')[];
}

export interface TrinoApi {
  getEventsAggregation(filters?: TableFilter, search?: TableSearch): Promise<Array<AggregatedEvent>>;
  getAllEvents(): Promise<{ events: Event[] }>;
  getEvents(filters?: TableFilter, search?: TableSearch): Promise<Array<Event>>;
  getTableColumns(table_full_name: string): Promise<TableColumn[]>;
}
export interface ArchEvent {
  timestamp: Date;
  rows_affected: number;
  duration_ms: number; // Made required as per linter error for DetailsSidebar
}





export class ArchDetails {
  constructor(
    public source_table_source_id: string,
    public sink_table_source_id: string,
    public source: string,
    public target: string,
    public insertion_type: OperationType,
    public status?: OperationStatus,
    public id?: string,
    public events?: ArchEvent[],
    public primary_key?: string,
    public order_by?: string,
    public merge_statement?: string,
    public sql_query?: string,
    public transformations?: Transformation[]
  ) {}
  
  is_active(): boolean {
    return ['pending', 'in_progress'].includes(this.status);
  }

  get_id(): string {
    return this.id || `${this.source}-${this.target}-${this.insertion_type}`;
  }
}


export interface FilterOptions {
  datafactory_id?: string;
  project_id?: string;
  startDate?: Date;
  endDate?: Date;
  tableId?: string;
}
