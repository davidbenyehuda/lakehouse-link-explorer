
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArchDetails } from "../types/api";
import { Table } from '@/types/api';
import { ArrowUpDown } from 'lucide-react';

interface CreateArchDialogProps {
  tables: Table[];
  onArchCreate: (arch: Partial<ArchDetails>) => void;
  sourceNodeId: string;
  targetNodeId: string;
}

const CreateArchDialog: React.FC<CreateArchDialogProps> = ({
  tables,
  onArchCreate,
  sourceNodeId,
  targetNodeId,
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    target: '',
    insertion_type: '',
    primary_key: '',
    order_by: '',
    merge_statement: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Clear dependent fields when insertion type changes
      if (field === 'insertion_type') {
        if (value !== 'insert_upsert') {
          newData.primary_key = '';
          newData.order_by = '';
        }
        if (value !== 'insert_custom') {
          newData.merge_statement = '';
        }
      }

      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.source || !formData.target || !formData.insertion_type) {
      return;
    }

    // Validate additional fields based on insertion type
    if (formData.insertion_type === 'insert_upsert' && !formData.primary_key) {
      alert("Primary key is required for upsert operations.");
      return;
    }

    if (formData.insertion_type === 'insert_custom' && !formData.merge_statement) {
      alert("Merge statement is required for custom insertions.");
      return;
    }

    onArchCreate(formData);
    setOpen(false);
  };

  // Filter out the source table from target options to prevent self-references
  const getTargetOptions = () => {
    if (!formData.source) return tables;
    return tables.filter(table => table.source_id !== formData.source);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <ArrowUpDown size={16} />
          Create Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Data Connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source Table</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleChange('source', value)}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select Source Table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.source_id} value={table.source_id}>
                      {table.source_id} ({table.datafactory_id} - {table.project_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Table</Label>
              <Select
                value={formData.target}
                onValueChange={(value) => handleChange('target', value)}
                disabled={!formData.source}
              >
                <SelectTrigger id="target">
                  <SelectValue placeholder={formData.source ? "Select Target Table" : "Select source table first"} />
                </SelectTrigger>
                <SelectContent>
                  {getTargetOptions().map((table) => (
                    <SelectItem key={table.source_id} value={table.source_id}>
                      {table.source_id} ({table.datafactory_id} - {table.project_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insertion_type">Connection Type</Label>
              <Select
                value={formData.insertion_type}
                onValueChange={(value) => handleChange('insertion_type', value)}
                disabled={!formData.source || !formData.target}
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
                  <Label htmlFor="order_by">Order By (Optional)</Label>
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
          </div>

          <DialogFooter>
            <Button type="submit">Create Connection</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateArchDialog;
