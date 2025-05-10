
import React, { useState, useEffect } from 'react';
import { 
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { generateMockDataset } from '../utils/mockData';
import { Table, ArchDetails } from '../types/tables';

const Index = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [arches, setArches] = useState<ArchDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would fetch data from your API
    // For now, we'll use our mock data generator
    setIsLoading(true);
    
    try {
      const { tables, arches } = generateMockDataset(15);
      setTables(tables);
      setArches(arches);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graph-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Tables-Tree</h2>
          <p className="text-gray-600">Preparing visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-graph-background">
      <div className="absolute top-0 left-0 w-full bg-white z-10 p-4 border-b flex items-center">
        <h1 className="text-xl font-bold text-graph-text">Tables-Tree</h1>
        <p className="ml-4 text-gray-600">Visualizing table relationships in a managed lakehouse platform</p>
      </div>
      
      <div className="pt-16 h-full">
        <ReactFlowProvider>
          <TablesGraph tables={tables} arches={arches} />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Index;
