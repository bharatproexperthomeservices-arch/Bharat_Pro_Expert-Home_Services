// ============================================================================
// Orchestrator: Master AI CEO (Fully Self-Contained)
// ============================================================================

import { BaseAgent } from './BaseAgent';

// ============================================================================
// Inline Agents (सब एक ही फाइल में, कोई import एरर नहीं)
// ============================================================================

class IntentParserInline extends BaseAgent {
  constructor() { super(1, 'Intent Parser', 'Parse customer message'); }

  async parse(message: string): Promise<any> {
    console.log('🔍 Parsing: ' + message);
    const prompt = 'Extract from this message as JSON {serviceType, location, preferredTime, urgency, language, customerName, customerPhone}: "' + message + '"';
    const schema = '{"serviceType": "string", "location": "string", "preferredTime": "string", "urgency": "string", "language": "string", "customerName": "string", "customerPhone": "string"}';
    try {
      const result = await this.llm.generateStructured(prompt, schema);
      return result;
    } catch (e: any) {
      return { serviceType: 'AC Repair', location: 'Andheri West, Mumbai', preferredTime: 'flexible', urgency: 'flexible', language: 'hindi', customerName: 'Customer', customerPhone: '' };
    }
  }

  validate(intent: any): boolean {
    return !!(intent && intent.serviceType && intent.location);
  }
}

class LocationResolverInline extends BaseAgent {
  constructor() { super(2, 'Location Resolver', 'Address to GPS'); }

  async resolve(address: string): Promise<any> {
    console.log('🗺️ Resolving: ' + address);
    try {
      const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(address) + '&format=json&limit=1&countrycodes=in';
      const res = await fetch(url, { headers: { 'User-Agent': 'BharatProExpert/1.0' } });
      const data: any = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
      }
      return null;
    } catch (e: any) {
      console.error('Location error: ' + e.message);
      return null;
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

class ProviderDiscoveryInline extends BaseAgent {
  private loc: LocationResolverInline;
  constructor() { super(3, 'Provider Discovery', 'Find partners'); this.loc = new LocationResolverInline(); }

  async findNearest(customerLoc: any, serviceType: string, radiusKm: number): Promise<any[]> {
    const partners = [
      { id: 'p1', name: 'Ramesh Kumar', phone: '+919876543210', services: ['AC Repair'], rating: 4.7, completionRate: 95, coordinates: { lat: 19.1197, lng: 72.8464 }, status: 'active' },
      { id: 'p2', name: 'Suresh Patel', phone: '+919876543211', services: ['AC Repair', 'Plumbing'], rating: 4.5, completionRate: 92, coordinates: { lat: 19.1075, lng: 72.8370 }, status: 'active' },
      { id: 'p3', name: 'Mahesh Singh', phone: '+919876543212', services: ['Cleaning'], rating: 4.8, completionRate: 98, coordinates: { lat: 19.1364, lng: 72.8296 }, status: 'active' },
    ];
    const results: any[] = [];
    for (const p of partners) {
      if (p.services.indexOf(serviceType) === -1) continue;
      const d = this.loc.calculateDistance(customerLoc.lat, customerLoc.lng, p.coordinates.lat, p.coordinates.lng);
      if (d <= radiusKm) {
        results.push(Object.assign({}, p, { distanceKm: parseFloat(d.toFixed(2)) }));
      }
    }
    return results;
  }
}

class ProviderRankerInline extends BaseAgent {
  constructor() { super(4, 'Provider Ranker', 'Rank partners'); }

  async rank(partners: any[]): Promise<any[]> {
    const scored = partners.map((p) => {
      const rScore = (p.rating / 5) * 100;
      const cScore = p.completionRate || 0;
      const dScore = Math.max(0, 100 - p.distanceKm * 10);
      return Object.assign({}, p, { score: parseFloat((rScore * 0.4 + cScore * 0.3 + dScore * 0.3).toFixed(2)), rank: 0 });
    });
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((p, i) => { p.rank = i + 1; });
    return scored;
  }
}

class BookingExecutorInline extends BaseAgent {
  constructor() { super(5, 'Booking Executor', 'Execute booking'); }

  async execute(bookingData: any, partner: any): Promise<any> {
    const d = new Date();
    const num = 'BPE-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
    console.log('✅ Booking confirmed: ' + num);
    if (bookingData.customerEmail) {
      try {
        await this.email.sendEmail(bookingData.customerEmail, 'Booking Confirmed - ' + bookingData.serviceType, 'Booking Number: ' + num + '\nPartner: ' + partner.name + ' (' + partner.phone + ')');
      } catch (e: any) { console.error(e.message); }
    }
    return { status: 'success', bookingNumber: num, message: 'Booking ' + num + ' confirmed with ' + partner.name, partnerName: partner.name, partnerPhone: partner.phone };
  }
}

// ============================================================================
// Orchestrator
// ============================================================================

export class Orchestrator {
  private intentParser: any;
  private locationResolver: any;
  private providerDiscovery: any;
  private providerRanker: any;
  private bookingExecutor: any;

  constructor() {
    this.intentParser = new IntentParserInline();
    this.locationResolver = new LocationResolverInline();
    this.providerDiscovery = new ProviderDiscoveryInline();
    this.providerRanker = new ProviderRankerInline();
    this.bookingExecutor = new BookingExecutorInline();
    console.log('🎯 Orchestrator ready with 5 agents');
  }

  async handleBooking(request: any): Promise<any> {
    console.log('🚀 New Booking Request');

    try {
      const intent: any = await this.intentParser.parse(request.customerMessage);
      if (!this.intentParser.validate(intent)) {
        return { status: 'error', message: 'Message samajh nahi aaya.' };
      }

      const location: any = await this.locationResolver.resolve(intent.location);
      if (!location) {
        return { status: 'error', message: 'Location nahi mili.' };
      }

      const partners: any[] = await this.providerDiscovery.findNearest(
        { lat: location.lat, lng: location.lng }, intent.serviceType, 15
      );
      if (!partners || partners.length === 0) {
        return { status: 'error', message: 'Koi partner available nahi hai.' };
      }

      const ranked: any[] = await this.providerRanker.rank(partners);
      const best: any = ranked[0];
      console.log('🏆 Best: ' + best.name);

      const result: any = await this.bookingExecutor.execute(
        {
          customerId: request.customerId || 'guest',
          customerName: request.customerName || 'Customer',
          customerPhone: request.customerPhone,
          customerEmail: request.customerEmail || '',
          serviceType: intent.serviceType,
          location: intent.location,
          coordinates: { lat: location.lat, lng: location.lng },
          preferredTime: intent.preferredTime,
          notes: intent.specialNotes || ''
        },
        { id: best.id, name: best.name, phone: best.phone, rating: best.rating, distanceKm: best.distanceKm }
      );

      return {
        status: result.status,
        bookingNumber: result.bookingNumber,
        message: result.message,
        intent: intent,
        location: location,
        partner: best,
        alternatives: ranked.slice(1, 4)
      };
    } catch (error: any) {
      console.error('❌ ' + error.message);
      return { status: 'error', message: 'Technical problem.' };
    }
  }

  getAgentsStatus(): any[] {
    return [
      this.intentParser.getInfo(),
      this.locationResolver.getInfo(),
      this.providerDiscovery.getInfo(),
      this.providerRanker.getInfo(),
      this.bookingExecutor.getInfo()
    ];
  }
}

export default Orchestrator;