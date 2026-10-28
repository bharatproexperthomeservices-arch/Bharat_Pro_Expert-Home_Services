// server/seed/seedData.js
import { DOCUMENT_TYPES, KYC_STATUS, BACKGROUND_CHECK_STATUS, BOOKING_STATES, PAYMENT_METHODS, PAYMENT_STATUSES, PARTNER_TIERS } from '../../shared/constants.js';

export const CITIES = [
  { id: 'city_1', name: 'Gurugram', state: 'Haryana', multiplier: 1.15, lat: 28.4595, lng: 77.0266 },
  { id: 'city_2', name: 'Delhi NCR', state: 'Delhi', multiplier: 1.20, lat: 28.6139, lng: 77.2090 },
  { id: 'city_3', name: 'Bengaluru', state: 'Karnataka', multiplier: 1.25, lat: 12.9716, lng: 77.5946 },
  { id: 'city_4', name: 'Mumbai', state: 'Maharashtra', multiplier: 1.30, lat: 19.0760, lng: 72.8777 },
  { id: 'city_5', name: 'Hyderabad', state: 'Telangana', multiplier: 1.10, lat: 17.3850, lng: 78.4867 }
];

export const SERVICES = [
  { id: 'srv_1', name: 'Deep Home Cleaning', category: 'Cleaning', basePrice: 1999, durationMins: 180 },
  { id: 'srv_2', name: 'Sofa & Carpet Cleaning', category: 'Cleaning', basePrice: 899, durationMins: 90 },
  { id: 'srv_3', name: 'AC Service & Repair', category: 'Appliance', basePrice: 699, durationMins: 60 },
  { id: 'srv_4', name: 'Washing Machine Repair', category: 'Appliance', basePrice: 499, durationMins: 60 },
  { id: 'srv_5', name: 'Full Home Plumbing Inspection', category: 'Plumbing', basePrice: 599, durationMins: 45 },
  { id: 'srv_6', name: 'Tap & Mixer Replacement', category: 'Plumbing', basePrice: 299, durationMins: 30 },
  { id: 'srv_7', name: 'Electrical Switchboard Fix', category: 'Electrical', basePrice: 349, durationMins: 30 },
  { id: 'srv_8', name: 'Salon Classic Package', category: 'Beauty', basePrice: 1299, durationMins: 90 },
  { id: 'srv_9', name: 'Men Haircut & Grooming', category: 'Beauty', basePrice: 399, durationMins: 45 },
  { id: 'srv_10', name: 'Pest Control Full Home', category: 'Cleaning', basePrice: 1499, durationMins: 120 }
];

function generateDocs(status, isRejectScenario = false) {
  const docs = {};
  DOCUMENT_TYPES.forEach(docType => {
    if (isRejectScenario && (docType === 'PAN' || docType === 'POLICE_VERIFICATION')) {
      docs[docType] = {
        docType,
        url: `https://storage.bharatpro.in/docs/${docType.toLowerCase()}_sample.jpg`,
        status: 'REJECTED',
        rejectReasonCode: docType === 'PAN' ? 'DOC_BLURRY' : 'DOC_EXPIRED',
        verifiedAt: new Date().toISOString()
      };
    } else {
      docs[docType] = {
        docType,
        url: `https://storage.bharatpro.in/docs/${docType.toLowerCase()}_sample.jpg`,
        status: status === KYC_STATUS.KYC_CLEARED ? 'APPROVED' : 'PENDING',
        verifiedAt: status === KYC_STATUS.KYC_CLEARED ? new Date().toISOString() : null
      };
    }
  });
  return docs;
}

