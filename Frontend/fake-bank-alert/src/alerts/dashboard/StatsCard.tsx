import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Users, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { getDashboardStats } from '@/lib/api';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  description 
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{value}</h3>
          
          {/* Trend Indicator */}
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-slate-500 ml-1">vs last month</span>
            </div>
          )}
          
          {/* Optional Description */}
          {description && !trend && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>

        {/* Icon */}
        <div className="bg-teal-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-teal-600" />
        </div>
      </div>
    </div>
  );
}

export default function StatsRow() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    fakeAlerts: 0,
    accountsMonitored: 0,
    lastAlert: null as { date: string; timeAgo: string } | null,
    trends: {
      total: { value: 0, isPositive: true },
      fake: { value: 0, isPositive: true }
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for alert detection events to refresh stats
    const handleAlertDetected = () => {
      fetchStats();
    };

    window.addEventListener('alert-detected', handleAlertDetected);

    return () => {
      window.removeEventListener('alert-detected', handleAlertDetected);
    };
  }, []);

  const statsData = [
    {
      title: 'Total Alerts',
      value: isLoading ? '...' : stats.totalAlerts,
      icon: Bell,
      trend: stats.trends.total
    },
    {
      title: 'Fake Alerts',
      value: isLoading ? '...' : stats.fakeAlerts,
      icon: AlertTriangle,
      trend: stats.trends.fake
    },
    {
      title: 'Accounts Monitored',
      value: isLoading ? '...' : stats.accountsMonitored,
      icon: Users,
      trend: {
        value: 0,
        isPositive: true
      }
    },
    {
      title: 'Last Alert',
      value: isLoading ? '...' : (stats.lastAlert?.timeAgo || 'Never'),
      icon: Clock,
      description: stats.lastAlert?.date || 'No alerts yet'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          description={stat.description}
        />
      ))}
    </div>
  );
}