import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { formatCurrency, getCurrentMonthRange } from '../../../shared/utils';
import type { Transaction } from '../../../shared/types';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  currency?: string;
}

function SummaryCard({ title, amount, icon, trend = 'neutral', currency = 'USD' }: SummaryCardProps) {
  const getCardStyles = () => {
    const baseStyles = "bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4";
    
    switch (trend) {
      case 'up':
        return `${baseStyles} border-green-500 hover:border-green-600`;
      case 'down':
        return `${baseStyles} border-red-500 hover:border-red-600`;
      default:
        return `${baseStyles} border-blue-500 hover:border-blue-600`;
    }
  };

  const getAmountStyles = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500 ml-2" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500 ml-2" />;
      default:
        return null;
    }
  };

  return (
    <div className={getCardStyles()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-gray-100">
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center">
              <p className={`text-2xl font-bold ${getAmountStyles()}`}>
                {formatCurrency(amount, currency)}
              </p>
              {getTrendIcon()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryCards() {
  const { state } = useAppContext();
  const { transactions } = state;
  const { start, end } = getCurrentMonthRange();

  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter(
    (transaction: Transaction) => 
      transaction.date >= start && transaction.date <= end
  );

  // Calculate totals
  const totalIncome = currentMonthTransactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Determine trends based on financial health
  const getBalanceTrend = (balance: number) => {
    if (balance > 0) return 'up';
    if (balance < 0) return 'down';
    return 'neutral';
  };

  const currency = state.settings.currency;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SummaryCard
        title="Total Income"
        amount={totalIncome}
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        trend="up"
        currency={currency}
      />
      
      <SummaryCard
        title="Total Expenses"
        amount={totalExpenses}
        icon={<TrendingDown className="w-6 h-6 text-red-600" />}
        trend="down"
        currency={currency}
      />
      
      <SummaryCard
        title="Net Balance"
        amount={netBalance}
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        trend={getBalanceTrend(netBalance)}
        currency={currency}
      />
    </div>
  );
}