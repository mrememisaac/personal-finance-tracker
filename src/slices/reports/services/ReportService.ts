import type { 
  Transaction as ITransaction,
  Account,
  Budget,
  TransactionFilters,
  ChartData,
  SpendingReport,
  ComparisonReport,
  CategoryReport,
  BalanceHistory,
  Report,
  DatePeriod,
  ChartType
} from '../../../shared/types';
import { Transaction } from '../../transaction/Transaction';
import { 
  formatCurrency, 
  getDateFilter,
  getCurrentMonthRange,
  getCurrentWeekRange,
  isDateInRange,
  groupBy,
  sumBy
} from '../../../shared/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportFilters extends TransactionFilters {
  period?: DatePeriod;
}

export class ReportService {
  private getTransactions: () => ITransaction[];
  private getAccounts: () => Account[];
  private getBudgets: () => Budget[];

  constructor(
    getTransactions: () => ITransaction[],
    getAccounts: () => Account[],
    getBudgets: () => Budget[]
  ) {
    this.getTransactions = getTransactions;
    this.getAccounts = getAccounts;
    this.getBudgets = getBudgets;
  }

  // Report Generation Methods

  /**
   * Generate comprehensive spending report
   */
  generateSpendingReport(dateRange: DateRange): SpendingReport {
    const transactions = this.getFilteredTransactions({ dateRange });
    const expenses = transactions.filter(t => t.isExpense);
    
    const totalSpent = Math.abs(sumBy(expenses, 'amount'));
    
    // Group expenses by category
    const categoryGroups = groupBy(expenses, 'category');
    const categoryBreakdown = Object.entries(categoryGroups).map(([category, txns]) => {
      const amount = Math.abs(sumBy(txns, 'amount'));
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      
      return {
        category,
        amount,
        percentage: Math.round(percentage * 100) / 100
      };
    }).sort((a, b) => b.amount - a.amount);

    return {
      totalSpent,
      categoryBreakdown,
      period: dateRange
    };
  }

  /**
   * Generate income vs expense comparison report
   */
  generateIncomeVsExpenseReport(dateRange: DateRange): ComparisonReport {
    const transactions = this.getFilteredTransactions({ dateRange });
    
    const income = sumBy(transactions.filter(t => t.isIncome), 'amount');
    const expenses = Math.abs(sumBy(transactions.filter(t => t.isExpense), 'amount'));
    const netBalance = income - expenses;

    return {
      income,
      expenses,
      netBalance,
      period: dateRange
    };
  }

  /**
   * Generate category report with budget comparison
   */
  generateCategoryReport(dateRange: DateRange): CategoryReport {
    const transactions = this.getFilteredTransactions({ dateRange });
    const budgets = this.getBudgets();
    const expenses = transactions.filter(t => t.isExpense);
    
    // Group expenses by category
    const categoryGroups = groupBy(expenses, 'category');
    
    const categories = Object.entries(categoryGroups).map(([category, txns]) => {
      const spent = Math.abs(sumBy(txns, 'amount'));
      
      // Find matching budget for this category
      const budget = budgets.find(b => 
        b.category === category && 
        b.isActive &&
        this.isBudgetActiveInPeriod(b, dateRange)
      );
      
      const budgeted = budget ? budget.limit : 0;
      
      return {
        name: category,
        spent,
        budgeted
      };
    }).sort((a, b) => b.spent - a.spent);

    return {
      categories,
      period: dateRange
    };
  }

  /**
   * Generate account balance history
   */
  generateAccountBalanceHistory(accountId: string, dateRange?: DateRange): BalanceHistory[] {
    const account = this.getAccounts().find(a => a.id === accountId);
    if (!account) {
      return [];
    }

    let transactions = this.getTransactions()
      .filter(t => t.accountId === accountId)
      .map(t => new Transaction(t))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply date range filter if provided
    if (dateRange) {
      transactions = transactions.filter(t => 
        isDateInRange(t.date, dateRange.start, dateRange.end)
      );
    }

    const history: BalanceHistory[] = [];
    let runningBalance = account.balance;

    // Calculate balance at each transaction date
    transactions.forEach(transaction => {
      runningBalance += transaction.amount;
      history.push({
        date: transaction.date,
        balance: runningBalance
      });
    });

    return history;
  }

  // Chart Data Preparation Methods

  /**
   * Prepare chart data for monthly trends
   */
  getMonthlyTrendsChartData(months: number = 12): ChartData {
    const trends = this.getMonthlyTrends(months);
    
    return {
      labels: trends.map(t => `${t.month} ${t.year}`),
      datasets: [
        {
          label: 'Income',
          data: trends.map(t => t.income),
          borderColor: '#10b981',
          backgroundColor: '#10b981'
        },
        {
          label: 'Expenses',
          data: trends.map(t => t.expenses),
          borderColor: '#ef4444',
          backgroundColor: '#ef4444'
        }
      ]
    };
  }

