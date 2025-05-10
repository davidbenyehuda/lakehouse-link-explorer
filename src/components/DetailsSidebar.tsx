import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table as TableType, ArchDetails } from "../types/tables";
import { ExternalLink, RefreshCw, ArrowUpDown as SyncIcon, Database } from 'lucide-react';

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
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [refreshStartTime, setRefreshStartTime] = useState("");
  const [syncStartTime, setSyncStartTime] = useState("");
  const [syncEndTime, setSyncEndTime] = useState("");

  if (!selectedTable && !selectedArch) {
    return null;
  }

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleRecreate = () => {
    console.log("Recreate/Migrate table:", selectedTable?.source_id);
    // Implement actual recreate logic here
  };

  const handleRefresh = (startTime: string) => {
    console.log("Refresh table:", selectedTable?.source_id, "Start time:", startTime);
    setShowRefreshDialog(false);
    // Implement actual refresh logic here
  };

  const handleSync = (startTime: string, endTime: string) => {
    console.log("Sync table:", selectedTable?.source_id, "Start time:", startTime, "End time:", endTime);
    setShowSyncDialog(false);
    // Implement actual sync logic here
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
                <div>{selectedTable.last_accessed ? formatDate(selectedTable.last_accessed) : 'N/A'}</div>
                <div className="font-medium">Query Count:</div>
                <div>{selectedTable.query_count || 'N/A'}</div>
              </div>
            </div>

            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRecreate}
                  className="flex items-center gap-1"
                >
                  <Database size={16} />
                  Recreate/Migrate
                </Button>
                
                <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Refresh Table</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input 
                          id="startTime" 
                          type="datetime-local" 
                          value={refreshStartTime} 
                          onChange={(e) => setRefreshStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRefreshDialog(false)}>Cancel</Button>
                      <Button onClick={() => handleRefresh(refreshStartTime)}>Refresh</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <SyncIcon size={16} />
                      Sync
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sync Table</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="syncStartTime">Start Time</Label>
                        <Input 
                          id="syncStartTime" 
                          type="datetime-local" 
                          value={syncStartTime} 
                          onChange={(e) => setSyncStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="syncEndTime">End Time</Label>
                        <Input 
                          id="syncEndTime" 
                          type="datetime-local" 
                          value={syncEndTime} 
                          onChange={(e) => setSyncEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Cancel</Button>
                      <Button onClick={() => handleSync(syncStartTime, syncEndTime)}>Sync</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Separator />

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
                  {selectedTable.columns?.map((col, index) => (
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

    // Calculate statistics from events if statistics object is not available
    const getStatistics = () => {
      if (selectedArch.statistics) return selectedArch.statistics;
      
      const events = selectedArch.events || [];
      const totalRows = events.reduce((sum, event) => sum + event.rows_affected, 0);
      const avgRunTime = events.length ? 
        (events.reduce((sum, event) => sum + event.duration_ms, 0) / events.length / 1000).toFixed(2) : 
        '0';
      
      return {
        count: events.length,
        rows: totalRows,
        avgRunTime,
        lastCompletedEvent: selectedArch.last_completed_time ? 
          formatDate(selectedArch.last_completed_time) : 'N/A',
        avgTimeBetweenEvents: selectedArch.avg_time_between_events_ms ? 
          (selectedArch.avg_time_between_events_ms / 1000).toFixed(2) : '0',
      };
    };

    const statistics = getStatistics();

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
                  <div>{statistics.count}</div>
                  <div className="font-medium">Rows:</div>
                  <div>{statistics.rows.toLocaleString()}</div>
                  <div className="font-medium">Avg. Run Time:</div>
                  <div>{statistics.avgRunTime}s</div>
                  <div className="font-medium">Last Completed:</div>
                  <div>{statistics.lastCompletedEvent}</div>
                  <div className="font-medium">Avg. Time Between Events:</div>
                  <div>{statistics.avgTimeBetweenEvents} seconds</div>
                </div>
              </div>

              {selectedArch.insertion_type === 'insert_upsert' && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Upsert Configuration</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Primary Key:</div>
                      <div className="font-mono">{selectedArch.primary_key || 'N/A'}</div>
                      <div className="font-medium">Order By:</div>
                      <div className="font-mono">{selectedArch.order_by || 'N/A'}</div>
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
                      {selectedArch.merge_statement || 'No merge statement provided'}
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
                  {selectedArch.sql_query || 'No SQL query available'}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <div className="space-y-3">
                {selectedArch.events.map((event, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Event</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="font-medium">Rows Affected:</span>
                      <span>{event.rows_affected.toLocaleString()}</span>
                      
                      <span className="font-medium">Duration:</span>
                      <span>{(event.duration_ms / 1000).toFixed(2)} seconds</span>
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
