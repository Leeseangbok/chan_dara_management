import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'lib/i18n');

// 1. translations.ts
const translationsTs = `export type Translations = {
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
};
`;

// 2. en.ts
const enTs = `import { Translations } from "./translations";

export const en: Translations = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  pos: "POS",
  sales: "Sales",
  customers: "Customers",
  suppliers: "Suppliers",
  purchases: "Purchases",
  expenses: "Expenses",
  staff: "Staff",
  settings: "Settings",
  logout: "Logout",

  dashboardOverview: "Dashboard Overview",
  dashboardSub: "Real-time update of your store's performance.",
  todaysSales: "Today's Sales",
  transactionsToday: "Transactions Today",
  totalCustomers: "Total Customers",
  lowStockAlerts: "Low Stock Alerts",
  outstandingDebts: "Outstanding Debts",
  unpaidAccounts: "Unpaid customer accounts",
  totalUnpaid: "Total Unpaid Amount",
  recentTransactions: "Recent Transactions",
  latestSales: "Latest sales across the store",
  noRecentTransactions: "No recent transactions.",
  walkInCustomer: "Walk-in Customer",

  customersOverview: "Customers",
  customersSub: "Manage your customers and view their history.",
  addCustomer: "Add Customer",
  customerName: "Customer Name *",
  phone: "Phone",
  address: "Address",
  orders: "Orders",
  totalSpent: "Total Spent",
  noCustomersYet: "No customers yet.",
  searchCustomers: "Search customers...",

  expensesOverview: "Expenses",
  expensesSub: "Track your store expenses.",
  logExpense: "Log Expense",
  amount: "Amount *",
  date: "Date *",
  noExpensesYet: "No expenses logged.",

  purchasesOverview: "Purchase Orders",
  purchasesSub: "Manage your inventory purchases from suppliers.",
  newPo: "New PO",
  poNumber: "PO Number",
  supplier: "Supplier",
  status: "Status",

  suppliersOverview: "Suppliers",
  suppliersSub: "Manage your suppliers and contacts.",
  addSupplier: "Add Supplier",
  contactName: "Contact Name",
  email: "Email",

  staffOverview: "Staff Management",
  staffSub: "Manage staff accounts and roles.",
  addUser: "Add User",
  role: "Role",
  admin: "Admin",
  manager: "Manager",

  salesHistory: "Sales History",
  salesHistorySub: "View and manage past transactions.",
  paymentMethod: "Payment Method",
  paymentStatus: "Payment Status",
  dateAndTime: "Date & Time",

  pointOfSale: "Point of Sale",
  searchPlaceholder: "Search by name or SKU...",
  allItems: "All Items",
  currentSale: "Current Sale",
  clearAll: "Clear All",
  checkout: "Checkout",
  items: "Items",
  totalAmount: "Total Amount",
  cartEmptyTitle: "Your cart is empty",
  cartEmptySub: "Tap products on the left to add them to the current sale.",
  soldOut: "SOLD OUT",
  inStock: "in stock",
  noProductsFound: "No products found",
  noProductsSub: "Try adjusting your search or category filter.",
  
  completePayment: "Complete Payment",
  amountDue: "Amount Due",
  cashReceived: "Cash Received",
  changeDue: "Change Due",
  cancel: "Cancel",
  confirmPayment: "Confirm Payment",
  processing: "Processing...",

  addProduct: "Add Product",
  editProduct: "Edit Product",
  productsAndCategories: (p, c) => \`\${p} products · \${c} categories\`,
  searchInventory: "Search name, Khmer, or SKU…",
  allCategories: "All Categories",
  sku: "SKU *",
  productNameEn: "Product Name (EN) *",
  productNameKh: "Product Name (KH)",
  category: "Category",
  description: "Description",
  sellingPrice: "Selling Price *",
  costPrice: "Cost Price *",
  stockQuantity: "Stock Quantity *",
  productImage: "Product Image",
  saveChanges: "Save Changes",
  createProduct: "Create Product",
  delete: "Delete",
  deleteProduct: "Delete Product",
  deleteConfirmMsg: "This action cannot be undone.",
  edit: "Edit",
  noResults: "No results found.",
  noProductsYet: "No products yet. Click 'Add Product' to start.",

  image: "Image",
  product: "Product",
  price: "Price",
  cost: "Cost",
  margin: "Margin",
  stock: "Stock",
  actions: "Actions",

  loginToYourAccount: "Log in to your account",
  username: "Username",
  password: "Password",
  signIn: "Sign in",
  signingIn: "Signing in...",
};
`;

