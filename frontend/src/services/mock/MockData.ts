import {
    Event,
    Operation,
    Table,
    Transformation,
    OperationType,
    OperationStatus,
    OperationParamsType,
} from '@/types/api';

const DATAFACTORY_NAME_WEATHER_NAME = "weather";
const DATAFACTORY_NAME_WEATHER_ID = "00000000-0000-0000-0000-000000000000";
const PROJECT_WEATHER_STATIONS_NAME = "stations";
const PROJECT_WEATHER_STATIONS_ID = "00000000-0000-0000-0000-000000000002";
const PROJECT_WEATHER_CITIES_NAME = "cities";
const PROJECT_WEATHER_CITIES_ID = "00000000-0000-0000-0000-000000000003";
const SOURCE_TABLE_WEATHER_STATIONS_EVENTS_ID = "00000000-0000-0000-0000-000000000004";
const SOURCE_TABLE_WEATHER_STATIONS_EVENTS_NAME = "events";
const SOURCE_TABLE_WEATHER_STATIONS_EVENTS_TABLE_NAME = "weather__stations.events_raw";

const SOURCE_TABLE_WEATHER_STATIONS_LATEST_EVENTS_ID = "00000000-0000-0000-0000-000000000005";
const SOURCE_TABLE_WEATHER_STATIONS_LATEST_EVENTS_NAME = "latest_events";
const SOURCE_TABLE_WEATHER_STATIONS_LATEST_EVENTS_TABLE_NAME = "weather__stations.latest_events_org";
const SOURCE_TABLE_WEATHER_CITIES_DAILY_REPORT_ID = "00000000-0000-0000-0000-000000000006";
const SOURCE_TABLE_WEATHER_CITIES_DAILY_REPORT_NAME = "daily_report";
const SOURCE_TABLE_WEATHER_CITIES_DAILY_REPORT_TABLE_NAME = "weather__cities.daily_report_org";





const DATAFACTORY_NAME_CARS_NAME = "cars";
const DATAFACTORY_NAME_CARS_ID = "00000000-0000-0000-0000-000000000001";



// --- Common Identifiers ---
const PROJECT_ID_WEATHER = "weather-proj-uuid-01";
const DATAFACTORY_ID_INGESTION = "ingestion-df-uuid-01";
const DATAFACTORY_ID_TRANSFORMATION = "transform-df-uuid-01";

const SOURCE_TABLE_EXTERNAL_SENSORS_ID = "external-sensors-uuid-01";
const SOURCE_TABLE_RAW_WEATHER_ID = "raw-weather-events-uuid-01";
const SINK_TABLE_DAILY_AGG_ID = "daily-weather-agg-uuid-01";
const SINK_TABLE_LATEST_EVENTS_ID = "latest-weather-events-uuid-01";
const CUSTOM_REPORT_TABLE_ID = "custom-weather-report-uuid-01";


const OPERATION_ID_INGEST_RAW = "op-ingest-raw-uuid-01";
const OPERATION_ID_AGG_DAILY = "op-agg-daily-uuid-01";
const OPERATION_ID_UPSERT_LATEST = "op-upsert-latest-uuid-01";
const OPERATION_ID_CUSTOM_REPORT = "op-custom-report-uuid-01";

export const mockDatafactoryIds: { [source_id: string]: { datafactory_id: string } } = {
    [SOURCE_TABLE_EXTERNAL_SENSORS_ID]: { datafactory_id: DATAFACTORY_ID_INGESTION },
    [SOURCE_TABLE_RAW_WEATHER_ID]: { datafactory_id: DATAFACTORY_ID_TRANSFORMATION },
    [SINK_TABLE_DAILY_AGG_ID]: { datafactory_id: DATAFACTORY_ID_TRANSFORMATION },
    [SINK_TABLE_LATEST_EVENTS_ID]: { datafactory_id: DATAFACTORY_ID_TRANSFORMATION },
    [CUSTOM_REPORT_TABLE_ID]: { datafactory_id: DATAFACTORY_ID_TRANSFORMATION },
};



// --- Mock Table Objects ---

