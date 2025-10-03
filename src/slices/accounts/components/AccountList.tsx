import { useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { AccountService } from '../services/AccountService';
import { AccountForm } from './AccountForm';
import {
  ACCOUNT_TYPES,
  SUPPORTED_CURRENCIES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../../../shared/constants';
import { formatDate } from '../../../shared/utils';
import type { Account as IAccount } from '../../../shared/types';

interface AccountListProps {
  onAccountSelect?: (account: IAccount) => void;
  showActions?: boolean;
  compact?: boolean;
}

interface FilterState {
  search: string;
  type: string;
  currency: string;
  sortBy: 'name' | 'type' | 'balance' | 'createdAt';
  sortDirection: 'asc' | 'desc';
}

interface ConfirmDeleteState {
  isOpen: boolean;
  account: IAccount | null;
}

export function AccountList({
  onAccountSelect,
  showActions = true,
  compact = false
}: AccountListProps) {
  const { state, dispatch } = useAppContext();
  const { accounts, transactions } = state;

  // Component state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<IAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
    isOpen: false,
    account: null
  });
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    currency: '',
    sortBy: 'name',
    sortDirection: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Create account service instance
  const accountService = useMemo(() =>
    new AccountService(dispatch, () => accounts, () => transactions),
    [dispatch, accounts, transactions]
  );

  // Get account summaries with current balances
  const accountSummaries = useMemo(() =>
    accountService.getAccountSummaries(),
    [accountService]
  );

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accountSummaries;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm) ||
        account.type.toLowerCase().includes(searchTerm)
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(account => {
        const accountData = accounts.find(a => a.id === account.id);
        return accountData?.type === filters.type;
      });
    }

    // Apply currency filter
    if (filters.currency) {
      filtered = filtered.filter(account => {
        const accountData = accounts.find(a => a.id === account.id);
        return accountData?.currency === filters.currency;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      if (filters.sortBy === 'createdAt') {
        const aAccount = accounts.find(acc => acc.id === a.id);
        const bAccount = accounts.find(acc => acc.id === b.id);
        aVal = aAccount?.createdAt.getTime() || 0;
        bVal = bAccount?.createdAt.getTime() || 0;
      } else {
        aVal = (a as any)[filters.sortBy];
        bVal = (b as any)[filters.sortBy];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [accountSummaries, filters, accounts]);

  // Get account type icon
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <CreditCard className="w-5 h-5" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'positive':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          color: 'text-green-600'
        };
      case 'negative':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          color: 'text-red-600'
        };
      case 'zero':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          color: 'text-yellow-600'
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4 text-gray-500" />,
          color: 'text-gray-600'
        };
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle sorting
  const handleSort = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle account actions
  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: IAccount) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDeleteAccount = (account: IAccount) => {
    setConfirmDelete({ isOpen: true, account });
  };

  const confirmDeleteAccount = async () => {
    if (!confirmDelete.account) return;

    try {
      const result = accountService.deleteAccount(confirmDelete.account.id);

      if (result.isValid) {
        console.log(SUCCESS_MESSAGES.ACCOUNT_DELETED);
        setConfirmDelete({ isOpen: false, account: null });
      } else {
        alert(result.errors.join(', '));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(ERROR_MESSAGES.GENERIC_ERROR);
    }
  };

  const handleAccountSuccess = () => {
    // Refresh is handled by the context automatically
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      currency: '',
      sortBy: 'name',
      sortDirection: 'asc'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
          <p className="text-sm text-gray-500">
            {filteredAccounts.length} of {accountSummaries.length} accounts
          </p>
        </div>
        {showActions && (
          <button
            onClick={handleAddAccount}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </button>

          {(filters.type || filters.currency) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All types</option>
                {ACCOUNT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All currencies</option>
                {SUPPORTED_CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Account List */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {accounts.length === 0 ? 'No accounts yet' : 'No accounts match your filters'}
          </h3>
          <p className="text-gray-500 mb-4">
            {accounts.length === 0
              ? 'Get started by adding your first account'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {accounts.length === 0 && showActions && (
            <button
              onClick={handleAddAccount}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </button>
          )}
        </div>
      ) : (
        <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
          {/* Sort Controls */}
          {!compact && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Sort by:</span>
              {(['name', 'type', 'balance', 'createdAt'] as const).map(sortKey => (
                <button
                  key={sortKey}
                  onClick={() => handleSort(sortKey)}
                  className={`capitalize hover:text-gray-700 transition-colors ${filters.sortBy === sortKey ? 'text-blue-600 font-medium' : ''
                    }`}
                >
                  {sortKey === 'createdAt' ? 'Date Created' : sortKey}
                  {filters.sortBy === sortKey && (
                    <span className="ml-1">
                      {filters.sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Account Cards */}
          {filteredAccounts.map((accountSummary) => {
            const account = accounts.find(a => a.id === accountSummary.id)!;
            const statusDisplay = getStatusDisplay(accountSummary.status);

            return (
              <div
                key={account.id}
                className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-4'
                  } ${onAccountSelect ? 'cursor-pointer hover:border-blue-300' : ''}`}
                onClick={() => onAccountSelect?.(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'
                          }`}>
                          {account.name}
                        </h3>
                        {statusDisplay.icon}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {ACCOUNT_TYPES.find(t => t.value === account.type)?.label}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {account.currency}
                        </p>
                        {!compact && (
                          <>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs text-gray-500">
                              {accountSummary.transactionCount} transactions
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className={`font-semibold ${statusDisplay.color} ${compact ? 'text-sm' : 'text-base'
                        }`}>
                        {accountSummary.formattedBalance}
                      </p>
                      {!compact && (
                        <p className="text-xs text-gray-500">
                          Created {formatDate(account.createdAt)}
                        </p>
                      )}
                    </div>

                    {showActions && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAccount(account);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Form Modal */}
      <AccountForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAccount(null);
        }}
        account={editingAccount}
        onSuccess={handleAccountSuccess}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete.isOpen && confirmDelete.account && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{confirmDelete.account.name}"?
                This will also delete all associated transactions.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmDelete({ isOpen: false, account: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}