
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterApply = () => {
    const filters: FilterOptions = {};
    
    if (datafactory && datafactory !== "all") filters.datafactory_id = datafactory;
    if (project && project !== "all") filters.project_id = project;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    onFilterChange(filters);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setDatafactory("");
    setProject("");
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  const toggleFilters = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const hasActiveFilters = datafactory || project || startDate || endDate;

  return (
    <div className="relative">
      <Button 
        onClick={toggleFilters} 
        variant={hasActiveFilters ? "default" : "outline"} 
        className="w-full flex justify-between items-center"
      >
        <Filter size={16} />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {Object.keys(filters).length}
          </span>
        )}
      </Button>
      
      {isFilterOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-md z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Tables</h3>
            <Button variant="ghost" size="sm" onClick={toggleFilters}>
              <X size={16} />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm mb-1 block">Client</label>
              <Select value={datafactory} onValueChange={setDatafactory}>
                <SelectTrigger className="w-full">
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
            
            <div>
              <label className="text-sm mb-1 block">Project</label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger className="w-full">
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
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm mb-1 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {startDate ? format(startDate, "P") : "Select..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm mb-1 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {endDate ? format(endDate, "P") : "Select..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleFilterApply} className="bg-graph-node text-white flex-1">
                Apply
              </Button>
              
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilterBar;
