# Reports Slice

## Overview

The Reports slice provides comprehensive financial analytics, visualizations, and data export capabilities. It generates detailed reports on spending patterns, income trends, category breakdowns, and financial health metrics. The slice uses Chart.js for interactive visualizations and supports multiple export formats.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
reports/
├── ReportService.ts           # Service layer for report generation
├── components/                # UI components
│   ├── ChartsSection.tsx
│   ├── ChartsSection.test.tsx
│   ├── ReportsDashboard.tsx
│   ├── ReportsDashboard.test.tsx
│   └── index.ts
├── services/                  # Additional service utilities
├── ReportService.test.ts     # Service tests
└── index.ts                  # Public API exports
```

## Components

### ReportService

Service class responsible for generating financial reports and analytics.

**Core Methods:**

#### Report Generation
- `generateSpendingReport(dateRange)`: Creates spending analysis
  - Total spending by period
  - Category breakdown
  - Top spending categories
  - Spending trends
  
- `generateIncomeVsExpenseReport(dateRange)`: Income/expense comparison
  - Total income and expenses
  - Net income calculation
  - Period-over-period comparison
  - Savings rate
  
- `generateCategoryReport(dateRange)`: Detailed category analysis
  - Spending per category
  - Category trends
  - Budget vs. actual by category
  - Category rankings
  
- `generateAccountBalanceHistory(accountId)`: Account balance over time
  - Daily/weekly/monthly balance snapshots
  - Balance trend analysis
  - Growth calculations

- `generateComprehensiveReport(dateRange)`: All-in-one report
  - Combines all report types
  - Executive summary
  - Key metrics and insights

#### Chart Data
- `getChartData(type, dateRange)`: Prepares data for charts
  - Line chart: Trends over time
  - Pie chart: Category distribution
  - Bar chart: Income vs. expenses
  
- `getLineChartData(dateRange)`: Monthly income/expense trends
- `getPieChartData(dateRange)`: Category spending distribution
- `getBarChartData(dateRange)`: Period comparison

#### Data Export
- `exportReport(report, format)`: Exports report in specified format
  - CSV: Comma-separated values for spreadsheets
  - JSON: Structured data for programmatic use
  - PDF: Formatted document (future)
  
- `exportComprehensiveReport(dateRange, format)`: Export all data
- `exportTransactionReport(dateRange, format)`: Transaction-focused export

#### Analytics
- `calculateSavingsRate(dateRange)`: Percentage of income saved
- `calculateSpendingByCategory(dateRange)`: Category totals
- `calculateMonthlyAverages(dateRange)`: Average monthly amounts
- `identifySpendingTrends(dateRange)`: Trend analysis
- `getTopCategories(dateRange, limit)`: Highest spending categories
- `calculateFinancialHealth(dateRange)`: Overall health score

## UI Components

### ReportsDashboard
Main interface for viewing and interacting with financial reports.

**Features:**
- Period selector (7 days, 30 days, 90 days, 1 year, all time)
- Multi-filter support (categories, types, accounts)
- Summary statistics cards
- Export controls
- Filter management
- Interactive data visualization integration
- Responsive layout

**Key Sections:**
- **Header**: Title, period selector, export buttons
- **Filters**: Category, type, and account filters
- **Summary Stats**: Income, expenses, net, savings rate
- **Charts**: Interactive visualizations
- **Detailed Reports**: Category breakdown, trends

**Props:**
- No props required (uses context for state)

### ChartsSection
Component displaying interactive financial charts.

**Features:**
- Multiple chart types:
  - **Line Chart**: Monthly income and expense trends (12 months)
  - **Pie Chart**: Expense distribution by category
  - **Bar Chart**: Income vs. expenses comparison
- Chart type selector with icons
- Period selector
- Interactive tooltips
- Responsive sizing
- Chart descriptions
- Color-coded data series
- Legend display

**Chart Configurations:**
- Line Chart:
  - Green line: Income
  - Red line: Expenses
  - X-axis: Months
  - Y-axis: Amount (currency formatted)
  
- Pie Chart:
  - Multi-color segments per category
  - Percentage labels
  - Interactive hover
  
- Bar Chart:
  - Green bar: Total income
  - Red bar: Total expenses
  - Side-by-side comparison

**Props:**
- `selectedPeriod?`: Active time period
- `onPeriodChange?`: Period change callback

## Usage Examples

### Generating Reports

```typescript
import { ReportService } from './slices/reports';

