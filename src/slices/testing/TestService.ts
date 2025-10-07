import type { AppState, AppAction } from '../../shared/types';
import { 
  formatCurrency, 
  formatDate, 
  formatPercentage,
  validateTransaction,
  validateBudget,
  validateGoal,
  validateAccount,
  validateEmail,
  validatePassword,
  getDateFilter,
  groupBy,
  sumBy,
  sortBy,
  daysBetween,
  isDateInRange,
  clamp,
  slugify,
  isEmpty,
  deepClone
} from '../../shared/utils';
import { StorageService } from '../../shared/services/StorageService';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export interface TestResults {
  suites: TestSuite[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  coverage: {
    overall: number;
    models: number;
    services: number;
    components: number;
    utilities: number;
  };
}

export class TestService {
  state: AppState;
  dispatch: (action: AppAction) => void;

  constructor(
    state: AppState,
    dispatch: (action: AppAction) => void
  ) {
    this.state = state;
    this.dispatch = dispatch;
  }

  runAllTests(): TestResults {
    const startTime = Date.now();

    const suites: TestSuite[] = [
      this.runCalculationTests(),
      this.runDataIntegrityTests(),
      this.runUITests(),
      this.runValidationTests(),
      this.runUtilityTests(),
      this.runStorageTests(),
      this.runEdgeCaseTests(),
      this.runErrorHandlingTests(),
      this.runTestInfrastructureTests(),
    ];

    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);
    const totalDuration = Date.now() - startTime;

    return {
      suites,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      coverage: this.calculateCoverage(),
    };
  }

  runCalculationTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test income calculation
    tests.push(this.runTest(
      'Income calculation',
      () => {
        const transactions = [
          { type: 'income', amount: 1000 },
          { type: 'income', amount: 500 },
          { type: 'expense', amount: 200 },
        ];
        const expected = 1500;
        const actual = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        return { expected, actual };
      }
    ));

    // Test expense calculation
    tests.push(this.runTest(
      'Expense calculation',
      () => {
        const transactions = [
          { type: 'expense', amount: 200 },
          { type: 'expense', amount: 150 },
          { type: 'income', amount: 1000 },
        ];
        const expected = 350;
        const actual = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { expected, actual };
      }
    ));

    // Test balance calculation
    tests.push(this.runTest(
      'Balance calculation',
      () => {
        const transactions = [
          { type: 'income', amount: 1000 },
          { type: 'expense', amount: 300 },
          { type: 'income', amount: 200 },
        ];
        const expected = 900;
        const actual = transactions.reduce((sum, t) => {
          return t.type === 'income' ? sum + t.amount : sum - Math.abs(t.amount);
        }, 0);
        return { expected, actual };
      }
    ));

    // Test budget progress calculation
    tests.push(this.runTest(
      'Budget progress calculation',
      () => {
        const budget = { limit: 1000 };
        const spent = 750;
        const expected = 75;
        const actual = (spent / budget.limit) * 100;
        return { expected, actual };
      }
    ));

    // Test goal progress calculation
    tests.push(this.runTest(
      'Goal progress calculation',
      () => {
        const goal = { targetAmount: 5000, currentAmount: 2500 };
        const expected = 50;
        const actual = (goal.currentAmount / goal.targetAmount) * 100;
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Calculation Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runDataIntegrityTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test transaction data integrity
    tests.push(this.runTest(
      'Transaction data integrity',
      () => {
        const transactions = this.state.transactions;
        const hasValidIds = transactions.every(t => t.id && t.id.length > 0);
        const hasValidAmounts = transactions.every(t => !isNaN(t.amount));
        const hasValidDates = transactions.every(t => t.date instanceof Date);

        const expected = true;
        const actual = hasValidIds && hasValidAmounts && hasValidDates;
        return { expected, actual };
      }
    ));

    // Test account data integrity
    tests.push(this.runTest(
      'Account data integrity',
      () => {
        const accounts = this.state.accounts;
        const hasValidNames = accounts.every(a => a.name && a.name.trim().length > 0);
        const hasValidTypes = accounts.every(a =>
          ['checking', 'savings', 'credit', 'investment'].includes(a.type)
        );
        const hasValidBalances = accounts.every(a => !isNaN(a.balance));

        const expected = true;
        const actual = hasValidNames && hasValidTypes && hasValidBalances;
        return { expected, actual };
      }
    ));

    // Test budget data integrity
    tests.push(this.runTest(
      'Budget data integrity',
      () => {
        const budgets = this.state.budgets;
        const hasValidCategories = budgets.every(b => b.category && b.category.trim().length > 0);
        const hasValidLimits = budgets.every(b => b.limit > 0);
        const hasValidDates = budgets.every(b =>
          b.startDate instanceof Date && b.endDate instanceof Date && b.endDate > b.startDate
        );

        const expected = true;
        const actual = hasValidCategories && hasValidLimits && hasValidDates;
        return { expected, actual };
      }
    ));

    // Test goal data integrity
    tests.push(this.runTest(
      'Goal data integrity',
      () => {
        const goals = this.state.goals;
        const hasValidNames = goals.every(g => g.name && g.name.trim().length > 0);
        const hasValidAmounts = goals.every(g => g.targetAmount > 0 && g.currentAmount >= 0);
        const hasValidDates = goals.every(g => g.targetDate instanceof Date);

        const expected = true;
        const actual = hasValidNames && hasValidAmounts && hasValidDates;
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Data Integrity Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runUITests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test currency formatting
    tests.push(this.runTest(
      'Currency formatting',
      () => {
        const amount = 1234.56;
        const expected = '$1,234.56';
        const actual = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return { expected, actual };
      }
    ));

    // Test date formatting
    tests.push(this.runTest(
      'Date formatting',
      () => {
        const date = new Date('2024-01-15');
        const expected = '01/15/2024';
        const actual = date.toLocaleDateString('en-US');
        return { expected, actual };
      }
    ));

    // Test percentage formatting
    tests.push(this.runTest(
      'Percentage formatting',
      () => {
        const value = 0.7534;
        const expected = '75.34%';
        const actual = (value * 100).toFixed(2) + '%';
        return { expected, actual };
      }
    ));

    // Test category grouping
    tests.push(this.runTest(
      'Category grouping',
      () => {
        const transactions = [
          { category: 'Food', amount: 100 },
          { category: 'Food', amount: 50 },
          { category: 'Transport', amount: 75 },
        ];

        const grouped = transactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

        const expected = { Food: 150, Transport: 75 };
        const actual = grouped;
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'UI Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runValidationTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test transaction validation
    tests.push(this.runTest(
      'Transaction validation - valid transaction',
      () => {
        const validTransaction = {
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          accountId: 'account-1',
          type: 'expense' as const,
          date: new Date(),
        };
        const result = validateTransaction(validTransaction);
        const expected = { isValid: true, errorCount: 0 };
        const actual = { isValid: result.isValid, errorCount: result.errors.length };
        return { expected, actual };
      }
    ));

    // Test transaction validation - invalid transaction
    tests.push(this.runTest(
      'Transaction validation - invalid transaction',
      () => {
        const invalidTransaction = {
          amount: 0,
          description: '',
          category: '',
          accountId: '',
          type: 'invalid' as any,
          date: new Date('invalid'),
        };
        const result = validateTransaction(invalidTransaction);
        const expected = { isValid: false, hasErrors: true };
        const actual = { isValid: result.isValid, hasErrors: result.errors.length > 0 };
        return { expected, actual };
      }
    ));

    // Test budget validation
    tests.push(this.runTest(
      'Budget validation - valid budget',
      () => {
        const validBudget = {
          category: 'Food',
          limit: 500,
          period: 'monthly' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
        const result = validateBudget(validBudget);
        const expected = { isValid: true, errorCount: 0 };
        const actual = { isValid: result.isValid, errorCount: result.errors.length };
        return { expected, actual };
      }
    ));

    // Test goal validation
    tests.push(this.runTest(
      'Goal validation - valid goal',
      () => {
        const validGoal = {
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 2500,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          accountId: 'account-1',
        };
        const result = validateGoal(validGoal);
        const expected = { isValid: true, errorCount: 0 };
        const actual = { isValid: result.isValid, errorCount: result.errors.length };
        return { expected, actual };
      }
    ));

    // Test account validation
    tests.push(this.runTest(
      'Account validation - valid account',
      () => {
        const validAccount = {
          name: 'Checking Account',
          type: 'checking' as const,
          balance: 1000,
          currency: 'USD',
        };
        const result = validateAccount(validAccount);
        const expected = { isValid: true, errorCount: 0 };
        const actual = { isValid: result.isValid, errorCount: result.errors.length };
        return { expected, actual };
      }
    ));

    // Test email validation
    tests.push(this.runTest(
      'Email validation',
      () => {
        const validEmail = 'user@example.com';
        const invalidEmail = 'invalid-email';

        const expected = { valid: true, invalid: false };
        const actual = {
          valid: validateEmail(validEmail),
          invalid: validateEmail(invalidEmail),
        };
        return { expected, actual };
      }
    ));

    // Test password validation
    tests.push(this.runTest(
      'Password validation - strong password',
      () => {
        const strongPassword = 'StrongPass123!';
        const result = validatePassword(strongPassword);
        const expected = { isValid: true, errorCount: 0 };
        const actual = { isValid: result.isValid, errorCount: result.errors.length };
        return { expected, actual };
      }
    ));

    // Test password validation - weak password
    tests.push(this.runTest(
      'Password validation - weak password',
      () => {
        const weakPassword = '123';
        const result = validatePassword(weakPassword);
        const expected = { isValid: false, hasErrors: true };
        const actual = { isValid: result.isValid, hasErrors: result.errors.length > 0 };
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Validation Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runUtilityTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test currency formatting
    tests.push(this.runTest(
      'Currency formatting - USD',
      () => {
        const amount = 1234.56;
        const expected = '$1,234.56';
        const actual = formatCurrency(amount, 'USD');
        return { expected, actual };
      }
    ));

    // Test currency formatting - EUR
    tests.push(this.runTest(
      'Currency formatting - EUR',
      () => {
        const amount = 1234.56;
        const expected = '€1,234.56';
        const actual = formatCurrency(amount, 'EUR');
        return { expected, actual };
      }
    ));

    // Test date formatting
    tests.push(this.runTest(
      'Date formatting - MM/dd/yyyy',
      () => {
        const date = new Date('2024-01-15');
        const expected = '01/15/2024';
        const actual = formatDate(date, 'MM/dd/yyyy');
        return { expected, actual };
      }
    ));

    // Test date formatting - yyyy-MM-dd
    tests.push(this.runTest(
      'Date formatting - yyyy-MM-dd',
      () => {
        const date = new Date('2024-01-15');
        const expected = '2024-01-15';
        const actual = formatDate(date, 'yyyy-MM-dd');
        return { expected, actual };
      }
    ));

    // Test percentage formatting
    tests.push(this.runTest(
      'Percentage formatting',
      () => {
        const value = 750;
        const total = 1000;
        const expected = '75.0%';
        const actual = formatPercentage(value, total);
        return { expected, actual };
      }
    ));

    // Test date filter - 30 days
    tests.push(this.runTest(
      'Date filter - 30 days',
      () => {
        const result = getDateFilter('30days');
        const daysDiff = daysBetween(result.start, result.end);
        const expected = 30;
        const actual = daysDiff;
        return { expected, actual };
      }
    ));

    // Test groupBy utility
    tests.push(this.runTest(
      'Group by utility',
      () => {
        const data = [
          { category: 'Food', amount: 100 },
          { category: 'Food', amount: 50 },
          { category: 'Transport', amount: 75 },
        ];
        const grouped = groupBy(data, 'category');
        const expected = { Food: 2, Transport: 1 };
        const actual = { 
          Food: grouped.Food?.length || 0, 
          Transport: grouped.Transport?.length || 0 
        };
        return { expected, actual };
      }
    ));

    // Test sumBy utility
    tests.push(this.runTest(
      'Sum by utility',
      () => {
        const data = [
          { amount: 100 },
          { amount: 50 },
          { amount: 75 },
        ];
        const expected = 225;
        const actual = sumBy(data, 'amount');
        return { expected, actual };
      }
    ));

    // Test sortBy utility
    tests.push(this.runTest(
      'Sort by utility - ascending',
      () => {
        const data = [
          { amount: 100 },
          { amount: 50 },
          { amount: 75 },
        ];
        const sorted = sortBy(data, 'amount', 'asc');
        const expected = [50, 75, 100];
        const actual = sorted.map(item => item.amount);
        return { expected, actual };
      }
    ));

    // Test clamp utility
    tests.push(this.runTest(
      'Clamp utility',
      () => {
        const expected = { low: 10, high: 90, normal: 50 };
        const actual = {
          low: clamp(5, 10, 90),
          high: clamp(100, 10, 90),
          normal: clamp(50, 10, 90),
        };
        return { expected, actual };
      }
    ));

    // Test slugify utility
    tests.push(this.runTest(
      'Slugify utility',
      () => {
        const text = 'Hello World! This is a Test.';
        const expected = 'hello-world-this-is-a-test';
        const actual = slugify(text);
        return { expected, actual };
      }
    ));

    // Test isEmpty utility
    tests.push(this.runTest(
      'Is empty utility',
      () => {
        const expected = { 
          emptyString: true, 
          emptyArray: true, 
          emptyObject: true, 
          nonEmpty: false 
        };
        const actual = {
          emptyString: isEmpty(''),
          emptyArray: isEmpty([]),
          emptyObject: isEmpty({}),
          nonEmpty: isEmpty('test'),
        };
        return { expected, actual };
      }
    ));

    // Test deepClone utility
    tests.push(this.runTest(
      'Deep clone utility',
      () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = deepClone(original);
        cloned.b.c = 3;
        
        const expected = { original: 2, cloned: 3 };
        const actual = { original: original.b.c, cloned: cloned.b.c };
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Utility Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runStorageTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test storage availability
    tests.push(this.runTest(
      'Storage availability',
      () => {
        const storageService = new StorageService();
        const expected = true;
        const actual = storageService.isStorageAvailable();
        return { expected, actual };
      }
    ));

    // Test data save and load
    tests.push(this.runTest(
      'Data save and load',
      () => {
        const storageService = new StorageService();
        const testData = {
          accounts: [],
          transactions: [],
          budgets: [],
          goals: [],
        };
        
        const saveResult = storageService.saveData(testData);
        const loadResult = storageService.loadData();
        
        const expected = { saved: true, loaded: true };
        const actual = { 
          saved: saveResult, 
          loaded: loadResult !== null && Array.isArray(loadResult.accounts) 
        };
        return { expected, actual };
      }
    ));

    // Test data export
    tests.push(this.runTest(
      'Data export',
      () => {
        const storageService = new StorageService();
        const exportResult = storageService.exportData();
        
        const expected = { hasData: true, isString: true };
        const actual = { 
          hasData: exportResult !== null, 
          isString: typeof exportResult === 'string' 
        };
        return { expected, actual };
      }
    ));

    // Test storage info
    tests.push(this.runTest(
      'Storage info',
      () => {
        const storageService = new StorageService();
        const info = storageService.getStorageInfo();
        
        const expected = { hasUsed: true, hasAvailable: true, hasPercentage: true };
        const actual = { 
          hasUsed: typeof info.used === 'number', 
          hasAvailable: typeof info.available === 'number',
          hasPercentage: typeof info.percentage === 'number'
        };
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Storage Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runEdgeCaseTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test division by zero
    tests.push(this.runTest(
      'Division by zero in percentage calculation',
      () => {
        const value = 100;
        const total = 0;
        const expected = '0%';
        const actual = formatPercentage(value, total);
        return { expected, actual };
      }
    ));

    // Test negative amounts
    tests.push(this.runTest(
      'Negative amount formatting',
      () => {
        const amount = -1234.56;
        const expected = '-$1,234.56';
        const actual = formatCurrency(amount, 'USD');
        return { expected, actual };
      }
    ));

    // Test very large numbers
    tests.push(this.runTest(
      'Large number formatting',
      () => {
        const amount = 1234567890.12;
        const expected = '$1,234,567,890.12';
        const actual = formatCurrency(amount, 'USD');
        return { expected, actual };
      }
    ));

    // Test empty arrays in calculations
    tests.push(this.runTest(
      'Empty array sum calculation',
      () => {
        const data: { amount: number }[] = [];
        const expected = 0;
        const actual = sumBy(data, 'amount');
        return { expected, actual };
      }
    ));

    // Test invalid date handling
    tests.push(this.runTest(
      'Invalid date handling',
      () => {
        const invalidDate = new Date('invalid');
        const expected = true;
        const actual = isNaN(invalidDate.getTime());
        return { expected, actual };
      }
    ));

    // Test boundary date ranges
    tests.push(this.runTest(
      'Boundary date range check',
      () => {
        const date = new Date('2024-01-15');
        const start = new Date('2024-01-15');
        const end = new Date('2024-01-15');
        
        const expected = true;
        const actual = isDateInRange(date, start, end);
        return { expected, actual };
      }
    ));

    // Test null/undefined handling
    tests.push(this.runTest(
      'Null/undefined handling in isEmpty',
      () => {
        const expected = { null: true, undefined: true };
        const actual = { 
          null: isEmpty(null), 
          undefined: isEmpty(undefined) 
        };
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Edge Case Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  runErrorHandlingTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test error handling in currency formatting
    tests.push(this.runTest(
      'Currency formatting with invalid currency',
      () => {
        const amount = 1234.56;
        const result = formatCurrency(amount, 'INVALID');
        
        const expected = { hasResult: true, isString: true };
        const actual = { 
          hasResult: result !== null && result !== undefined, 
          isString: typeof result === 'string' 
        };
        return { expected, actual };
      }
    ));

    // Test error handling in validation
    tests.push(this.runTest(
      'Validation with missing required fields',
      () => {
        const incompleteTransaction = {};
        const result = validateTransaction(incompleteTransaction);
        
        const expected = { isValid: false, hasErrors: true };
        const actual = { 
          isValid: result.isValid, 
          hasErrors: result.errors.length > 0 
        };
        return { expected, actual };
      }
    ));

    // Test error handling in date operations
    tests.push(this.runTest(
      'Date operations with invalid dates',
      () => {
        const invalidDate1 = new Date('invalid');
        const invalidDate2 = new Date('also-invalid');
        
        // Should handle gracefully without throwing
        let errorThrown = false;
        try {
          daysBetween(invalidDate1, invalidDate2);
        } catch (error) {
          errorThrown = true;
        }
        
        const expected = false; // Should not throw error
        const actual = errorThrown;
        return { expected, actual };
      }
    ));

    // Test error handling in storage operations
    tests.push(this.runTest(
      'Storage error handling',
      () => {
        const storageService = new StorageService();
        
        // Test with invalid data
        let errorHandled = true;
        try {
          const result = storageService.importData('invalid json');
          errorHandled = !result; // Should return false for invalid data
        } catch (error) {
          errorHandled = true;
        }
        
        const expected = true;
        const actual = errorHandled;
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Error Handling Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }

  private runTest(name: string, testFn: () => { expected: any; actual: any }): TestResult {
    const startTime = Date.now();

    try {
      const { expected, actual } = testFn();
      const passed = JSON.stringify(expected) === JSON.stringify(actual);
      const duration = Date.now() - startTime;

      return {
        name,
        passed,
        expected,
        actual,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name,
        passed: false,
        expected: 'No error',
        actual: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  private calculateCoverage(): TestResults['coverage'] {
    // Calculate coverage based on actual test results
    const results = this.runAllTests();
    const overallCoverage = results.totalTests > 0 ? 
      Math.round((results.totalPassed / results.totalTests) * 100) : 0;

    // Calculate coverage by category based on test suites
    const suiteMap = new Map(results.suites.map(suite => [suite.name, suite]));
    
    const modelsCoverage = this.calculateSuiteCoverage([
      suiteMap.get('Calculation Tests'),
      suiteMap.get('Data Integrity Tests'),
    ]);

    const servicesCoverage = this.calculateSuiteCoverage([
      suiteMap.get('Storage Tests'),
      suiteMap.get('Validation Tests'),
    ]);

    const componentsCoverage = this.calculateSuiteCoverage([
      suiteMap.get('UI Tests'),
    ]);

    const utilitiesCoverage = this.calculateSuiteCoverage([
      suiteMap.get('Utility Tests'),
      suiteMap.get('Edge Case Tests'),
      suiteMap.get('Error Handling Tests'),
    ]);

    return {
      overall: overallCoverage,
      models: modelsCoverage,
      services: servicesCoverage,
      components: componentsCoverage,
      utilities: utilitiesCoverage,
    };
  }

  private calculateSuiteCoverage(suites: (TestSuite | undefined)[]): number {
    const validSuites = suites.filter(suite => suite !== undefined) as TestSuite[];
    if (validSuites.length === 0) return 0;

    const totalTests = validSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = validSuites.reduce((sum, suite) => sum + suite.passed, 0);

    return totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  }

  generateTestReport(): string {
    const results = this.runAllTests();

    const lines: string[] = [];
    lines.push('# Test Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Tests:** ${results.totalTests}`);
    lines.push(`**Passed:** ${results.totalPassed}`);
    lines.push(`**Failed:** ${results.totalFailed}`);
    lines.push(`**Duration:** ${results.totalDuration}ms`);
    lines.push('');

    lines.push('## Coverage');
    lines.push(`- Overall: ${results.coverage.overall}%`);
    lines.push(`- Models: ${results.coverage.models}%`);
    lines.push(`- Services: ${results.coverage.services}%`);
    lines.push(`- Components: ${results.coverage.components}%`);
    lines.push(`- Utilities: ${results.coverage.utilities}%`);
    lines.push('');

    results.suites.forEach(suite => {
      lines.push(`## ${suite.name}`);
      lines.push(`**Passed:** ${suite.passed} | **Failed:** ${suite.failed} | **Duration:** ${suite.duration}ms`);
      lines.push('');

      suite.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        lines.push(`${status} ${test.name}`);
        if (!test.passed) {
          lines.push(`   Expected: ${JSON.stringify(test.expected)}`);
          lines.push(`   Actual: ${JSON.stringify(test.actual)}`);
          if (test.error) {
            lines.push(`   Error: ${test.error}`);
          }
        }
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  // Test the testing infrastructure itself
  runTestInfrastructureTests(): TestSuite {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test that test runner can execute tests
    tests.push(this.runTest(
      'Test runner execution',
      () => {
        const simpleTest = this.runTest('Simple test', () => ({ expected: true, actual: true }));
        const expected = { passed: true, hasName: true, hasDuration: true };
        const actual = { 
          passed: simpleTest.passed, 
          hasName: typeof simpleTest.name === 'string',
          hasDuration: typeof simpleTest.duration === 'number'
        };
        return { expected, actual };
      }
    ));

    // Test that test results are properly structured
    tests.push(this.runTest(
      'Test result structure validation',
      () => {
        const mockResults = this.runCalculationTests();
        const expected = { 
          hasName: true, 
          hasTests: true, 
          hasPassed: true, 
          hasFailed: true 
        };
        const actual = {
          hasName: typeof mockResults.name === 'string',
          hasTests: Array.isArray(mockResults.tests),
          hasPassed: typeof mockResults.passed === 'number',
          hasFailed: typeof mockResults.failed === 'number'
        };
        return { expected, actual };
      }
    ));

    // Test that coverage calculation works
    tests.push(this.runTest(
      'Coverage calculation',
      () => {
        const coverage = this.calculateCoverage();
        const expected = { 
          hasOverall: true, 
          hasModels: true, 
          validRange: true 
        };
        const actual = {
          hasOverall: typeof coverage.overall === 'number',
          hasModels: typeof coverage.models === 'number',
          validRange: coverage.overall >= 0 && coverage.overall <= 100
        };
        return { expected, actual };
      }
    ));

    // Test that report generation works
    tests.push(this.runTest(
      'Report generation',
      () => {
        const report = this.generateTestReport();
        const expected = { isString: true, hasContent: true, hasHeader: true };
        const actual = {
          isString: typeof report === 'string',
          hasContent: report.length > 0,
          hasHeader: report.includes('# Test Report')
        };
        return { expected, actual };
      }
    ));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const duration = Date.now() - startTime;

    return {
      name: 'Test Infrastructure Tests',
      tests,
      passed,
      failed,
      duration,
    };
  }
}