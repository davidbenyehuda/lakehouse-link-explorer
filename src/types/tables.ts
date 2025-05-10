
export interface Table {
  id: string;
  source_id: string;
  datafactory_id: string;
  project_id: string;
  row_count: number;
  size_in_mb: number;
  columns?: TableColumn[];
  position?: { x: number; y: number };
}

export interface TableColumn {
  name: string;
  type: string;
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
}

export interface FilterOptions {
  datafactory_id?: string;
  project_id?: string;
  startDate?: Date;
  endDate?: Date;
  tableId?: string;
}
