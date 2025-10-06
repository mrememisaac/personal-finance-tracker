# Transaction Slice

## Overview

The Transaction slice is the core feature of the Personal Finance Tracker, responsible for managing all financial transactions including income and expenses. This slice implements the complete lifecycle of transaction management from creation to deletion, including filtering, searching, and data export capabilities.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern, containing all layers needed for transaction management:

```
transaction/
├── Transaction.ts              # Domain model with business logic
├── TransactionService.ts       # Service layer for transaction operations
├── components/                 # UI components
│   ├── TransactionForm.tsx
│   ├── TransactionFormContainer.tsx
│   ├── TransactionList.tsx
│   ├── TransactionListContainer.tsx
│   ├── TransactionListDemo.tsx
│   └── index.ts
├── services/                   # Additional service utilities
├── Transaction.test.ts         # Model tests
└── index.ts                    # Public API exports
```

## Components

### Transaction (Model)

The `Transaction` class represents a financial transaction with comprehensive data and computed properties.

**Key Properties:**
- `id`: Unique identifier
- `date`: Transaction date
- `amount`: Monetary value (positive for income, negative for expense)
- `description`: Transaction description
- `category`: Category classification
- `accountId`: Associated account identifier
- `type`: Transaction type ('income' or 'expense')
- `tags`: Optional tags for additional categorization
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Computed Properties:**
- `isIncome`: Boolean indicating if transaction is income
- `isExpense`: Boolean indicating if transaction is expense
- `formattedAmount`: Currency-formatted amount with sign prefix
- `formattedDate`: Human-readable date format

**Validation Methods:**
- `validate()`: Validates transaction data integrity
- Returns `ValidationResult` with any errors

### TransactionService

Service class managing all transaction-related operations and business logic.

**Core Methods:**

#### Transaction Management
- `addTransaction(transaction)`: Creates a new transaction
  - Generates unique ID
  - Sets timestamps
  - Updates account balance
  - Triggers budget progress updates for expenses
  
- `updateTransaction(id, updates)`: Modifies existing transaction
  - Handles account balance adjustments
  - Updates budget progress if category changed
  - Maintains data integrity
  
- `deleteTransaction(id)`: Removes a transaction
  - Reverts account balance changes
  - Updates budget progress

#### Query Methods
- `getTransactions(filters?)`: Retrieves filtered transactions
- `getTransactionsByCategory()`: Groups transactions by category
- `getTransactionsByDateRange(start, end)`: Date-range queries
- `getRecentTransactions(limit)`: Latest transactions

#### Calculation Methods
- `calculateTotalIncome(transactions?)`: Sums all income
- `calculateTotalExpenses(transactions?)`: Sums all expenses
- `calculateNetBalance(transactions?)`: Net income minus expenses
- `getCategoryTotals(transactions?)`: Spending by category

#### Data Export
- `exportTransactions(format)`: Exports data in CSV or JSON format

## UI Components

### TransactionForm
Modal form component for creating and editing transactions.

**Features:**
- Form validation with real-time feedback
- Date picker integration
- Category selection
- Account selection dropdown
- Type toggle (income/expense)
- Tag management
- Accessibility support

**Props:**
- `transaction?`: Optional transaction for editing mode
- `onSubmit`: Callback with transaction data
- `onCancel`: Cancel callback

### TransactionList
Paginated list component displaying transactions with filtering and sorting.

**Features:**
- Responsive table layout
- Sort by date, amount, category
- Filter by type, category, date range
- Search by description
- Pagination controls
- Quick actions (edit, delete)
- Empty state handling
- Loading states

**Props:**
- `transactions`: Array of transactions to display
- `onEdit`: Edit transaction callback
- `onDelete`: Delete transaction callback
- `loading?`: Loading state indicator

### TransactionFormContainer
Container component connecting TransactionForm to application state.

### TransactionListContainer
Container component managing TransactionList state and interactions.

### TransactionListDemo
Standalone demo component showcasing transaction list functionality.

## Usage Examples

### Creating a Transaction

