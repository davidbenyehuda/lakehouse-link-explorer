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
