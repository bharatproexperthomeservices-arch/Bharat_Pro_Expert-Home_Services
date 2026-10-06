import { CleaningService } from '../types';

export interface ServiceVariant {
  variantId: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  description?: string;
  active: boolean;
}

export interface ServiceAddOn {
  addOnId: string;
  name: string;
  description: string;
  price: number;
  quantityAllowed: boolean;
  maxQuantity?: number;
  active: boolean;
}

export interface CatalogItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  duration: string;
  originalPrice: number;
  offerPrice: number;
  imageUrl: string;
  beforeAfterImage?: string;
  popular?: boolean;
  description: string;
  rating: number;
  reviewCount: number;
  inclusions: string[];
  exclusions: string[];
  tools: string[];
  processSteps: { order: number; title: string; description: string; estimatedMinutes: number }[];
  variants?: ServiceVariant[];
  addOns?: ServiceAddOn[];
  cancellationPolicy?: string;
  active: boolean;
  sortOrder: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  heroImage: string;
  startingPrice: number;
  active: boolean;
  sortOrder: number;
  items: CatalogItem[];
}

const IMG = {
  homeFurnished: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85',
  homeUnfurnished: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=85',
  homeLuxury: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=85',
  homeVilla: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85',
  apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=85',
  roomBedroom: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=85',
  roomLiving: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=85',
  roomKitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85',
  kitchenBasic: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=85',
  kitchenDeep: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800&q=85',
  kitchenChimney: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=85',
  kitchenFridge: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=85',
  kitchenOven: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&q=85',
  kitchenStove: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=85',
  kitchenSink: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=85',
  kitchenCabinet: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=85',
  bathroomBasic: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=85',
  bathroomDeep: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=85',
  bathroomModern: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=85',
  bathroomSpa: 'https://images.unsplash.com/photo-1600566752986-f7e0e2a4e0a5?w=800&q=85',
  toilet: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&q=85',
  floorMarble: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=85',
  floorTile: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=85',
  floorWooden: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=85',
  sofa3: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=85',
  sofa5: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=85',
  sofaL: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=85',
  chairDining: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=85',
  chairOffice: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=85',
  carpet: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85',
  carpetLarge: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=85',
  mattress: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=85',
  mattressLarge: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=85',
  glass: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=85',
  glassLarge: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=85',
  fanCeiling: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=85',
  fanExhaust: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=85',
  chandelier: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800&q=85',
  curtain: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=800&q=85',
  balcony: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
  door: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=85',
  moveIn: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=85',
  moveOut: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=85',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=85',
  officeLarge: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=85',
  clinic: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=85',
  shop: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=85',
  recurring: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=85',
};

const BATHROOM_ADDONS: ServiceAddOn[] = [
  { addOnId: 'bath-exhaust-fan', name: 'Exhaust Fan Cleaning', description: 'Deep cleaning of exhaust fan', price: 149, quantityAllowed: false, active: true },
  { addOnId: 'bath-mirror', name: 'Mirror Deep Clean', description: 'Streak-free mirror polish', price: 99, quantityAllowed: false, active: true },
  { addOnId: 'bath-tile-deep', name: 'Tile Deep Scrubbing', description: 'Grout line scrubbing', price: 249, quantityAllowed: false, active: true },
  { addOnId: 'bath-extra-toilet', name: 'Additional Toilet', description: 'Extra toilet bowl clean', price: 199, quantityAllowed: true, maxQuantity: 5, active: true },
];

const KITCHEN_ADDONS: ServiceAddOn[] = [
  { addOnId: 'kit-chimney-ext', name: 'Chimney Exterior Clean', description: 'Exterior chimney hood', price: 299, quantityAllowed: false, active: true },
  { addOnId: 'kit-cabinet-ext', name: 'Cabinet Exterior Clean', description: 'Cabinet exterior wiping', price: 199, quantityAllowed: false, active: true },
  { addOnId: 'kit-fridge-ext', name: 'Fridge Exterior Clean', description: 'Fridge exterior polish', price: 149, quantityAllowed: false, active: true },
  { addOnId: 'kit-microwave', name: 'Microwave Deep Clean', description: 'Microwave interior', price: 199, quantityAllowed: false, active: true },
];

const HOME_ADDONS: ServiceAddOn[] = [
  { addOnId: 'home-balcony', name: 'Balcony Cleaning', description: 'Extra balcony clean', price: 299, quantityAllowed: true, maxQuantity: 4, active: true },
  { addOnId: 'home-ceiling-fan', name: 'Ceiling Fan Cleaning', description: 'Per ceiling fan', price: 99, quantityAllowed: true, maxQuantity: 10, active: true },
  { addOnId: 'home-fridge-int', name: 'Fridge Interior Clean', description: 'Fridge interior deep', price: 399, quantityAllowed: false, active: true },
  { addOnId: 'home-oven', name: 'Oven Deep Clean', description: 'Oven interior degrease', price: 499, quantityAllowed: false, active: true },
  { addOnId: 'home-switchboard', name: 'Switchboard Cleaning', description: 'All switchboards wipe', price: 149, quantityAllowed: false, active: true },
  { addOnId: 'home-doors', name: 'Doors Cleaning', description: 'All doors wipe', price: 199, quantityAllowed: true, maxQuantity: 10, active: true },
];

const FAN_ADDONS: ServiceAddOn[] = [
  { addOnId: 'fan-extra-ceiling', name: 'Additional Ceiling Fan', description: 'Extra ceiling fan', price: 99, quantityAllowed: true, maxQuantity: 10, active: true },
  { addOnId: 'fan-exhaust', name: 'Exhaust Fan Cleaning', description: 'Kitchen/bathroom exhaust', price: 149, quantityAllowed: true, maxQuantity: 5, active: true },
  { addOnId: 'fan-wall', name: 'Wall Fan Cleaning', description: 'Wall mounted fan', price: 149, quantityAllowed: true, maxQuantity: 5, active: true },
];

const SOFA_ADDONS: ServiceAddOn[] = [
  { addOnId: 'sofa-1-seat', name: '1 Seater Sofa', description: 'Single seater deep shampoo', price: 249, quantityAllowed: true, maxQuantity: 10, active: true },
  { addOnId: 'sofa-cushion', name: 'Additional Cushion', description: 'Extra cushion', price: 99, quantityAllowed: true, maxQuantity: 10, active: true },
];

const CARPET_ADDONS: ServiceAddOn[] = [
  { addOnId: 'carpet-stain', name: 'Stain Treatment', description: 'Targeted stain removal', price: 199, quantityAllowed: false, active: true },
  { addOnId: 'carpet-extra', name: 'Additional Carpet', description: 'Extra carpet/rug', price: 299, quantityAllowed: true, maxQuantity: 5, active: true },
];

const CURTAIN_ADDONS: ServiceAddOn[] = [
  { addOnId: 'curtain-extra', name: 'Additional Curtain', description: 'Extra curtain panel', price: 149, quantityAllowed: true, maxQuantity: 20, active: true },
  { addOnId: 'curtain-rod', name: 'Curtain Rod Cleaning', description: 'Rod and bracket wipe', price: 99, quantityAllowed: true, maxQuantity: 10, active: true },
];

