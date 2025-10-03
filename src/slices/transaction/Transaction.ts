import type { Transaction as ITransaction, ValidationResult } from '../../shared/types';

export class Transaction implements ITransaction {
  public id: string;
  public date: Date;
  public amount: number;
  public description: string;
  public category: string;
  public accountId: string;
  public type: 'income' | 'expense';
  public tags?: string[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: ITransaction) {
    this.id = data.id;
    this.date = data.date;
    this.amount = data.amount;
    this.description = data.description;
    this.category = data.category;
    this.accountId = data.accountId;
    this.type = data.type;
    this.tags = data.tags;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Computed properties
  get isIncome(): boolean {
    return this.type === 'income';
  }

  get isExpense(): boolean {
    return this.type === 'expense';
  }

  get formattedAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    
    const absAmount = Math.abs(this.amount);
    const formattedValue = formatter.format(absAmount);
    
    // Add sign prefix for clarity
    if (this.isIncome) {
      return `+${formattedValue}`;
    } else {
      return `-${formattedValue}`;
    }
  }

  get formattedDate(): string {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Validation methods
  static validate(data: Partial<ITransaction>): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!data.amount || data.amount === 0) {
      errors.push('Amount is required and must be non-zero');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (!data.accountId || data.accountId.trim().length === 0) {
      errors.push('Account ID is required');
    }

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Type must be either "income" or "expense"');
    }

    if (!data.date || !(data.date instanceof Date) || isNaN(data.date.getTime())) {
      errors.push('Valid date is required');
    }

    // Business logic validation
    if (data.amount && data.amount < 0) {
      errors.push('Amount must be positive (type determines income/expense)');
    }

    if (data.description && data.description.length > 255) {
      errors.push('Description must be 255 characters or less');
    }

    if (data.category && data.category.length > 50) {
      errors.push('Category must be 50 characters or less');
    }

    // Date validation - not in the future beyond today
    if (data.date && data.date > new Date()) {
      errors.push('Transaction date cannot be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Instance validation method
  validate(): ValidationResult {
    return Transaction.validate(this);
  }

  // Update method with validation
  update(updates: Partial<ITransaction>): ValidationResult {
    const updatedData = { ...this, ...updates };
    const validation = Transaction.validate(updatedData);
    
    if (validation.isValid) {
      Object.assign(this, updates);
      this.updatedAt = new Date();
    }
    
    return validation;
  }

  // Helper method to create a new Transaction with generated metadata
  static create(data: Omit<ITransaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const now = new Date();
    const transactionData: ITransaction = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return new Transaction(transactionData);
  }

  // Method to convert to plain object (useful for serialization)
  toJSON(): ITransaction {
    return {
      id: this.id,
      date: this.date,
      amount: this.amount,
      description: this.description,
      category: this.category,
      accountId: this.accountId,
      type: this.type,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Method to clone the transaction
  clone(): Transaction {
    return new Transaction(this.toJSON());
  }
}