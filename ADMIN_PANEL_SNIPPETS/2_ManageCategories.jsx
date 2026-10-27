/**
 * Bharat Pro Expert — Manage Categories Component
 * Location: ADMIN_PANEL_SNIPPETS/2_ManageCategories.jsx
 *
 * Paste this React component into Google AI Studio to manage the 8 cleaning categories.
 * Supports image upload to Firebase Storage, name/Hindi name, gradient colors, blurb, and storage cleanup.
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
  name: '',
  nameHi: '',
  emoji: '✨',
  g1: '#34C759',
  g2: '#30B0C7',
  blurb: '',
  photo: ''
};

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Subscribe to 'categories' collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCategories(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setMessage({ text: 'Failed to load categories.', type: 'error' });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // File Selection
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
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      id: cat.id,
      name: cat.name || '',
      nameHi: cat.nameHi || '',
      emoji: cat.emoji || '✨',
      g1: cat.g1 || '#34C759',
      g2: cat.g2 || '#30B0C7',
      blurb: cat.blurb || '',
      photo: cat.photo || cat.imageUrl || cat.image || ''
    });
    setPreviewUrl(cat.photo || cat.imageUrl || cat.image || '');
    setSelectedFile(null);
  };

  // Save Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage({ text: 'Category name is required.', type: 'error' });
      return;
    }

    const docId = editingId || form.id.trim().toLowerCase().replace(/\s+/g, '_');
    if (!docId) {
      setMessage({ text: 'Category ID is required.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: 'Saving category to Firestore & Storage...', type: 'info' });

    try {
      const payload = {
        name: form.name.trim(),
        nameHi: form.nameHi.trim() || form.name.trim(),
        emoji: form.emoji.trim(),
        g1: form.g1,
        g2: form.g2,
        blurb: form.blurb.trim()
      };

      const oldPhoto = editingId ? (categories.find(c => c.id === editingId)?.photo || '') : '';
      await saveDocWithImage('categories', docId, payload, selectedFile, oldPhoto);

      setMessage({ text: `Category '${docId}' saved successfully!`, type: 'success' });
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
      setMessage({ text: `Error saving category: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category '${cat.name}' (${cat.id})?`)) {
      return;
    }

    try {
      setMessage({ text: 'Deleting category and associated icon image...', type: 'info' });
      const imgUrl = cat.photo || cat.imageUrl || cat.image || '';
      await deleteDocAndAssociatedImage('categories', cat.id, imgUrl);
      setMessage({ text: 'Category deleted successfully!', type: 'success' });
      if (editingId === cat.id) resetForm();
    } catch (err) {
      console.error('Error deleting category:', err);
      setMessage({ text: `Error deleting category: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        📁 Manage Cleaning Categories
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Manage the 8 core service categories (e.g. Deep Cleaning, Bathroom, Kitchen, Sofa, Appliances).
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

      {/* Category Form */}
      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {editingId ? `✏️ Edit Category: ${editingId}` : '➕ Add New Cleaning Category'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Category ID *</label>
            <input
              type="text"
              value={editingId || form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!editingId}
              placeholder="e.g. deep, bath, kitchen, sofa"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: editingId ? '#F3F4F6' : '#FFF' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Category Name (English) *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Home Deep Cleaning"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Hindi Name (नाम हिंदी में)</label>
            <input
              type="text"
              value={form.nameHi}
              onChange={(e) => setForm({ ...form, nameHi: e.target.value })}
              placeholder="e.g. होम डीप क्लीनिंग"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Emoji Icon</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="e.g. 🏠, 🚿, 🍳, 🛋️, ❄️"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Short Blurb / Description</label>
            <input
              type="text"
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
              placeholder="e.g. Full apartment, studio, single room and empty flat cleaning"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Gradient Color 1</label>
            <input
              type="color"
              value={form.g1}
              onChange={(e) => setForm({ ...form, g1: e.target.value })}
              style={{ width: '100%', height: '42px', padding: '2px', borderRadius: '6px', border: '1px solid #D1D5DB', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Gradient Color 2</label>
            <input
              type="color"
              value={form.g2}
              onChange={(e) => setForm({ ...form, g2: e.target.value })}
              style={{ width: '100%', height: '42px', padding: '2px', borderRadius: '6px', border: '1px solid #D1D5DB', cursor: 'pointer' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Upload Category Icon/Photo (Firebase Storage)</label>
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
                alt="Category Preview"
                style={{ maxHeight: '80px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E5E7EB' }}
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
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
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

      {/* Categories List */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Categories List ({categories.length})
      </h3>

      {loading ? (
        <p>Loading categories from Firestore...</p>
      ) : categories.length === 0 ? (
        <p style={{ color: '#666' }}>No categories found in Firestore.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {categories.map((c) => {
            const imgSrc = c.photo || c.imageUrl || c.image;
            return (
              <div
                key={c.id}
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
                    height: '80px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${c.g1 || '#007AFF'}, ${c.g2 || '#5AC8FA'})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    color: '#FFF',
                    fontSize: '36px'
                  }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                    ) : (
                      c.emoji || '✨'
                    )}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280', uppercase: 'true' }}>
                    ID: {c.id}
                  </div>
                  <h4 style={{ fontWeight: '600', fontSize: '16px', marginBottom: '2px' }}>{c.name}</h4>
                  <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '6px' }}>{c.nameHi}</div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>{c.blurb}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(c)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #007AFF', color: '#007AFF', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '500' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
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
