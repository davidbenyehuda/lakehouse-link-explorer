
import { Table, ArchDetails, InsertionType } from "../types/tables";

// Generate random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate mock table data with a tree-like structure
export const generateMockTables = (): Table[] => {
  const tables: Table[] = [];
  
  // Common column types
  const columnTypes = [
    "integer", "bigint", "smallint", "tinyint",
    "real", "double", "decimal(10,2)",
    "boolean", "varchar", "char(10)", "string", "json",
    "date", "timestamp"
  ];

  // Generate tables for the first data factory (client_1)
  const client1Tables = createClientTables(
    "client_1", 
    "project_alpha", 
    columnTypes, 
    0, // X position offset
    true // Include all layer types
  );
  
  // Generate tables for the second data factory (client_2)
  const client2Tables = createClientTables(
    "client_2", 
    "project_beta", 
    columnTypes, 
    600, // X position offset
    true // Include all layer types
  );
  
  return [...client1Tables, ...client2Tables];
};

const createClientTables = (
  dataFactoryId: string, 
  projectId: string, 
  columnTypes: string[], 
  xOffset: number,
  includeAllTypes: boolean
): Table[] => {
  const tables: Table[] = [];
  const tableCount = includeAllTypes ? 4 : randomInt(3, 5);
  
  // Create raw layer table (stage_0)
  const rawTable = createTable(
    `${dataFactoryId}_${projectId}_raw`,
    dataFactoryId,
    projectId,
    `${dataFactoryId}_raw_data`,
    columnTypes,
    randomInt(1000, 10000),
    { x: xOffset, y: 100 },
    randomInt(50, 200) // Size in MB
  );
  tables.push(rawTable);

  if (includeAllTypes) {
    // Create a transform table (stage_1)
    const transformTable = createTable(
      `${dataFactoryId}_${projectId}_transform`,
      dataFactoryId,
      projectId,
      `${dataFactoryId}_transformed_data`,
      columnTypes,
      randomInt(1000, 10000),
      { x: xOffset + 300, y: 50 },
      randomInt(40, 180) // Size in MB
    );
    tables.push(transformTable);

    // Create an upsert table
    const upsertTable = createTable(
      `${dataFactoryId}_${projectId}_upsert`,
      dataFactoryId,
      projectId,
      `${dataFactoryId}_upserted_data`,
      columnTypes,
      randomInt(1000, 10000),
      { x: xOffset + 600, y: 100 },
      randomInt(30, 150) // Size in MB
    );
    tables.push(upsertTable);

    // Create a custom table
    const customTable = createTable(
      `${dataFactoryId}_${projectId}_custom`,
      dataFactoryId,
      projectId,
      `${dataFactoryId}_custom_data`,
      columnTypes,
      randomInt(1000, 10000),
      { x: xOffset + 900, y: 150 },
      randomInt(20, 120) // Size in MB
    );
    tables.push(customTable);
  } else {
    // Create random tables with random positions for non-sample clients
    for (let i = 1; i < tableCount; i++) {
      tables.push(createTable(
        `${dataFactoryId}_${projectId}_table_${i}`,
        dataFactoryId,
        projectId,
        `${dataFactoryId}_data_${i}`,
        columnTypes,
        randomInt(1000, 10000),
        { x: xOffset + (i * 250), y: 100 + randomInt(-50, 50) },
        randomInt(20, 150) // Size in MB
      ));
    }
  }

  return tables;
};

const createTable = (
  id: string,
  dataFactoryId: string,
  projectId: string,
  sourceId: string,
  columnTypes: string[],
  rowCount: number,
  position: { x: number, y: number },
  sizeInMB: number
): Table => {
  const numColumns = randomInt(3, 8);
  const columns = [];
  
  // Add id column for every table
  columns.push({
    name: "id",
    type: "varchar"
  });
  
  // Add created_at for every table
  columns.push({
    name: "created_at",
    type: "timestamp"
  });
  
  for (let j = 0; j < numColumns - 2; j++) {
    columns.push({
      name: `column_${j+1}`,
      type: columnTypes[Math.floor(Math.random() * columnTypes.length)]
    });
  }

  return {
    id,
    datafactory_id: dataFactoryId,
    project_id: projectId,
    source_id: sourceId,
    columns,
    row_count: rowCount,
    position,
    size_in_mb: sizeInMB,
    last_accessed: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(), // Random date within last 30 days
    query_count: randomInt(5, 100)
  };
};

