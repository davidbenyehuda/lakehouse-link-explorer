import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table } from '@/types/api';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate background color based on datafactory_id for visual grouping
  const getBackgroundColor = () => {
    const colors = ['#c9e4de', '#d1e9ea', '#d6efee', '#e0f5f2', '#eaf8f6'];
    const colorIndex = parseInt(table.datafactory_id.split('_')[1]) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div
      className={`table-node bg-white p-2 border rounded-lg shadow-md w-[180px] cursor-grab active:cursor-grabbing ${selected ? 'ring-2 ring-graph-accent1' : ''} ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !min-w-2 !min-h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !min-w-2 !min-h-2"
      />

      <div className="table-node__header text-graph-text font-semibold text-sm flex justify-between items-center">
        <div className="truncate">{table.table_name}</div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent node selection when toggling expand
            setIsExpanded(!isExpanded);
          }}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!isExpanded && (
        <div className="mt-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Rows: {table.row_count.toLocaleString()}</span>
            <span>{table.size_in_mb} MB</span>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="table-node__content mt-2">
          <div className="text-xs text-gray-600 mb-1">
            <span>Client: {table.datafactory_id}</span>
            <span className="mx-2">•</span>
            <span>Project: {table.project_id}</span>
          </div>

          {table.columns && table.columns.length > 0 && (
            <div className="mt-2 text-xs">
              <div className="font-semibold mb-1">Columns:</div>
              <ul className="space-y-0.5 max-h-32 overflow-y-auto pr-1">
                {table.columns.slice(0, 3).map((col, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="font-mono">{col.name}</span>
                    <span className="text-gray-500 font-mono">{col.type}</span>
                  </li>
                ))}
                {table.columns.length > 3 && (
                  <li className="text-gray-500 italic text-center">
                    + {table.columns.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="table-node__footer mt-2 pt-1 text-xs border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span>Rows: {table.row_count.toLocaleString()}</span>
              <span>Size: {table.size_in_mb} MB</span>
            </div>

            <div className="mt-2 flex justify-between gap-1 text-xs">
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:underline flex items-center gap-0.5"
                title="Investigate Queries"
              >
                <ExternalLink size={10} /> Queries
              </a>
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:underline flex items-center gap-0.5"
                title="Edit Schema"
              >
                <ExternalLink size={10} /> Schema
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableNode;
