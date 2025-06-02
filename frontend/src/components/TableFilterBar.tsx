import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon, ChevronDown } from 'lucide-react';
import { FilterOptions } from '../types/api';

interface TableFilterBarProps {
  dataFactories: string[];
  projects: string[];
  onFilterChange: (filters: FilterOptions) => void;
  mappings: {
    datafactories: { [id: string]: string };
    projects: { [id: string]: string };
    sources: { [id: string]: string };
  };
  initialFilters?: FilterOptions;
}

const TableFilterBar: React.FC<TableFilterBarProps> = ({
  dataFactories,
  projects,
  onFilterChange,
  mappings,
  initialFilters
}) => {
  const [selectedDataFactories, setSelectedDataFactories] = useState<string[]>(initialFilters?.datafactory_id || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialFilters?.project_id || []);
  const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);

  useEffect(() => {
    const newFilters: FilterOptions = {};
    if (selectedDataFactories.length > 0) {
      newFilters.datafactory_id = selectedDataFactories;
    }
    if (selectedProjects.length > 0) {
      newFilters.project_id = selectedProjects;
    }
    if (startDate) {
      newFilters.startDate = startDate;
    }
    if (endDate) {
      newFilters.endDate = endDate;
    }
    onFilterChange(newFilters);
  }, [selectedDataFactories, selectedProjects, startDate, endDate, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedDataFactories([]);
    setSelectedProjects([]);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    setStartDate(oneYearAgo);
    setEndDate(new Date());
    onFilterChange({
      startDate: oneYearAgo,
      endDate: new Date(),
      datafactory_id: [],
      project_id: [],
    });
  };

  let activeFilterGroups = 0;
  const initialStartDate = initialFilters?.startDate;
  const initialEndDate = initialFilters?.endDate;
  if (selectedDataFactories.length > 0) activeFilterGroups++;
  if (selectedProjects.length > 0) activeFilterGroups++;
  if (startDate && (!initialStartDate || startDate.getTime() !== initialStartDate.getTime())) activeFilterGroups++;
  if (endDate && (!initialEndDate || endDate.getTime() !== initialEndDate.getTime())) activeFilterGroups++;

  const hasActiveFilters = selectedDataFactories.length > 0 ||
    selectedProjects.length > 0 ||
    (startDate && (!initialStartDate || startDate.getTime() !== initialStartDate.getTime())) ||
    (endDate && (!initialEndDate || endDate.getTime() !== initialEndDate.getTime()));

  const getSelectedItemsText = (selectedItems: string[], allItems: string[], mapping: { [id: string]: string }, placeholder: string) => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1) return mapping[selectedItems[0]] || selectedItems[0];
    return `${selectedItems.length} selected`;
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <FilterIcon size={16} />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <div className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center ml-1">
              {activeFilterGroups}
            </div>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Data Factory</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs w-full justify-between">
                {getSelectedItemsText(selectedDataFactories, dataFactories, mappings.datafactories, "All Data Factories")}
                <ChevronDown size={14} className="ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Data Factories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dataFactories.map((factory) => (
                <DropdownMenuCheckboxItem
                  key={factory}
                  checked={selectedDataFactories.includes(factory)}
                  onCheckedChange={(checked) => {
                    setSelectedDataFactories(prev =>
                      checked ? [...prev, factory] : prev.filter(f => f !== factory)
                    );
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  {mappings.datafactories[factory] || factory}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">Project</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs w-full justify-between">
                {getSelectedItemsText(selectedProjects, projects, mappings.projects, "All Projects")}
                <ChevronDown size={14} className="ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {projects.map((project) => (
                <DropdownMenuCheckboxItem
                  key={project}
                  checked={selectedProjects.includes(project)}
                  onCheckedChange={(checked) => {
                    setSelectedProjects(prev =>
                      checked ? [...prev, project] : prev.filter(p => p !== project)
                    );
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  {mappings.projects[project] || project}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-full justify-start text-left font-normal text-xs">
                <CalendarIcon className="mr-2 h-3 w-3" />
                {startDate ? format(startDate, "PP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-full justify-start text-left font-normal text-xs">
                <CalendarIcon className="mr-2 h-3 w-3" />
                {endDate ? format(endDate, "PP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default TableFilterBar;
