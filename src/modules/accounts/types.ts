// accounts module types

export interface AccountsItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountsDTO {
  name: string;
  // Add other fields as needed
}

export interface UpdateAccountsDTO extends Partial<CreateAccountsDTO> {
  id: string;
}

// Response types
export interface AccountsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
