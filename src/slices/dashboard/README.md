# Dashboard Slice

## Overview

The Dashboard slice provides the main overview interface of the Personal Finance Tracker. It aggregates and displays key financial metrics, recent transactions, spending patterns, and quick actions in an intuitive, at-a-glance format. The dashboard serves as the entry point for users to understand their current financial status and access other features.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
dashboard/
├── components/                # UI components
│   ├── ExpenseBreakdown.tsx
│   ├── ExpenseBreakdown.test.tsx
│   ├── QuickActions.tsx
│   ├── QuickActions.test.tsx
│   ├── RecentTransactions.tsx
│   ├── RecentTransactions.test.tsx
│   ├── SummaryCards.tsx
│   ├── SummaryCards.test.tsx
│   └── index.ts
└── index.ts                  # Public API exports
```

## Components

### SummaryCards
Displays high-level financial overview in card format.

**Features:**
- Total income card (green theme)
- Total expenses card (red theme)
- Net balance card (blue/red based on positive/negative)
- Savings rate card (percentage)
- Period selector
- Trend indicators (up/down arrows)
- Comparison with previous period
- Responsive grid layout
- Loading states
- Empty states

**Displayed Metrics:**
- **Total Income**: Sum of all income for selected period
- **Total Expenses**: Sum of all expenses for selected period
- **Net Balance**: Income minus expenses
- **Savings Rate**: (Net Balance / Income) × 100

**Icons:**
- TrendingUp/TrendingDown for income
- TrendingDown/TrendingUp for expenses
- DollarSign for net balance
- PiggyBank for savings rate

**Props:**
- `period?`: Time period ('7days', '30days', '90days', '1year', 'all')
- `onPeriodChange?`: Callback when period changes

### RecentTransactions
Shows the most recent financial transactions.

**Features:**
- List of latest transactions (typically 5-10)
- Transaction type indicators (income/expense)
- Date display
- Amount with color coding
- Category labels
- Account information
- Click to view details
- "View All" link to full transaction list
- Loading skeleton
- Empty state with call-to-action

**Transaction Display:**
- Icon based on category
- Description/merchant name
- Date (relative or absolute)
- Amount (color-coded: green for income, red for expense)
- Category badge
- Account name

**Props:**
- `limit?`: Maximum number of transactions to show (default: 5)
- `onViewAll?`: Callback for "View All" action
- `onTransactionClick?`: Callback when transaction is clicked

### ExpenseBreakdown
Visual breakdown of expenses by category.

**Features:**
- Pie or donut chart visualization
- Category list with amounts
- Percentage calculations
- Top categories highlighting
- Color-coded categories
- Interactive hover effects
- Period selector
- Budget comparison indicators
- Empty state when no expenses

**Display Format:**
- Visual chart (pie/donut)
- List format with:
  - Category name
  - Color indicator
  - Amount spent
  - Percentage of total
  - Progress bar
  - Budget status (if budget exists)

**Props:**
- `period?`: Time period for analysis
- `maxCategories?`: Maximum categories to show (default: 6)
- `showChart?`: Whether to show visual chart (default: true)

### QuickActions
Provides fast access to common operations.

**Features:**
- Add transaction button
- Add budget button
- Create goal button
- View reports button
- Transfer funds button (future)
- Pay bill button (future)
- Icon-based buttons
- Tooltips for clarity
- Keyboard shortcuts support
- Responsive grid layout

**Action Buttons:**
- **Add Transaction**: Opens transaction form modal
- **Create Budget**: Opens budget creation form
- **Set Goal**: Opens goal creation form
- **View Reports**: Navigates to reports section

**Props:**
- `onAddTransaction?`: Callback for add transaction
- `onAddBudget?`: Callback for add budget
- `onAddGoal?`: Callback for add goal
- `onViewReports?`: Callback for view reports

## Usage Examples

### Using Dashboard Components

```tsx
import { 
  SummaryCards, 
  RecentTransactions, 
  ExpenseBreakdown, 
  QuickActions 
} from './slices/dashboard';

