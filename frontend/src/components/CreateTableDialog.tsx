import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableColumn, OperationType } from "@/types/api";
import { PlusCircle } from "lucide-react";

interface TableMappings {
  datafactories: { [id: string]: string };
  projects: { [id: string]: string };
  sources: { [id: string]: string };
  table_names: { [id: string]: string };
}

interface CreateTableDialogProps {
  tables: Table[];
  dataFactories: string[];
  projects: string[];
  onTableCreate: (tableData: Partial<Table>, sourceTableId?: string) => void;
  sourceTableId?: string | null;
  tableMappings: {
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
    table_names: { [id: string]: string };
  };
}

const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  tables,
  dataFactories,
  projects,
  onTableCreate,
  sourceTableId,
  tableMappings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [selectedDataFactory, setSelectedDataFactory] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [insertionType, setInsertionType] = useState<OperationType>('insert_custom');
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('string');

  const sourceTable = tables.find(t => t.table_id === sourceTableId);

  useEffect(() => {
    if (isOpen) {
      if (dataFactories.length > 0 && !selectedDataFactory) {
        setSelectedDataFactory(dataFactories[0]);
      }
      if (projects.length > 0 && !selectedProject) {
        setSelectedProject(projects[0]);
      }
      if (sourceTable) {
        setTableName(`derived_${sourceTable.table_name}`);
        setColumns(sourceTable.columns || []);
        if (sourceTable.datafactory_id && dataFactories.includes(sourceTable.datafactory_id)) {
          setSelectedDataFactory(sourceTable.datafactory_id);
        }
        if (sourceTable.project_id && projects.includes(sourceTable.project_id)) {
          setSelectedProject(sourceTable.project_id);
        }
        setInsertionType('insert_custom');
      } else {
        setTableName('');
        setColumns([]);
        if (dataFactories.length > 0) setSelectedDataFactory(dataFactories[0]);
        if (projects.length > 0) setSelectedProject(projects[0]);
        setInsertionType('insert_custom');
      }
    }
  }, [isOpen, dataFactories, projects, sourceTable, selectedDataFactory, selectedProject]);

  const handleAddColumn = () => {
    if (newColumnName.trim() !== '' && newColumnType.trim() !== '') {
      setColumns([...columns, new TableColumn(newColumnName.trim(), newColumnType.trim())]);
      setNewColumnName('');
      setNewColumnType('string');
    }
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const tableData: Partial<Table> = {
      source_name: tableName,
      table_name: tableName,
      datafactory_id: selectedDataFactory,
      project_id: selectedProject,
      columns: columns,
      insertion_type: sourceTableId ? (insertionType as OperationType) : undefined,
    };
    onTableCreate(tableData, sourceTableId || undefined);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {sourceTableId ? (
          <Button variant="outline" size="sm" className="text-xs">
            Create Derived Table from {sourceTable?.table_name}
          </Button>
        ) : (
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Table
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{sourceTableId ? `Create Derived Table from ${sourceTable?.table_name}` : 'Create New Table'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="table-name" className="text-right">
              Table Name
            </Label>
            <Input
              id="table-name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., my_new_table"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data-factory" className="text-right">
              Data Factory
            </Label>
            <Select value={selectedDataFactory} onValueChange={setSelectedDataFactory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Data Factory" />
              </SelectTrigger>
              <SelectContent>
                {dataFactories.map((df) => (
                  <SelectItem key={df} value={df}>
                    {tableMappings.datafactories[df] || df}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">
              Project
            </Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj} value={proj}>
                    {tableMappings.projects[proj] || proj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sourceTableId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="insertion-type" className="text-right">
                Insertion Type
              </Label>
              <Select value={insertionType} onValueChange={(value) => setInsertionType(value as OperationType)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Insertion Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert_stage_1">Stage 1 (Transformation)</SelectItem>
                  <SelectItem value="insert_upsert">Upsert</SelectItem>
                  <SelectItem value="insert_custom">Custom SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="mt-4">
            <Label className="font-semibold">Columns</Label>
            <div className="max-h-48 overflow-y-auto mt-2 space-y-2 pr-2">
              {columns.map((col, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <Input
                    value={col.name}
                    onChange={(e) => {
                      const newCols = [...columns];
                      newCols[index].name = e.target.value;
                      setColumns(newCols);
                    }}
                    placeholder="Column Name"
                    className="flex-grow"
                  />
                  <Input
                    value={col.type}
                    onChange={(e) => {
                      const newCols = [...columns];
                      newCols[index].type = e.target.value;
                      setColumns(newCols);
                    }}
                    placeholder="Column Type (e.g. string, int)"
                    className="flex-grow"
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveColumn(index)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-grow">
                <Label htmlFor="new-col-name" className="text-xs">New Column Name</Label>
                <Input
                  id="new-col-name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g., user_id"
                />
              </div>
              <div className="flex-grow">
                <Label htmlFor="new-col-type" className="text-xs">New Column Type</Label>
                <Input
                  id="new-col-type"
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  placeholder="e.g., string"
                />
              </div>
              <Button onClick={handleAddColumn} variant="outline" size="sm">Add Column</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTableDialog;
