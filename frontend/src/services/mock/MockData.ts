import {
    Event,
    Operation,
    Table,
    Transformation,
    OperationType,
    OperationStatus,
    OperationParamsType,
} from '@/types/api';

// --- Common Identifiers ---
const PROJECT_ID_WEATHER = "weather-proj-uuid-01";
const DATAFACTORY_ID_INGESTION = "ingestion-df-uuid-01";
const DATAFACTORY_ID_TRANSFORMATION = "transform-df-uuid-01";

const SOURCE_TABLE_RAW_WEATHER_ID = "raw-weather-events-uuid-01";
const SINK_TABLE_DAILY_AGG_ID = "daily-weather-agg-uuid-01";
const SINK_TABLE_LATEST_EVENTS_ID = "latest-weather-events-uuid-01";
const CUSTOM_REPORT_TABLE_ID = "custom-weather-report-uuid-01";


const OPERATION_ID_INGEST_RAW = "op-ingest-raw-uuid-01";
const OPERATION_ID_AGG_DAILY = "op-agg-daily-uuid-01";
const OPERATION_ID_UPSERT_LATEST = "op-upsert-latest-uuid-01";
const OPERATION_ID_CUSTOM_REPORT = "op-custom-report-uuid-01";

// --- Mock Table Objects ---

export const mockRawWeatherTable: Table = {
    source_id: SOURCE_TABLE_RAW_WEATHER_ID,
    source_name: "raw_weather_events",
    datafactory_id: DATAFACTORY_ID_INGESTION,
    project_id: PROJECT_ID_WEATHER,
    row_count: 1500000,
    size_in_mb: 250,
    columns: [
        { name: "event_timestamp", type: "timestamp(6)" },
        { name: "city_id", type: "varchar" },
        { name: "temperature_celsius", type: "double" },
        { name: "humidity_percent", type: "integer" },
        { name: "wind_speed_kmh", type: "double" },
        { name: "precipitation_mm", type: "double" },
    ],
    position: { x: 100, y: 200 },
    query_count: 50,
    insertion_type: "append_only",
};

export const mockDailyWeatherAggTable: Table = {
    source_id: SINK_TABLE_DAILY_AGG_ID,
    source_name: "daily_weather_aggregates",
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    project_id: PROJECT_ID_WEATHER,
    row_count: 60000,
    size_in_mb: 50,
    columns: [
        { name: "aggregation_date", type: "date" },
        { name: "city_id", type: "varchar" },
        { name: "avg_temp_celsius", type: "double" },
        { name: "max_humidity_percent", type: "integer" },
        { name: "min_wind_speed_kmh", type: "double" },
        { name: "total_precipitation_mm", type: "double" },
    ],
    position: { x: 400, y: 100 },
    query_count: 120,
    insertion_type: "overwrite_partition",
    primary_key: "aggregation_date, city_id",
};

export const mockLatestWeatherEventsTable: Table = {
    source_id: SINK_TABLE_LATEST_EVENTS_ID,
    source_name: "latest_city_weather_events",
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    project_id: PROJECT_ID_WEATHER,
    row_count: 200, // Assuming one latest entry per city
    size_in_mb: 2,
    columns: [
        { name: "city_id", type: "varchar" },
        { name: "latest_temperature_celsius", type: "double" },
        { name: "latest_humidity_percent", type: "integer" },
        { name: "last_event_timestamp", type: "timestamp(6)" },
    ],
    position: { x: 400, y: 300 },
    query_count: 250,
    insertion_type: "upsert",
    primary_key: "city_id",
    order_by: "last_event_timestamp desc",
};

export const mockCustomWeatherReportTable: Table = {
    source_id: CUSTOM_REPORT_TABLE_ID,
    source_name: "significant_weather_events_report",
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    project_id: PROJECT_ID_WEATHER,
    row_count: 500,
    size_in_mb: 5,
    columns: [
        { name: "report_date", type: "date" },
        { name: "city_id", type: "varchar" },
        { name: "event_type", type: "varchar" }, // e.g., 'Heatwave', 'HeavyRain'
        { name: "details", type: "varchar" },
    ],
    position: { x: 700, y: 200 },
    query_count: 10,
    insertion_type: "insert_custom_query",
    sql_query: "SELECT ... FROM " + SOURCE_TABLE_RAW_WEATHER_ID + " WHERE temperature_celsius > 35",
};


export const mockTables: Table[] = [
    mockRawWeatherTable,
    mockDailyWeatherAggTable,
    mockLatestWeatherEventsTable,
    mockCustomWeatherReportTable,
];

// --- Mock Operation Objects ---

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

export const mockIngestRawOp: Operation = {
    source_table_id: "external_iot_weather_sensors", // Conceptual source
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_type: 'insert_stage_0',
    is_running: false,
    status: 'pending',
    params_type: 'time_range',
    created_at: twoHoursAgo,
    last_update_time: oneHourAgo,
};

export const mockAggDailyOp: Operation = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_type: 'insert_stage_1',
    is_running: true,
    status: 'in_progress',
    params_type: 'batch_ids',
    created_at: oneHourAgo,
    last_update_time: now,
};

