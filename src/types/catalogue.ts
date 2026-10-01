/* ============================================================
   BHARAT PRO EXPERT — MASTER CLEANING CATALOGUE
   ============================================================ */

export type ServiceStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type PricingMode = 'FIXED' | 'PER_BHK' | 'PER_SQFT' | 'PER_ROOM' | 'PER_UNIT' | 'PER_HOUR' | 'QUOTE_ONLY';
export type UnitType = 'JOB' | 'BHK' | 'SQFT' | 'ROOM' | 'SEAT' | 'PIECE' | 'LITRE' | 'HOUR' | 'BATHROOM' | 'KITCHEN' | 'APPLIANCE' | 'MATTRESS';
export type RiskClass = 'NORMAL' | 'ELEVATED' | 'HIGH_RISK';
export type SkillLevelRequired = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export type CategorySlug =
  | 'home-deep-cleaning' | 'kitchen-cleaning' | 'bathroom-cleaning'
  | 'sofa-cleaning' | 'carpet-cleaning' | 'mattress-cleaning'
  | 'water-tank-cleaning' | 'office-cleaning' | 'window-cleaning'
  | 'ac-service';

export interface ServiceStep {
  step: number;
  title: string;
  description: string;
  duration_min?: number;
}

export interface CustomerFaq {
  question: string;
  answer: string;
}

export interface PricingTierDefinition {
  label: string;
  min_quantity: number;
  max_quantity: number;
  unit: UnitType;
  price_paise: number;
  duration_min: number;
}

export interface DurationTierDefinition {
  label: string;
  duration_min: number;
}

export interface RoomBreakdown {
  room: string;
  tasks: string[];
  time_min: number;
}

export interface PackageDefinition {
  package_code: string;
  label: string;
  short_description: string;
  room_breakdown: RoomBreakdown[];
  inclusions: string[];
  exclusions: string[];
  duration_min: number;
  crew_size: number;
  price_paise: number;
  recommended_for: string;
  sample_tasks_count: number;
}

export interface CategoryDefinition {
  slug: CategorySlug;
  name: string;
  price_display_text: string;
  job_description: string;
  long_description: string;
  inclusions: string[];
  exclusions: string[];
  features: string[];
  service_process: ServiceStep[];
  partner_workflow: ServiceStep[];
  job_delivery: string[];
  customer_experience: string[];
  quality_checkpoints: string[];
  why_choose_us: string[];
  after_service_care: string[];
  customer_faqs: CustomerFaq[];
  equipment: string[];
  chemicals: string[];
  safety_notes: string[];
  duration_tiers: DurationTierDefinition[];
  pricing_tiers: PricingTierDefinition[];
  pricing_mode: PricingMode;
  primary_unit: UnitType;
  typical_duration_min: number;
  minimum_order_value_paise: number;
  risk_class: RiskClass;
  skill_required: SkillLevelRequired;
  requires_practical: boolean;
  requires_certificate: boolean;
  recommended_crew_min: number;
  recommended_crew_max: number;
  buffer_min: number;
  recommended_frequency: string;
  suitable_for: string[];
  popular_combos: string[];
  tags: string[];
  warranty_days: number;
  rating: number;
  rating_count: number;
  booking_count: number;
  is_featured: boolean;
  display_order: number;
  cancellation_policy: string;
  rescheduling_policy: string;
  packages: PackageDefinition[];
}

/* ============================================================
   CATEGORY 1: HOME / DEEP CLEANING
   ============================================================ */
