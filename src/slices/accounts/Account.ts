import type { Account as IAccount, ValidationResult } from '../../shared/types';

export class Account implements IAccount {
  public id: string;
  public name: string;
  public type: 'checking' | 'savings' | 'credit' | 'investment';
  public balance: number;
  public currency: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IAccount) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.balance = data.balance;
    this.currency = data.currency;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Computed properties
  get formattedBalance(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD',
      minimumFractionDigits: 2,
    });
    
    return formatter.format(this.balance);
  }

  get isPositiveBalance(): boolean {
    return this.balance > 0;
  }

  get isNegativeBalance(): boolean {
    return this.balance < 0;
  }

  get isZeroBalance(): boolean {
    return this.balance === 0;
  }

  get accountTypeDisplayName(): string {
    const typeNames = {
      checking: 'Checking Account',
      savings: 'Savings Account',
      credit: 'Credit Card',
      investment: 'Investment Account',
    };
    
    return typeNames[this.type];
  }

  // Balance calculation methods
  updateBalance(amount: number): void {
    this.balance += amount;
    this.updatedAt = new Date();
  }

  setBalance(newBalance: number): void {
    this.balance = newBalance;
    this.updatedAt = new Date();
  }

  // Credit card specific methods
  get availableCredit(): number {
    if (this.type === 'credit') {
      // For credit cards, negative balance means available credit
      return Math.abs(this.balance);
    }
    return 0;
  }

  get creditUtilization(): number {
    if (this.type === 'credit' && this.balance < 0) {
      // Assuming credit limit is stored as positive balance initially
      // This is a simplified implementation
      return 0; // Would need credit limit to calculate properly
    }
    return 0;
  }

  // Validation methods
  static validate(data: Partial<IAccount>): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!data.type || !['checking', 'savings', 'credit', 'investment'].includes(data.type)) {
      errors.push('Account type must be one of: checking, savings, credit, investment');
    }

    if (data.balance === undefined || data.balance === null) {
      errors.push('Initial balance is required');
    }

    if (!data.currency || data.currency.trim().length === 0) {
      errors.push('Currency is required');
    }

    // Business logic validation
    if (data.name && data.name.length > 100) {
      errors.push('Account name must be 100 characters or less');
    }

    if (data.currency && data.currency.length !== 3) {
      errors.push('Currency must be a 3-letter ISO code (e.g., USD, EUR)');
    }

    // Type-specific validation
    if (data.type === 'credit' && data.balance && data.balance > 0) {
      errors.push('Credit card accounts should typically start with zero or negative balance');
    }

    if (data.type === 'savings' && data.balance && data.balance < 0) {
      errors.push('Savings accounts cannot have negative balance');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Instance validation method
  validate(): ValidationResult {
    return Account.validate(this);
  }

  // Update method with validation
  update(updates: Partial<IAccount>): ValidationResult {
    const updatedData = { ...this, ...updates };
    const validation = Account.validate(updatedData);
    
    if (validation.isValid) {
      Object.assign(this, updates);
      this.updatedAt = new Date();
    }
    
    return validation;
  }

  // Helper method to create a new Account with generated metadata
  static create(data: Omit<IAccount, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const now = new Date();
    const accountData: IAccount = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return new Account(accountData);
  }

  // Method to convert to plain object (useful for serialization)
  toJSON(): IAccount {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      balance: this.balance,
      currency: this.currency,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Method to clone the account
  clone(): Account {
    return new Account(this.toJSON());
  }

  // Method to check if account can accommodate a transaction
  canAccommodateTransaction(amount: number): boolean {
    const newBalance = this.balance + amount;
    
    switch (this.type) {
      case 'savings':
        // Savings accounts cannot go negative
        return newBalance >= 0;
      case 'checking':
        // Checking accounts might have overdraft protection
        // For now, allow small negative balances
        return newBalance >= -1000;
      case 'credit':
        // Credit cards can go more negative (up to credit limit)
        // This is simplified - would need actual credit limit
        return true;
      case 'investment':
        // Investment accounts typically cannot go negative
        return newBalance >= 0;
      default:
        return true;
    }
  }

  // Method to get account summary
  getSummary(): {
    name: string;
    type: string;
    balance: string;
    status: 'positive' | 'negative' | 'zero';
  } {
    return {
      name: this.name,
      type: this.accountTypeDisplayName,
      balance: this.formattedBalance,
      status: this.isPositiveBalance ? 'positive' : 
              this.isNegativeBalance ? 'negative' : 'zero',
    };
  }
}