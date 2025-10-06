# Budget Slice

## Overview

The Budget slice manages financial budgets, allowing users to set spending limits for different categories and track their progress. It provides real-time budget monitoring, alerts for overspending, and comprehensive budget management capabilities.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
budget/
├── Budget.ts                   # Domain model with business logic
├── BudgetService.ts           # Service layer for budget operations
├── components/                # UI components
│   ├── BudgetAlerts.tsx
│   ├── BudgetAlertsContainer.tsx
│   ├── BudgetForm.tsx
│   ├── BudgetFormContainer.tsx
│   ├── BudgetOverview.tsx
│   ├── BudgetOverviewContainer.tsx
│   ├── BudgetOverviewSimple.tsx
│   ├── __tests__/
│   └── index.ts
├── services/                  # Additional service utilities
├── Budget.test.ts            # Model tests
└── index.ts                  # Public API exports
```

## Components

### Budget (Model)

The `Budget` class represents a spending limit for a specific category.

**Key Properties:**
- `id`: Unique identifier
- `category`: Category name this budget applies to
- `limit`: Maximum allowed spending amount
- `period`: Budget period ('weekly' or 'monthly')
- `startDate`: Period start date
- `spent`: Current spending in this period (calculated)
- `isActive`: Whether budget is currently active
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Computed Properties:**
- `remaining`: Amount remaining in budget (limit - spent)
- `percentage`: Spending as percentage of limit
- `isOverBudget`: Boolean indicating if spending exceeds limit
- `status`: Budget health status ('safe', 'warning', or 'danger')
  - 'safe': Under 75% of limit
  - 'warning': Between 75% and 100% of limit
  - 'danger': Over 100% of limit

**Methods:**
- `calculateSpent(transactions)`: Calculates total spending from transactions
- `validate()`: Validates budget data integrity

### BudgetService

Service class managing all budget-related operations and calculations.

**Core Methods:**

#### Budget Management
- `createBudget(budget)`: Creates a new budget
  - Validates budget data
  - Generates unique ID
  - Sets timestamps
  - Ensures no duplicate category budgets
  
- `updateBudget(id, updates)`: Modifies existing budget
  - Validates updates
  - Updates timestamps
  - Recalculates spending if period changed
  
- `deleteBudget(id)`: Removes a budget
  - Soft delete by setting isActive to false
  
- `getBudgets()`: Retrieves all active budgets sorted by category

- `getBudgetByCategory(category)`: Finds budget for specific category

#### Budget Progress
- `calculateBudgetProgress(budgetId)`: Calculates current progress
  - Returns spent amount, remaining, and percentage
  
- `updateBudgetProgress(category)`: Updates spending after transaction
  - Automatically called when expense transactions are created
  
- `getSpentByCategory(category, dateRange)`: Calculates category spending

#### Budget Alerts
- `checkBudgetAlerts()`: Checks all budgets and returns alerts
  - Returns array of `BudgetAlert` objects
  - Triggered when spending reaches thresholds (75%, 100%, 125%)
  
- `getBudgetStatus(budgetId)`: Gets current status of a budget

#### Period Management
- `resetBudgetsForNewPeriod()`: Resets budgets at period boundaries
  - Called automatically based on period type
  - Creates new period tracking

## UI Components

### BudgetOverview
Main component displaying all budgets with progress visualization.

**Features:**
- Visual progress bars with color coding
- Percentage indicators
- Spent vs. limit display
- Category grouping
- Status indicators (safe/warning/danger)
- Quick edit and delete actions
- Responsive grid layout

**Props:**
- `budgets`: Array of budgets to display
- `onEdit`: Edit budget callback
- `onDelete`: Delete budget callback

### BudgetForm
Modal form for creating and editing budgets.

**Features:**
- Category selection
- Amount input with validation
- Period selection (weekly/monthly)
- Start date picker
- Form validation
- Error messaging
- Accessibility support

**Props:**
- `budget?`: Optional budget for editing mode
- `onSubmit`: Callback with budget data
- `onCancel`: Cancel callback

### BudgetAlerts
Component displaying budget warnings and notifications.

**Features:**
- Real-time alert display
- Color-coded severity (warning/danger)
- Dismissible alerts
- Alert history
- Notification sound (optional)

**Props:**
- `alerts`: Array of budget alerts
- `onDismiss`: Dismiss alert callback

### BudgetOverviewSimple
Simplified budget overview for dashboard integration.

**Features:**
- Compact display format
- Most important budgets only
- Quick status overview

### BudgetFormContainer
Container component connecting BudgetForm to application state.

### BudgetAlertsContainer
Container component managing BudgetAlerts state and interactions.

### BudgetOverviewContainer
Container component managing BudgetOverview state and interactions.

## Usage Examples

### Creating a Budget

```typescript
import { BudgetService } from './slices/budget';

const service = new BudgetService(state, dispatch);

const newBudget = service.createBudget({
  category: 'Food',
  limit: 500,
  period: 'monthly',
  startDate: new Date('2024-01-01'),
  isActive: true
});
```

### Checking Budget Status

```typescript
// Get all budgets
const budgets = service.getBudgets();

// Check specific category budget
const foodBudget = service.getBudgetByCategory('Food');

