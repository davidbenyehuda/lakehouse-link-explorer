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
import { Table as TableType, ArchDetails } from "../types/api";
import { ExternalLink, RefreshCw, ArrowUpDown as SyncIcon, Database, X, Lock } from 'lucide-react';

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
  const [showAllColumns, setShowAllColumns] = useState(false);

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
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedTable.source_name}</h2>
              {selectedTable.locked && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md">
                  <Lock size={16} />
                  <span className="text-sm font-medium">Locked</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Datafactory: {selectedTable.datafactory_name} • Project: {selectedTable.project_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <Tabs defaultValue="overview" className="flex-grow flex flex-col">
          <TabsList className="p-2 justify-start border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto">
            <TabsContent value="overview" className="p-4 space-y-4 h-full">
              <div>
                <h4 className="text-sm font-medium mb-2">Table Information</h4>
                <div className='text-sm text-gray-500'> locked: {selectedTable.locked ? 'true' : 'false'}</div>
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-md">
                <div className="font-medium">Table name:</div>
                <div>{selectedTable.table_name}</div>
                  <div className="font-medium">Source ID:</div>
                  <div>{selectedTable.source_id}</div>
                  <div className="font-medium">Row Count:</div>
                  <div>{selectedTable.row_count.toLocaleString()}</div>
                  <div className="font-medium">Size:</div>
                  <div>{selectedTable.size_in_mb} MB</div>
                  <div className="font-medium">Last Updated:</div>
                  <div>{selectedTable.last_updated ? formatDate(selectedTable.last_updated) : 'N/A'}</div>
                  <div className="font-medium">Query Count:</div>
                  <div>{selectedTable.query_count || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Column Summary</h4>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  <p>Total Columns: {selectedTable.columns?.length || 0}</p>
                  {selectedTable.columns && selectedTable.columns.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-xs font-medium mb-1">First 3 columns:</h5>
                      <div className="space-y-1">
                        {selectedTable.columns.slice(0, 3).map((col, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="font-mono">{col.name}</span>
                            <span className="text-gray-500 font-mono">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="p-4 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Table Schema</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllColumns(!showAllColumns)}
                >
                  {showAllColumns ? 'Show Less' : 'Show All'}
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllColumns ? selectedTable.columns : selectedTable.columns?.slice(0, 5))?.map((col, index) => (
                      <TableRow key={index}>
                        <TableCell className="w-10">{index + 1}</TableCell>
                        <TableCell className="font-mono">{col.name}</TableCell>
                        <TableCell className="font-mono text-gray-600">{col.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!showAllColumns && selectedTable.columns && selectedTable.columns.length > 5 && (
                  <div className="text-center p-2 text-sm text-gray-500">
                    + {selectedTable.columns.length - 5} more columns
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="p-4 space-y-4 h-full">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecreate}
                  className="flex items-center gap-1 h-auto py-2"
                >
                  <Database size={16} />
                  <div className="flex flex-col items-start">
                    <span>Recreate/Migrate</span>
                    <span className="text-xs text-gray-500">Reset table structure</span>
                  </div>
                </Button>

                <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 h-auto py-2"
                    >
                      <RefreshCw size={16} />
                      <div className="flex flex-col items-start">
                        <span>Refresh</span>
                        <span className="text-xs text-gray-500">Update table data</span>
                      </div>
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
                      className="flex items-center gap-1 h-auto py-2"
                    >
                      <SyncIcon size={16} />
                      <div className="flex flex-col items-start">
                        <span>Sync</span>
                        <span className="text-xs text-gray-500">Time-based synchronization</span>
                      </div>
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

                <Button variant="outline" size="sm" className="flex items-center gap-1 h-auto py-2">
                  <ExternalLink size={16} />
                  <div className="flex flex-col items-start">
                    <span>Query Stats</span>
                    <span className="text-xs text-gray-500">View query performance</span>
                  </div>
                </Button>

                <Button variant="outline" size="sm" className="flex items-center gap-1 h-auto py-2">
                  <ExternalLink size={16} />
                  <div className="flex flex-col items-start">
                    <span>Storage Stats</span>
                    <span className="text-xs text-gray-500">View storage usage</span>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  };

  const getInsertionTypeBadge = (type: string) => {
    switch (type) {
      case 'insert_stage_0':
        return <Badge className="bg-[#4361ee]">insert_stage_0 (Raw JSON)</Badge>;
      case 'insert_stage_1':
        return <Badge className="bg-[#4cc9f0]">insert_stage_1 (Transform)</Badge>;
      case 'insert_upsert':
        return <Badge className="bg-[#7209b7] text-white">insert_upsert (Upsert)</Badge>;
      case 'insert_custom':
        return <Badge className="bg-[#f72585] text-white">insert_custom (Custom)</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getInsertionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-[#4361ee]">active</Badge>;
      case 'in_progress':
        return <Badge className="bg-[#4cc9f0]">active</Badge>;
      case 'empty':
        return <Badge className="bg-[#4361ee]">empty</Badge>;
      case 'failure':
        return <Badge className="bg-[#f72585] text-white">Failure</Badge>;
      case 'hold':
        return <Badge className="bg-[#4361ee] text-white">hold</Badge>;
     
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getInvestigationUrl = (archDetails: ArchDetails) => {
    const params = new URLSearchParams({
      source: archDetails.source,
      target: archDetails.target,
      insertion_type: archDetails.insertion_type,
      status: archDetails.status,
      id: archDetails.id.toString()
    });
    return `/investigation?${params.toString()}`;
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
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Data Transfer</h2>
            <p className="text-sm text-gray-500">
              From <span className="font-medium">{selectedArch.source}</span> to <span className="font-medium">{selectedArch.target}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <Tabs defaultValue="overview" className="flex-grow flex flex-col">
          <TabsList className="p-2 justify-start border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto">
            <TabsContent value="overview" className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Insertion Type:</span>
                {getInsertionTypeBadge(selectedArch.insertion_type)}
              </div>
              <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
                <div className="flex items-center gap-2">
                  {getInsertionStatusBadge(selectedArch.status)}
                  {selectedArch.status === 'failure' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => window.open(getInvestigationUrl(selectedArch), '_blank')}
                    >
                      Investigate
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-md">
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
                <div>
                  <h4 className="text-sm font-medium mb-2">Upsert Configuration</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-md">
                    <div className="font-medium">Primary Key:</div>
                    <div className="font-mono">{selectedArch.primary_key || 'N/A'}</div>
                    <div className="font-medium">Order By:</div>
                    <div className="font-mono">{selectedArch.order_by || 'N/A'}</div>
                  </div>
                </div>
              )}

              {selectedArch.insertion_type === 'insert_custom' && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Custom Merge Statement</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="font-mono text-xs overflow-x-auto">
                      {selectedArch.merge_statement || 'No merge statement provided'}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sql" className="p-4">
              <h4 className="text-sm font-medium mb-2">SQL Query</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {selectedArch.sql_query || 'No SQL query available'}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="events" className="p-4">
              <h4 className="text-sm font-medium mb-2">Event History</h4>
              <div className="space-y-3">
                {selectedArch.events.map((event, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Event #{index + 1}</span>
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
          </div>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="h-full">
      {selectedTable ? renderTableDetails() : null}
      {selectedArch ? renderArchDetails() : null}
    </div>
  );
};

export default DetailsSidebar;