export const SEED_PARTNERS = [
  {
    id: 'partner_1',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    email: 'ramesh.cleaning@bharatpro.in',
    cityId: 'city_1',
    cityName: 'Gurugram',
    skills: ['Cleaning', 'Pest Control'],
    skillTags: ['Cleaning', 'Pest Control'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 4.8,
    reworkRate: 0.02,
    cancellationRate: 0.01,
    performanceScore: 242.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: true,
    status: 'ACTIVE',
    lat: 28.4590,
    lng: 77.0260,
    walletBalance: 1250.00
  },
  {
    id: 'partner_2',
    name: 'Suresh Sharma',
    phone: '+91 98765 43211',
    email: 'suresh.plumbing@bharatpro.in',
    cityId: 'city_1',
    cityName: 'Gurugram',
    skills: ['Plumbing'],
    skillTags: ['Plumbing'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 4.5,
    reworkRate: 0.05,
    cancellationRate: 0.03,
    performanceScore: 222.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: true,
    status: 'ACTIVE',
    lat: 28.4610,
    lng: 77.0280,
    walletBalance: 800.00
  },
  {
    id: 'partner_3',
    name: 'Amit Patel',
    phone: '+91 98765 43212',
    email: 'amit.electrical@bharatpro.in',
    cityId: 'city_2',
    cityName: 'Delhi NCR',
    skills: ['Electrical', 'Appliance'],
    skillTags: ['Electrical', 'Appliance'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 4.2,
    reworkRate: 0.08,
    cancellationRate: 0.05,
    performanceScore: 181.0,
    tier: PARTNER_TIERS.SILVER.name,
    commissionRate: 0.15,
    isActive: true,
    status: 'ACTIVE',
    lat: 28.6150,
    lng: 77.2080,
    walletBalance: 450.00
  },
  {
    id: 'partner_4',
    name: 'Pooja Verma',
    phone: '+91 98765 43213',
    email: 'pooja.beauty@bharatpro.in',
    cityId: 'city_3',
    cityName: 'Bengaluru',
    skills: ['Beauty'],
    skillTags: ['Beauty'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 4.9,
    reworkRate: 0.01,
    cancellationRate: 0.00,
    performanceScore: 247.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: true,
    status: 'ACTIVE',
    lat: 12.9720,
    lng: 77.5950,
    walletBalance: 2100.00
  },
  {
    id: 'partner_5',
    name: 'Vikram Singh',
    phone: '+91 98765 43214',
    email: 'vikram.appliance@bharatpro.in',
    cityId: 'city_4',
    cityName: 'Mumbai',
    skills: ['Appliance'],
    skillTags: ['Appliance'],
    assessmentPassed: true,
    trainingCompleted: false,
    trainingStatus: 'INCOMPLETE',
    kycStatus: KYC_STATUS.PENDING_VERIFICATION,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.PENDING,
    documents: generateDocs(KYC_STATUS.PENDING_VERIFICATION),
    avgRating: 0.0,
    reworkRate: 0,
    cancellationRate: 0,
    performanceScore: 200.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: false,
    status: 'INACTIVE',
    lat: 19.0780,
    lng: 72.8790,
    walletBalance: 0
  },
  {
    id: 'partner_6',
    name: 'Rajesh Gupta',
    phone: '+91 98765 43215',
    email: 'rajesh.plumbing@bharatpro.in',
    cityId: 'city_1',
    cityName: 'Gurugram',
    skills: ['Plumbing', 'Cleaning'],
    skillTags: ['Plumbing', 'Cleaning'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 3.8,
    reworkRate: 0.12,
    cancellationRate: 0.10,
    performanceScore: 154.0,
    tier: PARTNER_TIERS.SILVER.name,
    commissionRate: 0.15,
    isActive: true,
    status: 'ACTIVE',
    lat: 28.4550,
    lng: 77.0220,
    walletBalance: 320.00
  },
  {
    id: 'partner_7',
    name: 'Sunil Yadav',
    phone: '+91 98765 43216',
    email: 'sunil.yadav@bharatpro.in',
    cityId: 'city_2',
    cityName: 'Delhi NCR',
    skills: ['Electrical'],
    skillTags: ['Electrical'],
    assessmentPassed: true,
    trainingCompleted: false,
    trainingStatus: 'INCOMPLETE',
    kycStatus: KYC_STATUS.KYC_HOLD,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.PENDING,
    documents: generateDocs(KYC_STATUS.KYC_HOLD),
    avgRating: 0.0,
    reworkRate: 0,
    cancellationRate: 0,
    performanceScore: 200.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: false,
    status: 'INACTIVE',
    lat: 28.6100,
    lng: 77.2050,
    walletBalance: 0
  },
  {
    id: 'partner_8',
    name: 'Kavita Joshi',
    phone: '+91 98765 43217',
    email: 'kavita.beauty@bharatpro.in',
    cityId: 'city_5',
    cityName: 'Hyderabad',
    skills: ['Beauty'],
    skillTags: ['Beauty'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 3.2,
    reworkRate: 0.20,
    cancellationRate: 0.15,
    performanceScore: 119.0,
    tier: PARTNER_TIERS.BRONZE.name,
    commissionRate: 0.18,
    isActive: true,
    status: 'ACTIVE',
    lat: 17.3870,
    lng: 78.4880,
    walletBalance: 150.00
  },
  {
    id: 'partner_9',
    name: 'Manoj Kumar',
    phone: '+91 98765 43218',
    email: 'manoj.cleaning@bharatpro.in',
    cityId: 'city_1',
    cityName: 'Gurugram',
    skills: ['Cleaning'],
    skillTags: ['Cleaning'],
    assessmentPassed: false,
    trainingCompleted: false,
    trainingStatus: 'INCOMPLETE',
    kycStatus: KYC_STATUS.KYC_REJECTED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.FAILED,
    documents: generateDocs(KYC_STATUS.KYC_REJECTED, true),
    avgRating: 2.5,
    reworkRate: 0.35,
    cancellationRate: 0.25,
    performanceScore: 40.0,
    tier: PARTNER_TIERS.AT_RISK.name,
    commissionRate: 0.20,
    isActive: false,
    status: 'INACTIVE',
    lat: 28.4500,
    lng: 77.0200,
    walletBalance: 0
  },
  {
    id: 'partner_10',
    name: 'Deepak Reddy',
    phone: '+91 98765 43219',
    email: 'deepak.reddy@bharatpro.in',
    cityId: 'city_5',
    cityName: 'Hyderabad',
    skills: ['Appliance', 'Electrical'],
    skillTags: ['Appliance', 'Electrical'],
    assessmentPassed: true,
    trainingCompleted: true,
    trainingStatus: 'COMPLETE',
    kycStatus: KYC_STATUS.KYC_CLEARED,
    backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED,
    documents: generateDocs(KYC_STATUS.KYC_CLEARED),
    avgRating: 4.7,
    reworkRate: 0.03,
    cancellationRate: 0.02,
    performanceScore: 239.0,
    tier: PARTNER_TIERS.GOLD.name,
    commissionRate: 0.12,
    isActive: true,
    status: 'ACTIVE',
    lat: 17.3830,
    lng: 78.4850,
    walletBalance: 950.00
  }
];

export const SEED_BOOKINGS = Array.from({ length: 20 }).map((_, idx) => {
  const idNum = idx + 1;
  const service = SERVICES[idx % SERVICES.length];
  const city = CITIES[idx % CITIES.length];

  let status = BOOKING_STATES.PENDING;
  let partnerId = null;
  let paymentStatus = PAYMENT_STATUSES.PENDING_PAYOUT;
  let paymentMethod = PAYMENT_METHODS.ONLINE;

  if (idNum <= 5) {
    status = BOOKING_STATES.PENDING;
  } else if (idNum <= 9) {
    status = BOOKING_STATES.ASSIGNED;
    partnerId = `partner_${((idNum % 4) + 1)}`;
  } else if (idNum <= 12) {
    status = BOOKING_STATES.EN_ROUTE;
    partnerId = `partner_${((idNum % 4) + 1)}`;
  } else if (idNum <= 15) {
    status = BOOKING_STATES.IN_PROGRESS;
    partnerId = `partner_${((idNum % 4) + 1)}`;
  } else if (idNum <= 18) {
    status = BOOKING_STATES.COMPLETED;
    partnerId = `partner_${((idNum % 4) + 1)}`;
    paymentMethod = idNum % 2 === 0 ? PAYMENT_METHODS.ONLINE : PAYMENT_METHODS.CASH;
    paymentStatus = paymentMethod === PAYMENT_METHODS.CASH ? PAYMENT_STATUSES.COLLECTED_IN_CASH : PAYMENT_STATUSES.PENDING_PAYOUT;
  } else if (idNum === 19) {
    status = BOOKING_STATES.SETTLED;
    partnerId = 'partner_1';
    paymentStatus = PAYMENT_STATUSES.SETTLED;
  } else {
    status = BOOKING_STATES.CANCELLED;
  }

  const basePrice = service.basePrice;
  const totalAmount = Math.round(basePrice * city.multiplier * 1.05); // including GST

  return {
    id: `bk_${1000 + idNum}`,
    bookingNumber: `BPE-${2025000 + idNum}`,
    customerName: `Customer ${idNum}`,
    customerPhone: `+91 99000 1100${idNum % 10}`,
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    serviceCategory: service.category,
    cityId: city.id,
    cityName: city.name,
    status,
    partnerId,
    amount: totalAmount,
    totalAmount,
    basePrice,
    surgeMultiplier: 1.0,
    promoDiscount: 0,
    taxAmount: Math.round(totalAmount * 0.05),
    paymentMethod,
    paymentStatus,
    location: {
      address: `Flat ${101 + idNum}, Sector ${10 + (idNum % 50)}, ${city.name}`,
      lat: city.lat + (idNum * 0.001),
      lng: city.lng + (idNum * 0.001)
    },
    createdAt: new Date(Date.now() - (idNum * 3600000 * 4)).toISOString(),
    scheduledAt: new Date(Date.now() + (idNum * 3600000 * 2)).toISOString(),
    history: [
      {
        status: BOOKING_STATES.PENDING,
        actor: 'CUSTOMER',
        reasonCode: 'NORMAL_FLOW',
        timestamp: new Date(Date.now() - (idNum * 3600000 * 4)).toISOString()
      }
    ]
  };
});