if (foodBudget) {
  console.log(`Spent: ${foodBudget.spent}`);
  console.log(`Remaining: ${foodBudget.remaining}`);
  console.log(`Status: ${foodBudget.status}`);
  console.log(`Over budget: ${foodBudget.isOverBudget}`);
}
```

### Budget Alerts

```typescript
// Check for budget alerts
const alerts = service.checkBudgetAlerts();

alerts.forEach(alert => {
  console.log(`Alert: ${alert.category}`);
  console.log(`Type: ${alert.type}`);
  console.log(`Message: ${alert.message}`);
  console.log(`Percentage: ${alert.percentage}%`);
});
```

### Calculating Progress

```typescript
const progress = service.calculateBudgetProgress('budget-123');

console.log(`Spent: $${progress.spent}`);
console.log(`Remaining: $${progress.remaining}`);
console.log(`Progress: ${progress.percentage}%`);
```

### Using Components

```tsx
import { BudgetOverview, BudgetForm, BudgetAlerts } from './slices/budget';

// Budget overview
<BudgetOverview
  budgets={budgets}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// Budget form
<BudgetForm
  budget={selectedBudget}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// Budget alerts
<BudgetAlerts
  alerts={alerts}
  onDismiss={handleDismiss}
/>
```

## Integration Points

### With Transaction Slice
- Expense transactions automatically update budget progress
- Category-based tracking links transactions to budgets
- Budget validation on transaction creation

### With Dashboard Slice
- Budget status overview in dashboard
- Quick budget health indicators
- Budget alerts prominently displayed

### With Reports Slice
- Budget vs. actual spending comparisons
- Historical budget performance
- Category spending trends

### With Goals Slice
- Budget surplus can be allocated to savings goals
- Budget management supports goal achievement
- Aligned financial planning

## Data Flow

1. **Budget Creation**
   ```
   User Input → BudgetForm → BudgetService.createBudget()
   → Validate → Dispatch ADD_BUDGET → Update State
   ```

2. **Automatic Budget Update**
   ```
   Transaction Created (Expense) → TransactionService
   → BudgetService.updateBudgetProgress() → Recalculate Spent
   → Check Alerts → Update State
   ```

3. **Budget Alert Generation**
   ```
   Budget Progress Update → Calculate Percentage
   → Check Thresholds (75%, 100%, 125%)
   → Generate Alert → Display to User
   ```

4. **Period Reset**
   ```
   New Period Detected → BudgetService.resetBudgetsForNewPeriod()
   → Reset Spent Amounts → Maintain Budget Limits
   → Update Start Dates
   ```

## Alert Thresholds

Budget alerts are triggered at specific thresholds:

- **75% Warning**: Yellow alert when spending reaches 75% of limit
- **100% Danger**: Red alert when spending reaches or exceeds limit
- **125% Critical**: Critical alert when spending exceeds limit by 25%

## Validation Rules

Budgets must satisfy the following constraints:

- **Category**: Required, must not be empty
- **Limit**: Must be a positive number greater than 0
- **Period**: Must be 'weekly' or 'monthly'
- **Start Date**: Required, typically start of period
- **Uniqueness**: Only one active budget per category allowed

## Testing

The slice includes comprehensive test coverage:

- **Model Tests** (`Budget.test.ts`): Domain logic validation
- **Component Tests**: UI behavior and rendering
- **Service Tests**: Business logic and calculations
- **Integration Tests**: Transaction-budget interactions

### Running Tests

```bash
# Run all tests
npm test

# Run budget-specific tests
npm test -- budget
```

## Budget Periods

### Weekly Budgets
- Reset every Monday
- Suitable for variable categories (groceries, entertainment)
- More frequent tracking and adjustments

### Monthly Budgets
- Reset on first day of month
- Better for fixed expenses (rent, subscriptions)
- Longer planning horizon

## Performance Considerations

- Budget calculations are performed on-demand
- Spending totals are cached and updated incrementally
- Alert checking is optimized to avoid redundant calculations
- Large transaction histories may impact calculation speed

## Best Practices

1. **Start Conservative**: Begin with realistic or slightly lower limits
2. **Review Regularly**: Weekly review of budget status
3. **Adjust as Needed**: Update limits based on actual spending patterns
4. **Category Granularity**: Use specific categories for better tracking
5. **Period Matching**: Match budget periods to income frequency
6. **Alert Response**: Take action when warnings appear

## Common Patterns

### Budget Rollover
```typescript
// Unused budget can be saved or rolled over
const rolloverAmount = budget.remaining;
if (rolloverAmount > 0) {
  // Allocate to savings goal
  goalService.addContribution(savingsGoalId, rolloverAmount);
}
```

### Budget Adjustment
```typescript
// Adjust budget mid-period
const currentBudget = service.getBudgetByCategory('Entertainment');
if (currentBudget && currentBudget.isOverBudget) {
  // Increase limit temporarily or reduce spending
  service.updateBudget(currentBudget.id, { limit: 600 });
}
```

## Future Enhancements

- [ ] Envelope budgeting system
- [ ] Budget templates
- [ ] Automatic budget suggestions based on history
- [ ] Budget sharing for family accounts
- [ ] Budget goals and milestones
- [ ] Flexible period definitions (bi-weekly, quarterly)
- [ ] Budget categories hierarchy
- [ ] Budget forecasting
- [ ] Smart alerts with recommendations
- [ ] Budget challenges and gamification

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- Transaction slice for spending data
- Shared utilities (formatting, validation, date handling)
- Global state management (Context API)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
