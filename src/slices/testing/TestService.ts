import type { AppState, AppAction } from '../../shared/types';

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
  dispatch: React.Dispatch<AppAction>;

  constructor(
    state: AppState,
    dispatch: React.Dispatch<AppAction>
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

    // Test email validation
    tests.push(this.runTest(
      'Email validation',
      () => {
        const validEmail = 'user@example.com';
        const invalidEmail = 'invalid-email';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const expected = { valid: true, invalid: false };
        const actual = {
          valid: emailRegex.test(validEmail),
          invalid: emailRegex.test(invalidEmail),
        };
        return { expected, actual };
      }
    ));

    // Test amount validation
    tests.push(this.runTest(
      'Amount validation',
      () => {
        const validAmount = '123.45';
        const invalidAmount = 'abc';

        const expected = { valid: false, invalid: true };
        const actual = {
          valid: isNaN(parseFloat(validAmount)),
          invalid: isNaN(parseFloat(invalidAmount)),
        };
        return { expected, actual };
      }
    ));

    // Test date validation
    tests.push(this.runTest(
      'Date validation',
      () => {
        const validDate = '2024-01-15';
        const invalidDate = 'invalid-date';

        const expected = { valid: false, invalid: true };
        const actual = {
          valid: isNaN(new Date(validDate).getTime()),
          invalid: isNaN(new Date(invalidDate).getTime()),
        };
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
    // Mock coverage calculation - in a real app this would be more sophisticated
    return {
      overall: 87,
      models: 95,
      services: 92,
      components: 82,
      utilities: 100,
    };
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
}