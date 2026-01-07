'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RequestModal } from '@/components/integration/RequestModal';
import {
  LuInbox,
  LuSend,
  LuRefreshCw,
  LuCheck,
  LuX,
  LuClock,
  LuTriangleAlert,
  LuUser,
  LuPlus,
} from 'react-icons/lu';
import clsx from 'clsx';

// Types
interface Identifier {
  system: string;
  value: string;
}

interface IncomingRequest {
  id: string;
  transactionId: string;
  requesterId: string;
  identifiers: Identifier[];
  resourceType: string;
  gatewayReturnUrl: string;
  reason?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  responseData?: Record<string, unknown>;
}

interface OutgoingTransaction {
  id: string;
  transactionId: string;
  targetId: string;
  resourceType: string;
  identifiers: Identifier[];
  status: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  receivedData?: Record<string, unknown> | null;
  receivedAt?: string | null;
}

type TabType = 'inbox' | 'outbox';

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState<OutgoingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incomingSummary, setIncomingSummary] = useState({ pending: 0, processing: 0, completed: 0 });
  const [outgoingSummary, setOutgoingSummary] = useState({ pending: 0, completed: 0 });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        fetch('/api/integration/incoming'),
        fetch('/api/integration/outgoing'),
      ]);

      if (incomingRes.ok) {
        const data = await incomingRes.json();
        setIncomingRequests(data.requests || []);
        setIncomingSummary(data.summary || { pending: 0, processing: 0, completed: 0 });
      }

      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        setOutgoingTransactions(data.transactions || []);
        setOutgoingSummary(data.summary || { pending: 0, completed: 0 });
      }
    } catch (err) {
      setError('Failed to fetch integration data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/integration/incoming/${id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/integration/incoming/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by user' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'SUCCESS':
        return <Badge variant="success">Success</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'REJECTED_BY_USER':
        return <Badge variant="error">Rejected by User</Badge>;
      case 'ERROR':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatIdentifiers = (identifiers: Identifier[]) => {
    return identifiers.map((id) => {
      const systemName = id.system.split('/').pop() || id.system;
      return `${systemName}: ${id.value}`;
    }).join(', ');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integration Hub</h1>
          <p className="text-slate-500 mt-1">
            Manage incoming data requests and track outgoing queries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsRequestModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <LuPlus className="w-4 h-4" />
            New Request
          </Button>
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <LuRefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <LuTriangleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <LuClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{incomingSummary.pending}</p>
              <p className="text-sm text-slate-500">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LuInbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{incomingSummary.completed}</p>
              <p className="text-sm text-slate-500">Inbox Processed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LuSend className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{outgoingSummary.pending}</p>
              <p className="text-sm text-slate-500">Outbox Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <LuCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{outgoingSummary.completed}</p>
              <p className="text-sm text-slate-500">Outbox Complete</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'inbox'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <LuInbox className="w-4 h-4" />
            Inbox
            {incomingSummary.pending > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {incomingSummary.pending}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outbox')}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'outbox'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <LuSend className="w-4 h-4" />
            Outbox
          </button>
        </nav>
      </div>

      {/* Content */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <LuRefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Loading...
          </div>
        ) : activeTab === 'inbox' ? (
          <InboxTable
            requests={incomingRequests}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            formatIdentifiers={formatIdentifiers}
          />
        ) : (
          <OutboxTable
            transactions={outgoingTransactions}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            formatIdentifiers={formatIdentifiers}
          />
        )}
      </Card>

      {/* Request Modal */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

// Inbox Table Component
function InboxTable({
  requests,
  onApprove,
  onReject,
  actionLoading,
  getStatusBadge,
  formatDate,
  formatIdentifiers,
}: {
  requests: IncomingRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatIdentifiers: (ids: Identifier[]) => string;
}) {
  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <LuInbox className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">No incoming requests</p>
        <p className="text-sm mt-1">Requests from other providers will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Request
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              From
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Identifiers
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Reason
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Received
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded">
                    <LuUser className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{request.resourceType}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {request.transactionId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-600 font-mono">
                  {request.requesterId.slice(0, 8)}...
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-600 max-w-xs truncate">
                  {formatIdentifiers(request.identifiers)}
                </p>
              </td>
              <td className="px-4 py-3">
                {request.reason || request.notes ? (
                  <div className="max-w-xs">
                    {request.reason && (
                      <p className="text-sm text-slate-700 font-medium">{request.reason}</p>
                    )}
                    {request.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{request.notes}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No reason provided</span>
                )}
              </td>
              <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-500">{formatDate(request.createdAt)}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {request.status === 'PENDING_APPROVAL' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onApprove(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex items-center gap-1"
                      >
                        <LuCheck className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <LuX className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </>
                  )}
                  {request.status === 'PROCESSING' && (
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Outbox Table Component
function OutboxTable({
  transactions,
  getStatusBadge,
  formatDate,
  formatIdentifiers,
}: {
  transactions: OutgoingTransaction[];
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatIdentifiers: (ids: Identifier[]) => string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <LuSend className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">No outgoing requests</p>
        <p className="text-sm mt-1">Requests you send to other providers will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Request
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              To Provider
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Identifiers
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Sent
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
              Response
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded">
                    <LuUser className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{tx.resourceType}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {tx.transactionId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-600 font-mono">{tx.targetId.slice(0, 8)}...</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-600 max-w-xs truncate">
                  {formatIdentifiers(tx.identifiers)}
                </p>
              </td>
              <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
              <td className="px-4 py-3">
                <p className="text-sm text-slate-500">{formatDate(tx.createdAt)}</p>
              </td>
              <td className="px-4 py-3">
                {tx.receivedData ? (
                  <span className="text-sm text-green-600">Data received</span>
                ) : tx.status === 'PENDING' ? (
                  <span className="text-sm text-slate-400">Waiting...</span>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}