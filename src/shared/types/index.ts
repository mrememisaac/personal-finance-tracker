// Core entity interfaces
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  accountId: string;
  type: 'income' | 'expense';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  accountId: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Supporting types
export interface TransactionFilters {
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  types?: ('income' | 'expense')[];
  accounts?: string[];
  amountRange?: { min: number; max: number };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

export interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export interface UserSettings {
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

// Application state interface
export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: UserSettings;
}

// Action types for state management
export type AppAction = 
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: { id: string; updates: Partial<Account> } }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: { id: string; updates: Partial<Budget> } }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> };

// Error handling types
export const ErrorType = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR'
}as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
} 

// Date period type for filtering
export type DatePeriod = '7days' | '30days' | '90days' | '1year' | 'all';

// Chart types
export type ChartType = 'line' | 'pie' | 'bar';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Budget progress interface
export interface BudgetProgress {
  budgetId: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
}

// Budget alert interface
export interface BudgetAlert {
  budgetId: string;
  category: string;
  message: string;
  severity: 'warning' | 'danger';
}

// Report interfaces
export interface SpendingReport {
  totalSpent: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  period: { start: Date; end: Date };
}

export interface ComparisonReport {
  income: number;
  expenses: number;
  netBalance: number;
  period: { start: Date; end: Date };
}

export interface CategoryReport {
  categories: { name: string; spent: number; budgeted: number }[];
  period: { start: Date; end: Date };
}

export interface BalanceHistory {
  date: Date;
  balance: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'spending' | 'comparison' | 'category';
  data: SpendingReport | ComparisonReport | CategoryReport;
  generatedAt: Date;
}

export interface TestResults {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export interface TestReport {
  summary: TestResults;
  details: TestResult[];
  generatedAt: Date;
}