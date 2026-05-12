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
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToProducts, 
  subscribeToLocations, 
  subscribeToInventory,
  Product,
  Location,
  InventoryItem,
  createProduct,
  createLocation,
  recordSale
} from '../services/inventoryService';

export default function DukaSyncView() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [view, setView] = useState<'overview' | 'inventory' | 'sales' | 'pos'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currency, setCurrency] = useState(() => localStorage.getItem('dukaCurrency') || 'KES');
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    cost: 0,
    unit: 'pcs'
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
    return () => unsubInv();
  }, [activeLocation]);

  const stats = {
    totalValue: products.reduce((acc, p) => {
      const inv = inventory.find(i => i.productId === p.id);
      return acc + (p.price * (inv?.quantity || 0));
    }, 0),
    lowStock: inventory.filter(i => i.quantity <= i.minStockLevel).length,
    totalItems: inventory.reduce((acc, i) => acc + i.quantity, 0)
  };

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
                        <button className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/10">Order</button>
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
                       <button className="flex items-center gap-2 px-6 h-12 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
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
                              <button className="p-3 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                <ArrowRight size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'pos' && (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                      <Smartphone size={32} />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">Mobile POS Ready</h2>
                      <p className="text-xs font-bold text-neutral-500 uppercase leading-relaxed mt-2">
                        Scan items directly with your camera to process sales in the field. M-PESA integration active.
                      </p>
                    </div>
                    <button className="px-8 h-12 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20">
                       Launch Terminal
                    </button>
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
    </div>
  );
}

