import React, { useState, useEffect } from 'react';

export interface InventoryItem {
  id: string;
  itemName: string;
  category: 'CHEMICAL' | 'MACHINE' | 'CONSUMABLE';
  availableQty: number;
  minThresholdAlert: number;
  assignedHub: string;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', itemName: 'Industrial Single-Disc Floor Scrubber', category: 'MACHINE', availableQty: 18, minThresholdAlert: 5, assignedHub: 'Sector 14 & 15 (Gurugram)' },
  { id: 'inv-2', itemName: 'Taski R2 Hard Surface Sanitizer (5L)', category: 'CHEMICAL', availableQty: 8, minThresholdAlert: 10, assignedHub: 'DLF Phase 1-5 (Gurugram)' },
  { id: 'inv-3', itemName: 'Dual-Motor Wet/Dry Vacuum Cleaner', category: 'MACHINE', availableQty: 25, minThresholdAlert: 6, assignedHub: 'Boring Road (Patna)' },
];

export const AdminInventorySupplies: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('bharatpro_inventory');
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  });

  const [newItemName, setNewItemName] = useState<string>('');
  const [qtyInput, setQtyInput] = useState<number>(10);

  useEffect(() => {
    localStorage.setItem('bharatpro_inventory', JSON.stringify(items));
  }, [items]);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      itemName: newItemName,
      category: 'CHEMICAL',
      availableQty: qtyInput,
      minThresholdAlert: 5,
      assignedHub: 'Central Hub',
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setQtyInput(10);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, availableQty: Math.max(0, item.availableQty + delta) } : item
    );
    setItems(updated);
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Inventory & Cleaning Kit Stock</h1>
          <p className="text-slate-400 text-sm">Chemical Chemicals Stock, Machines & Partner Kit Tracking</p>
        </div>
      </div>

      {/* Restock Form */}
      <form onSubmit={handleAddStock} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-300 mb-1">Item Name / Stock Asset *</label>
          <input
            type="text"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="e.g. Steam Sanitizer Machine or Carpet Shampoo"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs text-slate-300 mb-1">Quantity</label>
          <input
            type="number"
            value={qtyInput}
            onChange={(e) => setQtyInput(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          />
        </div>
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm shadow">
          + Add Stock Item
        </button>
      </form>

      {/* Inventory Table */}
      <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase">
            <tr>
              <th className="p-4">Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Assigned Hub</th>
              <th className="p-4">Available Qty</th>
              <th className="p-4 text-right">Quick Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-slate-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="p-4 font-bold text-white">{item.itemName}</td>
                <td className="p-4"><span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono">{item.category}</span></td>
                <td className="p-4 text-slate-400">{item.assignedHub}</td>
                <td className="p-4">
                  <span className={`font-bold text-sm ${item.availableQty <= item.minThresholdAlert ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {item.availableQty} Units
                  </span>
                  {item.availableQty <= item.minThresholdAlert && <span className="text-[10px] block text-red-400">⚠️ Low Stock Alert</span>}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleUpdateQty(item.id, 5)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs font-bold text-white">+5</button>
                  <button onClick={() => handleUpdateQty(item.id, -1)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs font-bold text-white">-1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};