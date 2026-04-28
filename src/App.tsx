/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Trash2, 
  LogOut, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Users,
  Package,
  FileText,
  Receipt,
  LayoutDashboard,
  Search,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Printer,
  Eye,
  Edit,
  UserPlus,
  Menu,
  X,
  ArrowUpDown,
  Calendar,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, isSameMonth, parseISO, subMonths, addMonths, startOfMonth, endOfMonth, getYear, getQuarter, getMonth, startOfYear, endOfYear, eachMonthOfInterval, startOfQuarter, endOfQuarter } from 'date-fns';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { businessService, Product, Invoice, Expense, InvoiceItem, Customer, BusinessProfile } from './lib/businessService';

// Add this style for printing
const printStyles = `
@media print {
  body * {
    visibility: hidden !important;
  }
  #print-area, #print-area * {
    visibility: visible !important;
  }
  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 30px !important;
    background: white !important;
    display: block !important;
    z-index: 9999 !important;
  }
  .no-print {
    display: none !important;
  }
}
`;

function PrintableInvoice({ invoice, customer, items, profile }: { invoice: Invoice | null, customer: Customer | null, items: InvoiceItem[], profile: BusinessProfile | null }) {
  if (!invoice) return null;

  return (
    <div id="print-area" className="hidden print:block font-sans text-black">
      <div className="flex justify-between items-start mb-10 border-b-2 border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-3xl font-black tracking-tighter text-blue-600">{profile?.businessName || 'ProfitPulse'}</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">Business Solutions & Financials</p>
          {profile?.gstNumber && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">GSTIN: {profile.gstNumber}</p>}
          {profile?.panNumber && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PAN: {profile.panNumber}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-gray-900 mb-1">INVOICE</h2>
          <p className="text-sm font-bold text-gray-400">#{invoice.id?.slice(-8).toUpperCase()}</p>
          <p className="text-sm font-bold text-gray-900 mt-2">Date: <span className="font-medium text-gray-500">{format(parseISO(invoice.date), 'MMMM dd, yyyy')}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-100 pb-1">BILL TO</h3>
          <p className="text-lg font-black text-gray-900">{customer?.name || invoice.customerName || 'Walk-in Customer'}</p>
          <p className="text-sm text-gray-500 font-medium">{customer?.phone || invoice.customerPhone}</p>
          <p className="text-sm text-gray-500 font-medium">{customer?.email}</p>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-100 pb-1">PAYMENT STATUS</h3>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">Method: <span className="font-medium text-gray-500">{invoice.paymentMethod || 'Cash'}</span></p>
            <p className="text-sm font-bold text-gray-900">Total Due: <span className="font-medium text-gray-500">₹{invoice.totalAmount.toLocaleString()}</span></p>
            <p className="text-sm font-bold text-gray-900">Paid: <span className="font-medium text-emerald-600">₹{(invoice.paidAmount || 0).toLocaleString()}</span></p>
            <p className="text-sm font-bold text-gray-900">Balance: <span className="font-medium text-red-600">₹{(invoice.balance || 0).toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900 text-left">
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 w-[35%]">Item Description</th>
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 text-center">Qty</th>
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 text-right">Base Price</th>
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 text-right">GST %</th>
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 text-right">GST Amt</th>
            <th className="py-4 text-[10px] uppercase tracking-widest font-black text-gray-900 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, idx) => {
            const itemTotal = item.price * item.quantity;
            const gstRate = (item.gst || 0) / 100;
            const basePrice = itemTotal / (1 + gstRate);
            const gstAmt = itemTotal - basePrice;
            
            return (
              <tr key={idx}>
                <td className="py-4">
                  <p className="text-sm font-bold text-gray-900">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">HSN/SAC Code: 9983</p>
                </td>
                <td className="py-4 text-center text-sm font-medium text-gray-500">{item.quantity}</td>
                <td className="py-4 text-right text-sm font-medium text-gray-500">₹{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-4 text-right text-sm font-medium text-gray-500">{item.gst || 0}%</td>
                <td className="py-4 text-right text-sm font-medium text-gray-500">₹{gstAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-4 text-right text-sm font-bold text-gray-900">₹{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end pt-8">
        <div className="w-80 space-y-3">
          {(() => {
            let totalBase = 0;
            let totalGst = 0;
            items.forEach(item => {
              const itemTotal = item.price * item.quantity;
              const gstRate = (item.gst || 0) / 100;
              const basePrice = itemTotal / (1 + gstRate);
              totalBase += basePrice;
              totalGst += (itemTotal - basePrice);
            });
            
            const discountFactor = 1 - ((invoice.discount || 0) / 100);
            const finalBase = totalBase * discountFactor;
            const finalGst = totalGst * discountFactor;
            const splitGst = finalGst / 2;
            const grandTotal = finalBase + finalGst;

            return (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold">Subtotal (Excl. Tax)</span>
                  <span className="text-gray-900 font-bold">₹{totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                {totalGst > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold">Total GST</span>
                      <span className="text-gray-900 font-bold">₹{totalGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100 italic">
                      <span className="text-gray-400 font-medium">CGST ({(items[0]?.gst || 0)/2}%)</span>
                      <span className="text-gray-500 font-medium">₹{(totalGst/2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm italic">
                      <span className="text-gray-400 font-medium">SGST ({(items[0]?.gst || 0)/2}%)</span>
                      <span className="text-gray-500 font-medium">₹{(totalGst/2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                {invoice.discount ? (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                    <span className="text-gray-400 font-bold">Discount ({invoice.discount}%)</span>
                    <span className="text-red-500 font-bold">-₹{((invoice.totalAmount * invoice.discount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ) : null}

                <div className="flex justify-between border-t-2 border-gray-900 pt-3">
                  <span className="text-lg font-black text-gray-900">Grand Total</span>
                  <span className="text-lg font-black text-blue-600">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            );
          })()}
          
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-1">
             <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-bold">Amount Paid</span>
              <span className="text-emerald-600 font-bold">₹{(invoice.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-bold">Balance Due</span>
              <span className="text-red-600 font-bold">₹{(invoice.balance || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-gray-50 text-center">
        <div className="flex flex-col items-center gap-1 mb-2">
          {profile?.gstNumber && <p className="text-sm font-bold text-gray-900">GSTIN: {profile.gstNumber}</p>}
          {profile?.panNumber && <p className="text-sm font-bold text-gray-900">PAN: {profile.panNumber}</p>}
        </div>
        <p className="text-sm font-bold text-gray-900 mb-1">Thank you for your business!</p>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest italic">This is a computer generated invoice and requires no signature.</p>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm, 
  confirmText = "Confirm", 
  variant = "default" 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  title: string, 
  description: string, 
  onConfirm: () => void, 
  confirmText?: string,
  variant?: "default" | "destructive"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[30px] max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl flex-1">Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onOpenChange(false); }} className="rounded-xl flex-1">{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscriptions
  useEffect(() => {
    if (user) {
      const unsubProducts = businessService.subscribeToProducts(user.uid, setProducts);
      const unsubInvoices = businessService.subscribeToInvoices(user.uid, setInvoices);
      const unsubExpenses = businessService.subscribeToExpenses(user.uid, setExpenses);
      const unsubCustomers = businessService.subscribeToCustomers(user.uid, setCustomers);
      const unsubProfile = businessService.subscribeToProfile(user.uid, setProfile);
      return () => {
        unsubProducts();
        unsubInvoices();
        unsubExpenses();
        unsubCustomers();
        unsubProfile();
      };
    }
  }, [user]);

  // Filtered Data
  const monthlyInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(i => {
      try {
        return i.date && isSameMonth(parseISO(i.date), currentMonth);
      } catch (e) {
        return false;
      }
    });
  }, [invoices, currentMonth]);

  const monthlyExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      try {
        return e.date && isSameMonth(parseISO(e.date), currentMonth);
      } catch (e) {
        return false;
      }
    });
  }, [expenses, currentMonth]);

  // Stats
  const stats = useMemo(() => {
    try {
      const revenue = monthlyInvoices.reduce((acc, curr) => {
        const discountFactor = 1 - ((curr.discount || 0) / 100);
        const baseAmount = curr.items.reduce((itemAcc, item) => {
          const gstRate = (item.gst || 0) / 100;
          return itemAcc + ((item.price * item.quantity) / (1 + gstRate));
        }, 0);
        return acc + (baseAmount * discountFactor);
      }, 0);

      const costOfGoods = monthlyInvoices.reduce((acc, curr) => acc + Number(curr.totalCost || 0), 0);
      const operatingExpenses = monthlyExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const grossProfit = monthlyInvoices.reduce((acc, curr) => acc + (curr.profit || 0), 0);
      const netProfit = grossProfit - operatingExpenses;
      
      return { revenue, operatingExpenses, grossProfit, netProfit };
    } catch (e) {
      console.error('Stats calculation error:', e);
      return { revenue: 0, operatingExpenses: 0, grossProfit: 0, netProfit: 0 };
    }
  }, [monthlyInvoices, monthlyExpenses]);

  const chartData = useMemo(() => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), 'yyyy-MM-dd');
      const dayInvoices = monthlyInvoices.filter(inv => inv.date === dateStr);
      const dayExpenses = monthlyExpenses.filter(exp => exp.date === dateStr);
      
      const dayRevenue = dayInvoices.reduce((acc, curr) => {
        const discountFactor = 1 - ((curr.discount || 0) / 100);
        const baseAmount = curr.items.reduce((itemAcc, item) => {
          const gstRate = (item.gst || 0) / 100;
          return itemAcc + ((item.price * item.quantity) / (1 + gstRate));
        }, 0);
        return acc + (baseAmount * discountFactor);
      }, 0);

      data.push({
        name: i.toString(),
        revenue: dayRevenue,
        expenses: dayExpenses.reduce((acc, curr) => acc + curr.amount, 0),
        profit: dayInvoices.reduce((acc, curr) => acc + (curr.profit || 0), 0) - dayExpenses.reduce((acc, curr) => acc + curr.amount, 0)
      });
    }
    return data;
  }, [monthlyInvoices, monthlyExpenses, currentMonth]);

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#1B2559] font-sans flex relative overflow-x-hidden">
      <style>{printStyles}</style>
      
      {/* Printable Invoice (hidden by default, shown via CSS for printing) */}
      <PrintableInvoice 
        invoice={selectedInvoice} 
        customer={customers.find(c => c.id === selectedInvoice?.customerId) || customers.find(c => c.phone === selectedInvoice?.customerPhone) || null}
        items={selectedInvoice?.items || []}
        profile={profile}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#1B2559]/30 backdrop-blur-sm z-40 lg:hidden transition-opacity border-none"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/30">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">ProfitPulse</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Users />} label="Customers" active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Package />} label="Inventory" active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Receipt />} label="Invoices" active={activeTab === 'invoices'} onClick={() => { setActiveTab('invoices'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<TrendingDown />} label="Expenses" active={activeTab === 'expenses'} onClick={() => { setActiveTab('expenses'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<BarChart3 />} label="Reports" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} />
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName || 'Business Owner'}</p>
              <p className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-wider">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="p-4 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-[#F4F7FE]/80 backdrop-blur-md z-30">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="lg:hidden bg-white shadow-sm rounded-xl"
              >
                <Menu className="w-5 h-5 text-primary" />
              </Button>
              <div>
                <p className="text-[10px] sm:text-sm font-medium text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1 leading-none">Pages / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight leading-tight">Main {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              </div>
            </div>
            
            {/* Mobile Month Switcher Trigger (Optional or just rely on the full header) */}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm border border-white">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold min-w-[140px] text-center uppercase tracking-widest">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-gray-100 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Today
            </Button>
          </div>
        </header>

        <div className="px-8 pb-8 space-y-8">
          {activeTab === 'dashboard' && <DashboardView stats={stats} chartData={chartData} invoices={monthlyInvoices} />}
          {activeTab === 'customers' && <CustomersView customers={customers} invoices={invoices} onViewInvoice={setSelectedInvoice} />}
          {activeTab === 'inventory' && <InventoryView products={products} />}
          {activeTab === 'invoices' && <InvoicesView invoices={monthlyInvoices} allInvoices={invoices} products={products} customers={customers} currentMonth={currentMonth} selectedInvoice={selectedInvoice} setSelectedInvoice={setSelectedInvoice} />}
          {activeTab === 'expenses' && <ExpensesView expenses={monthlyExpenses} currentMonth={currentMonth} />}
          {activeTab === 'reports' && <ReportsView invoices={invoices} expenses={expenses} />}
          {activeTab === 'settings' && <SettingsView profile={profile} />}
        </div>

        {/* Global Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="rounded-[30px] !max-w-[1200px] !w-[95vw] p-0 border-none print-container bg-white sm:!max-w-[1200px]">
            <div className="p-6 sm:p-10 bg-white print:p-0 overflow-y-auto max-h-[90vh] w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 print:mb-4">
                <div>
                  <h2 className="text-3xl font-black text-primary tracking-tighter italic mb-1">{profile?.businessName || 'ProfitPulse'}</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Enterprise Billing OS</p>
                  {profile?.gstNumber && <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">GSTIN: {profile.gstNumber}</p>}
                  {profile?.panNumber && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PAN: {profile.panNumber}</p>}
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-xl font-bold mb-1">INVOICE</h3>
                  <p className="text-sm text-gray-400 font-medium">#{selectedInvoice?.id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 print:mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Billed To</p>
                  <p className="text-lg font-bold">{selectedInvoice?.customerName}</p>
                  {selectedInvoice?.customerPhone && (
                    <p className="text-sm text-gray-400 font-medium">{selectedInvoice.customerPhone}</p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Date Issued</p>
                  <p className="text-lg font-bold">{selectedInvoice && format(parseISO(selectedInvoice.date), 'MMMM dd, yyyy')}</p>
                  {selectedInvoice?.createdAt?.toDate && (
                    <p className="text-[10px] text-gray-400 font-medium">Added at {format(selectedInvoice.createdAt.toDate(), 'hh:mm a')}</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto mb-8 border border-gray-100 rounded-2xl no-scrollbar sm:scrollbar">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Item Description</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Base Price</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Qty</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">GST %</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">GST Amt</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice?.items.map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = (item.gst || 0) / 100;
                      const basePrice = itemTotal / (1 + gstRate);
                      const gstAmt = itemTotal - basePrice;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-bold">{item.name}</TableCell>
                          <TableCell>₹{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.gst || 0}%</TableCell>
                          <TableCell>₹{gstAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-bold">₹{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-3">
                  {(() => {
                    let totalBase = 0;
                    let totalGst = 0;
                    selectedInvoice?.items.forEach(item => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = (item.gst || 0) / 100;
                      const basePrice = itemTotal / (1 + gstRate);
                      totalBase += basePrice;
                      totalGst += (itemTotal - basePrice);
                    });
                    
                    const discountFactor = 1 - ((selectedInvoice?.discount || 0) / 100);
                    const finalGst = totalGst * discountFactor;
                    const splitGst = finalGst / 2;
                    
                    return (
                      <>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-sm font-bold uppercase tracking-widest">Subtotal (Excl. Tax)</span>
                          <span className="text-lg font-bold">₹{totalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {totalGst > 0 && (
                          <>
                            <div className="flex justify-between text-sm text-blue-500 font-medium">
                              <span>CGST ({(selectedInvoice?.items[0]?.gst || 0) / 2}%)</span>
                              <span>₹{splitGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-blue-500 font-medium">
                              <span>SGST ({(selectedInvoice?.items[0]?.gst || 0) / 2}%)</span>
                              <span>₹{splitGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {(selectedInvoice?.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-500 font-medium">
                      <span>Discount ({selectedInvoice!.discount}%)</span>
                      <span>-₹{((selectedInvoice!.totalAmount * selectedInvoice!.discount!) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center bg-primary/5 p-4 rounded-xl">
                    <span className="text-sm font-bold uppercase tracking-widest text-primary">Final Amount</span>
                    <span className="text-2xl font-black text-primary">
                      ₹{selectedInvoice?.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Payment Method</span>
                      <span className="font-bold text-gray-700">{selectedInvoice?.paymentMethod || 'Cash'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Amount Paid</span>
                      <span className="font-bold text-emerald-600">₹{(selectedInvoice?.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Balance Due</span>
                      <span className="font-bold text-red-500 underline decoration-red-200">₹{(selectedInvoice?.balance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-50 text-center print:mt-8">
                <p className="text-xs text-gray-400 font-medium">Thank you for your business!</p>
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 print:hidden">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)} className="rounded-xl">Close</Button>
              <Button onClick={() => {
                toast.info('Preparing invoice for print...');
                setTimeout(() => window.print(), 500);
              }} className="rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Printer className="w-4 h-4 mr-2" /> Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group ${active ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-primary text-white' : 'bg-transparent group-hover:bg-gray-100'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {active && <div className="ml-auto w-1 h-8 bg-primary rounded-full" />}
    </button>
  );
}

function CustomersView({ customers, invoices, onViewInvoice }: { customers: Customer[], invoices: Invoice[], onViewInvoice: (inv: Invoice) => void }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer?.id) {
        await businessService.updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await businessService.addCustomer(formData);
        toast.success('Customer added successfully');
      }
      setIsAddOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
    } catch (error) { toast.error('Failed to save customer'); }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsAddOpen(true);
  };

  const getCustomerPurchases = (phone: string) => {
    return invoices.filter(inv => inv.customerPhone === phone);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
        <ConfirmDialog 
          open={!!deleteConfirm} 
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          title="Delete Customer?"
          description={`Are you sure you want to delete "${deleteConfirm?.name}"? All history will remain in invoices but the customer record will be removed.`}
          confirmText="Delete"
          variant="destructive"
          onConfirm={() => deleteConfirm && businessService.deleteCustomer(deleteConfirm.id!)}
        />
        <CardHeader className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Customer Directory</CardTitle>
            <CardDescription>Manage your regular customers and view their history</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name or phone..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl w-64 bg-gray-50 border-none h-11"
              />
            </div>
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setEditingCustomer(null);
                setFormData({ name: '', phone: '', email: '', address: '' });
              }
            }}>
              <DialogTrigger render={<Button className="rounded-2xl px-6 shadow-lg shadow-primary/20" />}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Customer
              </DialogTrigger>
              <DialogContent className="rounded-[30px]">
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                  <DialogDescription>Enter customer details for your records</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 9876543210" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Optional)</Label>
                    <Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address (Optional)</Label>
                    <Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Customer address" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full rounded-2xl">{editingCustomer ? 'Update Customer' : 'Save Customer'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F4F7FE]/50">
              <TableRow>
                <TableHead className="px-8 font-bold text-[#A3AED0]">Customer ID</TableHead>
                <TableHead className="font-bold text-[#A3AED0]">Name</TableHead>
                <TableHead className="font-bold text-[#A3AED0]">Phone</TableHead>
                <TableHead className="font-bold text-[#A3AED0]">Total Orders</TableHead>
                <TableHead className="font-bold text-[#A3AED0]">Total Spent</TableHead>
                <TableHead className="font-bold text-[#A3AED0]">Balance Due</TableHead>
                <TableHead className="text-right px-8 font-bold text-[#A3AED0]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => {
                const purchases = getCustomerPurchases(c.phone);
                const totalSpent = purchases.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
                const totalBalance = purchases.reduce((acc, inv) => acc + (inv.balance || 0), 0);
                return (
                  <TableRow key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="px-8 font-medium text-gray-400">#{c.id?.slice(-6).toUpperCase()}</TableCell>
                    <TableCell className="font-bold">{c.name}</TableCell>
                    <TableCell className="font-medium">{c.phone}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-500 text-xs font-bold">
                        {purchases.length} orders
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-gray-400">₹{totalSpent.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-red-500">
                      ₹{totalBalance.toLocaleString()}
                      {totalBalance > 0 && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />}
                    </TableCell>
                    <TableCell className="text-right px-8 space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(c)} className="text-gray-300 hover:text-primary lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <History className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-gray-300 hover:text-blue-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(c)} className="text-gray-300 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer History Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="rounded-[30px] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase History: {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>Viewing all past invoices for this customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && getCustomerPurchases(selectedCustomer.phone).map((inv) => (
              <div 
                key={inv.id} 
                className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all cursor-pointer group/inv"
                onClick={() => {
                  onViewInvoice(inv);
                  setSelectedCustomer(null);
                }}
              >
                <div>
                  <p className="text-sm font-bold group-hover/inv:text-primary transition-colors">Invoice #{inv.id?.slice(-6).toUpperCase()}</p>
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{format(parseISO(inv.date), 'MMM dd, yyyy')}</p>
                    {inv.createdAt?.toDate && (
                      <p className="text-[10px] text-gray-300">Added at {format(inv.createdAt.toDate(), 'hh:mm a')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">₹{(inv.totalAmount - (inv.totalAmount * (inv.discount || 0) / 100)).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{inv.items.length} items</p>
                  </div>
                  <Eye className="w-4 h-4 text-gray-300 group-hover/inv:text-primary transition-colors" />
                </div>
              </div>
            ))}
            {selectedCustomer && getCustomerPurchases(selectedCustomer.phone).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 font-medium">No purchase history found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: number, icon: React.ReactNode, trend?: number, color: string }) {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary',
    red: 'text-red-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500'
  };

  return (
    <Card className="rounded-[30px] border-none shadow-sm p-6 bg-white">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl bg-[#F4F7FE] ${colorClasses[color] || 'text-primary'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">₹{value.toLocaleString()}</h3>
          {trend !== undefined && (
            <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}% <span className="text-gray-400 font-medium">since last month</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function DashboardView({ stats, chartData, invoices }: { stats: any, chartData: any[], invoices: Invoice[] }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={stats.revenue} icon={<DollarSign />} color="primary" />
        <StatCard title="Operating Expenses" value={stats.operatingExpenses} icon={<TrendingDown />} color="red" />
        <StatCard title="Gross Profit" value={stats.grossProfit} icon={<TrendingUp />} color="emerald" />
        <StatCard title="Net Profit" value={stats.netProfit} icon={<BarChart3 />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[30px] border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Revenue Overview</CardTitle>
                <CardDescription>Daily financial performance</CardDescription>
              </div>
              <div className="bg-[#F4F7FE] p-1 rounded-xl flex gap-1">
                <Button variant="ghost" size="sm" className="rounded-lg text-xs font-bold">Daily</Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-xs font-bold text-gray-400">Monthly</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4318FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A3AED0'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A3AED0'}} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#4318FF" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-bold">Recent Invoices</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-8 space-y-6">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#F4F7FE] p-3 rounded-2xl">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[120px]">{inv.customerName}</p>
                      <div className="flex flex-col">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{format(parseISO(inv.date), 'MMM dd, yyyy')}</p>
                        {inv.createdAt?.toDate && (
                          <p className="text-[9px] text-gray-300">Added at {format(inv.createdAt.toDate(), 'hh:mm a')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">+₹{(inv.totalAmount - (inv.totalAmount * (inv.discount || 0) / 100)).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{inv.items.length} items</p>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400 font-medium">No recent invoices</p>
                </div>
              )}
            </div>
            <div className="p-8">
              <Button variant="outline" className="w-full rounded-2xl border-gray-100 text-gray-400 font-bold hover:bg-gray-50">View All Invoices</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InventoryView({ products }: { products: Product[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', costPrice: '', stock: '', gst: '18' });
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Handle auto-fetch when adding a new product
  useEffect(() => {
    if (!editingProduct && formData.name.length > 2) {
      const existing = products.find(p => p.name.toLowerCase() === formData.name.toLowerCase());
      if (existing) {
        setFormData(prev => ({
          ...prev,
          price: existing.price.toString(),
          costPrice: existing.costPrice.toString(),
          stock: existing.stock.toString(),
          gst: (existing.gst || 18).toString()
        }));
        toast.info(`Found existing product: ${existing.name}. Details fetched.`);
      }
    }
  }, [formData.name, products, editingProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if we're editing an existing instance or if a product with this name already exists
      const existingProductByName = !editingProduct 
        ? products.find(p => p.name.toLowerCase() === formData.name.toLowerCase())
        : null;

      const targetId = editingProduct?.id || existingProductByName?.id;

      if (targetId) {
        await businessService.updateProduct(targetId, {
          name: formData.name,
          price: parseFloat(formData.price),
          costPrice: parseFloat(formData.costPrice),
          stock: parseInt(formData.stock),
          gst: parseFloat(formData.gst)
        });
        toast.success(`Product "${formData.name}" updated successfully`);
      } else {
        await businessService.addProduct({
          name: formData.name,
          price: parseFloat(formData.price),
          costPrice: parseFloat(formData.costPrice),
          stock: parseInt(formData.stock),
          gst: parseFloat(formData.gst)
        });
        toast.success(`Product "${formData.name}" added to inventory`);
      }
      setIsAddOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', costPrice: '', stock: '', gst: '18' });
    } catch (error) { toast.error('Failed to save product'); }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      gst: (product.gst || 18).toString()
    });
    setIsAddOpen(true);
  };

  return (
    <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
      <ConfirmDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Product?"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteConfirm && businessService.deleteProduct(deleteConfirm.id!)}
      />
      <CardHeader className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold">Inventory Management</CardTitle>
          <CardDescription>Manage your products and stock levels</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search inventory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl border-gray-100 h-11 focus-visible:ring-primary"
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormData({ name: '', price: '', costPrice: '', stock: '' });
          }
        }}>
          <DialogTrigger render={<Button className="rounded-2xl px-6 shadow-lg shadow-primary/20" />}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </DialogTrigger>
          <DialogContent className="rounded-[30px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>Enter product details for your inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <div className="relative">
                  <Input 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Wireless Mouse" 
                    required 
                    className="pr-10"
                  />
                      {formData.name.length > 0 && !editingProduct && products.some(p => p.name.toLowerCase().includes(formData.name.toLowerCase()) && p.name !== formData.name) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 max-h-40 overflow-y-auto">
                          {products
                            .filter(p => p.name.toLowerCase().includes(formData.name.toLowerCase()))
                            .map(p => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium transition-colors"
                                onClick={() => {
                                  setFormData({
                                    name: p.name,
                                    price: p.price.toString(),
                                    costPrice: p.costPrice.toString(),
                                    stock: p.stock.toString(),
                                    gst: (p.gst || 18).toString()
                                  });
                                  toast.info(`Synced with existing product: ${p.name}`);
                                }}
                              >
                                {p.name}
                              </button>
                            ))}
                        </div>
                      )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Selling Price (₹)</Label>
                  <Input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price (₹)</Label>
                  <Input type="number" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: e.target.value})} placeholder="0.00" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock Level</Label>
                  <Input type="number" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>GST (%)</Label>
                  <Input type="number" value={formData.gst || ''} onChange={e => setFormData({...formData, gst: e.target.value})} placeholder="18" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-2xl">{editingProduct ? 'Update Product' : 'Add to Inventory'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-[#F4F7FE]/50">
            <TableRow>
              <TableHead className="px-8 font-bold text-[#A3AED0]">Product Name</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Price (inc. Tax)</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">GST</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Stock</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Net Profit</TableHead>
              <TableHead className="text-right px-8 font-bold text-[#A3AED0]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((p) => (
              <TableRow key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                <TableCell className="px-8 font-bold leading-none">
                  <div className="flex flex-col gap-1">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Unit Cost: ₹{p.costPrice.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">₹{p.price.toLocaleString()}</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[10px] font-bold">
                    {p.gst || 18}% GST
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {p.stock} units
                  </span>
                </TableCell>
                <TableCell className="font-bold text-emerald-500">₹{((p.price / (1 + (p.gst || 18) / 100)) - p.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right px-8 space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-gray-300 hover:text-blue-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(p)} className="text-gray-300 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProductSearch({ 
  products, 
  onSelect, 
  placeholder = "Search product...",
  className = ""
}: { 
  products: Product[], 
  onSelect: (p: Product) => void,
  placeholder?: string,
  className?: string
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);
  }, [products, search]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 rounded-xl h-11 bg-white border-gray-100"
        />
      </div>
      
      {open && (search.length > 0 || filtered.length > 0) && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[70] max-h-64 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setSearch('');
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Stock: {p.stock} units</p>
                  </div>
                  <p className="text-sm font-black text-primary">₹{p.price.toLocaleString()}</p>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-gray-400 font-medium">No products found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InvoicesView({ invoices, allInvoices, products, customers, currentMonth, selectedInvoice, setSelectedInvoice }: { 
  invoices: Invoice[], 
  allInvoices: Invoice[],
  products: Product[], 
  customers: Customer[], 
  currentMonth: Date,
  selectedInvoice: Invoice | null,
  setSelectedInvoice: (inv: Invoice | null) => void
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerBalance, setCustomerBalance] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [invoiceItems, setInvoiceItems] = useState<{ productId: string, name: string, quantity: number, price: number, costPrice: number, gst: number, isCustom: boolean }[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerPhone?.includes(searchQuery)
    );
  }, [invoices, searchQuery]);

  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [invoiceItems]);

  const totalGst = useMemo(() => {
    return invoiceItems.reduce((acc, item) => {
      const itemTotal = item.price * item.quantity;
      const gstRate = (item.gst || 0) / 100;
      const basePrice = itemTotal / (1 + gstRate);
      return acc + (itemTotal - basePrice);
    }, 0);
  }, [invoiceItems]);

  const finalAmount = useMemo(() => {
    return totalAmount - (totalAmount * (discount / 100));
  }, [totalAmount, discount]);

  const balanceForInvoice = useMemo(() => {
    return finalAmount - paidAmount;
  }, [finalAmount, paidAmount]);

  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    const customer = customers.find(c => c.phone === phone);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerId(customer.id || '');
      
      // Calculate previous balance due
      const customerInvoices = allInvoices.filter(inv => 
        (inv.customerId && inv.customerId === customer.id) || 
        (inv.customerPhone && inv.customerPhone === phone)
      );
      const totalBalance = customerInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);
      setCustomerBalance(totalBalance);
      
      toast.success(`Found regular customer: ${customer.name}`);
    } else {
      setCustomerBalance(0);
    }
  };

  const handleCreateInvoice = async () => {
    if (!customerName || invoiceItems.length === 0) {
      toast.error('Please fill in all details');
      return;
    }

    if (invoiceItems.some(item => !item.isCustom && !item.productId)) {
      toast.error('Please select a product for all inventory items');
      return;
    }

    const items: InvoiceItem[] = invoiceItems.map(item => ({
      productId: item.productId || undefined,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      costPrice: item.costPrice,
      gst: item.gst,
      isCustom: item.isCustom
    }));

    const totalCost = items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
    const totalBaseAmount = items.reduce((acc, item) => {
      const gstRate = (item.gst || 0) / 100;
      const itemBase = (item.price * item.quantity) / (1 + gstRate);
      return acc + itemBase;
    }, 0);
    const discountedBaseAmount = totalBaseAmount - (totalBaseAmount * (discount / 100));
    const profit = discountedBaseAmount - totalCost;

    try {
      let finalCustomerId = customerId;
      
      // Auto-add customer if they don't exist in directory
      if (customerPhone && !customerId) {
        const existingCustomer = customers.find(c => c.phone === customerPhone);
        if (!existingCustomer) {
          const newId = await businessService.addCustomer({
            name: customerName,
            phone: customerPhone,
            email: '',
            address: ''
          });
          if (newId) finalCustomerId = newId;
          toast.success(`New customer "${customerName}" added to directory`);
        } else {
          finalCustomerId = existingCustomer.id || '';
        }
      }

      // Handle overpayment (surplus) and apply to other unpaid invoices
      const surplus = Math.max(0, paidAmount - finalAmount);
      let remainingSurplus = surplus;
      let totalAppliedSurplus = 0;

      if (surplus > 0 && finalCustomerId) {
        // Pay off other invoices with balance > 0
        const otherUnpaidInvoices = allInvoices
          .filter(inv => {
            const matchesId = finalCustomerId && inv.customerId === finalCustomerId;
            const matchesPhone = customerPhone && inv.customerPhone === customerPhone;
            const notCurrent = inv.id !== editingInvoice?.id;
            const hasBalance = (inv.balance || 0) > 0;
            return (matchesId || matchesPhone) && notCurrent && hasBalance;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const inv of otherUnpaidInvoices) {
          if (remainingSurplus <= 0) break;
          const currentBalance = inv.balance || 0;
          const paymentAmount = Math.min(currentBalance, remainingSurplus);
          
          await businessService.updateInvoice(inv.id!, {
            paidAmount: (inv.paidAmount || 0) + paymentAmount,
            balance: currentBalance - paymentAmount
          });
          
          remainingSurplus -= paymentAmount;
          totalAppliedSurplus += paymentAmount;
        }
        
        if (totalAppliedSurplus > 0) {
          toast.success(`Applied ₹${totalAppliedSurplus.toLocaleString()} from overpayment to previous balances`);
        }
      }

      const invoiceData = {
        customerName,
        customerPhone,
        customerId: finalCustomerId,
        items,
        totalAmount: finalAmount,
        totalCost,
        profit,
        discount,
        paymentMethod,
        paidAmount: paidAmount - (surplus - remainingSurplus), // Deduct what was distributed
        balance: finalAmount - (paidAmount - (surplus - remainingSurplus)),
        date: invoiceDate
      };

      if (editingInvoice?.id) {
        await businessService.updateInvoiceWithStock(editingInvoice.id, editingInvoice, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        await businessService.createInvoice(invoiceData);
        toast.success('Invoice created successfully');
      }
      setIsCreateOpen(false);
      setEditingInvoice(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerId('');
      setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
      setDiscount(0);
      setPaidAmount(0);
      setPaymentMethod('Cash');
      setInvoiceItems([]);
    } catch (error) { toast.error('Failed to save invoice'); }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCustomerName(invoice.customerName);
    setCustomerPhone(invoice.customerPhone || '');
    setCustomerId(invoice.customerId || '');
    setInvoiceDate(invoice.date);
    setDiscount(invoice.discount || 0);
    setPaidAmount(invoice.paidAmount || 0);
    setPaymentMethod(invoice.paymentMethod || 'Cash');
    setInvoiceItems(invoice.items.map(item => ({
      productId: item.productId || '',
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      costPrice: item.costPrice,
      gst: item.gst || 0,
      isCustom: item.isCustom || false
    })));
    setIsCreateOpen(true);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await businessService.deleteInvoice(invoice);
      toast.success('Invoice deleted and stock restored');
    } catch (error) { toast.error('Failed to delete invoice'); }
  };

  const handlePrint = () => {
    toast.info('Preparing invoice for print...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
      <ConfirmDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Invoice?"
        description={`Are you sure you want to delete invoice for "${deleteConfirm?.customerName}"? This will restore product stock.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteConfirm && handleDeleteInvoice(deleteConfirm)}
      />
      <CardHeader className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-xl font-bold">Billing & Invoices</CardTitle>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              {format(currentMonth, 'MMMM')}
            </span>
          </div>
          <CardDescription>Generate and manage customer invoices</CardDescription>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search ID, name, phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-gray-50/50 border-gray-100 h-10 focus:bg-white transition-colors"
            />
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingInvoice(null);
              setCustomerName('');
              setCustomerPhone('');
              setCustomerId('');
              setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
              setDiscount(0);
              setInvoiceItems([]);
            }
          }}>
            <DialogTrigger render={<Button className="rounded-2xl px-6 h-10 shadow-lg shadow-primary/20 w-full sm:w-auto" />}>
              <Plus className="w-4 h-4 mr-2" /> Create Invoice
            </DialogTrigger>
            <DialogContent 
              className="rounded-[30px] !p-0 !border-none !overflow-hidden bg-transparent shadow-none !max-w-[1200px] !w-[95vw] sm:!max-w-[1200px]"
              style={{ height: '85vh', maxHeight: '85vh' }}
            >
              <div className="w-full h-full bg-white rounded-[30px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                {/* Sticky Header */}
                <div className="p-6 sm:p-8 border-b border-gray-50 bg-white shrink-0">
                  <DialogTitle className="text-2xl font-bold">{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
                  <DialogDescription>Enter customer details and add items</DialogDescription>
                </div>
                
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 min-h-0 w-full scrollbar-thin scrollbar-thumb-gray-200">
                  {/* Customer Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Phone Number</Label>
                      <Input 
                        value={customerPhone || ''} 
                        onChange={e => handlePhoneChange(e.target.value)} 
                        placeholder="Search by phone..." 
                        className="rounded-xl h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-colors" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer Name</Label>
                      <Input value={customerName || ''} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className="rounded-xl h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Date</Label>
                      <Input type="date" value={invoiceDate || ''} onChange={e => setInvoiceDate(e.target.value)} className="rounded-xl h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-emerald-500">Discount (%)</Label>
                      <Input 
                        type="number" 
                        value={(discount === null || isNaN(discount)) ? '' : discount} 
                        onChange={e => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} 
                        placeholder="0" 
                        className="rounded-xl h-12 bg-emerald-50/50 border-emerald-100 focus:bg-white transition-colors text-emerald-600 font-bold" 
                      />
                    </div>
                  </div>

                  {customerBalance !== 0 && (
                    <div className={`p-4 ${customerBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} border rounded-2xl flex items-center justify-between transition-colors`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${customerBalance > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center`}>
                          {customerBalance > 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${customerBalance > 0 ? 'text-red-400' : 'text-emerald-400'} uppercase tracking-wider`}>
                            {customerBalance > 0 ? 'Previous Balance Due' : 'Available Credit'}
                          </p>
                          <p className={`text-lg font-black ${customerBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ₹{Math.abs(customerBalance).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className={`text-[10px] font-medium ${customerBalance > 0 ? 'text-red-400' : 'text-emerald-400'} max-w-[200px] text-right`}>
                        {customerBalance > 0 
                          ? 'This customer has an outstanding balance from previous invoices.' 
                          : 'This customer has extra payment credit from previous transactions.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Items Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-lg">Invoice Items</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setInvoiceItems([...invoiceItems, { productId: '', name: '', quantity: 1, price: 0, costPrice: 0, gst: 18, isCustom: false }])} className="text-primary font-bold hover:bg-primary/5 rounded-xl">
                          <Plus className="w-4 h-4 mr-1" /> Inventory Item
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setInvoiceItems([...invoiceItems, { productId: '', name: '', quantity: 1, price: 0, costPrice: 0, gst: 18, isCustom: true }])} className="text-emerald-500 font-bold hover:bg-emerald-50 rounded-xl">
                          <Plus className="w-4 h-4 mr-1" /> Custom Item
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className={`grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-start md:items-center p-4 sm:p-5 rounded-2xl border relative group transition-all ${item.isCustom ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                          <div className="flex flex-col lg:flex-row gap-4 w-full">
                            {item.isCustom ? (
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Custom Item Name</Label>
                                <Input 
                                  value={item.name} 
                                  onChange={(e) => {
                                    const newItems = [...invoiceItems];
                                    newItems[idx].name = e.target.value;
                                    setInvoiceItems(newItems);
                                  }} 
                                  placeholder="Enter item name"
                                  className="rounded-xl h-11 bg-white border-emerald-100/50" 
                                />
                              </div>
                            ) : (
                              <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Inventory Product</Label>
                                {item.productId ? (
                                  <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl h-11">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold leading-none">{item.name}</span>
                                      <span className="text-[9px] text-gray-400 font-medium uppercase mt-0.5">
                                        Stock: {products.find(p => p.id === item.productId)?.stock || 0}
                                      </span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => {
                                        const newItems = [...invoiceItems];
                                        newItems[idx].productId = '';
                                        newItems[idx].name = '';
                                        setInvoiceItems(newItems);
                                      }}
                                      className="h-7 w-7 p-0 text-gray-300 hover:text-red-500"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <ProductSearch 
                                    products={products}
                                    onSelect={(p) => {
                                      const newItems = [...invoiceItems];
                                      newItems[idx].productId = p.id!;
                                      newItems[idx].name = p.name;
                                      newItems[idx].price = p.price;
                                      newItems[idx].costPrice = p.costPrice;
                                      newItems[idx].gst = p.gst || 18;
                                      setInvoiceItems(newItems);
                                    }}
                                    placeholder="Search inventory..."
                                  />
                                )}
                              </div>
                            )}
                            
                            <div className="flex gap-4 w-full lg:w-auto">
                              <div className="flex-1 lg:w-32 space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-bold ${item.isCustom ? 'text-emerald-500' : 'text-gray-400'}`}>Price (₹)</Label>
                                <Input type="number" value={(item.price === null || isNaN(item.price)) ? '' : item.price} onChange={(e) => {
                                  const newItems = [...invoiceItems];
                                  newItems[idx].price = parseFloat(e.target.value) || 0;
                                  setInvoiceItems(newItems);
                                }} className="rounded-xl h-11 bg-white" />
                              </div>
                              <div className="w-20 space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-bold ${item.isCustom ? 'text-emerald-500' : 'text-gray-400'}`}>Qty</Label>
                                <Input type="number" value={(item.quantity === null || isNaN(item.quantity)) ? '' : item.quantity} onChange={(e) => {
                                  const newItems = [...invoiceItems];
                                  newItems[idx].quantity = parseInt(e.target.value) || 0;
                                  setInvoiceItems(newItems);
                                }} className="rounded-xl h-11 bg-white" />
                              </div>
                              <div className="w-20 space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-bold ${item.isCustom ? 'text-emerald-500' : 'text-gray-400'}`}>GST%</Label>
                                <Input type="number" value={(item.gst === null || isNaN(item.gst)) ? '' : item.gst} onChange={(e) => {
                                  const newItems = [...invoiceItems];
                                  newItems[idx].gst = parseFloat(e.target.value) || 0;
                                  setInvoiceItems(newItems);
                                }} className="rounded-xl h-11 bg-white" />
                              </div>
                              {item.isCustom && (
                                <div className="flex-1 lg:w-32 space-y-1.5">
                                  <Label className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Cost (₹)</Label>
                                  <Input type="number" value={(item.costPrice === null || isNaN(item.costPrice)) ? '' : item.costPrice} onChange={(e) => {
                                    const newItems = [...invoiceItems];
                                    newItems[idx].costPrice = parseFloat(e.target.value) || 0;
                                    setInvoiceItems(newItems);
                                  }} className="rounded-xl h-11 bg-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))} className="text-red-400 hover:bg-red-50 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 sm:p-8 border-t border-gray-100 bg-white flex flex-col gap-6 shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                        <SelectTrigger className="rounded-xl h-12 bg-gray-50/50 border-gray-100">
                          <SelectValue placeholder="Select Method" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="Cash">Cash Payment</SelectItem>
                          <SelectItem value="UPI">UPI / GPay / PhonePe</SelectItem>
                          <SelectItem value="Card">Debit/Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Amount Paid (₹)</Label>
                       <Input 
                        type="number" 
                        value={(paidAmount === null || isNaN(paidAmount)) ? '' : paidAmount} 
                        onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} 
                        className="rounded-xl h-12 bg-emerald-50/50 border-emerald-100 text-emerald-600 font-bold" 
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Balance Remaining</p>
                      <p className="text-2xl font-black text-red-500">₹{balanceForInvoice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-50">
                    <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1">Subtotal</p>
                        <p className="text-lg font-bold text-gray-900 leading-none">₹{totalAmount.toLocaleString()}</p>
                      </div>
                      
                      {totalGst > 0 && (
                        <>
                          <div>
                            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest leading-none mb-1">CGST ({(invoiceItems[0]?.gst || 0) / 2}%)</p>
                            <p className="text-lg font-bold text-blue-500 leading-none">₹{(totalGst / 2).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest leading-none mb-1">SGST ({(invoiceItems[0]?.gst || 0) / 2}%)</p>
                            <p className="text-lg font-bold text-blue-500 leading-none">₹{(totalGst / 2).toLocaleString()}</p>
                          </div>
                        </>
                      )}

                      {discount > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest leading-none mb-1">Discount ({discount}%)</p>
                          <p className="text-lg font-bold text-emerald-500 leading-none">-₹{((totalAmount * discount) / 100).toLocaleString()}</p>
                        </div>
                      )}
                      
                      <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-medium text-primary uppercase tracking-widest leading-none mb-1">Grand Total</p>
                        <p className="text-2xl font-black text-primary leading-none">₹{finalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button onClick={handleCreateInvoice} className="rounded-2xl px-10 h-14 shadow-xl shadow-primary/20 w-full sm:w-auto text-lg font-bold">
                      {editingInvoice ? 'Update Invoice' : 'Confirm & Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
      <CardContent className="p-0">
        <Table className="print:hidden">
          <TableHeader className="bg-[#F4F7FE]/50">
            <TableRow>
              <TableHead className="px-8 font-bold text-[#A3AED0]">Invoice ID</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Customer</TableHead>
              <TableHead key="date" className="font-bold text-[#A3AED0]">Transaction Date</TableHead>
              <TableHead key="items" className="font-bold text-[#A3AED0]">Status</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Total Amount</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Balance Due</TableHead>
              <TableHead className="text-right px-8 font-bold text-[#A3AED0]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((inv) => (
              <TableRow key={inv.id} className="group hover:bg-gray-50/50 transition-colors">
                <TableCell className="px-8 font-medium text-gray-400 leading-none">
                  <div className="flex flex-col gap-1">
                    <span>#{inv.id?.slice(-6).toUpperCase()}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 w-fit">{inv.paymentMethod || 'Cash'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold leading-none">
                  <div className="flex flex-col gap-1">
                    <span>{inv.customerName}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{inv.customerPhone}</span>
                  </div>
                </TableCell>
                <TableCell key="invoice-date">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{format(parseISO(inv.date), 'MMM dd, yyyy')}</span>
                    {inv.createdAt?.toDate && (
                      <span className="text-[9px] text-gray-300">Added {format(inv.createdAt.toDate(), 'hh:mm a')}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    (inv.balance || 0) === 0 ? 'bg-emerald-50 text-emerald-500' : 
                    (inv.paidAmount || 0) > 0 ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                  }`}>
                    {(inv.balance || 0) === 0 ? 'Fully Paid' : (inv.paidAmount || 0) > 0 ? 'Partial' : 'Unpaid'}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-[#1B2559]">
                  ₹{Number(inv.totalAmount).toLocaleString()}
                </TableCell>
                <TableCell className={`font-black ${(inv.balance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  ₹{(inv.balance || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right px-8 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(inv)} className="text-blue-400 lg:opacity-0 lg:group-hover:opacity-100" title="View Details">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setSelectedInvoice(inv);
                    setTimeout(() => window.print(), 500);
                  }} className="text-primary lg:opacity-0 lg:group-hover:opacity-100" title="Quick Print">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(inv)} className="text-gray-400 hover:text-blue-500 lg:opacity-0 lg:group-hover:opacity-100" title="Edit Invoice">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(inv)} className="text-red-400 lg:opacity-0 lg:group-hover:opacity-100" title="Delete Invoice">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Removed local Invoice Detail Dialog - now global in Dashboard */}
      </CardContent>
    </Card>
  );
}

function ExpensesView({ expenses, currentMonth }: { expenses: Expense[], currentMonth: Date }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ description: '', amount: '', category: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDate = !dateFilter || e.date === dateFilter;
        
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, dateFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    try {
      if (editingExpense?.id) {
        await businessService.updateExpense(editingExpense.id, {
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date
        });
        toast.success('Expense updated');
      } else {
        await businessService.addExpense({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date
        });
        toast.success('Expense recorded');
      }
      setIsAddOpen(false);
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) { toast.error('Failed to save expense'); }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    });
    setIsAddOpen(true);
  };

  return (
    <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
      <ConfirmDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Expense?"
        description={`Are you sure you want to delete "${deleteConfirm?.description}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteConfirm && businessService.deleteExpense(deleteConfirm.id!)}
      />
      <CardHeader className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-xl font-bold">Business Expenses</CardTitle>
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider">
              {format(currentMonth, 'MMMM')}
            </span>
          </div>
          <CardDescription>Track your operational costs and overheads</CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1 md:flex-initial">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search description or category..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-gray-50/50 border-gray-100 h-10 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="pl-9 rounded-xl h-10 bg-white border-gray-100 shadow-sm text-xs font-bold w-40"
                />
              </div>
              {dateFilter && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="rounded-xl h-10 text-xs font-bold text-gray-400 hover:text-primary"
                  onClick={() => setDateFilter('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingExpense(null);
              setFormData({ description: '', amount: '', category: '', date: format(new Date(), 'yyyy-MM-dd') });
            }
          }}>
            <DialogTrigger render={<Button className="rounded-2xl px-6 shadow-lg shadow-primary/20 w-full sm:w-auto" />}>
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </DialogTrigger>
          <DialogContent className="rounded-[30px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
              <DialogDescription>Enter details of your business expenditure</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Office Rent" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category || undefined} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="inventory">Inventory Purchase</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-2xl">{editingExpense ? 'Update Expense' : 'Record Expense'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-[#F4F7FE]/50">
            <TableRow>
              <TableHead className="px-8 font-bold text-[#A3AED0]">Date</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Description</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Category</TableHead>
              <TableHead className="font-bold text-[#A3AED0]">Amount</TableHead>
              <TableHead className="text-right px-8 font-bold text-[#A3AED0]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((e) => (
              <TableRow key={e.id} className="group hover:bg-gray-50/50 transition-colors">
                <TableCell key="expense-date" className="px-8">
                  <div className="flex flex-col">
                    <span className="font-medium">{format(parseISO(e.date), 'MMM dd, yyyy')}</span>
                    {e.createdAt?.toDate && (
                      <span className="text-[10px] text-gray-400">Added {format(e.createdAt.toDate(), 'hh:mm a')}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{e.description}</TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                    {e.category}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-red-500">₹{e.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right px-8 space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(e)} className="text-gray-300 hover:text-blue-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(e)} className="text-gray-300 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SettingsView({ profile }: { profile: BusinessProfile | null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: profile?.businessName || '',
    gstNumber: profile?.gstNumber || '',
    panNumber: profile?.panNumber || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await businessService.upsertProfile({
        ...formData,
        userId: user.uid
      });
      toast.success('Business profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName,
        gstNumber: profile.gstNumber || '',
        panNumber: profile.panNumber || ''
      });
    }
  }, [profile]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="rounded-[30px] border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Business Settings</CardTitle>
              <CardDescription>Manage your professional identity and tax details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Business Name</Label>
              <Input 
                value={formData.businessName} 
                onChange={e => setFormData({...formData, businessName: e.target.value})} 
                placeholder="e.g. Acme Corporation" 
                required 
                className="rounded-xl h-12 bg-gray-50 border-none px-4"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">GST Number (Optional)</Label>
                <Input 
                  value={formData.gstNumber} 
                  onChange={e => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})} 
                  placeholder="e.g. 27ABCDE1234F1Z5" 
                  className="rounded-xl h-12 bg-gray-50 border-none px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">PAN Number (Optional)</Label>
                <Input 
                  value={formData.panNumber} 
                  onChange={e => setFormData({...formData, panNumber: e.target.value.toUpperCase()})} 
                  placeholder="e.g. ABCDE1234F" 
                  className="rounded-xl h-12 bg-gray-50 border-none px-4"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20 text-lg font-bold transition-all hover:scale-[1.01] active:scale-[0.99]">
                {isLoading ? 'Updating...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
        <div className="p-3 bg-blue-100 rounded-2xl h-fit">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1 leading-none">Security Info</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            Your GST and PAN numbers are stored securely and will be used to automatically generate compliant invoices. Leave them blank if you don't require them.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ invoices, expenses }: { invoices: Invoice[], expenses: Expense[] }) {
  const [reportType, setReportType] = useState<'yearly' | 'quarterly' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedQuarter, setSelectedQuarter] = useState(getQuarter(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));

  const reportData = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (reportType === 'yearly') {
      startDate = startOfYear(new Date(selectedYear, 0, 1));
      endDate = endOfYear(new Date(selectedYear, 11, 31));
    } else if (reportType === 'quarterly') {
      const firstMonthOfQuarter = (selectedQuarter - 1) * 3;
      startDate = startOfQuarter(new Date(selectedYear, firstMonthOfQuarter, 1));
      endDate = endOfQuarter(new Date(selectedYear, firstMonthOfQuarter, 1));
    } else {
      startDate = startOfMonth(new Date(selectedYear, selectedMonth, 1));
      endDate = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    }

    const filteredInvoices = invoices.filter(inv => {
      const date = parseISO(inv.date);
      return date >= startDate && date <= endDate;
    });

    const filteredExpenses = expenses.filter(exp => {
      const date = parseISO(exp.date);
      return date >= startDate && date <= endDate;
    });

    const revenue = filteredInvoices.reduce((acc, curr) => acc + (curr.totalAmount - (curr.totalAmount * (curr.discount || 0) / 100)), 0);
    const costOfGoods = filteredInvoices.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    const operatingExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const grossProfit = revenue - costOfGoods;
    const netProfit = grossProfit - operatingExpenses;

    // Chart Data breakdown
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const breakdown = months.map(m => {
      const monthStart = startOfMonth(m);
      const monthEnd = endOfMonth(m);
      
      const mInvoices = filteredInvoices.filter(inv => {
        const d = parseISO(inv.date);
        return d >= monthStart && d <= monthEnd;
      });
      
      const mExpenses = filteredExpenses.filter(exp => {
        const d = parseISO(exp.date);
        return d >= monthStart && d <= monthEnd;
      });

      const mRevenue = mInvoices.reduce((acc, curr) => acc + (curr.totalAmount - (curr.totalAmount * (curr.discount || 0) / 100)), 0);
      const mExp = mExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const mProfit = mInvoices.reduce((acc, curr) => acc + (curr.profit || 0), 0) - mExp;

      return {
        name: format(m, 'MMM'),
        revenue: mRevenue,
        expenses: mExp,
        profit: mProfit
      };
    });

    return { revenue, operatingExpenses, grossProfit, netProfit, breakdown, costOfGoods };
  }, [invoices, expenses, reportType, selectedYear, selectedQuarter, selectedMonth]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Reports</h2>
          <p className="text-gray-400 font-medium">Detailed performance analytics and financial breakdowns</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-50">
          <Tabs value={reportType} onValueChange={(val: any) => setReportType(val)} className="w-auto">
            <TabsList className="bg-gray-50 p-1 rounded-xl h-10">
              <TabsTrigger value="yearly" className="rounded-lg text-xs font-bold px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Yearly</TabsTrigger>
              <TabsTrigger value="quarterly" className="rounded-lg text-xs font-bold px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Quarterly</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg text-xs font-bold px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />

          <Select value={selectedYear.toString()} onValueChange={val => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-[100px] h-10 rounded-xl bg-gray-50 border-none font-bold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {reportType === 'quarterly' && (
            <Select value={selectedQuarter.toString()} onValueChange={val => setSelectedQuarter(parseInt(val))}>
              <SelectTrigger className="w-[100px] h-10 rounded-xl bg-gray-50 border-none font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(q => (
                  <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {reportType === 'monthly' && (
            <Select value={selectedMonth.toString()} onValueChange={val => setSelectedMonth(parseInt(val))}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl bg-gray-50 border-none font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="Total Revenue" value={reportData.revenue} icon={<DollarSign />} trend="+12%" color="primary" />
        <ReportCard title="Total Expenses" value={reportData.operatingExpenses} icon={<TrendingDown />} trend="+5%" color="red" />
        <ReportCard title="Gross Profit" value={reportData.grossProfit} icon={<TrendingUp />} trend="+18%" color="emerald" />
        <ReportCard title="Net Profit" value={reportData.netProfit} icon={<ArrowUpRight />} trend="+22%" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[30px] border-none shadow-sm p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Financial Performance</h3>
              <p className="text-sm text-gray-400">Revenue vs Profit over the selected period</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.breakdown}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4318FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F7FE" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12, fontWeight: 500}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4318FF" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[30px] border-none shadow-sm p-8 bg-white">
          <h3 className="text-xl font-bold mb-1">Cost Structure</h3>
          <p className="text-sm text-gray-400 mb-8">Distribution of expenditures</p>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cost of Goods', value: reportData.costOfGoods },
                    { name: 'Operating Exp', value: reportData.operatingExpenses },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#4318FF" />
                  <Cell fill="#FF5B5B" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-black">₹{((reportData.costOfGoods + reportData.operatingExpenses) / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Cost</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-bold text-gray-600">Goods Cost</span>
              </div>
              <span className="text-sm font-black">₹{reportData.costOfGoods.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-gray-600">Operating</span>
              </div>
              <span className="text-sm font-black">₹{reportData.operatingExpenses.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon, trend, color }: { title: string, value: number, icon: React.ReactNode, trend: string, color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-50 text-emerald-500',
    red: 'bg-red-50 text-red-500',
    indigo: 'bg-indigo-50 text-indigo-500',
  };

  return (
    <Card className="rounded-[30px] border-none shadow-sm p-6 bg-white hover:scale-[1.02] transition-transform cursor-pointer group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-4 rounded-2xl shadow-sm ${colors[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400">{title}</p>
          <div className="flex items-center gap-2">
            <h4 className="text-2xl font-black tracking-tight text-[#1B2559]">₹{value.toLocaleString()}</h4>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
        <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-500 rounded-lg">{trend}</span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-[8px]">vs previous period</span>
      </div>
    </Card>
  );
}

function Login() {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => {
      toast.error('Login failed: ' + err.message);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6">
      <div className="max-w-md w-full">
        <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
          <div className="bg-primary p-12 flex flex-col items-center text-white text-center">
            <div className="bg-white/20 p-5 rounded-3xl mb-6 backdrop-blur-md">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">ProfitPulse</h1>
            <p className="text-white/70 font-medium tracking-tight">Enterprise Billing & Inventory OS</p>
          </div>
          <CardContent className="p-12">
            <div className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Business Login</h2>
                <p className="text-sm text-gray-400 font-medium">Access your enterprise dashboard</p>
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full h-16 rounded-[20px] text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6 mr-3" alt="Google" />
                Continue with Google
              </Button>
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">
                  Secure Cloud Sync Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    console.log('Auth state changed:', { user: user?.email, loading });
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [user, loading]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600">Something went wrong while loading the app. Please check the console for details.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Reload App</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing OS...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
