import type { 
  Transaction as ITransaction, 
  TransactionFilters, 
  ValidationResult,
  AppAction 
} from '../../../shared/types';
import { Transaction } from '../Transaction';
import { 
  formatCurrency, 
  getCurrentMonthRange, 
  getCurrentWeekRange,
  isDateInRange,
  groupBy,
  sumBy
} from '../../../shared/utils';

export class TransactionService {
  private dispatch: React.Dispatch<AppAction>;
  private getTransactions: () => ITransaction[];

  constructor(
    dispatch: React.Dispatch<AppAction>,
    getTransactions: () => ITransaction[]
  ) {
    this.dispatch = dispatch;
    this.getTransactions = getTransactions;
  }

  // CRUD Operations

  /**
   * Add a new transaction
   */
  addTransaction(transactionData: Omit<ITransaction, 'id' | 'createdAt' | 'updatedAt'>): ValidationResult & { transaction?: Transaction } {
    // Validate the transaction data
    const validation = Transaction.validate(transactionData as Partial<ITransaction>);
    
    if (!validation.isValid) {
      return validation;
    }

    // Create new transaction with generated metadata
    const transaction = Transaction.create(transactionData);
    
    // Dispatch action to add to global state
    this.dispatch({
      type: 'ADD_TRANSACTION',
      payload: transaction.toJSON()
    });

    return {
      isValid: true,
      errors: [],
      transaction
    };
  }