const CATEGORY_1_HOME_DEEP: CategoryDefinition = {
  slug: 'home-deep-cleaning',
  name: 'Home / Deep Cleaning',
  price_display_text: 'Starting from ₹1,999',
  job_description: 'Complete home refresh — har room top-to-bottom saaf. Kitchen degreasing, bathroom descaling, floor scrubbing, fan aur window dusting.',
  long_description: 'Aapke ghar ka complete makeover — ceiling se floor tak. Trained housekeeping staff, premium R1/R3/R4/R7 chemicals, single-disc machine for floor scrubbing, steam disinfection aur move-in/move-out specialized cleaning. Ek hi booking me saare rooms, kitchen, bathrooms, balcony complete deep clean ho jaate hain. 100% satisfaction guarantee ke saath.',
  inclusions: [
    'Ceiling dusting — microfibre duster se',
    'Fans / AC dusting & cleaning (outer)',
    'Walls dusting — microfibre duster se',
    'Window and channel cleaning',
    'Curtain, sofa, mattress & carpet dry vacuuming',
    'Thorough glass cleaning (R3 chemical)',
    'All wooden furniture, doors cleaning & polishing (R4 chemical)',
    'Floor scrubbing — single-disc machine (R7 chemical)',
    'Deep cleaning of all rooms',
    'Deep cleaning of all bathrooms (R1 chemical)',
    'Deep cleaning of kitchen, kitchen cabinets outer & balcony',
    'Kitchen wall oil layer removal',
    'Fridge, almirah, sofa hata ke floor cleaning, phir wapas rakhna',
    'Diversey Virex II 256 spray — virus kill',
    '70% alcohol-based sanitiser — high-touch surfaces',
  ],
  exclusions: [
    'Kitchen appliance interiors (fridge, microwave, oven, chimney)',
    'Furniture interiors, upholstery, chandelier, terrace',
    'Utensils / objects removal aur reorganisation',
    'Wet wiping of wall & ceiling',
    'Glue / paint / sticker removal (25% extra charge)',
    'Carpet shampooing (sirf vacuuming)',
  ],
  features: [
    'Trained & background-verified housekeeping staff',
    'Premium R1/R3/R4/R7 chemicals',
    'Single-disc machine scrubbing',
    'Steam disinfection available',
    'Diversey Virex II 256 virus protection',
    'Move-in / move-out specialized',
  ],
  service_process: [
    { step: 1, title: 'Pre-inspection', description: 'Team leader poore ghar ka walkthrough karega.', duration_min: 10 },
    { step: 2, title: 'Ceiling & fan dusting', description: 'Top se bottom dry dusting.', duration_min: 20 },
    { step: 3, title: 'Furniture & glass', description: 'Wooden furniture polish + glass cleaning.', duration_min: 40 },
    { step: 4, title: 'Kitchen deep clean', description: 'Oil layer removal, slab, sink.', duration_min: 40 },
    { step: 5, title: 'Bathroom descaling', description: 'Tiles, WC, basin deep scrub.', duration_min: 30 },
    { step: 6, title: 'Floor scrubbing', description: 'Single-disc machine + mop.', duration_min: 60 },
    { step: 7, title: 'Final inspection', description: 'Team leader ke saath check.', duration_min: 15 },
  ],
  partner_workflow: [
    { step: 1, title: 'Job Accept', description: 'Partner app pe accept karega.' },
    { step: 2, title: 'Kit Check', description: 'Chemicals, single-disc machine, vacuum, brushes verify.' },
    { step: 3, title: 'Navigate', description: 'Google Maps / OSM se customer tak.' },
    { step: 4, title: 'OTP Verify', description: 'Customer se OTP lega, arrival mark.' },
    { step: 5, title: 'Before Photos', description: 'Har room ki before photos lega.' },
    { step: 6, title: 'Execute SOP', description: 'Ceiling to floor sequence follow.' },
    { step: 7, title: 'Mid-check', description: 'Team leader mid-job quality check.' },
    { step: 8, title: 'After Photos', description: 'Post-job photos lega.' },
    { step: 9, title: 'Customer Sign-off', description: 'Customer se sign-off lega.' },
    { step: 10, title: 'Payment Confirm', description: 'Job complete + payment.' },
  ],
  job_delivery: [
    'Customer app pe real-time partner tracking',
    'Before/after photos automatically upload',
    'Quality checklist fill hoga',
    'Customer sign-off ke bina job complete nahi hoga',
    'Payment auto-release job complete hone ke baad',
  ],
  customer_experience: [
    'Real-time partner tracking',
    'Before/after photos app pe',
    'Team leader ka introduction',
    'Cleaning process ka live update',
    'Post-service care tips',
    '7-day quality warranty',
  ],
  quality_checkpoints: [
    'Ceiling corners dust-free',
    'Fans cleaned both sides',
    'Glass streak-free',
    'Kitchen oil layer removed',
    'Bathroom descaling done',
    'Floor scratch-free',
    'No chemical residue',
    'Customer sign-off taken',
  ],
  why_choose_us: [
    'Background-verified housekeeping staff',
    'Premium eco-friendly chemicals',
    'Single-disc machine scrubbing',
    'Diversey Virex II 256 virus protection',
    'Move-in / move-out specialized',
  ],
  after_service_care: [
    '24 hours tak floor pe heavy furniture drag na karein',
    'Wooden furniture 2-3 din tak wet cloth se na ponche',
    'Bathroom 6 hours tak dry rakhein',
    'Windows 4 hours tak open rakhein ventilation ke liye',
  ],
  customer_faqs: [
    { question: 'Kya cleaning ke time ghar me rehna zaroori hai?', answer: 'Nahi, aap chale ja sakte hain. Team leader call karega.' },
    { question: 'Kitna time lagega?', answer: '1 BHK: 3-4 hrs, 2 BHK: 4-5 hrs, 3 BHK: 6-8 hrs.' },
    { question: 'Kya chemical safe hai pets ke liye?', answer: 'Haan, eco-friendly aur pet-safe chemicals use hote hain.' },
    { question: 'Kya appliances bhi clean karenge?', answer: 'Fridge/almirah hata ke floor clean karenge, interior not included.' },
    { question: 'Same-day booking available?', answer: 'Haan, subject to availability.' },
  ],
  equipment: ['Microfibre duster','Single-disc machine','Wet-dry vacuum','Squeegee','Mop & bucket','Extendable duster','Scrub brushes','Safe step-stool'],
  chemicals: ['R1 Bathroom cleaner','R3 Glass cleaner','R4 Wood polish','R7 Floor cleaner','Diversey Virex II 256','70% alcohol sanitiser','Neutral floor cleaner'],
  safety_notes: ['Top-to-bottom sequence follow karein','Surface compatibility check karein','Dilution ratio SOP ke hisaab se','Customer property ka care karein'],
  duration_tiers: [
    { label: '1 BHK', duration_min: 180 },
    { label: '2 BHK', duration_min: 240 },
    { label: '3 BHK', duration_min: 360 },
    { label: '4 BHK', duration_min: 480 },
  ],
  pricing_tiers: [
    { label: '1 BHK', min_quantity: 1, max_quantity: 1, unit: 'BHK', price_paise: 199900, duration_min: 180 },
    { label: '2 BHK', min_quantity: 2, max_quantity: 2, unit: 'BHK', price_paise: 279900, duration_min: 240 },
    { label: '3 BHK', min_quantity: 3, max_quantity: 3, unit: 'BHK', price_paise: 399900, duration_min: 360 },
    { label: '4 BHK', min_quantity: 4, max_quantity: 4, unit: 'BHK', price_paise: 499900, duration_min: 480 },
  ],
  pricing_mode: 'PER_BHK',
  primary_unit: 'BHK',
  typical_duration_min: 180,
  minimum_order_value_paise: 199900,
  risk_class: 'NORMAL',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: false,
  recommended_crew_min: 2,
  recommended_crew_max: 4,
  buffer_min: 30,
  recommended_frequency: 'Every 3-6 months',
  suitable_for: ['1BHK','2BHK','3BHK','4BHK','Villa','Duplex','Rental move-in','Rental move-out'],
  popular_combos: ['Home Deep + Sofa Cleaning','Home Deep + Kitchen Cleaning','Home Deep + Bathroom Cleaning'],
  tags: ['bestseller','deep-clean','move-in-out','featured'],
  warranty_days: 7,
  rating: 4.7,
  rating_count: 2894,
  booking_count: 15420,
  is_featured: true,
  display_order: 1,
  cancellation_policy: 'Free cancellation 4 hours before. After that 20% charge.',
  rescheduling_policy: 'Free rescheduling 2 hours before. Once per booking.',
  packages: [
    {
      package_code: 'PKG-HDC-1BHK',
      label: '1 BHK Deep Cleaning',
      short_description: '1 bedroom, 1 hall, 1 kitchen, 1 bathroom ka complete deep clean.',
      room_breakdown: [
        { room: 'Bedroom', tasks: ['Ceiling dusting','Fan cleaning','Wall dusting','Window + channel','Wardrobe outer','Bed frame outer','Mirror cleaning','Floor scrub'], time_min: 45 },
        { room: 'Hall / Living Room', tasks: ['Ceiling dusting','Fan / AC outer','Wall dusting','Window + channel','Sofa vacuuming','TV unit dusting','Glass cleaning','Floor scrub'], time_min: 40 },
        { room: 'Kitchen', tasks: ['Ceiling dusting','Wall oil removal','Slab cleaning','Sink descaling','Cabinet outer','Floor degreasing'], time_min: 35 },
        { room: 'Bathroom', tasks: ['Tiles descaling','WC cleaning','Basin cleaning','Tap polish','Mirror','Floor scrub + disinfect'], time_min: 30 },
        { room: 'Balcony', tasks: ['Floor sweeping','Dusting','Railing wipe'], time_min: 15 },
        { room: 'Final', tasks: ['Team leader inspection','Customer sign-off'], time_min: 15 },
      ],
      inclusions: ['3 hrs cleaning','2 staff','All R1/R3/R4/R7 chemicals','Single-disc machine'],
      exclusions: ['Appliance interiors','Wardrobe interior','Balcony deep scrub'],
      duration_min: 180,
      crew_size: 2,
      price_paise: 199900,
      recommended_for: 'Small family / bachelor / rental 1BHK',
      sample_tasks_count: 42,
    },
    {
      package_code: 'PKG-HDC-2BHK',
      label: '2 BHK Deep Cleaning',
      short_description: '2 bedrooms, 1 hall, 1 kitchen, 2 bathrooms ka complete deep clean.',
      room_breakdown: [
        { room: 'Bedroom 1', tasks: ['Ceiling dusting','Fan cleaning','Wall dusting','Window + channel','Wardrobe outer','Bed outer','Mirror','Floor scrub'], time_min: 40 },
        { room: 'Bedroom 2', tasks: ['Ceiling dusting','Fan cleaning','Wall dusting','Window + channel','Wardrobe outer','Bed outer','Mirror','Floor scrub'], time_min: 40 },
        { room: 'Hall / Living Room', tasks: ['Ceiling dusting','Fan / AC outer','Wall dusting','Window + channel','Sofa vacuuming','TV unit','Glass cleaning','Floor scrub'], time_min: 45 },
        { room: 'Kitchen', tasks: ['Ceiling dusting','Wall oil removal','Slab','Sink descaling','Cabinet outer','Exhaust fan','Floor degreasing'], time_min: 40 },
        { room: 'Bathroom 1', tasks: ['Tiles descaling','WC cleaning','Basin cleaning','Tap polish','Mirror','Floor scrub + disinfect'], time_min: 25 },
        { room: 'Bathroom 2', tasks: ['Tiles descaling','WC cleaning','Basin cleaning','Tap polish','Mirror','Floor scrub + disinfect'], time_min: 25 },
        { room: 'Balcony', tasks: ['Floor sweeping','Dusting','Railing wipe'], time_min: 15 },
        { room: 'Final', tasks: ['Inspection','Customer sign-off'], time_min: 10 },
      ],
      inclusions: ['4-5 hrs cleaning','3 staff','All chemicals','Single-disc machine'],
      exclusions: ['Appliance interiors','Wardrobe interiors','Furniture shampoo'],
      duration_min: 240,
      crew_size: 3,
      price_paise: 279900,
      recommended_for: 'Medium family / working couple 2BHK',
      sample_tasks_count: 60,
    },
    {
      package_code: 'PKG-HDC-3BHK',
      label: '3 BHK Deep Cleaning',
      short_description: '3 bedrooms, 1 hall, 1 kitchen, 3 bathrooms, balcony ka complete deep clean.',
      room_breakdown: [
        { room: 'Bedroom 1', tasks: ['Ceiling dusting','Fan cleaning','Wall dusting','Window + channel','Wardrobe outer','Bed outer','Mirror','Floor scrub'], time_min: 40 },
        { room: 'Bedroom 2', tasks: ['Same as Bedroom 1'], time_min: 40 },
        { room: 'Bedroom 3', tasks: ['Same as Bedroom 1'], time_min: 40 },
        { room: 'Hall / Living Room', tasks: ['Ceiling dusting','Fan / AC outer','Wall dusting','Window + channel','Sofa vacuuming','TV unit','Glass cleaning','Floor scrub'], time_min: 50 },
        { room: 'Kitchen', tasks: ['Ceiling dusting','Wall oil removal','Slab','Sink descaling','Cabinet outer','Exhaust fan','Floor degreasing'], time_min: 50 },
        { room: 'Bathrooms (1-3)', tasks: ['Tiles descaling','WC','Basin','Tap polish','Mirror','Floor scrub + disinfect'], time_min: 60 },
        { room: 'Balcony', tasks: ['Floor sweeping','Dusting','Railing wipe'], time_min: 20 },
        { room: 'Final', tasks: ['Inspection','Customer sign-off'], time_min: 15 },
      ],
      inclusions: ['6-8 hrs cleaning','4 staff','All chemicals','Single-disc machine','Steam disinfection'],
      exclusions: ['Appliance interiors','Wardrobe interiors','Furniture shampoo'],
      duration_min: 360,
      crew_size: 4,
      price_paise: 399900,
      recommended_for: 'Large family 3BHK',
      sample_tasks_count: 85,
    },
    {
      package_code: 'PKG-HDC-4BHK',
      label: '4 BHK Deep Cleaning',
      short_description: '4 bedrooms, 2 halls, 1 kitchen, 4 bathrooms, balconies ka complete deep clean.',
      room_breakdown: [
        { room: 'Bedrooms (1-4)', tasks: ['Ceiling dusting','Fan cleaning','Wall dusting','Window + channel','Wardrobe outer','Bed outer','Mirror','Floor scrub'], time_min: 160 },
        { room: 'Halls (Living + Dining)', tasks: ['Ceiling dusting','Fan / AC outer','Wall dusting','Sofa vacuuming','TV unit','Glass cleaning','Floor scrub'], time_min: 90 },
        { room: 'Kitchen', tasks: ['Ceiling dusting','Wall oil removal','Slab','Sink descaling','Cabinet outer','Exhaust fan','Floor degreasing'], time_min: 60 },
        { room: 'Bathrooms (1-4)', tasks: ['Tiles descaling','WC','Basin','Tap polish','Floor scrub + disinfect'], time_min: 80 },
        { room: 'Balconies', tasks: ['Floor sweeping','Dusting','Railing wipe'], time_min: 25 },
        { room: 'Final', tasks: ['Inspection','Customer sign-off'], time_min: 25 },
      ],
      inclusions: ['7-9 hrs','4-5 staff','All chemicals','Single-disc machine','Steam disinfection','Diversey spray'],
      exclusions: ['Appliance interiors','Wardrobe interiors','Furniture shampoo'],
      duration_min: 480,
      crew_size: 4,
      price_paise: 499900,
      recommended_for: 'Large family / villa / duplex',
      sample_tasks_count: 110,
    },
  ],
};

