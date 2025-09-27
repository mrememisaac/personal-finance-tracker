import type { Dispatch } from 'react';
import type { 
  Account as IAccount, 
  Transaction as ITransaction,
  ValidationResult,
  AppAction 
} from '../../../shared/types';
import { Account } from '../Account';
import { 
  formatCurrency, 
  sortBy,
  sumBy
} from '../../../shared/utils';

export class AccountService {
  private dispatch: Dispatch<AppAction>;
  private getAccounts: () => IAccount[];
  private getTransactions: () => ITransaction[];

  constructor(
    dispatch: Dispatch<AppAction>,
    getAccounts: () => IAccount[],
    getTransactions: () => ITransaction[]
  ) {
    this.dispatch = dispatch;
    this.getAccounts = getAccounts;
    this.getTransactions = getTransactions;
  }

  // CRUD Operations

  /**
   * Add a new account
   */
  addAccount(accountData: Omit<IAccount, 'id' | 'createdAt' | 'updatedAt'>): ValidationResult & { account?: Account } {
    // Validate the account data
    const validation = Account.validate(accountData as Partial<IAccount>);
    
    if (!validation.isValid) {
      return validation;
    }

    // Check for duplicate account names
    const existingAccounts = this.getAccounts();
    const duplicateName = existingAccounts.find(a => 
      a.name.toLowerCase() === accountData.name.toLowerCase()
    );
    
    if (duplicateName) {
      return {
        isValid: false,
        errors: ['An account with this name already exists']
      };
    }

    // Create new account with generated metadata
    const account = Account.create(accountData);
    
    // Dispatch action to add to global state
    this.dispatch({
      type: 'ADD_ACCOUNT',
      payload: account.toJSON()
    });

    return {
      isValid: true,
      errors: [],
      account
    };
  }

