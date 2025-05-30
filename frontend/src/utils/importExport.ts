
import { Table, ArchDetails } from '../types/api';
import { saveAs } from 'file-saver';

interface ExportData {
  tables: Table[];
  arches: ArchDetails[];
  version: string;
  exportedAt: string;
}

/**
 * Exports tables and arches data to a JSON file
 */
export const exportData = (tables: Table[], arches: ArchDetails[]): void => {
  const data: ExportData = {
    tables,
    arches,
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `tables-tree-export-${new Date().toISOString().slice(0, 10)}.json`);
};

/**
 * Reads an imported JSON file and returns the parsed data
 */
export const importDataFromFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;

        // Validate imported data
        if (!data.tables || !Array.isArray(data.tables) || !data.arches || !Array.isArray(data.arches)) {
          reject(new Error('Invalid data format: Missing tables or arches array'));
          return;
        }

        // Check if tables have required properties
        const validTables = data.tables.every(table =>
          table.id && typeof table.id === 'string' &&
          table.source_id && typeof table.source_id === 'string' &&
          table.datafactory_id && typeof table.datafactory_id === 'string' &&
          table.project_id && typeof table.project_id === 'string'
        );

        if (!validTables) {
          reject(new Error('Invalid table data: Missing required properties'));
          return;
        }

        // Check if arches have required properties
        const validArches = data.arches.every(arch =>
          arch.id && typeof arch.id === 'string' &&
          arch.source && typeof arch.source === 'string' &&
          arch.target && typeof arch.target === 'string' &&
          arch.insertion_type && typeof arch.insertion_type === 'string' &&
          arch.events && Array.isArray(arch.events)
        );

        if (!validArches) {
          reject(new Error('Invalid arch data: Missing required properties'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse imported file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read imported file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Loads initial data from a static JSON file at startup
 */
export const loadInitialData = async (): Promise<ExportData | null> => {
  try {
    const response = await fetch('/data/initial-data.json');
    if (!response.ok) {
      console.warn('Initial data file not found, using generated mock data');
      return null;
    }
    const data = await response.json();
    return data as ExportData;
  } catch (error) {
    console.warn('Failed to load initial data, using generated mock data', error);
    return null;
  }
};
