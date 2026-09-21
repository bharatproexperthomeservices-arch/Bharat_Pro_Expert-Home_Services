import React, { useState } from 'react';
import { InventoryItem, HubLocation } from '../../types';
import { INITIAL_INVENTORY } from '../../data';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Layers, 
  Clock, 
  ArrowDownToLine, 
  ShoppingCart, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface AdminInventorySuppliesProps {
  hubs: HubLocation[];
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminInventorySupplies: React.FC<AdminInventorySuppliesProps> = ({
  hubs,
  onAuditLog
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'STOCK_DIRECTORY' | 'LOW_STOCK_ALERTS' | 'PURCHASE_ORDERS'>('STOCK_DIRECTORY');

  // Filtered inventory
  const filteredItems = inventory.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesHub = selectedHub === 'ALL' || item.hubId === selectedHub;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesHub && matchesSearch;
  });

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;

  // Reorder action
  const handleReorder = (item: InventoryItem) => {
    const qty = window.prompt(`Enter replenishment quantity for ${item.name}:`, "50");
    if (!qty || isNaN(parseInt(qty))) return;

    const updated = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStock: i.currentStock + parseInt(qty)
        };
      }
      return i;
    });

    setInventory(updated);
    onAuditLog?.('REORDER_INVENTORY', item.id, `Replenished ${qty} units for ${item.name} at ${item.hubName}`);
    alert(`Purchase Order Created: ${qty} units of ${item.name} dispatched to ${item.hubName}. Stock updated.`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 12 &bull; Inventory &amp; Supplies
            </span>
            <span className="text-xs text-[#8E8E93]">Diversey Chemicals &amp; Professional Machinery</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Cleaning Kit Stock &amp; Hub Asset Inventory
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Track industrial chemicals (Taski R2/R6/Suma), Karcher injection-extraction machines, 
            microfiber bundles, PPE equipment, and partner kit replenishment across all operational hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{lowStockCount} Items Below Threshold</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'STOCK_DIRECTORY', label: `Hub Inventory Stock (${inventory.length})`, icon: Package },
          { id: 'LOW_STOCK_ALERTS', label: `Replenishment Alerts (${lowStockCount})`, icon: AlertTriangle },
          { id: 'PURCHASE_ORDERS', label: 'Supplier Purchase Orders & Deliveries', icon: ShoppingCart }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STOCK DIRECTORY */}
      {activeTab === 'STOCK_DIRECTORY' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chemical, machine, SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CHEMICAL">Chemicals (Taski/Suma)</option>
                <option value="EQUIPMENT">Machinery &amp; Scrubbers</option>
                <option value="CONSUMABLE">Consumables &amp; Cloths</option>
                <option value="PPE">Safety Gear &amp; PPE</option>
              </select>

              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                <option value="ALL">All Hubs</option>
                {hubs.map(h => (
                  <option key={h.id} value={h.id}>{h.city} - {h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.currentStock <= item.minThreshold;
              return (
                <div key={item.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold text-[#1C1C1E]">
                        {item.sku}
                      </span>
                      <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{item.name}</h4>
                      <p className="text-xs text-[#8E8E93]">{item.category}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLowStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Location:</span>
                      <span className="font-semibold text-indigo-700 truncate max-w-[150px]">{item.hubName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Current Balance:</span>
                      <span className="font-bold text-[#1C1C1E]">{item.currentStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Min Threshold:</span>
                      <span className="font-mono text-[#8E8E93]">{item.minThreshold} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Unit Cost:</span>
                      <span className="font-black text-[#1C1C1E]">₹{item.unitCost}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F2F2F7] flex items-center justify-between">
                    <span className="text-[11px] text-[#8E8E93]">Supplier: Diversey India</span>
                    <button
                      onClick={() => handleReorder(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4A24E]" />
                      <span>Reorder Stock</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LOW STOCK ALERTS */}
      {activeTab === 'LOW_STOCK_ALERTS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <h4 className="text-base font-bold text-[#1C1C1E]">Replenishment Priority Queue</h4>
          <div className="divide-y divide-[#F2F2F7]">
            {inventory.filter(i => i.currentStock <= i.minThreshold).map(item => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1C1C1E] block">{item.name}</span>
                  <span className="text-rose-700 font-semibold">
                    Current: {item.currentStock} {item.unit} (Below reorder point of {item.minThreshold}) &bull; {item.hubName}
                  </span>
                </div>
                <button
                  onClick={() => handleReorder(item)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Create Emergency PO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASE ORDERS */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#1C1C1E]">Authorized Supplier Purchase Orders</h4>
            <span className="text-xs text-[#8E8E93]">Direct Diversey &amp; Karcher Fulfillment</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-2">
            <div className="flex justify-between font-bold text-[#1C1C1E]">
              <span>PO-2026-BPE-881 &bull; Karcher Professional India</span>
              <span className="text-emerald-700">DELIVERED &amp; STOCKED</span>
            </div>
            <p className="text-[#8E8E93]">
              8x Karcher Puzzi 10/1 deep extraction machines allocated across Patna Central and Patna West hubs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
