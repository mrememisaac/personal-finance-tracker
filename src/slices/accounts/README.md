# Accounts Slice

## Overview

The Accounts slice manages financial accounts such as checking accounts, savings accounts, credit cards, and cash. It tracks account balances, handles multi-account transactions, and provides account-specific analytics.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
accounts/
├── Account.ts                  # Domain model with business logic
├── AccountService.ts          # Service layer for account operations
├── components/                # UI components
│   ├── AccountForm.tsx
│   ├── AccountFormContainer.tsx
│   ├── AccountList.tsx
│   ├── AccountListContainer.tsx
│   ├── __tests__/
│   └── index.ts
├── services/                  # Additional service utilities
├── Account.test.ts           # Model tests
└── index.ts                  # Public API exports
```

## Components

### Account (Model)

The `Account` class represents a financial account.

**Key Properties:**
- `id`: Unique identifier
- `name`: Account display name
- `type`: Account type ('checking', 'savings', 'credit', 'cash', 'investment')
- `balance`: Current account balance
- `initialBalance`: Starting balance when account was created
- `currency`: Currency code (default: 'USD')
- `institution`: Optional financial institution name
- `accountNumber`: Optional masked account number
- `isActive`: Whether account is currently active
- `color`: Optional color for visual identification
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Computed Properties:**
- `formattedBalance`: Currency-formatted balance
- `totalChange`: Change from initial balance
- `totalChangePercentage`: Percentage change from initial balance
- `isPositive`: Boolean indicating positive balance
- `displayName`: Formatted display name with institution

**Methods:**
- `validate()`: Validates account data integrity
- `canWithdraw(amount)`: Checks if withdrawal is possible

### AccountService

Service class managing all account-related operations.

**Core Methods:**

#### Account Management
- `createAccount(account)`: Creates a new account
  - Validates account data
  - Generates unique ID
  - Sets initial balance
  - Sets timestamps
  
- `updateAccount(id, updates)`: Modifies existing account
  - Validates updates
  - Prevents balance manipulation (use transactions instead)
  - Updates timestamps
  
- `deleteAccount(id)`: Soft-deletes an account
  - Sets isActive to false
  - Prevents deletion if balance is non-zero
  - Prevents deletion if associated transactions exist
  
- `getAccounts()`: Retrieves all active accounts
  - Sorted by type then name

- `getAccountById(id)`: Finds specific account

- `getAccountsByType(type)`: Filters accounts by type

#### Balance Management
- `updateAccountBalance(accountId, amount)`: Updates balance
  - Called automatically by transaction service
  - Maintains balance integrity
  - Logs balance changes
  
- `transferBetweenAccounts(fromId, toId, amount)`: Transfers between accounts
  - Creates matching transactions
  - Updates both account balances
  - Validates sufficient funds

- `getTotalBalance(accountIds?)`: Calculates total across accounts
  - Optionally filtered by account IDs
  - Useful for net worth calculation

#### Account Analytics
- `getAccountHistory(accountId, dateRange)`: Gets balance history
  - Returns array of balance snapshots over time
  
- `calculateAccountGrowth(accountId, period)`: Growth calculation
  - Returns growth amount and percentage

- `getAccountTransactions(accountId, filters?)`: Account-specific transactions
  - Filtered transaction list for account

## UI Components

### AccountList
Component displaying all accounts with balances and quick actions.

**Features:**
- Card-based layout with color coding
- Balance display with change indicators
- Account type icons
- Quick actions (edit, view details, delete)
- Total net worth calculation
- Filter by account type
- Sort by balance, name, or type
- Empty state handling

**Props:**
- `accounts`: Array of accounts to display
- `onEdit`: Edit account callback
- `onDelete`: Delete account callback
- `onSelect`: Account selection callback

### AccountForm
Modal form for creating and editing accounts.

**Features:**
- Account name input
- Type selection (checking, savings, credit, cash, investment)
- Initial balance input
- Institution name (optional)
- Account number (optional, masked)
- Color picker for visual identification
- Currency selection
- Form validation
- Error messaging

**Props:**
- `account?`: Optional account for editing mode
- `onSubmit`: Callback with account data
- `onCancel`: Cancel callback

### AccountFormContainer
Container component connecting AccountForm to application state.

### AccountListContainer
Container component managing AccountList state and interactions.

## Usage Examples

### Creating an Account

```typescript
import { AccountService } from './slices/accounts';

const service = new AccountService(state, dispatch);

const newAccount = service.createAccount({
  name: 'Main Checking',
  type: 'checking',
  balance: 5000,
  initialBalance: 5000,
  currency: 'USD',
  institution: 'First National Bank',
  accountNumber: '****1234',
  color: '#3B82F6',
  isActive: true
});
```

### Checking Account Balance

```typescript
// Get specific account
const account = service.getAccountById('account-123');
console.log(`Balance: ${account?.formattedBalance}`);

// Get all accounts
const accounts = service.getAccounts();
accounts.forEach(acc => {
  console.log(`${acc.name}: ${acc.formattedBalance}`);
});

