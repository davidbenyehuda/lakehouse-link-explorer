import { Table, TableColumn } from '../types/tables';
import { Event } from '../types/api';

// Helper Interfaces for Metadata Responses
export interface Stage1ArchMetadataResponse {
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_stage_1';
    transformations: any;
}

export interface UpsertArchMetadataResponse {
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_upsert';
    primary_key: string[];
    order_by: string[];
}

export interface CustomArchMetadataResponse {
    source_table_id: string;
    sink_table_id: string;
    operation_type: 'insert_custom';
    records_query: string;
    statement_type: 'insert' | 'merge';
    custom_params: { [key: string]: string };
}

// Sample Table Data
const commonColumns: TableColumn[] = [
    { name: 'id', type: 'VARCHAR(36)' },
    { name: 'data_field_1', type: 'STRING' },
    { name: 'data_field_2', type: 'INTEGER' },
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP' },
];

export const mockSourceTable: Table = {
    id: "123e4567-e89b-12d3-a456-426614174001",
    source_id: "raw_oracle_db_01",
    datafactory_id: "df_ingest_main",
    project_id: "project_apollo",
    row_count: 1500000,
    size_in_mb: 250,
    columns: commonColumns,
    position: { x: 100, y: 100 },
    last_accessed: new Date('2023-10-01T10:00:00Z'),
    query_count: 500,
};

export const mockStageTable: Table = {
    id: "123e4567-e89b-12d3-a456-426614174002",
    source_id: "staging_area_hdfs",
    datafactory_id: "df_transform_main",
    project_id: "project_apollo",
    row_count: 1450000,
    size_in_mb: 230,
    columns: [
        ...commonColumns,
        { name: 'transformed_field_A', type: 'DOUBLE' }
    ],
    position: { x: 400, y: 100 },
    insertion_type: "insert_stage_1"
};

export const mockSinkTable: Table = {
    id: "123e4567-e89b-12d3-a456-426614174003",
    source_id: "data_warehouse_snowflake",
    datafactory_id: "df_load_main",
    project_id: "project_gemini",
    row_count: 1400000,
    size_in_mb: 220,
    columns: [
        { name: 'final_id', type: 'VARCHAR(36)' },
        { name: 'agg_data_field_1', type: 'STRING' },
        { name: 'metric_x', type: 'DECIMAL(18,2)' },
        { name: 'load_timestamp', type: 'TIMESTAMP' },
    ],
    position: { x: 700, y: 100 },
    insertion_type: "insert_upsert",
    primary_key: "final_id",
    order_by: "load_timestamp"
};

// Sample Event Data
export const mockEvent1: Event = {
    source_table_id: mockSourceTable.id,
    sink_table_id: mockStageTable.id,
    datafactory_id: "dfid-1111-aaaa-bbbb-cccc1111cccc",
    project_id: "projid-2222-aaaa-bbbb-cccc2222cccc",
    operation_id: "opid-3333-aaaa-bbbb-cccc3333cccc",
    batch_id: 101,
    operation_type: "insert_stage_1",
    params_type: "time_range",
    params: ["2023-10-01T00:00:00Z", "2023-10-01T01:00:00Z"],
    rows_added: 75000,
    bytes_added: 12582912, // 12 MB
    event_time: new Date('2023-10-01T01:05:00Z').toISOString(),
};

export const mockEvent2: Event = {
    source_table_id: mockStageTable.id,
    sink_table_id: mockSinkTable.id,
    datafactory_id: "dfid-4444-aaaa-bbbb-cccc4444cccc",
    project_id: "projid-5555-aaaa-bbbb-cccc5555cccc",
    operation_id: "opid-6666-aaaa-bbbb-cccc6666cccc",
    batch_id: 202,
    operation_type: "insert_upsert",
    params_type: "batch_id_list",
    params: [50, 51, 52],
    rows_added: 70000,
    bytes_added: 11534336, // 11 MB
    event_time: new Date('2023-10-01T02:10:00Z').toISOString(),
};

// Sample Metadata Objects
export const sampleStage1ArchMetadata: Stage1ArchMetadataResponse = {
    source_table_id: mockSourceTable.id,
    sink_table_id: mockStageTable.id,
    operation_type: 'insert_stage_1',
    transformations: {
        column_mappings: [
            { source_column: 'id', sink_column: 'id', transform_type: 'direct_copy' },
            { source_column: 'data_field_1', sink_column: 'data_field_1', transform_type: 'direct_copy' },
            { source_column: 'data_field_2', sink_column: 'data_field_2', transform_type: 'direct_copy' },
            { source_column: 'created_at', sink_column: 'created_at', transform_type: 'direct_copy' },
            { source_column: 'updated_at', sink_column: 'updated_at', transform_type: 'direct_copy' },
        ],
        filters: ["data_field_2 > 100"],
        new_columns: [
            { name: 'transformed_field_A', value_expression: "CAST(data_field_1 AS DOUBLE) * 0.5", type: "DOUBLE" }
        ]
    }
};

export const sampleUpsertArchMetadata: UpsertArchMetadataResponse = {
    source_table_id: mockStageTable.id,
    sink_table_id: mockSinkTable.id,
    operation_type: 'insert_upsert',
    primary_key: ['final_id'],
    order_by: ['load_timestamp', 'final_id']
};

export const sampleCustomArchMetadata: CustomArchMetadataResponse = {
    source_table_id: mockSourceTable.id,
    sink_table_id: mockSinkTable.id,
    operation_type: 'insert_custom',
    records_query: `
    SELECT
      s.id AS final_id,
      UPPER(s.data_field_1) AS agg_data_field_1,
      SUM(s.data_field_2) AS metric_x,
      CURRENT_TIMESTAMP() AS load_timestamp
    FROM ${mockSourceTable.id} s
    WHERE s.created_at >= '2023-01-01'
    GROUP BY s.id, UPPER(s.data_field_1)
  `,
    statement_type: 'merge',
    custom_params: {
        merge_condition: "target.final_id = source.final_id",
        when_matched_then_update: "SET target.agg_data_field_1 = source.agg_data_field_1, target.metric_x = source.metric_x, target.load_timestamp = source.load_timestamp",
        when_not_matched_then_insert: "(final_id, agg_data_field_1, metric_x, load_timestamp) VALUES (source.final_id, source.agg_data_field_1, source.metric_x, source.load_timestamp)"
    }
};