export const mockUpsertLatestOp: Operation = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID, // Could also be SINK_TABLE_DAILY_AGG_ID
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_type: 'insert_upsert',
    is_running: false,
    status: 'hold',
    params_type: 'time_range',
    created_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
    last_update_time: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
};

export const mockCustomReportOp: Operation = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: CUSTOM_REPORT_TABLE_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_type: 'insert_custom',
    is_running: false,
    status: 'failure',
    params_type: 'batch_ids',
    created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    last_update_time: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23 hours ago
};

export const mockOperations: Operation[] = [
    mockIngestRawOp,
    mockAggDailyOp,
    mockUpsertLatestOp,
    mockCustomReportOp,
];


// --- Mock Event Objects ---
export const mockEventIngestRaw: Event = {
    source_table_id: "external_iot_weather_sensors",
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_id: OPERATION_ID_INGEST_RAW,
    batch_id: Date.now() * 1000 - 5000000, // nanoseconds
    operation_type: 'insert_stage_0',
    params_type: 'time_range',
    params: [new Date(oneHourAgo.getTime() - 60 * 60 * 1000).toISOString(), oneHourAgo.toISOString()],
    rows_added: 10000,
    bytes_added: 2000000, // 2MB
    event_time: oneHourAgo,
};

export const mockEventAggDaily: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_AGG_DAILY,
    batch_id: Date.now() * 1000 - 3000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    params: [12345, 12346, 12347],
    rows_added: 500,
    bytes_added: 100000, // 0.1MB
    event_time: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
};

export const mockEventUpsertLatest: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_UPSERT_LATEST,
    batch_id: Date.now() * 1000 - 1000000,
    operation_type: 'insert_upsert',
    params_type: 'time_range',
    params: [new Date(now.getTime() - 10 * 60 * 1000).toISOString(), now.toISOString()],
    rows_added: 10, // Small number, could be updates
    bytes_added: 2000, // 2KB
    event_time: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
};


export const mockEvents: Event[] = [
    mockEventIngestRaw,
    mockEventAggDaily,
    mockEventUpsertLatest,
];

// --- Mock ArchMetadata Objects ---
// (These correspond to the return types of MetaDataApi methods)

export const mockStage1ArchData = { // : ReturnType<MetaDataApi['getStage1ArchMetadata']> (inner object)
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    operation_type: 'insert_stage_1' as OperationType,
    transformations: [
        {
            field_name: "aggregation_date",
            function_name: "DATE_TRUNC",
            params: [
                { name: "unit", type: "literal", value: "DAY" },
                { name: "column", type: "column_name", value: "event_timestamp" },
            ],
            transformation_type: 'add',
        },
        {
            field_name: "city_id",
            function_name: "passthrough",
            params: [{ name: "column", type: "column_name", value: "city_id" }],
            transformation_type: 'replace',
        },
        {
            field_name: "avg_temp_celsius",
            function_name: "AVG",
            params: [{ name: "column", type: "column_name", value: "temperature_celsius" }],
            transformation_type: 'add',
        },
        {
            field_name: "max_humidity_percent",
            function_name: "MAX",
            params: [{ name: "column", type: "column_name", value: "humidity_percent" }],
            transformation_type: 'add',
        },
    ] as Transformation[],
};

export const mockUpsertArchData = { // : ReturnType<MetaDataApi['getUpsertArchMetadata']> (inner object)
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    operation_type: 'insert_upsert' as OperationType,
    primary_key: ["city_id"],
    order_by: ["event_timestamp DESC"],
};

export const mockCustomArchData = { // : ReturnType<MetaDataApi['getCustomArchMetadata']> (inner object)
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: CUSTOM_REPORT_TABLE_ID,
    operation_type: 'insert_custom' as OperationType,
    records_query: `
    SELECT
      DATE(event_timestamp) as report_date,
      city_id,
      CASE
        WHEN temperature_celsius > 38 THEN 'ExtremeHeat'
        WHEN precipitation_mm > 50 THEN 'HeavyRainfall'
        WHEN wind_speed_kmh > 80 THEN 'HighWinds'
        ELSE NULL
      END as event_type,
      'Temperature: ' || CAST(temperature_celsius AS VARCHAR) || '°C, Precipitation: ' || CAST(precipitation_mm AS VARCHAR) || 'mm, Wind: ' || CAST(wind_speed_kmh AS VARCHAR) || 'km/h' as details
    FROM ${SOURCE_TABLE_RAW_WEATHER_ID}
    WHERE temperature_celsius > 38 OR precipitation_mm > 50 OR wind_speed_kmh > 80
    LIMIT 100;
  `,
    statement_type: 'insert' as 'insert' | 'merge',
    custom_params: {
        "significance_threshold_temp": "38",
        "significance_threshold_precip": "50",
        "significance_threshold_wind": "80",
    },
};

// Collection of all ArchData for convenience if needed
export const mockAllArchData = {
    stage1: mockStage1ArchData,
    upsert: mockUpsertArchData,
    custom: mockCustomArchData,
}; 