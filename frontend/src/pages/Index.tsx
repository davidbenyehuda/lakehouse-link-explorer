import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TablesGraph from '../components/TablesGraph';
import { Table, ArchDetails, FilterOptions } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import ImportExportButtons from '../components/ImportExportButtons';
import TableFilterBar from '../components/TableFilterBar';
import { useLakehouseData } from '@/hooks/useLakehouseData';

const Index = () => {
  const {
    tables,
    arches,
    tableMappings,
    isLoading,
    fetchData,
    setTables,
    setArches,
    dataFactories,
    projects,
  } = useLakehouseData();

  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return {
      startDate: oneYearAgo,
      endDate: new Date(),
    };
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData(currentFilters);
  }, [fetchData, currentFilters.startDate, currentFilters.endDate]); // TODO: resturected the fetchData triggeriing filter change into someplace more appropriate and ordered - not in the useEffect (something like startRender or something)

  const handleAddTable = useCallback((newTable: Table, newArch?: ArchDetails) => {
    setTables(prev => [...prev, newTable]);
    if (newArch) {
      setArches(prev => [...prev, newArch]);
    }
    toast({
      title: "Table Created (In Memory)",
      description: `New table "${newTable.source_name}" has been added to the view.`
    });
  }, [toast, setTables, setArches]);

  const handleAddArch = useCallback((newArch: ArchDetails) => {
    setArches(prev => [...prev, newArch]);
    toast({
      title: "Connection Created (In Memory)",
      description: `New connection from "${newArch.source}" to "${newArch.target}" has been added to the view.`
    });
  }, [toast, setArches]);

  const handleImport = useCallback((importedTables: Table[], importedArches: ArchDetails[]) => {
    setTables(importedTables);
    setArches(importedArches);
    toast({
      title: "Data Imported",
      description: "Data has been imported successfully."
    });
  }, [toast, setTables, setArches]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    console.log("newFilters", newFilters);
    setCurrentFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  if (isLoading && tables.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-graph-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Tables-Tree</h2>
          <p className="text-gray-600">Fetching data...</p>
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
            <p className="text-gray-600">Visualizing table relationships</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="container mx-auto p-3">
          <TableFilterBar
            dataFactories={dataFactories}
            projects={projects}
            onFilterChange={handleFilterChange}
            mappings={tableMappings.labelMappings}
            initialFilters={currentFilters}
          />
        </div>
      </div>

      <div className="flex-grow relative overflow-hidden">
        <ReactFlowProvider>
          <TablesGraph
            tables={tables}
            arches={arches}
            tableMappings={tableMappings}
            currentFilters={currentFilters}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Index;
