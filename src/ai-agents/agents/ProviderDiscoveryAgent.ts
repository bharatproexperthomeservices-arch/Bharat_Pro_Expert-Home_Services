// ============================================================================
// Agent #2: LocationResolverAgent
// ============================================================================

import { BaseAgent } from '../BaseAgent';

export interface LocationResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export class LocationResolverAgent extends BaseAgent {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  constructor() {
    super(2, 'Location Resolver', 'पता (address) को GPS coordinates में बदलना');
  }

  async resolve(address: string): Promise<LocationResult | null> {
    console.log(`🗺️ Resolving location: "${address}"`);

    try {
      const url = `${this.NOMINATIM_URL}?q=${encodeURIComponent(
        address
      )}&format=json&addressdetails=1&limit=1&countrycodes=in`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'BharatProExpert/1.0 (contact@bharatproexpert.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        console.warn(`⚠️ No location found for: ${address}`);
        await this.report(`Location not found: ${address}`, 'low');
        return null;
      }

      const place = data[0];
      const result: LocationResult = {
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        displayName: place.display_name,
        city:
          place.address?.city ||
          place.address?.town ||
          place.address?.village ||
          place.address?.suburb,
        state: place.address?.state,
        pincode: place.address?.postcode,
      };

      console.log(
        `✅ Location resolved: ${result.city}, ${result.state} (${result.lat}, ${result.lng})`
      );

      return result;
    } catch (error: any) {
      await this.handleError(error, `LocationResolver.resolve(${address})`);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

export default LocationResolverAgent;