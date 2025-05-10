
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { FilterOptions } from '../types/tables';

interface TableFilterBarProps {
  dataFactories: string[];
  projects: string[];
  onFilterChange: (filters: FilterOptions) => void;
}

const TableFilterBar: React.FC<TableFilterBarProps> = ({ dataFactories, projects, onFilterChange }) => {
  const [datafactory, setDatafactory] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleFilterApply = () => {
    const filters: FilterOptions = {};
    
    if (datafactory) filters.datafactory_id = datafactory;
    if (project) filters.project_id = project;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setDatafactory("");
    setProject("");
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md flex flex-wrap gap-2 items-center">
      <div className="flex-grow min-w-[160px]">
        <Select value={datafactory} onValueChange={setDatafactory}>
          <SelectTrigger>
            <SelectValue placeholder="Select Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {dataFactories.map((factory) => (
              <SelectItem key={factory} value={factory}>
                {factory}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow min-w-[160px]">
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((proj) => (
              <SelectItem key={proj} value={proj}>
                {proj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow min-w-[160px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-grow min-w-[160px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Button onClick={handleFilterApply} className="bg-graph-node text-white">
        Apply Filters
      </Button>
      
      <Button variant="outline" onClick={handleClearFilters}>
        Clear
      </Button>
    </div>
  );
};

export default TableFilterBar;
