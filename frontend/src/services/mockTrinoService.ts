import { TrinoApi, Event, TableFilter, TableSearch } from '../types/api';
import mockEvents from '../mockData/events.json';

class MockTrinoService implements TrinoApi {
  private events: Event[] = mockEvents.events;

  private applyFilters(events: Event[], filters: TableFilter): Event[] {
    return events.filter(event => {
      if (filters.datafactory_id?.length && !filters.datafactory_id.includes(event.datafactory_id)) {
        return false;
      }
      if (filters.project_id?.length && !filters.project_id.includes(event.project_id)) {
        return false;
      }
      if (filters.source_id?.length && !filters.source_id.includes(event.source_table_id)) {
        return false;
      }
      if (filters.operation_type?.length && !filters.operation_type.includes(event.operation_type as any)) {
        return false;
      }
      if (filters.time_range) {
        const eventTime = new Date(event.event_time);
        const startTime = new Date(filters.time_range[0]);
        const endTime = new Date(filters.time_range[1]);
        if (eventTime < startTime || eventTime > endTime) {
          return false;
        }
      }
      return true;
    });
  }

  private applySearch(events: Event[], search: TableSearch): Event[] {
    if (!search.searchTerm) return events;

    return events.filter(event => {
      return search.searchFields.some(field => {
        const value = event[field as keyof Event];
        return value && value.toString().toLowerCase().includes(search.searchTerm.toLowerCase());
      });
    });
  }

  private aggregateEvents(events: Event[]) {
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

    events.forEach(event => {
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

      const agg = aggregationMap.get(key)!;
      agg.total_rows += event.rows_added;
      agg.total_size += event.bytes_added;
      agg.batches_count = Math.max(agg.batches_count, event.batch_id);
      agg.events_count += 1;
    });

    return Array.from(aggregationMap.values());
  }

  async getEventsAggregation(filters: TableFilter, search?: TableSearch) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredEvents = this.events;
    
    // Apply filters
    filteredEvents = this.applyFilters(filteredEvents, filters);
    
    // Apply search if provided
    if (search) {
      filteredEvents = this.applySearch(filteredEvents, search);
    }
    
    // Aggregate the filtered events
    return this.aggregateEvents(filteredEvents);
  }
}

export const mockTrinoService = new MockTrinoService(); 