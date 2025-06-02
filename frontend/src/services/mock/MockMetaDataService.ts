import { MetaDataApi, Table, TableColumn,Transformation, OperationType, Stage1Arch, UpsertArc, CustomArc } from '@/types/api';
import {
  mockTables,
  SOURCE_IDS_TO_COLUMNS,
  ETL_ARCS,
  SOURCE_NAMES,
  DATAFACTORY,
  PROJECTS,
  SOURCE_IDS,
  TABLE_NAMES
} from './MockData';

export class MockMetaDataService implements MetaDataApi {
  async getLabelMappings(): Promise<{
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
    table_names: { [id: string]: string };
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const datafactories: { [id: string]: string } = {
      [DATAFACTORY.ID]: DATAFACTORY.NAME
    };

    const projects: { [id: string]: string } = {
      [PROJECTS.STAGING.ID]: PROJECTS.STAGING.NAME,
      [PROJECTS.DIMENSIONS.ID]: PROJECTS.DIMENSIONS.NAME,
      [PROJECTS.FACTS.ID]: PROJECTS.FACTS.NAME
    };

    const sources: { [id: string]: string } = {
      [SOURCE_IDS.STAGING_ORDERS]: SOURCE_NAMES.STAGING,
      [SOURCE_IDS.STAGING_ORDER_ITEMS]: SOURCE_NAMES.STAGING,
      [SOURCE_IDS.DIM_CUSTOMERS]: SOURCE_NAMES.DIMENSIONS,
      [SOURCE_IDS.DIM_PRODUCTS]: SOURCE_NAMES.DIMENSIONS,
      [SOURCE_IDS.DIM_DATE]: SOURCE_NAMES.DIMENSIONS,
      [SOURCE_IDS.FACT_ORDERS]: SOURCE_NAMES.FACTS,
      [SOURCE_IDS.FACT_ORDER_ITEMS]: SOURCE_NAMES.FACTS,
      [SOURCE_IDS.ETL_BATCH_CONTROL]: SOURCE_NAMES.CONTROL
    };

    const table_names: { [id: string]: string } = {
      [SOURCE_IDS.STAGING_ORDERS]: TABLE_NAMES.STAGING_ORDERS,
      [SOURCE_IDS.STAGING_ORDER_ITEMS]: TABLE_NAMES.STAGING_ORDER_ITEMS,
      [SOURCE_IDS.DIM_CUSTOMERS]: TABLE_NAMES.DIM_CUSTOMERS,
      [SOURCE_IDS.DIM_PRODUCTS]: TABLE_NAMES.DIM_PRODUCTS,
      [SOURCE_IDS.DIM_DATE]: TABLE_NAMES.DIM_DATE,
      [SOURCE_IDS.FACT_ORDERS]: TABLE_NAMES.FACT_ORDERS,
      [SOURCE_IDS.FACT_ORDER_ITEMS]: TABLE_NAMES.FACT_ORDER_ITEMS,
      [SOURCE_IDS.ETL_BATCH_CONTROL]: TABLE_NAMES.ETL_BATCH_CONTROL
    };

    return Promise.resolve({
      datafactories,
      projects,
      sources,
      table_names
    });
  }

  async getTableColumns(source_id: string): Promise<TableColumn[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const columns = SOURCE_IDS_TO_COLUMNS.get(source_id);
    return Promise.resolve(columns);
  }


  async getStage1ArchMetadata(source_table_id: string, sink_table_id: string): Promise<Stage1Arch> {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Find matching Stage1 arch from ETL_ARCS
    const stage1Arch = ETL_ARCS.find(arc =>   
      arc.source_table_source_id === source_table_id && 
      arc.sink_table_source_id === sink_table_id &&
      'transformations' in arc
    ) as Stage1Arch | undefined;

    if (stage1Arch) {
      return Promise.resolve(stage1Arch);
    }
    return Promise.reject("No Stage1 Arch metadata found for the given IDs");
  }

  async getUpsertArchMetadata(source_table_id: string, sink_table_id: string): Promise<UpsertArc> {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Find matching Upsert arch from ETL_ARCS
    const upsertArch = ETL_ARCS.find(arc => 
      arc.source_table_source_id === source_table_id && 
      arc.sink_table_source_id === sink_table_id &&
      'primary_key' in arc
    ) as UpsertArc | undefined;

    if (upsertArch) {
      return Promise.resolve(upsertArch);
    }
    return Promise.reject("No Upsert Arch metadata found for the given IDs");
  }

  async getCustomArchMetadata(source_table_id: string, sink_table_id: string,statement_type?: 'insert' | 'merge'): Promise<CustomArc> {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Find matching Custom arch from ETL_ARCS
    const customArch = ETL_ARCS.find(arc => 
      arc.source_table_source_id === source_table_id && 
      arc.sink_table_source_id === sink_table_id &&
      'records_query' in arc
    ) as CustomArc | undefined;

    if (customArch) {
      return Promise.resolve(customArch);
    }
    return Promise.reject("No Custom Arch metadata found for the given IDs");
  }

  async getArchMetadata(source_table_source_id: string, sink_table_source_id: string,
     arch_type: OperationType,statement_type?: 'insert' | 'merge'): Promise<{}> {
    if (arch_type === 'insert_stage_0') {
      return {}
    }
    if (arch_type === 'insert_stage_1') {
      return this.getStage1ArchMetadata(source_table_source_id, sink_table_source_id);
    }
    if (arch_type === 'insert_upsert') {
      return this.getUpsertArchMetadata(source_table_source_id, sink_table_source_id);
    }
    if (arch_type === 'insert_custom') {
      return this.getCustomArchMetadata(source_table_source_id, sink_table_source_id,statement_type);
    }
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
    // Convert TableNode[] to Table[] by adding required fields
    const tables: Table[] = mockTables.map(table => ({
      ...table,
      table_id: table.source_id,
      row_count: 0, // Add default values for required fields
      size_in_mb: 0,
      last_updated: new Date(0)
    }));
    return Promise.resolve({ tables });
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