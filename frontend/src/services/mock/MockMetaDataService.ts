import { MetaDataApi } from '@/types/api';
import mockData from '../../mockData/tables.json';
import archMetadata from '../../mockData/arch_metadata.json';

export class MockMetaDataService implements MetaDataApi {
  async getLabelMappings() {
    // Create sources mapping from tables data
    const sources = mockData.tables.reduce((acc, table) => {
      if (!acc[table.source_id]) {
        acc[table.source_id] = table.source_name;
      }
      return acc;
    }, {} as { [id: string]: string });

    return {
      ...mockData.mappings,
      sources
    };
  }

  async getStage1ArchMetadata(source_table_id: string, sink_table_id: string) {
    const key = `${source_table_id}_${sink_table_id}`.replace(/-/g, '_');
    return archMetadata.stage1_metadata[key] || {
      source_table_id,
      sink_table_id,
      operation_type: 'insert_stage_1' as const,
      transformations: {}
    };
  }

  async getUpsertArchMetadata(source_table_id: string, sink_table_id: string) {
    const key = `${source_table_id}_${sink_table_id}`.replace(/-/g, '_');
    return archMetadata.upsert_metadata[key] || {
      source_table_id,
      sink_table_id,
      operation_type: 'insert_upsert' as const,
      primary_key: ['id'],
      order_by: ['created_at']
    };
  }

  async getCustomArchMetadata(source_table_id: string, sink_table_id: string) {
    const key = `${source_table_id}_${sink_table_id}`.replace(/-/g, '_');
    return archMetadata.custom_metadata[key] || {
      source_table_id,
      sink_table_id,
      operation_type: 'insert_custom' as const,
      records_query: 'SELECT * FROM source_table',
      statement_type: 'insert' as const,
      custom_params: {}
    };
  }

  async getTableMetadata(source_table_id: string) {
    // Implementation using mock data
    return {
      full_name: mockData.tables.find(t => t.source_id === source_table_id)?.table_full_name || ''
    };
  }
} 