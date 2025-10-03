import { useState } from 'react';
import { PieChart, TrendingDown, Info } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { formatCurrency, getCurrentMonthRange, groupBy, sumBy } from '../../../shared/utils';
import type { Transaction } from '../../../shared/types';

interface CategoryBreakdownProps {
  category: string;
  amount: number;
  percentage: number;
  currency: string;
  color: string;
}

function CategoryBreakdown({ category, amount, percentage, currency, color }: CategoryBreakdownProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 rounded-lg cursor-pointer">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <p className="font-medium text-gray-900 capitalize">{category}</p>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(amount, currency)}
          </p>
        </div>
      </div>

      {showTooltip && (
        <div className="absolute z-10 bg-gray-800 text-white text-sm rounded-lg py-2 px-3 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <Info className="w-3 h-3" />
            <span>{category}: {formatCurrency(amount, currency)} ({percentage.toFixed(1)}%)</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}



export function ExpenseBreakdown() {
  const { state } = useAppContext();
  const { transactions, settings } = state;
  const { start, end } = getCurrentMonthRange();

  // Filter expenses for current month
  const currentMonthExpenses = transactions.filter(
    (transaction: Transaction) =>
      transaction.type === 'expense' &&
      transaction.date >= start &&
      transaction.date <= end
  );

  // Group expenses by category and calculate totals
  const expensesByCategory = groupBy(currentMonthExpenses, 'category');
  const categoryTotals = Object.entries(expensesByCategory).map(([category, categoryTransactions]) => ({
    category,
    amount: sumBy(categoryTransactions, 'amount') * -1, // Convert negative amounts to positive
    transactions: categoryTransactions
  }));

  // Sort by amount (highest first)
  const sortedCategories = categoryTotals.sort((a, b) => b.amount - a.amount);

  // Calculate total expenses
  const totalExpenses = sortedCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Generate colors for categories
  const colors = [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
    '#22C55E', // green-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F59E0B', // amber-500
  ];

  if (sortedCategories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <PieChart className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
        </div>
        <div className="text-center py-8">
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No expenses this month</p>
          <p className="text-sm text-gray-400 mt-1">
            Your expense breakdown will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <PieChart className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">This month</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(totalExpenses, settings.currency)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedCategories.slice(0, 6).map((categoryData, index) => {
          const percentage = totalExpenses > 0 ? (categoryData.amount / totalExpenses) * 100 : 0;
          return (
            <CategoryBreakdown
              key={categoryData.category}
              category={categoryData.category}
              amount={categoryData.amount}
              percentage={percentage}
              currency={settings.currency}
              color={colors[index % colors.length]}
            />
          );
        })}
      </div>

      {sortedCategories.length > 6 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            +{sortedCategories.length - 6} more categories
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Expenses</span>
          <span className="font-semibold text-red-600">
            {formatCurrency(totalExpenses, settings.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}