/* ============================================================
   CATEGORY 2: KITCHEN DEEP CLEANING
   ============================================================ */
const CATEGORY_2_KITCHEN: CategoryDefinition = {
  slug: 'kitchen-cleaning',
  name: 'Kitchen Deep Cleaning',
  price_display_text: 'Starting from ₹1,499',
  job_description: 'Chimney, stove, counters, aur tiles properly scrub. Oil aur grease ka permanent removal. Food-safe sanitization included.',
  long_description: 'Kitchen me sabse zyada oil aur grease jamta hai. Hamare trained kitchen specialists heavy-duty alkaline degreaser use karte hain — chimney outer, stove burners, wall tiles, slab aur sink sab kuch food-safe methods se deep clean hota hai. FSSAI-approved sanitizer se aapka kitchen ek dum new jaisa lagega.',
  inclusions: ['Chimney outer cleaning — heavy degreaser','Stove + burners deep clean','Slab / counter — food-safe sanitizer','Wall tiles — oil layer removal','Sink & tap descaling','Cabinets outer cleaning','Floor degreasing','Exhaust fan cleaning','Chimney filter cleaning'],
  exclusions: ['Chimney internal motor','Oven interior','Microwave interior','Fridge interior','Washing machine interior','Cabinet interiors (extra)','Utensil washing'],
  features: ['Heavy-duty alkaline degreaser','Chimney filter alag se','Food-safe sanitizer','Stainless steel polish','No-residue guarantee'],
  service_process: [
    { step: 1, title: 'Gas off', description: 'Gas stove off + cool down.', duration_min: 5 },
    { step: 2, title: 'Chimney outer', description: 'Degreaser spray + scrub.', duration_min: 30 },
    { step: 3, title: 'Stove & burners', description: 'Burners, grates removal + scrub.', duration_min: 30 },
    { step: 4, title: 'Tiles & slab', description: 'Oil removal + sanitizer wipe.', duration_min: 30 },
    { step: 5, title: 'Sink & taps', description: 'Limescale removal + chrome polish.', duration_min: 15 },
    { step: 6, title: 'Floor scrub', description: 'Degreaser scrub + mop.', duration_min: 25 },
    { step: 7, title: 'Inspection', description: 'Food-safe check.', duration_min: 15 },
  ],
  partner_workflow: [
    { step: 1, title: 'Job Accept', description: 'Job accept karega.' },
    { step: 2, title: 'Kit Check', description: 'Alkaline degreaser, sanitizer, brushes ready.' },
    { step: 3, title: 'Navigate', description: 'Customer location.' },
    { step: 4, title: 'OTP + Before Photos', description: 'OTP + before photos.' },
    { step: 5, title: 'Gas Off Safety', description: 'Gas off + safety check.' },
    { step: 6, title: 'Execute SOP', description: 'Chimney → stove → tiles → sink → floor.' },
    { step: 7, title: 'After Photos', description: 'Post-clean photos.' },
    { step: 8, title: 'Sign-off', description: 'Customer approval.' },
    { step: 9, title: 'Payment', description: 'Payment + care tips.' },
  ],
  job_delivery: ['Before/after photos','Food-safe proof','Chimney filter separately cleaned proof','Customer sign-off'],
  customer_experience: ['Real-time tracking','Food-safe sanitization','Filter separately cleaned','Ventilation tips','5-day warranty'],
  quality_checkpoints: ['Chimney outer oil-free','Burners fully clean','Tiles oil-free','Sink limescale-free','Floor degreased','No food-contact residue'],
  why_choose_us: ['Food-safe guarantee','Heavy-duty degreaser','Filter alag','Trained experts','No residue'],
  after_service_care: ['Gas 1 hour tak use na karein','Slab 30 min dry','Chimney 2 hrs tak na use','Ventilation 30 min'],
  customer_faqs: [
    { question: 'Chimney andar se clean hoga?', answer: 'Chimney outer + filter. Motor internal not included.' },
    { question: 'Oven bhi clean hoga?', answer: 'Oven interior optional add-on.' },
    { question: 'Kitna time?', answer: 'Approx 2.5 hours.' },
    { question: 'Food safe?', answer: 'Haan, FSSAI-approved.' },
    { question: 'Cabinet interiors?', answer: 'Optional add-on.' },
  ],
  equipment: ['Degreasing brushes','Steel scrubber','Microfibre cloths','Scrapers','Spray bottle','Wet-dry vacuum'],
  chemicals: ['Alkaline degreaser','Food-safe sanitizer','Stainless steel cleaner','Floor degreaser','Chimney-grade degreaser'],
  safety_notes: ['Gas stove pehle band','Food-contact surfaces residue-free','Gloves + mask zaroori','Chimney filter alag'],
  duration_tiers: [
    { label: '1 Kitchen', duration_min: 150 },
    { label: 'Kitchen + Utility', duration_min: 180 },
  ],
  pricing_tiers: [
    { label: '1 Kitchen', min_quantity: 1, max_quantity: 1, unit: 'KITCHEN', price_paise: 149900, duration_min: 150 },
    { label: 'Kitchen + Room', min_quantity: 1, max_quantity: 1, unit: 'KITCHEN', price_paise: 219900, duration_min: 180 },
  ],
  pricing_mode: 'FIXED',
  primary_unit: 'KITCHEN',
  typical_duration_min: 150,
  minimum_order_value_paise: 149900,
  risk_class: 'NORMAL',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: false,
  recommended_crew_min: 1,
  recommended_crew_max: 2,
  buffer_min: 30,
  recommended_frequency: 'Every 2-3 months',
  suitable_for: ['Home kitchen','PG kitchen','Rental kitchen'],
  popular_combos: ['Kitchen + Chimney Service','Kitchen + Home Deep Cleaning'],
  tags: ['bestseller','food-safe','degreasing'],
  warranty_days: 5,
  rating: 4.6,
  rating_count: 1842,
  booking_count: 9870,
  is_featured: true,
  display_order: 2,
  cancellation_policy: 'Free cancellation 4 hours before.',
  rescheduling_policy: 'Free rescheduling 2 hours before.',
  packages: [
    {
      package_code: 'PKG-KC-STD',
      label: 'Kitchen Deep Clean (Standard)',
      short_description: 'Complete kitchen deep cleaning — chimney, stove, slab, tiles, floor.',
      room_breakdown: [
        { room: 'Chimney Area', tasks: ['Chimney outer degreasing','Filter removal + clean','Exhaust fan cleaning'], time_min: 40 },
        { room: 'Stove / Hob', tasks: ['Burner removal','Grate scrub','Knob cleaning','Gas top degreasing'], time_min: 30 },
        { room: 'Slab & Sink', tasks: ['Counter cleaning','Sink descaling','Tap chrome polish','Food-safe sanitizer'], time_min: 25 },
        { room: 'Wall Tiles', tasks: ['Oil layer removal','Degreaser spray + scrub','Wipe clean'], time_min: 25 },
        { room: 'Cabinets Outer', tasks: ['Outer surface degreasing','Handle cleaning'], time_min: 15 },
        { room: 'Floor', tasks: ['Degreaser scrub','Mop + dry'], time_min: 15 },
      ],
      inclusions: ['150 min cleaning','1-2 staff','All kitchen-grade chemicals','Food-safe sanitization'],
      exclusions: ['Chimney motor','Oven / microwave interior','Cabinet interiors','Utensils'],
      duration_min: 150,
      crew_size: 2,
      price_paise: 149900,
      recommended_for: 'Standard kitchen (up to 8 ft slab)',
      sample_tasks_count: 35,
    },
    {
      package_code: 'PKG-KC-EXT',
      label: 'Kitchen + Utility Area',
      short_description: 'Standard kitchen + utility / pantry area ka complete clean.',
      room_breakdown: [
        { room: 'Kitchen', tasks: ['Chimney + filter','Stove + burners','Slab + sink','Wall tiles','Cabinets outer','Floor'], time_min: 120 },
        { room: 'Utility / Pantry', tasks: ['Ceiling dusting','Walls wipe','Slab cleaning','Washing machine outer','Floor scrub'], time_min: 45 },
        { room: 'Final', tasks: ['Team leader inspection','Customer sign-off'], time_min: 15 },
      ],
      inclusions: ['180 min','2 staff','All chemicals','Food-safe sanitizer'],
      exclusions: ['Appliance interiors','Cabinet interiors','Utensils'],
      duration_min: 180,
      crew_size: 2,
      price_paise: 219900,
      recommended_for: 'Kitchen with utility / pantry',
      sample_tasks_count: 45,
    },
  ],
};

/* ============================================================
   CATEGORY 3: BATHROOM DEEP CLEANING
   ============================================================ */