function DashboardPage() {
  const [period, setPeriod] = useState('30days');

  return (
    <div className="dashboard">
      {/* Financial Summary */}
      <SummaryCards 
        period={period} 
        onPeriodChange={setPeriod}
      />

      {/* Quick Actions */}
      <QuickActions
        onAddTransaction={handleAddTransaction}
        onAddBudget={handleAddBudget}
        onAddGoal={handleAddGoal}
        onViewReports={handleViewReports}
      />

      {/* Main Content Grid */}
      <div className="grid">
        {/* Recent Activity */}
        <RecentTransactions
          limit={10}
          onViewAll={handleViewAllTransactions}
          onTransactionClick={handleTransactionClick}
        />

        {/* Spending Analysis */}
        <ExpenseBreakdown
          period={period}
          maxCategories={6}
          showChart={true}
        />
      </div>
    </div>
  );
}
```

### Custom Dashboard Layout

```tsx
import { SummaryCards, RecentTransactions } from './slices/dashboard';

// Minimal dashboard for mobile
function MobileDashboard() {
  return (
    <div className="mobile-dashboard">
      <SummaryCards period="30days" />
      <RecentTransactions limit={5} />
    </div>
  );
}

// Executive dashboard with enhanced metrics
function ExecutiveDashboard() {
  return (
    <div className="executive-dashboard">
      <SummaryCards period="1year" />
      {/* Additional executive metrics */}
      <FinancialHealthScore />
      <NetWorthTrend />
      <GoalProgress />
    </div>
  );
}
```

## Integration Points

### With Transaction Slice
- Displays recent transactions
- Shows income and expense totals
- Category breakdown from transactions
- Quick transaction creation

### With Budget Slice
- Budget vs. actual in expense breakdown
- Budget alerts in summary
- Quick budget creation
- Budget status indicators

### With Account Slice
- Account balances in summary
- Account-specific filtering
- Multi-account overview
- Net worth calculation

### With Goals Slice
- Goal progress indicators
- Quick goal creation
- Savings rate calculation
- Goal completion notifications

### With Reports Slice
- Quick navigation to detailed reports
- Summary chart previews
- Data export access

## Data Flow

1. **Dashboard Load**
   ```
   Component Mount → Load State from Context
   → Calculate Summary Metrics → Render Components
   ```

2. **Period Change**
   ```
   User Changes Period → Update State
   → Recalculate Metrics → Re-render Components
   → Update Charts
   ```

3. **Quick Action**
   ```
   User Clicks Action → Open Modal/Navigate
   → Complete Action → Refresh Dashboard
   → Update Relevant Sections
   ```

4. **Real-time Updates**
   ```
   Transaction Added → State Updated
   → Dashboard Re-calculates → Components Re-render
   → Show Updated Totals
   ```

## Layout Structure

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────┐
│           Summary Cards (4 cols)         │
├─────────────────────────────────────────┤
│          Quick Actions (4 buttons)       │
├───────────────────┬─────────────────────┤
│   Recent Trans    │  Expense Breakdown  │
│   (2/3 width)     │    (1/3 width)      │
└───────────────────┴─────────────────────┘
```

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────┐
│      Summary Cards (2 cols × 2 rows)    │
├─────────────────────────────────────────┤
│       Quick Actions (4 buttons)          │
├─────────────────────────────────────────┤
│        Recent Transactions               │
├─────────────────────────────────────────┤
│        Expense Breakdown                 │
└─────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────────┐
│  Summary Cards      │
│  (1 col × 4 rows)   │
├─────────────────────┤
│  Quick Actions      │
│  (2 cols × 2 rows)  │
├─────────────────────┤
│  Recent Trans       │
│  (compact)          │
├─────────────────────┤
│  Top Categories     │
│  (list only)        │
└─────────────────────┘
```

## Visual Design

### Color Scheme
- **Income**: Green shades (#10B981, #059669)
- **Expenses**: Red shades (#EF4444, #DC2626)
- **Net Positive**: Blue shades (#3B82F6, #2563EB)
- **Net Negative**: Red shades (#EF4444, #DC2626)
- **Neutral**: Gray shades (#6B7280, #9CA3AF)

### Card Styling
- White background with shadow
- Rounded corners (border-radius: 0.5rem)
- Padding: 1.5rem
- Hover effects on interactive elements
- Loading skeleton animations

### Icons
- Lucide React icon library
- 24px size for summary cards
- 20px size for list items
- 16px size for small indicators
- Consistent stroke width (2px)

## Performance Considerations

- Dashboard calculations are memoized
- Components use React.memo to prevent unnecessary re-renders
- Lazy loading for charts and visualizations
- Debounced period changes
- Optimized transaction queries (limit results)

## Testing

The slice includes comprehensive test coverage:

- **Component Tests**: Each component has dedicated tests
- **Integration Tests**: Cross-component interactions
- **Snapshot Tests**: Visual regression testing
- **Accessibility Tests**: ARIA and keyboard navigation

### Running Tests

```bash
# Run all tests
npm test

