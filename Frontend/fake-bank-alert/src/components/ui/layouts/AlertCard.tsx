import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Eye, MoreVertical } from 'lucide-react';

interface AlertCardProps {
  id: string;
  message: string;
  status: 'Real' | 'Fake' | 'Pending';
  date: string;
  bank: string;
  accountNumber: string;
  amount: string;
  type: 'Credit' | 'Debit';
  onClick?: (id: string) => void;
}

export default function AlertCard({
  id,
  message,
  status,
  date,
  bank,
  accountNumber,
  amount,
  type,
  onClick
}: AlertCardProps) {
  
  const getStatusConfig = (status: 'Real' | 'Fake' | 'Pending') => {
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

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Transaction Type Icon */}
        <div className={`p-3 rounded-lg flex-shrink-0 ${
          type === 'Credit' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {type === 'Credit' ? (
            <TrendingUp className={`w-6 h-6 ${
              type === 'Credit' ? 'text-green-600' : 'text-red-600'
            }`} />
          ) : (
            <TrendingDown className="w-6 h-6 text-red-600" />
          )}
        </div>

        {/* Alert Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {message}
            </h3>
            <button 
              className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Options menu clicked');
              }}
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Bank and Account Info */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <span className="font-semibold">{bank}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono">{accountNumber}</span>
          </div>

          {/* Amount and Status Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">{amount}</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconColor}`} />
                {status}
              </span>
            </div>
          </div>

          {/* Date and View Action */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{date}</span>
            <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example Usage Component
export function AlertCardExample() {
  const sampleAlerts = [
    {
      id: '1',
      message: 'Credit Alert: ₦50,000 received',
      status: 'Real' as const,
      date: '2 hours ago',
      bank: 'GTBank',
      accountNumber: '****1234',
      amount: '₦50,000',
      type: 'Credit' as const
    },
    {
      id: '2',
      message: 'Debit Alert: ₦10,000 sent',
      status: 'Fake' as const,
      date: '5 hours ago',
      bank: 'Access Bank',
      accountNumber: '****5678',
      amount: '₦10,000',
      type: 'Debit' as const
    },
    {
      id: '3',
      message: 'Credit Alert: ₦125,000 received',
      status: 'Pending' as const,
      date: '1 day ago',
      bank: 'First Bank',
      accountNumber: '****9012',
      amount: '₦125,000',
      type: 'Credit' as const
    }
  ];

  const handleAlertClick = (id: string) => {
    console.log('Alert clicked:', id);
    // Navigate to alert details or open modal
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Alert Cards</h2>
        <div className="space-y-4">
          {sampleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              {...alert}
              onClick={handleAlertClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}