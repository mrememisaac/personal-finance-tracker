import { describe, it, expect, beforeEach } from 'vitest';
import { Account } from './Account';
import { Account as IAccount } from '../../shared/types';

describe('Account Model', () => {
  let validAccountData: IAccount;

  beforeEach(() => {
    validAccountData = {
      id: 'test-account-id',
      name: 'Test Checking Account',
      type: 'checking',
      balance: 1500.75,
      currency: 'USD',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };
  });

  describe('Constructor and Basic Properties', () => {
    it('should create an account with all properties', () => {
      const account = new Account(validAccountData);

      expect(account.id).toBe('test-account-id');
      expect(account.name).toBe('Test Checking Account');
      expect(account.type).toBe('checking');
      expect(account.balance).toBe(1500.75);
      expect(account.currency).toBe('USD');
    });
  });

  describe('Computed Properties', () => {
    it('should format balance correctly', () => {
      const account = new Account({
        ...validAccountData,
        balance: 1234.56,
        currency: 'USD',
      });

      expect(account.formattedBalance).toBe('$1,234.56');
    });

    it('should format balance with different currency', () => {
      const account = new Account({
        ...validAccountData,
        balance: 1000,
        currency: 'EUR',
      });

      expect(account.formattedBalance).toBe('€1,000.00');
    });

    it('should correctly identify positive balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: 100,
      });

      expect(account.isPositiveBalance).toBe(true);
      expect(account.isNegativeBalance).toBe(false);
      expect(account.isZeroBalance).toBe(false);
    });

    it('should correctly identify negative balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: -50,
      });

      expect(account.isPositiveBalance).toBe(false);
      expect(account.isNegativeBalance).toBe(true);
      expect(account.isZeroBalance).toBe(false);
    });

    it('should correctly identify zero balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: 0,
      });

      expect(account.isPositiveBalance).toBe(false);
      expect(account.isNegativeBalance).toBe(false);
      expect(account.isZeroBalance).toBe(true);
    });

    it('should return correct account type display names', () => {
      const checkingAccount = new Account({ ...validAccountData, type: 'checking' });
      const savingsAccount = new Account({ ...validAccountData, type: 'savings' });
      const creditAccount = new Account({ ...validAccountData, type: 'credit' });
      const investmentAccount = new Account({ ...validAccountData, type: 'investment' });

      expect(checkingAccount.accountTypeDisplayName).toBe('Checking Account');
      expect(savingsAccount.accountTypeDisplayName).toBe('Savings Account');
      expect(creditAccount.accountTypeDisplayName).toBe('Credit Card');
      expect(investmentAccount.accountTypeDisplayName).toBe('Investment Account');
    });
  });

  describe('Balance Calculation Methods', () => {
    let account: Account;

    beforeEach(() => {
      account = new Account(validAccountData);
    });

    it('should update balance correctly', () => {
      const originalBalance = account.balance;
      const originalUpdatedAt = account.updatedAt;

      account.updateBalance(250.25);

      expect(account.balance).toBe(originalBalance + 250.25);
      expect(account.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should set balance correctly', () => {
      const originalUpdatedAt = account.updatedAt;

      account.setBalance(2000);

      expect(account.balance).toBe(2000);
      expect(account.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should handle negative balance updates', () => {
      account.updateBalance(-200);

      expect(account.balance).toBe(1300.75);
    });
  });

  describe('Credit Card Specific Methods', () => {
    it('should calculate available credit for credit cards', () => {
      const creditAccount = new Account({
        ...validAccountData,
        type: 'credit',
        balance: -500, // Negative balance means money owed
      });

      expect(creditAccount.availableCredit).toBe(500);
    });

    it('should return zero available credit for non-credit accounts', () => {
      const checkingAccount = new Account({
        ...validAccountData,
        type: 'checking',
        balance: 1000,
      });

      expect(checkingAccount.availableCredit).toBe(0);
    });
  });

  describe('Static Validation', () => {
    it('should validate a correct account', () => {
      const result = Account.validate(validAccountData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject account without name', () => {
      const invalidData = { ...validAccountData, name: '' };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account name is required');
    });

    it('should reject account with invalid type', () => {
      const invalidData = { ...validAccountData, type: 'invalid' as any };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account type must be one of: checking, savings, credit, investment');
    });

    it('should reject account without balance', () => {
      const invalidData = { ...validAccountData };
      delete (invalidData as any).balance;
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial balance is required');
    });

    it('should reject account without currency', () => {
      const invalidData = { ...validAccountData, currency: '' };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Currency is required');
    });

    it('should reject account with name too long', () => {
      const longName = 'a'.repeat(101);
      const invalidData = { ...validAccountData, name: longName };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account name must be 100 characters or less');
    });

    it('should reject account with invalid currency code', () => {
      const invalidData = { ...validAccountData, currency: 'INVALID' };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Currency must be a 3-letter ISO code (e.g., USD, EUR)');
    });

    it('should reject credit card with positive balance', () => {
      const invalidData = {
        ...validAccountData,
        type: 'credit' as const,
        balance: 1000,
      };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Credit card accounts should typically start with zero or negative balance');
    });

    it('should reject savings account with negative balance', () => {
      const invalidData = {
        ...validAccountData,
        type: 'savings' as const,
        balance: -100,
      };
      const result = Account.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Savings accounts cannot have negative balance');
    });
  });

  describe('Instance Methods', () => {
    let account: Account;

    beforeEach(() => {
      account = new Account(validAccountData);
    });

    it('should validate instance correctly', () => {
      const result = account.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should update account with valid data', () => {
      const originalUpdatedAt = account.updatedAt;
      
      setTimeout(() => {
        const result = account.update({
          name: 'Updated Account Name',
          balance: 2000,
        });

        expect(result.isValid).toBe(true);
        expect(account.name).toBe('Updated Account Name');
        expect(account.balance).toBe(2000);
        expect(account.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });

    it('should not update account with invalid data', () => {
      const originalName = account.name;
      const originalUpdatedAt = account.updatedAt;

      const result = account.update({
        name: '', // Invalid
      });

      expect(result.isValid).toBe(false);
      expect(account.name).toBe(originalName);
      expect(account.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should convert to JSON correctly', () => {
      const json = account.toJSON();

      expect(json).toEqual(validAccountData);
    });

    it('should clone account correctly', () => {
      const cloned = account.clone();

      expect(cloned).not.toBe(account);
      expect(cloned.toJSON()).toEqual(account.toJSON());
    });
  });

  describe('Transaction Accommodation', () => {
    it('should allow positive transactions for all account types', () => {
      const accounts = [
        new Account({ ...validAccountData, type: 'checking', balance: 100 }),
        new Account({ ...validAccountData, type: 'savings', balance: 100 }),
        new Account({ ...validAccountData, type: 'credit', balance: -100 }),
        new Account({ ...validAccountData, type: 'investment', balance: 100 }),
      ];

      accounts.forEach(account => {
        expect(account.canAccommodateTransaction(50)).toBe(true);
      });
    });

    it('should not allow savings account to go negative', () => {
      const savingsAccount = new Account({
        ...validAccountData,
        type: 'savings',
        balance: 100,
      });

      expect(savingsAccount.canAccommodateTransaction(-150)).toBe(false);
      expect(savingsAccount.canAccommodateTransaction(-50)).toBe(true);
    });

    it('should allow checking account small overdraft', () => {
      const checkingAccount = new Account({
        ...validAccountData,
        type: 'checking',
        balance: 100,
      });

      expect(checkingAccount.canAccommodateTransaction(-500)).toBe(true);
      expect(checkingAccount.canAccommodateTransaction(-1500)).toBe(false);
    });

    it('should not allow investment account to go negative', () => {
      const investmentAccount = new Account({
        ...validAccountData,
        type: 'investment',
        balance: 100,
      });

      expect(investmentAccount.canAccommodateTransaction(-150)).toBe(false);
      expect(investmentAccount.canAccommodateTransaction(-50)).toBe(true);
    });

    it('should allow credit card transactions', () => {
      const creditAccount = new Account({
        ...validAccountData,
        type: 'credit',
        balance: -100,
      });

      expect(creditAccount.canAccommodateTransaction(-500)).toBe(true);
      expect(creditAccount.canAccommodateTransaction(50)).toBe(true);
    });
  });

  describe('Static Create Method', () => {
    it('should create account with generated metadata', () => {
      const accountData = {
        name: 'New Account',
        type: 'checking' as const,
        balance: 500,
        currency: 'USD',
      };

      const account = Account.create(accountData);

      expect(account.id).toBeDefined();
      expect(account.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(account.createdAt).toBeInstanceOf(Date);
      expect(account.updatedAt).toBeInstanceOf(Date);
      expect(account.createdAt).toEqual(account.updatedAt);
      
      // Check that all other properties are set correctly
      expect(account.name).toBe('New Account');
      expect(account.type).toBe('checking');
      expect(account.balance).toBe(500);
      expect(account.currency).toBe('USD');
    });
  });

  describe('Account Summary', () => {
    it('should return correct summary for positive balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: 1000,
      });

      const summary = account.getSummary();

      expect(summary).toEqual({
        name: 'Test Checking Account',
        type: 'Checking Account',
        balance: '$1,000.00',
        status: 'positive',
      });
    });

    it('should return correct summary for negative balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: -100,
      });

      const summary = account.getSummary();

      expect(summary.status).toBe('negative');
      expect(summary.balance).toBe('-$100.00');
    });

    it('should return correct summary for zero balance', () => {
      const account = new Account({
        ...validAccountData,
        balance: 0,
      });

      const summary = account.getSummary();

      expect(summary.status).toBe('zero');
      expect(summary.balance).toBe('$0.00');
    });
  });
});