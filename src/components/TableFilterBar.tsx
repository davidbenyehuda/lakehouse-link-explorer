
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import { FilterOptions } from '../types/tables';

interface TableFilterBarProps {
  dataFactories: string[];
  projects: string[];
  onFilterChange: (filters: FilterOptions) => void;
}

const TableFilterBar: React.FC<TableFilterBarProps> = ({ 
  dataFactories, 
  projects,
  onFilterChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDataFactory, setSelectedDataFactory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    const newFilters: FilterOptions = {};
    if (selectedDataFactory !== 'all') {
      newFilters.datafactory_id = selectedDataFactory;
    }
    if (selectedProject !== 'all') {
      newFilters.project_id = selectedProject;
    }
    if (startDate) {
      newFilters.startDate = startDate;
    }
    if (endDate) {
      newFilters.endDate = endDate;
    }
    onFilterChange(newFilters);
  }, [selectedDataFactory, selectedProject, startDate, endDate, onFilterChange]);
  
  const handleClearFilters = () => {
    setSelectedDataFactory('all');
    setSelectedProject('all');
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  const currentFilters: FilterOptions = {};
  if (selectedDataFactory !== 'all') {
    currentFilters.datafactory_id = selectedDataFactory;
  }
  if (selectedProject !== 'all') {
    currentFilters.project_id = selectedProject;
  }
  if (startDate) {
    currentFilters.startDate = startDate;
  }
  if (endDate) {
    currentFilters.endDate = endDate;
  }
  
  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1"
        >
          <FilterIcon size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <div className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {Object.keys(currentFilters).length}
            </div>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 bg-white p-2 rounded-md shadow-sm">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Client</label>
            <Select
              value={selectedDataFactory}
              onValueChange={(value) => setSelectedDataFactory(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Clients" />
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
            <label className="text-xs text-gray-600 mb-1 block">Project</label>
            <Select
              value={selectedProject}
              onValueChange={(value) => setSelectedProject(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-start text-left font-normal text-xs"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {startDate ? (
                    format(startDate, "PP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
          
          <div>
            <label className="text-xs text-gray-600 mb-1 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-start text-left font-normal text-xs"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {endDate ? (
                    format(endDate, "PP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
        </div>
      )}
    </div>
  );
};

export default TableFilterBar;
