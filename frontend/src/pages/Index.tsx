
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { generateMockDataset } from '../utils/mockData';
import { Table, ArchDetails } from '../types/tables';
import { useToast } from '@/hooks/use-toast';
import { loadInitialData } from '../utils/importExport';
import ImportExportButtons from '../components/ImportExportButtons';

const Index = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [arches, setArches] = useState<ArchDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Try to load initial data from file, fallback to mock data
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        const initialData = await loadInitialData();
        
        if (initialData) {
          setTables(initialData.tables);
          setArches(initialData.arches);
          toast({
            title: "Data Loaded",
            description: "Initial data loaded from file."
          });
        } else {
          const { tables, arches } = generateMockDataset();
          setTables(tables);
          setArches(arches);
          toast({
            title: "Mock Data Generated",
            description: "Using generated mock data for visualization."
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        const { tables, arches } = generateMockDataset();
        setTables(tables);
        setArches(arches);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  // Handle adding a new table
  const handleAddTable = useCallback((newTable: Table, newArch?: ArchDetails) => {
    setTables(prev => [...prev, newTable]);
    
    if (newArch) {
      setArches(prev => [...prev, newArch]);
    }
    
    toast({
      title: "Table Created",
      description: `New table "${newTable.source_id}" has been created.`
    });
  }, [toast]);

  const handleAddArch = useCallback((newArch: ArchDetails) => {
    setArches(prev => [...prev, newArch]);
    
    toast({
      title: "Connection Created",
      description: `New connection has been created.`
    });
  }, [toast]);

  const handleImport = useCallback((importedTables: Table[], importedArches: ArchDetails[]) => {
    setTables(importedTables);
    setArches(importedArches);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-graph-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Tables-Tree</h2>
          <p className="text-gray-600">Preparing visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-graph-background flex flex-col">
      <header className="bg-white z-10 p-4 border-b shadow-sm">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-graph-text">Tables-Tree</h1>
              <ImportExportButtons 
                tables={tables} 
                arches={arches} 
                onImport={handleImport} 
              />
            </div>
            <p className="text-gray-600">Visualizing table relationships in a managed lakehouse platform</p>
          </div>
        </div>
      </header>
      
      <div className="flex-grow relative overflow-hidden">
        <ReactFlowProvider>
          <TablesGraph 
            tables={tables} 
            arches={arches} 
            onAddTable={handleAddTable}
            onAddArch={handleAddArch}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Index;
