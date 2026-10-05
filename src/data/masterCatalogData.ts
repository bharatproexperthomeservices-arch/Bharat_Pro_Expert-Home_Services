import { CleaningService } from '../types';

export interface CatalogItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  duration: string;
  originalPrice: number;
  offerPrice: number;
  imageUrl: string;
  popular?: boolean;
  description: string;
  rating: number;
  reviewCount: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  heroImage: string;
  startingPrice: number;
  items: CatalogItem[];
}

export const MASTER_CATALOG_CATEGORIES: CatalogCategory[] = [
  // 1. SOFA SHAMPOOING & DEEP CLEAN
  {
    id: 'sofa-shampooing',
    name: 'Sofa Shampooing & Deep Clean',
    subtitle: 'Fabric & leather upholstery injection-extraction shampooing and stain elimination.',
    iconName: 'Armchair',
    heroImage: '/src/assets/images/sofa_deep_cleaning_1790693680475.jpg',
    startingPrice: 549,
    items: [
      {
        id: 'sofa-3-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '3 Sofa Seats',
        duration: '1 hr',
        originalPrice: 999,
        offerPrice: 549,
        imageUrl: '/src/assets/images/sofa_deep_cleaning_1790693680475.jpg',
        popular: true,
        description: 'Deep vacuuming, organic foam shampooing & machine extraction for 3-seater sofa.',
        rating: 4.88,
        reviewCount: 1420
      },
      {
        id: 'sofa-4-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '4 Sofa Seats',
        duration: '1.5 hrs',
        originalPrice: 1299,
        offerPrice: 749,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        description: 'Complete front, back & cushion fabric sanitization with German Kärcher spray extraction.',
        rating: 4.86,
        reviewCount: 980
      },
      {
        id: 'sofa-7-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '7 Sofa Seats',
        duration: '2 hrs',
        originalPrice: 2199,
        offerPrice: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Large sectional or 3+2+2 sofa set deep shampoo & anti-allergen treatment.',
        rating: 4.92,
        reviewCount: 650
      },
      {
        id: 'sofa-8-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '8 Sofa Seats',
        duration: '2.5 hrs',
        originalPrice: 2499,
        offerPrice: 1449,
        imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
        description: 'L-shape or extended family couch thorough dirt extraction and rapid drying.',
        rating: 4.89,
        reviewCount: 430
      },
      {
        id: 'sofa-9-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '9 Sofa Seats',
        duration: '2.5 hrs',
        originalPrice: 2799,
        offerPrice: 1599,
        imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=600&q=80',
        description: 'Extensive 9-seat living room sectional wet shampoo and stain buffing.',
        rating: 4.85,
        reviewCount: 310
      },
      {
        id: 'sofa-11-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '11 Sofa Seats',
        duration: '3 hrs',
        originalPrice: 3299,
        offerPrice: 1899,
        imageUrl: '/src/assets/images/sofa_deep_cleaning_1790693680475.jpg',
        description: 'Villa or luxury duplex large sofa setup with fabric conditioning.',
        rating: 4.91,
        reviewCount: 220
      },
      {
        id: 'sofa-12-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '12 Sofa Seats',
        duration: '3.5 hrs',
        originalPrice: 3599,
        offerPrice: 2099,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        description: 'Corporate lounge or grand living room 12-seater complete deep clean.',
        rating: 4.90,
        reviewCount: 180
      },
      {
        id: 'sofa-13-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '13 Sofa Seats',
        duration: '3.5 hrs',
        originalPrice: 3899,
        offerPrice: 2249,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
        description: 'Executive club or home theatre 13-seat upholstery sanitization.',
        rating: 4.87,
        reviewCount: 140
      },
      {
        id: 'sofa-14-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '14 Sofa Seats',
        duration: '4 hrs',
        originalPrice: 4199,
        offerPrice: 2399,
        imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
        description: 'Full hall 14-seater configuration deep steam & hot water extraction.',
        rating: 4.89,
        reviewCount: 110
      },
      {
        id: 'sofa-15-seat',
        categoryId: 'sofa-shampooing',
        categoryName: 'Sofa Shampooing & Deep Clean',
        name: '15 Sofa Seats',
        duration: '4 hrs',
        originalPrice: 4499,
        offerPrice: 2549,
        imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=600&q=80',
        description: 'Commercial lobby or banquet 15-seater deep cleaning package.',
        rating: 4.93,
        reviewCount: 95
      }
    ]
  },

  // 2. POWER JET AC SERVICE
  {
    id: 'power-jet-ac',
    name: 'Power Jet AC Service',
    subtitle: 'High-pressure water pump foam jet wash for 2x cooling & 30% electricity saving.',
    iconName: 'Wind',
    heroImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    startingPrice: 499,
    items: [
      {
        id: 'ac-1-unit',
        categoryId: 'power-jet-ac',
        categoryName: 'Power Jet AC Service',
        name: '1 AC Power Jet Service',
        duration: '45 mins',
        originalPrice: 799,
        offerPrice: 499,
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Indoor cooling coil foam wash, blower fan clean, filter sanitization & drain line flush.',
        rating: 4.94,
        reviewCount: 2890
      },
      {
        id: 'ac-2-unit',
        categoryId: 'power-jet-ac',
        categoryName: 'Power Jet AC Service',
        name: '2 AC Power Jet Service',
        duration: '1.5 hrs',
        originalPrice: 1499,
        offerPrice: 899,
        imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Combo package for 2 split or window ACs with outdoor condenser power rinse.',
        rating: 4.96,
        reviewCount: 1740
      },
      {
        id: 'ac-3-unit',
        categoryId: 'power-jet-ac',
        categoryName: 'Power Jet AC Service',
        name: '3 AC Power Jet Service',
        duration: '2 hrs',
        originalPrice: 2199,
        offerPrice: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        description: 'Complete home AC servicing for 3 units including gas pressure check & anti-rust spray.',
        rating: 4.92,
        reviewCount: 880
      },
      {
        id: 'ac-split-foam',
        categoryId: 'power-jet-ac',
        categoryName: 'Power Jet AC Service',
        name: 'Split AC Deep Foam Clean',
        duration: '1 hr',
        originalPrice: 899,
        offerPrice: 549,
        imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
        description: 'Jacket protection bag setup, antimicrobial coil foam wash & outdoor unit blast.',
        rating: 4.91,
        reviewCount: 1120
      },
      {
        id: 'ac-window-wash',
        categoryId: 'power-jet-ac',
        categoryName: 'Power Jet AC Service',
        name: 'Window AC Power Wash',
        duration: '45 mins',
        originalPrice: 699,
        offerPrice: 449,
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        description: 'Full body pullout, deep radiator coil fin wash & fan blower grease removal.',
        rating: 4.88,
        reviewCount: 640
      }
    ]
  },

  // 3. CARPET & MATTRESS CLEANING
  {
    id: 'carpet-mattress',
    name: 'Carpet & Mattress Cleaning',
    subtitle: 'Hospital-grade sanitization removing dust mites, pet hair & beverage spills.',
    iconName: 'BedDouble',
    heroImage: '/src/assets/images/carpet_cleaning_1790693701155.jpg',
    startingPrice: 349,
    items: [
      {
        id: 'carpet-0-25',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '0-25 SqFt',
        duration: '30 mins',
        originalPrice: 599,
        offerPrice: 349,
        imageUrl: '/src/assets/images/carpet_cleaning_1790693701155.jpg',
        description: 'Small bedside runner or entry mat shampooing & rapid moisture extraction.',
        rating: 4.85,
        reviewCount: 520
      },
      {
        id: 'carpet-25-50',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '25-50 SqFt',
        duration: '45 mins',
        originalPrice: 799,
        offerPrice: 449,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Medium accent rug deep pile rotary scrub and Taski Tapi neutralizer.',
        rating: 4.87,
        reviewCount: 680
      },
      {
        id: 'carpet-51-100',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '51-100 SqFt',
        duration: '1 hr',
        originalPrice: 1199,
        offerPrice: 699,
        imageUrl: '/src/assets/images/carpet_cleaning_1790693701155.jpg',
        popular: true,
        description: 'Standard living room area rug deep wash, fringe cleaning & odor elimination.',
        rating: 4.90,
        reviewCount: 1140
      },
      {
        id: 'carpet-101-150',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '101-150 SqFt',
        duration: '1.5 hrs',
        originalPrice: 1599,
        offerPrice: 949,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Large center carpet wet injection shampooing with color revival.',
        rating: 4.89,
        reviewCount: 420
      },
      {
        id: 'carpet-150-250',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '150-250 SqFt',
        duration: '2 hrs',
        originalPrice: 2299,
        offerPrice: 1399,
        imageUrl: '/src/assets/images/carpet_cleaning_1790693701155.jpg',
        description: 'Executive room or master bedroom wall-to-wall carpet section wash.',
        rating: 4.88,
        reviewCount: 290
      },
      {
        id: 'carpet-451-550',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '451-550 SqFt',
        duration: '2.5 hrs',
        originalPrice: 3499,
        offerPrice: 2199,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Spacious hall commercial or residential carpet deep machine extraction.',
        rating: 4.91,
        reviewCount: 160
      },
      {
        id: 'carpet-551-750',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '551-750 SqFt',
        duration: '3 hrs',
        originalPrice: 4299,
        offerPrice: 2699,
        imageUrl: '/src/assets/images/carpet_cleaning_1790693701155.jpg',
        description: 'Full office bay or banquet carpet extraction with anti-bacterial rinse.',
        rating: 4.87,
        reviewCount: 120
      },
      {
        id: 'carpet-751-1000',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: '751-1000 SqFt',
        duration: '3.5 hrs',
        originalPrice: 5499,
        offerPrice: 3499,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Grand floor area carpet restoration, sanitization and high-speed blower drying.',
        rating: 4.93,
        reviewCount: 95
      },
      {
        id: 'mattress-single',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: 'Single Bed Mattress',
        duration: '1 hr',
        originalPrice: 999,
        offerPrice: 599,
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
        description: 'Both sides dust-mite vacuuming, stain treatment & UV sanitization.',
        rating: 4.92,
        reviewCount: 840
      },
      {
        id: 'mattress-double',
        categoryId: 'carpet-mattress',
        categoryName: 'Carpet & Mattress Cleaning',
        name: 'Double Bed Mattress',
        duration: '1.5 hrs',
        originalPrice: 1499,
        offerPrice: 899,
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'King/Queen mattress complete wet injection extraction, sweat stain removal & freshness shield.',
        rating: 4.95,
        reviewCount: 1650
      }
    ]
  },

  // 4. FULL HOME CLEANING
  {
    id: 'full-home-cleaning',
    name: 'Full Home Cleaning',
    subtitle: 'Comprehensive 360° deep sanitization for apartments, villas, duplexes & independent houses.',
    iconName: 'Home',
    heroImage: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
    startingPrice: 1499,
    items: [
      {
        id: 'home-1-room',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: '1 Room',
        duration: '1.5 hrs',
        originalPrice: 1999,
        offerPrice: 1299,
        imageUrl: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
        description: 'Floor scrubbing, ceiling cobweb removal, doors, switches & glass window wipe.',
        rating: 4.88,
        reviewCount: 780
      },
      {
        id: 'home-1rk-set',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: '1 Room Kitchen Set',
        duration: '2.5 hrs',
        originalPrice: 2499,
        offerPrice: 1699,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        description: 'Full room deep clean plus complete kitchen slab degreasing & sink sanitization.',
        rating: 4.89,
        reviewCount: 610
      },
      {
        id: 'home-1rk-bath',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: '1 Room 1 Bathroom',
        duration: '3 hrs',
        originalPrice: 2899,
        offerPrice: 1999,
        imageUrl: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
        popular: true,
        description: 'Bedroom deep clean + 1 bathroom descaling with acid-free Diversey chemical.',
        rating: 4.93,
        reviewCount: 1240
      },
      {
        id: 'home-under-1201',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home <1201 sqft',
        duration: '4 hrs',
        originalPrice: 3899,
        offerPrice: 2499,
        imageUrl: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
        popular: true,
        description: 'Complete 2 BHK home scrubbing, kitchen chimney degrease, 2 bathrooms & balcony wash.',
        rating: 4.94,
        reviewCount: 1890
      },
      {
        id: 'home-1201-2000',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home 1201-2000 sqft',
        duration: '5 hrs',
        originalPrice: 4999,
        offerPrice: 3299,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Full 3 BHK deep clean with single-disc rotary machine floor buffing.',
        rating: 4.96,
        reviewCount: 1420
      },
      {
        id: 'home-2001-3000',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home 2001-3000 sqft',
        duration: '6 hrs',
        originalPrice: 6499,
        offerPrice: 4299,
        imageUrl: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
        description: 'Large 4 BHK or independent floor deep clean by 4 certified specialists.',
        rating: 4.91,
        reviewCount: 890
      },
      {
        id: 'home-3001-4000',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home 3001-4000 sqft',
        duration: '7 hrs',
        originalPrice: 7999,
        offerPrice: 5399,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        description: 'Executive villa or penthouse 360° deep sanitization with industrial equipment.',
        rating: 4.92,
        reviewCount: 540
      },
      {
        id: 'home-4001-5000',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home 4001-5000 sqft',
        duration: '8 hrs',
        originalPrice: 9499,
        offerPrice: 6499,
        imageUrl: '/src/assets/images/full_home_deep_cleaning_1790693627652.jpg',
        description: 'Luxury estate 5-6 bedroom deep clean including terraces, garage & utility areas.',
        rating: 4.90,
        reviewCount: 320
      },
      {
        id: 'home-5001-6000',
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home Cleaning',
        name: 'Independent Home 5001-6000 sqft',
        duration: '8+ hrs',
        originalPrice: 11999,
        offerPrice: 7899,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        description: 'Grand luxury bungalow end-to-end deep clean with team lead supervision.',
        rating: 4.95,
        reviewCount: 210
      }
    ]
  },

  // 5. BATHROOM DEEP CLEANING
  {
    id: 'bathroom-cleaning',
    name: 'Bathroom Deep Cleaning',
    subtitle: 'Hard water tile descaling, toilet bowl sanitization, tap chrome shine & exhaust degreasing.',
    iconName: 'Bath',
    heroImage: '/src/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
    startingPrice: 399,
    items: [
      {
        id: 'bath-1',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 1 Bathroom',
        duration: '45 mins',
        originalPrice: 699,
        offerPrice: 399,
        imageUrl: '/src/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
        popular: true,
        description: 'Tile scrubbing, shower glass descaling, mirror buffing & Diversey acid-free sanitized wash.',
        rating: 4.92,
        reviewCount: 3410
      },
      {
        id: 'bath-2',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 2 Bathroom',
        duration: '1.5 hrs',
        originalPrice: 1299,
        offerPrice: 749,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Master & guest washrooms deep scrub, yellow stain removal & chrome fixture shine.',
        rating: 4.95,
        reviewCount: 2890
      },
      {
        id: 'bath-3',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 3 Bathroom',
        duration: '2 hrs',
        originalPrice: 1899,
        offerPrice: 1099,
        imageUrl: '/src/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
        description: '3 bathrooms deep descaling with grout cleaning & anti-bacterial fogging.',
        rating: 4.91,
        reviewCount: 1540
      },
      {
        id: 'bath-4',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 4 Bathroom',
        duration: '2.5 hrs',
        originalPrice: 2499,
        offerPrice: 1399,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Villa or duplex 4 washrooms deep clean including vanity cabinets & exhaust.',
        rating: 4.90,
        reviewCount: 880
      },
      {
        id: 'bath-5',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 5 Bathroom',
        duration: '3 hrs',
        originalPrice: 2999,
        offerPrice: 1699,
        imageUrl: '/src/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
        description: '5 luxury washrooms complete hard-water scale removal and odor neutralizer.',
        rating: 4.89,
        reviewCount: 460
      },
      {
        id: 'bath-6',
        categoryId: 'bathroom-cleaning',
        categoryName: 'Bathroom Deep Cleaning',
        name: 'Intense cleaning 6 Bathroom',
        duration: '3.5 hrs',
        originalPrice: 3599,
        offerPrice: 1999,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Grand home 6 bathrooms comprehensive sanitization with specialized scale remover.',
        rating: 4.94,
        reviewCount: 290
      }
    ]
  },

  // 6. GLASS & WINDOW CLEANING
  {
    id: 'glass-window',
    name: 'Glass & Window Cleaning',
    subtitle: 'Streak-free window panes, glass railings, sliding track dust removal & facade wiping.',
    iconName: 'Maximize2',
    heroImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    startingPrice: 399,
    items: [
      {
        id: 'glass-10-100',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '10-100 Sq Ft',
        duration: '45 mins',
        originalPrice: 699,
        offerPrice: 399,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: 'Balcony glass doors or small window section streak-free squeegee wash.',
        rating: 4.88,
        reviewCount: 670
      },
      {
        id: 'glass-100-200',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '100-200 Sq Ft',
        duration: '1 hr',
        originalPrice: 999,
        offerPrice: 599,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Standard apartment all bedroom windows & balcony glass pane cleaning.',
        rating: 4.91,
        reviewCount: 940
      },
      {
        id: 'glass-200-300',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '200-300 Sq ft',
        duration: '1.5 hrs',
        originalPrice: 1399,
        offerPrice: 849,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: 'Double balcony glass railing & large living room French windows scrub.',
        rating: 4.89,
        reviewCount: 580
      },
      {
        id: 'glass-300-500',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '300-500 Sq Ft',
        duration: '2 hrs',
        originalPrice: 1899,
        offerPrice: 1199,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Duplex full glass facade, glass partitions and window tracks vacuuming.',
        rating: 4.90,
        reviewCount: 410
      },
      {
        id: 'glass-500-750',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '500-750 Sq Ft',
        duration: '2.5 hrs',
        originalPrice: 2499,
        offerPrice: 1599,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: 'Commercial showroom or villa grand glass facade clean with anti-static solution.',
        rating: 4.87,
        reviewCount: 260
      },
      {
        id: 'glass-750-1000',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '750-1000 Sq Ft',
        duration: '3 hrs',
        originalPrice: 3199,
        offerPrice: 2099,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Large commercial glass facade, interior cabins & conference glass partitions.',
        rating: 4.92,
        reviewCount: 190
      },
      {
        id: 'glass-1000-2000',
        categoryId: 'glass-window',
        categoryName: 'Glass & Window Cleaning',
        name: '1000-2000 Sq Ft',
        duration: '4 hrs',
        originalPrice: 4999,
        offerPrice: 3299,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: 'Industrial or corporate tower extensive window & glass panel high-shine wash.',
        rating: 4.94,
        reviewCount: 140
      }
    ]
  },

  // 7. WATER TANK CLEANING
  {
    id: 'water-tank',
    name: 'Water Tank Cleaning',
    subtitle: '6-stage mechanized dewatering, sludge vacuuming, high-pressure jet scrub & UV sanitization.',
    iconName: 'Droplets',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    startingPrice: 699,
    items: [
      {
        id: 'tank-upto-500',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: 'Upto 500L',
        duration: '45 mins',
        originalPrice: 1099,
        offerPrice: 699,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Rooftop Sintex/PVC tank sludge extraction, potassium permanganate wash & UV disinfection.',
        rating: 4.91,
        reviewCount: 1820
      },
      {
        id: 'tank-500-1000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '500-1000L',
        duration: '1 hr',
        originalPrice: 1499,
        offerPrice: 949,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Standard 1000L overhead domestic tank mechanical scrub with antibacterial spray.',
        rating: 4.93,
        reviewCount: 2190
      },
      {
        id: 'tank-1000-1500',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '1000-1500L',
        duration: '1.5 hrs',
        originalPrice: 1899,
        offerPrice: 1199,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Large rooftop tank 6-stage scientific sanitization killing 99.9% germs & algae.',
        rating: 4.89,
        reviewCount: 840
      },
      {
        id: 'tank-1001-2000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '1001-2000L',
        duration: '1.5 hrs',
        originalPrice: 2299,
        offerPrice: 1449,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: '2000 Litre overhead water storage deep vacuum sludge pump & high-pressure jet.',
        rating: 4.92,
        reviewCount: 650
      },
      {
        id: 'tank-1501-3000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '1501-3000L',
        duration: '2 hrs',
        originalPrice: 2799,
        offerPrice: 1799,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Underground sump or commercial PVC overhead tank deep sludge extraction.',
        rating: 4.90,
        reviewCount: 420
      },
      {
        id: 'tank-3001-5000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '3001-5000L',
        duration: '2.5 hrs',
        originalPrice: 3999,
        offerPrice: 2599,
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        description: 'Society or school 5000L RCC/Masonry underground water tank scrub.',
        rating: 4.94,
        reviewCount: 310
      },
      {
        id: 'tank-5001-8000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '5001-8000L',
        duration: '3.5 hrs',
        originalPrice: 5499,
        offerPrice: 3599,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Apartment building master reservoir 6-step mechanized sanitization.',
        rating: 4.91,
        reviewCount: 190
      },
      {
        id: 'tank-8001-12000',
        categoryId: 'water-tank',
        categoryName: 'Water Tank Cleaning',
        name: '8001-12000L',
        duration: '4.5 hrs',
        originalPrice: 7999,
        offerPrice: 4999,
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Hospital, hotel or large society heavy capacity tank decontamination.',
        rating: 4.96,
        reviewCount: 110
      }
    ]
  },

  // 8. COMMERCIAL SPACE CLEANING
  {
    id: 'commercial-cleaning',
    name: 'Commercial Space Cleaning',
    subtitle: 'Offices, clinics, showrooms, retail outlets & educational institutions deep sanitizing.',
    iconName: 'Building2',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    startingPrice: 1499,
    items: [
      {
        id: 'comm-under-500',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '<500 sqft',
        duration: '2 hrs',
        originalPrice: 2299,
        offerPrice: 1499,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Doctor clinic, boutique shop or boutique studio floor scrubbing & workstation wipe.',
        rating: 4.90,
        reviewCount: 940
      },
      {
        id: 'comm-501-1000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '501-1000 sqft',
        duration: '3 hrs',
        originalPrice: 3499,
        offerPrice: 2299,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Startup office or bank branch floor buffing, desk sanitization & washroom clean.',
        rating: 4.92,
        reviewCount: 820
      },
      {
        id: 'comm-1001-2000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '1001-2000 sqft',
        duration: '4 hrs',
        originalPrice: 5499,
        offerPrice: 3699,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        description: 'Corporate office floor scrubbing, conference room glass shine & pantry deep scrub.',
        rating: 4.89,
        reviewCount: 610
      },
      {
        id: 'comm-2000-3000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '2000-3000 sqft',
        duration: '5 hrs',
        originalPrice: 7499,
        offerPrice: 4999,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
        description: 'Multi-bay workplace, gym or restaurant comprehensive commercial clean.',
        rating: 4.91,
        reviewCount: 430
      },
      {
        id: 'comm-3001-4000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '3001-4000 sqft',
        duration: '6 hrs',
        originalPrice: 9499,
        offerPrice: 6399,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        description: 'Full office floor complete vacuuming, rotary machine scrub & restroom disinfection.',
        rating: 4.93,
        reviewCount: 310
      },
      {
        id: 'comm-4001-5000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '4001-5000 sqft',
        duration: '7 hrs',
        originalPrice: 11499,
        offerPrice: 7799,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
        description: 'Mid-sized IT facility or educational institution industrial standard cleaning.',
        rating: 4.88,
        reviewCount: 220
      },
      {
        id: 'comm-5001-6000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '5001-6000 Sq Ft',
        duration: '8 hrs',
        originalPrice: 13499,
        offerPrice: 8999,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        description: 'Large corporate facility 6-cleaner team with rotary buffers & industrial vacuums.',
        rating: 4.95,
        reviewCount: 160
      },
      {
        id: 'comm-6001-7500',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '6001-7500 Sq Ft',
        duration: '8+ hrs',
        originalPrice: 16999,
        offerPrice: 11299,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
        description: 'Enterprise office complex comprehensive night-shift or weekend deep cleaning.',
        rating: 4.92,
        reviewCount: 110
      },
      {
        id: 'comm-7501-10000',
        categoryId: 'commercial-cleaning',
        categoryName: 'Commercial Space Cleaning',
        name: '7501-10000 sqft',
        duration: 'Full Day',
        originalPrice: 21999,
        offerPrice: 14499,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        description: 'Full commercial building or mega showroom facility end-to-end hospital grade treatment.',
        rating: 4.97,
        reviewCount: 85
      }
    ]
  },

  // 9. KITCHEN DEEP CLEANING
  {
    id: 'kitchen-cleaning',
    name: 'Kitchen Deep Cleaning',
    subtitle: 'Oil & grease degreasing, chimney baffle filter wash, tile grout scrub, fridge & stove shine.',
    iconName: 'Utensils',
    heroImage: '/src/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
    startingPrice: 399,
    items: [
      {
        id: 'kit-fridge',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Fridge Cleaning',
        duration: '45 mins',
        originalPrice: 699,
        offerPrice: 399,
        imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Single/Double door refrigerator interior defrost, rack scrub & anti-bacterial wipe.',
        rating: 4.91,
        reviewCount: 1780
      },
      {
        id: 'kit-chimney',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Chimney Cleaning',
        duration: '1 hr',
        originalPrice: 899,
        offerPrice: 549,
        imageUrl: '/src/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
        popular: true,
        description: 'Baffle filter caustic chemical dip, motor hood degreasing & exterior steel shine.',
        rating: 4.94,
        reviewCount: 2650
      },
      {
        id: 'kit-chimney-fridge',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Chimney + Fridge',
        duration: '1.5 hrs',
        originalPrice: 1499,
        offerPrice: 899,
        imageUrl: '/src/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
        popular: true,
        description: 'Combo package: complete chimney degrease plus refrigerator interior hygiene scrub.',
        rating: 4.93,
        reviewCount: 1420
      },
      {
        id: 'kit-without-chimney',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Full Home Kitchen without chimney',
        duration: '2 hrs',
        originalPrice: 1799,
        offerPrice: 1199,
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        description: 'Tile scrub, slab stain elimination, cabinets interior/exterior & sink sanitizing.',
        rating: 4.88,
        reviewCount: 980
      },
      {
        id: 'kit-with-chimney',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Full Home Kitchen with chimney',
        duration: '2.5 hrs',
        originalPrice: 2299,
        offerPrice: 1499,
        imageUrl: '/src/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
        popular: true,
        description: 'Full modular kitchen deep scrub + chimney filter boiling wash & oil residue removal.',
        rating: 4.96,
        reviewCount: 3120
      },
      {
        id: 'kit-empty',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Full Home Empty Kitchen Cleaning',
        duration: '2 hrs',
        originalPrice: 1699,
        offerPrice: 1099,
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        description: 'Move-in / move-out vacant kitchen deep power wash, shelves & floor scrubbing.',
        rating: 4.89,
        reviewCount: 750
      },
      {
        id: 'kit-full-appliance',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Fridge + Chimney + Stove + Exhaust',
        duration: '3 hrs',
        originalPrice: 2699,
        offerPrice: 1799,
        imageUrl: '/src/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
        popular: true,
        description: 'All 4 essential kitchen appliances deep degreased, scrubbed and buffed to like-new.',
        rating: 4.95,
        reviewCount: 1680
      },
      {
        id: 'kit-commercial',
        categoryId: 'kitchen-cleaning',
        categoryName: 'Kitchen Deep Cleaning',
        name: 'Commercial Kitchen Deep Cleaning',
        duration: '4 hrs',
        originalPrice: 4999,
        offerPrice: 3299,
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        description: 'Restaurant, cafe or cloud kitchen heavy grease duct, burner & stainless steel scrub.',
        rating: 4.92,
        reviewCount: 340
      }
    ]
  },

  // 10. CHAIR DEEP CLEANING
  {
    id: 'chair-cleaning',
    name: 'Chair Deep Cleaning',
    subtitle: 'Dining chairs, executive office chairs & fabric armchairs hot water extraction shampoo.',
    iconName: 'Armchair',
    heroImage: 'https://images.unsplash.com/photo-1580481077195-c328865db7e7?auto=format&fit=crop&w=600&q=80',
    startingPrice: 399,
    items: [
      {
        id: 'chair-5-10',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '5-10 Chairs',
        duration: '1 hr',
        originalPrice: 999,
        offerPrice: 599,
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328865db7e7?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Dining set (up to 8 chairs) or office study chairs foam shampooing & stain lift.',
        rating: 4.89,
        reviewCount: 1120
      },
      {
        id: 'chair-10-15',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '10-15 Chair',
        duration: '1.5 hrs',
        originalPrice: 1499,
        offerPrice: 899,
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80',
        popular: true,
        description: 'Conference room or large dining set deep fabric cleaning with vacuum drying.',
        rating: 4.91,
        reviewCount: 780
      },
      {
        id: 'chair-15-20',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '15-20 Chairs',
        duration: '2 hrs',
        originalPrice: 1999,
        offerPrice: 1249,
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328865db7e7?auto=format&fit=crop&w=600&q=80',
        description: 'Small office or training room 20 ergonomic chairs steam sanitization.',
        rating: 4.88,
        reviewCount: 520
      },
      {
        id: 'chair-20-30',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '20-30 Chairs',
        duration: '2.5 hrs',
        originalPrice: 2899,
        offerPrice: 1799,
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80',
        description: 'Boardroom and workstation mesh/fabric chair deep wash and odor neutralizer.',
        rating: 4.90,
        reviewCount: 390
      },
      {
        id: 'chair-30-50',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '30-50 Chairs',
        duration: '3.5 hrs',
        originalPrice: 4499,
        offerPrice: 2899,
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328865db7e7?auto=format&fit=crop&w=600&q=80',
        description: 'Co-working space or IT bay 50 office chairs machine extraction.',
        rating: 4.93,
        reviewCount: 260
      },
      {
        id: 'chair-50-75',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '50-75 Chairs',
        duration: '4.5 hrs',
        originalPrice: 6499,
        offerPrice: 4199,
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80',
        description: 'Auditorium or banquet 75 upholstered seats deep chemical wash.',
        rating: 4.87,
        reviewCount: 180
      },
      {
        id: 'chair-75-100',
        categoryId: 'chair-cleaning',
        categoryName: 'Chair Deep Cleaning',
        name: '75-100 Chairs',
        duration: '6 hrs',
        originalPrice: 8999,
        offerPrice: 5799,
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328865db7e7?auto=format&fit=crop&w=600&q=80',
        description: 'Large enterprise or event hall 100 chairs comprehensive restoration.',
        rating: 4.95,
        reviewCount: 130
      }
    ]
  }
];

