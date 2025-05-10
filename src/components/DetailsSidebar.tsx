
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table as TableType, ArchDetails, TableEvent } from "../types/tables";

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
              </div>
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
        return <Badge className="bg-insertion-stage0">Raw JSON</Badge>;
      case 'insert_stage_1':
        return <Badge className="bg-insertion-stage1">Transform</Badge>;
      case 'insert_upsert':
        return <Badge className="bg-insertion-upsert">Upsert</Badge>;
      case 'insert_custom':
        return <Badge className="bg-insertion-custom">Custom</Badge>;
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
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
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
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