# Run dashboard-specific tests
npm test -- dashboard

# Run with coverage
npm test -- dashboard --coverage
```

## Accessibility

### ARIA Labels
- Summary cards have descriptive labels
- Interactive elements have aria-labels
- Charts have text alternatives
- Loading states announced to screen readers

### Keyboard Navigation
- Tab order follows visual flow
- Quick actions keyboard accessible
- Enter/Space to activate buttons
- Escape to close modals

### Screen Reader Support
- Meaningful element descriptions
- State changes announced
- Error messages clearly communicated
- Loading states indicated

## Best Practices

1. **Regular Review**: Check dashboard daily or weekly
2. **Period Selection**: Use appropriate period for insights
3. **Quick Actions**: Leverage for speed
4. **Trend Monitoring**: Watch for unusual patterns
5. **Budget Awareness**: Note budget alerts
6. **Goal Tracking**: Monitor progress regularly

## Common Patterns

### Dashboard Refresh
```typescript
// Manually refresh dashboard data
const refreshDashboard = () => {
  // Trigger data reload
  dispatch({ type: 'REFRESH_DASHBOARD' });
};

// Auto-refresh every 5 minutes
useEffect(() => {
  const interval = setInterval(refreshDashboard, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### Custom Period Selection
```typescript
// Add custom date range picker
const [customRange, setCustomRange] = useState<DateRange | null>(null);

if (customRange) {
  // Calculate metrics for custom range
  const metrics = calculateMetrics(customRange);
}
```

### Dashboard Widgets
```typescript
// Create reusable dashboard widget
function DashboardWidget({ title, children, actions }) {
  return (
    <div className="widget">
      <div className="widget-header">
        <h3>{title}</h3>
        {actions}
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
}
```

## Error Handling

Dashboard handles various error states:

- **No Data**: Empty state with call-to-action
- **Loading**: Skeleton screens
- **Calculation Errors**: Graceful fallbacks
- **Network Issues**: Retry mechanisms (if using API)

## Empty States

### No Transactions
```
┌─────────────────────────────────┐
│  📊 No transactions yet          │
│                                  │
│  Get started by adding your     │
│  first transaction              │
│                                  │
│  [Add Transaction]              │
└─────────────────────────────────┘
```

### No Budgets
```
┌─────────────────────────────────┐
│  🎯 No budgets set               │
│                                  │
│  Create a budget to track your  │
│  spending goals                 │
│                                  │
│  [Create Budget]                │
└─────────────────────────────────┘
```

## Loading States

- Summary cards show skeleton loaders
- Transaction list shows shimmer effect
- Charts display loading spinner
- Progressive loading for large datasets

## Future Enhancements

- [ ] Customizable dashboard layouts
- [ ] Widget drag-and-drop reordering
- [ ] Additional widget types (goals, bills, etc.)
- [ ] Dashboard themes and color schemes
- [ ] Financial health score widget
- [ ] Upcoming bills reminder
- [ ] Budget alerts widget
- [ ] Goal milestone celebrations
- [ ] Recent activity timeline
- [ ] Spending insights and tips
- [ ] Comparative analytics (vs. last period)
- [ ] Dashboard templates (student, family, business)
- [ ] Export dashboard as PDF/image
- [ ] Dashboard sharing (family members)
- [ ] Notification center

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- Chart.js for visualizations (via ExpenseBreakdown)
- Transaction, Budget, Account, Goal slices for data
- Shared utilities (formatting, date handling)
- Global state management (Context API)
- Tailwind CSS for styling

## API Reference

See inline JSDoc comments in component source files for detailed API documentation.

## Related Documentation

- [Transaction Slice](../transaction/README.md) - Transaction management
- [Budget Slice](../budget/README.md) - Budget tracking
- [Reports Slice](../reports/README.md) - Detailed analytics
- [Goals Slice](../goals/README.md) - Financial goals
- [Accounts Slice](../accounts/README.md) - Account management
