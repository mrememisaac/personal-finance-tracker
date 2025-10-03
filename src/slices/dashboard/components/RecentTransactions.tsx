
import { Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { formatCurrency, formatDate, sortBy } from '../../../shared/utils';
import type { Transaction } from '../../../shared/types';

interface TransactionItemProps {
  transaction: Transaction;
  currency: string;
  dateFormat: string;
}

function TransactionItem({ transaction, currency, dateFormat }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amount = Math.abs(transaction.amount);

  const getTransactionStyles = () => {
    return isIncome
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200';
  };

  const getAmountStyles = () => {
    return isIncome ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full border ${getTransactionStyles()}`}>
          {isIncome ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 truncate max-w-32">
            {transaction.description}
          </p>
          <p className="text-sm text-gray-500">
            {transaction.category} • {formatDate(transaction.date, dateFormat)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${getAmountStyles()}`}>
          {isIncome ? '+' : '-'}{formatCurrency(amount, currency)}
        </p>
      </div>
    </div>
  );
}

export function RecentTransactions() {
  const { state } = useAppContext();
  const { transactions, settings } = state;

  // Get the 5 most recent transactions
  const recentTransactions = sortBy(transactions, 'date', 'desc').slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your recent transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <span className="text-sm text-gray-500">
          Last {recentTransactions.length} transactions
        </span>
      </div>

      <div className="space-y-2">
        {recentTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            currency={settings.currency}
            dateFormat={settings.dateFormat}
          />
        ))}
      </div>

      {transactions.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200">
            View all transactions →
          </button>
        </div>
      )}
    </div>
  );
}