import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Table } from '@/types/api';

interface TableSearchProps {
  tables: Table[];
  onTableSelect: (tableId: string) => void;
}

const TableSearch: React.FC<TableSearchProps> = ({ tables, onTableSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Table[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = tables.filter(table =>
      table.source_id.toLowerCase().includes(term) ||
      table.datafactory_id.toLowerCase().includes(term) ||
      table.project_id.toLowerCase().includes(term)
    );

    setSearchResults(results);
    setIsSearching(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTableClick = (tableId: string) => {
    onTableSelect(tableId);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Search tables..."
            className="pl-9 pr-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
      </div>

      {isSearching && (
        <div className="absolute mt-1 w-full max-h-72 overflow-y-auto bg-white rounded-md border z-50">
          {searchResults.length > 0 ? (
            <ul className="divide-y">
              {searchResults.map((table) => (
                <li
                  key={table.source_id}
                  className="p-2 text-sm hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleTableClick(table.source_id)}
                >
                  <div className="font-medium">{table.source_name || table.source_id}</div>
                  <div className="text-xs text-gray-600">
                    Client: {table.datafactory_id} • Project: {table.project_id}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-sm text-gray-500 text-center">
              No tables found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableSearch;
