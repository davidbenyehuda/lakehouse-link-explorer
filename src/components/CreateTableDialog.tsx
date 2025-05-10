
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table } from "../types/tables";
import { Plus } from "lucide-react";

interface CreateTableDialogProps {
  tables: Table[];
  dataFactories: string[];
  projects: string[];
  onTableCreate: (table: Partial<Table>, sourceTableId?: string) => void;
}

const CreateTableDialog: React.FC<CreateTableDialogProps> = ({ 
  tables, 
  dataFactories, 
  projects, 
  onTableCreate 
}) => {
  const [formData, setFormData] = useState({
    source_id: '',
    datafactory_id: '',
    project_id: '',
    size_in_mb: 0,
    row_count: 0,
    sourceTableId: ''
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTable: Partial<Table> = {
      source_id: formData.source_id,
      datafactory_id: formData.datafactory_id,
      project_id: formData.project_id,
      size_in_mb: formData.size_in_mb,
      row_count: formData.row_count
    };
    
    onTableCreate(newTable, formData.sourceTableId || undefined);
    
    // Reset form
    setFormData({
      source_id: '',
      datafactory_id: '',
      project_id: '',
      size_in_mb: 0,
      row_count: 0,
      sourceTableId: ''
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus size={16} />
          Create Table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 gap-4">
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
                  <SelectItem value="">None</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.source_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="row_count">Row Count</Label>
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
                <Label htmlFor="size_in_mb">Size (MB)</Label>
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
