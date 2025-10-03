# Personal Finance Tracker - Design Document

## Overview

The Personal Finance Tracker is a modern web application built using React with TypeScript, implementing Vertical Slice Architecture (VSA) for optimal maintainability and scalability. The application provides comprehensive financial management capabilities including transaction tracking, budget management, goal setting, and advanced analytics with interactive visualizations.

The design emphasizes user experience with a clean, responsive interface using Tailwind CSS for styling and Lucide React for consistent iconography. The application features real-time calculations, automated testing, and robust data export capabilities.

## Architecture

### Vertical Slice Architecture (VSA)

The application is organized into vertical slices, where each feature contains all the layers it needs (models, services, components) rather than organizing by technical layers. This approach provides:

- **Feature Isolation**: Each slice is self-contained
- **Clear Boundaries**: Minimal cross-slice dependencies
- **Maintainability**: Easy to modify individual features
- **Testability**: Independent testing of features
- **Scalability**: Simple addition of new features

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Package Manager**: pnpm for fast, efficient dependency management
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Charts**: Chart.js or Recharts for data visualization
- **State Management**: React Context API with useReducer
- **Build Tool**: Vite for fast development and building
- **Testing**: Jest with React Testing Library
- **Data Storage**: LocalStorage with encryption for sensitive data

### Slice Organization

```
src/
├── shared/                    # Shared infrastructure
│   ├── context/              # Global state management
│   ├── utils/                # Common utilities
│   ├── constants/            # Shared constants
│   └── types/                # Global TypeScript types
├── slices/
│   ├── transaction/          # Transaction management slice
│   ├── budget/               # Budget tracking slice
│   ├── dashboard/            # Dashboard overview slice
│   ├── reports/              # Analytics and reports slice
│   ├── goals/                # Financial goals slice
│   ├── accounts/             # Account management slice
│   └── testing/              # Test suite slice
└── app/                      # Main application orchestration
```

## Components and Interfaces

### Shared Infrastructure Layer

#### Global Context
```typescript
interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: UserSettings;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  services: {
    transaction: TransactionService;
    budget: BudgetService;
    account: AccountService;
    goal: GoalService;
    report: ReportService;
    test: TestService;
  };
}
```

#### Utility Functions
```typescript
// Currency formatting
formatCurrency(amount: number, currency?: string): string

// Date filtering
getDateFilter(period: DatePeriod): { start: Date; end: Date }

// Data validation
validateTransaction(transaction: Partial<Transaction>): ValidationResult
validateBudget(budget: Partial<Budget>): ValidationResult
```

### Transaction Slice

#### Models
```typescript
class Transaction {
  constructor(
    public id: string,
    public date: Date,
    public amount: number,
    public description: string,
    public category: string,
    public accountId: string,
    public type: 'income' | 'expense'
  ) {}

  get isIncome(): boolean
  get isExpense(): boolean
  get formattedAmount(): string
  get formattedDate(): string
}
```

#### Services
```typescript
class TransactionService {
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction
  updateTransaction(id: string, updates: Partial<Transaction>): Transaction
  deleteTransaction(id: string): void
  getTransactions(filters?: TransactionFilters): Transaction[]
  getTransactionsByCategory(): Map<string, Transaction[]>
  getTransactionsByDateRange(start: Date, end: Date): Transaction[]
  exportTransactions(format: 'csv' | 'json'): string
  calculateTotalIncome(transactions?: Transaction[]): number
  calculateTotalExpenses(transactions?: Transaction[]): number
  calculateNetBalance(transactions?: Transaction[]): number
}
```

#### Components
- **TransactionForm**: Modal form for adding/editing transactions
- **TransactionList**: Paginated list with filtering and sorting
- **TransactionFilters**: Filter controls for type, category, date range
- **TransactionSummary**: Quick stats display

### Budget Slice

#### Models
```typescript
class Budget {
  constructor(
    public id: string,
    public category: string,
    public limit: number,
    public period: 'weekly' | 'monthly',
    public startDate: Date
  ) {}

  get spent(): number
  get remaining(): number
  get percentage(): number
  get isOverBudget(): boolean
  get status(): 'safe' | 'warning' | 'danger'
}
```

#### Services
```typescript
class BudgetService {
  createBudget(budget: Omit<Budget, 'id'>): Budget
  updateBudget(id: string, updates: Partial<Budget>): Budget
  deleteBudget(id: string): void
  getBudgets(): Budget[]
  getBudgetByCategory(category: string): Budget | undefined
  calculateBudgetProgress(budgetId: string): BudgetProgress
  checkBudgetAlerts(): BudgetAlert[]
  resetBudgetsForNewPeriod(): void
}
```

#### Components
- **BudgetOverview**: Visual progress bars and status indicators
- **BudgetForm**: Create/edit budget modal
- **BudgetAlerts**: Warning notifications for budget limits
- **BudgetProgress**: Individual budget progress display

### Dashboard Slice