// Helper to convert CatalogItem to CleaningService for booking modal compatibility
export function catalogItemToCleaningService(item: CatalogItem): CleaningService {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    name: item.name,
    shortDesc: item.description,
    detailedDesc: item.description,
    referencePrice: item.originalPrice,
    competitorPrice: item.originalPrice,
    discountPct: Math.round(((item.originalPrice - item.offerPrice) / item.originalPrice) * 100),
    basePrice: item.offerPrice,
    pricingMode: 'REFERENCE_PERCENT',
    priceVersion: 'v2.0.0',
    active: true,
    estimatedMinutes: item.duration.includes('hr') 
      ? parseFloat(item.duration) * 60 
      : parseInt(item.duration) || 60,
    rating: item.rating,
    reviewCount: item.reviewCount,
    imageUrl: item.imageUrl,
    beforeAfterImage: item.imageUrl,
    demoVideoBadge: 'Diversey Certified',
    popular: item.popular,
    steps: [
      { order: 1, title: 'Inspection & Preparation', description: 'Pre-service check of fabric, stains and water points.', estimatedMinutes: 15 },
      { order: 2, title: 'Deep Treatment', description: 'Application of Diversey neutral pH cleaning agent with power machine.', estimatedMinutes: 45 },
      { order: 3, title: 'Extraction & Sanitization', description: 'High-power suction moisture extraction and UV anti-microbial wipe.', estimatedMinutes: 30 }
    ],
    inclusions: [
      'Industrial grade German Kärcher extraction',
      'Neutral pH Diversey Taski chemicals',
      'Trained & background-verified professionals',
      'Post-service quality check'
    ],
    exclusions: [
      'Structural electrical rewiring',
      'Wall paint touch-ups'
    ],
    addons: []
  };
}
