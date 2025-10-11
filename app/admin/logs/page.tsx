"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, Download, Eye, Link, RefreshCw, Search, Shield, X } from 'lucide-react';

interface LogEntry {
  id: string;
  request_id: string;
  timestamp: string;
  severity: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  environment: string;
  user_id?: string;
  user_role?: string;
  franchise_id?: string;
  endpoint?: string;
  http_method?: string;
  error_message?: string;
  stacktrace?: string;
  response_status?: number;
  sql_queries?: any[];
  attachments?: any[];
}

interface LogsResponse {
  logs: {
    data: LogEntry[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  summary: {
    total: number;
    by_severity: Record<string, number>;
  };
  access_info: {
    scope: 'full' | 'redacted';
    user_role: string;
    auto_filtered: boolean;
  };
}

function AdminLogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [accessInfo, setAccessInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    request_id: searchParams.get('request_id') || '',
    user_id: searchParams.get('user_id') || '',
    endpoint: searchParams.get('endpoint') || '',
    severity: searchParams.get('severity') || 'all',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Check for signed token on mount
  useEffect(() => {
    const sid = searchParams.get('sid');
    if (sid && accessInfo.auto_filtered) {
      toast({
        title: "Deep Link Access",
        description: "Viewing logs via secure deep link",
        variant: "default",
      });
    }
  }, [searchParams, accessInfo, toast]);

  // Load logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      // Preserve signed token if present
      const sid = searchParams.get('sid');
      if (sid) params.append('sid', sid);

      const response = await apiClient.get(`/api/admin/logs?${params.toString()}`);
      const data = response.data as LogsResponse;

      setLogs(data.logs.data);
      setSummary(data.summary);
      setAccessInfo(data.access_info);

      // Auto-open detail if filtered to specific request
      if (data.access_info.auto_filtered && data.logs.data.length === 1) {
        setSelectedLog(data.logs.data[0]);
        setShowDetail(true);
      }

    } catch (error: any) {
      console.error('Failed to load logs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    // Preserve signed token
    const sid = searchParams.get('sid');
    if (sid) params.append('sid', sid);

    router.push(`/admin/logs?${params.toString()}`);
    loadLogs();
  };

  // Generate signed link
  const generateSignedLink = async (requestId: string) => {
    try {
      const response = await apiClient.post('/api/internal/logs/link', {
        request_id: requestId,
        expires_in_seconds: 3600,
        scope: 'redacted',
        reason: 'Manual link generation from admin dashboard'
      });

      const url = (response.data as any).url;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Signed Link Generated",
        description: "URL copied to clipboard",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate signed link",
        variant: "destructive",
      });
    }
  };

  // Download log
  const downloadLog = async (requestId: string) => {
    try {
      const params = new URLSearchParams({ download: 'true', request_id: requestId });
      const sid = searchParams.get('sid');
      if (sid) params.append('sid', sid);

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `log-${requestId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download log",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      case 'DEBUG': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">
            Debug and monitor system activity
            {accessInfo.auto_filtered && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Deep Link Access ({accessInfo.scope})
              </Badge>
            )}
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total || 0}</div>
          </CardContent>
        </Card>
        {Object.entries(summary.by_severity || {}).map(([severity, count]) => (
          <Card key={severity}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{severity}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count as number}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Request ID"
              value={filters.request_id}
              onChange={(e) => updateFilters({ request_id: e.target.value })}
            />
            <Input
              placeholder="User ID"
              value={filters.user_id}
              onChange={(e) => updateFilters({ user_id: e.target.value })}
            />
            <Input
              placeholder="Endpoint"
              value={filters.endpoint}
              onChange={(e) => updateFilters({ endpoint: e.target.value })}
            />
            <Select value={filters.severity} onValueChange={(value) => updateFilters({ severity: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <Input
              type="datetime-local"
              placeholder="From Date"
              value={filters.date_from}
              onChange={(e) => updateFilters({ date_from: e.target.value })}
            />
            <Input
              type="datetime-local"
              placeholder="To Date"
              value={filters.date_to}
              onChange={(e) => updateFilters({ date_to: e.target.value })}
            />
            <Input
              placeholder="Search message..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found for the current filters
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log);
                    setShowDetail(true);
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <Badge variant={getSeverityColor(log.severity) as any}>
                      {log.severity}
                    </Badge>
                    <div>
                      <div className="font-medium">{log.request_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm">
                      {log.endpoint && (
                        <Badge variant="outline">{log.http_method} {log.endpoint}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSignedLink(log.request_id);
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadLog(log.request_id);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Log Details: {selectedLog?.request_id}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedLog && generateSignedLink(selectedLog.request_id)}
                >
                  <Link className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedLog && downloadLog(selectedLog.request_id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed view of log entry and related information
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Badge variant={getSeverityColor(selectedLog.severity) as any}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <div className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Service</label>
                  <div className="text-sm">{selectedLog.service}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <div className="text-sm">{selectedLog.environment}</div>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium">Error Message</label>
                  <div className="text-sm bg-muted p-2 rounded">{selectedLog.error_message}</div>
                </div>
              )}

              {selectedLog.stacktrace && (
                <div>
                  <label className="text-sm font-medium">Stack Trace</label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {selectedLog.stacktrace}
                  </pre>
                </div>
              )}

              {selectedLog.sql_queries && selectedLog.sql_queries.length > 0 && (
                <div>
                  <label className="text-sm font-medium">SQL Queries</label>
                  <div className="space-y-2">
                    {selectedLog.sql_queries.map((query: any, index: number) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded">
                        <div className="font-medium">Query {index + 1} ({query.duration}ms)</div>
                        <pre className="whitespace-pre-wrap">{query.query}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminLogsPage() {
  // Wrap content in Suspense to support useSearchParams
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AdminLogsContent />
    </Suspense>
  )
}