  /**
   * Update an existing transaction
   */
  updateTransaction(id: string, updates: Partial<ITransaction>): ValidationResult & { transaction?: Transaction } {
    const transactions = this.getTransactions();
    const existingTransaction = transactions.find(t => t.id === id);
    
    if (!existingTransaction) {
      return {
        isValid: false,
        errors: ['Transaction not found']
      };
    }

    // Merge existing data with updates for validation
    const updatedData = { ...existingTransaction, ...updates };
    const validation = Transaction.validate(updatedData);
    
    if (!validation.isValid) {
      return validation;
    }

    // Dispatch update action
    this.dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: { id, updates }
    });

    // Return updated transaction
    const transaction = new Transaction(updatedData);
    return {
      isValid: true,
      errors: [],
      transaction
    };
  }

  /**
   * Delete a transaction
   */
  deleteTransaction(id: string): ValidationResult {
    const transactions = this.getTransactions();
    const existingTransaction = transactions.find(t => t.id === id);
    
    if (!existingTransaction) {
      return {
        isValid: false,
        errors: ['Transaction not found']
      };
    }

    this.dispatch({
      type: 'DELETE_TRANSACTION',
      payload: id
    });

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Get a single transaction by ID
   */
  getTransaction(id: string): Transaction | null {
    const transactions = this.getTransactions();
    const transactionData = transactions.find(t => t.id === id);
    
    return transactionData ? new Transaction(transactionData) : null;
  }

  // Filtering and Sorting Operations

  /**
   * Get transactions with optional filtering and sorting
   */
  getFilteredTransactions(filters?: TransactionFilters, sortBy?: keyof ITransaction, sortDirection?: 'asc' | 'desc'): Transaction[] {
    let transactions = this.getTransactions().map(t => new Transaction(t));

    // Apply filters
    if (filters) {
      transactions = this.applyFilters(transactions, filters);
    }

    // Apply sorting
    if (sortBy) {
      transactions = this.sortTransactions(transactions, sortBy, sortDirection || 'desc');
    } else {
      // Default sort by date (newest first)
      transactions = this.sortTransactions(transactions, 'date', 'desc');
    }

    return transactions;
  }

  /**
   * Apply filters to transaction list
   */
  private applyFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(t => 
        isDateInRange(t.date, filters.dateRange!.start, filters.dateRange!.end)
      );
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(t => 
        filters.categories!.includes(t.category)
      );
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(t => 
        filters.types!.includes(t.type)
      );
    }

    // Account filter
    if (filters.accounts && filters.accounts.length > 0) {
      filtered = filtered.filter(t => 
        filters.accounts!.includes(t.accountId)
      );
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(t => {
        const amount = Math.abs(t.amount);
        return amount >= filters.amountRange!.min && amount <= filters.amountRange!.max;
      });
    }

    return filtered;
  }

  /**
   * Sort transactions by specified field
   */
  private sortTransactions(transactions: Transaction[], field: keyof ITransaction, direction: 'asc' | 'desc'): Transaction[] {
    return [...transactions].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        aVal = aVal.getTime() as any;
        bVal = bVal.getTime() as any;
      }

      // Handle string comparison (case insensitive)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase() as any;
        bVal = bVal.toLowerCase() as any;
      }

      if (aVal !== undefined && bVal !== undefined) {
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Category-based Operations

  /**
   * Group transactions by category
   */
  getTransactionsByCategory(filters?: TransactionFilters): Map<string, Transaction[]> {
    const transactions = this.getFilteredTransactions(filters);
    const grouped = groupBy(transactions, 'category');
    
    return new Map(Object.entries(grouped));
  }

  /**
   * Get category spending summary
   */
  getCategorySpendingSummary(filters?: TransactionFilters): Array<{
    category: string;
    totalSpent: number;
    transactionCount: number;
    averageAmount: number;
    formattedTotal: string;
  }> {
    const categoryMap = this.getTransactionsByCategory(filters);
    const summary: Array<{
      category: string;
      totalSpent: number;
      transactionCount: number;
      averageAmount: number;
      formattedTotal: string;
    }> = [];

    categoryMap.forEach((transactions, category) => {
      const expenses = transactions.filter(t => t.isExpense);
      
      // Only include categories that have expenses
      if (expenses.length > 0) {
        const totalSpent = sumBy(expenses, 'amount');
        const transactionCount = expenses.length;
        const averageAmount = transactionCount > 0 ? totalSpent / transactionCount : 0;

        summary.push({
          category,
          totalSpent: Math.abs(totalSpent),
          transactionCount,
          averageAmount: Math.abs(averageAmount),
          formattedTotal: formatCurrency(Math.abs(totalSpent))
        });
      }
    });

    // Sort by total spent (descending)
    return summary.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // Calculation Methods

  /**
   * Calculate total income from transactions
   */
  calculateTotalIncome(transactions?: Transaction[]): number {
    const txns = transactions || this.getFilteredTransactions();
    return sumBy(txns.filter(t => t.isIncome), 'amount');
  }

  /**
   * Calculate total expenses from transactions
   */
  calculateTotalExpenses(transactions?: Transaction[]): number {
    const txns = transactions || this.getFilteredTransactions();
    return Math.abs(sumBy(txns.filter(t => t.isExpense), 'amount'));
  }

  /**
   * Calculate net balance (income - expenses)
   */
  calculateNetBalance(transactions?: Transaction[]): number {
    const income = this.calculateTotalIncome(transactions);
    const expenses = this.calculateTotalExpenses(transactions);
    return income - expenses;
  }

  /**
   * Get financial summary for a specific period
   */
  getFinancialSummary(period: 'week' | 'month' | 'custom', customRange?: { start: Date; end: Date }) {
    let dateRange: { start: Date; end: Date };

    switch (period) {
      case 'week':
        dateRange = getCurrentWeekRange();
        break;
      case 'month':
        dateRange = getCurrentMonthRange();
        break;
      case 'custom':
        if (!customRange) {
          throw new Error('Custom range is required when period is "custom"');
        }
        dateRange = customRange;
        break;
      default:
        dateRange = getCurrentMonthRange();
    }

    const transactions = this.getFilteredTransactions({ dateRange });
    const income = this.calculateTotalIncome(transactions);
    const expenses = this.calculateTotalExpenses(transactions);
    const netBalance = income - expenses;

    return {
      period,
      dateRange,
      income,
      expenses,
      netBalance,
      transactionCount: transactions.length,
      formattedIncome: formatCurrency(income),
      formattedExpenses: formatCurrency(expenses),
      formattedNetBalance: formatCurrency(netBalance),
      categoryBreakdown: this.getCategorySpendingSummary({ dateRange })
    };
  }

  // Export Operations

  /**
   * Export transactions to CSV format
   */
  exportToCSV(transactions?: Transaction[]): string {
    const txns = transactions || this.getFilteredTransactions();
    
    if (txns.length === 0) {
      return 'No transactions to export';
    }

    // CSV headers
    const headers = [
      'Date',
      'Description',
      'Category',
      'Type',
      'Amount',
      'Account ID',
      'Tags',
      'Created At',
      'Updated At'
    ];

    // Convert transactions to CSV rows
    const rows = txns.map(t => [
      t.formattedDate,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes in description
      t.category,
      t.type,
      t.amount.toString(),
      t.accountId,
      t.tags ? `"${t.tags.join(', ')}"` : '',
      t.createdAt.toISOString(),
      t.updatedAt.toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
  }

  /**
   * Export transactions to JSON format
   */
  exportToJSON(transactions?: Transaction[]): string {
    const txns = transactions || this.getFilteredTransactions();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      transactionCount: txns.length,
      summary: {
        totalIncome: this.calculateTotalIncome(txns),
        totalExpenses: this.calculateTotalExpenses(txns),
        netBalance: this.calculateNetBalance(txns)
      },
      transactions: txns.map(t => t.toJSON())
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Search Operations

  /**
   * Search transactions by description or category
   */
  searchTransactions(query: string, filters?: TransactionFilters): Transaction[] {
    const transactions = this.getFilteredTransactions(filters);
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      return transactions;
    }

    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm) ||
      t.category.toLowerCase().includes(searchTerm) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Utility Methods

  /**
   * Get unique categories from all transactions
   */
  getUniqueCategories(): string[] {
    const transactions = this.getTransactions();
    const categories = transactions.map(t => t.category);
    return [...new Set(categories)].sort();
  }

  /**
   * Get unique tags from all transactions
   */
  getUniqueTags(): string[] {
    const transactions = this.getTransactions();
    const allTags = transactions.flatMap(t => t.tags || []);
    return [...new Set(allTags)].sort();
  }

  /**
   * Get recent transactions (last N transactions)
   */
  getRecentTransactions(limit: number = 10): Transaction[] {
    return this.getFilteredTransactions(undefined, 'date', 'desc').slice(0, limit);
  }

  /**
   * Get transactions for a specific account
   */
  getTransactionsByAccount(accountId: string, filters?: Omit<TransactionFilters, 'accounts'>): Transaction[] {
    const accountFilters: TransactionFilters = {
      ...filters,
      accounts: [accountId]
    };
    return this.getFilteredTransactions(accountFilters);
  }

  /**
   * Get monthly transaction trends (last 12 months)
   */
  getMonthlyTrends(): Array<{
    month: string;
    year: number;
    income: number;
    expenses: number;
    netBalance: number;
    transactionCount: number;
  }> {
    const trends: Array<{
      month: string;
      year: number;
      income: number;
      expenses: number;
      netBalance: number;
      transactionCount: number;
    }> = [];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      const monthTransactions = this.getFilteredTransactions({ dateRange: { start, end } });
      const income = this.calculateTotalIncome(monthTransactions);
      const expenses = this.calculateTotalExpenses(monthTransactions);

      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        income,
        expenses,
        netBalance: income - expenses,
        transactionCount: monthTransactions.length
      });
    }

    return trends;
  }
}