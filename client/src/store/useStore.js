import { create } from 'zustand';

export const useStore = create((set) => ({
  currentUser: {
    id: 'user_admin_1',
    name: 'OpAdmin (City Manager)',
    role: 'SUPER_ADMIN',
    email: 'admin@bharatpro.in'
  },
  setCurrentUser: (user) => set({ currentUser: user }),

  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },
  clearToast: () => set({ toast: null })
}));
