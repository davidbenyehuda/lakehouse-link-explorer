
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table } from '../types/tables';
import { ExternalLink } from 'lucide-react';

interface TableNodeProps {
  data: {
    table: Table;
    isFocused?: boolean;
  };
  selected?: boolean;
  id: string;
}

const TableNode: React.FC<TableNodeProps> = ({ data, selected, id }) => {
  const { table, isFocused } = data;
  
  // Calculate background color based on datafactory_id for visual grouping
  const getBackgroundColor = () => {
    const colors = ['#c9e4de', '#d1e9ea', '#d6efee', '#e0f5f2', '#eaf8f6'];
    const colorIndex = parseInt(table.datafactory_id.split('_')[1]) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div 
      className={`table-node bg-white p-3 border rounded-lg shadow-md max-w-xs ${selected ? 'ring-2 ring-graph-accent1' : ''} ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="table-node__header text-graph-text font-semibold text-sm">
        {table.source_id}
      </div>
      
      <div className="table-node__content">
        <div className="text-xs text-gray-600 mb-1">
          <span>Client: {table.datafactory_id}</span>
          <span className="mx-2">•</span>
          <span>Project: {table.project_id}</span>
        </div>
        
        {table.columns && table.columns.length > 0 ? (
          <div className="mt-2 text-xs">
            <div className="font-semibold mb-1">Columns:</div>
            <ul className="space-y-0.5 max-h-32 overflow-y-auto pr-1">
              {table.columns.slice(0, 5).map((col, index) => (
                <li key={index} className="flex justify-between">
                  <span className="font-mono">{col.name}</span>
                  <span className="text-gray-500 font-mono">{col.type}</span>
                </li>
              ))}
              {table.columns.length > 5 && (
                <li className="text-gray-500 italic text-center">
                  + {table.columns.length - 5} more
                </li>
              )}
            </ul>
          </div>
        ) : null}
      </div>
      
      <div className="table-node__footer mt-2 pt-1 text-xs border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span>Rows: {table.row_count.toLocaleString()}</span>
          <span>Size: {table.size_in_mb} MB</span>
        </div>
        
        <div className="mt-2 flex justify-between gap-1 text-xs">
          <a href="#" className="text-blue-600 hover:underline flex items-center gap-0.5" title="Investigate Queries">
            <ExternalLink size={10} /> Queries
          </a>
          <a href="#" className="text-blue-600 hover:underline flex items-center gap-0.5" title="Storage Stats">
            <ExternalLink size={10} /> Storage
          </a>
          <a href="#" className="text-blue-600 hover:underline flex items-center gap-0.5" title="Edit Schema">
            <ExternalLink size={10} /> Schema
          </a>
        </div>
      </div>
    </div>
  );
};

export default TableNode;
