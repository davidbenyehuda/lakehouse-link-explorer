export interface TableNode {
    source_name: string; // name of the source of the table - e.g ("events-raw", "daily-events-org")
    source_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
    datafactory_name: string; // name of the datafactory of the table - e.g ("weather")
    datafactory_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
    project_name: string; // name of the project of the table - e.g ("stations")
    project_id: string; // uuid (e.g "a1c1b2d3-e4f5-6789-a1c1-b2d3e4f5g6h7")
    table_name: string; // name of the table - e.g ("weather__stations.events_raw", "weather__stations.daily_events_org")
  }


source_ids_to_columes : Map<string, TableColumn[]>


export interface TableColumn {
  name: string; // name of the column ('location', 'date', 'temperature', 'humidity', 'wind_speed', 'precipitation')
  type: string | TableColumn[] | { [key: string]: TableColumn } | Map<string, TableColumn>; // type of the column ('string', 'int', 'float', 'date', 'boolean', 'array', 'record', 'map')
}

  // mock.ts

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



export type OperationType = 'insert_stage_0' | 'insert_stage_1' | 'insert_upsert' | 'insert_custom' | 'wait';


export interface BasicArc {
  id: string;
  source_table_source_id: string;
  sink_table_source_id: string;
  insertion_type: OperationType;
}

export interface UpsertArc extends BasicArc {
  id: string;
  source_table_source_id: string;
  sink_table_source_id: string;
  insertion_type: OperationType;
}



export {
  SOURCE_NAMES,
  DATAFACTORY,
  PROJECTS,
  SOURCE_IDS,
  TABLE_NAMES
};