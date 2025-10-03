import React, { useState, useEffect, useMemo } from 'react';
import {
    Filter,
    Search,
    Tag,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Edit,
    Trash2,
    Download
} from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { TransactionService } from '../services/TransactionService';
import { Transaction } from '../Transaction';
import {
    debounce,
    getDateFilter
} from '../../../shared/utils';
import {
    DATE_PERIODS
} from '../../../shared/constants';
import type {
    Transaction as ITransaction,
    TransactionFilters,
    DatePeriod
} from '../../../shared/types';

interface TransactionListProps {
    onEditTransaction?: (transaction: ITransaction) => void;
    onDeleteTransaction?: (transactionId: string) => void;
    className?: string;
}

interface SortConfig {
    field: keyof ITransaction;
    direction: 'asc' | 'desc';
}

interface PaginationConfig {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

export function TransactionList({
    onEditTransaction,
    onDeleteTransaction,
    className = ''
}: TransactionListProps) {
    const { state, dispatch } = useAppContext();
    const { transactions, accounts } = state;

    // Initialize transaction service
    const transactionService = useMemo(
        () => new TransactionService(dispatch, () => transactions),
        [dispatch, transactions]
    );

    // State for filters
    const [filters, setFilters] = useState<TransactionFilters>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // State for sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'date',
        direction: 'desc'
    });

    // State for pagination
    const [pagination, setPagination] = useState<PaginationConfig>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
    });

    // Get filtered and sorted transactions
    const filteredTransactions = useMemo(() => {
        let result = transactionService.getFilteredTransactions(
            filters,
            sortConfig.field,
            sortConfig.direction
        );

        // Apply search query
        if (searchQuery.trim()) {
            result = transactionService.searchTransactions(searchQuery, filters);
        }

        return result;
    }, [transactionService, filters, searchQuery, sortConfig]);

    // Get paginated transactions
    const paginatedTransactions = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, pagination.currentPage, pagination.itemsPerPage]);

    // Update pagination when filtered transactions change
    useEffect(() => {
        const totalItems = filteredTransactions.length;
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

        setPagination(prev => ({
            ...prev,
            totalItems,
            totalPages,
            currentPage: Math.min(prev.currentPage, Math.max(1, totalPages))
        }));
    }, [filteredTransactions.length, pagination.itemsPerPage]);

    // Debounced search handler
    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            setSearchQuery(query);
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }, 300),
        []
    );

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    // Handle filter changes
    const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Handle date period filter
    const handleDatePeriodChange = (period: DatePeriod) => {
        if (period === 'all') {
            const { dateRange, ...otherFilters } = filters;
            setFilters(otherFilters);
        } else {
            const dateRange = getDateFilter(period);
            handleFilterChange({ dateRange });
        }
    };

    // Handle sorting
    const handleSort = (field: keyof ITransaction) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Handle items per page change
    const handleItemsPerPageChange = (itemsPerPage: number) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage,
            currentPage: 1
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Export transactions
    const handleExport = (format: 'csv' | 'json') => {
        const data = format === 'csv'
            ? transactionService.exportToCSV(filteredTransactions)
            : transactionService.exportToJSON(filteredTransactions);

        const blob = new Blob([data], {
            type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Get unique categories for filter dropdown
    const availableCategories = useMemo(() => {
        return transactionService.getUniqueCategories();
    }, [transactionService]);

    // Get account name by ID
    const getAccountName = (accountId: string) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account?.name || 'Unknown Account';
    };

    // Render sort icon
    const renderSortIcon = (field: keyof ITransaction) => {
        if (sortConfig.field !== field) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 text-blue-600" />
            : <ArrowDown className="w-4 h-4 text-blue-600" />;
    };

    // Render transaction type indicator
    const renderTypeIndicator = (transaction: Transaction) => {
        const isIncome = transaction.isIncome;
        return (
            <div className={`flex items-center space-x-1 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? (
                    <TrendingUp className="w-4 h-4" />
                ) : (
                    <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium uppercase">
                    {transaction.type}
                </span>
            </div>
        );
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header with search and filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Transactions ({filteredTransactions.length})
                    </h2>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                onChange={handleSearchChange}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-4 py-2 border rounded-md transition-colors ${showFilters
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>

                        {/* Export dropdown */}
                        <div className="relative group">
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                            </button>
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Export JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Period Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Period
                                </label>
                                <select
                                    onChange={(e) => handleDatePeriodChange(e.target.value as DatePeriod)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Time</option>
                                    {DATE_PERIODS.map(period => (
                                        <option key={period.value} value={period.value}>
                                            {period.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Transaction Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'all') {
                                            const { types, ...otherFilters } = filters;
                                            setFilters(otherFilters);
                                        } else {
                                            handleFilterChange({ types: [value as 'income' | 'expense'] });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'all') {
                                            const { categories, ...otherFilters } = filters;
                                            setFilters(otherFilters);
                                        } else {
                                            handleFilterChange({ categories: [value] });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Categories</option>
                                    {availableCategories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account
                                </label>
                                <select
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'all') {
                                            const { accounts: accountFilter, ...otherFilters } = filters;
                                            setFilters(otherFilters);
                                        } else {
                                            handleFilterChange({ accounts: [value] });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Accounts</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <button
                                    onClick={() => handleSort('date')}
                                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                >
                                    <span>Date</span>
                                    {renderSortIcon('date')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <button
                                    onClick={() => handleSort('description')}
                                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                >
                                    <span>Description</span>
                                    {renderSortIcon('description')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left">
                                <button
                                    onClick={() => handleSort('category')}
                                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                >
                                    <span>Category</span>
                                    {renderSortIcon('category')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Account
                            </th>
                            <th className="px-6 py-3 text-right">
                                <button
                                    onClick={() => handleSort('amount')}
                                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 ml-auto"
                                >
                                    <span>Amount</span>
                                    {renderSortIcon('amount')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Search className="w-8 h-8 text-gray-300" />
                                        <p>No transactions found</p>
                                        {Object.keys(filters).length > 0 || searchQuery && (
                                            <button
                                                onClick={clearFilters}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Clear filters to see all transactions
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.formattedDate}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="max-w-xs truncate" title={transaction.description}>
                                            {transaction.description}
                                        </div>
                                        {transaction.tags && transaction.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {transaction.tags.slice(0, 2).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {transaction.tags.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{transaction.tags.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center space-x-1">
                                            <Tag className="w-3 h-3 text-gray-400" />
                                            <span>{transaction.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderTypeIndicator(transaction)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getAccountName(transaction.accountId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <span className={transaction.isIncome ? 'text-green-600' : 'text-red-600'}>
                                            {transaction.formattedAmount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {onEditTransaction && (
                                                <button
                                                    onClick={() => onEditTransaction(transaction.toJSON())}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Edit transaction"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDeleteTransaction && (
                                                <button
                                                    onClick={() => onDeleteTransaction(transaction.id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    title="Delete transaction"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                            {pagination.totalItems} results
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Items per page selector */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Show:</span>
                            <select
                                value={pagination.itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNumber;
                                if (pagination.totalPages <= 5) {
                                    pageNumber = i + 1;
                                } else if (pagination.currentPage <= 3) {
                                    pageNumber = i + 1;
                                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                    pageNumber = pagination.totalPages - 4 + i;
                                } else {
                                    pageNumber = pagination.currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => handlePageChange(pageNumber)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pagination.currentPage === pageNumber
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}