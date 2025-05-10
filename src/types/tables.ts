
export interface Table {
  id: string;
  source_id: string;
  datafactory_id: string;
  project_id: string;
  row_count: number;
  size_in_mb: number;
  columns?: TableColumn[];
  position?: { x: number; y: number };
  last_accessed?: Date;
  query_count?: number;
}

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableEvent {
  id?: string;
  event_type: string;
  timestamp: Date;
  details: {
    status: string;
    rows_affected?: number;
    duration_seconds?: number;
    success?: boolean;
  };
}

export interface ArchEvent {
  timestamp: Date;
  rows_affected: number;
  duration_ms: number;
}

export interface ArchDetails {
  id: string;
  source: string;
  target: string;
  insertion_type: string;
  events: ArchEvent[];
  avg_time_between_events_ms?: number;
  last_completed_time?: Date;
  primary_key?: string;
  order_by?: string;
  merge_statement?: string;
  sql_query?: string;
  statistics?: {
    count: number;
    rows: number;
    avgRunTime: number;
    lastCompletedEvent: string;
    avgTimeBetweenEvents: number;
  };
}

export interface FilterOptions {
  datafactory_id?: string;
  project_id?: string;
  startDate?: Date;
  endDate?: Date;
  tableId?: string;
}
