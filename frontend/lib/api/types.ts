export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  nameKh: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  totalUnpaid: number;
  createdAt: string;
}


export interface Product {
  id: string;
  sku: string;
  name: string;
  nameKh: string | null;
  description: string | null;
  imageUrl: string | null;
  category: Category | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
}

export interface SaleLineItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateTransactionRequest {
  items: SaleLineItemRequest[];
  paymentMethod: "CASH" | "QR_CODE";
  paymentStatus: "PAID" | "UNPAID";
  customerId?: string | null;
}

export interface TransactionItemResponse {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  profit: number;
}

export interface TransactionResponse {
  id: string;
  cashierId: string;
  totalAmount: number;
  transactionDate: string;
  items: TransactionItemResponse[];
  paymentMethod: "CASH" | "QR_CODE";
  paymentStatus: "PAID" | "UNPAID";
  customerId?: string | null;
  customerName?: string | null;
}

export interface UnpaidAnalyticsResponse {
  unpaidTransactionsCount: number;
  unpaidProductsCount: number;
  totalUnpaidAmount: number;
}

export interface DashboardMetricsResponse {
  todayRevenue: number;
  thisMonthRevenue: number;
  thisYearRevenue: number;

  todayExpense: number;
  thisMonthExpense: number;
  thisYearExpense: number;

  todayPurchases: number;
  thisMonthPurchases: number;
  thisYearPurchases: number;

  todayProfit: number;
  thisMonthProfit: number;
  thisYearProfit: number;

  totalProducts: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
  totalInventoryValue: number;

  totalCustomers: number;
  newCustomersThisMonth: number;

  totalSuppliers: number;

  todayTransactionsCount: number;
  thisMonthTransactionsCount: number;
  thisYearTransactionsCount: number;

  totalUnpaidSales: number;
  totalUnpaidPurchases: number;

  recentTransactions: TransactionResponse[];
}

export interface User {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  createAt: string;
}

export interface CreateUserPayload {
  username: string;
  password?: string;
  role: Role;
}

export interface UpdateUserPayload {
  password?: string;
  role: Role;
  active?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: Supplier;
  status: "PENDING" | "RECEIVED" | "CANCELLED";
  totalAmount: number;
  notes: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  createdBy: string | null;
}

export interface CreatePurchaseOrderItemPayload {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  notes?: string | null;
  items: CreatePurchaseOrderItemPayload[];
}

export type ExpenseCategory = "UTILITIES" | "RENT" | "PAYROLL" | "MAINTENANCE" | "SUPPLIES" | "MARKETING" | "OTHER";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  createdAt: string;
  loggedBy: string | null;
}

export interface CreateExpensePayload {
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
  path: string;
}