```typescript
import { TransactionService } from './slices/transaction';

const service = new TransactionService(state, dispatch);

const newTransaction = service.addTransaction({
  date: new Date(),
  amount: 100,
  description: 'Grocery shopping',
  category: 'Food',
  accountId: 'account-123',
  type: 'expense',
  tags: ['groceries', 'weekly']
});
```

### Querying Transactions

```typescript
// Get all transactions
const allTransactions = service.getTransactions();

// Filter by type
const expenses = service.getTransactions({ type: 'expense' });

// Filter by date range
const lastMonthTransactions = service.getTransactionsByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Get transactions by category
const categoryMap = service.getTransactionsByCategory();
const foodTransactions = categoryMap.get('Food');
```

### Calculating Totals

```typescript
// Calculate totals for all transactions
const totalIncome = service.calculateTotalIncome();
const totalExpenses = service.calculateTotalExpenses();
const netBalance = service.calculateNetBalance();

// Calculate for specific transactions
const filteredTransactions = service.getTransactions({ type: 'expense' });
const expenseTotal = service.calculateTotalExpenses(filteredTransactions);
```

### Exporting Data

```typescript
// Export as CSV
const csvData = service.exportTransactions('csv');

// Export as JSON
const jsonData = service.exportTransactions('json');
```

### Using Components

```tsx
import { TransactionForm, TransactionList } from './slices/transaction';

// Transaction form
<TransactionForm
  transaction={selectedTransaction}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// Transaction list
<TransactionList
  transactions={transactions}
  onEdit={handleEdit}
  onDelete={handleDelete}
  loading={isLoading}
/>
```

## Integration Points

### With Budget Slice
- Expense transactions trigger budget progress updates
- Category-based budget tracking
- Budget alerts on transaction creation

### With Account Slice
- Account balance updates on transaction changes
- Multi-account transaction support
- Account-specific transaction queries

### With Reports Slice
- Data source for spending reports
- Income vs expense analytics
- Category breakdown visualizations
- Trend analysis over time

### With Dashboard Slice
- Recent transaction display
- Quick transaction summaries
- Financial overview calculations

## Data Flow

1. **Transaction Creation**
   ```
   User Input → TransactionForm → TransactionService.addTransaction()
   → Dispatch ADD_TRANSACTION → Update State
   → Update Account Balance → Update Budget Progress
   ```

2. **Transaction Update**
   ```
   Edit Action → TransactionForm → TransactionService.updateTransaction()
   → Dispatch UPDATE_TRANSACTION → Update State
   → Adjust Account Balance → Refresh Budget
   ```

3. **Transaction Deletion**
   ```
   Delete Action → Confirm → TransactionService.deleteTransaction()
   → Dispatch DELETE_TRANSACTION → Update State
   → Revert Account Balance → Update Budget
   ```

## Testing

The slice includes comprehensive test coverage:

- **Model Tests** (`Transaction.test.ts`): Domain logic validation
- **Component Tests**: UI behavior and rendering
- **Service Tests**: Business logic and data operations
- **Integration Tests**: Cross-slice interactions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run transaction-specific tests
npm test -- transaction
```

## Validation Rules

Transactions must satisfy the following constraints:

- **Amount**: Must be a positive number greater than 0
- **Date**: Cannot be in the future (optional constraint)
- **Description**: Required, minimum 3 characters
- **Category**: Must be from predefined category list
- **Account ID**: Must reference an existing account
- **Type**: Must be either 'income' or 'expense'

## Error Handling

The service implements comprehensive error handling:

- Invalid transaction data returns validation errors
- Non-existent transaction IDs return null
- Failed updates rollback changes
- Account balance conflicts are logged and handled

## Performance Considerations

- Transactions are sorted and filtered in memory (suitable for <10,000 records)
- Large datasets may benefit from virtual scrolling in the list component
- Export operations are synchronous and may block for large datasets
- Consider implementing pagination for API endpoints in production

## Future Enhancements

- [ ] Recurring transaction support
- [ ] Transaction templates
- [ ] Bulk import from CSV/Excel
- [ ] Attachment support (receipts, invoices)
- [ ] Advanced search with multiple criteria
- [ ] Transaction categories customization
- [ ] Multi-currency support
- [ ] Split transactions
- [ ] Transaction rules and automation

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- Shared utilities (formatting, validation)
- Global state management (Context API)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
