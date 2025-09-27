import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from './services/ReportService';
import type { Transaction, Account, Budget } from '../../shared/types';

describe('ReportService', () => {
  let reportService: ReportService;
  let mockTransactions: Transaction[];
  let mockAccounts: Account[];
  let mockBudgets: Budget[];

  beforeEach(() => {
    // Mock transactions data
    mockTransactions = [
      {
        id: '1',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: 'Salary',
        category: 'Income',
        accountId: 'acc1',
        type: 'income',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        date: new Date('2024-01-16'),
        amount: -200,
        description: 'Groceries',
        category: 'Food',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        date: new Date('2024-01-17'),
        amount: -100,
        description: 'Gas',
        category: 'Transportation',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        date: new Date('2024-01-18'),
        amount: -150,
        description: 'Restaurant',
        category: 'Food',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Mock accounts data
    mockAccounts = [
      {
        id: 'acc1',
        name: 'Checking Account',
        type: 'checking',
        balance: 550,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Mock budgets data
    mockBudgets = [
      {
        id: 'budget1',
        category: 'Food',
        limit: 400,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    reportService = new ReportService(
      () => mockTransactions,
      () => mockAccounts,
      () => mockBudgets
    );
  });

  describe('generateSpendingReport', () => {
    it('should generate correct spending report', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const report = reportService.generateSpendingReport(dateRange);

      expect(report.totalSpent).toBe(450); // 200 + 100 + 150
      expect(report.categoryBreakdown).toHaveLength(2);
      
      // Food category should be first (highest spending)
      expect(report.categoryBreakdown[0].category).toBe('Food');
      expect(report.categoryBreakdown[0].amount).toBe(350); // 200 + 150
      expect(report.categoryBreakdown[0].percentage).toBe(77.78); // (350/450) * 100
      
      // Transportation category should be second
      expect(report.categoryBreakdown[1].category).toBe('Transportation');
      expect(report.categoryBreakdown[1].amount).toBe(100);
      expect(report.categoryBreakdown[1].percentage).toBe(22.22); // (100/450) * 100
    });

    it('should handle empty transactions', () => {
      const emptyService = new ReportService(
        () => [],
        () => mockAccounts,
        () => mockBudgets
      );

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const report = emptyService.generateSpendingReport(dateRange);

      expect(report.totalSpent).toBe(0);
      expect(report.categoryBreakdown).toHaveLength(0);
    });
  });

  describe('generateIncomeVsExpenseReport', () => {
    it('should generate correct comparison report', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const report = reportService.generateIncomeVsExpenseReport(dateRange);

      expect(report.income).toBe(1000);
      expect(report.expenses).toBe(450); // 200 + 100 + 150
      expect(report.netBalance).toBe(550); // 1000 - 450
      expect(report.period).toEqual(dateRange);
    });
  });

  describe('generateCategoryReport', () => {
    it('should generate category report with budget comparison', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const report = reportService.generateCategoryReport(dateRange);

      expect(report.categories).toHaveLength(2);
      
      // Food category should have budget comparison
      const foodCategory = report.categories.find(c => c.name === 'Food');
      expect(foodCategory).toBeDefined();
      expect(foodCategory!.spent).toBe(350);
      expect(foodCategory!.budgeted).toBe(400);
      
      // Transportation category should have no budget
      const transportCategory = report.categories.find(c => c.name === 'Transportation');
      expect(transportCategory).toBeDefined();
      expect(transportCategory!.spent).toBe(100);
      expect(transportCategory!.budgeted).toBe(0);
    });
  });

  describe('getMonthlyTrendsChartData', () => {
    it('should generate chart data for monthly trends', () => {
      const chartData = reportService.getMonthlyTrendsChartData(3);

      expect(chartData.labels).toHaveLength(3);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe('Income');
      expect(chartData.datasets[1].label).toBe('Expenses');
      expect(chartData.datasets[0].data).toHaveLength(3);
      expect(chartData.datasets[1].data).toHaveLength(3);
    });
  });

  describe('getExpenseDistributionChartData', () => {
    it('should generate pie chart data for expense distribution', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const chartData = reportService.getExpenseDistributionChartData(dateRange);

      expect(chartData.labels).toEqual(['Food', 'Transportation']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([350, 100]);
      expect(chartData.datasets[0].backgroundColor).toHaveLength(2);
    });
  });

  describe('getIncomeVsExpensesChartData', () => {
    it('should generate bar chart data for income vs expenses', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const chartData = reportService.getIncomeVsExpensesChartData(dateRange);

      expect(chartData.labels).toEqual(['Income', 'Expenses']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([1000, 450]);
      expect(chartData.datasets[0].backgroundColor).toEqual(['#10b981', '#ef4444']);
    });
  });

  describe('exportSpendingReportCSV', () => {
    it('should export spending report to CSV format', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const csv = reportService.exportSpendingReportCSV(dateRange);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Category,Amount,Percentage');
      expect(lines[1]).toBe('Total Spent,450,100%');
      expect(lines[2]).toBe('Food,350,77.78%');
      expect(lines[3]).toBe('Transportation,100,22.22%');
    });
  });

  describe('exportComparisonReportCSV', () => {
    it('should export comparison report to CSV format', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const csv = reportService.exportComparisonReportCSV(dateRange);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Metric,Amount');
      expect(lines[1]).toBe('Income,1000');
      expect(lines[2]).toBe('Expenses,450');
      expect(lines[3]).toBe('Net Balance,550');
    });
  });

  describe('exportComprehensiveReport', () => {
    it('should export comprehensive report in JSON format', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const json = reportService.exportComprehensiveReport(dateRange, 'json');
      const data = JSON.parse(json);

      expect(data.period.start).toBe(dateRange.start.toISOString());
      expect(data.period.end).toBe(dateRange.end.toISOString());
      expect(data.spending.totalSpent).toBe(450);
      expect(data.comparison.income).toBe(1000);
      expect(data.comparison.expenses).toBe(450);
      expect(data.summary.totalIncome).toBe(1000);
      expect(data.summary.totalExpenses).toBe(450);
      expect(data.summary.netBalance).toBe(550);
      expect(data.summary.topSpendingCategory).toBe('Food');
    });

    it('should export comprehensive report in CSV format', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const csv = reportService.exportComprehensiveReport(dateRange, 'csv');

      expect(csv).toContain('=== FINANCIAL SUMMARY ===');
      expect(csv).toContain('=== INCOME VS EXPENSES ===');
      expect(csv).toContain('=== SPENDING BY CATEGORY ===');
      expect(csv).toContain('=== BUDGET COMPARISON ===');
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const stats = reportService.getStatistics(dateRange);

      expect(stats.totalTransactions).toBe(4);
      expect(stats.totalIncome).toBe(1000);
      expect(stats.totalExpenses).toBe(450);
      expect(stats.netBalance).toBe(550);
      expect(stats.averageTransaction).toBe(137.5); // (450 + 100) / 4 = 550 / 4 = 137.5 (absolute values)
      expect(stats.largestExpense).toBe(200);
      expect(stats.largestIncome).toBe(1000);
      expect(stats.mostActiveCategory).toBe('Food'); // 2 transactions
    });
  });

  describe('getAvailableCategories', () => {
    it('should return unique sorted categories', () => {
      const categories = reportService.getAvailableCategories();

      expect(categories).toEqual(['Food', 'Income', 'Transportation']);
    });
  });

  describe('getAvailableAccounts', () => {
    it('should return unique account IDs', () => {
      const accounts = reportService.getAvailableAccounts();

      expect(accounts).toEqual(['acc1']);
    });
  });

  describe('generateAccountBalanceHistory', () => {
    it('should generate balance history for an account', () => {
      const history = reportService.generateAccountBalanceHistory('acc1');

      expect(history).toHaveLength(4);
      
      // Check balance progression
      expect(history[0].balance).toBe(1550); // 550 + 1000
      expect(history[1].balance).toBe(1350); // 1550 - 200
      expect(history[2].balance).toBe(1250); // 1350 - 100
      expect(history[3].balance).toBe(1100); // 1250 - 150
    });

    it('should return empty array for non-existent account', () => {
      const history = reportService.generateAccountBalanceHistory('nonexistent');

      expect(history).toHaveLength(0);
    });
  });
});