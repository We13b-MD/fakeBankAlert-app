import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown,
  Search, Filter, Calendar, Download, Eye, Loader2,
  AlertTriangle, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllAlerts } from '@/lib/api';

interface Alert {
  id: string;
  message: string;
  status: 'Real' | 'Fake' | 'Pending';
  date: string;
  bank: string;
  accountNumber: string;
  amount: string;
  type: 'Credit' | 'Debit';
}

const ITEMS_PER_PAGE = 10;

export default function AlertsHistory() {
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Real' | 'Fake' | 'Pending'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Credit' | 'Debit'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch ──
  /* const fetchAlerts = useCallback(async () => {
     setIsLoading(true);
     setError('');
     try {
       const data = await getAllAlerts();
       setAllAlerts(data);
     } catch (err) {
       console.error('Failed to fetch alerts:', err);
       setError('Failed to load alerts. Please try again.');
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     fetchAlerts();
   }, [fetchAlerts]);*/


  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllAlerts();

      const mapped = data.map((a: any) => ({
        id: a._id,
        message: `${a.transactionType === 'credit' ? 'Credit' : 'Debit'} Alert: ${a.extracted?.amount || '₦' + a.amount?.toLocaleString()
          } ${a.transactionType === 'credit' ? 'received' : 'sent'}`,
        status: a.confidence <= 0.3 ? 'Real' : a.confidence <= 0.6 ? 'Pending' : 'Fake',
        date: new Date(a.timestamp || a.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        bank: a.bankName || a.extracted?.bank || 'Unknown',
        accountNumber: a.accountNumber
          ? '****' + a.accountNumber.slice(-4)
          : a.extracted?.account || 'N/A',
        amount: a.extracted?.amount || '₦' + a.amount?.toLocaleString(),
        type: a.transactionType === 'credit' ? 'Credit' : 'Debit',
      }));

      setAllAlerts(mapped);
      console.log('✅ Alerts loaded:', mapped.length);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ── Filtering ──
  const filteredAlerts = allAlerts.filter((alert) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      alert.bank.toLowerCase().includes(q) ||
      alert.amount.toLowerCase().includes(q) ||
      alert.accountNumber.toLowerCase().includes(q) ||
      alert.message.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' || alert.status === statusFilter;
    const matchesType = typeFilter === 'All' || alert.type === typeFilter;

    const alertDate = new Date(alert.date);
    const matchesDateFrom = !dateFrom || alertDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || alertDate <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
  });

  // ── Pagination ──
  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, dateFrom, dateTo]);

  // ── Stats ──
  const stats = {
    total: allAlerts.length,
    real: allAlerts.filter((a) => a.status === 'Real').length,
    fake: allAlerts.filter((a) => a.status === 'Fake').length,
    pending: allAlerts.filter((a) => a.status === 'Pending').length,
  };

  // ── Export CSV ──
  const handleExport = () => {
    const headers = ['ID', 'Message', 'Status', 'Date', 'Bank', 'Account', 'Amount', 'Type'];
    const rows = filteredAlerts.map((a) => [
      a.id, a.message, a.status, a.date, a.bank, a.accountNumber, a.amount, a.type,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'All' || typeFilter !== 'All' || dateFrom || dateTo;

  const getStatusConfig = (status: Alert['status']) => {
    switch (status) {
      case 'Real':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        };
      case 'Fake':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600',
        };
      case 'Pending':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600',
        };
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading alerts history...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchAlerts} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Alerts History</h1>
            <p className="text-slate-500 text-sm">View and manage all your transaction alerts</p>
          </div>
          <Button onClick={fetchAlerts} variant="outline" size="sm" className="border-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Verified Real</p>
                <p className="text-2xl font-bold text-green-600">{stats.real}</p>
              </div>
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Detected Fake</p>
                <p className="text-2xl font-bold text-red-600">{stats.fake}</p>
              </div>
              <div className="p-2.5 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2.5 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by bank, amount, account..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${showFilters
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-teal-500 rounded-full" />
                )}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* ── Expanded Filters ── */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Real">Real</option>
                    <option value="Fake">Fake</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Results count ── */}
        {hasActiveFilters && (
          <p className="text-sm text-slate-500 mb-3">
            Showing <span className="font-semibold text-slate-900">{filteredAlerts.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{allAlerts.length}</span> alerts
          </p>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Transaction', 'Bank & Account', 'Amount', 'Status', 'Date & Time', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-slate-300" />
                        <p className="text-sm text-slate-500">No alerts match your filters</p>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="text-xs text-teal-600 hover:underline">
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAlerts.map((alert) => {
                    const statusConfig = getStatusConfig(alert.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alert.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                              {alert.type === 'Credit'
                                ? <TrendingUp className="w-4 h-4 text-green-600" />
                                : <TrendingDown className="w-4 h-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                              <p className="text-xs text-slate-400">{alert.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{alert.bank}</p>
                          <p className="text-xs text-slate-400">{alert.accountNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{alert.amount}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700">{alert.date}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-3">
            {paginatedAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Search className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-500">No alerts match your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-teal-600 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              paginatedAlerts.map((alert) => {
                const statusConfig = getStatusConfig(alert.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={alert.id}
                    className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${alert.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                        {alert.type === 'Credit'
                          ? <TrendingUp className="w-4 h-4 text-green-600" />
                          : <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{alert.message}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.color} whitespace-nowrap`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                            {alert.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <span>{alert.bank}</span>
                          <span>•</span>
                          <span>{alert.accountNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{alert.date}</span>
                          <span className="text-sm font-bold text-slate-900">{alert.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Pagination ── */}
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredAlerts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAlerts.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{filteredAlerts.length}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm text-slate-600 px-1">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}