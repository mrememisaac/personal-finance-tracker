import type { AppState, AppAction } from '../../shared/types';
import type { Transaction } from './Transaction';
import type { BudgetService } from '../budget/BudgetService';
import type { AccountService } from '../accounts/AccountService';

export class TransactionService {
  private budgetService?: BudgetService;
  private accountService?: AccountService;

  constructor(
    private state: AppState,
    private dispatch: React.Dispatch<AppAction>
  ) {}

  setBudgetService(budgetService: BudgetService) {
    this.budgetService = budgetService;
  }

  setAccountService(accountService: AccountService) {
    this.accountService = accountService;
  }

  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'ADD_TRANSACTION',
      payload: newTransaction,
    });

    // Update account balance
    if (this.accountService) {
      this.accountService.updateAccountBalance(transaction.accountId, transaction.amount);
    }

    // Update budget progress
    if (this.budgetService && transaction.type === 'expense') {
      this.budgetService.updateBudgetProgress(transaction.category, Math.abs(transaction.amount));
    }

    return newTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const existingTransaction = this.state.transactions.find(t => t.id === id);
    if (!existingTransaction) return null;

    const updatedTransaction = {
      ...existingTransaction,
      ...updates,
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: { id, updates: { ...updates, updatedAt: new Date() } },
    });

    // Handle account balance changes
    if (this.accountService && (updates.amount !== undefined || updates.accountId !== undefined)) {
      // Revert old transaction effect
      this.accountService.updateAccountBalance(existingTransaction.accountId, -existingTransaction.amount);
      // Apply new transaction effect
      this.accountService.updateAccountBalance(
        updates.accountId || existingTransaction.accountId,
        updates.amount || existingTransaction.amount
      );
    }

    return updatedTransaction;
  }

  deleteTransaction(id: string): boolean {
    const transaction = this.state.transactions.find(t => t.id === id);
    if (!transaction) return false;

    this.dispatch({
      type: 'DELETE_TRANSACTION',
      payload: id,
    });

    // Revert account balance
    if (this.accountService) {
      this.accountService.updateAccountBalance(transaction.accountId, -transaction.amount);
    }

    return true;
  }

  getTransactions(filters?: {
    accountId?: string;
    category?: string;
    type?: 'income' | 'expense';
    dateRange?: { start: Date; end: Date };
  }): Transaction[] {
    let transactions = [...this.state.transactions];

    if (filters) {
      if (filters.accountId) {
        transactions = transactions.filter(t => t.accountId === filters.accountId);
      }
      if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
      }
      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.dateRange) {
        transactions = transactions.filter(t => 
          t.date >= filters.dateRange!.start && t.date <= filters.dateRange!.end
        );
      }
    }

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getTransactionsByCategory(): Map<string, Transaction[]> {
    const categoryMap = new Map<string, Transaction[]>();
    
    this.state.transactions.forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || [];
      categoryMap.set(transaction.category, [...existing, transaction]);
    });

    return categoryMap;
  }

  calculateTotalIncome(transactions?: Transaction[]): number {
    const txns = transactions || this.state.transactions;
    return txns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calculateTotalExpenses(transactions?: Transaction[]): number {
    const txns = transactions || this.state.transactions;
    return txns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  calculateNetBalance(transactions?: Transaction[]): number {
    const txns = transactions || this.state.transactions;
    return txns.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - Math.abs(t.amount);
    }, 0);
  }

  exportTransactions(format: 'csv' | 'json'): string {
    const transactions = this.getTransactions();
    
    if (format === 'json') {
      return JSON.stringify(transactions, null, 2);
    }
    
    // CSV format
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Account'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.description,
      t.category,
      t.type,
      t.amount.toString(),
      t.accountId
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}