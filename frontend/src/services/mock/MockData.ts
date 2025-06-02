// mock.ts
import { TableNode, TableColumn, UpsertArc, CustomArc, Stage0Arch, Stage1Arch, Operation, Event } from "@/types/api";


const ARC_IDS = {
    STAGING_ORDERS_TO_DIM_CUSTOMERS: 'm1n2o3p4-q5r6-7890-m1n2-o3p4q5r6s7t8',
    STAGING_ORDER_ITEMS_TO_DIM_PRODUCTS: 'n2o3p4q5-r6s7-8901-n2o3-p4q5r6s7t8u9',
    STAGING_ORDERS_TO_FACT_ORDERS: 'o3p4q5r6-s7t8-9012-o3p4-q5r6s7t8u9v0',
    STAGING_ORDER_ITEMS_TO_FACT_ORDER_ITEMS: 'p4q5r6s7-t8u9-0123-p4q5-r6s7t8u9v0w1',
    ETL_BATCH_CONTROL: 'q5r6s7t8-u9v0-1234-q5r6-s7t8u9v0w1x2',
    STAGING_ORDERS_STAGE0: 'r6s7t8u9-v0w1-2345-r6s7-t8u9v0w1x2y3',
    STAGING_ORDERS_STAGE1: 's7t8u9v0-w1x2-3456-s7t8-u9v0w1x2y3z4',
    STAGING_ORDER_ITEMS_STAGE0: 't8u9v0w1-x2y3-4567-t8u9-v0w1x2y3z4a5',
    STAGING_ORDER_ITEMS_STAGE1: 'u9v0w1x2-y3z4-5678-u9v0-w1x2y3z4a5b6'
  } as const;

// Constants for source names
const SOURCE_NAMES = {
  STAGING: 'ecommerce_analytics_staging',
  DIMENSIONS: 'ecommerce_analytics_dimensions',
  FACTS: 'ecommerce_analytics_facts',
  CONTROL: 'etl_control'
} as const;

// Constants for datafactory
const DATAFACTORY = {
  NAME: 'retail_data_platform',
  ID: 'a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7'
} as const;

// Constants for projects
const PROJECTS = {
  STAGING: {
    NAME: 'ecommerce_analytics_staging',
    ID: 'b2d3e4f5-g6h7-8901-b2d3-e4f5g6h7i8j9'
  },
  DIMENSIONS: {
    NAME: 'ecommerce_analytics_dimensions',
    ID: 'c3e4f5g6-h7i8-9012-c3e4-f5g6h7i8j9k0'
  },
  FACTS: {
    NAME: 'ecommerce_analytics_facts',
    ID: 'd4e5f6g7-h8i9-0123-d4e5-f6g7h8i9j0k1'
  }
} as const;

// Constants for source IDs - one unique ID per table
const SOURCE_IDS = {
  STAGING_ORDERS: 'e5f6g7h8-i9j0-1234-e5f6-g7h8i9j0k1l2',
  STAGING_ORDER_ITEMS: 'f6g7h8i9-j0k1-2345-f6g7-h8i9j0k1l2m3',
  DIM_CUSTOMERS: 'g7h8i9j0-k1l2-3456-g7h8-i9j0k1l2m3n4',
  DIM_PRODUCTS: 'h8i9j0k1-l2m3-4567-h8i9-j0k1l2m3n4o5',
  DIM_DATE: 'i9j0k1l2-m3n4-5678-i9j0-k1l2m3n4o5p6',
  FACT_ORDERS: 'j0k1l2m3-n4o5-6789-j0k1-l2m3n4o5p6q7',
  FACT_ORDER_ITEMS: 'k1l2m3n4-o5p6-7890-k1l2-m3n4o5p6q7r8',
  ETL_BATCH_CONTROL: 'l2m3n4o5-p6q7-8901-l2m3-n4o5p6q7r8s9'
} as const;

