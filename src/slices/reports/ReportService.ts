import type { AppState, AppAction } from '../../shared/types';
import type { TransactionService } from '../transaction/TransactionService';
import type { AccountService } from '../accounts/AccountService';
import type { BudgetService } from '../budget/BudgetService';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface SpendingReport {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  monthlyTrends: { month: string; income: number; expenses: number }[];
}

export class ReportService {
  private transactionService?: TransactionService;
  private accountService?: AccountService;
  private budgetService?: BudgetService;

  constructor(
    private state: AppState,
    private dispatch: React.Dispatch<AppAction>
  ) {}

  setTransactionService(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  setAccountService(accountService: AccountService) {
    this.accountService = accountService;
  }

  setBudgetService(budgetService: BudgetService) {
    this.budgetService = budgetService;
  }

  generateSpendingReport(dateRange?: { start: Date; end: Date }): SpendingReport {
    if (!this.transactionService) {
      throw new Error('TransactionService not available');
    }

    const transactions = dateRange 
      ? this.transactionService.getTransactions({ dateRange })
      : this.transactionService.getTransactions();

    const totalIncome = this.transactionService.calculateTotalIncome(transactions);
    const totalExpenses = this.transactionService.calculateTotalExpenses(transactions);
    const netBalance = totalIncome - totalExpenses;

    // Category breakdown for expenses
    const categoryMap = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.amount));
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trends
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        current.income += t.amount;
      } else {
        current.expenses += Math.abs(t.amount);
      }
      
      monthlyMap.set(monthKey, current);
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      monthlyTrends,
    };
  }

  getIncomeVsExpenseChartData(dateRange?: { start: Date; end: Date }): ChartData {
    const report = this.generateSpendingReport(dateRange);
    
    return {
      labels: report.monthlyTrends.map(t => {
        const [year, month] = t.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      }),
      datasets: [
        {
          label: 'Income',
          data: report.monthlyTrends.map(t => t.income),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        },
        {
          label: 'Expenses',
          data: report.monthlyTrends.map(t => t.expenses),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
      ],
    };
  }

  getCategoryBreakdownChartData(dateRange?: { start: Date; end: Date }): ChartData {
    const report = this.generateSpendingReport(dateRange);
    
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    return {
      labels: report.categoryBreakdown.map(c => c.category),
      datasets: [
        {
          label: 'Expenses by Category',
          data: report.categoryBreakdown.map(c => c.amount),
          backgroundColor: colors.slice(0, report.categoryBreakdown.length),
        },
      ],
    };
  }

  getAccountBalanceChartData(): ChartData {
    if (!this.accountService) {
      throw new Error('AccountService not available');
    }

    const accounts = this.accountService.getAccounts();
    
    return {
      labels: accounts.map(a => a.name),
      datasets: [
        {
          label: 'Account Balances',
          data: accounts.map(a => a.balance),
          backgroundColor: accounts.map((_, index) => {
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
            return colors[index % colors.length];
          }),
        },
      ],
    };
  }

  getBudgetProgressChartData(): ChartData {
    if (!this.budgetService) {
      throw new Error('BudgetService not available');
    }

    const budgets = this.budgetService.getBudgets().filter(b => b.isActive);
    const progressData = budgets.map(budget => {
      const progress = this.budgetService!.calculateBudgetProgress(budget.id);
      return {
        category: budget.category,
        percentage: Math.min(100, progress.percentage),
        status: progress.status,
      };
    });

    return {
      labels: progressData.map(d => d.category),
      datasets: [
        {
          label: 'Budget Usage (%)',
          data: progressData.map(d => d.percentage),
          backgroundColor: progressData.map(d => {
            switch (d.status) {
              case 'safe': return '#10B981';
              case 'warning': return '#F59E0B';
              case 'danger': return '#EF4444';
              default: return '#6B7280';
            }
          }),
        },
      ],
    };
  }

  exportReport(report: SpendingReport, format: 'csv' | 'json'): string {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // CSV format
    const lines: string[] = [];
    
    // Summary
    lines.push('Summary');
    lines.push('Total Income,Total Expenses,Net Balance');
    lines.push(`${report.totalIncome},${report.totalExpenses},${report.netBalance}`);
    lines.push('');
    
    // Category breakdown
    lines.push('Category Breakdown');
    lines.push('Category,Amount,Percentage');
    report.categoryBreakdown.forEach(item => {
      lines.push(`${item.category},${item.amount},${item.percentage.toFixed(2)}%`);
    });
    lines.push('');
    
    // Monthly trends
    lines.push('Monthly Trends');
    lines.push('Month,Income,Expenses');
    report.monthlyTrends.forEach(item => {
      lines.push(`${item.month},${item.income},${item.expenses}`);
    });

    return lines.join('\n');
  }

  getFinancialHealthScore(): {
    score: number;
    factors: {
      name: string;
      score: number;
      weight: number;
      description: string;
    }[];
  } {
    const factors = [
      {
        name: 'Income vs Expenses',
        score: this.calculateIncomeExpenseScore(),
        weight: 0.4,
        description: 'How well you manage spending relative to income',
      },
      {
        name: 'Budget Adherence',
        score: this.calculateBudgetAdherenceScore(),
        weight: 0.3,
        description: 'How well you stick to your budgets',
      },
      {
        name: 'Goal Progress',
        score: this.calculateGoalProgressScore(),
        weight: 0.2,
        description: 'Progress towards your financial goals',
      },
      {
        name: 'Account Diversity',
        score: this.calculateAccountDiversityScore(),
        weight: 0.1,
        description: 'Diversification of your accounts',
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);

    return {
      score: Math.round(weightedScore),
      factors,
    };
  }

  private calculateIncomeExpenseScore(): number {
    if (!this.transactionService) return 50;
    
    const totalIncome = this.transactionService.calculateTotalIncome();
    const totalExpenses = this.transactionService.calculateTotalExpenses();
    
    if (totalIncome === 0) return 0;
    
    const ratio = totalExpenses / totalIncome;
    if (ratio <= 0.5) return 100;
    if (ratio <= 0.7) return 80;
    if (ratio <= 0.9) return 60;
    if (ratio <= 1.0) return 40;
    return 20;
  }

  private calculateBudgetAdherenceScore(): number {
    if (!this.budgetService) return 50;
    
    const budgets = this.budgetService.getBudgets().filter(b => b.isActive);
    if (budgets.length === 0) return 50;
    
    let totalScore = 0;
    budgets.forEach(budget => {
      const progress = this.budgetService!.calculateBudgetProgress(budget.id);
      if (progress.percentage <= 80) {
        totalScore += 100;
      } else if (progress.percentage <= 100) {
        totalScore += 60;
      } else {
        totalScore += 20;
      }
    });
    
    return totalScore / budgets.length;
  }

  private calculateGoalProgressScore(): number {
    const goals = this.state.goals.filter(g => !g.isCompleted);
    if (goals.length === 0) return 50;
    
    let totalProgress = 0;
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      totalProgress += Math.min(100, progress);
    });
    
    return totalProgress / goals.length;
  }

  private calculateAccountDiversityScore(): number {
    if (!this.accountService) return 50;
    
    const accounts = this.accountService.getAccounts();
    const uniqueTypes = new Set(accounts.map(a => a.type));
    
    // Score based on number of different account types
    switch (uniqueTypes.size) {
      case 0: return 0;
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      default: return 100;
    }
  }
}