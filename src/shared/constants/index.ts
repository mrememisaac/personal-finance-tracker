// Application constants

// Default categories for transactions
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Home & Garden',
  'Insurance',
  'Taxes',
  'Other',
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental',
  'Gift',
  'Refund',
  'Other',
] as const;

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;

// Date format options
export const DATE_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
] as const;

// Budget periods
export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Account types
export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account', icon: 'CreditCard' },
  { value: 'savings', label: 'Savings Account', icon: 'PiggyBank' },
  { value: 'credit', label: 'Credit Card', icon: 'CreditCard' },
  { value: 'investment', label: 'Investment Account', icon: 'TrendingUp' },
] as const;

// Transaction types
export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income', color: 'text-green-600' },
  { value: 'expense', label: 'Expense', color: 'text-red-600' },
] as const;

// Date period options for filtering
export const DATE_PERIODS = [
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '90days', label: 'Last 90 days' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'All time' },
] as const;

// Chart colors for visualizations
export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
] as const;

// Budget status colors
export const BUDGET_STATUS_COLORS = {
  safe: 'text-green-600 bg-green-100',
  warning: 'text-yellow-600 bg-yellow-100',
  danger: 'text-red-600 bg-red-100',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  APP_DATA: 'personal-finance-tracker-data',
  USER_SETTINGS: 'personal-finance-tracker-settings',
  ENCRYPTION_KEY: 'personal-finance-tracker-key',
  BACKUP_DATA: 'personal-finance-tracker-backup',
} as const;

// Application limits
export const APP_LIMITS = {
  MAX_TRANSACTIONS: 10000,
  MAX_ACCOUNTS: 50,
  MAX_BUDGETS: 100,
  MAX_GOALS: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_CATEGORY_LENGTH: 50,
  MAX_ACCOUNT_NAME_LENGTH: 50,
  MAX_GOAL_NAME_LENGTH: 100,
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  CURRENCY_AMOUNT: /^\d+(\.\d{1,2})?$/,
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Default user settings
export const DEFAULT_SETTINGS = {
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  theme: 'light',
  notifications: true,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_AMOUNT: 'Please enter a valid amount',
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE_REQUIRED: 'Date must be in the future',
  POSITIVE_AMOUNT_REQUIRED: 'Amount must be greater than zero',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_ADDED: 'Transaction added successfully',
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  TRANSACTION_DELETED: 'Transaction deleted successfully',
  BUDGET_CREATED: 'Budget created successfully',
  BUDGET_UPDATED: 'Budget updated successfully',
  BUDGET_DELETED: 'Budget deleted successfully',
  GOAL_CREATED: 'Goal created successfully',
  GOAL_UPDATED: 'Goal updated successfully',
  GOAL_DELETED: 'Goal deleted successfully',
  ACCOUNT_CREATED: 'Account created successfully',
  ACCOUNT_UPDATED: 'Account updated successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
  DATA_EXPORTED: 'Data exported successfully',
  DATA_IMPORTED: 'Data imported successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;