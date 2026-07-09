export type Translations = {
  // Navigation
  dashboard: string;
  inventory: string;
  pos: string;
  sales: string;
  customers: string;
  suppliers: string;
  purchases: string;
  expenses: string;
  staff: string;
  settings: string;
  logout: string;

  // Dashboard
  dashboardOverview: string;
  dashboardSub: string;
  todaysSales: string;
  transactionsToday: string;
  totalCustomers: string;
  lowStockAlerts: string;
  outstandingDebts: string;
  unpaidAccounts: string;
  totalUnpaid: string;
  recentTransactions: string;
  latestSales: string;
  noRecentTransactions: string;
  walkInCustomer: string;
  
  today: string;
  thisMonth: string;
  thisYear: string;
  revenue: string;
  profit: string;
  inventoryValue: string;
  purchasesCogs: string;
  newCustomers: string;
  unpaidPurchases: string;
  totalProductsLabel: string;

  // Customers
  customersOverview: string;
  customersSub: string;
  addCustomer: string;
  customerName: string;
  phone: string;
  address: string;
  orders: string;
  totalSpent: string;
  noCustomersYet: string;
  searchCustomers: string;

  // Expenses
  expensesOverview: string;
  expensesSub: string;
  logExpense: string;
  amount: string;
  date: string;
  noExpensesYet: string;

  // Purchases
  purchasesOverview: string;
  purchasesSub: string;
  newPo: string;
  poNumber: string;
  supplier: string;
  status: string;

  // Suppliers
  suppliersOverview: string;
  suppliersSub: string;
  addSupplier: string;
  contactName: string;
  email: string;

  // Staff
  staffOverview: string;
  staffSub: string;
  addUser: string;
  role: string;
  admin: string;
  manager: string;

  // Sales
  salesHistory: string;
  salesHistorySub: string;
  paymentMethod: string;
  paymentStatus: string;
  dateAndTime: string;

  // Common POS / Inventory
  pointOfSale: string;
  searchPlaceholder: string;
  allItems: string;
  currentSale: string;
  clearAll: string;
  checkout: string;
  items: string;
  totalAmount: string;
  cartEmptyTitle: string;
  cartEmptySub: string;
  soldOut: string;
  inStock: string;
  noProductsFound: string;
  noProductsSub: string;
  
  completePayment: string;
  amountDue: string;
  cashReceived: string;
  changeDue: string;
  cancel: string;
  confirmPayment: string;
  processing: string;

  addProduct: string;
  editProduct: string;
  productsAndCategories: (p: number, c: number) => string;
  searchInventory: string;
  allCategories: string;
  sku: string;
  productNameEn: string;
  productNameKh: string;
  category: string;
  description: string;
  sellingPrice: string;
  costPrice: string;
  stockQuantity: string;
  productImage: string;
  saveChanges: string;
  createProduct: string;
  delete: string;
  deleteProduct: string;
  deleteConfirmMsg: string;
  edit: string;
  noResults: string;
  noProductsYet: string;

  image: string;
  product: string;
  price: string;
  cost: string;
  margin: string;
  stock: string;
  actions: string;

  loginToYourAccount: string;
  username: string;
  password: string;
  signIn: string;
  signingIn: string;

  createNewCustomer: string;
  nameStar: string;
  walkInGuest: string;
  existingCustomer: string;
  searchByNamePhone: string;
  selectCustomer: string;
  plusCreateNewCustomer: string;
  paid: string;
  unpaidCredit: string;
  cash: string;
  qrCodeBank: string;
  pleaseSelectExisting: string;

  searchSales: string;
  receiptId: string;
  payment: string;
};
