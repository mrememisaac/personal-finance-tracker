# Testing Slice

## Overview

The Testing slice provides an integrated testing dashboard and test runner for the Personal Finance Tracker application. Unlike traditional test frameworks that run in development environments, this slice offers in-app testing capabilities that validate business logic, calculations, data integrity, and UI functionality directly within the running application.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
testing/
├── TestService.ts             # Service layer for test execution
├── components/                # UI components
│   ├── TestDashboard.tsx     # Visual test interface
│   └── index.ts
└── index.ts                  # Public API exports
```

## Components

### TestService

Service class responsible for running tests and generating test reports.

**Core Methods:**

#### Test Execution
- `runAllTests()`: Executes all test suites
  - Calculation tests
  - Data integrity tests
  - UI tests
  - Validation tests
  - Returns `TestResults` with summary
  
- `runCalculationTests()`: Tests financial calculations
  - Income/expense totals
  - Net balance calculations
  - Budget progress calculations
  - Goal projections
  - Savings rate calculations
  
- `runDataIntegrityTests()`: Validates data consistency
  - Transaction-account relationships
  - Budget-category mappings
  - Goal-account associations
  - Balance integrity
  - No orphaned records
  
- `runUITests()`: Tests UI component behavior
  - Component rendering
  - State updates
  - User interactions
  - Form validations
  
- `runValidationTests()`: Tests validation logic
  - Transaction validation
  - Budget validation
  - Goal validation
  - Account validation

#### Test Utilities
- `runTest(name, testFn)`: Executes single test
  - Captures expected vs. actual
  - Measures execution time
  - Handles errors gracefully
  
- `calculateCoverage()`: Calculates test coverage
  - Overall coverage percentage
  - Coverage by module (models, services, components)
  
- `generateTestReport()`: Creates test report
  - Markdown-formatted report
  - Summary statistics
  - Suite-by-suite breakdown
  - Coverage metrics
  - Failed test details

## Data Structures

### TestResult
```typescript
interface TestResult {
  name: string;           // Test name
  passed: boolean;        // Pass/fail status
  expected: any;          // Expected value
  actual: any;            // Actual value
  error?: string;         // Error message if failed
  duration: number;       // Execution time (ms)
}
```

### TestSuite
```typescript
interface TestSuite {
  name: string;           // Suite name
  passed: number;         // Number of passed tests
  failed: number;         // Number of failed tests
  duration: number;       // Total duration (ms)
  tests: TestResult[];    // Individual test results
}
```

### TestResults
```typescript
interface TestResults {
  totalTests: number;     // Total test count
  totalPassed: number;    // Total passed
  totalFailed: number;    // Total failed
  totalDuration: number;  // Total time (ms)
  suites: TestSuite[];    // All test suites
  coverage: {             // Coverage metrics
    overall: number;      // Overall %
    models: number;       // Models %
    services: number;     // Services %
    components: number;   // Components %
    utilities: number;    // Utilities %
  };
}
```

## UI Components

### TestDashboard
Visual interface for viewing and running tests.

**Features:**
- Run all tests button
- Individual suite runners
- Real-time test execution
- Pass/fail status indicators
- Test duration display
- Coverage visualization
- Failed test details
- Test report generation
- Export test results

**Display Sections:**

1. **Summary Section**
   - Total tests count
   - Passed tests (green)
   - Failed tests (red)
   - Total duration
   - Overall status indicator

2. **Coverage Section**
   - Overall coverage percentage
   - Models & Services coverage
   - Components coverage
   - Utilities coverage
   - Visual progress bars with color coding

3. **Test Suites Section**
   - Calculation Tests suite
   - Data Integrity Tests suite
   - UI Tests suite
   - Validation Tests suite
   - Expandable test details

4. **Actions Section**
   - Run All Tests button
   - Export Report button
   - Clear Results button
   - Refresh button

**Props:**
- No props required (self-contained)

## Test Suites

### 1. Calculation Tests

Validates all financial calculations:

**Transaction Calculations**
- Total income calculation
- Total expenses calculation
- Net balance (income - expenses)
- Category totals
- Account balances

**Budget Calculations**
- Budget spent amount
- Budget remaining
- Budget percentage
- Budget status (safe/warning/danger)

**Goal Calculations**
- Goal progress percentage
- Remaining amount
- Projected completion date
- Required monthly contribution

**Report Calculations**
- Savings rate
- Period totals
- Category breakdowns
- Trends and averages

### 2. Data Integrity Tests

Ensures data consistency:

**Relationship Integrity**
- Every transaction has valid account ID
- Every budget has valid category
- Every goal has valid account ID
- No orphaned references

**Balance Integrity**
- Account balances match transaction history
- Budget spent matches actual transactions
- Goal current amount matches contributions

**Date Consistency**
- Created dates <= updated dates
- Transaction dates valid
- Budget periods valid
- Goal dates logical

**Uniqueness**
- Unique transaction IDs
- Unique budget IDs
- Unique goal IDs
- Unique account IDs

### 3. UI Tests

Validates component behavior:

**Rendering Tests**
- Components render without errors
- Props passed correctly
- State updates reflect in UI
- Conditional rendering works

**Interaction Tests**
- Form submissions work
- Button clicks trigger actions
- Input validation functions
- Modal open/close works

**State Management Tests**
- State updates propagate
- Context provides correct data
- Dispatch actions work
- State persistence works

### 4. Validation Tests

Tests validation logic:

**Transaction Validation**
- Amount must be positive
- Description required
- Valid category
- Valid account ID
- Valid type (income/expense)

**Budget Validation**
- Limit must be positive
- Valid period (weekly/monthly)
- Category not empty
- Start date valid

**Goal Validation**
- Target amount positive
- Target date in future
- Valid account ID
- Name not empty

**Account Validation**
- Name required
- Valid account type
- Balance can be negative (credit cards)
- Currency code valid

## Usage Examples

### Running Tests

```typescript
import { TestService } from './slices/testing';
import { useAppContext } from './shared/context/AppContext';

