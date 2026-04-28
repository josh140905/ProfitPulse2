import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  Timestamp,
  orderBy,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw here to prevent app crash, let the caller handle it or just log it
  // toast.error is better used in components
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  gst?: number;
  userId: string;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  userId: string;
  createdAt: any;
}

export interface InvoiceItem {
  productId?: string; // Optional for custom items
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
  gst?: number;
  isCustom?: boolean;
}

export interface Invoice {
  id?: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: InvoiceItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  discount?: number;
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  paidAmount?: number;
  balance?: number;
  date: string;
  userId: string;
  createdAt: any;
}

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  userId: string;
  createdAt: any;
}

const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'object' && item !== null ? sanitizeData(item) : item
      );
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !(sanitized[key] instanceof Timestamp)) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  return sanitized;
};

export const businessService = {
  // Products
  subscribeToProducts: (userId: string, callback: (products: Product[]) => void) => {
    const q = query(collection(db, 'products'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      callback(products);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
  },

  addProduct: async (product: Omit<Product, 'id' | 'userId'>) => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    try {
      await addDoc(collection(db, 'products'), { ...product, userId: auth.currentUser.uid });
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'products'); }
  },

  updateProduct: async (id: string, product: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), sanitizeData(product));
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `products/${id}`); }
  },

  deleteProduct: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) { handleFirestoreError(error, OperationType.DELETE, `products/${id}`); }
  },

  // Customers
  subscribeToCustomers: (userId: string, callback: (customers: Customer[]) => void) => {
    const q = query(collection(db, 'customers'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
      callback(customers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));
  },

  addCustomer: async (customer: Omit<Customer, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    try {
      const docRef = await addDoc(collection(db, 'customers'), { 
        ...customer, 
        userId: auth.currentUser.uid, 
        createdAt: Timestamp.now() 
      });
      return docRef.id;
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'customers'); }
  },

  updateCustomer: async (id: string, customer: Partial<Customer>) => {
    try {
      await updateDoc(doc(db, 'customers', id), sanitizeData(customer));
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`); }
  },

  deleteCustomer: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) { handleFirestoreError(error, OperationType.DELETE, `customers/${id}`); }
  },

  // Invoices
  subscribeToInvoices: (userId: string, callback: (invoices: Invoice[]) => void) => {
    const q = query(collection(db, 'invoices'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
      callback(invoices);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'invoices'));
  },

  createInvoice: async (invoice: Omit<Invoice, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const batch = writeBatch(db);
    
    try {
      const invoiceRef = doc(collection(db, 'invoices'));
      batch.set(invoiceRef, sanitizeData({ 
        ...invoice, 
        userId: auth.currentUser.uid, 
        createdAt: Timestamp.now() 
      }));

      // Update stock for each non-custom item
      for (const item of invoice.items) {
        if (!item.isCustom && item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(-item.quantity) });
        }
      }

      await batch.commit();
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'invoices'); }
  },

  updateInvoice: async (id: string, invoice: Partial<Invoice>) => {
    try {
      await updateDoc(doc(db, 'invoices', id), sanitizeData(invoice));
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `invoices/${id}`); }
  },

  updateInvoiceWithStock: async (id: string, oldInvoice: Invoice, newInvoice: Omit<Invoice, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const batch = writeBatch(db);
    
    try {
      // 1. Revert old stock for non-custom items
      for (const item of oldInvoice.items) {
        if (!item.isCustom && item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(item.quantity) });
        }
      }

      // 2. Apply new stock for non-custom items
      for (const item of newInvoice.items) {
        if (!item.isCustom && item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(-item.quantity) });
        }
      }

      // 3. Update invoice
      const invoiceRef = doc(db, 'invoices', id);
      batch.update(invoiceRef, sanitizeData({ ...newInvoice }));

      await batch.commit();
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `invoices/${id}`); }
  },

  deleteInvoice: async (invoice: Invoice) => {
    if (!invoice.id) return;
    const batch = writeBatch(db);
    
    try {
      // Revert stock for each non-custom item, but only if product still exists
      for (const item of invoice.items) {
        if (!item.isCustom && item.productId) {
          const productRef = doc(db, 'products', item.productId);
          try {
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              batch.update(productRef, { stock: increment(item.quantity) });
            }
          } catch (e) {
            console.warn(`Could not update stock for product ${item.productId}, it might have been deleted.`);
          }
        }
      }

      // Delete the invoice
      const invoiceRef = doc(db, 'invoices', invoice.id);
      batch.delete(invoiceRef);

      await batch.commit();
    } catch (error) { handleFirestoreError(error, OperationType.DELETE, `invoices/${invoice.id}`); }
  },

  // Expenses
  subscribeToExpenses: (userId: string, callback: (expenses: Expense[]) => void) => {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      callback(expenses);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));
  },

  addExpense: async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    try {
      await addDoc(collection(db, 'expenses'), { 
        ...expense, 
        userId: auth.currentUser.uid, 
        createdAt: Timestamp.now() 
      });
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'expenses'); }
  },

  deleteExpense: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) { handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`); }
  },

  updateExpense: async (id: string, expense: Partial<Expense>) => {
    try {
      await updateDoc(doc(db, 'expenses', id), sanitizeData(expense));
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `expenses/${id}`); }
  }
};