const CATEGORY_3_BATHROOM: CategoryDefinition = {
  slug: 'bathroom-cleaning',
  name: 'Bathroom Deep Cleaning',
  price_display_text: 'Starting from ₹799',
  job_description: 'Tiles, faucets, toilet seats, aur hard-to-reach places cleaning. Descaling aur sanitization included.',
  long_description: 'Bathroom me hard water stains, mold aur germs hote hain. Acid-based descalers + disinfectant se tiles, WC, basin, taps, shower sab kuch germ-free karte hain. Grout lines bhi deep clean hote hain. Aapko milega — ek dum sparkle clean bathroom with 99.9% germ-free surfaces.',
  inclusions: ['Exhaust fan cleaning','WC / Toilet Pot deep clean','Floor cleaning + disinfect','Basin + drain + overflow','Shower tiles + walls scrub','Showerhead descaling','Taps chrome polish','Glass / mirror','Washbasin deep clean','Cubical glass','Water closet disinfection','Sinks & tanks','Doors & frames','Doorknobs','Screen doors','Floor scrub + disinfect'],
  exclusions: ['Shower curtains','Cabinet interiors','Accessory installation','Plumbing work','Tiling / masonry'],
  features: ['Acid-based descaler','Grout lines deep clean','99.9% germ-free','Chrome polish finish','Anti-mold treatment'],
  service_process: [
    { step: 1, title: 'Dry dusting', description: 'Exhaust fan, corners, ceiling.', duration_min: 5 },
    { step: 2, title: 'Descaler spray', description: 'Tiles, taps, shower pe spray.', duration_min: 10 },
    { step: 3, title: 'Grout scrub', description: 'Tile joints grout brush.', duration_min: 15 },
    { step: 4, title: 'WC & basin', description: 'Toilet cleaner + disinfectant.', duration_min: 15 },
    { step: 5, title: 'Glass & mirror', description: 'Glass cleaner + squeegee.', duration_min: 10 },
    { step: 6, title: 'Floor scrub', description: 'Scrub + mop + disinfect.', duration_min: 10 },
    { step: 7, title: 'Final dry', description: 'Squeegee extra water.', duration_min: 5 },
  ],
  partner_workflow: [
    { step: 1, title: 'Job Accept', description: 'Job details + address.' },
    { step: 2, title: 'Kit Check', description: 'Acid descaler, toilet cleaner, PPE.' },
    { step: 3, title: 'Navigate', description: 'Customer location.' },
    { step: 4, title: 'OTP + Before Photos', description: 'OTP + photos.' },
    { step: 5, title: 'Ventilation ON', description: 'Exhaust fan ON.' },
    { step: 6, title: 'Execute', description: 'Safe mixing + SOP.' },
    { step: 7, title: 'After Photos', description: 'Sparkle clean.' },
    { step: 8, title: 'Sign-off', description: 'Customer approval.' },
    { step: 9, title: 'Payment', description: 'Payment + care tips.' },
  ],
  job_delivery: ['Before/after photos','Safety compliance proof','Chemical usage log','Customer sign-off'],
  customer_experience: ['Ventilation during work','Chemical safety warnings','Sparkle clean result','3-day warranty'],
  quality_checkpoints: ['Tiles hard-water free','Grout lines clean','WC disinfected','Taps chrome-shine','Floor slip-free','No chemical smell'],
  why_choose_us: ['Acid descaler','99.9% germ-free','Grout deep clean','Chrome polish','Anti-mold'],
  after_service_care: ['30 min tak use na karein','Ventilation 1 hour','Surfaces dry rakhein','Weekly cleaning continue'],
  customer_faqs: [
    { question: 'Hard water stains hatenge?', answer: '90%+ stains remove honge.' },
    { question: 'Kitna time?', answer: '1 bath: 45-60 min, 2 bath: 90 min.' },
    { question: 'Chemical safe?', answer: 'Ventilated bathroom me use, 30 min baad use.' },
    { question: 'Shower curtain clean hoga?', answer: 'Optional add-on.' },
    { question: 'Grout lines?', answer: 'Haan, grout brush se.' },
  ],
  equipment: ['Bowl brush','Grout brush','Scrub brushes','Squeegee','Microfiber cloths','Rubber gloves','Safety goggles','Face mask','Wet-floor sign'],
  chemicals: ['Bathroom descaler (acid)','Toilet cleaner (HCl)','Disinfectant','Tile cleaner','Glass cleaner'],
  safety_notes: ['BLEACH + ACID = TOXIC — KABHI MAT MILAO','BLEACH + AMMONIA = TOXIC','Ventilation ON','Gloves, mask, goggles zaroori','Wet floor sign'],
  duration_tiers: [
    { label: '1 Bathroom', duration_min: 60 },
    { label: '2 Bathroom', duration_min: 90 },
    { label: '3 Bathroom', duration_min: 120 },
    { label: '4 Bathroom', duration_min: 150 },
    { label: '5 Bathroom', duration_min: 180 },
  ],
  pricing_tiers: [
    { label: '1 Bathroom', min_quantity: 1, max_quantity: 1, unit: 'BATHROOM', price_paise: 79900, duration_min: 60 },
    { label: '2 Bathroom', min_quantity: 2, max_quantity: 2, unit: 'BATHROOM', price_paise: 149900, duration_min: 90 },
    { label: '3 Bathroom', min_quantity: 3, max_quantity: 3, unit: 'BATHROOM', price_paise: 219900, duration_min: 120 },
    { label: '4 Bathroom', min_quantity: 4, max_quantity: 4, unit: 'BATHROOM', price_paise: 279900, duration_min: 150 },
    { label: '5 Bathroom', min_quantity: 5, max_quantity: 5, unit: 'BATHROOM', price_paise: 339900, duration_min: 180 },
  ],
  pricing_mode: 'PER_UNIT',
  primary_unit: 'BATHROOM',
  typical_duration_min: 90,
  minimum_order_value_paise: 79900,
  risk_class: 'ELEVATED',
  skill_required: 'BEGINNER',
  requires_practical: true,
  requires_certificate: false,
  recommended_crew_min: 1,
  recommended_crew_max: 2,
  buffer_min: 15,
  recommended_frequency: 'Every 1-2 months',
  suitable_for: ['Home bathroom','Hotel bathroom','PG bathroom'],
  popular_combos: ['Bathroom + Home Deep Cleaning','Bathroom + Water Tank Cleaning'],
  tags: ['bestseller','descaling','germ-free'],
  warranty_days: 3,
  rating: 4.6,
  rating_count: 2410,
  booking_count: 12840,
  is_featured: true,
  display_order: 3,
  cancellation_policy: 'Free cancellation 2 hours before.',
  rescheduling_policy: 'Free rescheduling 1 hour before.',
  packages: [
    {
      package_code: 'PKG-BC-1',
      label: '1 Bathroom Deep Clean',
      short_description: '1 bathroom complete deep clean — tiles, WC, basin, shower, floor.',
      room_breakdown: [
        { room: 'Bathroom', tasks: ['Exhaust fan cleaning','WC / Toilet deep clean','Basin + tap descaling','Shower tiles + walls','Showerhead descale','Mirror + glass','Floor scrub + disinfect'], time_min: 45 },
        { room: 'Final', tasks: ['Team leader check','Customer sign-off'], time_min: 15 },
      ],
      inclusions: ['60 min cleaning','1 staff','Acid-based descaler','Anti-mold treatment'],
      exclusions: ['Shower curtains','Cabinet interiors','Accessory install','Plumbing'],
      duration_min: 60,
      crew_size: 1,
      price_paise: 79900,
      recommended_for: 'Single bathroom (up to 40 sqft)',
      sample_tasks_count: 20,
    },
    {
      package_code: 'PKG-BC-2',
      label: '2 Bathrooms Deep Clean',
      short_description: '2 bathrooms complete deep clean.',
      room_breakdown: [
        { room: 'Bathroom 1', tasks: ['Fan','WC','Basin','Shower','Mirror','Floor'], time_min: 35 },
        { room: 'Bathroom 2', tasks: ['Fan','WC','Basin','Shower','Mirror','Floor'], time_min: 35 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 20 },
      ],
      inclusions: ['90 min','1 staff','All chemicals','Anti-mold'],
      exclusions: ['Curtains','Cabinets','Plumbing'],
      duration_min: 90,
      crew_size: 1,
      price_paise: 149900,
      recommended_for: '2BHK with 2 bathrooms',
      sample_tasks_count: 35,
    },
    {
      package_code: 'PKG-BC-3',
      label: '3 Bathrooms Deep Clean',
      short_description: '3 bathrooms complete deep clean with team.',
      room_breakdown: [
        { room: 'Bathroom 1, 2, 3', tasks: ['Fan','WC','Basin','Shower','Mirror','Floor + disinfect'], time_min: 100 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 20 },
      ],
      inclusions: ['120 min','2 staff','All chemicals','Full sanitization'],
      exclusions: ['Curtains','Cabinets','Plumbing'],
      duration_min: 120,
      crew_size: 2,
      price_paise: 219900,
      recommended_for: 'Large families',
      sample_tasks_count: 50,
    },
    {
      package_code: 'PKG-BC-4',
      label: '4 Bathrooms Deep Clean',
      short_description: '4 bathrooms complete deep clean.',
      room_breakdown: [
        { room: 'Bathrooms 1-4', tasks: ['Fan','WC','Basin','Shower','Mirror','Floor + disinfect'], time_min: 120 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 30 },
      ],
      inclusions: ['150 min','2 staff','All chemicals','Full sanitization'],
      exclusions: ['Curtains','Cabinets','Plumbing'],
      duration_min: 150,
      crew_size: 2,
      price_paise: 279900,
      recommended_for: '4BHK / villas',
      sample_tasks_count: 65,
    },
    {
      package_code: 'PKG-BC-5',
      label: '5 Bathrooms Deep Clean',
      short_description: '5 bathrooms complete deep clean.',
      room_breakdown: [
        { room: 'Bathrooms 1-5', tasks: ['Fan','WC','Basin','Shower','Mirror','Floor + disinfect'], time_min: 150 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 30 },
      ],
      inclusions: ['180 min','2-3 staff','All chemicals','Full sanitization'],
      exclusions: ['Curtains','Cabinets','Plumbing'],
      duration_min: 180,
      crew_size: 2,
      price_paise: 339900,
      recommended_for: 'Villas / PGs',
      sample_tasks_count: 80,
    },
  ],
};

