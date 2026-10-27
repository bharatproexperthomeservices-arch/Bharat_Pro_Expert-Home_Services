/**
 * Bharat Pro Expert — Manage Services Component
 * Location: ADMIN_PANEL_SNIPPETS/3_ManageServices.jsx
 *
 * Paste this React component into Google AI Studio to manage the 64 services.
 * Features real-time search & category filtering, editing prices, photos (Firebase Storage upload),
 * includes/excludes, FAQs, and Storage image cleanup.
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
  cat: 'deep',
  name: '',
  nameHi: '',
  emoji: '🏠',
  price: 499,
  mrp: 699,
  rating: 4.8,
  reviews: 100,
  duration: 45,
  desc: '',
  tag: '',
  includesText: '',
  excludesText: '',
  photo: ''
};

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Subscribe to 'services' collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'services'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({ id: doc.id, ...data, cat: data.categoryId || data.cat || 'deep' });
        });
        setServices(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching services:', err);
        setMessage({ text: 'Failed to load services from Firestore.', type: 'error' });
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
  const handleEdit = (svc) => {
    setEditingId(svc.id);
    const incStr = Array.isArray(svc.includes) ? svc.includes.join('\n') : '';
    const excStr = Array.isArray(svc.excludes) ? svc.excludes.join('\n') : '';

    setForm({
      id: svc.id,
      cat: svc.cat || svc.categoryId || 'deep',
      name: svc.name || '',
      nameHi: svc.nameHi || '',
      emoji: svc.emoji || '🏠',
      price: svc.price || 0,
      mrp: svc.mrp || 0,
      rating: svc.rating || 4.8,
      reviews: svc.reviews || 0,
      duration: svc.duration || 45,
      desc: svc.desc || '',
      tag: svc.tag || '',
      includesText: incStr,
      excludesText: excStr,
      photo: svc.photo || svc.imageUrl || svc.image || ''
    });
    setPreviewUrl(svc.photo || svc.imageUrl || svc.image || '');
    setSelectedFile(null);
  };

  // Save Service
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage({ text: 'Service name is required.', type: 'error' });
      return;
    }

    const docId = editingId || form.id.trim() || `${form.cat}-${Date.now()}`;

    setSaving(true);
    setMessage({ text: 'Saving service to Firestore & Storage...', type: 'info' });

    try {
      const includesArr = form.includesText.split('\n').map(s => s.trim()).filter(Boolean);
      const excludesArr = form.excludesText.split('\n').map(s => s.trim()).filter(Boolean);

      const payload = {
        cat: form.cat,
        categoryId: form.cat,
        name: form.name.trim(),
        nameHi: form.nameHi.trim() || form.name.trim(),
        emoji: form.emoji.trim(),
        price: Number(form.price),
        mrp: Number(form.mrp),
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        duration: Number(form.duration),
        desc: form.desc.trim(),
        tag: form.tag.trim(),
        includes: includesArr,
        excludes: excludesArr
      };

      const oldPhoto = editingId ? (services.find(s => s.id === editingId)?.photo || '') : '';
      await saveDocWithImage('services', docId, payload, selectedFile, oldPhoto);

      setMessage({ text: `Service '${docId}' saved successfully!`, type: 'success' });
      resetForm();
    } catch (err) {
      console.error('Error saving service:', err);
      setMessage({ text: `Error saving service: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Service
  const handleDelete = async (svc) => {
    if (!window.confirm(`Are you sure you want to delete '${svc.name}' (${svc.id})?`)) {
      return;
    }

    try {
      setMessage({ text: 'Deleting service and cleaning photo from Storage...', type: 'info' });
      const imgUrl = svc.photo || svc.imageUrl || svc.image || '';
      await deleteDocAndAssociatedImage('services', svc.id, imgUrl);
      setMessage({ text: 'Service deleted successfully!', type: 'success' });
      if (editingId === svc.id) resetForm();
    } catch (err) {
      console.error('Error deleting service:', err);
      setMessage({ text: `Error deleting service: ${err.message}`, type: 'error' });
    }
  };

  // Filter Services
  const filteredServices = services.filter((svc) => {
    const matchesCat = selectedCatFilter === 'all' || svc.cat === selectedCatFilter;
    const matchesSearch = !searchTerm ||
      svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (svc.nameHi && svc.nameHi.includes(searchTerm)) ||
      svc.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        🛠️ Manage Services (64 Services Catalogue)
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Add new services, edit pricing, update service descriptions, tag bestsellers, and upload service photos.
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

      {/* Service Form */}
      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {editingId ? `✏️ Edit Service: ${editingId}` : '➕ Add New Cleaning Service'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Service ID *</label>
            <input
              type="text"
              value={editingId || form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!editingId}
              placeholder="e.g. deep-1bhk, bath-1, sofa-seat"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: editingId ? '#F3F4F6' : '#FFF' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Category *</label>
            <select
              value={form.cat}
              onChange={(e) => setForm({ ...form, cat: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              required
            >
              <option value="deep">Home Deep Cleaning (deep)</option>
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
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Tag (e.g. Bestseller, Popular)</label>
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="Bestseller / Popular / New"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Service Name (English) *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="1 BHK Full Home Deep Cleaning"
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
              placeholder="1 BHK पूरे घर की डीप क्लीनिंग"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Emoji Icon</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="🏠"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Offer Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="2999"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>MRP / Original Price (₹)</label>
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              placeholder="3999"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Duration (Minutes)</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="300"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Short Description</label>
            <input
              type="text"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Top-to-bottom machine cleaning of a 1 BHK home, from ceiling fans to floors."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>What's Included (1 item per line)</label>
              <textarea
                rows={3}
                value={form.includesText}
                onChange={(e) => setForm({ ...form, includesText: e.target.value })}
                placeholder="Floor scrubbing and machine wash&#10;Bedroom, hall and balcony cleaning"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Not Included (1 item per line)</label>
              <textarea
                rows={3}
                value={form.excludesText}
                onChange={(e) => setForm({ ...form, excludesText: e.target.value })}
                placeholder="Moving of heavy furniture&#10;Post-construction debris removal"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Upload Service Photo (Firebase Storage)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>

          {previewUrl && (
            <div style={{ gridColumn: 'span 3', marginTop: '6px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Photo Preview:</label>
              <img
                src={previewUrl}
                alt="Service Preview"
                style={{ maxHeight: '100px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E5E7EB' }}
              />
            </div>
          )}

          <div style={{ gridColumn: 'span 3', display: 'flex', gap: '12px', marginTop: '12px' }}>
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
              {saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
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

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search service name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
        />
        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFF' }}
        >
          <option value="all">All Categories ({services.length})</option>
          <option value="deep">Home Deep Cleaning</option>
          <option value="bath">Bathroom Cleaning</option>
          <option value="kitchen">Kitchen Cleaning</option>
          <option value="sofa">Sofa & Carpet</option>
          <option value="appl">Appliance Cleaning</option>
          <option value="floor">Floor & Window</option>
          <option value="dust">Fans & Wardrobes</option>
          <option value="special">Move-in & Special</option>
        </select>
      </div>

      {/* Services List Table */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Filtered Services ({filteredServices.length})
      </h3>

      {loading ? (
        <p>Loading services from Firestore...</p>
      ) : filteredServices.length === 0 ? (
        <p style={{ color: '#666' }}>No matching services found.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px' }}>Photo / Icon</th>
                <th style={{ padding: '12px' }}>ID & Category</th>
                <th style={{ padding: '12px' }}>Service Name</th>
                <th style={{ padding: '12px' }}>Price</th>
                <th style={{ padding: '12px' }}>Duration</th>
                <th style={{ padding: '12px' }}>Tag</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s) => {
                const imgSrc = s.photo || s.imageUrl || s.image;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px' }}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={s.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <span style={{ fontSize: '28px' }}>{s.emoji || '🏠'}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>{s.id}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>Cat: {s.cat}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>{s.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.nameHi}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#007AFF' }}>₹{s.price}</span>
                      {s.mrp > s.price && <s style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '6px' }}>₹{s.mrp}</s>}
                    </td>
                    <td style={{ padding: '12px' }}>{s.duration} mins</td>
                    <td style={{ padding: '12px' }}>
                      {s.tag ? (
                        <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {s.tag}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(s)}
                        style={{ padding: '6px 12px', marginRight: '6px', borderRadius: '6px', border: '1px solid #007AFF', color: '#007AFF', backgroundColor: 'transparent', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #EF4444', color: '#EF4444', backgroundColor: 'transparent', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