// Generate mock arch details
export const generateMockArches = (tables: Table[]): ArchDetails[] => {
  const arches: ArchDetails[] = [];
  
  // Group tables by data factory and project
  const tableGroups: {[key: string]: Table[]} = {};
  
  tables.forEach(table => {
    const key = `${table.datafactory_id}_${table.project_id}`;
    if (!tableGroups[key]) {
      tableGroups[key] = [];
    }
    tableGroups[key].push(table);
  });
  
  // For each group, create arches following the tree structure
  Object.values(tableGroups).forEach(groupTables => {
    // Sort tables by x position to ensure left-to-right flow
    groupTables.sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));
    
    // Create arches between sequential tables
    for (let i = 0; i < groupTables.length - 1; i++) {
      const sourceTable = groupTables[i];
      const targetTable = groupTables[i + 1];
      
      // Determine insertion type based on table position
      let insertionType: InsertionType;
      if (i === 0) {
        insertionType = 'insert_stage_0';
      } else if (i === 1) {
        insertionType = 'insert_stage_1';
      } else if (i === 2) {
        insertionType = 'insert_upsert';
      } else {
        insertionType = 'insert_custom';
      }
      
      // Generate events
      const events = generateEvents(5, sourceTable.row_count);
      
      // Calculate event stats
      const eventTimestamps = events.map(e => new Date(e.timestamp).getTime());
      eventTimestamps.sort((a, b) => a - b);
      
      let avgTimeBetweenEvents = 0;
      if (eventTimestamps.length > 1) {
        let totalDiff = 0;
        for (let j = 1; j < eventTimestamps.length; j++) {
          totalDiff += eventTimestamps[j] - eventTimestamps[j - 1];
        }
        avgTimeBetweenEvents = totalDiff / (eventTimestamps.length - 1);
      }
      
      const lastCompletedEvent = new Date(Math.max(...eventTimestamps)).toISOString();
      
      const arch: ArchDetails = {
        id: `arch_${sourceTable.id}_to_${targetTable.id}`,
        source: sourceTable.id,
        target: targetTable.id,
        sql_query: generateSqlQuery(sourceTable, targetTable, insertionType),
        events,
        statistics: {
          count: events.length,
          rows: events.reduce((sum, event) => sum + (event.details.rows_affected || 0), 0),
          avgRunTime: parseFloat((Math.random() * 10).toFixed(2)),
          lastCompletedEvent,
          avgTimeBetweenEvents: Math.floor(avgTimeBetweenEvents / 1000), // Convert ms to seconds
        },
        insertion_type: insertionType
      };
      
      // Add specific details based on insertion type
      if (insertionType === 'insert_upsert') {
        arch.primary_key = "id";
        arch.order_by = "created_at DESC";
      } else if (insertionType === 'insert_custom') {
        arch.merge_statement = generateMergeStatement(sourceTable, targetTable);
      }
      
      arches.push(arch);
    }
  });

  return arches;
};

// Generate SQL query based on insertion type
const generateSqlQuery = (sourceTable: Table, targetTable: Table, insertionType: InsertionType): string => {
  switch (insertionType) {
    case 'insert_stage_0':
      return `INSERT INTO ${targetTable.id} SELECT * FROM ${sourceTable.id}`;
    case 'insert_stage_1':
      return `INSERT INTO ${targetTable.id} 
SELECT 
  id, 
  created_at,
  ${sourceTable.columns.slice(2).map(col => `${col.name}`).join(', ')}
FROM ${sourceTable.id}`;
    case 'insert_upsert':
      return `INSERT INTO ${targetTable.id}
SELECT * FROM ${sourceTable.id}
ON CONFLICT (id) DO UPDATE
SET created_at = EXCLUDED.created_at,
    ${sourceTable.columns.slice(2).map(col => `${col.name} = EXCLUDED.${col.name}`).join(',\n    ')}`;
    case 'insert_custom':
      return `-- Custom SQL for complex transformations
WITH source_data AS (
  SELECT 
    id,
    created_at,
    ${sourceTable.columns.slice(2).map(col => `${col.name}`).join(', ')}
  FROM ${sourceTable.id}
  WHERE created_at > (SELECT MAX(created_at) FROM ${targetTable.id})
)
INSERT INTO ${targetTable.id}
SELECT * FROM source_data`;
  }
};

// Generate a merge statement for custom insertion
const generateMergeStatement = (sourceTable: Table, targetTable: Table): string => {
  return `MERGE INTO ${targetTable.id} target
USING ${sourceTable.id} source
  ON target.id = source.id
WHEN MATCHED THEN UPDATE
  SET ${sourceTable.columns.slice(1).map(col => `target.${col.name} = source.${col.name}`).join(',\n      ')}
WHEN NOT MATCHED THEN
  INSERT (${sourceTable.columns.map(col => col.name).join(', ')})
  VALUES (${sourceTable.columns.map(col => `source.${col.name}`).join(', ')})`;
};

// Generate realistic event data
const generateEvents = (count: number, maxRows: number) => {
  const events = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    // Create events from most recent to oldest (up to 30 days ago)
    const eventTime = new Date(now - (i * 86400000 * randomInt(1, 3)));
    const rowsAffected = randomInt(100, maxRows / 10);
    
    events.push({
      id: `event_${i}_${eventTime.getTime()}`,
      timestamp: eventTime.toISOString(),
      event_type: "data_transfer",
      details: {
        status: "completed",
        rows_affected: rowsAffected,
        duration_seconds: randomInt(5, 300),
        success: true
      }
    });
  }
  
  return events;
};

// Generate a dataset with table nodes and connections
export const generateMockDataset = () => {
  const tables = generateMockTables();
  const arches = generateMockArches(tables);
  return { tables, arches };
};