/* ============================================================
   CATEGORY 4: SOFA CLEANING & SHAMPOOING
   ============================================================ */
const CATEGORY_4_SOFA: CategoryDefinition = {
  slug: 'sofa-cleaning',
  name: 'Sofa Cleaning & Shampooing',
  price_display_text: 'Starting from ₹399',
  job_description: 'Deep clean to remove stains, dust, aur odour. Fabric-safe shampooing with extraction machine.',
  long_description: 'Sofa me dust, stains aur bacteria hote hain. Fabric-safe shampoo + extraction machine se deep clean — dust, allergens, pet hair aur stains remove hote hain. Injection-extraction method se 99% germ-free result. Leather aur fabric dono ke liye specialized treatment.',
  inclusions: ['Dry vacuuming — all corners','Complete scrubbing + shampooing','Spot treatment','Fabric-safe pH-neutral shampoo','Injection-Extraction method','Deodoriser — smell removal','Colour-fastness patch test','Drying support — air mover'],
  exclusions: ['Ink stain removal','Leather/rexine wet shampoo (dry clean only)','Cushion cleaning (extra)','Sofa repair/stitching','Pet hair deep extraction (extra)'],
  features: ['Injection-Extraction method','Fabric-safe pH-neutral','Spot treatment','Odour removal','Colour-fastness patch test','99% germ-free'],
  service_process: [
    { step: 1, title: 'Fabric ID', description: 'Cotton / velvet / leather check.', duration_min: 5 },
    { step: 2, title: 'Dry vacuum', description: 'All corners + crevices.', duration_min: 15 },
    { step: 3, title: 'Patch test', description: 'Hidden area colour test.', duration_min: 5 },
    { step: 4, title: 'Pre-spray + scrub', description: 'Shampoo + soft brush.', duration_min: 30 },
    { step: 5, title: 'Extraction', description: 'Injection-extraction.', duration_min: 20 },
    { step: 6, title: 'Deodoriser', description: 'Safe deodoriser spray.', duration_min: 5 },
    { step: 7, title: 'Drying', description: 'Air mover.', duration_min: 10 },
  ],
  partner_workflow: [
    { step: 1, title: 'Job Accept', description: 'Job accept.' },
    { step: 2, title: 'Kit Check', description: 'Extraction machine + shampoo.' },
    { step: 3, title: 'Navigate + OTP', description: 'Location + OTP.' },
    { step: 4, title: 'Fabric Test', description: 'Patch test + fabric ID.' },
    { step: 5, title: 'Execute SOP', description: 'Vacuum → shampoo → extract.' },
    { step: 6, title: 'Photos', description: 'Before/after photos.' },
    { step: 7, title: 'Sign-off', description: 'Customer approval.' },
    { step: 8, title: 'Payment', description: 'Payment + care tips.' },
  ],
  job_delivery: ['Before/after photos','Fabric test report','Extraction proof','Customer sign-off'],
  customer_experience: ['Extraction demo','4-6 hours drying','Fresh smell','5-day warranty'],
  quality_checkpoints: ['Dry vacuum complete','Extraction water visible','No over-wetting','Odour gone','Colour intact'],
  why_choose_us: ['Extraction method','Fabric-safe','99% germ-free','Leather/velvet specialists','Patch test'],
  after_service_care: ['4-6 hrs tak use na karein','Fan ON rakhein','Direct sunlight avoid','Wet spots check'],
  customer_faqs: [
    { question: 'Stains poore hatenge?', answer: '90%+ hatenge. Ink/permanent marker not remove.' },
    { question: 'Kitna time?', answer: '3-seater: 90 min.' },
    { question: 'Leather sofa?', answer: 'Haan, leather conditioner se.' },
    { question: 'Drying time?', answer: '4-6 hours.' },
    { question: 'Home me hi clean?', answer: 'Haan, on-site.' },
  ],
  equipment: ['Upholstery vacuum','Extraction machine','Soft brushes','Microfiber cloths','Spray bottles','Air mover'],
  chemicals: ['Upholstery shampoo','Spot remover','Deodoriser','Leather conditioner','pH-neutral shampoo'],
  safety_notes: ['Fabric identification','Patch test','Colour-fastness check','Over-wetting avoid'],
  duration_tiers: [
    { label: '1 Seat', duration_min: 30 },
    { label: '3 Seater', duration_min: 90 },
    { label: '5 Seater', duration_min: 90 },
    { label: '8 Seater', duration_min: 150 },
  ],
  pricing_tiers: [
    { label: '1 Seat', min_quantity: 1, max_quantity: 1, unit: 'SEAT', price_paise: 39900, duration_min: 30 },
    { label: '3 Seater', min_quantity: 3, max_quantity: 3, unit: 'SEAT', price_paise: 89900, duration_min: 90 },
    { label: '5 Seater', min_quantity: 5, max_quantity: 5, unit: 'SEAT', price_paise: 135900, duration_min: 90 },
    { label: '8 Seater', min_quantity: 8, max_quantity: 8, unit: 'SEAT', price_paise: 209900, duration_min: 150 },
  ],
  pricing_mode: 'PER_UNIT',
  primary_unit: 'SEAT',
  typical_duration_min: 90,
  minimum_order_value_paise: 89900,
  risk_class: 'NORMAL',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: false,
  recommended_crew_min: 1,
  recommended_crew_max: 2,
  buffer_min: 30,
  recommended_frequency: 'Every 4-6 months',
  suitable_for: ['Fabric sofa','Leather sofa','Velvet sofa','L-shape','Recliner'],
  popular_combos: ['Sofa + Carpet','Sofa + Home Deep'],
  tags: ['bestseller','extraction-machine'],
  warranty_days: 5,
  rating: 4.7,
  rating_count: 1562,
  booking_count: 8940,
  is_featured: true,
  display_order: 4,
  cancellation_policy: 'Free cancellation 4 hours before.',
  rescheduling_policy: 'Free rescheduling 2 hours before.',
  packages: [
    {
      package_code: 'PKG-SC-1',
      label: '1 Seater Sofa',
      short_description: 'Single seat sofa ka complete deep shampooing.',
      room_breakdown: [
        { room: 'Sofa', tasks: ['Dry vacuum','Fabric patch test','Pre-spray shampoo','Extraction machine','Deodoriser','Drying'], time_min: 30 },
      ],
      inclusions: ['Dry vacuum','Fabric-safe shampoo','Extraction','Deodoriser'],
      exclusions: ['Stain guarantee','Cushion cover','Repair'],
      duration_min: 30,
      crew_size: 1,
      price_paise: 39900,
      recommended_for: 'Single chair / ottoman',
      sample_tasks_count: 8,
    },
    {
      package_code: 'PKG-SC-3',
      label: '3 Seater Sofa',
      short_description: '3-seater sofa ka deep shampooing with extraction.',
      room_breakdown: [
        { room: 'Sofa (3 seats)', tasks: ['Corner vacuuming','Patch test','Pre-spray','Brush scrub','Extraction','Deodoriser','Drying'], time_min: 75 },
        { room: 'Final', tasks: ['Team check','Sign-off'], time_min: 15 },
      ],
      inclusions: ['90 min','1-2 staff','Full extraction','Deodoriser'],
      exclusions: ['Ink stain','Pet hair deep','Cushion covers'],
      duration_min: 90,
      crew_size: 1,
      price_paise: 89900,
      recommended_for: 'Living room 3-seater',
      sample_tasks_count: 15,
    },
    {
      package_code: 'PKG-SC-5',
      label: '5 Seater Sofa',
      short_description: '5-seater sofa (3+2) ka deep shampooing.',
      room_breakdown: [
        { room: 'Sofa (5 seats)', tasks: ['Deep vacuum','Fabric test','Pre-spray','Brush','Extraction','Deodoriser'], time_min: 75 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 15 },
      ],
      inclusions: ['90 min','2 staff','Extraction','Deodoriser','Air mover'],
      exclusions: ['Ink','Pet deep','Cushion covers'],
      duration_min: 90,
      crew_size: 2,
      price_paise: 135900,
      recommended_for: 'Family living room',
      sample_tasks_count: 20,
    },
    {
      package_code: 'PKG-SC-8',
      label: '8 Seater Sofa',
      short_description: '8-seater (3+3+2) sofa ka complete deep clean.',
      room_breakdown: [
        { room: 'Sofa (8 seats)', tasks: ['Vacuum all sections','Patch test each','Pre-spray','Brush','Extraction','Deodoriser','Drying'], time_min: 130 },
        { room: 'Final', tasks: ['Inspection','Sign-off'], time_min: 20 },
      ],
      inclusions: ['150 min','2 staff','Full extraction','Air mover','Deodoriser'],
      exclusions: ['Ink','Pet deep','Cushion covers'],
      duration_min: 150,
      crew_size: 2,
      price_paise: 209900,
      recommended_for: 'Large living room / joint family',
      sample_tasks_count: 30,
    },
  ],
};

/* ============================================================
   CATEGORY 5: CARPET CLEANING
   ============================================================ */
