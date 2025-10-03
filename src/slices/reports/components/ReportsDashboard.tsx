import { useState, useMemo } from 'react';
import { Download, Filter, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { ReportService } from '../services/ReportService';
import { ChartsSection } from './ChartsSection';
import { formatCurrency, getDateFilter } from '../../../shared/utils';
import type { DatePeriod } from '../../../shared/types';

interface FilterState {
  period: DatePeriod;
  categories: string[];
  types: ('income' | 'expense')[];
  accounts: string[];
}

export function ReportsDashboard() {
  const { state } = useAppContext();
  const [filters, setFilters] = useState<FilterState>({
    period: '30days',
    categories: [],
    types: [],
    accounts: []
  });
  const [showFilters, setShowFilters] = useState(false);

  // Initialize ReportService
  const reportService = useMemo(() => {
    return new ReportService(
      () => state.transactions,
      () => state.accounts,
      () => state.budgets
    );
  }, [state.transactions, state.accounts, state.budgets]);

  // Get date range for selected period
  const dateRange = useMemo(() => {
    return getDateFilter(filters.period);
  }, [filters.period]);

  // Get available filter options
  const availableCategories = useMemo(() => {
    return reportService.getAvailableCategories();
  }, [reportService]);

  const availableAccounts = useMemo(() => {
    return state.accounts.map(account => ({
      id: account.id,
      name: account.name
    }));
  }, [state.accounts]);

  // Generate reports with current filters
  const reports = useMemo(() => {
    return {
      spending: reportService.generateSpendingReport(dateRange),
      comparison: reportService.generateIncomeVsExpenseReport(dateRange),
      category: reportService.generateCategoryReport(dateRange),
      statistics: reportService.getStatistics(dateRange)
    };
  }, [reportService, dateRange, filters]);

  // Handle filter changes
  const handlePeriodChange = (period: DatePeriod) => {
    setFilters(prev => ({ ...prev, period }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleTypeToggle = (type: 'income' | 'expense') => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handleAccountToggle = (accountId: string) => {
    setFilters(prev => ({
      ...prev,
      accounts: prev.accounts.includes(accountId)
        ? prev.accounts.filter(a => a !== accountId)
        : [...prev.accounts, accountId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      period: '30days',
      categories: [],
      types: [],
      accounts: []
    });
  };

  // Export functions
  const handleExportCSV = () => {
    const csvData = reportService.exportComprehensiveReport(dateRange, 'csv');
    downloadFile(csvData, `financial-report-${filters.period}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonData = reportService.exportComprehensiveReport(dateRange, 'json');
    downloadFile(jsonData, `financial-report-${filters.period}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const periods: { value: DatePeriod; label: string }[] = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
            <p className="text-gray-600 mt-1">
              Analyze your financial data with detailed reports and visualizations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handlePeriodChange(e.target.value as DatePeriod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <div className="space-y-2">
                  {['income', 'expense'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type as 'income' | 'expense')}
                        onChange={() => handleTypeToggle(type as 'income' | 'expense')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {availableCategories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accounts Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accounts
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {availableAccounts.map((account) => (
                    <label key={account.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.accounts.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{account.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
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

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {reports.statistics.formattedStats.totalIncome}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {reports.statistics.formattedStats.totalExpenses}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${reports.statistics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {reports.statistics.formattedStats.netBalance}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-800">
                {reports.statistics.totalTransactions}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <ChartsSection
        selectedPeriod={filters.period}
        onPeriodChange={handlePeriodChange}
      />

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Report */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          {reports.spending.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {reports.spending.categoryBreakdown.slice(0, 5).map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'yellow', 'red', 'purple'][index % 5]
                      }-500`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
              {reports.spending.categoryBreakdown.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{reports.spending.categoryBreakdown.length - 5} more categories
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No spending data available</p>
          )}
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget vs Actual</h3>
          {reports.category.categories.length > 0 ? (
            <div className="space-y-3">
              {reports.category.categories.slice(0, 5).map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.budgeted > 0 && item.spent > item.budgeted
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                        }`}
                      style={{
                        width: `${item.budgeted > 0 ? Math.min((item.spent / item.budgeted) * 100, 100) : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No budget data available</p>
          )}
        </div>
      </div>
    </div>
  );
}