# Bharat Pro Expert — Admin Panel Snippets (For Google AI Studio)

This directory contains standalone, copy-pasteable React components and utility logic designed to be used in **Google AI Studio** or any separate React/Vite/Next.js Admin Panel application for managing the **Bharat Pro Expert Home Services** Customer Booking App.

---

## 📂 File Structure

```
ADMIN_PANEL_SNIPPETS/
├── 1_ManageSliders.jsx        # Component to manage hero sliders/banners (add, edit, delete, image upload, order)
├── 2_ManageCategories.jsx     # Component to manage the 8 cleaning categories
├── 3_ManageServices.jsx       # Component to manage the 64 cleaning services (search, edit price, photo upload)
├── 4_ImageUploadDeleteLogic.js# Firebase Storage upload, download URL retrieval, Firestore save, & image deletion logic
├── 5_ManageLayoutText.jsx     # Component to manage brand details, header/footer info, promo offer banners, & cities
└── README.md                  # This step-by-step integration guide
```

---

## 🚀 Step-by-Step Guide: How to Use in Google AI Studio

### **STEP 1: Firebase Project Setup in Google AI Studio**
1. Copy `4_ImageUploadDeleteLogic.js` into your Google AI Studio project directory or prompt context.
2. Ensure `firebase` package is installed in your Admin project (`npm install firebase`).
3. Set your environment variables or paste your Firebase configuration in `4_ImageUploadDeleteLogic.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "bharatproexpert-homeservices.firebaseapp.com",
     projectId: "bharatproexpert-homeservices",
     storageBucket: "bharatproexpert-homeservices.firebasestorage.app",
     messagingSenderId: "11342758143",
     appId: "1:11342758143:web:1c23b2f9cb5c55715e0cca"
   };
   ```

---

### **STEP 2: Import & Use Components in Your React Admin Shell**

You can copy and paste `1_ManageSliders.jsx`, `2_ManageCategories.jsx`, `3_ManageServices.jsx`, and `5_ManageLayoutText.jsx` directly into your Google AI Studio app structure.

Example main Admin Tab/Page switcher:

```jsx
import React, { useState } from 'react';
import ManageSliders from './1_ManageSliders';
import ManageCategories from './2_ManageCategories';
import ManageServices from './3_ManageServices';
import ManageLayoutText from './5_ManageLayoutText';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('services');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: '250px', backgroundColor: '#1E293B', color: '#FFF', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
          👑 Super Admin
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'services' ? '#3B82F6' : 'transparent',
              color: '#FFF',
              cursor: 'pointer'
            }}
          >
            🛠️ 64 Services
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'categories' ? '#3B82F6' : 'transparent',
              color: '#FFF',
              cursor: 'pointer'
            }}
          >
            📁 8 Categories
          </button>
          <button
            onClick={() => setActiveTab('sliders')}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'sliders' ? '#3B82F6' : 'transparent',
              color: '#FFF',
              cursor: 'pointer'
            }}
          >
            🖼️ Sliders & Banners
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'layout' ? '#3B82F6' : 'transparent',
              color: '#FFF',
              cursor: 'pointer'
            }}
          >
            ⚙️ Layout & Site Text
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {activeTab === 'services' && <ManageServices />}
        {activeTab === 'categories' && <ManageCategories />}
        {activeTab === 'sliders' && <ManageSliders />}
        {activeTab === 'layout' && <ManageLayoutText />}
      </div>
    </div>
  );
}
```

---

## 🔑 Crucial Features & Architecture

1. **Real-Time Customer Website Updates:**
   - Any edits made in these components automatically publish to Firestore collections (`site_settings`, `sliders`, `categories`, `services`).
   - The Customer Booking Web App subscribes using `onSnapshot` and instantly updates on the screen without requiring a browser refresh.

2. **Automatic Firebase Storage Space Optimization:**
   - The helper function `saveDocWithImage` automatically uploads new image files to Firebase Storage, retrieves the download URL, saves it to Firestore, and deletes the previous/replaced photo from Firebase Storage.
   - The helper function `deleteDocAndAssociatedImage` cleans up both the Firestore document and the Firebase Storage image object when a slider, category, or service is deleted.

3. **Fallback Emoji & Responsive Image Support:**
   - If no custom photo is uploaded, the app automatically falls back to clean, responsive SVG/emoji icons.