function TestRunner() {
  const { state, dispatch } = useAppContext();
  const testService = new TestService(state, dispatch);

  // Run all tests
  const results = testService.runAllTests();
  console.log(`Total: ${results.totalTests}`);
  console.log(`Passed: ${results.totalPassed}`);
  console.log(`Failed: ${results.totalFailed}`);

  // Run specific test suite
  const calcTests = testService.runCalculationTests();
  console.log(`Calculation Tests: ${calcTests.passed}/${calcTests.passed + calcTests.failed}`);
}
```

### Generating Test Report

```typescript
const testService = new TestService(state, dispatch);

// Generate markdown report
const report = testService.generateTestReport();

// Log to console
console.log(report);

// Download as file
const blob = new Blob([report], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'test-report.md';
link.click();
```

### Using Test Dashboard

```tsx
import { TestDashboard } from './slices/testing';

function TestingPage() {
  return (
    <div className="testing-page">
      <h1>Application Testing</h1>
      <TestDashboard />
    </div>
  );
}
```

### Individual Test Execution

```typescript
// Run a single test
const result = testService.runTest('Total Income Calculation', () => {
  const transactions = [
    { type: 'income', amount: 1000 },
    { type: 'income', amount: 500 },
    { type: 'expense', amount: 300 }
  ];
  
  const totalIncome = calculateTotalIncome(transactions);
  
  return {
    expected: 1500,
    actual: totalIncome
  };
});

if (result.passed) {
  console.log('✓ Test passed');
} else {
  console.log('✗ Test failed');
  console.log(`Expected: ${result.expected}`);
  console.log(`Actual: ${result.actual}`);
}
```

## Test Report Format

The generated test report includes:

```markdown
# Test Report

**Generated:** 2024-01-15T10:30:00.000Z
**Total Tests:** 48
**Passed:** 46
**Failed:** 2
**Duration:** 234ms

## Coverage
- Overall: 87%
- Models: 95%
- Services: 92%
- Components: 82%
- Utilities: 100%

## Calculation Tests
**Passed:** 12 | **Failed:** 0 | **Duration:** 45ms

✓ Total Income Calculation (3ms)
✓ Total Expenses Calculation (2ms)
✓ Net Balance Calculation (2ms)
...

## Data Integrity Tests
**Passed:** 10 | **Failed:** 1 | **Duration:** 67ms

✓ Transaction-Account Relationships (5ms)
✗ Budget-Category Mappings (8ms)
  Expected: All budgets have valid categories
  Actual: Budget "xyz" has invalid category
...
```

## Integration Points

### With All Slices
The testing slice integrates with all other slices to validate their functionality:

- **Transaction Slice**: Tests transaction operations and calculations
- **Budget Slice**: Validates budget logic and progress tracking
- **Account Slice**: Ensures account balance integrity
- **Goal Slice**: Tests goal projections and progress
- **Reports Slice**: Validates report generation accuracy
- **Dashboard Slice**: Tests dashboard metric calculations

### With Shared Utilities
- Validates utility functions
- Tests formatters and validators
- Verifies date handling
- Tests currency formatting

## Performance Considerations

- Tests run synchronously (may block UI)
- Large test suites may take several seconds
- Consider running tests in background worker (future)
- Optimize test data size for speed
- Cache test results when data hasn't changed

## Best Practices

1. **Regular Testing**: Run tests after major changes
2. **CI Integration**: Automate test execution (future)
3. **Test Coverage**: Aim for >80% coverage
4. **Quick Tests**: Keep individual tests fast (<10ms)
5. **Clear Names**: Use descriptive test names
6. **Isolation**: Tests should not depend on each other
7. **Mock Data**: Use realistic but minimal test data

## Testing Strategy

### When to Run Tests

1. **Development**: After implementing new features
2. **Before Commit**: Validate changes don't break existing functionality
3. **Regression**: After bug fixes
4. **Release**: Before deploying new versions
5. **Production**: Periodic health checks (optional)

### Test Prioritization

1. **High Priority**: Financial calculations (money matters!)
2. **Medium Priority**: Data integrity and validation
3. **Low Priority**: UI rendering and interactions

## Limitations

Current limitations of the in-app testing approach:

- Not a replacement for proper unit tests (Vitest/Jest)
- Limited code coverage analysis
- Cannot test some async operations thoroughly
- No test isolation (uses actual app state)
- Performance overhead during test execution

## Future Enhancements

- [ ] Asynchronous test execution
- [ ] Test result history and trends
- [ ] Automated test scheduling
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Integration with CI/CD pipelines
- [ ] Test data generators
- [ ] Mocking and stubbing utilities
- [ ] Code coverage maps
- [ ] Test failure notifications
- [ ] Comparative testing (before/after changes)
- [ ] Stress testing for large datasets
- [ ] Cross-browser compatibility tests

## Error Handling

Test execution includes comprehensive error handling:

- Test failures captured and reported
- Errors don't stop other tests
- Stack traces preserved
- Timeout protection (future)
- Memory leak detection (future)

## Accessibility

The test dashboard includes:

- Keyboard navigation
- Screen reader support
- ARIA labels for test results
- Color-blind friendly indicators (✓/✗ symbols)
- High contrast mode support

## Coverage Metrics

Coverage is calculated based on:

```typescript
coverage = {
  overall: (testedFeatures / totalFeatures) * 100,
  models: (testedModelMethods / totalModelMethods) * 100,
  services: (testedServiceMethods / totalServiceMethods) * 100,
  components: (testedComponents / totalComponents) * 100,
  utilities: (testedUtilities / totalUtilities) * 100
}
```

Note: Current coverage is mock data. Real coverage requires instrumentation.

## Continuous Improvement

### Expanding Test Coverage

To add new tests:

1. Add test method to appropriate suite
2. Implement test logic
3. Add to test runner
4. Update coverage calculation
5. Document in test report

### Example: Adding a New Test

```typescript
// In TestService.ts
runCalculationTests(): TestSuite {
  const tests: TestResult[] = [];

  // Existing tests...

  // Add new test
  tests.push(this.runTest('Monthly Average Calculation', () => {
    const transactions = getTransactionsForTest();
    const average = calculateMonthlyAverage(transactions);
    return {
      expected: 1500,
      actual: average
    };
  }));

  // Rest of method...
}
```

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- All application slices (for testing)
- Shared utilities (for validation)
- Global state management (for test data)

## Related Documentation

- [Transaction Slice](../transaction/README.md)
- [Budget Slice](../budget/README.md)
- [Account Slice](../accounts/README.md)
- [Goal Slice](../goals/README.md)
- [Reports Slice](../reports/README.md)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
