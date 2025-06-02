import { TrinoApi, TableFilter, TableSearch, Event as ApiEvent, AggregatedEvent, TableColumn } from '@/types/api';
import { MOCK_EVENTS, SOURCE_IDS_TO_COLUMNS, mockTables } from './MockData';
import { max } from 'date-fns';

export class MockTrinoService implements TrinoApi {
  async getEventsAggregation(
    filters?: TableFilter,
    search?: TableSearch
  ): Promise<Array<AggregatedEvent>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredEvents = [...MOCK_EVENTS];

    // Apply filters
    if (filters.datafactory_id?.length) {
      filteredEvents = filteredEvents.filter(event => filters.datafactory_id?.includes(event.datafactory_id));
    }
    if (filters.project_id?.length) {
      // ApiEvent doesn't have project_id directly. This filter would need modification or data enrichment.
      // For now, this filter will not apply unless project_id is added to ApiEvent or mapped.
    }
    if (filters.source_id?.length) {
      // ApiEvent has source_table_id and sink_table_id. Assuming filters.source_id refers to either.
      filteredEvents = filteredEvents.filter(event =>
        filters.source_id?.includes(event.source_table_id) ||
        filters.source_id?.includes(event.sink_table_id)
      );
    }
    if (filters.operation_type?.length) {
      filteredEvents = filteredEvents.filter(event => filters.operation_type?.includes(event.operation_type as any));
    }
    if (filters.time_range && filters.time_range[0] && filters.time_range[1]) {
      const startTime = new Date(filters.time_range[0]).getTime();
      const endTime = new Date(filters.time_range[1]).getTime();
      filteredEvents = filteredEvents.filter(event => {
        const eventTime = new Date(event.event_time).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }
    if (filters.params_type?.length) {
      filteredEvents = filteredEvents.filter(event => filters.params_type?.includes(event.params_type as any));
    }
    if (filters.operation_status?.length) {
      // ApiEvent doesn't have operation_status directly. This filter would need data enrichment.
    }

    // Apply search (simplified search on a few fields)
    if (search?.searchTerm && search.searchFields.length > 0) {
      const term = search.searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        return search.searchFields.some(field => {
          if (field === 'source_id') { // Assuming searchField 'source_id' maps to table ids
            return event.source_table_id.toLowerCase().includes(term) || event.sink_table_id.toLowerCase().includes(term);
          }
          if (field === 'datafactory_id') {
            return event.datafactory_id.toLowerCase().includes(term);
          }
          // ApiEvent doesn't have project_id directly for search.
          return false;
        });
      });
    }

    // Perform aggregation
    const aggregationMap = new Map<string, any>();
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
          batches_count: 0, // This would require distinct batch_id logic
          events_count: 0,
          batch_ids_set: new Set<number>(), // To count distinct batches
          last_updated: event.event_time,
        });
      }
      const agg = aggregationMap.get(key);
      agg.total_rows += event.rows_added;
      agg.total_size += event.bytes_added;
      agg.events_count += 1;
      agg.batch_ids_set.add(event.batch_id);
      agg.last_updated = event.event_time > agg.last_updated ? event.event_time : agg.last_updated;
    });

    const result = Array.from(aggregationMap.values()).map(agg => {
      agg.batches_count = agg.batch_ids_set.size;
      delete agg.batch_ids_set; // Clean up temporary set
      return agg;
    });

    return Promise.resolve(result);
  }

  // Added method to get all raw events
  async getAllEvents(): Promise<{ events: ApiEvent[] }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve( { events: MOCK_EVENTS } );
  }


  async getEvents(filters?: TableFilter, search?: TableSearch,limit?: number): Promise<Array<ApiEvent>> {
    await new Promise(resolve => setTimeout(resolve, 100))
    let filteredEvents = [...MOCK_EVENTS];
    if (filters?.datafactory_id?.length) {
      filteredEvents = filteredEvents.filter(event => filters.datafactory_id?.includes(event.datafactory_id));
    }
    if (filters?.source_id?.length) {
      filteredEvents = filteredEvents.filter(event => filters.source_id?.includes(event.source_table_id));
    }
    if (filters?.sink_id?.length) {
      filteredEvents = filteredEvents.filter(event => filters.sink_id?.includes(event.sink_table_id));
    }
    if (filters?.operation_type?.length) {
      filteredEvents = filteredEvents.filter(event => filters.operation_type?.includes(event.operation_type as any));
    }
    if (filters?.time_range && filters.time_range[0] && filters.time_range[1]) {
      const startTime = new Date(filters.time_range[0]).getTime();
      const endTime = new Date(filters.time_range[1]).getTime();
      filteredEvents = filteredEvents.filter(event => {
        const eventTime = new Date(event.event_time).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }
    if (limit) {
      filteredEvents = filteredEvents.slice(0, limit);
    }
    return Promise.resolve(filteredEvents);
  }
  async getTableColumns(table_full_name: string): Promise<TableColumn[]>
  {
    await new Promise(resolve => setTimeout(resolve, 100));
    const table = mockTables.find(t => t.table_name === table_full_name);
    return Promise.resolve(SOURCE_IDS_TO_COLUMNS[table?.source_id]);
  }

} 