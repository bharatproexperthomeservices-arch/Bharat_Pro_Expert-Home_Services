// server/repository/memoryRepository.js
import { SEED_PARTNERS, SEED_BOOKINGS, CITIES, SERVICES } from '../seed/seedData.js';

class MemoryRepository {
  constructor() {
    this.partners = new Map(SEED_PARTNERS.map(p => [p.id, { ...p }]));
    this.bookings = new Map(SEED_BOOKINGS.map(b => [b.id, { ...b }]));
    this.cities = [...CITIES];
    this.services = [...SERVICES];
  }

  // Partners
  async getAllPartners() {
    return Array.from(this.partners.values());
  }

  async getPartnerById(id) {
    return this.partners.get(id) || null;
  }

  async savePartner(partnerData) {
    const existing = this.partners.get(partnerData.id);
    const updated = { ...existing, ...partnerData };
    this.partners.set(updated.id, updated);
    return updated;
  }

  // Bookings
  async getAllBookings() {
    return Array.from(this.bookings.values());
  }

  async getBookingById(id) {
    return this.bookings.get(id) || null;
  }

  async saveBooking(bookingData) {
    const existing = this.bookings.get(bookingData.id);
    const updated = { ...existing, ...bookingData };
    this.bookings.set(updated.id, updated);
    return updated;
  }

  // Master catalog
  async getCities() {
    return [...this.cities];
  }

  async getServices() {
    return [...this.services];
  }

  // Helper reset for testing
  resetStore() {
    this.partners = new Map(SEED_PARTNERS.map(p => [p.id, { ...p }]));
    this.bookings = new Map(SEED_BOOKINGS.map(b => [b.id, { ...b }]));
  }
}

export const repo = new MemoryRepository();