export const MASTER_CATALOG_CATEGORIES: CatalogCategory[] = [

  {
    id: 'complete-home-cleaning',
    name: 'Complete Home Cleaning',
    subtitle: 'Deep cleaning for independent houses and villas',
    iconName: 'Home',
    heroImage: IMG.homeFurnished,
    startingPrice: 1999,
    active: true,
    sortOrder: 1,
    items: [
      { id: 'home-1bhk-furnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '1 BHK Furnished Home Cleaning', duration: '4-5 hrs', originalPrice: 4199, offerPrice: 3499, imageUrl: IMG.homeFurnished, popular: true, description: 'Complete 1 BHK furnished home deep cleaning with sofa, furniture, all rooms.', rating: 4.9, reviewCount: 3420, inclusions: ['All rooms floor scrubbing', 'Furniture dusting & wipe', 'Kitchen slab degreasing', 'Bathroom deep cleaning', 'Ceiling & wall dusting', 'Window & glass cleaning', 'Balcony'], exclusions: ['Wall repainting', 'Furniture polishing', 'Structural repairs', 'Pest control'], tools: ['Scrubbing machine', 'Vacuum cleaner', 'Microfiber cloths', 'Diversey chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-service check', estimatedMinutes: 15 }, { order: 2, title: 'Dry cleaning', description: 'Dusting and vacuuming', estimatedMinutes: 45 }, { order: 3, title: 'Wet cleaning', description: 'Floor scrubbing', estimatedMinutes: 90 }, { order: 4, title: 'Final touch', description: 'Kitchen, bathroom, balcony', estimatedMinutes: 60 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 1 },
      { id: 'home-1bhk-unfurnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '1 BHK Unfurnished Home Cleaning', duration: '3-4 hrs', originalPrice: 3499, offerPrice: 2799, imageUrl: IMG.homeUnfurnished, description: 'Complete 1 BHK unfurnished home deep cleaning.', rating: 4.9, reviewCount: 2140, inclusions: ['All rooms floor scrubbing', 'Kitchen slab degreasing', 'Bathroom deep cleaning', 'Ceiling & wall dusting', 'Window cleaning', 'Balcony'], exclusions: ['Wall repainting', 'Structural repairs'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 15 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 40 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 80 }, { order: 4, title: 'Final', description: 'Kitchen, bathroom, balcony', estimatedMinutes: 50 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
      { id: 'home-2bhk-furnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '2 BHK Furnished Home Cleaning', duration: '5-6 hrs', originalPrice: 5999, offerPrice: 4799, imageUrl: IMG.homeFurnished, popular: true, description: 'Complete 2 BHK furnished home deep cleaning.', rating: 4.9, reviewCount: 4890, inclusions: ['All rooms deep clean', 'Furniture wipe', 'Kitchen complete', '2 bathrooms', 'All windows', 'Balcony'], exclusions: ['Wall repainting', 'Furniture polishing'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 15 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 60 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 120 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 105 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
      { id: 'home-2bhk-unfurnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '2 BHK Unfurnished Home Cleaning', duration: '4-5 hrs', originalPrice: 4999, offerPrice: 3999, imageUrl: IMG.homeUnfurnished, description: 'Complete 2 BHK unfurnished home deep cleaning.', rating: 4.9, reviewCount: 3240, inclusions: ['All rooms', 'Kitchen', '2 bathrooms', 'Windows', 'Balcony'], exclusions: ['Wall repainting', 'Structural repairs'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 15 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 50 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 100 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 85 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 4 },
      { id: 'home-3bhk-furnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '3 BHK Furnished Home Cleaning', duration: '6-7 hrs', originalPrice: 7999, offerPrice: 6299, imageUrl: IMG.homeLuxury, popular: true, description: 'Complete 3 BHK furnished home deep cleaning.', rating: 4.9, reviewCount: 1890, inclusions: ['All rooms', 'Furniture wipe', 'Kitchen complete', '3 bathrooms', 'Windows', 'Balcony'], exclusions: ['Wall repainting', 'Furniture polishing'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 20 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 75 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 150 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 115 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 5 },
      { id: 'home-3bhk-unfurnished', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '3 BHK Unfurnished Home Cleaning', duration: '5-6 hrs', originalPrice: 6999, offerPrice: 5499, imageUrl: IMG.homeUnfurnished, description: 'Complete 3 BHK unfurnished home deep cleaning.', rating: 4.9, reviewCount: 920, inclusions: ['All rooms', 'Kitchen', '3 bathrooms', 'Windows', 'Balcony'], exclusions: ['Wall repainting', 'Structural repairs'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 20 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 65 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 130 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 105 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 6 },
      { id: 'home-4bhk', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: '4 BHK Complete Home Cleaning', duration: '7-8 hrs', originalPrice: 9999, offerPrice: 7999, imageUrl: IMG.homeLuxury, description: 'Complete 4 BHK home deep cleaning.', rating: 4.9, reviewCount: 740, inclusions: ['All rooms', 'Kitchen', '4 bathrooms', 'Balcony', 'Terrace', 'Windows'], exclusions: ['Wall repainting', 'Furniture polishing'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Team lead check', estimatedMinutes: 20 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 90 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 180 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 130 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 7 },
      { id: 'home-villa', categoryId: 'complete-home-cleaning', categoryName: 'Complete Home Cleaning', name: 'Villa / Bungalow (5+ BHK)', duration: '8+ hrs', originalPrice: 14999, offerPrice: 11999, imageUrl: IMG.homeVilla, description: 'Complete luxury villa / bungalow deep cleaning.', rating: 5.0, reviewCount: 460, inclusions: ['All rooms', 'Kitchen', 'All bathrooms', 'Terrace', 'Garage', 'Windows'], exclusions: ['Wall repainting', 'Furniture polishing', 'Structural repairs'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Team lead inspects', estimatedMinutes: 30 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 120 }, { order: 3, title: 'Wet clean', description: 'Floor scrub & polish', estimatedMinutes: 240 }, { order: 4, title: 'Final', description: 'Kitchen, baths, terrace', estimatedMinutes: 150 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 8 },
    ],
  },

  {
    id: 'apartment-cleaning',
    name: 'Apartment Cleaning',
    subtitle: 'Apartment deep cleaning based on BHK size',
    iconName: 'Building2',
    heroImage: IMG.apartment,
    startingPrice: 1999,
    active: true,
    sortOrder: 2,
    items: [
      { id: 'apartment-1bhk', categoryId: 'apartment-cleaning', categoryName: 'Apartment Cleaning', name: '1 BHK Apartment Cleaning', duration: '3-4 hrs', originalPrice: 2999, offerPrice: 2199, imageUrl: IMG.apartment, popular: true, description: 'Complete 1 BHK apartment deep cleaning.', rating: 4.9, reviewCount: 3420, inclusions: ['All rooms', 'Kitchen', 'Bathroom', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture polish'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 15 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 45 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 90 }, { order: 4, title: 'Final', description: 'Kitchen and bath', estimatedMinutes: 60 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 1 },
      { id: 'apartment-2bhk', categoryId: 'apartment-cleaning', categoryName: 'Apartment Cleaning', name: '2 BHK Apartment Cleaning', duration: '4-5 hrs', originalPrice: 4299, offerPrice: 3499, imageUrl: IMG.apartment, popular: true, description: 'Complete 2 BHK apartment deep cleaning.', rating: 4.9, reviewCount: 4890, inclusions: ['All rooms', 'Kitchen', '2 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture polish'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 15 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 60 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 120 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 105 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
      { id: 'apartment-3bhk', categoryId: 'apartment-cleaning', categoryName: 'Apartment Cleaning', name: '3 BHK Apartment Cleaning', duration: '5-6 hrs', originalPrice: 5999, offerPrice: 4499, imageUrl: IMG.apartment, popular: true, description: 'Complete 3 BHK apartment deep cleaning.', rating: 4.9, reviewCount: 3240, inclusions: ['All rooms', 'Kitchen', '3 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture polish'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 20 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 75 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 150 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 115 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
      { id: 'apartment-4bhk', categoryId: 'apartment-cleaning', categoryName: 'Apartment Cleaning', name: '4 BHK Apartment Cleaning', duration: '6-8 hrs', originalPrice: 7999, offerPrice: 5999, imageUrl: IMG.apartment, description: 'Complete 4 BHK apartment deep cleaning.', rating: 4.9, reviewCount: 1890, inclusions: ['All rooms', 'Kitchen', '4 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture polish'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Pre-check', estimatedMinutes: 20 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 90 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 180 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 130 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 4 },
      { id: 'apartment-5bhk', categoryId: 'apartment-cleaning', categoryName: 'Apartment Cleaning', name: '5 BHK Apartment Cleaning', duration: '8+ hrs', originalPrice: 11999, offerPrice: 8999, imageUrl: IMG.apartment, description: 'Complete 5 BHK luxury apartment cleaning.', rating: 4.9, reviewCount: 920, inclusions: ['All rooms', 'Kitchen', '5 bathrooms', 'Terrace', 'Windows'], exclusions: ['Wall painting', 'Furniture polish'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Diversey'], processSteps: [{ order: 1, title: 'Inspection', description: 'Team lead check', estimatedMinutes: 30 }, { order: 2, title: 'Dry clean', description: 'Dust and vacuum', estimatedMinutes: 120 }, { order: 3, title: 'Wet clean', description: 'Floor scrub', estimatedMinutes: 240 }, { order: 4, title: 'Final', description: 'Kitchen and baths', estimatedMinutes: 150 }], addOns: HOME_ADDONS, cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 5 },
    ],
  },

  {
    id: 'room-cleaning',
    name: 'Room Cleaning',
    subtitle: 'Deep cleaning for every room type',
    iconName: 'DoorOpen',
    heroImage: IMG.roomBedroom,
    startingPrice: 499,
    active: true,
    sortOrder: 3,
    items: [
      { id: 'room-bedroom', categoryId: 'room-cleaning', categoryName: 'Room Cleaning', name: 'Bedroom Deep Cleaning', duration: '1-2 hrs', originalPrice: 899, offerPrice: 599, imageUrl: IMG.roomBedroom, popular: true, description: 'Complete bedroom deep cleaning.', rating: 4.8, reviewCount: 2890, inclusions: ['Floor scrubbing', 'Ceiling dusting', 'Wall dusting', 'Window cleaning', 'Switchboard wipe', 'Cobweb removal'], exclusions: ['Wall washing', 'Furniture polishing', 'Repainting'], tools: ['Scrubbing brush', 'Vacuum', 'Microfiber', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dry dust', description: 'Ceiling and wall dust', estimatedMinutes: 20 }, { order: 2, title: 'Floor', description: 'Deep floor scrub', estimatedMinutes: 45 }, { order: 3, title: 'Window', description: 'Glass and frame', estimatedMinutes: 20 }, { order: 4, title: 'Mop', description: 'Final wet mop', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
      { id: 'room-living', categoryId: 'room-cleaning', categoryName: 'Room Cleaning', name: 'Living Room Deep Cleaning', duration: '1.5-2 hrs', originalPrice: 1099, offerPrice: 799, imageUrl: IMG.roomLiving, popular: true, description: 'Complete living room deep cleaning.', rating: 4.9, reviewCount: 2140, inclusions: ['Floor scrubbing', 'Sofa vacuuming', 'TV unit wipe', 'Ceiling dusting', 'Window cleaning', 'Cobweb removal'], exclusions: ['Sofa wet wash', 'Wall washing', 'Furniture polish'], tools: ['Scrubbing brush', 'Vacuum', 'Microfiber', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Ceiling and wall dust', estimatedMinutes: 25 }, { order: 2, title: 'Sofa', description: 'Sofa vacuum', estimatedMinutes: 20 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 45 }, { order: 4, title: 'Mop', description: 'Final mop', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
      { id: 'room-kids', categoryId: 'room-cleaning', categoryName: 'Room Cleaning', name: 'Kids Room Cleaning', duration: '1-1.5 hrs', originalPrice: 899, offerPrice: 649, imageUrl: IMG.roomBedroom, description: 'Gentle deep cleaning of kids room.', rating: 4.8, reviewCount: 890, inclusions: ['Floor cleaning', 'Toy area wipe', 'Ceiling dusting', 'Window cleaning', 'Wall dusting'], exclusions: ['Toy wash', 'Wall washing', 'Repainting'], tools: ['Microfiber', 'Vacuum', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Ceiling dust', estimatedMinutes: 15 }, { order: 2, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 30 }, { order: 3, title: 'Mop', description: 'Final mop', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 3 },
      { id: 'room-study', categoryId: 'room-cleaning', categoryName: 'Room Cleaning', name: 'Study Room / Home Office Cleaning', duration: '1-1.5 hrs', originalPrice: 999, offerPrice: 749, imageUrl: IMG.roomBedroom, description: 'Deep cleaning of study room or home office.', rating: 4.8, reviewCount: 640, inclusions: ['Floor cleaning', 'Desk wipe', 'Chair wipe', 'Bookshelf dusting', 'Window cleaning'], exclusions: ['Wall washing', 'Furniture polish'], tools: ['Microfiber', 'Vacuum', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Ceiling and wall', estimatedMinutes: 15 }, { order: 2, title: 'Desk', description: 'Desk and shelf', estimatedMinutes: 20 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 30 }, { order: 4, title: 'Mop', description: 'Mop', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 4 },
      { id: 'room-dining', categoryId: 'room-cleaning', categoryName: 'Room Cleaning', name: 'Dining Room Cleaning', duration: '1-1.5 hrs', originalPrice: 899, offerPrice: 649, imageUrl: IMG.roomLiving, description: 'Deep cleaning of dining room.', rating: 4.8, reviewCount: 460, inclusions: ['Floor cleaning', 'Dining table wipe', 'Chair wipe', 'Ceiling dusting'], exclusions: ['Chair wet wash', 'Furniture polish'], tools: ['Microfiber', 'Vacuum', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Ceiling dust', estimatedMinutes: 15 }, { order: 2, title: 'Table', description: 'Table and chairs', estimatedMinutes: 20 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 30 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 5 },
    ],
  },

  {
    id: 'kitchen-cleaning',
    name: 'Kitchen Cleaning',
    subtitle: 'Complete kitchen deep cleaning services',
    iconName: 'Utensils',
    heroImage: IMG.kitchenBasic,
    startingPrice: 399,
    active: true,
    sortOrder: 4,
    items: [
      { id: 'kitchen-basic', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Kitchen Basic Cleaning', duration: '1-2 hrs', originalPrice: 899, offerPrice: 699, imageUrl: IMG.kitchenBasic, description: 'Surface-level cleaning for kitchen slab, tiles and sink.', rating: 4.8, reviewCount: 3420, inclusions: ['Slab wiping', 'Tile scrubbing', 'Sink cleaning', 'Floor mopping'], exclusions: ['Chimney cleaning', 'Cabinet interior', 'Appliance interior'], tools: ['Degreaser', 'Scrub pad', 'Microfiber', 'Brush'], processSteps: [{ order: 1, title: 'Slab', description: 'Slab degrease', estimatedMinutes: 30 }, { order: 2, title: 'Tile', description: 'Tile scrub', estimatedMinutes: 30 }, { order: 3, title: 'Sink', description: 'Sink clean', estimatedMinutes: 15 }, { order: 4, title: 'Floor', description: 'Floor mop', estimatedMinutes: 15 }], addOns: KITCHEN_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 1 },
      { id: 'kitchen-deep', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Kitchen Deep Cleaning', duration: '3-4 hrs', originalPrice: 2299, offerPrice: 1799, imageUrl: IMG.kitchenDeep, popular: true, description: 'Complete kitchen deep cleaning with chimney, cabinets and degreasing.', rating: 4.9, reviewCount: 4890, inclusions: ['Deep slab degreasing', 'Wall tile scrub', 'Chimney exterior', 'Cabinet exterior', 'Sink deep clean', 'Floor scrub', 'Exhaust fan'], exclusions: ['Chimney motor service', 'Cabinet interior deep', 'Plumbing', 'Electrical'], tools: ['Heavy degreaser', 'Steam cleaner', 'Scrub pad', 'Brush'], processSteps: [{ order: 1, title: 'Slab', description: 'Heavy degrease', estimatedMinutes: 45 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 60 }, { order: 3, title: 'Chimney', description: 'Exterior clean', estimatedMinutes: 30 }, { order: 4, title: 'Cabinet', description: 'Exterior wipe', estimatedMinutes: 30 }, { order: 5, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 30 }], addOns: KITCHEN_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
      { id: 'kitchen-chimney', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Chimney Deep Cleaning', duration: '1 hr', originalPrice: 999, offerPrice: 799, imageUrl: IMG.kitchenChimney, popular: true, description: 'Complete chimney cleaning - baffle filter, motor hood.', rating: 4.9, reviewCount: 2650, inclusions: ['Baffle filter degreasing', 'Motor hood cleaning', 'Steel polish', 'Oil collector'], exclusions: ['Motor repair', 'Installation'], tools: ['Degreaser', 'Scrub pad', 'Brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Filter', description: 'Remove filters', estimatedMinutes: 10 }, { order: 2, title: 'Filter', description: 'Boiling degrease', estimatedMinutes: 20 }, { order: 3, title: 'Hood', description: 'Motor hood', estimatedMinutes: 20 }, { order: 4, title: 'Steel', description: 'Steel polish', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 3 },
      { id: 'kitchen-fridge', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Fridge Deep Cleaning', duration: '1 hr', originalPrice: 799, offerPrice: 599, imageUrl: IMG.kitchenFridge, description: 'Complete refrigerator interior and exterior cleaning.', rating: 4.9, reviewCount: 2140, inclusions: ['Interior shelf cleaning', 'Drawer cleaning', 'Door seal', 'Exterior wipe'], exclusions: ['Cooling repair', 'Gas refill'], tools: ['Baking soda', 'Microfiber', 'Spray', 'Brush'], processSteps: [{ order: 1, title: 'Empty', description: 'Remove items', estimatedMinutes: 10 }, { order: 2, title: 'Shelves', description: 'Clean shelves', estimatedMinutes: 20 }, { order: 3, title: 'Interior', description: 'Interior wipe', estimatedMinutes: 20 }, { order: 4, title: 'Exterior', description: 'Polish', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 4 },
      { id: 'kitchen-oven', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Oven / Microwave Deep Clean', duration: '1 hr', originalPrice: 899, offerPrice: 699, imageUrl: IMG.kitchenOven, description: 'Deep cleaning for oven and microwave.', rating: 4.8, reviewCount: 890, inclusions: ['Interior degreasing', 'Rack cleaning', 'Glass door clean', 'Exterior polish'], exclusions: ['Electrical repair', 'Gas connection'], tools: ['Oven cleaner', 'Scrub pad', 'Microfiber'], processSteps: [{ order: 1, title: 'Racks', description: 'Remove racks', estimatedMinutes: 10 }, { order: 2, title: 'Interior', description: 'Degrease', estimatedMinutes: 25 }, { order: 3, title: 'Glass', description: 'Glass clean', estimatedMinutes: 15 }, { order: 4, title: 'Exterior', description: 'Polish', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 5 },
      { id: 'kitchen-stove', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Stove / Gas Cooktop Cleaning', duration: '45 mins', originalPrice: 699, offerPrice: 499, imageUrl: IMG.kitchenStove, popular: true, description: 'Deep cleaning for gas stove and cooktop.', rating: 4.9, reviewCount: 1420, inclusions: ['Burner cleaning', 'Grate degreasing', 'Stove body polish', 'Drip tray clean'], exclusions: ['Gas connection', 'Burner repair', 'Ignition repair'], tools: ['Degreaser', 'Steel wool', 'Brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Grime', description: 'Remove grates', estimatedMinutes: 10 }, { order: 2, title: 'Degrease', description: 'Deep degrease', estimatedMinutes: 20 }, { order: 3, title: 'Polish', description: 'Steel polish', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 6 },
      { id: 'kitchen-cabinet', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Kitchen Cabinet Cleaning', duration: '1.5 hrs', originalPrice: 1199, offerPrice: 899, imageUrl: IMG.kitchenCabinet, description: 'Interior and exterior cabinet cleaning.', rating: 4.8, reviewCount: 640, inclusions: ['Cabinet exterior wipe', 'Cabinet interior wipe', 'Handle polish', 'Drawer cleaning'], exclusions: ['Cabinet repair', 'Re-painting'], tools: ['Microfiber', 'Degreaser', 'Soft brush'], processSteps: [{ order: 1, title: 'Empty', description: 'Empty cabinets', estimatedMinutes: 20 }, { order: 2, title: 'Interior', description: 'Interior wipe', estimatedMinutes: 40 }, { order: 3, title: 'Exterior', description: 'Exterior wipe', estimatedMinutes: 30 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 7 },
      { id: 'kitchen-sink', categoryId: 'kitchen-cleaning', categoryName: 'Kitchen Cleaning', name: 'Kitchen Sink Deep Clean', duration: '30 mins', originalPrice: 499, offerPrice: 349, imageUrl: IMG.kitchenSink, description: 'Deep cleaning for kitchen sink.', rating: 4.8, reviewCount: 890, inclusions: ['Sink scrub', 'Drain clean', 'Tap polish', 'Stain removal'], exclusions: ['Plumbing', 'Tap repair'], tools: ['Scrub pad', 'Brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Scrub', description: 'Sink scrub', estimatedMinutes: 15 }, { order: 2, title: 'Drain', description: 'Drain clean', estimatedMinutes: 10 }, { order: 3, title: 'Polish', description: 'Tap polish', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 8 },
    ],
  },

  {
    id: 'bathroom-cleaning',
    name: 'Bathroom / Toilet Cleaning',
    subtitle: 'Complete bathroom deep cleaning services',
    iconName: 'Bath',
    heroImage: IMG.bathroomBasic,
    startingPrice: 349,
    active: true,
    sortOrder: 5,
    items: [
      { id: 'bathroom-basic-1', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Basic Cleaning - 1 Bathroom', duration: '45 mins', originalPrice: 599, offerPrice: 449, imageUrl: IMG.bathroomBasic, description: 'Basic cleaning of a single bathroom.', rating: 4.8, reviewCount: 3420, inclusions: ['Tile scrubbing', 'Toilet bowl clean', 'Sink clean', 'Mirror wipe', 'Floor mop'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Toilet brush', 'Scrub pad', 'Bathroom cleaner', 'Microfiber'], processSteps: [{ order: 1, title: 'Toilet', description: 'Bowl clean', estimatedMinutes: 10 }, { order: 2, title: 'Tiles', description: 'Tile scrub', estimatedMinutes: 15 }, { order: 3, title: 'Sink', description: 'Sink clean', estimatedMinutes: 10 }, { order: 4, title: 'Floor', description: 'Mop', estimatedMinutes: 10 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
      { id: 'bathroom-deep-1', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Deep Cleaning - 1 Bathroom', duration: '1.5 hrs', originalPrice: 999, offerPrice: 749, imageUrl: IMG.bathroomDeep, popular: true, description: 'Intense deep cleaning with hard water scale removal.', rating: 4.9, reviewCount: 4890, inclusions: ['Hard water scale removal', 'Grout scrubbing', 'Tile deep scrub', 'Toilet deep clean', 'Sink shine', 'Mirror polish', 'Exhaust fan'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Descaling chemical', 'Scrub pad', 'Steam cleaner', 'Microfiber'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Descale', estimatedMinutes: 15 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 30 }, { order: 3, title: 'Toilet', description: 'Deep clean', estimatedMinutes: 15 }, { order: 4, title: 'Fixtures', description: 'Chrome shine', estimatedMinutes: 15 }, { order: 5, title: 'Floor', description: 'Mop', estimatedMinutes: 15 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
      { id: 'bathroom-deep-2', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Deep Cleaning - 2 Bathrooms', duration: '2.5 hrs', originalPrice: 1899, offerPrice: 1399, imageUrl: IMG.bathroomModern, popular: true, description: 'Intense deep cleaning for 2 bathrooms.', rating: 4.9, reviewCount: 3240, inclusions: ['2 bathrooms deep', 'Scale removal', 'Grout scrub', 'Toilet deep clean'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Descaling', 'Scrub pad', 'Steam cleaner'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Descale', estimatedMinutes: 20 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 60 }, { order: 3, title: 'Toilets', description: 'Deep clean', estimatedMinutes: 30 }, { order: 4, title: 'Fixtures', description: 'Chrome shine', estimatedMinutes: 30 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
      { id: 'bathroom-deep-3', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Deep Cleaning - 3 Bathrooms', duration: '3.5 hrs', originalPrice: 2599, offerPrice: 1899, imageUrl: IMG.bathroomSpa, description: 'Intense deep cleaning for 3 bathrooms.', rating: 4.9, reviewCount: 1890, inclusions: ['3 bathrooms deep', 'Scale removal', 'Grout scrub'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Descaling', 'Scrub pad', 'Steam cleaner'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Descale', estimatedMinutes: 30 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 90 }, { order: 3, title: 'Toilets', description: 'Deep clean', estimatedMinutes: 45 }, { order: 4, title: 'Fixtures', description: 'Chrome shine', estimatedMinutes: 45 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 4 },
      { id: 'bathroom-deep-4', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Deep Cleaning - 4 Bathrooms', duration: '4.5 hrs', originalPrice: 3499, offerPrice: 2599, imageUrl: IMG.bathroomDeep, description: 'Intense deep cleaning for 4 bathrooms.', rating: 4.9, reviewCount: 890, inclusions: ['4 bathrooms deep', 'Scale removal', 'Grout scrub'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Descaling', 'Scrub pad', 'Steam cleaner'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Descale', estimatedMinutes: 40 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 120 }, { order: 3, title: 'Toilets', description: 'Deep clean', estimatedMinutes: 60 }, { order: 4, title: 'Fixtures', description: 'Chrome shine', estimatedMinutes: 60 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 5 },
      { id: 'bathroom-deep-5', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Bathroom Deep Cleaning - 5 Bathrooms', duration: '5.5 hrs', originalPrice: 4299, offerPrice: 3199, imageUrl: IMG.bathroomModern, description: 'Intense deep cleaning for 5 bathrooms.', rating: 4.9, reviewCount: 460, inclusions: ['5 bathrooms deep', 'Scale removal', 'Grout scrub'], exclusions: ['Plumbing', 'Leakage fix'], tools: ['Descaling', 'Scrub pad', 'Steam cleaner'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Descale', estimatedMinutes: 50 }, { order: 2, title: 'Tiles', description: 'Deep scrub', estimatedMinutes: 150 }, { order: 3, title: 'Toilets', description: 'Deep clean', estimatedMinutes: 75 }, { order: 4, title: 'Fixtures', description: 'Chrome shine', estimatedMinutes: 75 }], addOns: BATHROOM_ADDONS, cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 6 },
      { id: 'bathroom-toilet', categoryId: 'bathroom-cleaning', categoryName: 'Bathroom Cleaning', name: 'Toilet Deep Cleaning (Single)', duration: '30 mins', originalPrice: 449, offerPrice: 349, imageUrl: IMG.toilet, description: 'Deep cleaning of single toilet.', rating: 4.9, reviewCount: 1420, inclusions: ['Bowl deep clean', 'Tank clean', 'Seat clean', 'Floor around'], exclusions: ['Plumbing', 'Toilet repair'], tools: ['Toilet brush', 'Chemical', 'Microfiber'], processSteps: [{ order: 1, title: 'Pre-soak', description: 'Chemical soak', estimatedMinutes: 10 }, { order: 2, title: 'Scrub', description: 'Deep scrub', estimatedMinutes: 15 }, { order: 3, title: 'Rinse', description: 'Final rinse', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 7 },
    ],
  },

  {
    id: 'floor-cleaning',
    name: 'Floor & Surface Cleaning',
    subtitle: 'Deep floor scrubbing and polishing',
    iconName: 'LayoutGrid',
    heroImage: IMG.floorMarble,
    startingPrice: 399,
    active: true,
    sortOrder: 6,
    items: [
      { id: 'floor-marble', categoryId: 'floor-cleaning', categoryName: 'Floor Cleaning', name: 'Marble Floor Cleaning & Polishing', duration: '2-3 hrs', originalPrice: 1899, offerPrice: 1399, imageUrl: IMG.floorMarble, popular: true, description: 'Deep cleaning and buffing for marble floors.', rating: 4.9, reviewCount: 2140, inclusions: ['Machine scrubbing', 'Stain removal', 'Polish buffing', 'Deep mop'], exclusions: ['Crack repair', 'Grinding'], tools: ['Rotary machine', 'Marble cleaner', 'Buffing pad'], processSteps: [{ order: 1, title: 'Sweep', description: 'Dry sweep', estimatedMinutes: 20 }, { order: 2, title: 'Scrub', description: 'Machine scrub', estimatedMinutes: 60 }, { order: 3, title: 'Buff', description: 'Buff', estimatedMinutes: 40 }, { order: 4, title: 'Mop', description: 'Deep mop', estimatedMinutes: 20 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 1 },
      { id: 'floor-granite', categoryId: 'floor-cleaning', categoryName: 'Floor Cleaning', name: 'Granite Floor Deep Cleaning', duration: '2 hrs', originalPrice: 1599, offerPrice: 1199, imageUrl: IMG.floorMarble, description: 'Deep cleaning for granite floors.', rating: 4.9, reviewCount: 1120, inclusions: ['Machine scrubbing', 'Stain removal', 'Polish', 'Mop'], exclusions: ['Crack repair'], tools: ['Rotary', 'Granite cleaner', 'Buffing pad'], processSteps: [{ order: 1, title: 'Sweep', description: 'Dry sweep', estimatedMinutes: 20 }, { order: 2, title: 'Scrub', description: 'Machine scrub', estimatedMinutes: 50 }, { order: 3, title: 'Polish', description: 'Polish', estimatedMinutes: 30 }, { order: 4, title: 'Mop', description: 'Mop', estimatedMinutes: 20 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
      { id: 'floor-tile', categoryId: 'floor-cleaning', categoryName: 'Floor Cleaning', name: 'Tile Floor Deep Cleaning', duration: '1.5-2 hrs', originalPrice: 1199, offerPrice: 899, imageUrl: IMG.floorTile, description: 'Deep cleaning for tile floors with grout scrubbing.', rating: 4.8, reviewCount: 1620, inclusions: ['Grout scrubbing', 'Stain removal', 'Deep scrub', 'Mop'], exclusions: ['Tile replacement'], tools: ['Floor scrubber', 'Brush', 'Cleaner'], processSteps: [{ order: 1, title: 'Sweep', description: 'Dry sweep', estimatedMinutes: 15 }, { order: 2, title: 'Scrub', description: 'Grout scrub', estimatedMinutes: 45 }, { order: 3, title: 'Mop', description: 'Deep mop', estimatedMinutes: 30 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 3 },
      { id: 'floor-wooden', categoryId: 'floor-cleaning', categoryName: 'Floor Cleaning', name: 'Wooden Floor Cleaning & Polish', duration: '2 hrs', originalPrice: 1599, offerPrice: 1199, imageUrl: IMG.floorWooden, description: 'Gentle cleaning and polish for wooden floors.', rating: 4.8, reviewCount: 840, inclusions: ['Gentle cleaning', 'Wood polish', 'Conditioner', 'Dry mop'], exclusions: ['Scratch repair', 'Sanding'], tools: ['Wood cleaner', 'Soft pad', 'Polish'], processSteps: [{ order: 1, title: 'Dust', description: 'Dry dust', estimatedMinutes: 20 }, { order: 2, title: 'Clean', description: 'Gentle clean', estimatedMinutes: 50 }, { order: 3, title: 'Polish', description: 'Polish', estimatedMinutes: 40 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 4 },
    ],
  },

  // ⬇️ PART 2 YAHAN SE START HOGA (sofa-cleaning se) ⬇️
  {
  id: 'sofa-cleaning',
  name: 'Sofa / Furniture Cleaning',
  subtitle: 'Deep shampoo wash for sofas and furniture',
  iconName: 'Armchair',
  heroImage: IMG.sofa3,
  startingPrice: 499,
  active: true,
  sortOrder: 7,
  items: [
    { id: 'sofa-3-seat', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: '3 Seater Sofa Deep Clean', duration: '1-2 hrs', originalPrice: 999, offerPrice: 599, imageUrl: IMG.sofa3, popular: true, description: 'Deep shampoo wash for 3 seater sofa.', rating: 4.9, reviewCount: 1420, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Old stains', 'Furniture repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Inspect', description: 'Fabric check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 20 }, { order: 3, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 40 }, { order: 4, title: 'Dry', description: 'Machine dry', estimatedMinutes: 20 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 1 },
    { id: 'sofa-5-seat', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: '5 Seater Sofa Deep Clean', duration: '2-3 hrs', originalPrice: 1799, offerPrice: 1299, imageUrl: IMG.sofa5, popular: true, description: 'Deep shampoo wash for 5 seater sofa.', rating: 4.9, reviewCount: 890, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Old stains', 'Furniture repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Inspect', description: 'Fabric check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 30 }, { order: 3, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 60 }, { order: 4, title: 'Dry', description: 'Machine dry', estimatedMinutes: 30 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
    { id: 'sofa-7-seat', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: '7 Seater Sofa Deep Clean', duration: '3 hrs', originalPrice: 2299, offerPrice: 1699, imageUrl: IMG.sofa5, description: 'Deep shampoo wash for 7 seater sofa.', rating: 4.9, reviewCount: 640, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Old stains', 'Furniture repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Inspect', description: 'Fabric check', estimatedMinutes: 15 }, { order: 2, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 40 }, { order: 3, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 80 }, { order: 4, title: 'Dry', description: 'Machine dry', estimatedMinutes: 45 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
    { id: 'sofa-l-shape', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: 'L-Shape Sofa Deep Clean', duration: '3-4 hrs', originalPrice: 2499, offerPrice: 1899, imageUrl: IMG.sofaL, popular: true, description: 'Deep shampoo wash for L-shaped sofa.', rating: 4.9, reviewCount: 460, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Old stains', 'Furniture repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Inspect', description: 'Fabric check', estimatedMinutes: 15 }, { order: 2, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 45 }, { order: 3, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 90 }, { order: 4, title: 'Dry', description: 'Machine dry', estimatedMinutes: 40 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 4 },
    { id: 'sofa-u-shape', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: 'U-Shape Sofa Deep Clean', duration: '4-5 hrs', originalPrice: 3499, offerPrice: 2799, imageUrl: IMG.sofaL, description: 'Deep shampoo wash for U-shaped sofa.', rating: 4.9, reviewCount: 280, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Old stains', 'Furniture repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Inspect', description: 'Fabric check', estimatedMinutes: 20 }, { order: 2, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 60 }, { order: 3, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 120 }, { order: 4, title: 'Dry', description: 'Machine dry', estimatedMinutes: 60 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 5 },
    { id: 'sofa-recliner', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: 'Recliner / Single Sofa Cleaning', duration: '1 hr', originalPrice: 899, offerPrice: 649, imageUrl: IMG.sofa3, description: 'Deep cleaning for recliner or single sofa.', rating: 4.8, reviewCount: 320, inclusions: ['Vacuuming', 'Wet shampoo', 'Spot treatment'], exclusions: ['Old stains', 'Repair'], tools: ['Wet-dry vacuum', 'Spray machine', 'Shampoo'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 15 }, { order: 2, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 30 }, { order: 3, title: 'Dry', description: 'Machine dry', estimatedMinutes: 15 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 6 },
    { id: 'sofa-cushion', categoryId: 'sofa-cleaning', categoryName: 'Sofa Cleaning', name: 'Sofa Cushion / Pillow Cleaning', duration: '45 mins', originalPrice: 599, offerPrice: 449, imageUrl: IMG.sofa3, description: 'Deep cleaning of sofa cushions or pillows.', rating: 4.8, reviewCount: 240, inclusions: ['Vacuum', 'Wet shampoo', 'Dry'], exclusions: ['Foam replacement'], tools: ['Vacuum', 'Shampoo'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Dry vacuum', estimatedMinutes: 10 }, { order: 2, title: 'Shampoo', description: 'Wet shampoo', estimatedMinutes: 20 }, { order: 3, title: 'Dry', description: 'Dry', estimatedMinutes: 15 }], addOns: SOFA_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 7 },
  ],
},

{
  id: 'carpet-cleaning',
  name: 'Carpet & Rug Cleaning',
  subtitle: 'Deep cleaning for carpets and rugs',
  iconName: 'RectangleHorizontal',
  heroImage: IMG.carpet,
  startingPrice: 399,
  active: true,
  sortOrder: 8,
  items: [
    { id: 'carpet-small', categoryId: 'carpet-cleaning', categoryName: 'Carpet Cleaning', name: 'Small Carpet (0-50 sqft)', duration: '45 mins', originalPrice: 799, offerPrice: 549, imageUrl: IMG.carpet, description: 'Deep cleaning for small carpets.', rating: 4.8, reviewCount: 640, inclusions: ['Vacuum', 'Wet shampoo', 'Wet extraction'], exclusions: ['Old stains', 'Repair'], tools: ['Vacuum', 'Hand brush', 'Solution'], processSteps: [{ order: 1, title: 'Inspect', description: 'Carpet check', estimatedMinutes: 5 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 10 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 20 }, { order: 4, title: 'Extract', description: 'Extract', estimatedMinutes: 10 }], addOns: CARPET_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
    { id: 'carpet-medium', categoryId: 'carpet-cleaning', categoryName: 'Carpet Cleaning', name: 'Medium Carpet (50-150 sqft)', duration: '1.5 hrs', originalPrice: 1499, offerPrice: 999, imageUrl: IMG.carpet, popular: true, description: 'Deep cleaning for medium carpets.', rating: 4.9, reviewCount: 1140, inclusions: ['Vacuum', 'Wet shampoo', 'Wet extraction', 'Odor removal'], exclusions: ['Old stains', 'Repair'], tools: ['Vacuum', 'Brush', 'Solution'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 20 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 40 }, { order: 4, title: 'Extract', description: 'Extract', estimatedMinutes: 20 }], addOns: CARPET_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
    { id: 'carpet-large', categoryId: 'carpet-cleaning', categoryName: 'Carpet Cleaning', name: 'Large Carpet (150-400 sqft)', duration: '2.5 hrs', originalPrice: 2999, offerPrice: 1999, imageUrl: IMG.carpetLarge, description: 'Deep cleaning for large carpets.', rating: 4.9, reviewCount: 420, inclusions: ['Vacuum', 'Wet shampoo', 'Extraction', 'Color revival'], exclusions: ['Old stains', 'Repair'], tools: ['Vacuum', 'Brush', 'Solution'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 15 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 30 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 60 }, { order: 4, title: 'Extract', description: 'Extract', estimatedMinutes: 30 }], addOns: CARPET_ADDONS, cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
    { id: 'carpet-xl', categoryId: 'carpet-cleaning', categoryName: 'Carpet Cleaning', name: 'Extra Large Carpet (400+ sqft)', duration: '3.5 hrs', originalPrice: 4499, offerPrice: 3199, imageUrl: IMG.carpetLarge, description: 'Deep cleaning for very large carpets.', rating: 4.9, reviewCount: 180, inclusions: ['Vacuum', 'Wet shampoo', 'Extraction', 'Color revival'], exclusions: ['Old stains', 'Repair'], tools: ['Vacuum', 'Brush', 'Solution'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 20 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 45 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 90 }, { order: 4, title: 'Extract', description: 'Extract', estimatedMinutes: 45 }], addOns: CARPET_ADDONS, cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 4 },
  ],
},

{
  id: 'mattress-cleaning',
  name: 'Mattress Cleaning',
  subtitle: 'Deep cleaning for all mattress sizes',
  iconName: 'BedDouble',
  heroImage: IMG.mattress,
  startingPrice: 499,
  active: true,
  sortOrder: 9,
  items: [
    { id: 'mattress-single', categoryId: 'mattress-cleaning', categoryName: 'Mattress Cleaning', name: 'Single Bed Mattress', duration: '1 hr', originalPrice: 899, offerPrice: 599, imageUrl: IMG.mattress, popular: true, description: 'Deep cleaning for single bed mattress.', rating: 4.9, reviewCount: 840, inclusions: ['Both-side vacuum', 'Wet shampoo', 'Stain treatment', 'UV cleaning'], exclusions: ['Mattress repair', 'Old stains'], tools: ['Vacuum', 'Brush', 'Solution', 'UV'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 15 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 20 }, { order: 4, title: 'UV', description: 'UV clean', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
    { id: 'mattress-double', categoryId: 'mattress-cleaning', categoryName: 'Mattress Cleaning', name: 'Double Bed Mattress', duration: '1.5 hrs', originalPrice: 1499, offerPrice: 999, imageUrl: IMG.mattress, popular: true, description: 'Deep cleaning for double bed mattress.', rating: 4.9, reviewCount: 1650, inclusions: ['Both-side vacuum', 'Wet shampoo', 'Sweat stain removal', 'UV cleaning'], exclusions: ['Mattress repair', 'Old stains'], tools: ['Vacuum', 'Brush', 'Solution', 'UV'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 20 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 30 }, { order: 4, title: 'UV', description: 'UV', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
    { id: 'mattress-queen', categoryId: 'mattress-cleaning', categoryName: 'Mattress Cleaning', name: 'Queen Size Mattress', duration: '1.5 hrs', originalPrice: 1799, offerPrice: 1299, imageUrl: IMG.mattressLarge, description: 'Deep cleaning for queen size mattress.', rating: 4.9, reviewCount: 640, inclusions: ['Both-side vacuum', 'Wet shampoo', 'Stain treatment', 'UV'], exclusions: ['Mattress repair', 'Old stains'], tools: ['Vacuum', 'Brush', 'Solution', 'UV'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 10 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 25 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 35 }, { order: 4, title: 'UV', description: 'UV', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 3 },
    { id: 'mattress-king', categoryId: 'mattress-cleaning', categoryName: 'Mattress Cleaning', name: 'King Size Mattress', duration: '2 hrs', originalPrice: 1999, offerPrice: 1499, imageUrl: IMG.mattressLarge, description: 'Deep cleaning for king size mattress.', rating: 4.9, reviewCount: 420, inclusions: ['Both-side vacuum', 'Wet shampoo', 'Stain treatment', 'UV'], exclusions: ['Mattress repair', 'Old stains'], tools: ['Vacuum', 'Brush', 'Solution', 'UV'], processSteps: [{ order: 1, title: 'Inspect', description: 'Check', estimatedMinutes: 15 }, { order: 2, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 30 }, { order: 3, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 45 }, { order: 4, title: 'UV', description: 'UV', estimatedMinutes: 20 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 4 },
  ],
},

{
  id: 'chair-cleaning',
  name: 'Chair Deep Cleaning',
  subtitle: 'Dining, office and armchair deep cleaning',
  iconName: 'Armchair',
  heroImage: IMG.chairDining,
  startingPrice: 499,
  active: true,
  sortOrder: 10,
  items: [
    { id: 'chair-1-5', categoryId: 'chair-cleaning', categoryName: 'Chair Cleaning', name: '1-5 Chairs Deep Clean', duration: '45 mins', originalPrice: 699, offerPrice: 499, imageUrl: IMG.chairDining, description: 'Deep cleaning for 1-5 chairs.', rating: 4.8, reviewCount: 460, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Chair repair', 'Leather polish'], tools: ['Wet-dry vacuum', 'Spray', 'Brush'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 10 }, { order: 2, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 20 }, { order: 3, title: 'Dry', description: 'Dry', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
    { id: 'chair-5-10', categoryId: 'chair-cleaning', categoryName: 'Chair Cleaning', name: '5-10 Chairs Deep Clean', duration: '1 hr', originalPrice: 999, offerPrice: 699, imageUrl: IMG.chairDining, popular: true, description: 'Deep cleaning for 5-10 chairs.', rating: 4.9, reviewCount: 1120, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Chair repair', 'Leather polish'], tools: ['Wet-dry vacuum', 'Spray', 'Brush'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 15 }, { order: 2, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 30 }, { order: 3, title: 'Dry', description: 'Dry', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
    { id: 'chair-10-20', categoryId: 'chair-cleaning', categoryName: 'Chair Cleaning', name: '10-20 Chairs Deep Clean', duration: '2 hrs', originalPrice: 1999, offerPrice: 1399, imageUrl: IMG.chairOffice, popular: true, description: 'Deep cleaning for 10-20 chairs.', rating: 4.9, reviewCount: 780, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Chair repair', 'Leather polish'], tools: ['Wet-dry vacuum', 'Spray', 'Brush'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 30 }, { order: 2, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 50 }, { order: 3, title: 'Dry', description: 'Dry', estimatedMinutes: 20 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
    { id: 'chair-20-50', categoryId: 'chair-cleaning', categoryName: 'Chair Cleaning', name: '20-50 Chairs Deep Clean', duration: '3-4 hrs', originalPrice: 3999, offerPrice: 2899, imageUrl: IMG.chairOffice, description: 'Deep cleaning for 20-50 chairs.', rating: 4.9, reviewCount: 390, inclusions: ['Dry vacuuming', 'Wet shampooing', 'Spot treatment', 'Machine drying'], exclusions: ['Chair repair', 'Leather polish'], tools: ['Wet-dry vacuum', 'Spray', 'Brush'], processSteps: [{ order: 1, title: 'Vacuum', description: 'Vacuum', estimatedMinutes: 60 }, { order: 2, title: 'Shampoo', description: 'Shampoo', estimatedMinutes: 100 }, { order: 3, title: 'Dry', description: 'Dry', estimatedMinutes: 40 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 4 },
  ],
},

{
  id: 'glass-cleaning',
  name: 'Glass / Window / Door Cleaning',
  subtitle: 'Streak-free glass, windows and doors',
  iconName: 'Maximize2',
  heroImage: IMG.glass,
  startingPrice: 299,
  active: true,
  sortOrder: 11,
  items: [
    { id: 'glass-small', categoryId: 'glass-cleaning', categoryName: 'Glass Cleaning', name: 'Small Windows (0-100 sqft)', duration: '45 mins', originalPrice: 599, offerPrice: 399, imageUrl: IMG.glass, description: 'Streak-free cleaning for small windows.', rating: 4.8, reviewCount: 670, inclusions: ['Glass clean both sides', 'Frame clean', 'Track clean', 'Streak-free finish'], exclusions: ['Window repair', 'Glass replacement'], tools: ['Squeegee', 'Microfiber', 'Cleaner'], processSteps: [{ order: 1, title: 'Track', description: 'Track clean', estimatedMinutes: 10 }, { order: 2, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 10 }, { order: 3, title: 'Glass', description: 'Glass clean', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
    { id: 'glass-medium', categoryId: 'glass-cleaning', categoryName: 'Glass Cleaning', name: 'Apartment Windows (100-300 sqft)', duration: '1.5 hrs', originalPrice: 999, offerPrice: 699, imageUrl: IMG.glass, popular: true, description: 'Complete window cleaning.', rating: 4.9, reviewCount: 940, inclusions: ['All windows both sides', 'Frame and track', 'Balcony glass', 'Streak-free'], exclusions: ['Window repair', 'Glass replacement'], tools: ['Squeegee', 'Microfiber', 'Cleaner'], processSteps: [{ order: 1, title: 'Track', description: 'Track clean', estimatedMinutes: 20 }, { order: 2, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 20 }, { order: 3, title: 'Glass', description: 'Glass clean', estimatedMinutes: 40 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 2 },
    { id: 'glass-large', categoryId: 'glass-cleaning', categoryName: 'Glass Cleaning', name: 'French Windows / Facade (300-600 sqft)', duration: '2.5 hrs', originalPrice: 1999, offerPrice: 1399, imageUrl: IMG.glassLarge, description: 'Deep cleaning for large glass surfaces.', rating: 4.9, reviewCount: 380, inclusions: ['All glass surfaces', 'Frame clean', 'Track clean', 'Glass partition'], exclusions: ['Window repair', 'Glass replacement'], tools: ['Squeegee', 'Microfiber', 'Cleaner'], processSteps: [{ order: 1, title: 'Track', description: 'Track clean', estimatedMinutes: 30 }, { order: 2, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 30 }, { order: 3, title: 'Glass', description: 'Glass clean', estimatedMinutes: 75 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
    { id: 'glass-doors', categoryId: 'glass-cleaning', categoryName: 'Glass Cleaning', name: 'Glass Doors Cleaning', duration: '45 mins', originalPrice: 599, offerPrice: 449, imageUrl: IMG.glass, description: 'Streak-free cleaning for glass doors.', rating: 4.8, reviewCount: 320, inclusions: ['Both side glass', 'Handle polish', 'Frame wipe'], exclusions: ['Door repair'], tools: ['Squeegee', 'Microfiber', 'Cleaner'], processSteps: [{ order: 1, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 10 }, { order: 2, title: 'Glass', description: 'Glass clean', estimatedMinutes: 20 }, { order: 3, title: 'Handle', description: 'Handle polish', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 4 },
    { id: 'glass-partition', categoryId: 'glass-cleaning', categoryName: 'Glass Cleaning', name: 'Glass Partition Cleaning', duration: '1 hr', originalPrice: 899, offerPrice: 649, imageUrl: IMG.glassLarge, description: 'Deep cleaning for glass partitions.', rating: 4.8, reviewCount: 240, inclusions: ['Both side glass', 'Frame clean', 'Streak-free'], exclusions: ['Partition repair'], tools: ['Squeegee', 'Microfiber', 'Cleaner'], processSteps: [{ order: 1, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 15 }, { order: 2, title: 'Glass', description: 'Glass clean', estimatedMinutes: 30 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 5 },
  ],
},

{
  id: 'fan-fixture-cleaning',
  name: 'Fan & Fixture Cleaning',
  subtitle: 'Ceiling fans, exhaust fans, wall fans cleaning',
  iconName: 'Fan',
  heroImage: IMG.fanCeiling,
  startingPrice: 99,
  active: true,
  sortOrder: 12,
  items: [
    { id: 'fan-ceiling-1', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Ceiling Fan Cleaning - 1 Fan', duration: '20 mins', originalPrice: 199, offerPrice: 149, imageUrl: IMG.fanCeiling, popular: true, description: 'Deep cleaning of 1 ceiling fan including blades and motor top.', rating: 4.9, reviewCount: 3420, inclusions: ['Blade dusting', 'Motor top dusting', 'Speed regulator wipe', 'Rod cleaning'], exclusions: ['Fan repair', 'Rewiring', 'Motor service'], tools: ['Ladder', 'Microfiber', 'Brush', 'Fan cleaner spray'], processSteps: [{ order: 1, title: 'Blades', description: 'Blade dusting', estimatedMinutes: 10 }, { order: 2, title: 'Motor', description: 'Motor top wipe', estimatedMinutes: 5 }, { order: 3, title: 'Regulator', description: 'Regulator wipe', estimatedMinutes: 5 }], addOns: FAN_ADDONS, cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 1 },
    { id: 'fan-ceiling-2', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Ceiling Fan Cleaning - 2 Fans', duration: '35 mins', originalPrice: 349, offerPrice: 249, imageUrl: IMG.fanCeiling, description: 'Deep cleaning of 2 ceiling fans.', rating: 4.9, reviewCount: 2140, inclusions: ['Blades dusting', 'Motor top dusting', 'Regulator wipe'], exclusions: ['Fan repair', 'Rewiring'], tools: ['Ladder', 'Microfiber', 'Brush'], processSteps: [{ order: 1, title: 'Fan 1', description: 'First fan clean', estimatedMinutes: 15 }, { order: 2, title: 'Fan 2', description: 'Second fan clean', estimatedMinutes: 15 }, { order: 3, title: 'Wipe', description: 'Final wipe', estimatedMinutes: 5 }], addOns: FAN_ADDONS, cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 2 },
    { id: 'fan-ceiling-5', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Ceiling Fan Cleaning - 5 Fans', duration: '1.5 hrs', originalPrice: 749, offerPrice: 599, imageUrl: IMG.fanCeiling, popular: true, description: 'Complete home ceiling fan cleaning - 5 fans.', rating: 4.9, reviewCount: 1420, inclusions: ['All 5 fan blades', 'Motors top', 'Regulators', 'Rods'], exclusions: ['Fan repair', 'Rewiring'], tools: ['Ladder', 'Microfiber', 'Brush'], processSteps: [{ order: 1, title: 'All fans', description: 'Clean all 5 fans', estimatedMinutes: 70 }, { order: 2, title: 'Final', description: 'Final wipe all', estimatedMinutes: 20 }], addOns: FAN_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 3 },
    { id: 'fan-exhaust', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Exhaust Fan Cleaning', duration: '30 mins', originalPrice: 249, offerPrice: 179, imageUrl: IMG.fanExhaust, popular: true, description: 'Deep cleaning of kitchen or bathroom exhaust fan.', rating: 4.8, reviewCount: 890, inclusions: ['Grill cleaning', 'Blade cleaning', 'Body wipe', 'Filter clean'], exclusions: ['Motor repair', 'Replacement'], tools: ['Brush', 'Microfiber', 'Degreaser'], processSteps: [{ order: 1, title: 'Grill', description: 'Grill scrub', estimatedMinutes: 10 }, { order: 2, title: 'Blade', description: 'Blade clean', estimatedMinutes: 10 }, { order: 3, title: 'Body', description: 'Body wipe', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 4 },
    { id: 'fan-wall', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Wall Fan Cleaning', duration: '25 mins', originalPrice: 249, offerPrice: 179, imageUrl: IMG.fanExhaust, description: 'Deep cleaning of wall-mounted fan.', rating: 4.8, reviewCount: 460, inclusions: ['Blade cleaning', 'Grill cleaning', 'Motor top wipe'], exclusions: ['Repair', 'Rewiring'], tools: ['Brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Blades', description: 'Blade clean', estimatedMinutes: 10 }, { order: 2, title: 'Grill', description: 'Grill clean', estimatedMinutes: 10 }, { order: 3, title: 'Body', description: 'Body wipe', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 5 },
    { id: 'fan-table', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Table / Pedestal / Tower Fan Cleaning', duration: '25 mins', originalPrice: 249, offerPrice: 179, imageUrl: IMG.fanExhaust, description: 'Cleaning for table, pedestal or tower fan.', rating: 4.8, reviewCount: 320, inclusions: ['Blade clean', 'Grill clean', 'Body wipe'], exclusions: ['Repair'], tools: ['Brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Blades', description: 'Blade clean', estimatedMinutes: 10 }, { order: 2, title: 'Body', description: 'Body wipe', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 6 },
    { id: 'fan-chandelier', categoryId: 'fan-fixture-cleaning', categoryName: 'Fan Cleaning', name: 'Chandelier Cleaning', duration: '45 mins', originalPrice: 799, offerPrice: 599, imageUrl: IMG.chandelier, description: 'Gentle cleaning of chandelier crystals.', rating: 4.9, reviewCount: 240, inclusions: ['Crystal dusting', 'Frame polish', 'Bulb wipe'], exclusions: ['Rewiring', 'Bulb replacement'], tools: ['Soft brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Dust', description: 'Crystal dust', estimatedMinutes: 20 }, { order: 2, title: 'Polish', description: 'Frame polish', estimatedMinutes: 15 }, { order: 3, title: 'Bulb', description: 'Bulb wipe', estimatedMinutes: 10 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 7 },
  ],
},

{
  id: 'curtain-cleaning',
  name: 'Curtain & Blinds Cleaning',
  subtitle: 'Curtains, blinds and window treatments',
  iconName: 'Wind',
  heroImage: IMG.curtain,
  startingPrice: 199,
  active: true,
  sortOrder: 13,
  items: [
    { id: 'curtain-basic', categoryId: 'curtain-cleaning', categoryName: 'Curtain Cleaning', name: 'Curtain Dry Cleaning (1 Panel)', duration: '30 mins', originalPrice: 349, offerPrice: 249, imageUrl: IMG.curtain, popular: true, description: 'Dry cleaning of 1 curtain panel.', rating: 4.8, reviewCount: 640, inclusions: ['Dust removal', 'Fabric refresh', 'Rod wipe'], exclusions: ['Wet wash', 'Ironing'], tools: ['Vacuum brush', 'Microfiber'], processSteps: [{ order: 1, title: 'Dust', description: 'Dust removal', estimatedMinutes: 10 }, { order: 2, title: 'Clean', description: 'Fabric refresh', estimatedMinutes: 15 }, { order: 3, title: 'Rod', description: 'Rod wipe', estimatedMinutes: 5 }], addOns: CURTAIN_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
    { id: 'curtain-blinds', categoryId: 'curtain-cleaning', categoryName: 'Curtain Cleaning', name: 'Blinds Cleaning (Per sqft)', duration: '45 mins', originalPrice: 599, offerPrice: 449, imageUrl: IMG.curtain, description: 'Deep cleaning of window blinds.', rating: 4.8, reviewCount: 320, inclusions: ['Slat cleaning', 'Cord wipe', 'Frame wipe'], exclusions: ['Repair', 'Replacement'], tools: ['Microfiber', 'Brush'], processSteps: [{ order: 1, title: 'Slats', description: 'Slat clean', estimatedMinutes: 25 }, { order: 2, title: 'Cord', description: 'Cord wipe', estimatedMinutes: 10 }, { order: 3, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 10 }], addOns: CURTAIN_ADDONS, cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
  ],
},

// ⬇️ PART 3 YAHAN SE START HOGA (balcony-cleaning se) ⬇️
{
    id: 'balcony-cleaning',
    name: 'Balcony & Terrace Cleaning',
    subtitle: 'Deep cleaning for balconies and terraces',
    iconName: 'Sun',
    heroImage: IMG.balcony,
    startingPrice: 299,
    active: true,
    sortOrder: 14,
    items: [
      { id: 'balcony-1', categoryId: 'balcony-cleaning', categoryName: 'Balcony Cleaning', name: 'Balcony Cleaning - 1 Balcony', duration: '45 mins', originalPrice: 499, offerPrice: 349, imageUrl: IMG.balcony, popular: true, description: 'Complete cleaning of 1 balcony.', rating: 4.8, reviewCount: 890, inclusions: ['Floor scrub', 'Railing wipe', 'Glass clean', 'Drain clean'], exclusions: ['Repair', 'Painting'], tools: ['Scrub brush', 'Floor cleaner', 'Microfiber'], processSteps: [{ order: 1, title: 'Sweep', description: 'Sweep balcony', estimatedMinutes: 10 }, { order: 2, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 20 }, { order: 3, title: 'Railing', description: 'Railing wipe', estimatedMinutes: 10 }, { order: 4, title: 'Glass', description: 'Glass clean', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 1 },
      { id: 'balcony-2', categoryId: 'balcony-cleaning', categoryName: 'Balcony Cleaning', name: 'Balcony Cleaning - 2 Balconies', duration: '1.5 hrs', originalPrice: 799, offerPrice: 599, imageUrl: IMG.balcony, description: 'Complete cleaning of 2 balconies.', rating: 4.8, reviewCount: 420, inclusions: ['Floor scrub', 'Railing wipe', 'Glass clean', 'Drain clean'], exclusions: ['Repair', 'Painting'], tools: ['Scrub brush', 'Floor cleaner', 'Microfiber'], processSteps: [{ order: 1, title: 'Balcony 1', description: 'First balcony', estimatedMinutes: 35 }, { order: 2, title: 'Balcony 2', description: 'Second balcony', estimatedMinutes: 35 }, { order: 3, title: 'Final', description: 'Final wipe', estimatedMinutes: 20 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
      { id: 'terrace-cleaning', categoryId: 'balcony-cleaning', categoryName: 'Terrace Cleaning', name: 'Terrace Deep Cleaning', duration: '2-3 hrs', originalPrice: 1799, offerPrice: 1399, imageUrl: IMG.balcony, description: 'Complete terrace cleaning.', rating: 4.8, reviewCount: 240, inclusions: ['Floor scrub', 'Railing wipe', 'Drain clean', 'Wall dust'], exclusions: ['Repair', 'Waterproofing'], tools: ['Scrub brush', 'Floor cleaner', 'Microfiber'], processSteps: [{ order: 1, title: 'Sweep', description: 'Sweep', estimatedMinutes: 20 }, { order: 2, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 60 }, { order: 3, title: 'Railing', description: 'Railing wipe', estimatedMinutes: 30 }], cancellationPolicy: 'Free cancellation up to 4 hours before service', active: true, sortOrder: 3 },
    ],
  },

  {
    id: 'door-cleaning',
    name: 'Door & Window Cleaning',
    subtitle: 'Deep cleaning for all doors and windows',
    iconName: 'DoorClosed',
    heroImage: IMG.door,
    startingPrice: 99,
    active: true,
    sortOrder: 15,
    items: [
      { id: 'door-single', categoryId: 'door-cleaning', categoryName: 'Door Cleaning', name: 'Single Door Deep Cleaning', duration: '20 mins', originalPrice: 249, offerPrice: 149, imageUrl: IMG.door, popular: true, description: 'Deep cleaning of 1 door - both sides.', rating: 4.8, reviewCount: 640, inclusions: ['Both sides wipe', 'Handle polish', 'Frame wipe', 'Fingerprint removal'], exclusions: ['Door repair', 'Painting'], tools: ['Microfiber', 'Door cleaner'], processSteps: [{ order: 1, title: 'Frame', description: 'Frame wipe', estimatedMinutes: 5 }, { order: 2, title: 'Door', description: 'Door wipe', estimatedMinutes: 10 }, { order: 3, title: 'Handle', description: 'Handle polish', estimatedMinutes: 5 }], cancellationPolicy: 'Free cancellation up to 1 hour before service', active: true, sortOrder: 1 },
      { id: 'door-all-home', categoryId: 'door-cleaning', categoryName: 'Door Cleaning', name: 'All Doors Deep Cleaning (5-8 Doors)', duration: '1.5 hrs', originalPrice: 999, offerPrice: 799, imageUrl: IMG.door, description: 'Deep cleaning of all home doors.', rating: 4.8, reviewCount: 320, inclusions: ['Both sides of all doors', 'All handles polished', 'All frames', 'Fingerprint removal'], exclusions: ['Door repair', 'Painting'], tools: ['Microfiber', 'Door cleaner'], processSteps: [{ order: 1, title: 'Frames', description: 'All frames', estimatedMinutes: 30 }, { order: 2, title: 'Doors', description: 'All doors', estimatedMinutes: 45 }, { order: 3, title: 'Handles', description: 'All handles', estimatedMinutes: 15 }], cancellationPolicy: 'Free cancellation up to 2 hours before service', active: true, sortOrder: 2 },
    ],
  },

  {
    id: 'move-in-cleaning',
    name: 'Move-In Cleaning',
    subtitle: 'Deep cleaning before you move in',
    iconName: 'PackageOpen',
    heroImage: IMG.moveIn,
    startingPrice: 2999,
    active: true,
    sortOrder: 16,
    items: [
      { id: 'move-in-1bhk', categoryId: 'move-in-cleaning', categoryName: 'Move-In Cleaning', name: 'Move-In 1 BHK', duration: '4 hrs', originalPrice: 4499, offerPrice: 3499, imageUrl: IMG.moveIn, popular: true, description: 'Complete deep cleaning before moving into 1 BHK.', rating: 4.9, reviewCount: 890, inclusions: ['All rooms', 'Kitchen', 'Bathroom', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture assembly'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals', 'Microfiber'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 20 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 120 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 60 }, { order: 4, title: 'Bathroom', description: 'Bathroom clean', estimatedMinutes: 40 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 1 },
      { id: 'move-in-2bhk', categoryId: 'move-in-cleaning', categoryName: 'Move-In Cleaning', name: 'Move-In 2 BHK', duration: '5 hrs', originalPrice: 6499, offerPrice: 4999, imageUrl: IMG.moveIn, popular: true, description: 'Complete deep cleaning before moving into 2 BHK.', rating: 4.9, reviewCount: 620, inclusions: ['All rooms', 'Kitchen', '2 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture assembly'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 20 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 150 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 75 }, { order: 4, title: 'Bathrooms', description: '2 bathrooms', estimatedMinutes: 55 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 2 },
      { id: 'move-in-3bhk', categoryId: 'move-in-cleaning', categoryName: 'Move-In Cleaning', name: 'Move-In 3 BHK', duration: '6 hrs', originalPrice: 8499, offerPrice: 6499, imageUrl: IMG.moveIn, description: 'Complete deep cleaning before moving into 3 BHK.', rating: 4.9, reviewCount: 380, inclusions: ['All rooms', 'Kitchen', '3 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture assembly'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 30 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 180 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 90 }, { order: 4, title: 'Bathrooms', description: '3 bathrooms', estimatedMinutes: 60 }], cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 3 },
    ],
  },

  {
    id: 'move-out-cleaning',
    name: 'Move-Out Cleaning',
    subtitle: 'Deep cleaning before handing over the property',
    iconName: 'PackageCheck',
    heroImage: IMG.moveOut,
    startingPrice: 2999,
    active: true,
    sortOrder: 17,
    items: [
      { id: 'move-out-1bhk', categoryId: 'move-out-cleaning', categoryName: 'Move-Out Cleaning', name: 'Move-Out 1 BHK', duration: '4 hrs', originalPrice: 4499, offerPrice: 3499, imageUrl: IMG.moveOut, popular: true, description: 'Complete deep cleaning before moving out of 1 BHK.', rating: 4.9, reviewCount: 740, inclusions: ['All rooms', 'Kitchen', 'Bathroom', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture removal'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 20 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 120 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 60 }, { order: 4, title: 'Bathroom', description: 'Bathroom clean', estimatedMinutes: 40 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 1 },
      { id: 'move-out-2bhk', categoryId: 'move-out-cleaning', categoryName: 'Move-Out Cleaning', name: 'Move-Out 2 BHK', duration: '5 hrs', originalPrice: 6499, offerPrice: 4999, imageUrl: IMG.moveOut, description: 'Complete deep cleaning before moving out of 2 BHK.', rating: 4.9, reviewCount: 520, inclusions: ['All rooms', 'Kitchen', '2 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture removal'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 20 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 150 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 75 }, { order: 4, title: 'Bathrooms', description: '2 bathrooms', estimatedMinutes: 55 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 2 },
      { id: 'move-out-3bhk', categoryId: 'move-out-cleaning', categoryName: 'Move-Out Cleaning', name: 'Move-Out 3 BHK', duration: '6 hrs', originalPrice: 8499, offerPrice: 6499, imageUrl: IMG.moveOut, description: 'Complete deep cleaning before moving out of 3 BHK.', rating: 4.9, reviewCount: 320, inclusions: ['All rooms', 'Kitchen', '3 bathrooms', 'Balcony', 'Windows'], exclusions: ['Wall painting', 'Furniture removal'], tools: ['Industrial scrubber', 'Vacuum', 'Chemicals'], processSteps: [{ order: 1, title: 'Inspection', description: 'Check', estimatedMinutes: 30 }, { order: 2, title: 'Deep clean', description: 'All rooms', estimatedMinutes: 180 }, { order: 3, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 90 }, { order: 4, title: 'Bathrooms', description: '3 bathrooms', estimatedMinutes: 60 }], cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 3 },
    ],
  },

  {
    id: 'recurring-cleaning',
    name: 'Recurring / Subscription Cleaning',
    subtitle: 'Weekly, monthly and regular cleaning plans',
    iconName: 'CalendarCheck',
    heroImage: IMG.recurring,
    startingPrice: 999,
    active: true,
    sortOrder: 18,
    items: [
      { id: 'recurring-daily', categoryId: 'recurring-cleaning', categoryName: 'Recurring Cleaning', name: 'Daily Home Cleaning', duration: '1-2 hrs', originalPrice: 1299, offerPrice: 999, imageUrl: IMG.recurring, description: 'Daily home cleaning subscription.', rating: 4.9, reviewCount: 640, inclusions: ['Rooms dust', 'Kitchen wipe', 'Bathroom quick clean', 'Floor mop', 'Trash removal'], exclusions: ['Deep cleaning', 'Furniture polish', 'Repairs'], tools: ['Vacuum', 'Microfiber', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Dusting', estimatedMinutes: 20 }, { order: 2, title: 'Kitchen', description: 'Kitchen wipe', estimatedMinutes: 20 }, { order: 3, title: 'Bathrooms', description: 'Quick clean', estimatedMinutes: 20 }, { order: 4, title: 'Floor', description: 'Mop', estimatedMinutes: 20 }], cancellationPolicy: 'Cancel anytime with 24 hours notice', active: true, sortOrder: 1 },
      { id: 'recurring-weekly', categoryId: 'recurring-cleaning', categoryName: 'Recurring Cleaning', name: 'Weekly Home Cleaning', duration: '2-3 hrs', originalPrice: 1799, offerPrice: 1299, imageUrl: IMG.recurring, popular: true, description: 'Weekly cleaning subscription.', rating: 4.9, reviewCount: 1240, inclusions: ['All rooms', 'Kitchen', 'Bathrooms', 'Floor mopping', 'Dusting'], exclusions: ['Deep cleaning', 'Furniture polish'], tools: ['Vacuum', 'Microfiber', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Dust', description: 'Dust', estimatedMinutes: 30 }, { order: 2, title: 'Kitchen', description: 'Kitchen wipe', estimatedMinutes: 30 }, { order: 3, title: 'Bathrooms', description: 'Clean', estimatedMinutes: 30 }, { order: 4, title: 'Floor', description: 'Mop', estimatedMinutes: 30 }], cancellationPolicy: 'Cancel anytime with 24 hours notice', active: true, sortOrder: 2 },
      { id: 'recurring-monthly', categoryId: 'recurring-cleaning', categoryName: 'Recurring Cleaning', name: 'Monthly Deep Cleaning', duration: '4-5 hrs', originalPrice: 2999, offerPrice: 2299, imageUrl: IMG.recurring, description: 'Monthly deep cleaning subscription.', rating: 4.9, reviewCount: 620, inclusions: ['Deep all rooms', 'Kitchen deep', 'Bathroom deep', 'Floor scrub', 'Windows'], exclusions: ['Repainting', 'Structural repairs'], tools: ['Scrubber', 'Vacuum', 'Microfiber'], processSteps: [{ order: 1, title: 'Rooms', description: 'Deep rooms', estimatedMinutes: 90 }, { order: 2, title: 'Kitchen', description: 'Kitchen deep', estimatedMinutes: 60 }, { order: 3, title: 'Bathroom', description: 'Bathroom deep', estimatedMinutes: 60 }, { order: 4, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 60 }], cancellationPolicy: 'Cancel anytime with 24 hours notice', active: true, sortOrder: 3 },
    ],
  },

  {
    id: 'commercial-cleaning',
    name: 'Commercial Space Cleaning',
    subtitle: 'Office, shop and clinic cleaning',
    iconName: 'Briefcase',
    heroImage: IMG.office,
    startingPrice: 1999,
    active: true,
    sortOrder: 19,
    items: [
      { id: 'commercial-small-office', categoryId: 'commercial-cleaning', categoryName: 'Commercial Cleaning', name: 'Small Office (Under 1000 sqft)', duration: '3 hrs', originalPrice: 3499, offerPrice: 2499, imageUrl: IMG.office, popular: true, description: 'Complete cleaning for small office up to 1000 sqft.', rating: 4.9, reviewCount: 890, inclusions: ['Floor scrubbing', 'Desk wiping', 'Window cleaning', 'Washroom cleaning', 'Trash removal'], exclusions: ['Electrical repair', 'Plumbing', 'Painting'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber'], processSteps: [{ order: 1, title: 'Trash', description: 'Trash removal', estimatedMinutes: 20 }, { order: 2, title: 'Desks', description: 'Desk wipe', estimatedMinutes: 40 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 60 }, { order: 4, title: 'Washroom', description: 'Washroom clean', estimatedMinutes: 60 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 1 },
      { id: 'commercial-large-office', categoryId: 'commercial-cleaning', categoryName: 'Commercial Cleaning', name: 'Large Office (1000-3000 sqft)', duration: '5 hrs', originalPrice: 6499, offerPrice: 4499, imageUrl: IMG.officeLarge, description: 'Complete cleaning for office 1000-3000 sqft.', rating: 4.9, reviewCount: 420, inclusions: ['Floor scrubbing', 'Desk wiping', 'Window cleaning', 'Washroom cleaning', 'Trash removal', 'Pantry cleaning'], exclusions: ['Electrical repair', 'Plumbing', 'Painting'], tools: ['Scrubbing machine', 'Rotary', 'Vacuum', 'Microfiber'], processSteps: [{ order: 1, title: 'Trash', description: 'Trash removal', estimatedMinutes: 30 }, { order: 2, title: 'Desks', description: 'All desks wipe', estimatedMinutes: 60 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 120 }, { order: 4, title: 'Washroom', description: 'All washrooms', estimatedMinutes: 90 }], cancellationPolicy: 'Free cancellation up to 8 hours before service', active: true, sortOrder: 2 },
      { id: 'commercial-clinic', categoryId: 'commercial-cleaning', categoryName: 'Commercial Cleaning', name: 'Clinic / Doctor Office Cleaning', duration: '3 hrs', originalPrice: 3999, offerPrice: 2999, imageUrl: IMG.clinic, description: 'Deep cleaning for clinic or doctor office.', rating: 4.9, reviewCount: 240, inclusions: ['Floor cleaning', 'Desk wipe', 'Chair cleaning', 'Washroom clean', 'Trash removal'], exclusions: ['Medical waste disposal', 'Equipment repair'], tools: ['Microfiber', 'Vacuum', 'Floor cleaner'], processSteps: [{ order: 1, title: 'Trash', description: 'Trash removal', estimatedMinutes: 20 }, { order: 2, title: 'Desks', description: 'Desk wipe', estimatedMinutes: 40 }, { order: 3, title: 'Floor', description: 'Floor clean', estimatedMinutes: 60 }, { order: 4, title: 'Washroom', description: 'Washroom clean', estimatedMinutes: 60 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 3 },
      { id: 'commercial-shop', categoryId: 'commercial-cleaning', categoryName: 'Commercial Cleaning', name: 'Shop / Retail Store Cleaning', duration: '3 hrs', originalPrice: 3499, offerPrice: 2499, imageUrl: IMG.shop, popular: true, description: 'Complete cleaning for retail shops and stores.', rating: 4.8, reviewCount: 380, inclusions: ['Floor scrubbing', 'Shelf dusting', 'Counter wipe', 'Glass & display cleaning', 'Trash removal'], exclusions: ['Electrical repair', 'Plumbing', 'Painting', 'Stock arrangement'], tools: ['Scrubbing machine', 'Vacuum', 'Microfiber', 'Glass cleaner'], processSteps: [{ order: 1, title: 'Trash', description: 'Trash removal', estimatedMinutes: 20 }, { order: 2, title: 'Shelves', description: 'Shelf dusting', estimatedMinutes: 40 }, { order: 3, title: 'Floor', description: 'Floor scrub', estimatedMinutes: 60 }, { order: 4, title: 'Glass', description: 'Display glass clean', estimatedMinutes: 60 }], cancellationPolicy: 'Free cancellation up to 6 hours before service', active: true, sortOrder: 4 },
      { id: 'commercial-warehouse', categoryId: 'commercial-cleaning', categoryName: 'Commercial Cleaning', name: 'Warehouse / Godown Cleaning', duration: '6+ hrs', originalPrice: 8999, offerPrice: 6999, imageUrl: IMG.officeLarge, description: 'Heavy-duty cleaning for warehouses and godowns.', rating: 4.8, reviewCount: 140, inclusions: ['Floor scrubbing', 'Dust removal', 'Rack cleaning', 'Trash removal'], exclusions: ['Machinery cleaning', 'Electrical repair'], tools: ['Industrial scrubber', 'Vacuum', 'Microfiber'], processSteps: [{ order: 1, title: 'Trash', description: 'Trash removal', estimatedMinutes: 60 }, { order: 2, title: 'Dust', description: 'Full dust removal', estimatedMinutes: 120 }, { order: 3, title: 'Floor', description: 'Industrial floor scrub', estimatedMinutes: 180 }], cancellationPolicy: 'Free cancellation up to 12 hours before service', active: true, sortOrder: 5 },
    ],
  },
];

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
    discountPct: item.originalPrice > 0
      ? Math.round(((item.originalPrice - item.offerPrice) / item.originalPrice) * 100)
      : 0,
    basePrice: item.offerPrice,
    pricingMode: 'REFERENCE_PERCENT',
    priceVersion: 'v2.0.0',
    active: true,
    estimatedMinutes: item.duration.includes('hr')
      ? Math.round(parseFloat(item.duration) * 60) || 60
      : parseInt(item.duration) || 60,
    rating: item.rating,
    reviewCount: item.reviewCount,
    imageUrl: item.imageUrl,
    beforeAfterImage: item.imageUrl,
    demoVideoBadge: 'Diversey Certified',
    popular: item.popular,
    steps: item.processSteps,
    inclusions: item.inclusions,
    exclusions: item.exclusions,
    addons: (item.addOns || []).map((a, idx) => ({
      id: a.addOnId || `addon-${item.id}-${idx}`,
      name: a.name,
      price: a.price,
      description: a.description
    })),
  };
}