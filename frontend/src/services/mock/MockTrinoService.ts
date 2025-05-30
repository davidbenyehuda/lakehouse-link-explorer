import { TableFilter, TableSearch, TrinoApi } from '@/types/api';
import mockEvents from '../../mockData/events.json';

export class MockTrinoService implements TrinoApi {
  async getEventsAggregation(filters: TableFilter, search?: TableSearch) {
    // First filter the events based on provided filters
    let filteredEvents = mockEvents.events.filter(event => {
      // Apply datafactory_id filter
      if (filters.datafactory_id?.length && !filters.datafactory_id.includes(event.datafactory_id)) {
        return false;
      }

      // Apply project_id filter
      if (filters.project_id?.length && !filters.project_id.includes(event.project_id)) {
        return false;
      }

      // Apply source_id filter
      if (filters.source_id?.length && !filters.source_id.includes(event.source_table_id)) {
        return false;
      }

      // Apply operation_type filter
      if (filters.operation_type?.length && !filters.operation_type.includes(event.operation_type as any)) {
        return false;
      }

      // Apply time_range filter
      if (filters.time_range) {
        const eventTime = new Date(event.event_time).getTime();
        const startTime = new Date(filters.time_range[0]).getTime();
        const endTime = new Date(filters.time_range[1]).getTime();
        if (eventTime < startTime || eventTime > endTime) {
          return false;
        }
      }

      // Apply search if provided
      if (search) {
        const searchTerm = search.searchTerm.toLowerCase();
        return search.searchFields.some(field => {
          switch (field) {
            case 'source_id':
              return event.source_table_id.toLowerCase().includes(searchTerm);
            case 'project_id':
              return event.project_id.toLowerCase().includes(searchTerm);
            case 'datafactory_id':
              return event.datafactory_id.toLowerCase().includes(searchTerm);
            default:
              return false;
          }
        });
      }

      return true;
    });

    // Group and aggregate the filtered events
    const aggregationMap = new Map<string, {
      source_table_id: string;
      sink_table_id: string;
      datafactory_id: string;
      operation_type: string;
      params_type: string;
      total_rows: number;
      total_size: number;
      batches_count: number;
      events_count: number;
    }>();

    filteredEvents.forEach(event => {
      const key = `${event.source_table_id}-${event.sink_table_id}-${event.datafactory_id}-${event.operation_type}-${event.params_type}`;
      
      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          source_table_id: event.source_table_id,
          sink_table_id: event.sink_table_id,
          datafactory_id: event.datafactory_id,
          operation_type: event.operation_type,
          params_type: event.params_type,
          total_rows: 0,
          total_size: 0,
          batches_count: 0,
          events_count: 0
        });
      }

      const aggregation = aggregationMap.get(key)!;
      aggregation.total_rows += event.rows_added;
      aggregation.total_size += event.bytes_added;
      aggregation.batches_count += 1;
      aggregation.events_count += 1;
    });

    return Array.from(aggregationMap.values());
  }
} 