  /**
   * Prepare chart data for expense distribution pie chart
   */
  getExpenseDistributionChartData(dateRange: DateRange): ChartData {
    const spendingReport = this.generateSpendingReport(dateRange);
    
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
    ];

    return {
      labels: spendingReport.categoryBreakdown.map(c => c.category),
      datasets: [{
        label: 'Expenses by Category',
        data: spendingReport.categoryBreakdown.map(c => c.amount),
        backgroundColor: colors.slice(0, spendingReport.categoryBreakdown.length)
      }]
    };
  }

  /**
   * Prepare chart data for income vs expenses comparison
   */
  getIncomeVsExpensesChartData(dateRange: DateRange): ChartData {
    const report = this.generateIncomeVsExpenseReport(dateRange);
    
    return {
      labels: ['Income', 'Expenses'],
      datasets: [{
        label: 'Amount',
        data: [report.income, report.expenses],
        backgroundColor: ['#10b981', '#ef4444']
      }]
    };
  }

  /**
   * Get chart data based on type and parameters
   */
  getChartData(type: ChartType, dateRange: DateRange, options?: any): ChartData {
    switch (type) {
      case 'line':
        return this.getMonthlyTrendsChartData(options?.months || 12);
      case 'pie':
        return this.getExpenseDistributionChartData(dateRange);
      case 'bar':
        return this.getIncomeVsExpensesChartData(dateRange);
      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }
  }

  // Data Export Methods

  /**
   * Export spending report to CSV format
   */
  exportSpendingReportCSV(dateRange: DateRange): string {
    const report = this.generateSpendingReport(dateRange);
    
    const headers = ['Category', 'Amount', 'Percentage'];
    const rows = report.categoryBreakdown.map(item => [
      item.category,
      item.amount.toString(),
      `${item.percentage}%`
    ]);

    // Add summary row
    rows.unshift(['Total Spent', report.totalSpent.toString(), '100%']);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export comparison report to CSV format
   */
  exportComparisonReportCSV(dateRange: DateRange): string {
    const report = this.generateIncomeVsExpenseReport(dateRange);
    
    const data = [
      ['Metric', 'Amount'],
      ['Income', report.income.toString()],
      ['Expenses', report.expenses.toString()],
      ['Net Balance', report.netBalance.toString()]
    ];
    
    return data.map(row => row.join(',')).join('\n');
  }

  /**
   * Export category report to CSV format
   */
  exportCategoryReportCSV(dateRange: DateRange): string {
    const report = this.generateCategoryReport(dateRange);
    
    const headers = ['Category', 'Spent', 'Budgeted', 'Difference'];
    const rows = report.categories.map(item => [
      item.name,
      item.spent.toString(),
      item.budgeted.toString(),
      (item.budgeted - item.spent).toString()
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export report data to JSON format
   */
  exportReportJSON(report: Report): string {
    const exportData = {
      ...report,
      exportedAt: new Date().toISOString(),
      metadata: {
        version: '1.0',
        format: 'json'
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export comprehensive financial data
   */
  exportComprehensiveReport(dateRange: DateRange, format: 'csv' | 'json'): string {
    const spendingReport = this.generateSpendingReport(dateRange);
    const comparisonReport = this.generateIncomeVsExpenseReport(dateRange);
    const categoryReport = this.generateCategoryReport(dateRange);
    
    if (format === 'json') {
      const comprehensiveData = {
        period: dateRange,
        generatedAt: new Date().toISOString(),
        spending: spendingReport,
        comparison: comparisonReport,
        categories: categoryReport,
        summary: {
          totalIncome: comparisonReport.income,
          totalExpenses: comparisonReport.expenses,
          netBalance: comparisonReport.netBalance,
          topSpendingCategory: spendingReport.categoryBreakdown[0]?.category || 'None',
          categoryCount: spendingReport.categoryBreakdown.length
        }
      };
      
      return JSON.stringify(comprehensiveData, null, 2);
    } else {
      // CSV format - combine all reports
      let csvContent = '=== FINANCIAL SUMMARY ===\n';
      csvContent += `Period: ${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}\n\n`;
      
      csvContent += '=== INCOME VS EXPENSES ===\n';
      csvContent += this.exportComparisonReportCSV(dateRange) + '\n\n';
      
      csvContent += '=== SPENDING BY CATEGORY ===\n';
      csvContent += this.exportSpendingReportCSV(dateRange) + '\n\n';
      
      csvContent += '=== BUDGET COMPARISON ===\n';
      csvContent += this.exportCategoryReportCSV(dateRange) + '\n';
      
      return csvContent;
    }
  }

  // Helper Methods

  /**
   * Get filtered transactions as Transaction objects
   */
  private getFilteredTransactions(filters?: ReportFilters): Transaction[] {
    let transactions = this.getTransactions().map(t => new Transaction(t));

    if (!filters) {
      return transactions;
    }

    // Apply date range filter
    if (filters.dateRange) {
      transactions = transactions.filter(t => 
        isDateInRange(t.date, filters.dateRange!.start, filters.dateRange!.end)
      );
    }

    // Apply period filter
    if (filters.period) {
      const dateRange = getDateFilter(filters.period);
      transactions = transactions.filter(t => 
        isDateInRange(t.date, dateRange.start, dateRange.end)
      );
    }

    // Apply other filters
    if (filters.categories && filters.categories.length > 0) {
      transactions = transactions.filter(t => 
        filters.categories!.includes(t.category)
      );
    }

    if (filters.types && filters.types.length > 0) {
      transactions = transactions.filter(t => 
        filters.types!.includes(t.type)
      );
    }

    if (filters.accounts && filters.accounts.length > 0) {
      transactions = transactions.filter(t => 
        filters.accounts!.includes(t.accountId)
      );
    }

    if (filters.amountRange) {
      transactions = transactions.filter(t => {
        const amount = Math.abs(t.amount);
        return amount >= filters.amountRange!.min && amount <= filters.amountRange!.max;
      });
    }

    return transactions;
  }

  /**
   * Get monthly trends data
   */
  private getMonthlyTrends(months: number = 12): Array<{
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

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      const monthTransactions = this.getFilteredTransactions({ dateRange: { start, end } });
      const income = sumBy(monthTransactions.filter(t => t.isIncome), 'amount');
      const expenses = Math.abs(sumBy(monthTransactions.filter(t => t.isExpense), 'amount'));

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

  /**
   * Check if budget is active in the given period
   */
  private isBudgetActiveInPeriod(budget: Budget, period: DateRange): boolean {
    return budget.startDate <= period.end && budget.endDate >= period.start;
  }

  /**
   * Get date range for a specific period
   */
  getDateRangeForPeriod(period: DatePeriod): DateRange {
    return getDateFilter(period);
  }

  /**
   * Get available categories from transactions
   */
  getAvailableCategories(): string[] {
    const transactions = this.getTransactions();
    const categories = transactions.map(t => t.category);
    return [...new Set(categories)].sort();
  }

  /**
   * Get available accounts from transactions
   */
  getAvailableAccounts(): string[] {
    const transactions = this.getTransactions();
    const accountIds = transactions.map(t => t.accountId);
    return [...new Set(accountIds)];
  }

  /**
   * Calculate statistics for a given period
   */
  getStatistics(dateRange: DateRange): {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    averageTransaction: number;
    largestExpense: number;
    largestIncome: number;
    mostActiveCategory: string;
    formattedStats: {
      totalIncome: string;
      totalExpenses: string;
      netBalance: string;
      averageTransaction: string;
      largestExpense: string;
      largestIncome: string;
    };
  } {
    const transactions = this.getFilteredTransactions({ dateRange });
    const income = sumBy(transactions.filter(t => t.isIncome), 'amount');
    const expenses = Math.abs(sumBy(transactions.filter(t => t.isExpense), 'amount'));
    const netBalance = income - expenses;
    
    const expenseTransactions = transactions.filter(t => t.isExpense);
    const incomeTransactions = transactions.filter(t => t.isIncome);
    
    const largestExpense = expenseTransactions.length > 0 
      ? Math.abs(Math.min(...expenseTransactions.map(t => t.amount)))
      : 0;
    
    const largestIncome = incomeTransactions.length > 0 
      ? Math.max(...incomeTransactions.map(t => t.amount))
      : 0;
    
    const averageTransaction = transactions.length > 0 
      ? Math.abs(sumBy(transactions, 'amount')) / transactions.length
      : 0;
    
    // Find most active category
    const categoryGroups = groupBy(transactions, 'category');
    const mostActiveCategory = Object.entries(categoryGroups)
      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'None';

    return {
      totalTransactions: transactions.length,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance,
      averageTransaction,
      largestExpense,
      largestIncome,
      mostActiveCategory,
      formattedStats: {
        totalIncome: formatCurrency(income),
        totalExpenses: formatCurrency(expenses),
        netBalance: formatCurrency(netBalance),
        averageTransaction: formatCurrency(averageTransaction),
        largestExpense: formatCurrency(largestExpense),
        largestIncome: formatCurrency(largestIncome)
      }
    };
  }
}