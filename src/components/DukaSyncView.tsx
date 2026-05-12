import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Smartphone, 
  ArrowRight,
  History,
  QrCode,
  Store,
  ChevronRight,
  Filter,
  Globe,
  Check,
  Printer,
  Settings,
  Building,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { updateBusinessProfile, UserProfile } from '../services/userService';
import { 
  subscribeToProducts, 
  subscribeToLocations, 
  subscribeToInventory,
  subscribeToSales,
  Product,
  Location,
  InventoryItem,
  Sale,
  createProduct,
  createLocation,
  recordSale,
  updateStockLevel
} from '../services/inventoryService';

export default function DukaSyncView() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [view, setView] = useState<'overview' | 'inventory' | 'sales' | 'pos' | 'settings' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [cart, setCart] = useState<Array<{ product: Product, quantity: number }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash' | 'credit'>('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState({
    customerName: '',
    notes: ''
  });

  const [businessSettings, setBusinessSettings] = useState({
    name: '',
    address: '',
    phone: '',
    currency: 'KES'
  });

  const [currency, setCurrency] = useState(() => localStorage.getItem('dukaCurrency') || 'KES');

  useEffect(() => {
    if (profile?.business) {
      setBusinessSettings({
        name: profile.business.name || '',
        address: profile.business.address || '',
        phone: profile.business.phone || '',
        currency: profile.business.currency || 'KES'
      });
      // Sync local currency with business profile if preferred
      if (profile.business.currency) {
        setCurrency(profile.business.currency);
      }
    }
  }, [profile]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    cost: 0,
    unit: 'pcs'
  });
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('dukaCurrency', newCurrency);
  };

  useEffect(() => {
    if (!user) return;
    
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubLocations = subscribeToLocations(user.uid, (data) => {
      setLocations(data);
      if (data.length > 0 && !activeLocation) {
        setActiveLocation(data[0]);
      }
    });

    return () => {
      unsubProducts();
      unsubLocations();
    };
  }, [user]);

  useEffect(() => {
    if (!activeLocation) return;
    const unsubInv = subscribeToInventory(activeLocation.id, setInventory);
    const unsubSales = subscribeToSales(activeLocation.id, setSales);
    return () => {
      unsubInv();
      unsubSales();
    };
  }, [activeLocation]);

  const handleRestock = async () => {
    if (!activeLocation || !selectedProduct || restockAmount <= 0) return;
    await updateStockLevel(activeLocation.id, selectedProduct.id, restockAmount);
    setShowRestock(false);
    setRestockAmount(0);
    setSelectedProduct(null);
  };

  const addToCart = (product: Product) => {
    const inv = inventory.find(i => i.productId === product.id);
    const existing = cart.find(item => item.product.id === product.id);
    const currentQtyInCart = existing?.quantity || 0;

    if (inv && inv.quantity <= currentQtyInCart) return; // Stock limit check

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
        ? { ...item, quantity: item.quantity + 1 } 
        : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const inv = inventory.find(i => i.productId === productId);
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (inv && inv.quantity < newQty && delta > 0) return item; // Stock limit
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (!user || !activeLocation || cart.length === 0) return;
    
    setIsProcessingSale(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        total: cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0),
        paymentMethod,
        locationId: activeLocation.id,
        userId: user.uid
      };

      const saleId = await recordSale(saleData);
      setLastSale({ ...saleData, id: saleId });
      setCart([]);
      setShowSaleSuccess(true);
    } catch (error) {
      console.error("Sale failed:", error);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const stats = {
    totalValue: products.reduce((acc, p) => {
      const inv = inventory.find(i => i.productId === p.id);
      return acc + (p.price * (inv?.quantity || 0));
    }, 0),
    lowStock: inventory.filter(i => i.quantity <= i.minStockLevel).length,
    totalItems: inventory.reduce((acc, i) => acc + i.quantity, 0)
  };

  const exportReceiptAsPng = async () => {
    const el = document.getElementById('receipt-print-zone');
    if (!el) return;
    
    setIsExporting(true);
    try {
      // Small delay to ensure any transient states (like animations) settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2, // High quality
      });
      
      const link = document.createElement('a');
      link.download = `duka-receipt-${lastSale?.id?.slice(-8).toUpperCase() || 'TRX'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const salesReport = React.useMemo(() => {
    if (sales.length === 0) return null;
    
    const monthlyData: Record<string, any> = {};
    const productSales: Record<string, { name: string, units: number, revenue: number, profit: number }> = {};
    
    sales.forEach(sale => {
      const date = sale.timestamp?.toDate() || new Date();
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          revenue: 0,
          profit: 0,
          units: 0,
          rawDate: date
        };
      }
      
      monthlyData[monthKey].revenue += sale.total;
      
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const cost = product.cost || 0;
          const profit = (item.price - cost) * item.quantity;
          monthlyData[monthKey].profit += profit;
          monthlyData[monthKey].units += item.quantity;

          if (!productSales[product.id]) {
            productSales[product.id] = { name: product.name, units: 0, revenue: 0, profit: 0 };
          }
          productSales[product.id].units += item.quantity;
          productSales[product.id].revenue += item.price * item.quantity;
          productSales[product.id].profit += profit;
        }
      });
    });

    const chartData = Object.values(monthlyData).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    const bestSellers = Object.values(productSales).sort((a, b) => b.units - a.units).slice(0, 5);
    
    const totalProfit = chartData.reduce((acc, curr) => acc + curr.profit, 0);
    const totalRevenue = chartData.reduce((acc, curr) => acc + curr.revenue, 0);
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { chartData, bestSellers, totalProfit, totalRevenue, averageMargin };
  }, [sales, products]);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                <Store size={20} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-neutral-900">Duka Sync</h1>
            </div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Distributed Retail Intelligence</p>
          </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-neutral-100">
                <Globe size={16} className="text-rose-600 ml-2" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-tight outline-none pr-8 py-1 cursor-pointer"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="UGX">Ugandan Shilling (UGX)</option>
                  <option value="TZS">Tanzanian Shilling (TZS)</option>
                  <option value="RWF">Rwandan Franc (RWF)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-neutral-100">
                <MapPin size={16} className="text-rose-600 ml-2" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-tight outline-none pr-8 py-1 cursor-pointer"
                  value={activeLocation?.id || ''}
                  onChange={(e) => setActiveLocation(locations.find(l => l.id === e.target.value) || null)}
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                  {locations.length === 0 && <option value="">No Dukas Linked</option>}
                </select>
              </div>

              <button 
                onClick={() => setShowAddLocation(true)}
                className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/10"
                title="Link New Duka"
              >
                <Plus size={18} />
              </button>
            </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Command Center', icon: TrendingUp },
              { id: 'inventory', label: 'Stock Manifest', icon: Package },
              { id: 'pos', label: 'Sales Terminal', icon: Smartphone },
              { id: 'sales', label: 'Trade Ledger', icon: History },
              { id: 'reports', label: 'Intelligence', icon: BarChartIcon },
              { id: 'settings', label: 'Business Profile', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  view === item.id 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                  : 'bg-white text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </div>
                {view === item.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Overview Stats */}
            {view === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Inventory Valuation</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-rose-600">{currency}</span>
                      <span className="text-4xl font-black tracking-tighter text-neutral-900">{stats.totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Critial Stock Warnings</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter text-amber-500">{stats.lowStock}</span>
                        <span className="text-xs font-black uppercase tracking-tight text-neutral-400">SKUs</span>
                      </div>
                      {stats.lowStock > 0 && (
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <AlertTriangle size={20} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-rose-600/5 p-6 rounded-3xl border-2 border-rose-600 border-dashed flex flex-col justify-center items-center text-center cursor-pointer hover:bg-rose-600/10 transition-colors" onClick={() => setShowAddProduct(true)}>
                    <QrCode size={32} className="text-rose-600 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Register New SKU</p>
                  </div>
                </div>
              </div>
            )}

            {view === 'overview' && stats.lowStock > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Restock Suggested
                  </h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:opacity-75 transition-opacity">Auto-Generate Order</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventory.filter(i => i.quantity <= i.minStockLevel).map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-neutral-400">
                            <Package size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-neutral-900">{product.name}</p>
                            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Curr: {item.quantity} / Min: {item.minStockLevel}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowRestock(true);
                          }}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/10"
                        >
                          Order
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content View Switcher */}
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden"
              >
                {view === 'inventory' && (
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                       <div className="relative flex-1 w-full">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
                          <input 
                            type="text"
                            placeholder="Search Manifest..."
                            className="w-full h-12 pl-12 pr-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                       </div>
                       <button 
                         onClick={() => {
                           // If we have products, just open the restock for the first one or a picker
                           // For now, let's just make it open the product list if not there
                           setView('inventory');
                         }}
                         className="flex items-center gap-2 px-6 h-12 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                       >
                          <Plus size={16} />
                          Add Unit
                       </button>
                    </div>

                    <div className="space-y-4">
                      {products.filter(p => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((product) => {
                        const inv = inventory.find(i => i.productId === product.id);
                        const isLow = inv && inv.quantity <= inv.minStockLevel;
                        
                        return (
                          <div key={product.id} className="group p-4 bg-white border border-neutral-100 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                <Package size={20} />
                              </div>
                              <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">{product.name}</h3>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                  <span>SKU: {product.sku}</span>
                                  <span>•</span>
                                  <span>{product.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Local Stock</p>
                                <p className={`text-xl font-black tracking-tighter ${isLow ? 'text-amber-500' : 'text-neutral-900'}`}>
                                  {inv?.quantity || 0} <span className="text-[10px] text-neutral-400 uppercase tracking-tight font-black">{product.unit}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Price/Unit</p>
                                <p className="text-sm font-black tracking-tight text-neutral-900">
                                  {currency} {product.price.toLocaleString()}
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowRestock(true);
                                }}
                                className="p-3 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'pos' && (
                  <div className="flex flex-col lg:flex-row h-[600px]">
                    {/* Catalog */}
                    <div className="flex-1 flex flex-col border-r border-neutral-100 p-6 bg-neutral-50/30">
                      <div className="relative mb-6">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
                        <input 
                          type="text"
                          placeholder="Search products..."
                          className="w-full h-12 pl-11 pr-4 bg-white border border-neutral-100 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-2">
                        {products.filter(p => 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((product) => {
                          const inv = inventory.find(i => i.productId === product.id);
                          const currentInCart = cart.find(c => c.product.id === product.id)?.quantity || 0;
                          const available = (inv?.quantity || 0) - currentInCart;

                          return (
                            <button
                              key={product.id}
                              onClick={() => addToCart(product)}
                              disabled={available <= 0}
                              className={`text-left p-4 rounded-2xl border transition-all ${
                                available <= 0 
                                ? 'bg-neutral-50 border-neutral-100 opacity-50 grayscale' 
                                : 'bg-white border-neutral-100 hover:border-rose-300 hover:shadow-md'
                              }`}
                            >
                              <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-400 mb-3">
                                <Package size={18} />
                              </div>
                              <p className="text-xs font-black uppercase tracking-tight text-neutral-900 line-clamp-1">{product.name}</p>
                              <p className="text-[10px] font-black text-rose-600 mt-1">{currency} {product.price.toLocaleString()}</p>
                              <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-2">Stock: {inv?.quantity || 0}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cart */}
                    <div className="w-full lg:w-80 flex flex-col p-6 bg-white shrink-0">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <ShoppingCart size={16} className="text-rose-600" />
                          Order Cart
                        </h3>
                        {cart.length > 0 && (
                          <button onClick={() => setCart([])} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-rose-600">Clear</button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black uppercase tracking-tight text-neutral-900 truncate">{item.product.name}</p>
                              <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{currency} {item.product.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center bg-neutral-50 rounded-lg p-1">
                              <button onClick={() => updateCartQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-rose-600">-</button>
                              <span className="w-6 text-center text-[10px] font-black">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-rose-600">+</button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-neutral-300 hover:text-rose-600 p-1"
                            >
                              <Plus size={14} className="rotate-45" />
                            </button>
                          </div>
                        ))}
                        {cart.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-neutral-100 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Cart Empty</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-6 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Due</p>
                          <p className="text-xl font-black tracking-tighter text-neutral-900">{currency} {cartTotal.toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(['cash', 'mpesa', 'credit'] as const).map(method => (
                            <button
                              key={method}
                              onClick={() => setPaymentMethod(method)}
                              className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                                paymentMethod === method 
                                ? 'bg-neutral-900 text-white border-neutral-900' 
                                : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={handleCheckout}
                          disabled={cart.length === 0 || isProcessingSale}
                          className="w-full h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                          {isProcessingSale ? 'Syncing...' : 'Complete Sale'}
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {view === 'sales' && (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900 italic">Trade Ledger</h2>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Immutable Transaction History</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                        <Filter size={14} className="text-neutral-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">All Methods</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {sales.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()).map((sale) => (
                        <div key={sale.id} className="p-6 bg-white border border-neutral-100 rounded-3xl hover:border-rose-200 transition-all group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                sale.paymentMethod === 'mpesa' ? 'bg-emerald-50 text-emerald-600' :
                                sale.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                                {sale.paymentMethod === 'mpesa' ? <Smartphone size={20} /> :
                                 sale.paymentMethod === 'cash' ? <TrendingUp size={20} /> :
                                 <Plus size={20} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 italic">#{sale.id.slice(-6).toUpperCase()}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    sale.paymentMethod === 'mpesa' ? 'bg-emerald-100 text-emerald-700' :
                                    sale.paymentMethod === 'cash' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                  }`}>
                                    {sale.paymentMethod}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                  {sale.timestamp?.toDate().toLocaleString() || 'Syncing...'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Items</p>
                                <p className="text-sm font-black tracking-tight text-neutral-900">
                                  {sale.items.reduce((acc, i) => acc + i.quantity, 0)} Units
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">Settlement</p>
                                <p className="text-xl font-black tracking-tighter text-rose-600">
                                  {currency} {sale.total.toLocaleString()}
                                </p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLastSale(sale);
                                  setShowReceiptForm(true);
                                }}
                                className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="Issue Receipt"
                              >
                                <Printer size={18} />
                              </button>
                              <button className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-300 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded detail placeholder */}
                          <div className="mt-6 pt-6 border-t border-neutral-50 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto overflow-hidden transition-all duration-300">
                            {sale.items.map((item, idx) => {
                              const prod = products.find(p => p.id === item.productId);
                              return (
                                <div key={idx} className="flex flex-col">
                                  <span className="text-[8px] font-black uppercase text-neutral-400">{prod?.name || 'Unknown'}</span>
                                  <span className="text-[10px] font-bold text-neutral-600">{item.quantity} x {currency}{item.price}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {sales.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-[2.5rem]">
                           <History size={40} className="mx-auto text-neutral-200 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">No transactions recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {view === 'reports' && (
                  <div className="p-8" id="report-print-zone">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900 italic">Financial Intelligence</h2>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
                      </div>
                      <button 
                         onClick={() => window.print()}
                         className="flex items-center gap-2 px-6 h-12 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/10"
                      >
                         <Printer size={16} />
                         Export Report
                      </button>
                    </div>

                    {!salesReport ? (
                      <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-[2.5rem]">
                        <BarChartIcon size={40} className="mx-auto text-neutral-200 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Insufficient trade data for analysis</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                             <p className="text-[8px] font-black uppercase tracking-widest text-rose-600 mb-4">Cumulative Revenue</p>
                             <p className="text-2xl font-black tracking-tighter text-neutral-900">{currency} {salesReport.totalRevenue.toLocaleString()}</p>
                           </div>
                           <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                             <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-4">Estimated Gross Profit</p>
                             <p className="text-2xl font-black tracking-tighter text-neutral-900">{currency} {salesReport.totalProfit.toLocaleString()}</p>
                           </div>
                           <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                             <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-4">Avg. Profit Margin</p>
                             <p className="text-2xl font-black tracking-tighter text-neutral-900">{salesReport.averageMargin.toFixed(1)}%</p>
                           </div>
                        </div>

                        {/* Revenue Bar Chart */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                          <h3 className="text-sm font-black uppercase tracking-widest mb-8">Monthly Revenue vs Profit</h3>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={salesReport.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#A3A3A3' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#A3A3A3' }} />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }}
                                />
                                <Bar dataKey="revenue" fill="#E11D48" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Best Sellers */}
                          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-8">Best Sellers (Units)</h3>
                            <div className="space-y-6">
                              {salesReport.bestSellers.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center text-[10px] font-black text-neutral-400">
                                      0{idx + 1}
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-tight text-neutral-900 italic">{item.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-rose-600">{item.units} <span className="text-[10px] text-neutral-400">Units</span></p>
                                    <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Revenue: {currency} {item.revenue.toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Profit Distribution */}
                          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-8">Profit Contribution</h3>
                            <div className="h-[240px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={salesReport.bestSellers}
                                    dataKey="profit"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                  >
                                    {salesReport.bestSellers.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={['#E11D48', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'][index % 5]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {view === 'settings' && (
                  <div className="p-10">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                          <Building size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Business Profile</h2>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Universal Business Identity</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Official Business Name</label>
                          <input 
                            className="w-full h-14 px-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none transition-all"
                            value={businessSettings.name}
                            onChange={e => setBusinessSettings({...businessSettings, name: e.target.value})}
                            placeholder="e.g. Duka Sync Enterprises"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">HQ Physical Address</label>
                            <input 
                              className="w-full h-14 px-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none transition-all"
                              value={businessSettings.address}
                              onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})}
                              placeholder="Street, City, Country"
                            />
                          </div>
                           <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Official Contact Phone</label>
                            <input 
                              className="w-full h-14 px-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none transition-all"
                              value={businessSettings.phone}
                              onChange={e => setBusinessSettings({...businessSettings, phone: e.target.value})}
                              placeholder="+254..."
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Default Trade Currency</label>
                          <select 
                            className="w-full h-14 px-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none transition-all cursor-pointer"
                            value={businessSettings.currency}
                            onChange={e => setBusinessSettings({...businessSettings, currency: e.target.value})}
                          >
                            <option value="KES">Kenyan Shilling (KES)</option>
                            <option value="UGX">Ugandan Shilling (UGX)</option>
                            <option value="TZS">Tanzanian Shilling (TZS)</option>
                            <option value="RWF">Rwandan Franc (RWF)</option>
                            <option value="USD">US Dollar (USD)</option>
                          </select>
                        </div>

                        <button 
                          onClick={async () => {
                            if (!user) return;
                            await updateBusinessProfile(user.uid, businessSettings);
                            setCurrency(businessSettings.currency);
                            alert('Business profile synchronized successfully!');
                          }}
                          className="w-full h-16 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 group mt-4"
                        >
                          <Check size={16} className="text-rose-600" />
                          Update Global Identity
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </div>
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddProduct(false)}
               className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden"
            >
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Register SKU</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Product Name</label>
                  <input 
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">SKU / Code</label>
                  <input 
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category</label>
                  <input 
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Price ({currency})</label>
                  <input 
                    type="number"
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Cost ({currency})</label>
                  <input 
                    type="number"
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newProduct.cost}
                    onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    await createProduct(newProduct);
                    setShowAddProduct(false);
                    setNewProduct({ name: '', sku: '', category: '', price: 0, cost: 0, unit: 'pcs' });
                  }}
                  className="flex-1 h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                >
                  Confirm Registration
                </button>
                <button 
                  onClick={() => setShowAddProduct(false)}
                  className="px-8 h-14 bg-neutral-100 text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddLocation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddLocation(false)}
               className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
            >
              <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Link New Duka</h2>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Shop Name</label>
                  <input 
                    placeholder="e.g. Nairobi Central"
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newLocation.name}
                    onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Physical Address</label>
                  <input 
                    placeholder="Street, Building, Floor"
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newLocation.address}
                    onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Phone Number</label>
                  <input 
                    placeholder="+254..."
                    className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                    value={newLocation.phone}
                    onChange={e => setNewLocation({...newLocation, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    if (!user) return;
                    await createLocation({ ...newLocation, ownerId: user.uid });
                    setShowAddLocation(false);
                    setNewLocation({ name: '', address: '', phone: '' });
                  }}
                  className="flex-1 h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                >
                  Confirm Unit
                </button>
                <button 
                  onClick={() => setShowAddLocation(false)}
                  className="px-8 h-14 bg-neutral-100 text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRestock && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowRestock(false)}
               className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic leading-none">{selectedProduct.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Refock Stock Unit</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Additional Units ({selectedProduct.unit})</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full h-16 px-6 bg-neutral-50 rounded-2xl text-2xl font-black focus:ring-2 ring-rose-600 outline-none"
                    value={restockAmount}
                    onChange={e => setRestockAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleRestock}
                  className="flex-1 h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                >
                  Update Inventory
                </button>
                <button 
                  onClick={() => setShowRestock(false)}
                  className="px-8 h-14 bg-neutral-100 text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSaleSuccess && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-2">Sale Synchronized</h2>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-8">Stock levels updated locally & cloud</p>
              
              <div className="space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowSaleSuccess(false);
                    setShowReceiptForm(true);
                  }}
                  className="w-full h-16 bg-neutral-900 border border-rose-600/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(225,29,72,0.3)] group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600/0 via-rose-600/10 to-rose-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Printer size={14} className="text-rose-600 group-hover:scale-110 transition-transform relative z-10" />
                  <span className="relative z-10">Generate Receipt</span>
                </motion.button>
                <button 
                  onClick={() => {
                    setShowSaleSuccess(false);
                    setView('sales');
                  }}
                  className="w-full h-14 bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Go to Ledger
                </button>
                <button 
                  onClick={() => {
                    setShowSaleSuccess(false);
                    setReceiptInfo({ customerName: '', notes: '' });
                  }}
                  className="w-full h-14 bg-white text-neutral-400 hover:text-neutral-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  New Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptForm && lastSale && activeLocation && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowReceiptForm(false)}
               className="absolute inset-0 bg-neutral-900/90 backdrop-blur-lg"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
              {/* Form Side */}
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Receipt Details</h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer Name (Optional)</label>
                    <input 
                      placeholder="e.g. Mary Atieno"
                      className="w-full h-14 px-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none"
                      value={receiptInfo.customerName}
                      onChange={e => setReceiptInfo({...receiptInfo, customerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Transaction Notes</label>
                    <textarea 
                      placeholder="e.g. Partial credit payoff..."
                      className="w-full min-h-[120px] p-6 bg-neutral-50 rounded-2xl text-sm font-black focus:ring-2 ring-rose-600 outline-none resize-none"
                      value={receiptInfo.notes}
                      onChange={e => setReceiptInfo({...receiptInfo, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsPrinting(true);
                      setTimeout(() => {
                        window.print();
                        setIsPrinting(false);
                      }, 300);
                    }}
                    disabled={isPrinting || isExporting}
                    className="h-16 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden border border-rose-600/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600/20 to-rose-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-600/40 group-hover:rotate-12 transition-transform">
                      {isPrinting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Printer size={14} />}
                    </div>
                    {isPrinting ? 'Preparing...' : 'Print'}
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportReceiptAsPng}
                    disabled={isPrinting || isExporting}
                    className="h-16 bg-white text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 border-neutral-100 flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                     <div className="w-8 h-8 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 group-hover:text-rose-600 transition-colors">
                      {isExporting ? <div className="w-4 h-4 border-2 border-neutral-200 border-t-rose-600 rounded-full animate-spin" /> : <ImageIcon size={14} />}
                    </div>
                    {isExporting ? 'Saving...' : 'Save PNG'}
                  </motion.button>

                  <button 
                    onClick={() => setShowReceiptForm(false)}
                    className="col-span-2 h-14 bg-neutral-50 text-neutral-400 hover:text-neutral-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Close Transaction Window
                  </button>
                </div>
              </motion.div>

              {/* Preview Side */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white p-8 shadow-2xl overflow-hidden print:p-0 print:shadow-none w-full max-w-[80mm] mx-auto border-t-8 border-rose-600 rounded-b-2xl md:rounded-2xl"
                id="receipt-print-zone"
              >
                <div className="text-center mb-8">
                  <h1 className="text-xl font-black uppercase tracking-tight mb-1">
                    {profile?.business?.name || activeLocation.name}
                  </h1>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
                    {profile?.business?.address || activeLocation.address}
                  </p>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
                    TEL: {profile?.business?.phone || activeLocation.phone}
                  </p>
                </div>

                <div className="border-t-2 border-dotted border-neutral-200 my-4" />

                <div className="space-y-4 font-mono">
                   <div className="flex justify-between text-[9px] font-bold uppercase">
                     <span>Receipt:</span>
                     <span>#{lastSale.id?.slice(-8).toUpperCase() || 'NEW-TRX'}</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-bold uppercase">
                     <span>Date:</span>
                     <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-bold uppercase">
                     <span>Cashier:</span>
                     <span>{profile?.displayName || user?.email?.split('@')[0] || 'System'}</span>
                   </div>

                   {receiptInfo.customerName && (
                     <div className="flex justify-between text-[9px] font-bold uppercase">
                       <span>Customer:</span>
                       <span className="max-w-[120px] truncate">{receiptInfo.customerName}</span>
                     </div>
                   )}

                   <div className="border-t-2 border-dotted border-neutral-200 my-4" />

                   <table className="w-full text-[9px] font-bold uppercase">
                     <thead>
                       <tr className="border-b border-neutral-100">
                         <th className="py-2 text-left">Item [Qty]</th>
                         <th className="py-2 text-right">Price</th>
                         <th className="py-2 text-right">Total</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-50">
                       {lastSale.items.map((item: any, idx: number) => {
                         const product = products.find(p => p.id === item.productId);
                         return (
                           <tr key={idx}>
                             <td className="py-3">
                               {product?.name || 'Item'}
                               <span className="block text-[8px] text-neutral-400">x{item.quantity}</span>
                             </td>
                             <td className="py-3 text-right">{currency}{item.price.toLocaleString()}</td>
                             <td className="py-3 text-right">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>

                   <div className="border-t-2 border-dotted border-neutral-200 my-4" />

                   <div className="space-y-1">
                     <div className="flex justify-between text-[9px] font-bold">
                        <span>SUBTOTAL</span>
                        <span>{currency} {lastSale.total.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-[9px] font-bold">
                        <span>VAT (0%)</span>
                        <span>{currency} 0.00</span>
                     </div>
                     <div className="flex justify-between text-base font-black leading-none pt-2">
                        <span>TOTAL</span>
                        <span className="text-rose-600">{currency} {lastSale.total.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-[8px] font-bold text-neutral-400 pt-2">
                        <span>PAYMENT VIA:</span>
                        <span className="uppercase">{lastSale.paymentMethod}</span>
                     </div>
                   </div>

                   {receiptInfo.notes && (
                     <div className="mt-4 pt-4 border-t border-neutral-100 italic text-[8px] text-neutral-500 leading-tight">
                        <span className="font-bold uppercase not-italic block mb-1">Notes:</span>
                        {receiptInfo.notes}
                     </div>
                   )}

                   <div className="border-t-2 border-dotted border-neutral-200 my-6" />

                   <div className="text-center space-y-2">
                      <p className="text-[10px] font-black italic tracking-tight">*** Thank You! ***</p>
                      <p className="text-[8px] font-bold text-neutral-400 leading-tight">
                        Items once sold are not returnable.<br/>
                        Goods should be inspected upon delivery.
                      </p>
                      <div className="flex items-center justify-center gap-1 text-[7px] font-black text-rose-500 pt-2 group cursor-help">
                         <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                         DUKASYNC CLOUD VERIFIED
                      </div>
                      <div className="flex justify-center pt-4 opacity-70">
                        <div className="w-16 h-16 bg-neutral-50 p-1 border border-neutral-100 rounded-lg">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-900">
                            <rect width="100" height="100" fill="white" />
                            <path d="M10 10h30v30h-30zM10 60h30v30h-30zM60 10h30v30h-30z" fill="currentColor" />
                            <rect x="20" y="20" width="10" height="10" fill="white" />
                            <rect x="20" y="70" width="10" height="10" fill="white" />
                            <rect x="70" y="20" width="10" height="10" fill="white" />
                            <path d="M50 50h10v10h-10zM60 60h10v10h-10zM70 70h10v10h-10zM80 80h10v10h-10zM50 80h10v10h-10zM80 50h10v10h-10zM50 65h5v5h-5zM65 50h5v5h-5z" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[6px] font-bold text-neutral-400 mt-2">Scan for e-receipt verification</p>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

