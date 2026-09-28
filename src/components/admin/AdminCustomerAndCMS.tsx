import React, { useState, useEffect } from 'react';

export interface CustomerProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  totalBookingsCount: number;
  totalSpend: number;
  walletBalance: number;
  isPlusMember: boolean;
}

export interface PromoOffer {
  code: string;
  discountValue: number;
  discountType: 'PERCENT' | 'FLAT';
  minOrderValue: number;
  isActive: boolean;
}

const DEFAULT_CUSTOMERS: CustomerProfile[] = [
  { id: 'cst-1', fullName: 'Ananya Sharma', mobileNumber: '9871122334', totalBookingsCount: 5, totalSpend: 8490, walletBalance: 150, isPlusMember: true },
  { id: 'cst-2', fullName: 'Rajesh Gupta', mobileNumber: '9810998877', totalBookingsCount: 2, totalSpend: 4200, walletBalance: 0, isPlusMember: false },
];

const DEFAULT_OFFERS: PromoOffer[] = [
  { code: 'BHARATPRO100', discountValue: 100, discountType: 'FLAT', minOrderValue: 999, isActive: true },
  { code: 'FESTIVE20', discountValue: 20, discountType: 'PERCENT', minOrderValue: 1499, isActive: true },
];

export const AdminCustomerAndCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'OFFERS' | 'BANNERS'>('CUSTOMERS');
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    const saved = localStorage.getItem('bharatpro_customers');
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
  });

  const [offers, setOffers] = useState<PromoOffer[]>(() => {
    const saved = localStorage.getItem('bharatpro_offers');
    return saved ? JSON.parse(saved) : DEFAULT_OFFERS;
  });

  const [searchMobile, setSearchMobile] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('bharatpro_customers', JSON.stringify(customers));
    localStorage.setItem('bharatpro_offers', JSON.stringify(offers));
  }, [customers, offers]);

  const filteredCustomers = customers.filter(
    (c) => c.mobileNumber.includes(searchMobile) || c.fullName.toLowerCase().includes(searchMobile.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      {/* Navigation Bar */}
      <div className="flex border-b border-slate-700 gap-4">
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'CUSTOMERS' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400'
          }`}
        >
          Customer CRM
        </button>
        <button
          onClick={() => setActiveTab('OFFERS')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'OFFERS' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400'
          }`}
        >
          Promotional Offers & Coupons
        </button>
      </div>

      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search Customer by Mobile Number or Name..."
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
          />

          <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4">Total Lifetime Spend</th>
                  <th className="p-4">Wallet Balance</th>
                  <th className="p-4">Membership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-4 font-bold text-white">{c.fullName}</td>
                    <td className="p-4 text-amber-400">+91 {c.mobileNumber}</td>
                    <td className="p-4 font-semibold">{c.totalBookingsCount}</td>
                    <td className="p-4 font-bold text-emerald-400">₹{c.totalSpend}</td>
                    <td className="p-4 text-slate-300">₹{c.walletBalance}</td>
                    <td className="p-4">
                      {c.isPlusMember ? (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded font-bold">
                          PLUS MEMBER
                        </span>
                      ) : (
                        <span className="text-slate-500">Regular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'OFFERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((off) => (
            <div key={off.code} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg font-bold text-amber-400">{off.code}</span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-300">
                Discount: {off.discountType === 'FLAT' ? `₹${off.discountValue} Flat Off` : `${off.discountValue}% Off`}
              </p>
              <p className="text-xs text-slate-400">Min Order Value: ₹{off.minOrderValue}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};