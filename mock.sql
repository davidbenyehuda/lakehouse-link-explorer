-- =====================================================
-- COMPLETE ETL EXAMPLE WITH UPSERT ARCHITECTURE
-- E-commerce Order Management System
-- =====================================================

-- =====================================================
-- 1. CLIENT INPUT TABLES (where clients insert data)
-- =====================================================

-- CLIENT TABLE 1: Raw Orders (staging table for client inserts)
CREATE TABLE staging_orders (
    order_id VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    order_date TIMESTAMP NOT NULL,
    order_status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    shipping_address TEXT,
    billing_address TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    batch_id VARCHAR(50) -- for tracking ETL batches
);

-- CLIENT TABLE 2: Raw Order Items (staging table for client inserts)
CREATE TABLE staging_order_items (
    order_item_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    batch_id VARCHAR(50) -- for tracking ETL batches
);

-- =====================================================
-- 2. DIMENSION TABLES (managed by ETL)
-- =====================================================

-- Customers Dimension
CREATE TABLE dim_customers (
    customer_id INTEGER IDENTITY(1,1) PRIMARY KEY,
    customer_email VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    first_order_date DATE,
    last_order_date DATE,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    customer_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Dimension
CREATE TABLE dim_products (
    product_id INTEGER IDENTITY(1,1) PRIMARY KEY,
    product_sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100),
    current_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Date Dimension
CREATE TABLE dim_date (
    date_id INTEGER PRIMARY KEY,
    full_date DATE NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    day_name VARCHAR(10) NOT NULL,
    month_name VARCHAR(10) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 3. FACT TABLES (managed by ETL)
-- =====================================================

-- Orders Fact Table
CREATE TABLE fact_orders (
    order_fact_id INTEGER IDENTITY(1,1) PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date_id INTEGER NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50),
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (order_date_id) REFERENCES dim_date(date_id)
);

-- Order Items Fact Table
CREATE TABLE fact_order_items (
    order_item_fact_id INTEGER IDENTITY(1,1) PRIMARY KEY,
    order_item_id VARCHAR(50) UNIQUE NOT NULL,
    order_fact_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_fact_id) REFERENCES fact_orders(order_fact_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id)
);

-- =====================================================
-- 4. ETL CONTROL TABLE
-- =====================================================

CREATE TABLE etl_batch_control (
    batch_id VARCHAR(50) PRIMARY KEY,
    batch_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    batch_end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'RUNNING',
    orders_processed INTEGER DEFAULT 0,
    order_items_processed INTEGER DEFAULT 0,
    error_message TEXT
);

-- =====================================================
-- 5. ETL STORED PROCEDURES WITH UPSERT LOGIC
-- =====================================================

