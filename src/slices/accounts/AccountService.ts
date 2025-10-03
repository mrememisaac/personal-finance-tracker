import type { AppState, AppAction } from '../../shared/types';
import { Account } from './Account';

export class AccountService {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  constructor(
    state: AppState,
    dispatch: React.Dispatch<AppAction>
  ) {
    this.state = state;
    this.dispatch = dispatch;
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'ADD_ACCOUNT',
      payload: newAccount,
    });

    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const existingAccount = this.state.accounts.find(a => a.id === id);
    if (!existingAccount) return null;

    const updatedAccountData = {
      ...existingAccount,
      ...updates,
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: { id, updates: { ...updates, updatedAt: new Date() } },
    });

    return new Account(updatedAccountData);
  }

  deleteAccount(id: string): boolean {
    const account = this.state.accounts.find(a => a.id === id);
    if (!account) return false;

    // Check if account has transactions
    const hasTransactions = this.state.transactions.some(t => t.accountId === id);
    if (hasTransactions) {
      throw new Error('Cannot delete account with existing transactions');
    }

    this.dispatch({
      type: 'DELETE_ACCOUNT',
      payload: id,
    });

    return true;
  }

  getAccounts(): Account[] {
    return [...this.state.accounts].sort((a, b) => a.name.localeCompare(b.name))
      .map(account => new Account(account));
  }

  getAccountById(id: string): Account | undefined {
    const account = this.state.accounts.find(a => a.id === id);
    return account ? new Account(account) : undefined;
  }

  updateAccountBalance(accountId: string, amount: number): void {
    const account = this.getAccountById(accountId);
    if (!account) return;

    const newBalance = account.balance + amount;
    this.updateAccount(accountId, { balance: newBalance });
  }

  calculateAccountBalance(accountId: string): number {
    const account = this.getAccountById(accountId);
    if (!account) return 0;

    // Calculate balance from transactions
    const transactions = this.state.transactions.filter(t => t.accountId === accountId);
    const calculatedBalance = transactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - Math.abs(t.amount);
    }, 0);

    return calculatedBalance;
  }

  getAccountSummary(): {
    totalBalance: number;
    accountsByType: Map<string, Account[]>;
    totalAccounts: number;
  } {
    const accounts = this.getAccounts();
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    const accountsByType = new Map<string, Account[]>();
    accounts.forEach(account => {
      const existing = accountsByType.get(account.type) || [];
      accountsByType.set(account.type, [...existing, account]);
    });

    return {
      totalBalance,
      accountsByType,
      totalAccounts: accounts.length,
    };
  }

  validateAccountData(account: Partial<Account>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!account.name || account.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!account.type || !['checking', 'savings', 'credit', 'investment'].includes(account.type)) {
      errors.push('Valid account type is required');
    }

    if (account.balance !== undefined && isNaN(account.balance)) {
      errors.push('Balance must be a valid number');
    }

    if (!account.currency || account.currency.trim().length === 0) {
      errors.push('Currency is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}