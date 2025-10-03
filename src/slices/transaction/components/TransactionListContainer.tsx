
import { TransactionList } from './TransactionList';

export function TransactionListContainer() {
  // TransactionList handles its own data operations via context
  // No need to pass transactions, accounts, onEdit, onDelete as props

  return <TransactionList />;
}