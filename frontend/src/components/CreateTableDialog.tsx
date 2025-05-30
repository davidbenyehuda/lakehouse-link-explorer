import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableColumn } from "../types/tables";
import { Plus } from "lucide-react";

interface CreateTableDialogProps {
  tables: Table[];
  dataFactories: string[];
  projects: string[];
  onTableCreate: (table: Partial<Table>, sourceTableId?: string, createAsSelect?: boolean) => void;
}

const CreateTableDialog: React.FC<CreateTableDialogProps> = ({ 
  tables, 
  dataFactories, 
  projects, 
  onTableCreate 
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    source_id: '',
    datafactory_id: '',
    project_id: '',
    size_in_mb: 0,
    row_count: 0,
    sourceTableId: 'none',
    createAsSelect: false,
    insertion_type: '',
    primary_key: '',
    order_by: '',
    merge_statement: '',
    columns: [] as TableColumn[]
  });
  
  const [showSchemaEditor, setShowSchemaEditor] = useState(true);
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('');
  const [schemaError, setSchemaError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        source_id: '',
        datafactory_id: dataFactories[0] || '',
        project_id: projects[0] || '',
        size_in_mb: 0,
        row_count: 0,
        sourceTableId: 'none',
        createAsSelect: false,
        insertion_type: '',
        primary_key: '',
        order_by: '',
        merge_statement: '',
        columns: []
      });
      setShowSchemaEditor(true);
      setSchemaError('');
    }
  }, [open, dataFactories, projects]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If source table is changed, reset related fields
      if (field === 'sourceTableId') {
        if (value === 'none') {
          newData.insertion_type = '';
          newData.primary_key = '';
          newData.order_by = '';
          newData.merge_statement = '';
          newData.createAsSelect = false;
          
          // If no source table, always show schema editor
          setShowSchemaEditor(true);
        } else {
          // If source table is selected, keep options
          setShowSchemaEditor(!newData.createAsSelect);
        }
      }
      
      // If create as select is toggled, update schema editor visibility
      if (field === 'createAsSelect') {
        setShowSchemaEditor(!value);
      }
      
      return newData;
    });
  };

  const addColumn = () => {
    if (columnName && columnType) {
      setFormData(prev => ({
        ...prev,
        columns: [...prev.columns, { name: columnName, type: columnType }]
      }));
      setColumnName('');
      setColumnType('');
      setSchemaError('');
    }
  };

  const removeColumn = (index: number) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.source_id || !formData.datafactory_id || !formData.project_id) {
      return;
    }
    
    // If no source table or not using createAsSelect, require schema
    if ((formData.sourceTableId === 'none' || !formData.createAsSelect) && formData.columns.length === 0) {
      setSchemaError("Please define at least one column for the table schema");
      return;
    }
    
    // If source table is selected but not 'none', require insertion type
    if (formData.sourceTableId !== 'none' && !formData.insertion_type) {
      setSchemaError("Please select an insertion type for the connection");
      return;
    }
    
    // Clear any previous errors
    setSchemaError('');
    
    onTableCreate(
      formData, 
      formData.sourceTableId !== 'none' ? formData.sourceTableId : undefined,
      formData.createAsSelect
    );
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus size={16} />
          Create Table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datafactory_id">Data Factory</Label>
                <Select
                  value={formData.datafactory_id}
                  onValueChange={(value) => handleChange('datafactory_id', value)}
                >
                  <SelectTrigger id="datafactory_id">
                    <SelectValue placeholder="Select Data Factory" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataFactories.map((df) => (
                      <SelectItem key={df} value={df}>{df}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_id">Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleChange('project_id', value)}
                >
                  <SelectTrigger id="project_id">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_id">Table Name</Label>
              <Input
                id="source_id"
                value={formData.source_id}
                onChange={(e) => handleChange('source_id', e.target.value)}
                placeholder="Enter table name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_table">Source Table (Optional)</Label>
              <Select
                value={formData.sourceTableId}
                onValueChange={(value) => handleChange('sourceTableId', value)}
              >
                <SelectTrigger id="source_table">
                  <SelectValue placeholder="Select Source Table (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.source_id} ({table.datafactory_id} - {table.project_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.sourceTableId !== 'none' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="createAsSelect" 
                    checked={formData.createAsSelect}
                    onCheckedChange={(checked) => handleChange('createAsSelect', !!checked)}
                  />
                  <Label htmlFor="createAsSelect">Create as SELECT (inherit schema)</Label>
                </div>
              </div>
            )}

            {formData.sourceTableId !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="insertion_type">Connection Type</Label>
                <Select
                  value={formData.insertion_type}
                  onValueChange={(value) => handleChange('insertion_type', value)}
                >
                  <SelectTrigger id="insertion_type">
                    <SelectValue placeholder="Select Connection Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insert_upsert">Upsert</SelectItem>
                    <SelectItem value="insert_custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.insertion_type === 'insert_upsert' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_key">Primary Key</Label>
                  <Input
                    id="primary_key"
                    value={formData.primary_key}
                    onChange={(e) => handleChange('primary_key', e.target.value)}
                    placeholder="e.g., id, customer_id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_by">Order By</Label>
                  <Input
                    id="order_by"
                    value={formData.order_by}
                    onChange={(e) => handleChange('order_by', e.target.value)}
                    placeholder="e.g., updated_at DESC"
                  />
                </div>
              </div>
            )}

            {formData.insertion_type === 'insert_custom' && (
              <div className="space-y-2">
                <Label htmlFor="merge_statement">Merge Statement</Label>
                <textarea
                  id="merge_statement"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.merge_statement}
                  onChange={(e) => handleChange('merge_statement', e.target.value)}
                  placeholder="MERGE INTO target USING source ON ..."
                />
              </div>
            )}

            {showSchemaEditor && (
              <div className="space-y-4">
                <Label>Table Schema</Label>
                
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="columnName" className="text-xs">Column Name</Label>
                    <Input
                      id="columnName"
                      value={columnName}
                      onChange={(e) => setColumnName(e.target.value)}
                      placeholder="e.g., id, name, email"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="columnType" className="text-xs">Type</Label>
                    <Input
                      id="columnType"
                      value={columnType}
                      onChange={(e) => setColumnType(e.target.value)}
                      placeholder="e.g., INTEGER, VARCHAR, TIMESTAMP"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={addColumn} className="mb-0">Add</Button>
                </div>
                
                {schemaError && (
                  <p className="text-red-500 text-sm">{schemaError}</p>
                )}
                
                {formData.columns.length > 0 && (
                  <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 px-2 text-xs">Name</th>
                          <th className="text-left py-1 px-2 text-xs">Type</th>
                          <th className="text-right py-1 px-2 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.columns.map((col, index) => (
                          <tr key={index} className="border-b text-sm">
                            <td className="py-1 px-2">{col.name}</td>
                            <td className="py-1 px-2">{col.type}</td>
                            <td className="py-1 px-2 text-right">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeColumn(index)}
                              >
                                ✕
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="row_count">Initial Row Count</Label>
                <Input
                  id="row_count"
                  type="number"
                  min="0"
                  value={formData.row_count}
                  onChange={(e) => handleChange('row_count', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size_in_mb">Initial Size (MB)</Label>
                <Input
                  id="size_in_mb"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.size_in_mb}
                  onChange={(e) => handleChange('size_in_mb', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit">Create Table</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTableDialog;