const CATEGORY_5_CARPET: CategoryDefinition = {
  slug: 'carpet-cleaning',
  name: 'Carpet Cleaning',
  price_display_text: 'Starting from ₹799',
  job_description: 'Deep clean to remove stains, dust, aur odour. Pile aur backing-safe method.',
  long_description: 'Carpet me dust, allergens, bacteria hote hain. Pile + backing-safe method se deep clean — pre-spray, agitation brush, hot-water extraction. Aapko milega — deep cleaned carpet with 90%+ stains removed, no over-wetting, no damage.',
  inclusions: ['Dry vacuuming — all corners','Agitation brushing — carpet-safe','Pre-spray treatment','Extraction machine — hot-water','Spot lifter','Defoamer','Colour-fastness test','Drying support'],
  exclusions: ['Permanent stain removal','Carpet repair/stitching','Pet odour deep treatment (extra)','Installation/removal','Under-carpet floor'],
  features: ['Hot-water extraction','Pile & backing safe','Pre-spray + agitation','Colour-fastness test','No over-wetting'],
  service_process: [
    { step: 1, title: 'Fabric ID', description: 'Wool / nylon / polyester.', duration_min: 5 },
    { step: 2, title: 'Dry vacuum', description: 'Deep vacuum.', duration_min: 15 },
    { step: 3, title: 'Patch test', description: 'Hidden area test.', duration_min: 5 },
    { step: 4, title: 'Pre-spray', description: 'Pre-treatment spray.', duration_min: 10 },
    { step: 5, title: 'Agitation', description: 'Carpet-safe brush.', duration_min: 15 },
    { step: 6, title: 'Extraction', description: 'Hot-water extraction.', duration_min: 30 },
    { step: 7, title: 'Dry', description: 'Air mover.', duration_min: 10 },
  ],
  partner_workflow: [
    { step: 1, title: 'Job Accept', description: 'Job accept.' },
    { step: 2, title: 'Kit Check', description: 'Extraction + brush + shampoo.' },
    { step: 3, title: 'Navigate + OTP', description: 'Location + OTP.' },
    { step: 4, title: 'Fabric ID', description: 'Carpet type check.' },
    { step: 5, title: 'Execute', description: 'SOP.' },
    { step: 6, title: 'Photos', description: 'Before/after.' },
    { step: 7, title: 'Sign-off', description: 'Customer approval.' },
    { step: 8, title: 'Payment', description: 'Payment.' },
  ],
  job_delivery: ['Before/after photos','Fabric test proof','Extraction proof','Customer sign-off'],
  customer_experience: ['Deep extraction demo','4-6 hours drying','Allergen removal','5-day warranty'],
  quality_checkpoints: ['Dry vacuum done','Extraction water visible','No over-wetting','Odour removed'],
  why_choose_us: ['Hot-water extraction','Pile & backing safe','No over-wetting','Allergen removal'],
  after_service_care: ['6-8 hours use na karein','Fan ON','Furniture 24 hours baad'],
  customer_faqs: [
    { question: 'Drying time?', answer: '4-6 hours.' },
    { question: 'Stains?', answer: '90%+ hatenge.' },
    { question: 'Pet odour?', answer: 'Basic included, deep treatment optional.' },
    { question: 'Kitna time?', answer: '50 sqft: 45 min.' },
    { question: 'Under-carpet?', answer: 'Not included.' },
  ],
  equipment: ['Vacuum','Agitation brush','Extraction machine','Air mover','Weighted brush'],
  chemicals: ['Carpet shampoo','Pre-spray','Spot lifter','Defoamer','Low-residue shampoo'],
  safety_notes: ['Pile + backing check','Colour-fastness test','Over-wetting avoid','Drying 4-6 hours'],
  duration_tiers: [
    { label: 'Up to 50 sqft', duration_min: 45 },
    { label: '51-100 sqft', duration_min: 90 },
    { label: '101-200 sqft', duration_min: 150 },
  ],
  pricing_tiers: [
    { label: 'Up to 50 sqft', min_quantity: 1, max_quantity: 50, unit: 'SQFT', price_paise: 79900, duration_min: 45 },
    { label: '51-100 sqft', min_quantity: 51, max_quantity: 100, unit: 'SQFT', price_paise: 139900, duration_min: 90 },
    { label: '101-200 sqft', min_quantity: 101, max_quantity: 200, unit: 'SQFT', price_paise: 249900, duration_min: 150 },
  ],
  pricing_mode: 'PER_SQFT',
  primary_unit: 'SQFT',
  typical_duration_min: 90,
  minimum_order_value_paise: 79900,
  risk_class: 'NORMAL',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: false,
  recommended_crew_min: 1,
  recommended_crew_max: 2,
  buffer_min: 30,
  recommended_frequency: 'Every 6-12 months',
  suitable_for: ['Wool carpet','Nylon','Polyester','Office carpet'],
  popular_combos: ['Carpet + Sofa','Carpet + Home Deep'],
  tags: ['extraction-machine','allergen-removal'],
  warranty_days: 5,
  rating: 4.5,
  rating_count: 892,
  booking_count: 4210,
  is_featured: false,
  display_order: 5,
  cancellation_policy: 'Free cancellation 4 hours before.',
  rescheduling_policy: 'Free rescheduling 2 hours before.',
  packages: [
    {
      package_code: 'PKG-CP-50',
      label: 'Small Carpet (up to 50 sqft)',
      short_description: 'Small carpet ya runner ka deep extraction cleaning.',
      room_breakdown: [
        { room: 'Carpet', tasks: ['Vacuum','Patch test','Pre-spray','Brush agitation','Hot-water extraction','Drying'], time_min: 45 },
      ],
      inclusions: ['45 min','1 staff','Extraction','All chemicals'],
      exclusions: ['Permanent stains','Repair','Under-carpet'],
      duration_min: 45,
      crew_size: 1,
      price_paise: 79900,
      recommended_for: 'Small rugs, door mats',
      sample_tasks_count: 8,
    },
    {
      package_code: 'PKG-CP-100',
      label: 'Medium Carpet (51-100 sqft)',
      short_description: 'Medium size carpet / 2 small rugs.',
      room_breakdown: [
        { room: 'Carpet(s)', tasks: ['Vacuum','Patch test','Pre-spray','Agitation','Extraction','Drying'], time_min: 75 },
        { room: 'Final', tasks: ['Check + sign-off'], time_min: 15 },
      ],
      inclusions: ['90 min','1-2 staff','Full extraction','All chemicals'],
      exclusions: ['Permanent stains','Repair'],
      duration_min: 90,
      crew_size: 1,
      price_paise: 139900,
      recommended_for: 'Bedroom carpet',
      sample_tasks_count: 12,
    },
    {
      package_code: 'PKG-CP-200',
      label: 'Large Carpet (101-200 sqft)',
      short_description: 'Large carpet / living room wall-to-wall.',
      room_breakdown: [
        { room: 'Large Carpet', tasks: ['Deep vacuum','Fabric test','Pre-spray','Agitation brush','Extraction','Deodoriser','Drying'], time_min: 130 },
        { room: 'Final', tasks: ['Inspection + sign-off'], time_min: 20 },
      ],
      inclusions: ['150 min','2 staff','Full extraction','Deodoriser'],
      exclusions: ['Permanent stains','Repair'],
      duration_min: 150,
      crew_size: 2,
      price_paise: 249900,
      recommended_for: 'Living room carpet',
      sample_tasks_count: 18,
    },
  ],
};

/* ============================================================
   CATEGORY 6: MATTRESS CLEANING
   ============================================================ */
