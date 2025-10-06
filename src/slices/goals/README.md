# Goals Slice

## Overview

The Goals slice manages financial goals and savings targets. It helps users set, track, and achieve financial objectives such as emergency funds, vacation savings, large purchases, or long-term investments. The slice provides progress tracking, milestone celebrations, and intelligent projections.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
goals/
├── Goal.ts                    # Domain model with business logic
├── GoalService.ts            # Service layer for goal operations
├── components/               # UI components
│   ├── GoalForm.tsx
│   ├── GoalProgress.tsx
│   ├── __tests__/
│   └── index.ts
├── services/                 # Additional service utilities
├── Goal.test.ts             # Model tests
└── index.ts                 # Public API exports
```

## Components

### Goal (Model)

The `Goal` class represents a financial savings goal or target.

**Key Properties:**
- `id`: Unique identifier
- `name`: Goal name/description
- `targetAmount`: Amount to save
- `currentAmount`: Current saved amount
- `targetDate`: Goal completion deadline
- `accountId`: Associated account for savings
- `category`: Goal category (emergency, vacation, purchase, etc.)
- `priority`: Goal priority (1-5, where 1 is highest)
- `isCompleted`: Whether goal has been achieved
- `notes`: Optional notes or description
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Computed Properties:**
- `progress`: Percentage of goal completed (0-100)
- `remainingAmount`: Amount still needed
- `daysRemaining`: Days until target date
- `projectedCompletionDate`: Estimated completion based on contribution rate
- `isOnTrack`: Boolean indicating if goal is on pace
- `requiredMonthlyContribution`: Amount needed per month to reach goal
- `recommendedContribution`: Suggested contribution amount

**Methods:**
- `validate()`: Validates goal data integrity
- `addContribution(amount)`: Adds money to goal
- `withdrawContribution(amount)`: Removes money from goal
- `calculateProgress()`: Recalculates progress metrics

### GoalService

Service class managing all goal-related operations and calculations.

**Core Methods:**

#### Goal Management
- `createGoal(goal)`: Creates a new goal
  - Validates goal data
  - Generates unique ID
  - Sets timestamps
  - Calculates initial projections
  
- `updateGoal(id, updates)`: Modifies existing goal
  - Validates updates
  - Recalculates progress
  - Updates projections
  
- `deleteGoal(id)`: Removes a goal
  - Soft delete if contributions exist
  - Hard delete if no contributions
  
- `getGoals(filters?)`: Retrieves goals with optional filtering
  - Filter by status, category, priority
  - Sort by priority, target date, progress

- `getGoalById(id)`: Finds specific goal

- `getActiveGoals()`: Gets all incomplete goals

- `getCompletedGoals()`: Gets all achieved goals

#### Contribution Management
- `addContribution(goalId, amount, accountId)`: Adds money to goal
  - Creates transaction
  - Updates goal progress
  - Checks for goal completion
  - Celebrates milestones
  
- `withdrawContribution(goalId, amount, reason)`: Removes money
  - Creates reversal transaction
  - Updates goal progress
  - Logs withdrawal reason

- `getGoalContributions(goalId)`: Gets contribution history

#### Progress Tracking
- `calculateProgress(goalId)`: Updates progress metrics
  - Current vs. target amount
  - Days remaining
  - Projected completion
  
- `getProgressByPeriod(goalId, period)`: Progress for time period
  - Shows momentum and trends

- `checkMilestones(goalId)`: Checks for milestone achievements
  - 25%, 50%, 75%, 90%, 100% milestones

#### Projections & Recommendations
- `projectCompletion(goalId)`: Estimates completion date
  - Based on historical contribution rate
  - Factors in remaining time
  
- `suggestContribution(goalId)`: Recommends contribution amount
  - Calculates required monthly amount
  - Adjusts for remaining time
  - Considers user's budget

- `analyzeGoalFeasibility(goal)`: Analyzes if goal is achievable
  - Checks against income and expenses
  - Returns feasibility score and recommendations

## UI Components

### GoalForm
Modal form for creating and editing financial goals.

**Features:**
- Goal name input
- Target amount input
- Target date picker
- Category selection
- Priority setting (1-5 stars)
- Account selection
- Notes/description field
- Form validation
- Progress preview (editing mode)

**Props:**
- `goal?`: Optional goal for editing mode
- `onSubmit`: Callback with goal data
- `onCancel`: Cancel callback

### GoalProgress
Component displaying goal progress with visual indicators.

**Features:**
- Progress bar with percentage
- Current vs. target amount display
- Time remaining indicator
- Milestone markers
- Contribution history
- Quick contribute button
- Projected completion date
- On-track status indicator
- Achievement celebrations

**Props:**
- `goal`: Goal to display
- `onContribute`: Contribute callback
- `onEdit`: Edit goal callback
- `showHistory?`: Show contribution history
- `compact?`: Compact display mode

## Usage Examples

### Creating a Goal

```typescript
import { GoalService } from './slices/goals';