// Calculate total balance
const totalBalance = service.getTotalBalance();
console.log(`Net Worth: $${totalBalance}`);
```

### Transferring Between Accounts

```typescript
// Transfer $500 from checking to savings
await service.transferBetweenAccounts(
  'checking-id',
  'savings-id',
  500
);
```

### Account Analytics

```typescript
// Get account transaction history
const transactions = service.getAccountTransactions('account-123', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Calculate account growth
const growth = service.calculateAccountGrowth('account-123', '30days');
console.log(`Growth: $${growth.amount} (${growth.percentage}%)`);

// Get balance history
const history = service.getAccountHistory('account-123', {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
```

### Using Components

```tsx
import { AccountList, AccountForm } from './slices/accounts';

// Account list
<AccountList
  accounts={accounts}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onSelect={handleSelect}
/>

// Account form
<AccountForm
  account={selectedAccount}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

## Integration Points

### With Transaction Slice
- Every transaction is associated with an account
- Transactions automatically update account balances
- Account validation on transaction creation
- Transfer transactions affect two accounts

### With Budget Slice
- Budgets can be account-specific
- Account balance affects budget planning
- Account types influence budget categories

### With Dashboard Slice
- Account balances displayed in summary
- Account distribution visualization
- Quick account overview cards

### With Reports Slice
- Account-specific financial reports
- Balance history charts
- Account performance comparisons
- Net worth tracking over time

### With Goals Slice
- Goals can be tied to specific accounts
- Goal contributions tracked by account
- Account selection for goal funding

## Data Flow

1. **Account Creation**
   ```
   User Input → AccountForm → AccountService.createAccount()
   → Validate → Dispatch ADD_ACCOUNT → Update State
   ```

2. **Balance Update (via Transaction)**
   ```
   Transaction Created → TransactionService
   → AccountService.updateAccountBalance() → Update Balance
   → Dispatch UPDATE_ACCOUNT → Update State
   ```

3. **Account Transfer**
   ```
   Transfer Request → AccountService.transferBetweenAccounts()
   → Validate Sufficient Funds → Create Transfer Transactions
   → Update Both Balances → Update State
   ```

4. **Account Deletion**
   ```
   Delete Request → Check for Transactions/Balance
   → Soft Delete (isActive = false) → Update State
   → Prevent if Active Transactions
   ```

## Account Types

### Checking Account
- Primary spending account
- Typically highest transaction volume
- Daily balance tracking

### Savings Account
- Goal-oriented savings
- Lower transaction frequency
- Interest tracking (future)

### Credit Card
- Negative balance represents debt
- Payment tracking
- Credit limit monitoring (future)

### Cash
- Physical cash tracking
- Simple balance management
- No institution association

### Investment
- Investment portfolio tracking
- Market value updates (future)
- Returns calculation (future)

## Validation Rules

Accounts must satisfy the following constraints:

- **Name**: Required, minimum 2 characters, unique
- **Type**: Must be one of the valid account types
- **Balance**: Can be negative for credit accounts
- **Initial Balance**: Required when creating account
- **Currency**: Must be valid currency code
- **Account Number**: Optional, validated format if provided

## Testing

The slice includes comprehensive test coverage:

- **Model Tests** (`Account.test.ts`): Domain logic validation
- **Component Tests**: UI behavior and rendering
- **Service Tests**: Business logic and operations
- **Integration Tests**: Transaction-account interactions

### Running Tests

```bash
# Run all tests
npm test

# Run account-specific tests
npm test -- accounts
```

## Security Considerations

- Account numbers are masked in the UI
- Sensitive data encrypted in storage
- Balance modifications only via transactions
- Account deletion requires confirmation
- Access control for account management

## Performance Considerations

- Account list cached and updated incrementally
- Balance calculations optimized
- Transaction queries indexed by account
- Lazy loading for account history

## Best Practices

1. **Account Organization**: Use clear, descriptive account names
2. **Regular Reconciliation**: Match with bank statements regularly
3. **Account Types**: Choose appropriate type for each account
4. **Initial Balance**: Set accurate starting balance
5. **Active Status**: Deactivate instead of deleting accounts
6. **Color Coding**: Use colors consistently across account types

## Common Patterns

### Account Reconciliation
```typescript
// Compare actual vs. tracked balance
const account = service.getAccountById('account-123');
const actualBalance = 5234.50; // From bank statement

if (Math.abs(account.balance - actualBalance) > 0.01) {
  console.log('Reconciliation needed');
  // Create adjustment transaction
}
```

### Net Worth Calculation
```typescript
// Calculate total net worth across all accounts
const checkingAccounts = service.getAccountsByType('checking');
const savingsAccounts = service.getAccountsByType('savings');
const creditCards = service.getAccountsByType('credit');

const assets = service.getTotalBalance([
  ...checkingAccounts.map(a => a.id),
  ...savingsAccounts.map(a => a.id)
]);

const liabilities = service.getTotalBalance(
  creditCards.map(a => a.id)
);

const netWorth = assets + liabilities; // Credit card balances are negative
```

### Account Archival
```typescript
// Archive old account while preserving history
const account = service.getAccountById('old-account-id');
if (account && account.balance === 0) {
  service.updateAccount(account.id, { isActive: false });
}
```

## Error Handling

The service implements comprehensive error handling:

- Invalid account data returns validation errors
- Non-existent account IDs return null
- Insufficient funds prevented for withdrawals
- Deletion of active accounts prevented
- Balance integrity maintained

## Future Enhancements

- [ ] Multi-currency support with exchange rates
- [ ] Account interest calculation
- [ ] Credit card limits and utilization tracking
- [ ] Investment account integration
- [ ] Automated account reconciliation
- [ ] Account sharing for joint accounts
- [ ] Account statements generation
- [ ] Balance prediction and forecasting
- [ ] Account linking with financial institutions (Plaid integration)
- [ ] Scheduled transfers
- [ ] Account categories and grouping

## Dependencies

- React 18+ for UI components
- Lucide React for icons
- Transaction slice for balance updates
- Shared utilities (formatting, validation)
- Global state management (Context API)

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