// Constants for table names
const TABLE_NAMES = {
  // Staging tables
  STAGING_ORDERS: 'ecommerce_analytics_staging.staging_orders',
  STAGING_ORDER_ITEMS: 'ecommerce_analytics_staging.staging_order_items',
  // Dimension tables
  DIM_CUSTOMERS: 'ecommerce_analytics_dimensions.dim_customers',
  DIM_PRODUCTS: 'ecommerce_analytics_dimensions.dim_products',
  DIM_DATE: 'ecommerce_analytics_dimensions.dim_date',
  // Fact tables
  FACT_ORDERS: 'ecommerce_analytics_facts.fact_orders',
  FACT_ORDER_ITEMS: 'ecommerce_analytics_facts.fact_order_items',
  // Control table
  ETL_BATCH_CONTROL: 'ecommerce_analytics_staging.etl_batch_control'
} as const;

// TableNode objects for each table
export const mockTables: TableNode[] = [
  // Staging tables
  {
    source_name: SOURCE_NAMES.STAGING,
    source_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.STAGING.NAME,
    project_id: PROJECTS.STAGING.ID,
    table_name: TABLE_NAMES.STAGING_ORDERS
  },
  {
    source_name: SOURCE_NAMES.STAGING,
    source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.STAGING.NAME,
    project_id: PROJECTS.STAGING.ID,
    table_name: TABLE_NAMES.STAGING_ORDER_ITEMS
  },
  // Dimension tables
  {
    source_name: SOURCE_NAMES.DIMENSIONS,
    source_id: SOURCE_IDS.DIM_CUSTOMERS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.DIMENSIONS.NAME,
    project_id: PROJECTS.DIMENSIONS.ID,
    table_name: TABLE_NAMES.DIM_CUSTOMERS
  },
  {
    source_name: SOURCE_NAMES.DIMENSIONS,
    source_id: SOURCE_IDS.DIM_PRODUCTS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.DIMENSIONS.NAME,
    project_id: PROJECTS.DIMENSIONS.ID,
    table_name: TABLE_NAMES.DIM_PRODUCTS
  },
  {
    source_name: SOURCE_NAMES.DIMENSIONS,
    source_id: SOURCE_IDS.DIM_DATE,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.DIMENSIONS.NAME,
    project_id: PROJECTS.DIMENSIONS.ID,
    table_name: TABLE_NAMES.DIM_DATE
  },
  // Fact tables
  {
    source_name: SOURCE_NAMES.FACTS,
    source_id: SOURCE_IDS.FACT_ORDERS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.FACTS.NAME,
    project_id: PROJECTS.FACTS.ID,
    table_name: TABLE_NAMES.FACT_ORDERS
  },
  {
    source_name: SOURCE_NAMES.FACTS,
    source_id: SOURCE_IDS.FACT_ORDER_ITEMS,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.FACTS.NAME,
    project_id: PROJECTS.FACTS.ID,
    table_name: TABLE_NAMES.FACT_ORDER_ITEMS
  },
  // Control table
  {
    source_name: SOURCE_NAMES.CONTROL,
    source_id: SOURCE_IDS.ETL_BATCH_CONTROL,
    datafactory_name: DATAFACTORY.NAME,
    datafactory_id: DATAFACTORY.ID,
    project_name: PROJECTS.STAGING.NAME,
    project_id: PROJECTS.STAGING.ID,
    table_name: TABLE_NAMES.ETL_BATCH_CONTROL
  }
];



// mock.ts
// ... (previous code remains the same)

