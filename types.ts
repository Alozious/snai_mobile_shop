
export type Role = 'Admin' | 'Manager' | 'Cashier' | 'Technician';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  status?: 'Active' | 'Inactive';
}

export type ProductType = 'Phone' | 'Accessory' | 'Spare Part';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  supplierId: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  updatedAt: string;
}

export type RepairStatus = 'Received' | 'Diagnosing' | 'In Repair' | 'Completed' | 'Delivered' | 'Cancelled';

export interface RepairJob {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issue: string;
  accessories: string;
  technicianId: string;
  estimatedCost: number;
  status: RepairStatus;
  createdAt: string;
  paidAmount: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  customerName?: string;
  items: SaleItem[];
  total: number;
  discount: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'Bank' | 'Credit';
  date: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  location: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
}

export interface ShopSettings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  tin: string;
  receiptFooter: string;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  // Postgres Integration Fields
  postgresUrl: string;
  postgresKey: string;
  syncEnabled: boolean;
}
