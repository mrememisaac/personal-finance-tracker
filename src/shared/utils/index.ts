import type { DatePeriod, ValidationResult, Transaction, Budget, Goal, Account } from '../types';

// Currency formatting utility
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if locale/currency is not supported
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

// Date formatting utility
export function formatDate(date: Date, format: string = 'MM/dd/yyyy'): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

// Date filtering utilities for different time periods
export function getDateFilter(period: DatePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case '1year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(1900); // Very old date to include all records
      break;
    default:
      start.setDate(end.getDate() - 30); // Default to 30 days
  }

  // Set start to beginning of day and end to end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Get date range for current month
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Get date range for current week (Monday to Sunday)
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  
  // Calculate days to subtract to get to Monday (1)
  // If today is Sunday (0), we need to go back 6 days to get to Monday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(now.getDate() - daysToMonday);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Validation helper functions for form inputs
export function validateTransaction(transaction: Partial<Transaction>): ValidationResult {
  const errors: string[] = [];

  if (!transaction.amount || transaction.amount === 0) {
    errors.push('Amount is required and must be non-zero');
  }

  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!transaction.category || transaction.category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (!transaction.accountId || transaction.accountId.trim().length === 0) {
    errors.push('Account is required');
  }

  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    errors.push('Transaction type must be either income or expense');
  }

  if (!transaction.date || isNaN(transaction.date.getTime())) {
    errors.push('Valid date is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateBudget(budget: Partial<Budget>): ValidationResult {
  const errors: string[] = [];

  if (!budget.category || budget.category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (!budget.limit || budget.limit <= 0) {
    errors.push('Budget limit must be greater than zero');
  }

  if (!budget.period || !['weekly', 'monthly'].includes(budget.period)) {
    errors.push('Budget period must be either weekly or monthly');
  }

  if (!budget.startDate || isNaN(budget.startDate.getTime())) {
    errors.push('Valid start date is required');
  }

  if (!budget.endDate || isNaN(budget.endDate.getTime())) {
    errors.push('Valid end date is required');
  }

  if (budget.startDate && budget.endDate && budget.startDate >= budget.endDate) {
    errors.push('End date must be after start date');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateGoal(goal: Partial<Goal>): ValidationResult {
  const errors: string[] = [];

  if (!goal.name || goal.name.trim().length === 0) {
    errors.push('Goal name is required');
  }

  if (!goal.targetAmount || goal.targetAmount <= 0) {
    errors.push('Target amount must be greater than zero');
  }

  if (goal.currentAmount !== undefined && goal.currentAmount < 0) {
    errors.push('Current amount cannot be negative');
  }

  if (!goal.targetDate || isNaN(goal.targetDate.getTime())) {
    errors.push('Valid target date is required');
  }

  if (goal.targetDate && goal.targetDate <= new Date()) {
    errors.push('Target date must be in the future');
  }

  if (!goal.accountId || goal.accountId.trim().length === 0) {
    errors.push('Account is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAccount(account: Partial<Account>): ValidationResult {
  const errors: string[] = [];

  if (!account.name || account.name.trim().length === 0) {
    errors.push('Account name is required');
  }

  if (!account.type || !['checking', 'savings', 'credit', 'investment'].includes(account.type)) {
    errors.push('Account type must be checking, savings, credit, or investment');
  }

  if (account.balance === undefined || account.balance === null) {
    errors.push('Initial balance is required');
  }

  if (!account.currency || account.currency.trim().length === 0) {
    errors.push('Currency is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation utility
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation utility
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Number formatting utilities
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

// Generate unique ID utility
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Deep clone utility for objects
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

// Check if date is within range
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

// Sort array of objects by a property
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Group array of objects by a property
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Calculate sum of a numeric property in an array
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => {
    const value = item[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

// Get unique values from an array
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// Truncate text to specified length
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

// Capitalize first letter of each word
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

// Format file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if value is empty (null, undefined, empty string, empty array, empty object)
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Clamp number between min and max values
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Generate random number between min and max (inclusive)
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Convert string to slug format
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}