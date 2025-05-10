
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table as TableType, ArchDetails, TableEvent } from "../types/tables";
import { ExternalLink } from 'lucide-react';

interface DetailsSidebarProps {
  selectedTable?: TableType | null;
  selectedArch?: ArchDetails | null;
  onClose: () => void;
}

const DetailsSidebar: React.FC<DetailsSidebarProps> = ({
  selectedTable,
  selectedArch,
  onClose,
}) => {
  if (!selectedTable && !selectedArch) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTableDetails = () => {
    if (!selectedTable) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Table: {selectedTable.source_id}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="sr-only">Close</span>
              ✕
            </button>
          </CardTitle>
          <CardDescription>
            Client: {selectedTable.datafactory_id} • Project: {selectedTable.project_id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Table Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Source ID:</div>
                <div>{selectedTable.source_id}</div>
                <div className="font-medium">Row Count:</div>
                <div>{selectedTable.row_count.toLocaleString()}</div>
                <div className="font-medium">Size:</div>
                <div>{selectedTable.size_in_mb} MB</div>
                <div className="font-medium">Last Accessed:</div>
                <div>{formatDate(selectedTable.last_accessed)}</div>
                <div className="font-medium">Query Count:</div>
                <div>{selectedTable.query_count}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href="#" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <ExternalLink size={14} />
                Investigate Query Stats
              </a>
              <a href="#" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <ExternalLink size={14} />
                Storage Statistics
              </a>
              <a href="#" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <ExternalLink size={14} />
                Modify Schema
              </a>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Columns</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTable.columns.map((col, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{col.name}</TableCell>
                      <TableCell className="font-mono text-gray-600">{col.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getInsertionTypeBadge = (type: string) => {
    switch (type) {
      case 'insert_stage_0':
        return <Badge className="bg-[#4361ee]">Raw JSON</Badge>;
      case 'insert_stage_1':
        return <Badge className="bg-[#4cc9f0]">Transform</Badge>;
      case 'insert_upsert':
        return <Badge className="bg-[#7209b7] text-white">Upsert</Badge>;
      case 'insert_custom':
        return <Badge className="bg-[#f72585] text-white">Custom</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const renderArchDetails = () => {
    if (!selectedArch) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Transfer</span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="sr-only">Close</span>
              ✕
            </button>
          </CardTitle>
          <CardDescription>
            From {selectedArch.source} to {selectedArch.target}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Insertion Type:</span>
                {getInsertionTypeBadge(selectedArch.insertion_type)}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Batches:</div>
                  <div>{selectedArch.statistics.count}</div>
                  <div className="font-medium">Rows:</div>
                  <div>{selectedArch.statistics.rows.toLocaleString()}</div>
                  <div className="font-medium">Avg. Run Time:</div>
                  <div>{selectedArch.statistics.avgRunTime}s</div>
                  <div className="font-medium">Last Completed:</div>
                  <div>{formatDate(selectedArch.statistics.lastCompletedEvent)}</div>
                  <div className="font-medium">Avg. Time Between Events:</div>
                  <div>{selectedArch.statistics.avgTimeBetweenEvents} seconds</div>
                </div>
              </div>

              {selectedArch.insertion_type === 'insert_upsert' && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Upsert Configuration</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Primary Key:</div>
                      <div className="font-mono">{selectedArch.primary_key}</div>
                      <div className="font-medium">Order By:</div>
                      <div className="font-mono">{selectedArch.order_by}</div>
                    </div>
                  </div>
                </>
              )}

              {selectedArch.insertion_type === 'insert_custom' && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Custom Merge Statement</h4>
                    <div className="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto">
                      {selectedArch.merge_statement}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4">
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1">
                  <ExternalLink size={14} />
                  Investigate Insertion Performance
                </a>
              </div>
            </TabsContent>

            <TabsContent value="sql" className="mt-4">
              <div className="bg-gray-100 p-3 rounded-md">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {selectedArch.sql_query}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <div className="space-y-3">
                {selectedArch.events.map((event: TableEvent) => (
                  <div key={event.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{event.event_type}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="font-medium">Status:</span>
                      <span>{event.details.status}</span>
                      
                      {event.details.rows_affected !== undefined && (
                        <>
                          <span className="font-medium">Rows Affected:</span>
                          <span>{event.details.rows_affected.toLocaleString()}</span>
                        </>
                      )}
                      
                      {event.details.duration_seconds !== undefined && (
                        <>
                          <span className="font-medium">Duration:</span>
                          <span>{event.details.duration_seconds} seconds</span>
                        </>
                      )}
                      
                      {event.details.success !== undefined && (
                        <>
                          <span className="font-medium">Success:</span>
                          <span>{event.details.success ? 'Yes' : 'No'}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white p-4 h-screen overflow-y-auto animate-fade-in">
      {selectedTable ? renderTableDetails() : null}
      {selectedArch ? renderArchDetails() : null}
    </div>
  );
};

export default DetailsSidebar;