const service = new ReportService(state, dispatch);

// Generate spending report for last 30 days
const spendingReport = service.generateSpendingReport({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

console.log(`Total Spent: $${spendingReport.totalSpent}`);
console.log('Top Categories:', spendingReport.topCategories);

// Income vs. Expense report
const comparisonReport = service.generateIncomeVsExpenseReport({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

console.log(`Income: $${comparisonReport.totalIncome}`);
console.log(`Expenses: $${comparisonReport.totalExpenses}`);
console.log(`Net: $${comparisonReport.netIncome}`);
console.log(`Savings Rate: ${comparisonReport.savingsRate}%`);
```

### Getting Chart Data

```typescript
// Get data for line chart
const lineData = service.getLineChartData({
  start: new Date('2023-01-01'),
  end: new Date('2023-12-31')
});

// Get data for pie chart
const pieData = service.getPieChartData({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

// Get data for bar chart
const barData = service.getBarChartData({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
```

### Exporting Data

```typescript
// Export as CSV
const csvData = service.exportComprehensiveReport(
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
  'csv'
);

// Download CSV file
const blob = new Blob([csvData], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'financial-report.csv';
link.click();

// Export as JSON
const jsonData = service.exportComprehensiveReport(
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
  'json'
);
```

### Calculating Analytics

```typescript
// Calculate savings rate
const savingsRate = service.calculateSavingsRate({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
console.log(`Savings Rate: ${savingsRate}%`);

// Get top spending categories
const topCategories = service.getTopCategories(
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
  5
);

topCategories.forEach((cat, index) => {
  console.log(`${index + 1}. ${cat.category}: $${cat.amount}`);
});

// Calculate financial health score
const healthScore = service.calculateFinancialHealth({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
console.log(`Financial Health: ${healthScore}/100`);
```

### Using Components

```tsx
import { ReportsDashboard, ChartsSection } from './slices/reports';

// Full reports dashboard
<ReportsDashboard />

// Just charts section
<ChartsSection
  selectedPeriod="30days"
  onPeriodChange={handlePeriodChange}
/>
```

## Report Types

### Spending Report
Comprehensive analysis of expenses:
- Total spending for period
- Category breakdown with amounts and percentages
- Top spending categories
- Daily/weekly/monthly averages
- Spending trends
- Budget comparison

### Income vs. Expense Report
Income and expense comparison:
- Total income
- Total expenses
- Net income (income - expenses)
- Savings rate ((net / income) * 100)
- Period-over-period comparison
- Income sources breakdown

### Category Report
Detailed category analysis:
- Spending per category
- Category trends over time
- Budget vs. actual by category
- Category rankings
- Percentage of total spending
- Unusual spending detection

### Account Balance History
Account balance tracking:
- Balance snapshots over time
- Balance trend visualization
- Growth/decline calculation
- Period comparison
- Highest/lowest balances

### Comprehensive Report
All-in-one financial overview:
- Executive summary
- All report types combined
- Key metrics dashboard
- Financial insights
- Recommendations

## Integration Points

### With Transaction Slice
- Primary data source for all reports
- Transaction filtering and aggregation
- Category and date-based queries
- Income vs. expense calculations

### With Budget Slice
- Budget vs. actual comparisons
- Budget performance tracking
- Category budget analysis
- Alert integration

### With Account Slice
- Account-specific reports
- Balance history tracking
- Multi-account analytics
- Net worth calculations

### With Goals Slice
- Goal progress reporting
- Contribution analysis
- Goal achievement tracking
- Savings allocation reports

### With Dashboard Slice
- Summary statistics
- Quick insights display
- Recent trends overview

## Data Flow

1. **Report Generation**
   ```
   User Selects Period → ReportService.generateReport()
   → Query Transactions → Calculate Metrics
   → Format Data → Return Report
   ```

2. **Chart Rendering**
   ```
   Period Change → Get Chart Data → Format for Chart.js
   → Render Chart → Enable Interactions
   ```

3. **Data Export**
   ```
   Export Request → Generate Report → Format as CSV/JSON
   → Create Download → User Saves File
   ```

4. **Filter Application**
   ```
   User Applies Filters → Update State → Regenerate Reports
   → Update Charts → Refresh Display
   ```

## Chart Types

### Line Chart
- **Use Case**: Trends over time
- **Best For**: Income/expense trends, balance history
- **X-Axis**: Time periods (months, weeks, days)
- **Y-Axis**: Amount (currency)
- **Series**: Multiple lines for comparison

### Pie Chart
- **Use Case**: Distribution and proportions
- **Best For**: Category breakdown, expense composition
- **Segments**: One per category
- **Labels**: Category name and percentage
- **Colors**: Distinct color per segment

### Bar Chart
- **Use Case**: Comparisons between categories
- **Best For**: Income vs. expenses, period comparisons
- **X-Axis**: Categories or periods
- **Y-Axis**: Amount (currency)
- **Bars**: Color-coded by type

## Export Formats

### CSV Export
- Comma-separated values
- Compatible with Excel, Google Sheets
- Includes headers
- Transaction-level detail
- Easy to filter and analyze

**Structure:**
```csv
Date,Description,Category,Type,Amount,Account
2024-01-15,Grocery Store,Food,expense,-85.50,Checking
2024-01-16,Salary,Income,income,3000.00,Checking
```

### JSON Export
- Structured data format
- Programmatic integration
- Hierarchical organization
- Complete metadata
- API-friendly

**Structure:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "summary": {
    "totalIncome": 5000,
    "totalExpenses": 3500,
    "netIncome": 1500,
    "savingsRate": 30
  },
  "transactions": [...],
  "categoryBreakdown": [...]
}
```

## Performance Considerations

- Report generation is synchronous (may block for large datasets)
- Chart rendering optimized with Chart.js
- Data aggregation cached where possible
- Large date ranges may impact performance
- Consider pagination for very large transaction sets

## Testing

The slice includes comprehensive test coverage:

- **Service Tests** (`ReportService.test.ts`): Report generation logic
- **Component Tests**: UI behavior and chart rendering
- **Integration Tests**: Cross-slice report accuracy

### Running Tests

```bash
# Run all tests
npm test

# Run report-specific tests
npm test -- reports
```

## Best Practices

1. **Meaningful Periods**: Choose relevant date ranges
2. **Regular Review**: Weekly or monthly report reviews
3. **Trend Analysis**: Look for patterns and anomalies
4. **Category Insights**: Understand where money goes
5. **Export Regularly**: Keep records for tax purposes
6. **Compare Periods**: Month-over-month or year-over-year
7. **Action Items**: Use insights to adjust behavior

## Common Patterns

### Monthly Financial Review
```typescript
// Generate monthly report
const lastMonth = {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
};

const report = service.generateComprehensiveReport(lastMonth);
const savingsRate = service.calculateSavingsRate(lastMonth);
const topCategories = service.getTopCategories(lastMonth, 5);

// Review and take action
if (savingsRate < 20) {
  console.log('Consider reducing expenses');
}
```

### Year-End Tax Preparation
```typescript
// Export full year data for tax purposes
const yearData = service.exportComprehensiveReport(
  {
    start: new Date('2023-01-01'),
    end: new Date('2023-12-31')
  },
  'csv'
);

// Save for tax filing
downloadFile(yearData, 'tax-2023.csv');
```

### Spending Anomaly Detection
```typescript
// Identify unusual spending
const currentMonth = service.calculateSpendingByCategory(currentPeriod);
const avgMonth = service.calculateMonthlyAverages(lastYear);

currentMonth.forEach(cat => {
  const avg = avgMonth.get(cat.category);
  if (cat.amount > avg * 1.5) {
    console.log(`Alert: High spending in ${cat.category}`);
  }
});
```

## Error Handling

The service implements error handling for:

- Invalid date ranges
- Empty transaction sets
- Missing data
- Export failures
- Chart rendering errors

## Future Enhancements

- [ ] PDF export with formatted layouts
- [ ] Email report scheduling
- [ ] Automated insights and recommendations
- [ ] Comparative analysis (vs. last period)
- [ ] Forecasting and predictions
- [ ] Custom report builder
- [ ] Advanced filtering options
- [ ] Report templates
- [ ] Social comparison (anonymous benchmarking)
- [ ] Tax report generation
- [ ] Investment performance reports
- [ ] Debt payoff projections
- [ ] Interactive drill-down reports
- [ ] Report sharing and collaboration

## Dependencies

- React 18+ for UI components
- Chart.js for data visualization
- react-chartjs-2 for React integration
- Lucide React for icons
- Transaction, Budget, Account, Goal slices for data
- Shared utilities (formatting, date handling)
- Global state management (Context API)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
