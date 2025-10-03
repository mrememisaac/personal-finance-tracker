
import type { Budget } from '../../../shared/types';

interface BudgetOverviewProps {
  budgets: Array<Budget & {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
    formattedSpent: string;
    formattedRemaining: string;
    formattedLimit: string;
    daysRemaining: number;
    isOverBudget: boolean;
  }>;
  className?: string;
}

export function BudgetOverview({ budgets, className = '' }: BudgetOverviewProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (budgets.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-gray-500 mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold">No Active Budgets</h3>
          <p className="text-sm">Create your first budget to start tracking your spending.</p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const getOverallStatus = (): 'safe' | 'warning' | 'danger' => {
    if (overallPercentage >= 100) return 'danger';
    if (overallPercentage >= 80) return 'warning';
    return 'safe';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Budget Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudgeted)}</div>
            <div className="text-sm text-blue-800">Total Budgeted</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
            <div className="text-sm text-red-800">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</div>
            <div className="text-sm text-green-800">Total Remaining</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{overallPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-800">Overall Usage</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Budget Progress</span>
            <span className={`text-sm font-semibold ${overallStatus === 'safe' ? 'text-green-600' :
                overallStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
              {overallStatus === 'safe' ? 'On Track' :
                overallStatus === 'warning' ? 'Watch Spending' : 'Over Budget'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${overallStatus === 'safe' ? 'bg-green-500' :
                  overallStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual Budget Progress */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const percentage = Math.min(100, budget.percentage);
            const getStatusColor = (status: 'safe' | 'warning' | 'danger') => {
              switch (status) {
                case 'safe': return 'bg-green-500';
                case 'warning': return 'bg-yellow-500';
                case 'danger': return 'bg-red-500';
                default: return 'bg-gray-500';
              }
            };

            const getStatusBgColor = (status: 'safe' | 'warning' | 'danger') => {
              switch (status) {
                case 'safe': return 'bg-green-50 border-green-200';
                case 'warning': return 'bg-yellow-50 border-yellow-200';
                case 'danger': return 'bg-red-50 border-red-200';
                default: return 'bg-gray-50 border-gray-200';
              }
            };

            const getStatusIcon = (status: 'safe' | 'warning' | 'danger') => {
              switch (status) {
                case 'safe': return '✅';
                case 'warning': return '⚠️';
                case 'danger': return '❌';
                default: return '⚪';
              }
            };

            return (
              <div key={budget.id} className={`p-4 rounded-lg border-2 ${getStatusBgColor(budget.status)} transition-all duration-200 hover:shadow-md`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(budget.status)}</span>
                    <h3 className="font-semibold text-gray-800">{budget.category}</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className="text-sm text-gray-600">
                      {budget.daysRemaining} days left
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${getStatusColor(budget.status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget Details */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{budget.formattedSpent}</div>
                    <div className="text-gray-600">Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{budget.formattedRemaining}</div>
                    <div className="text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">{budget.formattedLimit}</div>
                    <div className="text-gray-600">Budget</div>
                  </div>
                </div>

                {/* Status Message */}
                {budget.status === 'danger' && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                    {budget.isOverBudget
                      ? `Over budget by ${budget.formattedSpent}`
                      : 'Approaching budget limit'
                    }
                  </div>
                )}
                {budget.status === 'warning' && (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                    You've used {percentage.toFixed(1)}% of your budget
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {budgets.filter(b => b.status === 'safe').length}
            </div>
            <div className="text-sm text-gray-600">Safe Budgets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {budgets.filter(b => b.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning Budgets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {budgets.filter(b => b.status === 'danger').length}
            </div>
            <div className="text-sm text-gray-600">Over Budget</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {budgets.length}
            </div>
            <div className="text-sm text-gray-600">Total Budgets</div>
          </div>
        </div>
      </div>
    </div>
  );
}