const service = new GoalService(state, dispatch);

const newGoal = service.createGoal({
  name: 'Emergency Fund',
  targetAmount: 10000,
  currentAmount: 0,
  targetDate: new Date('2024-12-31'),
  accountId: 'savings-account-id',
  category: 'emergency',
  priority: 1,
  notes: 'Build 6 months of expenses'
});
```

### Adding Contributions

```typescript
// Add $500 to emergency fund goal
service.addContribution('goal-123', 500, 'checking-account-id');

// Check if goal is now complete
const goal = service.getGoalById('goal-123');
if (goal?.isCompleted) {
  console.log('Goal achieved! 🎉');
}
```

### Tracking Progress

```typescript
const goal = service.getGoalById('goal-123');

console.log(`Progress: ${goal.progress}%`);
console.log(`Saved: $${goal.currentAmount} of $${goal.targetAmount}`);
console.log(`Remaining: $${goal.remainingAmount}`);
console.log(`Days left: ${goal.daysRemaining}`);
console.log(`On track: ${goal.isOnTrack ? 'Yes' : 'No'}`);
```

### Getting Recommendations

```typescript
// Get suggested contribution amount
const suggestion = service.suggestContribution('goal-123');
console.log(`Recommended monthly contribution: $${suggestion}`);

// Check goal feasibility
const feasibility = service.analyzeGoalFeasibility(goal);
if (feasibility.score < 0.5) {
  console.log('Warning: Goal may be difficult to achieve');
  console.log('Recommendations:', feasibility.recommendations);
}
```

### Querying Goals

```typescript
// Get all active goals
const activeGoals = service.getActiveGoals();

// Get goals by priority
const highPriorityGoals = service.getGoals({ priority: 1 });

// Get completed goals
const completedGoals = service.getCompletedGoals();

// Get goals by category
const vacationGoals = service.getGoals({ category: 'vacation' });
```

### Using Components

```tsx
import { GoalForm, GoalProgress } from './slices/goals';

// Goal form
<GoalForm
  goal={selectedGoal}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// Goal progress
<GoalProgress
  goal={goal}
  onContribute={handleContribute}
  onEdit={handleEdit}
  showHistory={true}
/>
```

## Integration Points

### With Transaction Slice
- Goal contributions create transactions
- Transaction categorization tracks goal-related expenses
- Goal withdrawals create reversal transactions

### With Account Slice
- Goals are associated with specific accounts
- Account balance affects goal funding
- Transfers between accounts and goals

### With Budget Slice
- Budget surplus can be allocated to goals
- Goal contributions affect budget calculations
- Balanced financial planning

### With Dashboard Slice
- Goal progress displayed in overview
- Active goals summary
- Quick contribution actions

### With Reports Slice
- Goal achievement reports
- Contribution history analysis
- Goal performance over time
- Goal vs. actual progress charts

## Data Flow

1. **Goal Creation**
   ```
   User Input → GoalForm → GoalService.createGoal()
   → Validate → Calculate Projections → Dispatch ADD_GOAL
   → Update State
   ```

2. **Contribution Addition**
   ```
   Contribute Action → GoalService.addContribution()
   → Create Transaction → Update Goal Amount
   → Check Completion → Check Milestones
   → Dispatch UPDATE_GOAL → Celebrate if Complete
   ```

3. **Progress Calculation**
   ```
   Goal Update → Calculate Progress → Calculate Projections
   → Check On-Track Status → Update Recommendations
   ```

4. **Goal Completion**
   ```
   Contribution Reaches Target → Mark as Completed
   → Trigger Celebration → Create Completion Transaction
   → Update Statistics → Notify User
   ```

## Goal Categories

- **Emergency**: Emergency fund, rainy day savings
- **Vacation**: Travel and vacation savings
- **Purchase**: Large purchase planning (car, house, etc.)
- **Education**: Education fund, courses, tuition
- **Retirement**: Retirement savings
- **Debt**: Debt payoff targets
- **Investment**: Investment goals
- **Custom**: User-defined categories

## Milestone Celebrations

Goals celebrate achievements at key milestones:
- **25%**: First quarter milestone
- **50%**: Halfway celebration
- **75%**: Three-quarter milestone
- **90%**: Almost there!
- **100%**: Goal achieved! 🎉

Each milestone can trigger:
- Visual celebration animation
- Notification message
- Progress badge
- Social sharing option (future)

## Validation Rules

Goals must satisfy the following constraints:

- **Name**: Required, minimum 3 characters
- **Target Amount**: Must be positive number > 0
- **Current Amount**: Must be >= 0 and <= target amount
- **Target Date**: Must be in the future (for new goals)
- **Account ID**: Must reference an existing account
- **Priority**: Must be between 1 and 5

## Testing

The slice includes comprehensive test coverage:

- **Model Tests** (`Goal.test.ts`): Domain logic validation
- **Component Tests**: UI behavior and rendering
- **Service Tests**: Business logic and calculations
- **Integration Tests**: Goal-transaction-account interactions

### Running Tests

```bash
# Run all tests
npm test