const CATEGORY_6_MATTRESS: CategoryDefinition = {
  slug: 'mattress-cleaning',
  name: 'Mattress Cleaning',
  price_display_text: 'Starting from ₹699',
  job_description: 'Dust removal, stain treatment, aur sanitization. UV-C sterilization optional.',
  long_description: 'Mattress me dust mites, bacteria hote hain jo neend aur health ko affect karte hain. Vacuum, spot treatment, shampoo aur UV-C sterilizer se deep clean. Aapko milega — dust-mite free, fresh smelling, sanitized mattress.',
  inclusions: ['Dry vacuuming all sides','Spot treatment','Upholstery shampoo','Deodoriser','UV-C sterilization (optional)','Anti-fungal treatment','Dust mite removal'],
  exclusions: ['Mattress repair','Permanent stains','Flipping/moving','Bed frame cleaning','Pillow/duvet (extra)'],
  features: ['UV-C sterilization','Dust mite removal','Anti-fungal','Fabric-safe','Deodoriser'],
  service_process: [
    { step: 1, title: 'Inspection', description: 'Mattress type + stains.', duration_min: 5 },
    { step: 2, title: 'Vacuum', description: 'All sides deep vacuum.', duration_min: 15 },
    { step: 3, title: 'Spot treatment', description: 'Stain spots.', duration_min: 10 },
    { step: 4, title: 'Shampoo', description: 'Fabric-safe scrub.', duration_min: 15 },
    { step: 5, title: 'UV-C', description: 'Optional UV-C.', duration_min: 10 },
    { step: 6, title: 'Anti-fungal', description: 'Spray.', duration_min: 5 },
    { step: 7, title: 'Dry', description: '4-6 hours.', duration_min: 5 },
  ],
  partner_workflow: [
    { step: 1, title: 'Accept', description: 'Job.' },
    { step: 2, title: 'Kit Check', description: 'Vacuum + UV-C.' },
    { step: 3, title: 'Navigate + OTP', description: 'Location + OTP.' },
    { step: 4, title: 'Execute', description: 'SOP.' },
    { step: 5, title: 'Photos', description: 'Before/after.' },
    { step: 6, title: 'Sign-off', description: 'Approval.' },
    { step: 7, title: 'Payment', description: 'Payment.' },
  ],
  job_delivery: ['Before/after photos','UV-C proof','Dust mite removal proof','Customer sign-off'],
  customer_experience: ['UV-C demo','Fresh smell','Dust-mite free','3-day warranty'],
  quality_checkpoints: ['Vacuum complete','Stains treated','UV-C used','Deodoriser applied','No dampness'],
  why_choose_us: ['UV-C sterilization','Dust mite removal','Anti-fungal','Fabric-safe'],
  after_service_care: ['4-6 hours use na karein','Dhoop me na rakhein','Ventilation zaroori','Weekly vacuum'],
  customer_faqs: [
    { question: 'UV-C kya hai?', answer: '99.9% bacteria kill light.' },
    { question: 'Kitna time?', answer: 'Single: 45 min.' },
    { question: 'Wet hoga?', answer: 'Low moisture, 4-6 hrs dry.' },
    { question: 'Pillow?', answer: 'Optional add-on.' },
    { question: 'Dust mites?', answer: '99% removal.' },
  ],
  equipment: ['Upholstery vacuum','UV-C sterilizer','Soft brush','Microfiber cloths'],
  chemicals: ['Upholstery shampoo','Deodoriser','Anti-fungal treatment'],
  safety_notes: ['Fabric ID','UV-C safety — aankh band','Drying 4-6 hours','Residue avoid'],
  duration_tiers: [
    { label: 'Single', duration_min: 45 },
    { label: 'Double', duration_min: 60 },
    { label: 'King', duration_min: 75 },
  ],
  pricing_tiers: [
    { label: 'Single Mattress', min_quantity: 1, max_quantity: 1, unit: 'MATTRESS', price_paise: 69900, duration_min: 45 },
    { label: 'Double Mattress', min_quantity: 1, max_quantity: 1, unit: 'MATTRESS', price_paise: 89900, duration_min: 60 },
    { label: 'King Mattress', min_quantity: 1, max_quantity: 1, unit: 'MATTRESS', price_paise: 109900, duration_min: 75 },
  ],
  pricing_mode: 'PER_UNIT',
  primary_unit: 'MATTRESS',
  typical_duration_min: 60,
  minimum_order_value_paise: 69900,
  risk_class: 'NORMAL',
  skill_required: 'BEGINNER',
  requires_practical: false,
  requires_certificate: false,
  recommended_crew_min: 1,
  recommended_crew_max: 1,
  buffer_min: 15,
  recommended_frequency: 'Every 3-6 months',
  suitable_for: ['Single','Double','King','Baby mattress'],
  popular_combos: ['Mattress + Sofa'],
  tags: ['uv-c','dust-mite-removal'],
  warranty_days: 3,
  rating: 4.6,
  rating_count: 1246,
  booking_count: 5680,
  is_featured: false,
  display_order: 6,
  cancellation_policy: 'Free cancellation 2 hours before.',
  rescheduling_policy: 'Free rescheduling 1 hour before.',
  packages: [
    {
      package_code: 'PKG-MC-S',
      label: 'Single Mattress',
      short_description: 'Single size mattress ka complete deep clean with UV-C.',
      room_breakdown: [
        { room: 'Mattress', tasks: ['Both sides vacuum','Spot treatment','Upholstery shampoo','UV-C sterilization','Anti-fungal spray','Drying'], time_min: 45 },
      ],
      inclusions: ['45 min','1 staff','UV-C','Anti-fungal','Deodoriser'],
      exclusions: ['Repair','Permanent stains','Pillow'],
      duration_min: 45,
      crew_size: 1,
      price_paise: 69900,
      recommended_for: 'Kids / single bed',
      sample_tasks_count: 10,
    },
    {
      package_code: 'PKG-MC-D',
      label: 'Double Mattress',
      short_description: 'Double size mattress deep clean + UV-C sterilization.',
      room_breakdown: [
        { room: 'Mattress', tasks: ['Deep vacuum','Spot treatment','Shampoo scrub','UV-C','Anti-fungal','Deodoriser','Drying'], time_min: 60 },
      ],
      inclusions: ['60 min','1 staff','UV-C','Full sanitization'],
      exclusions: ['Repair','Permanent stains','Pillow'],
      duration_min: 60,
      crew_size: 1,
      price_paise: 89900,
      recommended_for: 'Couple / double bed',
      sample_tasks_count: 12,
    },
    {
      package_code: 'PKG-MC-K',
      label: 'King Mattress',
      short_description: 'King size mattress ka complete deep clean + UV-C.',
      room_breakdown: [
        { room: 'Mattress', tasks: ['Deep vacuum','Spot treatment','Shampoo','UV-C','Anti-fungal','Deodoriser','Drying'], time_min: 75 },
      ],
      inclusions: ['75 min','1 staff','UV-C','Full sanitization'],
      exclusions: ['Repair','Permanent stains','Pillow'],
      duration_min: 75,
      crew_size: 1,
      price_paise: 109900,
      recommended_for: 'Master bedroom king bed',
      sample_tasks_count: 14,
    },
  ],
};

/* ============================================================
   CATEGORY 7: WATER TANK CLEANING
   ============================================================ */
const CATEGORY_7_WATER_TANK: CategoryDefinition = {
  slug: 'water-tank-cleaning',
  name: 'Water Tank Cleaning',
  price_display_text: 'Starting from ₹999',
  job_description: 'Food-grade chlorine cleaning with proper flush. Entry safety harness included.',
  long_description: 'Water tank me mud, algae, bacteria hote hain jo paani ko unsafe banate hain. High-pressure washer + food-grade chlorine se complete clean + sanitize. Entry safety harness included.',
  inclusions: ['Tank emptying','High-pressure washer','Brush cleaning','Mud removal','Food-grade chlorine treatment','Final flush','Entry safety harness'],
  exclusions: ['Pipeline repair','Masonry work','Outer surface cleaning','Tank repair/waterproofing','Water pump repair'],
  features: ['Food-grade chlorine','High-pressure washer','Safety harness','100% flush','Bacteria-free'],
  service_process: [
    { step: 1, title: 'Inspection', description: 'Size + condition.', duration_min: 10 },
    { step: 2, title: 'Empty', description: 'Drain water.', duration_min: 15 },
    { step: 3, title: 'Mud removal', description: 'Bottom mud.', duration_min: 15 },
    { step: 4, title: 'Pressure wash', description: 'Walls + corners.', duration_min: 20 },
    { step: 5, title: 'Brush scrub', description: 'Stubborn spots.', duration_min: 15 },
    { step: 6, title: 'Chlorine', description: 'Food-grade spray.', duration_min: 10 },
    { step: 7, title: 'Flush', description: 'Fresh water flush.', duration_min: 15 },
  ],
  partner_workflow: [
    { step: 1, title: 'Accept', description: 'Job.' },
    { step: 2, title: 'Kit + Harness', description: 'PPE + harness check.' },
    { step: 3, title: 'Navigate', description: 'Location.' },
    { step: 4, title: 'Safety Setup', description: 'Harness + ventilation.' },
    { step: 5, title: 'Execute', description: 'SOP with safety.' },
    { step: 6, title: 'Photos', description: 'Before/after.' },
    { step: 7, title: 'Sign-off', description: 'Customer approval.' },
    { step: 8, title: 'Payment', description: 'Payment.' },
  ],
  job_delivery: ['Before/after photos','Safety harness proof','Chlorine usage log','Customer sign-off'],
  customer_experience: ['Safety-first approach','Certified operators','100% flush','30-day warranty'],
  quality_checkpoints: ['Tank empty','Mud removed','Pressure washed','Chlorine applied','Full flush','PH check'],
  why_choose_us: ['Food-grade chlorine','High-pressure washer','Safety harness','Certified operators'],
  after_service_care: ['Pehla 5 min drain','24 hours cover','Monthly check','6 months next'],
  customer_faqs: [
    { question: 'Paani kab use?', answer: 'Final flush ke baad. Pehla 5 min drain.' },
    { question: 'Chlorine safe?', answer: 'Haan, food-grade.' },
    { question: 'Time?', answer: '1000L: 60 min.' },
    { question: 'Safety?', answer: 'Harness ke saath.' },
    { question: 'Paani test?', answer: 'Basic pH included.' },
  ],
  equipment: ['Tank brush','Telescopic brush','High-pressure washer','Full PPE kit','Safety harness'],
  chemicals: ['Food-grade chlorine','Municipal approved chlorine'],
  safety_notes: ['Food-grade only','Harness zaroori','Ventilation','Flush 100%'],
  duration_tiers: [
    { label: 'Up to 1000L', duration_min: 60 },
    { label: '1001-2000L', duration_min: 90 },
    { label: '2001-5000L', duration_min: 120 },
    { label: '5001-8000L', duration_min: 180 },
  ],
  pricing_tiers: [
    { label: 'Up to 1000L', min_quantity: 1, max_quantity: 1000, unit: 'LITRE', price_paise: 99900, duration_min: 60 },
    { label: '1001-2000L', min_quantity: 1001, max_quantity: 2000, unit: 'LITRE', price_paise: 149900, duration_min: 90 },
    { label: '2001-5000L', min_quantity: 2001, max_quantity: 5000, unit: 'LITRE', price_paise: 219900, duration_min: 120 },
    { label: '5001-8000L', min_quantity: 5001, max_quantity: 8000, unit: 'LITRE', price_paise: 299900, duration_min: 180 },
  ],
  pricing_mode: 'PER_UNIT',
  primary_unit: 'LITRE',
  typical_duration_min: 120,
  minimum_order_value_paise: 99900,
  risk_class: 'ELEVATED',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: true,
  recommended_crew_min: 2,
  recommended_crew_max: 3,
  buffer_min: 30,
  recommended_frequency: 'Every 6 months',
  suitable_for: ['Overhead tank','Underground tank','Society tank','Commercial'],
  popular_combos: ['Water Tank + Bathroom'],
  tags: ['food-grade','safety-harness','certified'],
  warranty_days: 30,
  rating: 4.5,
  rating_count: 428,
  booking_count: 1840,
  is_featured: false,
  display_order: 7,
  cancellation_policy: 'Free cancellation 6 hours before.',
  rescheduling_policy: 'Free rescheduling 4 hours before.',
  packages: [
    {
      package_code: 'PKG-WT-1000',
      label: 'Small Tank (up to 1000L)',
      short_description: 'Small water tank ka complete food-grade clean.',
      room_breakdown: [
        { room: 'Tank', tasks: ['Empty tank','Mud removal','High-pressure wash','Brush scrub','Food-grade chlorine','Final flush'], time_min: 60 },
      ],
      inclusions: ['60 min','2 staff','Safety harness','Food-grade chlorine'],
      exclusions: ['Pipeline repair','Outer surface','Masonry'],
      duration_min: 60,
      crew_size: 2,
      price_paise: 99900,
      recommended_for: '1-2BHK overhead tank',
      sample_tasks_count: 8,
    },
    {
      package_code: 'PKG-WT-2000',
      label: 'Medium Tank (1001-2000L)',
      short_description: 'Medium tank complete food-grade clean.',
      room_breakdown: [
        { room: 'Tank', tasks: ['Empty','Mud removal','Pressure wash','Brush scrub','Chlorine','Flush'], time_min: 90 },
      ],
      inclusions: ['90 min','2 staff','Harness','Chlorine'],
      exclusions: ['Repair','Masonry'],
      duration_min: 90,
      crew_size: 2,
      price_paise: 149900,
      recommended_for: '3BHK tank',
      sample_tasks_count: 10,
    },
    {
      package_code: 'PKG-WT-5000',
      label: 'Large Tank (2001-5000L)',
      short_description: 'Large tank / commercial tank clean.',
      room_breakdown: [
        { room: 'Tank', tasks: ['Full empty','Deep mud removal','High-pressure wash','Multi-brush scrub','Chlorine treatment','Full flush'], time_min: 120 },
      ],
      inclusions: ['120 min','2-3 staff','Harness','Chlorine','pH check'],
      exclusions: ['Repair','Masonry'],
      duration_min: 120,
      crew_size: 3,
      price_paise: 219900,
      recommended_for: 'Large family / small society',
      sample_tasks_count: 14,
    },
    {
      package_code: 'PKG-WT-8000',
      label: 'Extra Large Tank (5001-8000L)',
      short_description: 'Society / commercial grade tank cleaning.',
      room_breakdown: [
        { room: 'Tank', tasks: ['Full empty','Mud removal','High-pressure multi-pass','Brush scrub','Chlorine treatment','Full flush','pH test'], time_min: 180 },
      ],
      inclusions: ['180 min','3 staff','Harness','Chlorine','pH check'],
      exclusions: ['Repair','Masonry','Pipeline'],
      duration_min: 180,
      crew_size: 3,
      price_paise: 299900,
      recommended_for: 'Society / commercial building',
      sample_tasks_count: 18,
    },
  ],
};

