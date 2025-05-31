import { MetaDataApi, Table, Transformation, OperationType } from '@/types/api';
import {
  mockTables,
  mockStage1ArchData,
  mockUpsertArchData,
  mockCustomArchData,
  // Assuming mockLabelMappings would be added to MockData.ts if needed
} from './MockData';

export class MockMetaDataService implements MetaDataApi {
  async getLabelMappings(): Promise<{
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
    table_names: { [id: string]: string };
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Example labels, these could be dynamically generated from mockTables or be static in MockData.ts
    const datafactories: { [id: string]: string } = {};
    const projects: { [id: string]: string } = {};
    const sources: { [id: string]: string } = {};
    const table_names: { [id: string]: string } = {};

    mockTables.forEach(table => {
      if (table.datafactory_id) datafactories[table.datafactory_id] = `DF: ${table.datafactory_id.split('-')[0]}`;
      if (table.project_id) projects[table.project_id] = `Proj: ${table.project_id.split('-')[0]}`;
      if (table.source_id) sources[table.source_id] = table.source_name;
      if (table.source_id) table_names[table.source_id] = table.table_name;
    });

    return Promise.resolve({
      datafactories,
      projects,
      sources,
      table_names
    });
  }

  async getStage1ArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_stage_1';
    transformations: Transformation[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Find a matching mock or return a default/error
    // This simple mock returns the first one, ideally it should match source/sink if multiple exist
    if (mockStage1ArchData.source_table_id === source_table_id && mockStage1ArchData.sink_table_id === sink_table_id) {
      return Promise.resolve(mockStage1ArchData as any); // Cast as any to match specific operation_type literal
    }
    // Fallback or throw error if not found
    return Promise.reject("No Stage1 Arch metadata found for the given IDs");
  }

  async getUpsertArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_upsert';
    primary_key: string[];
    order_by: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (mockUpsertArchData.source_table_id === source_table_id && mockUpsertArchData.sink_table_id === sink_table_id) {
      return Promise.resolve(mockUpsertArchData as any); // Cast as any for op type
    }
    return Promise.reject("No Upsert Arch metadata found for the given IDs");
  }

  async getCustomArchMetadata(source_table_id: string, sink_table_id: string): Promise<{
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_custom';
    records_query: string;
    statement_type: 'insert' | 'merge';
    custom_params: { [key: string]: string };
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (mockCustomArchData.source_table_id === source_table_id && mockCustomArchData.sink_table_id === sink_table_id) {
      return Promise.resolve(mockCustomArchData as any); // Cast for op type
    }
    return Promise.reject("No Custom Arch metadata found for the given IDs");
  }

  async getTableMetadata(tableId: string): Promise<{ full_name: string; /* other metadata */ }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const table = mockTables.find(t => t.source_id === tableId);
    if (table) {
      return Promise.resolve({ full_name: table.source_name /* include other fields from Table type if needed */ });
    }
    return Promise.reject(`Table with id ${tableId} not found`);
  }

  // Added method to get all tables
  async getAllTables(): Promise<{ tables: Table[] }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Promise.resolve({ tables: mockTables });
  }
  async getProjectIDs(source_ids: string[]): Promise<{
    [source_id: string]: {
      project_id: string;
      // other metadata
    }
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const projectIds: { [source_id: string]: { project_id: string } } = {};
    mockTables.forEach(table => {
      if (source_ids.includes(table.source_id)) {
        projectIds[table.source_id] = { project_id: table.project_id };
      }
    });
    return Promise.resolve(projectIds);
  }

  async getDatafactoryIDs(source_ids: string[]): Promise<{
    [source_id: string]: {
      datafactory_id: string;
      // other metadata
    } 
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const datafactoryIds: { [source_id: string]: { datafactory_id: string } } = {};
    mockTables.forEach(table => {
        if (source_ids.includes(table.source_id)) {
        datafactoryIds[table.source_id] = { datafactory_id: table.datafactory_id };
      }
    });
    return Promise.resolve(datafactoryIds);
  }
} 