#### Components
- **SummaryCards**: Overview cards showing totals and net balance
- **RecentTransactions**: Latest transaction summary
- **ExpenseBreakdown**: Category-based spending visualization
- **QuickActions**: Fast access to common operations
- **FinancialHealth**: Overall financial status indicators

### Reports Slice

#### Services
```typescript
class ReportService {
  generateSpendingReport(dateRange: DateRange): SpendingReport
  generateIncomeVsExpenseReport(dateRange: DateRange): ComparisonReport
  generateCategoryReport(dateRange: DateRange): CategoryReport
  generateAccountBalanceHistory(accountId: string): BalanceHistory[]
  exportReport(report: Report, format: 'pdf' | 'csv' | 'json'): string
  getChartData(type: ChartType, dateRange: DateRange): ChartData
}
```

#### Components
- **ChartsSection**: Interactive charts (line, pie, bar)
- **ReportsDashboard**: Main reports interface
- **ExportControls**: Data export functionality
- **FilterControls**: Date range and category filters
- **StatisticsPanel**: Detailed financial statistics

### Goals Slice

#### Models
```typescript
class Goal {
  constructor(
    public id: string,
    public name: string,
    public targetAmount: number,
    public currentAmount: number,
    public targetDate: Date,
    public accountId: string
  ) {}

  get progress(): number
  get remainingAmount(): number
  get projectedCompletionDate(): Date
  get isCompleted(): boolean
  get daysRemaining(): number
}
```

### Testing Slice

#### Services
```typescript
class TestService {
  runAllTests(): TestResults
  runCalculationTests(): TestResults
  runUITests(): TestResults
  runDataIntegrityTests(): TestResults
  generateTestReport(): TestReport
}
```

#### Components
- **TestDashboard**: Visual test results interface
- **TestRunner**: Execute test suites
- **TestResults**: Detailed test outcome display

## Data Models

### Core Entities

```typescript
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
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

interface Budget {
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

interface Goal {
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
```

### Supporting Types

```typescript
interface TransactionFilters {
  dateRange?: { start: Date; end: Date };
  categories?: string[];
  types?: ('income' | 'expense')[];
  accounts?: string[];
  amountRange?: { min: number; max: number };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}
```

## Error Handling

### Error Types
```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### Error Handling Strategy
- **Global Error Boundary**: Catch and display React component errors
- **Service Layer Errors**: Validate inputs and handle business logic errors
- **Storage Errors**: Handle localStorage quota and access issues
- **User Feedback**: Toast notifications for errors and success messages
- **Error Logging**: Console logging for development, structured logging for production

### Validation
- **Input Validation**: Real-time form validation with error messages
- **Data Integrity**: Ensure transaction amounts and dates are valid
- **Business Rules**: Enforce budget limits and goal constraints
- **Type Safety**: Leverage TypeScript for compile-time error prevention

## Testing Strategy

### Test Categories

#### Unit Tests
- **Model Tests**: Validate business logic in Transaction, Budget, Goal classes
- **Service Tests**: Test calculation methods and data manipulation
- **Utility Tests**: Verify formatting, validation, and helper functions
- **Component Tests**: Test individual React components in isolation

#### Integration Tests
- **Slice Integration**: Test interaction between models, services, and components
- **Context Integration**: Verify global state management works correctly
- **Data Flow**: Test complete user workflows from UI to data persistence

#### End-to-End Tests
- **User Workflows**: Complete transaction creation, budget setup, goal tracking
- **Cross-Slice Operations**: Dashboard displaying data from multiple slices
- **Data Export**: Verify export functionality produces correct output

#### Visual Testing
- **Component Rendering**: Ensure components render correctly with various data states
- **Responsive Design**: Test layout on different screen sizes
- **Interactive Elements**: Verify hover states, animations, and transitions

### Test Implementation

#### Built-in Test Suite
The application includes a comprehensive test suite accessible through the Testing slice:

```typescript
// Core calculation tests
testIncomeCalculation()
testExpenseCalculation()
testBalanceCalculation()
testBudgetProgress()

// Data integrity tests
testCategoryGrouping()
testDateFiltering()
testDataValidation()

// UI functionality tests
testCurrencyFormatting()
testDateFormatting()
testChartDataGeneration()
```

#### Test Dashboard Features
- **Visual Test Results**: Pass/fail indicators with color coding
- **Detailed Test Reports**: Expected vs actual results comparison
- **Real-time Testing**: Run tests on-demand to verify functionality
- **Test Coverage**: Clear documentation of what functionality is tested

### Performance Considerations

#### Optimization Strategies
- **Memoization**: Use React.memo and useMemo for expensive calculations
- **Virtual Scrolling**: Handle large transaction lists efficiently
- **Lazy Loading**: Load chart libraries and heavy components on demand
- **Data Caching**: Cache calculated values to avoid repeated computations

#### Storage Optimization
- **Data Compression**: Compress stored data to maximize localStorage usage
- **Incremental Updates**: Only update changed data rather than full rewrites
- **Cleanup Routines**: Remove old data and maintain storage efficiency

This design provides a robust foundation for a professional-grade personal finance application with enterprise-level features, comprehensive testing, and excellent user experience.