/* ============================================================
   CATEGORY 8: OFFICE & COMMERCIAL CLEANING
   ============================================================ */
const CATEGORY_8_OFFICE: CategoryDefinition = {
  slug: 'office-cleaning',
  name: 'Office & Commercial Cleaning',
  price_display_text: 'Starting from ₹2,999',
  job_description: 'Offices, hotels, shops, restaurants, PGs. Complete sanitization of floors, furniture, washrooms, kitchens.',
  long_description: 'Commercial space ke liye complete deep cleaning — offices, hotels, shops, restaurants aur PGs sabke liye. Commercial-grade equipment, trained crew, GST invoice available.',
  inclusions: ['All rooms deep clean','Bathrooms deep clean','Kitchen & balcony','Ceiling dusting','Fans / AC dusting','Walls dusting','Window + channel','Curtain, sofa, office chair vacuuming','Glass cleaning','Wooden furniture','Floor scrubbing'],
  exclusions: ['Kitchen cabinet interiors','Appliances','Furniture interiors, chandelier, terrace','Utensils, objects removal','Carpet shampooing (extra)','Wet wall/ceiling'],
  features: ['Commercial-grade equipment','Trained crew','Minimal disruption','After-hours','Insured team','GST invoice'],
  service_process: [
    { step: 1, title: 'Pre-inspection', description: 'Site walkthrough.', duration_min: 20 },
    { step: 2, title: 'Ceiling & AC', description: 'Dusting + AC.', duration_min: 40 },
    { step: 3, title: 'Furniture & glass', description: 'Polish + glass.', duration_min: 60 },
    { step: 4, title: 'Washrooms', description: 'Deep cleaning.', duration_min: 40 },
    { step: 5, title: 'Kitchen / Pantry', description: 'Deep clean.', duration_min: 40 },
    { step: 6, title: 'Floor scrub', description: 'Commercial scrubber.', duration_min: 60 },
    { step: 7, title: 'Final check', description: 'Facility manager.', duration_min: 20 },
  ],
  partner_workflow: [
    { step: 1, title: 'Accept', description: 'Job.' },
    { step: 2, title: 'Site Brief', description: 'Manager brief.' },
    { step: 3, title: 'Kit Setup', description: 'Commercial equipment.' },
    { step: 4, title: 'Execute', description: 'SOP.' },
    { step: 5, title: 'Photos', description: 'Before/after.' },
    { step: 6, title: 'Sign-off', description: 'Manager.' },
    { step: 7, title: 'Invoice', description: 'GST invoice.' },
    { step: 8, title: 'Payment', description: 'Payment + AMC.' },
  ],
  job_delivery: ['Commercial grade cleaning','Before/after photos','GST invoice','Facility manager sign-off','AMC proposal'],
  customer_experience: ['Minimal disruption','After-hours option','GST invoice','3-day warranty'],
  quality_checkpoints: ['All rooms cleaned','Washrooms disinfected','Kitchen degreased','Floor scrubbed','Glass cleaned'],
  why_choose_us: ['Commercial grade cleaning equipment','Experienced & police verified staff','Flexible after-hours timing','GST compliant billing & AMC packages'],
  after_service_care: ['Ensure proper ventilation for 2 hours','Inspect all floor areas before lockup'],
  customer_faqs: [
    { question: 'Do you offer after-office hours cleaning?', answer: 'Yes, we provide late evening and weekend slots to ensure zero disruption to operations.' },
    { question: 'Is GST billing provided?', answer: 'Yes, full corporate GST invoice is issued for every service.' }
  ],
  equipment: ['Single-disc floor scrubber','Industrial wet & dry vacuum','High reach dusting poles','Glass squeegees'],
  chemicals: ['Hospital-grade neutral floor cleaner','Ammonia-free glass cleaner','Degreaser for pantry'],
  safety_notes: ['Safety cones displayed on wet floors','All staff wear identifiable uniforms & ID cards'],
  duration_tiers: [
    { label: 'Up to 1000 sq ft', duration_min: 180 },
    { label: '1001-3000 sq ft', duration_min: 300 },
    { label: '3001-5000 sq ft', duration_min: 480 },
  ],
  pricing_tiers: [
    { label: 'Up to 1000 sq ft', min_quantity: 1, max_quantity: 1000, unit: 'SQFT', price_paise: 299900, duration_min: 180 },
    { label: '1001-3000 sq ft', min_quantity: 1001, max_quantity: 3000, unit: 'SQFT', price_paise: 599900, duration_min: 300 },
  ],
  pricing_mode: 'PER_SQFT',
  primary_unit: 'SQFT',
  typical_duration_min: 240,
  minimum_order_value_paise: 299900,
  risk_class: 'NORMAL',
  skill_required: 'INTERMEDIATE',
  requires_practical: true,
  requires_certificate: true,
  recommended_crew_min: 2,
  recommended_crew_max: 5,
  buffer_min: 30,
  recommended_frequency: 'Every month or quarter',
  suitable_for: ['Offices','Retail showrooms','Co-working spaces','Clinics','Restaurants'],
  popular_combos: ['Office Floor Scrubbing + Chair Shampooing'],
  tags: ['commercial','office','floor-scrubber','gst-invoice'],
  warranty_days: 7,
  rating: 4.88,
  rating_count: 312,
  booking_count: 1450,
  is_featured: false,
  display_order: 8,
  cancellation_policy: 'Free cancellation 12 hours before schedule.',
  rescheduling_policy: 'Free rescheduling up to 6 hours before schedule.',
  packages: [
    {
      package_code: 'PKG-OFFICE-1000',
      label: 'Small Office (up to 1,000 sq ft)',
      short_description: 'Complete commercial cleaning for small offices & clinics.',
      room_breakdown: [
        { room: 'Workstations & Cabins', tasks: ['Dusting','Glass clean','Floor scrub'], time_min: 100 },
        { room: 'Restrooms & Pantry', tasks: ['Deep clean','Sanitize'], time_min: 80 }
      ],
      inclusions: ['Floor scrub','Workstation dust','Restrooms clean','Pantry degrease'],
      exclusions: ['Carpet injection extraction (optional add-on)','Server room interiors'],
      duration_min: 180,
      crew_size: 2,
      price_paise: 299900,
      recommended_for: 'Small offices, clinics, studios up to 1000 sq ft',
      sample_tasks_count: 12,
    }
  ]
};

export const MASTER_CATALOGUE_CATEGORIES: CategoryDefinition[] = [
  CATEGORY_1_HOME_DEEP,
  CATEGORY_2_KITCHEN,
  CATEGORY_3_BATHROOM,
  CATEGORY_4_SOFA,
  CATEGORY_5_CARPET,
  CATEGORY_6_MATTRESS,
  CATEGORY_7_WATER_TANK,
  CATEGORY_8_OFFICE,
];