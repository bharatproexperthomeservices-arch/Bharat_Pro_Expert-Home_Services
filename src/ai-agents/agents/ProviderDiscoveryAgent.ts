// ============================================================================
// Agent #3: ProviderDiscoveryAgent
// ============================================================================
// यह एजेंट ग्राहक के स्थान और सेवा के आधार पर निकटतम उपलब्ध पार्टनर्स को खोजता है
// ============================================================================

import { BaseAgent } from '../BaseAgent';
import { LocationResolverAgent } from './LocationResolverAgent';

export interface PartnerCandidate {
  id: string;
  name: string;
  phone?: string;
  services: string[];
  rating: number;
  completionRate?: number;
  coordinates: { lat: number; lng: number };
  distanceKm: number;
  status: string;
}

export class ProviderDiscoveryAgent extends BaseAgent {
  private locResolver: LocationResolverAgent;

  constructor() {
    super(3, 'Provider Discovery', 'निकटतम उपलब्ध सर्विस पार्टनर्स खोजना');
    this.locResolver = new LocationResolverAgent();
  }

  async findNearest(
    customerLoc: { lat: number; lng: number },
    serviceType: string,
    radiusKm: number = 25
  ): Promise<PartnerCandidate[]> {
    console.log(`🔍 Finding partners for "${serviceType}" near (${customerLoc.lat}, ${customerLoc.lng}) within ${radiusKm}km...`);

    const partners = [
      { id: 'p1', name: 'Rajesh Sharma', phone: '+919810012345', services: ['Deep Cleaning', 'Home Cleaning', 'AC Repair'], rating: 4.85, completionRate: 98, coordinates: { lat: 28.4595, lng: 77.0266 }, status: 'active' },
      { id: 'p2', name: 'Amit Verma', phone: '+919810012346', services: ['Deep Cleaning', 'Sofa Cleaning', 'Bathroom Cleaning'], rating: 4.75, completionRate: 94, coordinates: { lat: 28.4900, lng: 77.0850 }, status: 'active' },
      { id: 'p3', name: 'Suresh Kumar', phone: '+919810012347', services: ['Kitchen Cleaning', 'Deep Cleaning'], rating: 4.90, completionRate: 99, coordinates: { lat: 28.4720, lng: 77.0510 }, status: 'active' },
      { id: 'p4', name: 'Vikram Yadav', phone: '+919810012348', services: ['Full Home Deep Cleaning', 'Balcony Cleaning'], rating: 4.65, completionRate: 91, coordinates: { lat: 28.4350, lng: 77.0120 }, status: 'active' },
    ];

    const results: PartnerCandidate[] = [];
    for (const p of partners) {
      if (serviceType && !p.services.some(s => s.toLowerCase().includes(serviceType.toLowerCase()) || serviceType.toLowerCase().includes(s.toLowerCase()))) {
        continue;
      }
      const distance = this.locResolver.calculateDistance(
        customerLoc.lat,
        customerLoc.lng,
        p.coordinates.lat,
        p.coordinates.lng
      );
      if (distance <= radiusKm) {
        results.push({
          ...p,
          distanceKm: parseFloat(distance.toFixed(2))
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  }
}

export default ProviderDiscoveryAgent;
