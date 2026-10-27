/**
 * Bharat Pro Expert — Manage Sliders/Banners Component
 * Location: ADMIN_PANEL_SNIPPETS/1_ManageSliders.jsx
 *
 * Paste this React component into Google AI Studio to manage hero sliders/banners.
 * Supports image upload to Firebase Storage, text editing, order, and storage cleanup on delete.
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot
} from 'firebase/firestore';
import {
  db,
  saveDocWithImage,
  deleteDocAndAssociatedImage
} from './4_ImageUploadDeleteLogic';

const INITIAL_FORM = {
  id: '',
  title: '',
  sub: '',
  cta: 'Book Now',
  cat: 'deep',
  emoji: '🏠',
  g1: '#34C759',
  g2: '#30B0C7',
  photo: ''
};

export default function ManageSliders() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // 1. Subscribe to 'sliders' collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'sliders'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSliders(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching sliders:', err);
        setMessage({ text: 'Failed to load sliders.', type: 'error' });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Reset Form
  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  // Start Editing
  const handleEdit = (slider) => {
    setEditingId(slider.id);
    setForm({
      id: slider.id,
      title: slider.title || '',
      sub: slider.sub || '',
      cta: slider.cta || 'Book Now',
      cat: slider.cat || 'deep',
      emoji: slider.emoji || '🏠',
      g1: slider.g1 || '#34C759',
      g2: slider.g2 || '#30B0C7',
      photo: slider.photo || slider.imageUrl || slider.image || ''
    });
    setPreviewUrl(slider.photo || slider.imageUrl || slider.image || '');
    setSelectedFile(null);
  };

  // Save Slider
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setMessage({ text: 'Please enter a slider title.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: 'Saving slider to Firestore & Storage...', type: 'info' });

    try {
      const docId = editingId || form.id.trim() || `h_${Date.now()}`;
      const payload = {
        title: form.title.trim(),
        sub: form.sub.trim(),
        cta: form.cta.trim(),
        cat: form.cat.trim(),
        emoji: form.emoji.trim(),
        g1: form.g1,
        g2: form.g2
      };

      const oldPhoto = editingId ? (sliders.find(s => s.id === editingId)?.photo || '') : '';
      await saveDocWithImage('sliders', docId, payload, selectedFile, oldPhoto);

      setMessage({ text: `Slider '${docId}' saved successfully!`, type: 'success' });
      resetForm();
    } catch (err) {
      console.error('Error saving slider:', err);
      setMessage({ text: `Error saving slider: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Slider
  const handleDelete = async (slider) => {
    if (!window.confirm(`Are you sure you want to delete slider '${slider.title}'?`)) {
      return;
    }

    try {
      setMessage({ text: 'Deleting slider and associated image...', type: 'info' });
      const imgUrl = slider.photo || slider.imageUrl || slider.image || '';
      await deleteDocAndAssociatedImage('sliders', slider.id, imgUrl);
      setMessage({ text: 'Slider deleted successfully!', type: 'success' });
      if (editingId === slider.id) resetForm();
    } catch (err) {
      console.error('Error deleting slider:', err);
      setMessage({ text: `Error deleting slider: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        🖼️ Manage Hero Sliders & Banners
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Add, edit, reorder or remove promotional hero slides on the customer homepage.
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

      {/* Slide Form */}
      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {editingId ? `✏️ Edit Slider: ${editingId}` : '➕ Add New Slider Banner'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Slider Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Apartment deep cleaning from ₹2,199"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Subtitle / Offer Description</label>
            <input
              type="text"
              value={form.sub}
              onChange={(e) => setForm({ ...form, sub: e.target.value })}
              placeholder="e.g. Machines and eco-safe chemicals by trained experts"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>CTA Button Text</label>
            <input
              type="text"
              value={form.cta}
              onChange={(e) => setForm({ ...form, cta: e.target.value })}
              placeholder="e.g. Book Deep Cleaning"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Target Category Link</label>
            <select
              value={form.cat}
              onChange={(e) => setForm({ ...form, cat: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            >
              <option value="deep">Full Home Deep Cleaning (deep)</option>
              <option value="bath">Bathroom Cleaning (bath)</option>
              <option value="kitchen">Kitchen Cleaning (kitchen)</option>
              <option value="sofa">Sofa & Carpet (sofa)</option>
              <option value="appl">Appliance Cleaning (appl)</option>
              <option value="floor">Floor & Window (floor)</option>
              <option value="dust">Fans & Wardrobes (dust)</option>
              <option value="special">Move-in & Special (special)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Fallback Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="e.g. 🏠"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Upload Banner Photo (Firebase Storage)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          {previewUrl && (
            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Image Preview:</label>
              <img
                src={previewUrl}
                alt="Banner Preview"
                style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E5E7EB' }}
              />
            </div>
          )}

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: '#007AFF',
                color: '#FFF',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Update Slider' : 'Add Slider'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  backgroundColor: '#6B7280',
                  color: '#FFF',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sliders List */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Current Active Sliders ({sliders.length})
      </h3>

      {loading ? (
        <p>Loading sliders from Firestore...</p>
      ) : sliders.length === 0 ? (
        <p style={{ color: '#666' }}>No sliders found in Firestore. Add one using the form above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {sliders.map((s) => {
            const imgSrc = s.photo || s.imageUrl || s.image;
            return (
              <div
                key={s.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#FFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{
                    height: '100px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${s.g1 || '#34C759'}, ${s.g2 || '#30B0C7'})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    overflow: 'hidden'
                  }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '48px' }}>{s.emoji || '🏠'}</span>
                    )}
                  </div>
                  <h4 style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{s.title}</h4>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{s.sub}</p>
                  <div style={{ fontSize: '12px', color: '#007AFF', fontWeight: '500', marginBottom: '12px' }}>
                    CTA: "{s.cta}" → Category: {s.cat}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(s)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #007AFF', color: '#007AFF', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '500' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #EF4444', color: '#EF4444', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '500' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