export const mockExternalSensorsTable: Table = {
    source_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
    source_name: "external_iot_weather_sensors",
    datafactory_id: "external-source-df",
    project_id: PROJECT_ID_WEATHER,
    row_count: 10000000,
    size_in_mb: 500,
    columns: [
        { name: "sensor_id", type: "varchar" },
        { name: "capture_timestamp", type: "timestamp(6)" },
        { name: "latitude", type: "double" },
        { name: "longitude", type: "double" },
        { name: "raw_temperature_payload", type: "varchar" },
        { name: "raw_humidity_payload", type: "varchar" },
    ],
    position: { x: -200, y: 200 },
    query_count: 10,
};

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
};


export const mockTables: Table[] = [
    mockExternalSensorsTable,
    mockRawWeatherTable,
    mockDailyWeatherAggTable,
    mockLatestWeatherEventsTable,
    mockCustomWeatherReportTable,
];

// --- Mock Operation Objects ---

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

export const mockIngestRawOp: Operation = {
    source_table_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
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
export const mockEventIngestRaw1: Event = {
    source_table_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_id: OPERATION_ID_INGEST_RAW,
    batch_id: fiveHoursAgo.getTime() * 1000,
    operation_type: 'insert_stage_0',
    params_type: 'time_range',
    params: [new Date(fiveHoursAgo.getTime() - 60 * 60 * 1000).toISOString(), fiveHoursAgo.toISOString()],
    rows_added: 12000,
    bytes_added: 2400000,
    event_time: fiveHoursAgo,
};

export const mockEventIngestRaw2: Event = {
    source_table_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_id: OPERATION_ID_INGEST_RAW,
    batch_id: fourHoursAgo.getTime() * 1000 + 1000,
    operation_type: 'insert_stage_0',
    params_type: 'time_range',
    params: [new Date(fourHoursAgo.getTime() - 60 * 60 * 1000).toISOString(), fourHoursAgo.toISOString()],
    rows_added: 15000,
    bytes_added: 3000000,
    event_time: fourHoursAgo,
};

export const mockEventIngestRaw3: Event = {
    source_table_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_id: OPERATION_ID_INGEST_RAW,
    batch_id: threeHoursAgo.getTime() * 1000 + 2000,
    operation_type: 'insert_stage_0',
    params_type: 'time_range',
    params: [new Date(threeHoursAgo.getTime() - 30 * 60 * 1000).toISOString(), threeHoursAgo.toISOString()],
    rows_added: 9000,
    bytes_added: 1800000,
    event_time: threeHoursAgo,
};

export const mockEventIngestRaw4: Event = {
    source_table_id: SOURCE_TABLE_EXTERNAL_SENSORS_ID,
    sink_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    datafactory_id: DATAFACTORY_ID_INGESTION,
    operation_id: OPERATION_ID_INGEST_RAW,
    batch_id: twoHoursAgo.getTime() * 1000 + 3000,
    operation_type: 'insert_stage_0',
    params_type: 'time_range',
    params: [new Date(twoHoursAgo.getTime() - 15 * 60 * 1000).toISOString(), twoHoursAgo.toISOString()],
    rows_added: 11000,
    bytes_added: 2200000,
    event_time: twoHoursAgo,
};


export const mockEventAggDaily1: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_AGG_DAILY,
    batch_id: threeHoursAgo.getTime() * 1000 - 3000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    params: [12345, 12346, 12347],
    rows_added: 500,
    bytes_added: 100000,
    event_time: new Date(threeHoursAgo.getTime() + 30 * 60 * 1000),
};

export const mockEventAggDaily2: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_AGG_DAILY,
    batch_id: twoHoursAgo.getTime() * 1000 - 2000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    params: [12348, 12349],
    rows_added: 350,
    bytes_added: 70000,
    event_time: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000),
};

export const mockEventAggDaily3: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_AGG_DAILY,
    batch_id: oneHourAgo.getTime() * 1000 - 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    params: [12350, 12351, 12352, 12353],
    rows_added: 620,
    bytes_added: 124000,
    event_time: new Date(oneHourAgo.getTime() + 5 * 60 * 1000),
};

export const mockEventUpsertLatest1: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_UPSERT_LATEST,
    batch_id: oneHourAgo.getTime() * 1000 - 1000000,
    operation_type: 'insert_upsert',
    params_type: 'time_range',
    params: [new Date(oneHourAgo.getTime() - 10 * 60 * 1000).toISOString(), oneHourAgo.toISOString()],
    rows_added: 10,
    bytes_added: 2000,
    event_time: new Date(oneHourAgo.getTime() + 5 * 60 * 1000),
};

