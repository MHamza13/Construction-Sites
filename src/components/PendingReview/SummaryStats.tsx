import React from 'react';
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const SummaryStats = ({ stats }) => {
 
  const defaultStats = {
    totalEmployees: 156,
    totalPayroll: 245600.50,
    pendingCount: 23,
    processedCount: 133,
    trends: {
      employees: 12,
      payroll: -2.5,
      pending: -8,
      processed: 15
    }
  };

  const data = stats || defaultStats;

  const statCards = [
    {
      title: 'Total Workers',
      value: data.totalEmployees,
      icon: Users,
      color: 'blue',
      trend: data.trends?.employees,
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Payroll',
      value: `${data.totalPayroll?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'green',
      trend: data.trends?.payroll,
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Pending Review',
      value: data.pendingCount,
      icon: Clock,
      color: 'amber',
      trend: data.trends?.pending,
      bgGradient: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Processed',
      value: data.processedCount,
      icon: CheckCircle,
      color: 'purple',
      trend: data.trends?.processed,
      bgGradient: 'from-purple-500 to-purple-600'
    }
  ];

  const TrendIcon = ({ trend }) => {
    if (!trend) return null;
    
    const isPositive = trend > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        <Icon className="w-3 h-3 mr-1" />
        {Math.abs(trend)}%
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
  key={index}
  className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
>
              {/* gradient overlay */}
            <div
    className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.bgGradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8 pointer-events-none`}
  ></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-200`}
          style={{ backgroundColor: `var(--tw-color-${card.color}-100, #f3f4f6)` }}
        >
          <Icon className={`w-6 h-6 text-${card.color}-600`} />
        </div>
                  
                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {card.title}
        </p>

        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {card.value}
        </p>
                  
                  <TrendIcon trend={card.trend} />
                </div>
              </div>
            </div>
            
            {/* Hover effect border */}
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${card.bgGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryStats;