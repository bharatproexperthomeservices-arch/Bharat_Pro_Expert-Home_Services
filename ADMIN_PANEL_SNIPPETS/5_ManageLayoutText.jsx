/**
 * Bharat Pro Expert — Manage Layout & Site Settings Component
 * Location: ADMIN_PANEL_SNIPPETS/5_ManageLayoutText.jsx
 *
 * Paste this React component into Google AI Studio to control headers, footers, promo banners,
 * brand contact information, FAQs, and trust badges in real time across the Customer Web App.
 */

import React, { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from './4_ImageUploadDeleteLogic';

export default function ManageLayoutText() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [brand, setBrand] = useState({
    name: 'Bharat Pro Expert',
    tagline: 'Ghar ki safai, Bharat ke apne Experts',
    phone: '+91 89202 52647',
    email: 'bharatproexpert@gmail.com',
    companyEmail: 'bharatproexperthomeservices@gmail.com',
    city: 'Gurgaon',
    address: 'Unit No. 309, 3rd Floor, Tower A, SAS Tower, Medicity, Sector 38, Gurugram, Haryana, 122001',
    gstin: '06FCUPM9518L1ZM'
  });

  const [promo, setPromo] = useState({
    title: 'Flat ₹100 off on your first cleaning',
    sub: 'New to Bharat Pro Expert? Use the code at checkout on orders above ₹299.',
    cta: 'Claim Offer',
    code: 'FIRST100'
  });

  const [citiesText, setCitiesText] = useState('Gurgaon, Delhi, Noida, Patna, Jale (Darbhanga), Darbhanga, Muzaffarpur, Gaya');

  // Load site_settings/main from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'site_settings', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.brand) setBrand((prev) => ({ ...prev, ...data.brand }));
          if (data.promo) setPromo((prev) => ({ ...prev, ...data.promo }));
          if (Array.isArray(data.cities)) setCitiesText(data.cities.join(', '));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading site settings:', err);
        setMessage({ text: 'Error loading settings from Firestore.', type: 'error' });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: 'Saving site layout settings to Firestore...', type: 'info' });

    try {
      const citiesArr = citiesText.split(',').map((c) => c.trim()).filter(Boolean);

      const payload = {
        brand,
        promo,
        cities: citiesArr,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'site_settings', 'main'), payload, { merge: true });
      setMessage({ text: 'Site settings and layout text updated in real time!', type: 'success' });
    } catch (err) {
      console.error('Error saving site settings:', err);
      setMessage({ text: `Failed to save settings: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: '24px' }}>Loading site settings from Firestore...</p>;
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        ⚙️ Manage Layout & Global Site Text
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Control brand header info, promo offer banners, official contact numbers, and footer address details.
      </p>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.type === 'error' ? '#FEE2E2' : message.type === 'success' ? '#D1FAE5' : '#E0F2FE',
          color: message.type === 'error' ? '#991B1B' : message.type === 'success' ? '#065F46' : '#075985',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Brand Information Section */}
        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
            🏷️ Brand & Contact Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Brand Name</label>
              <input
                type="text"
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Brand Tagline</label>
              <input
                type="text"
                value={brand.tagline}
                onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Official Support Phone</label>
              <input
                type="text"
                value={brand.phone}
                onChange={(e) => setBrand({ ...brand, phone: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Support Email</label>
              <input
                type="email"
                value={brand.email}
                onChange={(e) => setBrand({ ...brand, email: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Company Email</label>
              <input
                type="email"
                value={brand.companyEmail}
                onChange={(e) => setBrand({ ...brand, companyEmail: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Default City</label>
              <input
                type="text"
                value={brand.city}
                onChange={(e) => setBrand({ ...brand, city: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Registered Office Address</label>
              <input
                type="text"
                value={brand.address}
                onChange={(e) => setBrand({ ...brand, address: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Official GSTIN</label>
              <input
                type="text"
                value={brand.gstin}
                onChange={(e) => setBrand({ ...brand, gstin: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>
        </div>

        {/* Homepage Promo Offer Banner Section */}
        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
            🎁 Homepage Promo Banner Offer
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Promo Headline Title</label>
              <input
                type="text"
                value={promo.title}
                onChange={(e) => setPromo({ ...promo, title: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Promo Subtitle</label>
              <input
                type="text"
                value={promo.sub}
                onChange={(e) => setPromo({ ...promo, sub: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>CTA Button Label</label>
              <input
                type="text"
                value={promo.cta}
                onChange={(e) => setPromo({ ...promo, cta: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Coupon Code</label>
              <input
                type="text"
                value={promo.code}
                onChange={(e) => setPromo({ ...promo, code: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>
        </div>

        {/* Serviceable Cities Section */}
        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
            📍 Serviceable Cities List
          </h3>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Cities (Comma separated)</label>
            <input
              type="text"
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
              placeholder="Gurgaon, Delhi, Noida, Patna..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#007AFF',
              color: '#FFF',
              fontWeight: '600',
              fontSize: '16px',
              padding: '14px 28px',
              borderRadius: '8px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : '💾 Save Layout Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