// 3. km.ts
const kmTs = `import { Translations } from "./translations";

export const km: Translations = {
  dashboard: "ផ្ទាំងគ្រប់គ្រង",
  inventory: "ស្តុកទំនិញ",
  pos: "លក់ទំនិញ",
  sales: "ការលក់",
  customers: "អតិថិជន",
  suppliers: "អ្នកផ្គត់ផ្គង់",
  purchases: "ការបញ្ជាទិញ",
  expenses: "ចំណាយ",
  staff: "បុគ្គលិក",
  settings: "ការកំណត់",
  logout: "ចាកចេញ",

  dashboardOverview: "ទិដ្ឋភាពទូទៅនៃផ្ទាំងគ្រប់គ្រង",
  dashboardSub: "ធ្វើបច្ចុប្បន្នភាពទិន្នន័យហាងរបស់អ្នកក្នុងពេលជាក់ស្តែង។",
  todaysSales: "ការលក់ថ្ងៃនេះ",
  transactionsToday: "ប្រតិបត្តិការថ្ងៃនេះ",
  totalCustomers: "អតិថិជនសរុប",
  lowStockAlerts: "ការព្រមានស្តុកជិតអស់",
  outstandingDebts: "បំណុលដែលមិនទាន់សង",
  unpaidAccounts: "គណនីអតិថិជនដែលមិនទាន់បង់",
  totalUnpaid: "ចំនួនទឹកប្រាក់មិនទាន់បង់សរុប",
  recentTransactions: "ប្រតិបត្តិការថ្មីៗ",
  latestSales: "ការលក់ថ្មីៗក្នុងហាង",
  noRecentTransactions: "មិនមានប្រតិបត្តិការថ្មីៗទេ។",
  walkInCustomer: "អតិថិជនទូទៅ",

  customersOverview: "អតិថិជន",
  customersSub: "គ្រប់គ្រងអតិថិជនរបស់អ្នកនិងមើលប្រវត្តិរបស់ពួកគេ។",
  addCustomer: "បន្ថែមអតិថិជន",
  customerName: "ឈ្មោះអតិថិជន *",
  phone: "លេខទូរស័ព្ទ",
  address: "អាសយដ្ឋាន",
  orders: "ការបញ្ជាទិញ",
  totalSpent: "ចំណាយសរុប",
  noCustomersYet: "មិនទាន់មានអតិថិជនទេ។",
  searchCustomers: "ស្វែងរកអតិថិជន...",

  expensesOverview: "ចំណាយ",
  expensesSub: "តាមដានការចំណាយក្នុងហាងរបស់អ្នក។",
  logExpense: "កត់ត្រាចំណាយ",
  amount: "ចំនួនទឹកប្រាក់ *",
  date: "កាលបរិច្ឆេទ *",
  noExpensesYet: "មិនទាន់មានចំណាយត្រូវបានកត់ត្រាទេ។",

  purchasesOverview: "ការបញ្ជាទិញ",
  purchasesSub: "គ្រប់គ្រងការបញ្ជាទិញស្តុកពីអ្នកផ្គត់ផ្គង់។",
  newPo: "បញ្ជាទិញថ្មី",
  poNumber: "លេខបញ្ជាទិញ",
  supplier: "អ្នកផ្គត់ផ្គង់",
  status: "ស្ថានភាព",

  suppliersOverview: "អ្នកផ្គត់ផ្គង់",
  suppliersSub: "គ្រប់គ្រងអ្នកផ្គត់ផ្គង់ និងទំនាក់ទំនងរបស់អ្នក។",
  addSupplier: "បន្ថែមអ្នកផ្គត់ផ្គង់",
  contactName: "ឈ្មោះអ្នកទំនាក់ទំនង",
  email: "អ៊ីមែល",

  staffOverview: "ការគ្រប់គ្រងបុគ្គលិក",
  staffSub: "គ្រប់គ្រងគណនី និងតួនាទីរបស់បុគ្គលិក។",
  addUser: "បន្ថែមអ្នកប្រើប្រាស់",
  role: "តួនាទី",
  admin: "អ្នកគ្រប់គ្រង",
  manager: "អ្នកចាត់ការ",

  salesHistory: "ប្រវត្តិការលក់",
  salesHistorySub: "មើល និងគ្រប់គ្រងប្រតិបត្តិការពីមុន។",
  paymentMethod: "វិធីបង់ប្រាក់",
  paymentStatus: "ស្ថានភាពបង់ប្រាក់",
  dateAndTime: "កាលបរិច្ឆេទ និង ម៉ោង",

  pointOfSale: "បញ្ជរលក់ទំនិញ",
  searchPlaceholder: "ស្វែងរកឈ្មោះ ឬ លេខកូដ...",
  allItems: "ទំនិញទាំងអស់",
  currentSale: "ការលក់បច្ចុប្បន្ន",
  clearAll: "លុបទាំងអស់",
  checkout: "គិតប្រាក់",
  items: "មុខ",
  totalAmount: "សរុប",
  cartEmptyTitle: "មិនមានទំនិញ",
  cartEmptySub: "សូមចុចលើទំនិញខាងឆ្វេងដើម្បីលក់។",
  soldOut: "អស់ពីស្តុក",
  inStock: "ក្នុងស្តុក",
  noProductsFound: "រកមិនឃើញទំនិញ",
  noProductsSub: "សូមព្យាយាមស្វែងរកម្តងទៀត។",
  
  completePayment: "បញ្ចប់ការបង់ប្រាក់",
  amountDue: "ប្រាក់ត្រូវបង់",
  cashReceived: "ប្រាក់ទទួល",
  changeDue: "ប្រាក់អាប់",
  cancel: "បោះបង់",
  confirmPayment: "បញ្ជាក់ការបង់ប្រាក់",
  processing: "កំពុងដំណើរការ...",

  addProduct: "បន្ថែមទំនិញ",
  editProduct: "កែប្រែទំនិញ",
  productsAndCategories: (p, c) => \`\${p} ទំនិញ · \${c} ប្រភេទ\`,
  searchInventory: "ស្វែងរកឈ្មោះ, ខ្មែរ, ឬ កូដ...",
  allCategories: "ប្រភេទទាំងអស់",
  sku: "លេខកូដ *",
  productNameEn: "ឈ្មោះទំនិញ (អង់គ្លេស) *",
  productNameKh: "ឈ្មោះទំនិញ (ខ្មែរ)",
  category: "ប្រភេទ",
  description: "ការពិពណ៌នា",
  sellingPrice: "តម្លៃលក់ *",
  costPrice: "តម្លៃដើម *",
  stockQuantity: "ចំនួនស្តុក *",
  productImage: "រូបភាពទំនិញ",
  saveChanges: "រក្សាទុក",
  createProduct: "បង្កើតទំនិញ",
  delete: "លុប",
  deleteProduct: "លុបទំនិញ",
  deleteConfirmMsg: "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
  edit: "កែប្រែ",
  noResults: "រកមិនឃើញលទ្ធផល។",
  noProductsYet: "មិនទាន់មានទំនិញ។ ចុច 'បន្ថែមទំនិញ' ដើម្បើចាប់ផ្តើម។",

  image: "រូបភាព",
  product: "ទំនិញ",
  price: "តម្លៃ",
  cost: "ដើម",
  margin: "ចំណេញ",
  stock: "ស្តុក",
  actions: "សកម្មភាព",

  loginToYourAccount: "ចូលគណនីរបស់អ្នក",
  username: "ឈ្មោះអ្នកប្រើ",
  password: "ពាក្យសម្ងាត់",
  signIn: "ចូល",
  signingIn: "កំពុងចូល...",
};
`;

fs.writeFileSync(path.join(translationsPath, 'translations.ts'), translationsTs);
fs.writeFileSync(path.join(translationsPath, 'en.ts'), enTs);
fs.writeFileSync(path.join(translationsPath, 'km.ts'), kmTs);
console.log("Translations updated!");