export const mockEventUpsertLatest2: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_UPSERT_LATEST,
    batch_id: now.getTime() * 1000 - 500000,
    operation_type: 'insert_upsert',
    params_type: 'time_range',
    params: [new Date(now.getTime() - 5 * 60 * 1000).toISOString(), now.toISOString()],
    rows_added: 12,
    bytes_added: 2400,
    event_time: new Date(now.getTime() - 2 * 60 * 1000),
};

export const mockEventUpsertLatest3: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_UPSERT_LATEST,
    batch_id: now.getTime() * 1000,
    operation_type: 'insert_upsert',
    params_type: 'time_range',
    params: [new Date(now.getTime() - 2 * 60 * 1000).toISOString(), now.toISOString()],
    rows_added: 8,
    bytes_added: 1600,
    event_time: now,
};

export const mockEventCustomReport1: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: CUSTOM_REPORT_TABLE_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_CUSTOM_REPORT,
    batch_id: twoHoursAgo.getTime() * 1000 - 500000,
    operation_type: 'insert_custom',
    params_type: 'batch_ids',
    params: [6001, 6002],
    rows_added: 50,
    bytes_added: 15000,
    event_time: new Date(twoHoursAgo.getTime() + 10 * 60 * 1000),
};

export const mockEventCustomReport2: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: CUSTOM_REPORT_TABLE_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_CUSTOM_REPORT,
    batch_id: oneHourAgo.getTime() * 1000 - 250000,
    operation_type: 'insert_custom',
    params_type: 'batch_ids',
    params: [6003],
    rows_added: 25,
    bytes_added: 7500,
    event_time: new Date(oneHourAgo.getTime() + 5 * 60 * 1000),
};

export const mockEventCustomReport3: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: CUSTOM_REPORT_TABLE_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_CUSTOM_REPORT,
    batch_id: now.getTime() * 1000 - 100000,
    operation_type: 'insert_custom',
    params_type: 'batch_ids',
    params: [6004, 6005, 6006],
    rows_added: 70,
    bytes_added: 21000,
    event_time: now,
};

export const mockEventAggDaily4: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_DAILY_AGG_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_AGG_DAILY,
    batch_id: now.getTime() * 1000 - 50000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    params: [12354, 12355],
    rows_added: 280,
    bytes_added: 56000,
    event_time: new Date(now.getTime() - 1 * 60 * 1000),
};

export const mockEventUpsertLatest4: Event = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    datafactory_id: DATAFACTORY_ID_TRANSFORMATION,
    operation_id: OPERATION_ID_UPSERT_LATEST,
    batch_id: now.getTime() * 1000 + 100000,
    operation_type: 'insert_upsert',
    params_type: 'time_range',
    params: [now.toISOString(), new Date(now.getTime() + 2 * 60 * 1000).toISOString()],
    rows_added: 5,
    bytes_added: 1000,
    event_time: new Date(now.getTime() + 1 * 60 * 1000),
};

export const mockEvents: Event[] = [
    mockEventIngestRaw1,
    mockEventIngestRaw2,
    mockEventIngestRaw3,
    mockEventIngestRaw4,
    mockEventAggDaily1,
    mockEventAggDaily2,
    mockEventAggDaily3,
    mockEventAggDaily4,
    mockEventUpsertLatest1,
    mockEventUpsertLatest2,
    mockEventUpsertLatest3,
    mockEventUpsertLatest4,
    mockEventCustomReport1,
    mockEventCustomReport2,
    mockEventCustomReport3,
];

// --- Mock ArchMetadata Objects ---
// (These correspond to the return types of MetaDataApi methods)

export const mockStage1ArchData = {
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

export const mockUpsertArchData = {
    source_table_id: SOURCE_TABLE_RAW_WEATHER_ID,
    sink_table_id: SINK_TABLE_LATEST_EVENTS_ID,
    operation_type: 'insert_upsert' as OperationType,
    primary_key: ["city_id"],
    order_by: ["event_timestamp DESC"],
};

export const mockCustomArchData = {
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