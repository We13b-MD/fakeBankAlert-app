import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function RecentAlerts() {
  // Sample data - replace with real data later
  const alerts: Alert[] = [
    {
      id: '1',
      message: 'Credit Alert: ₦50,000 received',
      status: 'Real',
      date: '2 hours ago',
      bank: 'GTBank',
      accountNumber: '****1234',
      amount: '₦50,000',
      type: 'Credit'
    },
    {
      id: '2',
      message: 'Debit Alert: ₦10,000 sent',
      status: 'Fake',
      date: '5 hours ago',
      bank: 'Access Bank',
      accountNumber: '****5678',
      amount: '₦10,000',
      type: 'Debit'
    },
    {
      id: '3',
      message: 'Credit Alert: ₦125,000 received',
      status: 'Pending',
      date: '1 day ago',
      bank: 'First Bank',
      accountNumber: '****9012',
      amount: '₦125,000',
      type: 'Credit'
    },
    {
      id: '4',
      message: 'Debit Alert: ₦5,500 sent',
      status: 'Real',
      date: '2 days ago',
      bank: 'UBA',
      accountNumber: '****3456',
      amount: '₦5,500',
      type: 'Debit'
    },
    {
      id: '5',
      message: 'Credit Alert: ₦200,000 received',
      status: 'Fake',
      date: '3 days ago',
      bank: 'Zenith Bank',
      accountNumber: '****7890',
      amount: '₦200,000',
      type: 'Credit'
    }
  ];

  const getStatusConfig = (status: Alert['status']) => {
    switch (status) {
      case 'Real':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'Fake':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      case 'Pending':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
    }
  };

  const handleAlertClick = (_alertId: string) => {
    // Open modal or navigate to details page
  };

  const handleViewAll = () => {
    // Navigate to full alerts page
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Recent Alerts</h2>
        <span className="text-sm text-slate-500">{alerts.length} total</span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const statusConfig = getStatusConfig(alert.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert.id)}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Transaction Type Icon */}
                <div className={`p-2 rounded-lg ${alert.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                  {alert.type === 'Credit' ? (
                    <TrendingUp className={`w-5 h-5 ${alert.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`} />
                  ) : (
                    <TrendingDown className={`w-5 h-5 text-red-600`} />
                  )}
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {alert.message}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} whitespace-nowrap`}>
                      <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                      {alert.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <span className="font-medium">{alert.bank}</span>
                    <span className="text-slate-400">•</span>
                    <span>{alert.accountNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{alert.date}</span>
                    <span className="text-sm font-bold text-slate-900">{alert.amount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      <Button
        onClick={handleViewAll}
        variant="outline"
        className="w-full mt-4 border-slate-300 hover:bg-slate-50"
      >
        View All Alerts
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}