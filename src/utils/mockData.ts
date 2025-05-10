
import { Table, ArchDetails, InsertionType } from "../types/tables";

// Generate random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate mock table data
export const generateMockTables = (count: number): Table[] => {
  const tables: Table[] = [];
  
  const columnTypes = [
    "integer", "bigint", "smallint", "tinyint",
    "real", "double", "decimal(10,2)",
    "boolean",
    "varchar", "char(10)", "string", "json",
    "date", "timestamp"
  ];

  for (let i = 0; i < count; i++) {
    const numColumns = randomInt(3, 8);
    const columns = [];
    
    for (let j = 0; j < numColumns; j++) {
      columns.push({
        name: `column_${j+1}`,
        type: columnTypes[Math.floor(Math.random() * columnTypes.length)]
      });
    }

    tables.push({
      id: `table_${i+1}`,
      datafactory_id: `client_${randomInt(1, 5)}`,
      project_id: `project_${randomInt(1, 10)}`,
      source_id: `src_${i+1}_${Date.now().toString(36)}`,
      columns,
      row_count: randomInt(1000, 1000000),
      position: { x: randomInt(0, 800), y: randomInt(0, 600) }
    });
  }

  return tables;
};

// Generate mock arch details
export const generateMockArches = (tables: Table[]): ArchDetails[] => {
  const arches: ArchDetails[] = [];
  const insertionTypes: InsertionType[] = ['insert_stage_0', 'insert_stage_1', 'insert_upsert', 'insert_custom'];

  // Create a random number of arches (we'll limit to ensure it's not too dense)
  const maxArches = Math.min(tables.length * 1.5, tables.length * (tables.length - 1) / 2);
  const numArches = randomInt(tables.length, maxArches);
  
  for (let i = 0; i < numArches; i++) {
    // Ensure source and target are different
    let sourceIdx = randomInt(0, tables.length - 1);
    let targetIdx = randomInt(0, tables.length - 1);
    while (sourceIdx === targetIdx) {
      targetIdx = randomInt(0, tables.length - 1);
    }

    const sourceTable = tables[sourceIdx];
    const targetTable = tables[targetIdx];
    const insertionType = insertionTypes[randomInt(0, insertionTypes.length - 1)];
    
    let archDetails: ArchDetails = {
      id: `arch_${i+1}`,
      source: sourceTable.id,
      target: targetTable.id,
      sql_query: `SELECT * FROM ${sourceTable.id} WHERE condition = true`,
      events: [
        {
          id: `event_${i}_1`,
          timestamp: new Date().toISOString(),
          event_type: "data_transfer",
          details: { status: "completed" }
        },
        {
          id: `event_${i}_2`,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          event_type: "data_transfer",
          details: { status: "completed" }
        }
      ],
      statistics: {
        count: randomInt(5, 100),
        rows: randomInt(100, 10000),
        avgRunTime: parseFloat((Math.random() * 10).toFixed(2))
      },
      insertion_type: insertionType
    };
    
    // Add specific details based on insertion type
    if (insertionType === 'insert_upsert') {
      archDetails.primary_key = sourceTable.columns[0]?.name || "id";
      archDetails.order_by = sourceTable.columns[1]?.name || "created_at";
    } else if (insertionType === 'insert_custom') {
      archDetails.merge_statement = `MERGE INTO ${targetTable.id} t USING ${sourceTable.id} s ON t.id = s.id WHEN MATCHED THEN UPDATE SET ...`;
    }
    
    arches.push(archDetails);
  }

  return arches;
};

// Generate a dataset with table nodes and connections
export const generateMockDataset = (tableCount: number = 10) => {
  const tables = generateMockTables(tableCount);
  const arches = generateMockArches(tables);
  return { tables, arches };
};