  /**
   * Update an existing account
   */
  updateAccount(id: string, updates: Partial<IAccount>): ValidationResult & { account?: Account } {
    const accounts = this.getAccounts();
    const existingAccount = accounts.find(a => a.id === id);
    
    if (!existingAccount) {
      return {
        isValid: false,
        errors: ['Account not found']
      };
    }

    // Check for duplicate names (excluding current account)
    if (updates.name) {
      const duplicateName = accounts.find(a => 
        a.id !== id && a.name.toLowerCase() === updates.name!.toLowerCase()
      );
      
      if (duplicateName) {
        return {
          isValid: false,
          errors: ['An account with this name already exists']
        };
      }
    }

    // Merge existing data with updates for validation
    const updatedData = { ...existingAccount, ...updates };
    const validation = Account.validate(updatedData);
    
    if (!validation.isValid) {
      return validation;
    }

    // Dispatch update action
    this.dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: { id, updates }
    });

    // Return updated account
    const account = new Account(updatedData);
    return {
      isValid: true,
      errors: [],
      account
    };
  }

  /**
   * Delete an account
   */
  deleteAccount(id: string): ValidationResult {
    const accounts = this.getAccounts();
    const existingAccount = accounts.find(a => a.id === id);
    
    if (!existingAccount) {
      return {
        isValid: false,
        errors: ['Account not found']
      };
    }

    // Check if account has transactions
    const transactions = this.getTransactions();
    const accountTransactions = transactions.filter(t => t.accountId === id);
    
    if (accountTransactions.length > 0) {
      return {
        isValid: false,
        errors: [`Cannot delete account with ${accountTransactions.length} existing transactions. Please delete or reassign transactions first.`]
      };
    }

    this.dispatch({
      type: 'DELETE_ACCOUNT',
      payload: id
    });

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Get a single account by ID
   */
  getAccount(id: string): Account | null {
    const accounts = this.getAccounts();
    const accountData = accounts.find(a => a.id === id);
    
    return accountData ? new Account(accountData) : null;
  }

  /**
   * Get all accounts as Account instances
   */
  getAllAccounts(): Account[] {
    return this.getAccounts().map(a => new Account(a));
  }

  // Balance Calculation Methods

  /**
   * Calculate current balance for an account based on transactions
   */
  calculateAccountBalance(accountId: string): number {
    const transactions = this.getTransactions();
    const accountTransactions = transactions.filter(t => t.accountId === accountId);
    
    const account = this.getAccount(accountId);
    if (!account) {
      return 0;
    }

    // Start with the account's initial balance and add all transactions
    let balance = account.balance;
    
    // Add all transaction amounts (income is positive, expenses are negative)
    accountTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        balance += Math.abs(transaction.amount);
      } else {
        balance -= Math.abs(transaction.amount);
      }
    });

    return balance;
  }

  /**
   * Update account balance based on current transactions
   */
  updateAccountBalance(accountId: string): ValidationResult & { newBalance?: number } {
    const account = this.getAccount(accountId);
    if (!account) {
      return {
        isValid: false,
        errors: ['Account not found']
      };
    }

    const newBalance = this.calculateAccountBalance(accountId);
    
    const result = this.updateAccount(accountId, { balance: newBalance });
    
    return {
      ...result,
      newBalance
    };
  }

  /**
   * Get account summaries with current balances
   */
  getAccountSummaries(): Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    formattedBalance: string;
    status: 'positive' | 'negative' | 'zero';
    transactionCount: number;
  }> {
    const accounts = this.getAllAccounts();
    const transactions = this.getTransactions();

    return accounts.map(account => {
      const currentBalance = this.calculateAccountBalance(account.id);
      const accountTransactions = transactions.filter(t => t.accountId === account.id);

      return {
        id: account.id,
        name: account.name,
        type: account.accountTypeDisplayName,
        balance: currentBalance,
        formattedBalance: formatCurrency(currentBalance, account.currency),
        status: currentBalance > 0 ? 'positive' : currentBalance < 0 ? 'negative' : 'zero',
        transactionCount: accountTransactions.length
      };
    });
  }

  // Account Type Operations

  /**
   * Get accounts by type
   */
  getAccountsByType(type: 'checking' | 'savings' | 'credit' | 'investment'): Account[] {
    return this.getAllAccounts().filter(account => account.type === type);
  }

  /**
   * Get total balance by account type
   */
  getTotalBalanceByType(): Record<string, { balance: number; formattedBalance: string; count: number }> {
    const accounts = this.getAllAccounts();
    const summary: Record<string, { balance: number; formattedBalance: string; count: number }> = {};

    accounts.forEach(account => {
      const currentBalance = this.calculateAccountBalance(account.id);
      
      if (!summary[account.type]) {
        summary[account.type] = {
          balance: 0,
          formattedBalance: '',
          count: 0
        };
      }

      summary[account.type].balance += currentBalance;
      summary[account.type].count += 1;
    });

    // Format the balances
    Object.keys(summary).forEach(type => {
      summary[type].formattedBalance = formatCurrency(summary[type].balance);
    });

    return summary;
  }

  // Validation Methods

  /**
   * Check if account can accommodate a transaction
   */
  canAccommodateTransaction(accountId: string, amount: number): ValidationResult {
    const account = this.getAccount(accountId);
    
    if (!account) {
      return {
        isValid: false,
        errors: ['Account not found']
      };
    }

    const currentBalance = this.calculateAccountBalance(accountId);
    const canAccommodate = account.canAccommodateTransaction(amount);
    
    if (!canAccommodate) {
      const newBalance = currentBalance + amount;
      let errorMessage = '';

      switch (account.type) {
        case 'savings':
          errorMessage = 'Savings accounts cannot have negative balance';
          break;
        case 'checking':
          errorMessage = 'Transaction would exceed overdraft limit';
          break;
        case 'investment':
          errorMessage = 'Investment accounts cannot have negative balance';
          break;
        default:
          errorMessage = 'Transaction cannot be accommodated';
      }

      return {
        isValid: false,
        errors: [`${errorMessage}. Current balance: ${formatCurrency(currentBalance, account.currency)}, New balance would be: ${formatCurrency(newBalance, account.currency)}`]
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Validate account type-specific business rules
   */
  validateAccountTypeRules(accountData: Partial<IAccount>): ValidationResult {
    const errors: string[] = [];

    if (!accountData.type) {
      return { isValid: true, errors: [] };
    }

    switch (accountData.type) {
      case 'credit':
        if (accountData.balance && accountData.balance > 0) {
          errors.push('Credit card accounts should start with zero or negative balance');
        }
        break;
      case 'savings':
        if (accountData.balance && accountData.balance < 0) {
          errors.push('Savings accounts cannot have negative balance');
        }
        break;
      case 'investment':
        if (accountData.balance && accountData.balance < 0) {
          errors.push('Investment accounts cannot have negative balance');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Currency Operations

  /**
   * Get accounts by currency
   */
  getAccountsByCurrency(currency: string): Account[] {
    return this.getAllAccounts().filter(account => account.currency === currency);
  }

  /**
   * Get unique currencies used across all accounts
   */
  getUniqueCurrencies(): string[] {
    const accounts = this.getAccounts();
    const currencies = accounts.map(a => a.currency);
    return [...new Set(currencies)].sort();
  }

  /**
   * Convert balance between currencies (simplified - would need exchange rates in real app)
   */
  convertBalance(amount: number, fromCurrency: string, toCurrency: string): number {
    // This is a simplified implementation
    // In a real application, you would use actual exchange rates
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Simplified conversion rates (for demo purposes only)
    const rates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'CAD': 1.25,
      'JPY': 110.0
    };

    const usdAmount = amount / (rates[fromCurrency] || 1);
    return usdAmount * (rates[toCurrency] || 1);
  }

  // Export Operations

  /**
   * Export accounts to CSV format
   */
  exportToCSV(): string {
    const accounts = this.getAllAccounts();
    
    if (accounts.length === 0) {
      return 'No accounts to export';
    }

    // CSV headers
    const headers = [
      'Name',
      'Type',
      'Balance',
      'Currency',
      'Current Balance',
      'Transaction Count',
      'Created At',
      'Updated At'
    ];

    // Convert accounts to CSV rows
    const rows = accounts.map(account => {
      const currentBalance = this.calculateAccountBalance(account.id);
      const transactionCount = this.getTransactions().filter(t => t.accountId === account.id).length;

      return [
        `"${account.name.replace(/"/g, '""')}"`, // Escape quotes
        account.type,
        account.balance.toString(),
        account.currency,
        currentBalance.toString(),
        transactionCount.toString(),
        account.createdAt.toISOString(),
        account.updatedAt.toISOString()
      ];
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
  }

  /**
   * Export accounts to JSON format
   */
  exportToJSON(): string {
    const accounts = this.getAllAccounts();
    const summaries = this.getAccountSummaries();
    const typeBalances = this.getTotalBalanceByType();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      accountCount: accounts.length,
      summary: {
        totalBalance: summaries.reduce((sum, acc) => sum + acc.balance, 0),
        typeBreakdown: typeBalances
      },
      accounts: accounts.map(account => ({
        ...account.toJSON(),
        currentBalance: this.calculateAccountBalance(account.id),
        transactionCount: this.getTransactions().filter(t => t.accountId === account.id).length
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Search and Filter Operations

  /**
   * Search accounts by name
   */
  searchAccounts(query: string): Account[] {
    const accounts = this.getAllAccounts();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      return accounts;
    }

    return accounts.filter(account => 
      account.name.toLowerCase().includes(searchTerm) ||
      account.type.toLowerCase().includes(searchTerm) ||
      account.accountTypeDisplayName.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get accounts sorted by specified field
   */
  getSortedAccounts(sortBy: keyof IAccount = 'name', direction: 'asc' | 'desc' = 'asc'): Account[] {
    const accounts = this.getAllAccounts();
    
    return accounts.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

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

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Utility Methods

  /**
   * Get net worth (sum of all account balances)
   */
  getNetWorth(): { amount: number; formattedAmount: string; breakdown: Array<{ type: string; amount: number; formattedAmount: string }> } {
    const typeBalances = this.getTotalBalanceByType();
    const totalAmount = Object.values(typeBalances).reduce((sum, type) => sum + type.balance, 0);

    const breakdown = Object.entries(typeBalances).map(([type, data]) => ({
      type,
      amount: data.balance,
      formattedAmount: data.formattedBalance
    }));

    return {
      amount: totalAmount,
      formattedAmount: formatCurrency(totalAmount),
      breakdown
    };
  }

  /**
   * Get account health status
   */
  getAccountHealth(): {
    healthy: number;
    warning: number;
    critical: number;
    accounts: Array<{
      id: string;
      name: string;
      status: 'healthy' | 'warning' | 'critical';
      reason: string;
    }>;
  } {
    const accounts = this.getAllAccounts();
    const health = {
      healthy: 0,
      warning: 0,
      critical: 0,
      accounts: [] as Array<{
        id: string;
        name: string;
        status: 'healthy' | 'warning' | 'critical';
        reason: string;
      }>
    };

    accounts.forEach(account => {
      const currentBalance = this.calculateAccountBalance(account.id);
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let reason = 'Account is in good standing';

      // Determine health status based on account type and balance
      switch (account.type) {
        case 'checking':
          if (currentBalance < 0) {
            status = 'warning';
            reason = 'Account has negative balance (overdraft)';
          } else if (currentBalance < 100) {
            status = 'warning';
            reason = 'Low balance - consider adding funds';
          }
          break;
        case 'savings':
          if (currentBalance < 0) {
            status = 'critical';
            reason = 'Savings account cannot have negative balance';
          } else if (currentBalance < 500) {
            status = 'warning';
            reason = 'Low savings balance';
          }
          break;
        case 'credit':
          if (currentBalance < -5000) {
            status = 'warning';
            reason = 'High credit card balance';
          } else if (currentBalance < -10000) {
            status = 'critical';
            reason = 'Very high credit card debt';
          }
          break;
        case 'investment':
          if (currentBalance < 0) {
            status = 'critical';
            reason = 'Investment account cannot have negative balance';
          }
          break;
      }

      health[status]++;
      health.accounts.push({
        id: account.id,
        name: account.name,
        status,
        reason
      });
    });

    return health;
  }
}