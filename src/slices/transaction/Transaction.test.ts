import { describe, it, expect, beforeEach } from 'vitest';
import { Transaction } from './Transaction';
import { Transaction as ITransaction } from '../../shared/types';

describe('Transaction Model', () => {
  let validTransactionData: ITransaction;

  beforeEach(() => {
    validTransactionData = {
      id: 'test-id',
      date: new Date('2024-01-15'),
      amount: 100.50,
      description: 'Test transaction',
      category: 'Food',
      accountId: 'account-1',
      type: 'expense',
      tags: ['restaurant', 'lunch'],
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };
  });

  describe('Constructor and Basic Properties', () => {
    it('should create a transaction with all properties', () => {
      const transaction = new Transaction(validTransactionData);

      expect(transaction.id).toBe('test-id');
      expect(transaction.amount).toBe(100.50);
      expect(transaction.description).toBe('Test transaction');
      expect(transaction.category).toBe('Food');
      expect(transaction.accountId).toBe('account-1');
      expect(transaction.type).toBe('expense');
      expect(transaction.tags).toEqual(['restaurant', 'lunch']);
    });
  });

  describe('Computed Properties', () => {
    it('should correctly identify income transactions', () => {
      const incomeTransaction = new Transaction({
        ...validTransactionData,
        type: 'income',
      });

      expect(incomeTransaction.isIncome).toBe(true);
      expect(incomeTransaction.isExpense).toBe(false);
    });

    it('should correctly identify expense transactions', () => {
      const expenseTransaction = new Transaction({
        ...validTransactionData,
        type: 'expense',
      });

      expect(expenseTransaction.isIncome).toBe(false);
      expect(expenseTransaction.isExpense).toBe(true);
    });

    it('should format amount correctly for income', () => {
      const incomeTransaction = new Transaction({
        ...validTransactionData,
        type: 'income',
        amount: 1500.75,
      });

      expect(incomeTransaction.formattedAmount).toBe('+$1,500.75');
    });

    it('should format amount correctly for expense', () => {
      const expenseTransaction = new Transaction({
        ...validTransactionData,
        type: 'expense',
        amount: 250.30,
      });

      expect(expenseTransaction.formattedAmount).toBe('-$250.30');
    });

    it('should format date correctly', () => {
      const transaction = new Transaction({
        ...validTransactionData,
        date: new Date('2024-03-15'),
      });

      expect(transaction.formattedDate).toBe('Mar 15, 2024');
    });
  });

  describe('Static Validation', () => {
    it('should validate a correct transaction', () => {
      const result = Transaction.validate(validTransactionData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject transaction without amount', () => {
      const invalidData = { ...validTransactionData, amount: 0 };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount is required and must be non-zero');
    });

    it('should reject transaction without description', () => {
      const invalidData = { ...validTransactionData, description: '' };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should reject transaction without category', () => {
      const invalidData = { ...validTransactionData, category: '' };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should reject transaction without accountId', () => {
      const invalidData = { ...validTransactionData, accountId: '' };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account ID is required');
    });

    it('should reject transaction with invalid type', () => {
      const invalidData = { ...validTransactionData, type: 'invalid' as any };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Type must be either "income" or "expense"');
    });

    it('should reject transaction with negative amount', () => {
      const invalidData = { ...validTransactionData, amount: -100 };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be positive (type determines income/expense)');
    });

    it('should reject transaction with future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const invalidData = { ...validTransactionData, date: futureDate };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transaction date cannot be in the future');
    });

    it('should reject transaction with invalid date', () => {
      const invalidData = { ...validTransactionData, date: new Date('invalid') };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid date is required');
    });

    it('should reject transaction with description too long', () => {
      const longDescription = 'a'.repeat(256);
      const invalidData = { ...validTransactionData, description: longDescription };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be 255 characters or less');
    });

    it('should reject transaction with category too long', () => {
      const longCategory = 'a'.repeat(51);
      const invalidData = { ...validTransactionData, category: longCategory };
      const result = Transaction.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Category must be 50 characters or less');
    });
  });

  describe('Instance Methods', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = new Transaction(validTransactionData);
    });

    it('should validate instance correctly', () => {
      const result = transaction.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should update transaction with valid data', () => {
      const originalUpdatedAt = transaction.updatedAt;
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const result = transaction.update({
          description: 'Updated description',
          amount: 200,
        });

        expect(result.isValid).toBe(true);
        expect(transaction.description).toBe('Updated description');
        expect(transaction.amount).toBe(200);
        expect(transaction.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });

    it('should not update transaction with invalid data', () => {
      const originalDescription = transaction.description;
      const originalUpdatedAt = transaction.updatedAt;

      const result = transaction.update({
        description: '', // Invalid
      });

      expect(result.isValid).toBe(false);
      expect(transaction.description).toBe(originalDescription);
      expect(transaction.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should convert to JSON correctly', () => {
      const json = transaction.toJSON();

      expect(json).toEqual(validTransactionData);
    });

    it('should clone transaction correctly', () => {
      const cloned = transaction.clone();

      expect(cloned).not.toBe(transaction);
      expect(cloned.toJSON()).toEqual(transaction.toJSON());
    });
  });

  describe('Static Create Method', () => {
    it('should create transaction with generated metadata', () => {
      const transactionData = {
        date: new Date('2024-01-15'),
        amount: 100.50,
        description: 'Test transaction',
        category: 'Food',
        accountId: 'account-1',
        type: 'expense' as const,
        tags: ['restaurant'],
      };

      const transaction = Transaction.create(transactionData);

      expect(transaction.id).toBeDefined();
      expect(transaction.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
      expect(transaction.createdAt).toEqual(transaction.updatedAt);
      
      // Check that all other properties are set correctly
      expect(transaction.amount).toBe(100.50);
      expect(transaction.description).toBe('Test transaction');
      expect(transaction.category).toBe('Food');
      expect(transaction.accountId).toBe('account-1');
      expect(transaction.type).toBe('expense');
      expect(transaction.tags).toEqual(['restaurant']);
    });
  });
});