-- ETL Procedure 1: Process Customers (UPSERT)
CREATE OR REPLACE PROCEDURE sp_etl_process_customers(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    -- UPSERT customers from staging_orders
    MERGE INTO dim_customers AS target
    USING (
        SELECT DISTINCT
            customer_email,
            customer_name,
            customer_phone,
            MIN(order_date) AS first_order_date,
            MAX(order_date) AS last_order_date,
            COUNT(*) AS total_orders,
            SUM(total_amount) AS total_spent
        FROM staging_orders
        WHERE batch_id = batch_id
        GROUP BY customer_email, customer_name, customer_phone
    ) AS source
    ON target.customer_email = source.customer_email
    
    WHEN MATCHED THEN
        UPDATE SET
            customer_name = COALESCE(source.customer_name, target.customer_name),
            customer_phone = COALESCE(source.customer_phone, target.customer_phone),
            last_order_date = GREATEST(source.last_order_date, target.last_order_date),
            total_orders = target.total_orders + source.total_orders,
            total_spent = target.total_spent + source.total_spent,
            updated_at = CURRENT_TIMESTAMP
    
    WHEN NOT MATCHED THEN
        INSERT (customer_email, customer_name, customer_phone, first_order_date, 
                last_order_date, total_orders, total_spent)
        VALUES (source.customer_email, source.customer_name, source.customer_phone,
                source.first_order_date, source.last_order_date, 
                source.total_orders, source.total_spent);
    
    RETURN 'Customers processed successfully';
END;
$$;

-- ETL Procedure 2: Process Products (UPSERT)
CREATE OR REPLACE PROCEDURE sp_etl_process_products(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    -- UPSERT products from staging_order_items
    MERGE INTO dim_products AS target
    USING (
        SELECT DISTINCT
            product_sku,
            product_name,
            product_category,
            MAX(unit_price) AS current_price -- Get the latest price
        FROM staging_order_items
        WHERE batch_id = batch_id
        GROUP BY product_sku, product_name, product_category
    ) AS source
    ON target.product_sku = source.product_sku
    
    WHEN MATCHED THEN
        UPDATE SET
            product_name = source.product_name,
            product_category = COALESCE(source.product_category, target.product_category),
            current_price = source.current_price,
            updated_at = CURRENT_TIMESTAMP
    
    WHEN NOT MATCHED THEN
        INSERT (product_sku, product_name, product_category, current_price)
        VALUES (source.product_sku, source.product_name, source.product_category, source.current_price);
    
    RETURN 'Products processed successfully';
END;
$$;

-- ETL Procedure 3: Process Orders Fact (UPSERT)
CREATE OR REPLACE PROCEDURE sp_etl_process_orders(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    -- UPSERT orders into fact table
    MERGE INTO fact_orders AS target
    USING (
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
                                          AND soi.batch_id = batch_id
        WHERE so.batch_id = batch_id
        GROUP BY so.order_id, dc.customer_id, so.order_date, so.order_status,
                 so.total_amount, so.currency_code, so.payment_method
    ) AS source
    ON target.order_id = source.order_id
    
    WHEN MATCHED THEN
        UPDATE SET
            order_status = source.order_status,
            total_amount = source.total_amount,
            payment_method = source.payment_method,
            item_count = source.item_count,
            updated_at = CURRENT_TIMESTAMP
    
    WHEN NOT MATCHED THEN
        INSERT (order_id, customer_id, order_date_id, order_status, total_amount,
                currency_code, payment_method, item_count)
        VALUES (source.order_id, source.customer_id, source.order_date_id,
                source.order_status, source.total_amount, source.currency_code,
                source.payment_method, source.item_count);
    
    RETURN 'Orders processed successfully';
END;
$$;

-- ETL Procedure 4: Process Order Items Fact (UPSERT)
CREATE OR REPLACE PROCEDURE sp_etl_process_order_items(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    -- UPSERT order items into fact table
    MERGE INTO fact_order_items AS target
    USING (
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
        WHERE soi.batch_id = batch_id
    ) AS source
    ON target.order_item_id = source.order_item_id
    
    WHEN MATCHED THEN
        UPDATE SET
            quantity = source.quantity,
            unit_price = source.unit_price,
            discount_amount = source.discount_amount,
            tax_amount = source.tax_amount,
            line_total = source.line_total,
            updated_at = CURRENT_TIMESTAMP
    
    WHEN NOT MATCHED THEN
        INSERT (order_item_id, order_fact_id, product_id, quantity, unit_price,
                discount_amount, tax_amount, line_total)
        VALUES (source.order_item_id, source.order_fact_id, source.product_id,
                source.quantity, source.unit_price, source.discount_amount,
                source.tax_amount, source.line_total);
    
    RETURN 'Order items processed successfully';
END;
$$;

-- =====================================================
-- 6. MASTER ETL ORCHESTRATION PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_etl_master_process(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
DECLARE
    result_msg STRING;
    error_msg STRING;
    orders_count INTEGER;
    items_count INTEGER;
BEGIN
    -- Start batch tracking
    INSERT INTO etl_batch_control (batch_id, status)
    VALUES (batch_id, 'RUNNING');
    
    BEGIN
        -- Get counts for logging
        SELECT COUNT(*) INTO orders_count FROM staging_orders WHERE batch_id = batch_id;
        SELECT COUNT(*) INTO items_count FROM staging_order_items WHERE batch_id = batch_id;
        
        -- Process in correct order (dimensions first, then facts)
        CALL sp_etl_process_customers(batch_id);
        CALL sp_etl_process_products(batch_id);
        CALL sp_etl_process_orders(batch_id);
        CALL sp_etl_process_order_items(batch_id);
        
        -- Update batch control - success
        UPDATE etl_batch_control 
        SET status = 'COMPLETED',
            batch_end_time = CURRENT_TIMESTAMP,
            orders_processed = orders_count,
            order_items_processed = items_count
        WHERE batch_id = batch_id;
        
        result_msg := 'ETL batch ' || batch_id || ' completed successfully. Processed ' || 
                     orders_count || ' orders and ' || items_count || ' order items.';
        
    EXCEPTION
        WHEN OTHER THEN
            error_msg := SQLERRM;
            
            -- Update batch control - error
            UPDATE etl_batch_control 
            SET status = 'FAILED',
                batch_end_time = CURRENT_TIMESTAMP,
                error_message = error_msg
            WHERE batch_id = batch_id;
            
            result_msg := 'ETL batch ' || batch_id || ' failed: ' || error_msg;
    END;
    
    RETURN result_msg;
END;
$$;

-- =====================================================
-- 7. DATA CLEANUP PROCEDURES
-- =====================================================

-- Procedure to clean processed staging data
CREATE OR REPLACE PROCEDURE sp_cleanup_processed_staging(batch_id VARCHAR(50))
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    -- Only clean up if batch was successful
    IF EXISTS (SELECT 1 FROM etl_batch_control 
               WHERE batch_id = batch_id AND status = 'COMPLETED') THEN
        
        DELETE FROM staging_orders WHERE batch_id = batch_id;
        DELETE FROM staging_order_items WHERE batch_id = batch_id;
        
        RETURN 'Staging data cleaned up for batch: ' || batch_id;
    ELSE
        RETURN 'Batch not completed successfully. Staging data preserved.';
    END IF;
END;
$$;

-- =====================================================
-- 8. SAMPLE DATA AND USAGE EXAMPLES
-- =====================================================

-- Sample Date Dimension Data (populate for current year)
INSERT INTO dim_date (date_id, full_date, year, quarter, month, week, day_of_month, 
                     day_of_week, day_name, month_name, is_weekend)
SELECT 
    TO_NUMBER(TO_CHAR(date_val, 'YYYYMMDD')) AS date_id,
    date_val AS full_date,
    EXTRACT(YEAR FROM date_val) AS year,
    EXTRACT(QUARTER FROM date_val) AS quarter,
    EXTRACT(MONTH FROM date_val) AS month,
    EXTRACT(WEEK FROM date_val) AS week,
    EXTRACT(DAY FROM date_val) AS day_of_month,
    EXTRACT(DOW FROM date_val) AS day_of_week,
    TO_CHAR(date_val, 'Day') AS day_name,
    TO_CHAR(date_val, 'Month') AS month_name,
    CASE WHEN EXTRACT(DOW FROM date_val) IN (0, 6) THEN TRUE ELSE FALSE END AS is_weekend
FROM (
    SELECT DATEADD(day, seq4(), '2025-01-01') AS date_val
    FROM TABLE(GENERATOR(ROWCOUNT => 365))
) dates;

-- =====================================================
-- 9. CLIENT USAGE EXAMPLES
-- =====================================================

-- How clients insert data (Example 1: Orders)
INSERT INTO staging_orders VALUES
('ORD-2025-001', 'john.doe@email.com', 'John Doe', '+1-555-0123', 
 '2025-05-31 10:30:00', 'CONFIRMED', 299.99, 'USD', 
 '123 Main St, Anytown, USA', '123 Main St, Anytown, USA', 
 'CREDIT_CARD', CURRENT_TIMESTAMP, 'BATCH_20250531_001'),
('ORD-2025-002', 'jane.smith@email.com', 'Jane Smith', '+1-555-0456',
 '2025-05-31 11:15:00', 'PENDING', 459.50, 'USD',
 '456 Oak Ave, Somewhere, USA', '456 Oak Ave, Somewhere, USA',
 'PAYPAL', CURRENT_TIMESTAMP, 'BATCH_20250531_001');

-- How clients insert data (Example 2: Order Items)
INSERT INTO staging_order_items VALUES
('ITEM-001', 'ORD-2025-001', 'SKU-LAPTOP-001', 'Gaming Laptop', 'Electronics', 
 1, 279.99, 0.00, 20.00, 299.99, CURRENT_TIMESTAMP, 'BATCH_20250531_001'),
('ITEM-002', 'ORD-2025-002', 'SKU-MOUSE-001', 'Wireless Mouse', 'Electronics',
 2, 29.99, 5.00, 2.51, 57.49, CURRENT_TIMESTAMP, 'BATCH_20250531_001'),
('ITEM-003', 'ORD-2025-002', 'SKU-KEYBOARD-001', 'Mechanical Keyboard', 'Electronics',
 1, 89.99, 0.00, 7.20, 97.19, CURRENT_TIMESTAMP, 'BATCH_20250531_001');

-- =====================================================
-- 10. ETL EXECUTION EXAMPLE
-- =====================================================

-- Execute the ETL process
CALL sp_etl_master_process('BATCH_20250531_001');

-- Check ETL status
SELECT * FROM etl_batch_control WHERE batch_id = 'BATCH_20250531_001';

-- Clean up processed staging data
CALL sp_cleanup_processed_staging('BATCH_20250531_001');

-- =====================================================
-- 11. ANALYTICAL QUERIES EXAMPLES
-- =====================================================

-- Customer Analysis
SELECT 
    dc.customer_name,
    dc.customer_email,
    dc.total_orders,
    dc.total_spent,
    DATEDIFF(day, dc.first_order_date, dc.last_order_date) AS customer_lifetime_days
FROM dim_customers dc
WHERE dc.total_orders > 1
ORDER BY dc.total_spent DESC;

-- Product Performance
SELECT 
    dp.product_name,
    dp.product_category,
    COUNT(foi.order_item_fact_id) AS times_ordered,
    SUM(foi.quantity) AS total_quantity_sold,
    SUM(foi.line_total) AS total_revenue
FROM dim_products dp
JOIN fact_order_items foi ON dp.product_id = foi.product_id
GROUP BY dp.product_name, dp.product_category
ORDER BY total_revenue DESC;

-- Daily Sales Summary
SELECT 
    dd.full_date,
    dd.day_name,
    COUNT(fo.order_fact_id) AS orders_count,
    SUM(fo.total_amount) AS daily_revenue,
    AVG(fo.total_amount) AS avg_order_value
FROM dim_date dd
JOIN fact_orders fo ON dd.date_id = fo.order_date_id
WHERE dd.full_date >= CURRENT_DATE - 30
GROUP BY dd.full_date, dd.day_name
ORDER BY dd.full_date DESC;