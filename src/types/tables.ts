
export interface Column {
  name: string;
  type: string;
}

export interface Table {
  id: string;
  datafactory_id: string;
  project_id: string;
  source_id: string;
  columns: Column[];
  row_count: number;
  position?: { x: number; y: number };
  size_in_mb: number;
  last_accessed: string;
  query_count: number;
}

export interface BatchStatistics {
  count: number;
  rows: number;
  avgRunTime: number;
  lastCompletedEvent: string;
  avgTimeBetweenEvents: number; // in seconds
}

export type InsertionType = 'insert_stage_0' | 'insert_stage_1' | 'insert_upsert' | 'insert_custom';

export interface ArchDetails {
  id: string;
  source: string;
  target: string;
  sql_query: string;
  events: TableEvent[];
  statistics: BatchStatistics;
  insertion_type: InsertionType;
  primary_key?: string;
  order_by?: string;
  merge_statement?: string;
}

export interface TableEvent {
  id: string;
  timestamp: string;
  event_type: string;
  details: {
    status: string;
    rows_affected?: number;
    duration_seconds?: number;
    success?: boolean;
    [key: string]: any;
  };
}

export interface FilterOptions {
  datafactory_id?: string;
  project_id?: string;
  startDate?: Date;
  endDate?: Date;
}
