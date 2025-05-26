import { MetaDataApi } from '@/types/api';

export class RealMetaDataService implements MetaDataApi {
  private baseUrl = process.env.METADATA_API_URL || 'http://localhost:3001/api';

  async getLabelMappings() {
    const response = await fetch(`${this.baseUrl}/labels`);
    return response.json();
  }

  async getStage1ArchMetadata(source_table_id: string, sink_table_id: string) {
    const response = await fetch(`${this.baseUrl}/stage1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_table_id, sink_table_id })
    });
    return response.json();
  }

  async getUpsertArchMetadata(source_table_id: string, sink_table_id: string) {
    const response = await fetch(`${this.baseUrl}/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_table_id, sink_table_id })
    });
    return response.json();
  }

  async getCustomArchMetadata(source_table_id: string, sink_table_id: string) {
    const response = await fetch(`${this.baseUrl}/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_table_id, sink_table_id })
    });
    return response.json();
  }

  async getTableMetadata(tableId: string) {
    const response = await fetch(`${this.baseUrl}/table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId })
    });
    return response.json();
  }
} 