import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    formatCurrency,
    formatDate,
    getDateFilter,
    getCurrentMonthRange,
    getCurrentWeekRange,
    validateTransaction,
    validateBudget,
    validateGoal,
    validateAccount,
    validateEmail,
    validatePassword,
    formatNumber,
    formatPercentage,
    generateId,
    deepClone,
    debounce,
    daysBetween,
    isDateInRange,
    sortBy,
    groupBy,
    sumBy,
    unique,
    truncateText,
    capitalizeWords,
    formatFileSize,
    isEmpty,
    clamp,
    randomBetween,
    slugify,
} from './index';
import type { Transaction, Budget, Goal, Account } from '../types';

describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format USD currency correctly', () => {
            expect(formatCurrency(1234.56)).toBe('$1,234.56');
            expect(formatCurrency(0)).toBe('$0.00');
            expect(formatCurrency(-100.5)).toBe('-$100.50');
        });

        it('should format EUR currency correctly', () => {
            expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
        });

        it('should handle different locales', () => {
            const result = formatCurrency(1234.56, 'USD', 'en-US');
            expect(result).toContain('1,234.56');
        });

        it('should fallback gracefully for unsupported currencies', () => {
            const result = formatCurrency(100, 'INVALID');
            expect(result).toContain('100.00');
        });
    });

    describe('formatDate', () => {
        const testDate = new Date('2024-03-15');

        it('should format date in MM/dd/yyyy format by default', () => {
            expect(formatDate(testDate)).toBe('03/15/2024');
        });

        it('should format date in dd/MM/yyyy format', () => {
            expect(formatDate(testDate, 'dd/MM/yyyy')).toBe('15/03/2024');
        });

        it('should format date in yyyy-MM-dd format', () => {
            expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2024-03-15');
        });

        it('should use default format for unknown format', () => {
            expect(formatDate(testDate, 'unknown')).toBe('03/15/2024');
        });
    });

    describe('getDateFilter', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return 7 days range', () => {
            const { start, end } = getDateFilter('7days');
            expect(daysBetween(start, end)).toBe(8); // Inclusive range
        });

        it('should return 30 days range', () => {
            const { start, end } = getDateFilter('30days');
            expect(daysBetween(start, end)).toBe(31); // Inclusive range
        });

        it('should return 90 days range', () => {
            const { start, end } = getDateFilter('90days');
            expect(daysBetween(start, end)).toBe(91); // Inclusive range
        });

        it('should return 1 year range', () => {
            const { start, end } = getDateFilter('1year');
            expect(end.getFullYear() - start.getFullYear()).toBe(1);
        });

        it('should return all time range', () => {
            const { start, end } = getDateFilter('all');
            expect(start.getFullYear()).toBe(1900);
        });

        it('should default to 30 days for unknown period', () => {
            const { start, end } = getDateFilter('unknown' as any);
            expect(daysBetween(start, end)).toBe(31); // Inclusive range
        });
    });

    describe('getCurrentMonthRange', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return current month range', () => {
            const { start, end } = getCurrentMonthRange();

            expect(start.getDate()).toBe(1);
            expect(start.getMonth()).toBe(2); // March (0-indexed)
            expect(end.getMonth()).toBe(2);
            expect(end.getDate()).toBe(31); // Last day of March
        });
    });

    describe('getCurrentWeekRange', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            // Set to a Monday (2024-03-18)
            vi.setSystemTime(new Date('2024-03-18T12:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return current week range', () => {
            const { start, end } = getCurrentWeekRange();

            expect(daysBetween(start, end)).toBe(7); // Full week inclusive
            expect(start.getDay()).toBe(1); // Monday
            expect(end.getDay()).toBe(0); // Sunday
        });
    });

    describe('validateTransaction', () => {
        const validTransaction: Partial<Transaction> = {
            amount: 100,
            description: 'Test transaction',
            category: 'Food',
            accountId: 'account-1',
            type: 'expense',
            date: new Date(),
        };

        it('should validate correct transaction', () => {
            const result = validateTransaction(validTransaction);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject transaction without amount', () => {
            const result = validateTransaction({ ...validTransaction, amount: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Amount is required and must be non-zero');
        });

        it('should reject transaction without description', () => {
            const result = validateTransaction({ ...validTransaction, description: '' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Description is required');
        });

        it('should reject transaction with invalid type', () => {
            const result = validateTransaction({ ...validTransaction, type: 'invalid' as any });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Transaction type must be either income or expense');
        });
    });

    describe('validateBudget', () => {
        const validBudget: Partial<Budget> = {
            category: 'Food',
            limit: 500,
            period: 'monthly',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
        };

        it('should validate correct budget', () => {
            const result = validateBudget(validBudget);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject budget without category', () => {
            const result = validateBudget({ ...validBudget, category: '' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Category is required');
        });

        it('should reject budget with zero limit', () => {
            const result = validateBudget({ ...validBudget, limit: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget limit must be greater than zero');
        });

        it('should reject budget with end date before start date', () => {
            const result = validateBudget({
                ...validBudget,
                startDate: new Date('2024-01-31'),
                endDate: new Date('2024-01-01'),
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('End date must be after start date');
        });
    });

    describe('validateGoal', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const validGoal: Partial<Goal> = {
            name: 'Emergency Fund',
            targetAmount: 10000,
            currentAmount: 2500,
            targetDate: futureDate,
            accountId: 'account-1',
        };

        it('should validate correct goal', () => {
            const result = validateGoal(validGoal);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject goal without name', () => {
            const result = validateGoal({ ...validGoal, name: '' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Goal name is required');
        });

        it('should reject goal with zero target amount', () => {
            const result = validateGoal({ ...validGoal, targetAmount: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target amount must be greater than zero');
        });

        it('should reject goal with negative current amount', () => {
            const result = validateGoal({ ...validGoal, currentAmount: -100 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Current amount cannot be negative');
        });

        it('should reject goal with past target date', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const result = validateGoal({ ...validGoal, targetDate: pastDate });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target date must be in the future');
        });
    });

    describe('validateAccount', () => {
        const validAccount: Partial<Account> = {
            name: 'Checking Account',
            type: 'checking',
            balance: 1000,
            currency: 'USD',
        };

        it('should validate correct account', () => {
            const result = validateAccount(validAccount);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject account without name', () => {
            const result = validateAccount({ ...validAccount, name: '' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Account name is required');
        });

        it('should reject account with invalid type', () => {
            const result = validateAccount({ ...validAccount, type: 'invalid' as any });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Account type must be checking, savings, credit, or investment');
        });

        it('should reject account without balance', () => {
            const result = validateAccount({ ...validAccount, balance: undefined });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Initial balance is required');
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email addresses', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
            expect(validateEmail('user+tag@example.org')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('test.example.com')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should validate strong password', () => {
            const result = validatePassword('StrongPass123!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject short password', () => {
            const result = validatePassword('Short1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should reject password without uppercase', () => {
            const result = validatePassword('lowercase123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without lowercase', () => {
            const result = validatePassword('UPPERCASE123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without number', () => {
            const result = validatePassword('NoNumbers!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject password without special character', () => {
            const result = validatePassword('NoSpecial123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with default decimals', () => {
            expect(formatNumber(1234.567)).toBe('1,234.57');
            expect(formatNumber(0)).toBe('0.00');
        });

        it('should format numbers with custom decimals', () => {
            expect(formatNumber(1234.567, 1)).toBe('1,234.6');
            expect(formatNumber(1234.567, 0)).toBe('1,235');
        });
    });

    describe('formatPercentage', () => {
        it('should calculate and format percentage', () => {
            expect(formatPercentage(25, 100)).toBe('25.0%');
            expect(formatPercentage(33, 100)).toBe('33.0%');
            expect(formatPercentage(1, 3)).toBe('33.3%');
        });

        it('should handle zero total', () => {
            expect(formatPercentage(10, 0)).toBe('0%');
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
            expect(id1.length).toBeGreaterThan(0);
        });
    });

    describe('deepClone', () => {
        it('should clone primitive values', () => {
            expect(deepClone(42)).toBe(42);
            expect(deepClone('hello')).toBe('hello');
            expect(deepClone(true)).toBe(true);
            expect(deepClone(null)).toBe(null);
        });

        it('should clone dates', () => {
            const date = new Date('2024-01-01');
            const cloned = deepClone(date);

            expect(cloned).toEqual(date);
            expect(cloned).not.toBe(date);
        });

        it('should clone arrays', () => {
            const arr = [1, 2, { a: 3 }];
            const cloned = deepClone(arr);

            expect(cloned).toEqual(arr);
            expect(cloned).not.toBe(arr);
            expect(cloned[2]).not.toBe(arr[2]);
        });

        it('should clone objects', () => {
            const obj = { a: 1, b: { c: 2 } };
            const cloned = deepClone(obj);

            expect(cloned).toEqual(obj);
            expect(cloned).not.toBe(obj);
            expect(cloned.b).not.toBe(obj.b);
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should debounce function calls', () => {
            const mockFn = vi.fn();
            const debouncedFn = debounce(mockFn, 100);

            debouncedFn('arg1');
            debouncedFn('arg2');
            debouncedFn('arg3');

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('arg3');
        });
    });

    describe('daysBetween', () => {
        it('should calculate days between dates', () => {
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-11');

            expect(daysBetween(date1, date2)).toBe(10);
            expect(daysBetween(date2, date1)).toBe(10);
        });
    });

    describe('isDateInRange', () => {
        it('should check if date is in range', () => {
            const date = new Date('2024-01-15');
            const start = new Date('2024-01-01');
            const end = new Date('2024-01-31');

            expect(isDateInRange(date, start, end)).toBe(true);
            expect(isDateInRange(new Date('2023-12-31'), start, end)).toBe(false);
            expect(isDateInRange(new Date('2024-02-01'), start, end)).toBe(false);
        });
    });

    describe('sortBy', () => {
        const data = [
            { name: 'Charlie', age: 30 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 35 },
        ];

        it('should sort by property ascending', () => {
            const sorted = sortBy(data, 'name');
            expect(sorted[0].name).toBe('Alice');
            expect(sorted[1].name).toBe('Bob');
            expect(sorted[2].name).toBe('Charlie');
        });

        it('should sort by property descending', () => {
            const sorted = sortBy(data, 'age', 'desc');
            expect(sorted[0].age).toBe(35);
            expect(sorted[1].age).toBe(30);
            expect(sorted[2].age).toBe(25);
        });
    });

    describe('groupBy', () => {
        it('should group array by property', () => {
            const data = [
                { category: 'Food', amount: 100 },
                { category: 'Food', amount: 50 },
                { category: 'Transport', amount: 75 },
            ];

            const grouped = groupBy(data, 'category');

            expect(grouped.Food).toHaveLength(2);
            expect(grouped.Transport).toHaveLength(1);
        });
    });

    describe('sumBy', () => {
        it('should sum numeric property', () => {
            const data = [
                { amount: 100 },
                { amount: 50 },
                { amount: 25 },
            ];

            expect(sumBy(data, 'amount')).toBe(175);
        });

        it('should handle non-numeric values', () => {
            const data = [
                { amount: 100 },
                { amount: 'invalid' },
                { amount: 50 },
            ];

            expect(sumBy(data, 'amount')).toBe(150);
        });
    });

    describe('unique', () => {
        it('should return unique values', () => {
            expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
            expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
        });
    });

    describe('truncateText', () => {
        it('should truncate long text', () => {
            expect(truncateText('This is a long text', 10)).toBe('This is...');
            expect(truncateText('Short', 10)).toBe('Short');
        });

        it('should use custom suffix', () => {
            expect(truncateText('This is a long text', 10, '---')).toBe('This is---');
        });
    });

    describe('capitalizeWords', () => {
        it('should capitalize first letter of each word', () => {
            expect(capitalizeWords('hello world')).toBe('Hello World');
            expect(capitalizeWords('the quick brown fox')).toBe('The Quick Brown Fox');
        });
    });

    describe('formatFileSize', () => {
        it('should format file sizes', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
        });
    });

    describe('isEmpty', () => {
        it('should check if values are empty', () => {
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('   ')).toBe(true);
            expect(isEmpty([])).toBe(true);
            expect(isEmpty({})).toBe(true);

            expect(isEmpty('hello')).toBe(false);
            expect(isEmpty([1, 2, 3])).toBe(false);
            expect(isEmpty({ a: 1 })).toBe(false);
            expect(isEmpty(0)).toBe(false);
        });
    });

    describe('clamp', () => {
        it('should clamp values between min and max', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
        });
    });

    describe('randomBetween', () => {
        it('should generate random number in range', () => {
            const result = randomBetween(1, 10);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
            expect(Number.isInteger(result)).toBe(true);
        });
    });

    describe('slugify', () => {
        it('should convert text to slug format', () => {
            expect(slugify('Hello World!')).toBe('hello-world');
            expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
            expect(slugify('Special@#$Characters')).toBe('specialcharacters');
            expect(slugify('Under_scores and-dashes')).toBe('under-scores-and-dashes');
        });
    });
});