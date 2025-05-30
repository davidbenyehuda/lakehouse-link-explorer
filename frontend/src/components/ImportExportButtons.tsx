
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Import, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, ArchDetails } from '../types/api';
import { exportData, importDataFromFile } from '../utils/importExport';

interface ImportExportButtonsProps {
  tables: Table[];
  arches: ArchDetails[];
  onImport: (tables: Table[], arches: ArchDetails[]) => void;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({ tables, arches, onImport }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(tables, arches);
    toast({
      title: "Export Successful",
      description: `Exported ${tables.length} tables and ${arches.length} arches.`
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importDataFromFile(file);

      onImport(importedData.tables, importedData.arches);

      toast({
        title: "Import Successful",
        description: `Imported ${importedData.tables.length} tables and ${importedData.arches.length} arches.`
      });

      // Reset file input to allow importing the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
        className="gap-1"
      >
        <FileJson size={16} />
        Export
      </Button>

      <Button
        variant="outline"
        onClick={handleImportClick}
        className="gap-1"
      >
        <Import size={16} />
        Import
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </Button>
    </div>
  );
};

export default ImportExportButtons;
