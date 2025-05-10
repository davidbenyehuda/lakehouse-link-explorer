
import { Table, TableColumn, ArchDetails, ArchEvent } from '../types/tables';

// Helper function to generate random table data
const generateTable = (id: string, datafactory: string, project: string, layer: string): Table => {
  const layerSuffix = layer === 'raw' ? '' : `_${layer}`;
  const source_id = `${project}_${id}${layerSuffix}`;
  
  return {
    id,
    source_id,
    datafactory_id: datafactory,
    project_id: project,
    row_count: Math.floor(Math.random() * 10000) + 1000,
    size_in_mb: parseFloat((Math.random() * 100 + 10).toFixed(2)),
    columns: generateColumns(Math.floor(Math.random() * 10) + 5),
    position: { x: 0, y: 0 }, // Will be calculated dynamically
  };
};

// Helper function to generate random columns
const generateColumns = (count: number): TableColumn[] => {
  const columnTypes = ['string', 'integer', 'float', 'boolean', 'timestamp', 'array<string>', 'map<string,string>'];
  const columns: TableColumn[] = [];
  
  for (let i = 0; i < count; i++) {
    const name = `column_${i + 1}`;
    const type = columnTypes[Math.floor(Math.random() * columnTypes.length)];
    columns.push({ name, type });
  }
  
  return columns;
};

// Helper function to generate arch events
const generateEvents = (count: number, baseDate: Date): ArchEvent[] => {
  const events: ArchEvent[] = [];
  let currentDate = new Date(baseDate);
  
  for (let i = 0; i < count; i++) {
    // Subtract random hours to get earlier dates
    const hoursOffset = Math.floor(Math.random() * 12) + 1;
    currentDate = new Date(currentDate.getTime() - hoursOffset * 60 * 60 * 1000);
    
    const rowsAffected = Math.floor(Math.random() * 500) + 50;
    const durationMs = Math.floor(Math.random() * 5000) + 1000;
    
    events.push({
      timestamp: new Date(currentDate),
      rows_affected: rowsAffected,
      duration_ms: durationMs
    });
  }
  
  // Sort events by timestamp (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Calculate time between events
const calculateEventMetrics = (events: ArchEvent[]) => {
  if (events.length < 2) return { avgTimeBetweenMs: 0, lastCompletedTime: events[0]?.timestamp };
  
  const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let totalDiffMs = 0;
  
  for (let i = 1; i < sortedEvents.length; i++) {
    totalDiffMs += sortedEvents[i].timestamp.getTime() - sortedEvents[i-1].timestamp.getTime();
  }
  
  return {
    avgTimeBetweenMs: totalDiffMs / (sortedEvents.length - 1),
    lastCompletedTime: sortedEvents[sortedEvents.length - 1].timestamp
  };
};

// Mock data generation for the visualization
export const generateMockDataset = () => {
  const tables: Table[] = [];
  const arches: ArchDetails[] = [];
  
  // Factory 1 with Project A
  const factory1 = "datafactory_1";
  const projectA = "project_A";
  
  // Create raw table
  const rawTableA = generateTable("table_A1", factory1, projectA, "raw");
  tables.push(rawTableA);
  
  // Create stage tables from raw
  const stage0TableA = generateTable("table_A2", factory1, projectA, "stage_0");
  const stage1TableA = generateTable("table_A3", factory1, projectA, "stage_1");
  tables.push(stage0TableA, stage1TableA);
  
  // Create final custom derived table
  const customTableA = generateTable("table_A4", factory1, projectA, "custom");
  tables.push(customTableA);
  
  // Create arches between tables for Project A
  const baseDate = new Date();
  
  // Raw to Stage 0
  const archA1 = {
    id: "arch_A1",
    source: rawTableA.id,
    target: stage0TableA.id,
    insertion_type: "insert_stage_0",
    events: generateEvents(5, baseDate),
  };
  arches.push(archA1);
  
  // Raw to Stage 1
  const archA2 = {
    id: "arch_A2",
    source: rawTableA.id,
    target: stage1TableA.id,
    insertion_type: "insert_stage_1",
    events: generateEvents(4, baseDate),
  };
  arches.push(archA2);
  
  // Stage 0 to Custom
  const archA3 = {
    id: "arch_A3",
    source: stage0TableA.id,
    target: customTableA.id,
    insertion_type: "insert_upsert",
    events: generateEvents(3, baseDate),
  };
  arches.push(archA3);
  
  // Factory 2 with Project B
  const factory2 = "datafactory_2";
  const projectB = "project_B";
  
  // Create raw table
  const rawTableB = generateTable("table_B1", factory2, projectB, "raw");
  tables.push(rawTableB);
  
  // Create stage tables from raw
  const stage0TableB = generateTable("table_B2", factory2, projectB, "stage_0");
  const stage1TableB = generateTable("table_B3", factory2, projectB, "stage_1");
  tables.push(stage0TableB, stage1TableB);
  
  // Create final custom derived table
  const customTableB = generateTable("table_B4", factory2, projectB, "custom");
  tables.push(customTableB);
  
  // Create arches between tables for Project B
  
  // Raw to Stage 0
  const archB1 = {
    id: "arch_B1",
    source: rawTableB.id,
    target: stage0TableB.id,
    insertion_type: "insert_stage_0",
    events: generateEvents(6, baseDate),
  };
  arches.push(archB1);
  
  // Raw to Stage 1
  const archB2 = {
    id: "arch_B2",
    source: rawTableB.id,
    target: stage1TableB.id,
    insertion_type: "insert_stage_1",
    events: generateEvents(5, baseDate),
  };
  arches.push(archB2);
  
  // Stage 1 to Custom
  const archB3 = {
    id: "arch_B3",
    source: stage1TableB.id,
    target: customTableB.id,
    insertion_type: "insert_custom",
    events: generateEvents(4, baseDate),
  };
  arches.push(archB3);
  
  // Enhance arch data with calculated metrics
  arches.forEach(arch => {
    const metrics = calculateEventMetrics(arch.events);
    arch.avg_time_between_events_ms = metrics.avgTimeBetweenMs;
    arch.last_completed_time = metrics.lastCompletedTime;
  });
  
  return { tables, arches };
};
