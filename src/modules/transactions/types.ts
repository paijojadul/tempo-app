// transactions module types

export interface TransactionsItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionsDTO {
  name: string;
  // Add other fields as needed
}