// Column definitions for each table
export const SOURCE_IDS_TO_COLUMNS: Map<string, TableColumn[]> = new Map([
  // Staging Orders
  [SOURCE_IDS.STAGING_ORDERS, [
    { name: 'order_id', type: 'VARCHAR(50)' },
    { name: 'customer_email', type: 'VARCHAR(255)' },
    { name: 'customer_name', type: 'VARCHAR(255)' },
    { name: 'customer_phone', type: 'VARCHAR(20)' },
    { name: 'order_date', type: 'TIMESTAMP' },
    { name: 'order_status', type: 'VARCHAR(50)' },
    { name: 'total_amount', type: 'DECIMAL(12,2)' },
    { name: 'currency_code', type: 'VARCHAR(3)' },
    { name: 'shipping_address', type: 'TEXT' },
    { name: 'billing_address', type: 'TEXT' },
    { name: 'payment_method', type: 'VARCHAR(50)' },
    { name: 'created_at', type: 'TIMESTAMP' }
  ]],

  // Staging Order Items
  [SOURCE_IDS.STAGING_ORDER_ITEMS, [
    { name: 'order_item_id', type: 'VARCHAR(50)' },
    { name: 'order_id', type: 'VARCHAR(50)' },
    { name: 'product_sku', type: 'VARCHAR(100)' },
    { name: 'product_name', type: 'VARCHAR(255)' },
    { name: 'product_category', type: 'VARCHAR(100)' },
    { name: 'quantity', type: 'INTEGER' },
    { name: 'unit_price', type: 'DECIMAL(10,2)' },
    { name: 'discount_amount', type: 'DECIMAL(10,2)' },
    { name: 'tax_amount', type: 'DECIMAL(10,2)' },
    { name: 'line_total', type: 'DECIMAL(12,2)' },
    { name: 'created_at', type: 'TIMESTAMP' }
  ]],

  // Dim Customers
  [SOURCE_IDS.DIM_CUSTOMERS, [
    { name: 'customer_id', type: 'INTEGER' },
    { name: 'customer_email', type: 'VARCHAR(255)' },
    { name: 'customer_name', type: 'VARCHAR(255)' },
    { name: 'customer_phone', type: 'VARCHAR(20)' },
    { name: 'first_order_date', type: 'DATE' },
    { name: 'last_order_date', type: 'DATE' },
    { name: 'total_orders', type: 'INTEGER' },
    { name: 'total_spent', type: 'DECIMAL(12,2)' },
    { name: 'customer_status', type: 'VARCHAR(20)' },
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP' }
  ]],

  // Dim Products
  [SOURCE_IDS.DIM_PRODUCTS, [
    { name: 'product_id', type: 'INTEGER' },
    { name: 'product_sku', type: 'VARCHAR(100)' },
    { name: 'product_name', type: 'VARCHAR(255)' },
    { name: 'product_category', type: 'VARCHAR(100)' },
    { name: 'current_price', type: 'DECIMAL(10,2)' },
    { name: 'is_active', type: 'BOOLEAN' },
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP' }
  ]],

  // Dim Date
  [SOURCE_IDS.DIM_DATE, [
    { name: 'date_id', type: 'INTEGER' },
    { name: 'full_date', type: 'DATE' },
    { name: 'year', type: 'INTEGER' },
    { name: 'quarter', type: 'INTEGER' },
    { name: 'month', type: 'INTEGER' },
    { name: 'week', type: 'INTEGER' },
    { name: 'day_of_month', type: 'INTEGER' },
    { name: 'day_of_week', type: 'INTEGER' },
    { name: 'day_name', type: 'VARCHAR(10)' },
    { name: 'month_name', type: 'VARCHAR(10)' },
    { name: 'is_weekend', type: 'BOOLEAN' },
    { name: 'is_holiday', type: 'BOOLEAN' }
  ]],

  // Fact Orders
  [SOURCE_IDS.FACT_ORDERS, [
    { name: 'order_fact_id', type: 'INTEGER' },
    { name: 'order_id', type: 'VARCHAR(50)' },
    { name: 'customer_id', type: 'INTEGER' },
    { name: 'order_date_id', type: 'INTEGER' },
    { name: 'order_status', type: 'VARCHAR(50)' },
    { name: 'total_amount', type: 'DECIMAL(12,2)' },
    { name: 'currency_code', type: 'VARCHAR(3)' },
    { name: 'payment_method', type: 'VARCHAR(50)' },
    { name: 'item_count', type: 'INTEGER' },
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP' }
  ]],

  // Fact Order Items
  [SOURCE_IDS.FACT_ORDER_ITEMS, [
    { name: 'order_item_fact_id', type: 'INTEGER' },
    { name: 'order_item_id', type: 'VARCHAR(50)' },
    { name: 'order_fact_id', type: 'INTEGER' },
    { name: 'product_id', type: 'INTEGER' },
    { name: 'quantity', type: 'INTEGER' },
    { name: 'unit_price', type: 'DECIMAL(10,2)' },
    { name: 'discount_amount', type: 'DECIMAL(10,2)' },
    { name: 'tax_amount', type: 'DECIMAL(10,2)' },
    { name: 'line_total', type: 'DECIMAL(12,2)' },
    { name: 'created_at', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP' }
  ]],

  // ETL Batch Control
  [SOURCE_IDS.ETL_BATCH_CONTROL, [
    { name: 'batch_start_time', type: 'TIMESTAMP' },
    { name: 'batch_end_time', type: 'TIMESTAMP' },
    { name: 'status', type: 'VARCHAR(20)' },
    { name: 'orders_processed', type: 'INTEGER' },
    { name: 'order_items_processed', type: 'INTEGER' },
    { name: 'error_message', type: 'TEXT' }
  ]]
]);
// Export constants for easy reference
// Constants for Arc IDs


// Constants for ETL Arcs
const ETL_ARCS: (UpsertArc | CustomArc | Stage0Arch | Stage1Arch)[] = [
  // 1. Staging Orders -> Dim Customers (Upsert)
  {
    id: ARC_IDS.STAGING_ORDERS_TO_DIM_CUSTOMERS,
    source_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_source_id: SOURCE_IDS.DIM_CUSTOMERS,
    primary_key: ['customer_email'],
    order_by: ['order_date'],
    arch_type: 'insert_upsert'
  },

  // 2. Staging Order Items -> Dim Products (Upsert)
  {
    id: ARC_IDS.STAGING_ORDER_ITEMS_TO_DIM_PRODUCTS,
    source_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_source_id: SOURCE_IDS.DIM_PRODUCTS,
    primary_key: ['product_sku'],
    order_by: ['unit_price'],
    arch_type: 'insert_upsert'
  },

  // 3. Staging Orders -> Fact Orders (Custom - Complex Join)
  {
    id: ARC_IDS.STAGING_ORDERS_TO_FACT_ORDERS,
    source_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_source_id: SOURCE_IDS.FACT_ORDERS,
    records_query: `
      SELECT 
        so.order_id,
        dc.customer_id,
        TO_NUMBER(TO_CHAR(so.order_date, 'YYYYMMDD')) AS order_date_id,
        so.order_status,
        so.total_amount,
        so.currency_code,
        so.payment_method,
        COUNT(soi.order_item_id) AS item_count
      FROM staging_orders so
      JOIN dim_customers dc ON so.customer_email = dc.customer_email
      LEFT JOIN staging_order_items soi ON so.order_id = soi.order_id
      GROUP BY so.order_id, dc.customer_id, so.order_date, so.order_status,
               so.total_amount, so.currency_code, so.payment_method
    `,
    statement_type: 'merge',
    custom_params: {},
    arch_type: 'insert_custom'
  },

  // 4. Staging Order Items -> Fact Order Items (Custom - Complex Join)
  {
    id: ARC_IDS.STAGING_ORDER_ITEMS_TO_FACT_ORDER_ITEMS,
    source_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_source_id: SOURCE_IDS.FACT_ORDER_ITEMS,
    records_query: `
      SELECT 
        soi.order_item_id,
        fo.order_fact_id,
        dp.product_id,
        soi.quantity,
        soi.unit_price,
        soi.discount_amount,
        soi.tax_amount,
        soi.line_total
      FROM staging_order_items soi
      JOIN fact_orders fo ON soi.order_id = fo.order_id
      JOIN dim_products dp ON soi.product_sku = dp.product_sku
    `,
    statement_type: 'merge',
    custom_params: {},
    arch_type: 'insert_custom'
  },

  // 5. ETL Batch Control (Custom - Status Update)
  {
    id: ARC_IDS.ETL_BATCH_CONTROL,
    source_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_source_id: SOURCE_IDS.ETL_BATCH_CONTROL,
    records_query: `
      SELECT 
        CURRENT_TIMESTAMP as batch_start_time,
        NULL as batch_end_time,
        'RUNNING' as status,
        (SELECT COUNT(*) FROM staging_orders) as orders_processed,
        (SELECT COUNT(*) FROM staging_order_items) as order_items_processed,
        NULL as error_message
    `,
    statement_type: 'insert',
    custom_params: {},
    arch_type: 'insert_custom'
  },    

  // New Stage0 and Stage1 arcs for staging_orders
  {
    id: ARC_IDS.STAGING_ORDERS_STAGE0,
    source_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    arch_type: 'insert_stage_0'
  },
  {
    id: ARC_IDS.STAGING_ORDERS_STAGE1,
    source_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_source_id: SOURCE_IDS.STAGING_ORDERS,
    transformations: [
      {
        field_name: 'order_date',
        function_name: 'validate_timestamp',
        params: [
          { name: 'format', type: 'string', value: 'YYYY-MM-DD HH:mm:ss' }
        ],
        transformation_type: 'replace'
      }
    ],
    arch_type: 'insert_stage_1'
  },

  // New Stage0 and Stage1 arcs for staging_order_items
  {
    id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    source_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    arch_type: 'insert_stage_0'
  },
  {
    id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE1,
    source_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_source_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    transformations: [],
    arch_type: 'insert_stage_1'
  }
];







// Export constants
export {
  SOURCE_NAMES,
  DATAFACTORY,
  PROJECTS,
  SOURCE_IDS,
  TABLE_NAMES,
  ARC_IDS,
  ETL_ARCS
};

// Mock Events for staging_orders
export const MOCK_EVENTS: Event[] = [
  // Stage0 events for staging_orders (6 events, 1 per second)
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000 - 5000) * 1000000, // yesterday - 5 seconds in nanoseconds
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-001-orders'],
    rows_added: 100,
    bytes_added: 5000,
    event_time: new Date(Date.now() - 86400000 - 5000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000 - 4000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-002-orders'],
    rows_added: 150,
    bytes_added: 7500,
    event_time: new Date(Date.now() - 86400000 - 4000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000 - 3000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-003-orders'],
    rows_added: 200,
    bytes_added: 10000,
    event_time: new Date(Date.now() - 86400000 - 3000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000 - 2000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-004-orders'],
    rows_added: 180,
    bytes_added: 9000,
    event_time: new Date(Date.now() - 86400000 - 2000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000 - 1000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-005-orders'],
    rows_added: 220,
    bytes_added: 11000,
    event_time: new Date(Date.now() - 86400000 - 1000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE0,
    batch_id: (Date.now() - 86400000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-006-orders'],
    rows_added: 250,
    bytes_added: 12500,
    event_time: new Date(Date.now() - 86400000)
  },

  // Stage1 events for staging_orders (2 events)
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE1,
    batch_id: (Date.now() - 86400000 + 1000) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 - 5000) * 1000000),
      String((Date.now() - 86400000 - 4000) * 1000000),
      String((Date.now() - 86400000 - 3000) * 1000000)
    ],
    rows_added: 450,
    bytes_added: 22500,
    event_time: new Date(Date.now() - 86400000 + 1000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE1,
    batch_id: (Date.now() - 86400000 + 2000) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 - 2000) * 1000000),
      String((Date.now() - 86400000 - 1000) * 1000000),
      String((Date.now() - 86400000) * 1000000)
    ],
    rows_added: 650,
    bytes_added: 32500,
    event_time: new Date(Date.now() - 86400000 + 2000)
  },

  // New Stage1 events with time_range params_type for staging_orders
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE1,
    batch_id: (Date.now() - 86400000 + 1500) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'time_range',
    params: {},
    batches: [
      String((Date.now() - 86400000 - 5000) * 1000000),
      String((Date.now() - 86400000 - 3000) * 1000000)
    ],
    rows_added: 0,
    bytes_added: 0,
    event_time: new Date(Date.now() - 86400000 + 1500)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.STAGING_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_STAGE1,
    batch_id: (Date.now() - 86400000 + 2500) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'time_range',
    params: {},
    batches: [
      String((Date.now() - 86400000 - 2000) * 1000000),
      String((Date.now() - 86400000) * 1000000)
    ],
    rows_added: 0,
    bytes_added: 0,
    event_time: new Date(Date.now() - 86400000 + 2500)
  },

  // Upsert event for staging_orders -> dim_customers
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.DIM_CUSTOMERS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDERS_TO_DIM_CUSTOMERS,
    batch_id: (Date.now() - 86400000 + 3000) * 1000000,
    operation_type: 'insert_upsert',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 + 1000) * 1000000),
      String((Date.now() - 86400000 + 2000) * 1000000)
    ],
    rows_added: 1100,
    bytes_added: 55000,
    event_time: new Date(Date.now() - 86400000 + 3000)
  },

  // Stage0 events for staging_order_items (6 events, 1 per second)
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000 - 5000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-001-items'],
    rows_added: 300,
    bytes_added: 15000,
    event_time: new Date(Date.now() - 86400000 - 5000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000 - 4000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-002-items'],
    rows_added: 450,
    bytes_added: 22500,
    event_time: new Date(Date.now() - 86400000 - 4000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000 - 3000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-003-items'],
    rows_added: 600,
    bytes_added: 30000,
    event_time: new Date(Date.now() - 86400000 - 3000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000 - 2000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-004-items'],
    rows_added: 540,
    bytes_added: 27000,
    event_time: new Date(Date.now() - 86400000 - 2000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000 - 1000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-005-items'],
    rows_added: 660,
    bytes_added: 33000,
    event_time: new Date(Date.now() - 86400000 - 1000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE0,
    batch_id: (Date.now() - 86400000) * 1000000,
    operation_type: 'insert_stage_0',
    params_type: 'batch_ids',
    batches: ['batch-006-items'],
    rows_added: 750,
    bytes_added: 37500,
    event_time: new Date(Date.now() - 86400000)
  },

  // Stage1 events for staging_order_items (2 events)
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE1,
    batch_id: (Date.now() - 86400000 + 1000) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 - 5000) * 1000000),
      String((Date.now() - 86400000 - 4000) * 1000000),
      String((Date.now() - 86400000 - 3000) * 1000000)
    ],
    rows_added: 1350,
    bytes_added: 67500,
    event_time: new Date(Date.now() - 86400000 + 1000)
  },
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_STAGE1,
    batch_id: (Date.now() - 86400000 + 2000) * 1000000,
    operation_type: 'insert_stage_1',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 - 2000) * 1000000),
      String((Date.now() - 86400000 - 1000) * 1000000),
      String((Date.now() - 86400000) * 1000000)
    ],
    rows_added: 1950,
    bytes_added: 97500,
    event_time: new Date(Date.now() - 86400000 + 2000)
  },

  // Upsert event for staging_order_items -> dim_products
  {
    source_table_id: SOURCE_IDS.STAGING_ORDER_ITEMS,
    sink_table_id: SOURCE_IDS.DIM_PRODUCTS,
    datafactory_id: DATAFACTORY.ID,
    operation_id: ARC_IDS.STAGING_ORDER_ITEMS_TO_DIM_PRODUCTS,
    batch_id: (Date.now() - 86400000 + 3000) * 1000000,
    operation_type: 'insert_upsert',
    params_type: 'batch_ids',
    batches: [
      String((Date.now() - 86400000 + 1000) * 1000000),
      String((Date.now() - 86400000 + 2000) * 1000000)
    ],
    rows_added: 3300,
    bytes_added: 165000,
    event_time: new Date(Date.now() - 86400000 + 3000)
  }
];

// Mock Operations
export const MOCK_OPERATIONS: Operation[] = [
  // Failed custom operation
  {
    source_table_id: SOURCE_IDS.STAGING_ORDERS,
    sink_table_id: SOURCE_IDS.FACT_ORDERS,
    datafactory_id: DATAFACTORY.ID,
    operation_type: 'insert_custom',
    is_running: false,
    status: 'failure',
    params_type: 'time_range',
    created_at: new Date(new Date().setHours(0, 0, 0, 0)),
    last_update_time: new Date(new Date().setHours(0, 0, 0, 0))
  },
  // Table locked upsert operation
  // Wait operation with same source/sink as upsert
  {
    source_table_id:  SOURCE_IDS.DIM_CUSTOMERS,
    sink_table_id: SOURCE_IDS.DIM_CUSTOMERS,
    datafactory_id: DATAFACTORY.ID,
    operation_type: 'wait',
    is_running: false,
    status: 'in_progress',
    params_type: 'time_range',
    created_at: new Date(Date.now() - 3600000), // 1 hour ago
    last_update_time: new Date()
  }
];