# Run goal-specific tests
npm test -- goals
```

## Progress Calculation

Progress is calculated using multiple factors:

```typescript
// Basic progress
progress = (currentAmount / targetAmount) * 100

// On-track calculation
expectedAmount = (elapsedDays / totalDays) * targetAmount
onTrack = currentAmount >= expectedAmount

// Projected completion
averageContribution = totalContributions / numberOfMonths
remainingMonths = remainingAmount / averageContribution
projectedDate = currentDate + remainingMonths
```

## Performance Considerations

- Goal calculations cached and updated incrementally
- Projection calculations optimized
- Contribution history paginated for large datasets
- Real-time updates via state management

## Best Practices

1. **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
2. **Priority Setting**: Focus on high-priority goals first
3. **Regular Contributions**: Set up automatic contributions
4. **Realistic Targets**: Set achievable amounts and dates
5. **Track Progress**: Review regularly and adjust as needed
6. **Celebrate Milestones**: Acknowledge achievements
7. **Emergency First**: Prioritize emergency fund before other goals

## Common Patterns

### Automatic Goal Funding
```typescript
// Automatically allocate budget surplus to goals
const budgetSurplus = calculateBudgetSurplus();
if (budgetSurplus > 0) {
  const highPriorityGoal = service.getGoals({ priority: 1 })[0];
  if (highPriorityGoal) {
    service.addContribution(highPriorityGoal.id, budgetSurplus, accountId);
  }
}
```

### Goal Adjustment
```typescript
// Adjust goal based on changed circumstances
const goal = service.getGoalById('goal-123');
const feasibility = service.analyzeGoalFeasibility(goal);

if (feasibility.score < 0.3) {
  // Goal is too aggressive, adjust
  service.updateGoal(goal.id, {
    targetDate: new Date(goal.targetDate.getTime() + 90 * 24 * 60 * 60 * 1000) // Add 90 days
  });
}
```

### Multi-Goal Priority Management
```typescript
// Distribute available savings across multiple goals
const availableAmount = 1000;
const activeGoals = service.getActiveGoals()
  .sort((a, b) => a.priority - b.priority);

let remaining = availableAmount;
for (const goal of activeGoals) {
  if (remaining <= 0) break;
  
  const needed = goal.remainingAmount;
  const contribution = Math.min(needed, remaining * 0.4); // 40% max per goal
  
  service.addContribution(goal.id, contribution, accountId);
  remaining -= contribution;
}
```

## Error Handling

The service implements comprehensive error handling:

- Invalid goal data returns validation errors
- Contribution amounts validated
- Non-existent goal IDs return null
- Insufficient funds prevented
- Date validation for target dates

## Future Enhancements

- [ ] Goal templates for common goals
- [ ] Goal sharing for family/joint goals
- [ ] Automatic contribution scheduling
- [ ] Goal categories customization
- [ ] Sub-goals and goal hierarchy
- [ ] Goal recommendations based on financial situation
- [ ] Integration with investment accounts
- [ ] Goal achievement badges and rewards
- [ ] Social features (share goals, support friends)
- [ ] Financial advisor integration
- [ ] Goal impact simulation
- [ ] Linked goals (complete one to start another)

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- Transaction slice for contributions
- Account slice for funding sources
- Shared utilities (formatting, validation, date handling)
- Global state management (Context API)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
