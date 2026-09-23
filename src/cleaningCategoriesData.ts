export interface CleaningCategoryDetail {
  id: string;
  name: string;
  emoji: string;
  badge?: string;
  tagline: string;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  duration: string;
  bgColor: string;
  heroImage: string;
  beforeImage: string;
  afterImage: string;
  videoUrl: string;
  propertyUnitLabel: string;
  packages: {
    label: string;
    price: number;
    referencePrice: number;
    popular?: boolean;
    description: string;
  }[];
  addons: {
    id: string;
    name: string;
    price: number;
    description: string;
  }[];
  inclusions: string[];
  exclusions: string[];
  safety: string;
  cancellationPolicy: string;
  faqs: { q: string; a: string }[];
}

export const CLEANING_20_CATEGORIES: CleaningCategoryDetail[] = [
  {
    id: 'bathroom-cleaning',
    name: 'Bathroom Cleaning',
    emoji: '🛁',
    badge: 'MOST BOOKED',
    tagline: 'Intense tile descaling, hard water spot removal & chrome mirror buffing.',
    startingPrice: 349,
    rating: 4.88,
    reviewCount: 2350,
    duration: '45 - 90 mins',
    bgColor: '#dbeafe',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-bathroom-countertop-4712/1080p.mp4',
    propertyUnitLabel: 'Bathrooms',
    packages: [
      { label: '1 Bathroom', price: 349, referencePrice: 410, description: 'Single bathroom deep scrub, descaling & sanitization' },
      { label: '2 Bathrooms', price: 649, referencePrice: 765, popular: true, description: 'Master & guest bathrooms complete shine' },
      { label: '3 Bathrooms', price: 899, referencePrice: 1060, description: '3 bathrooms intensive scrub with acid-free Taski R9' },
      { label: '4+ Bathrooms', price: 1199, referencePrice: 1410, description: 'Villa or luxury duplex multi-bath descaling' }
    ],
    addons: [
      { id: 'add-exhaust-clean', name: 'Exhaust Fan Degrease', price: 149, description: 'Motor blades grease removal and wash' },
      { id: 'add-geyser-wipe', name: 'Geyser & Pipe Descaling', price: 99, description: 'Limescale removal from chrome pipes' },
      { id: 'add-grout-recolor', name: 'Floor Grout High-Pressure Steam', price: 249, description: 'Hospital-grade steam sanitation' }
    ],
    inclusions: ['Tiles, floor & wall scrubbing', 'Toilet pot, washbasin & taps descaling', 'Glass partition & mirror crystal shine', 'Acid-free Taski safe chemicals'],
    exclusions: ['Wall repainting', 'Plumbing valve replacement', 'Hard ceiling tile breakage repair'],
    safety: '100% Taski R1 & R9 non-hazardous Diversey chemicals. Experts equipped with N95 masks and rubber gloves.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot. 100% instant refund guaranteed.',
    faqs: [
      { q: 'Will the yellow hard-water stains on glass partitions go away?', a: 'Yes, our certified cleaners use specialized Diversey Taski R9 descaling agents and non-abrasive white pads to dissolve tough water scale.' },
      { q: 'Is it safe for marble and expensive fittings?', a: 'Strictly zero hydrochloric acid is used. We use pH-neutral, Jaguar and Grohe approved descalers.' }
    ]
  },
  {
    id: 'kitchen-cleaning',
    name: 'Kitchen Cleaning',
    emoji: '🍳',
    badge: 'POPULAR',
    tagline: 'Heavy grease & oil removal from chimney, slab, tiles & gas stove.',
    startingPrice: 599,
    rating: 4.85,
    reviewCount: 1820,
    duration: '60 - 120 mins',
    bgColor: '#fef3c7',
    heroImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-window-with-a-squeegee-5421/1080p.mp4',
    propertyUnitLabel: 'Kitchen Type',
    packages: [
      { label: 'Basic Kitchen', price: 599, referencePrice: 705, description: 'Counters, gas stove, sink & tile degrease' },
      { label: 'Deep Kitchen (Chimney + Cabinets)', price: 1199, referencePrice: 1410, popular: true, description: 'Includes baffle filter boil, cabinet exterior & exhaust' },
      { label: 'Modular Kitchen (Inside + Outside)', price: 1699, referencePrice: 2000, description: 'Complete shelf-by-shelf trolley & basket wash' }
    ],
    addons: [
      { id: 'add-fridge-interior', name: 'Refrigerator Deep Interior Clean', price: 299, description: 'Tray removal, hot steam wipe & anti-bacterial fogging' },
      { id: 'add-microwave-clean', name: 'Microwave/Oven Carbon Removal', price: 199, description: 'Baked oil dissolution and plate polish' }
    ],
    inclusions: ['Slab, granite counter & sink degreasing', 'Gas stove burners & knobs wipe', 'Wall backsplash tiles steam clean', 'Cabinets outer surface buffing'],
    exclusions: ['Utensil washing', 'Emptying loaded food jars unless requested', 'Pest extermination'],
    safety: 'Food-safe certified Ecolab and Diversey Suma degreasers. No toxic fumes.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [
      { q: 'Do you clean inside the chimney motor?', a: 'We perform deep filter boil-degreasing and suction hood degreasing. Motor electrical parts are wiped safely without water exposure.' }
    ]
  },
  {
    id: 'full-home-deep-cleaning',
    name: 'Full Home Deep Cleaning',
    emoji: '🏠',
    badge: 'BEST VALUE',
    tagline: 'Comprehensive 360° deep sanitizing, floor machine buffing & balcony wash.',
    startingPrice: 2199,
    rating: 4.94,
    reviewCount: 3100,
    duration: '4 - 7 hours',
    bgColor: '#e2f3e6',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Home Size',
    packages: [
      { label: '1 BHK', price: 2199, referencePrice: 2590, description: '1 Bedroom, Hall, Kitchen, 1 Bathroom & Balcony' },
      { label: '2 BHK', price: 2999, referencePrice: 3530, popular: true, description: '2 Bedrooms, Living, Kitchen, 2 Bathrooms & Balconies' },
      { label: '3 BHK', price: 3999, referencePrice: 4705, description: '3 Bedrooms, Hall, Dining, Kitchen & up to 3 Bathrooms' },
      { label: '4 BHK / Villa', price: 5199, referencePrice: 6115, description: '4+ Bedrooms, Large Living & Multiple Bathrooms' }
    ],
    addons: [
      { id: 'add-mattress-steam', name: '1 King Mattress Sanitization', price: 499, description: 'Anti-dust mite UV & extraction' },
      { id: 'add-balcony-pressure', name: 'Extra Balcony Power Scrub', price: 299, description: 'Floor scrub and glass railing shine' }
    ],
    inclusions: ['All rooms, ceiling fans, switches & doors', 'Kitchen degreasing & all bathrooms scrub', 'Machine floor buffing with German single-disc', 'Windows & balcony sliding tracks'],
    exclusions: ['Terrace / roof top wash', 'Wall repaint touchups'],
    safety: 'Team arrives with sanitized uniform, shoe covers, industrial Kärcher vacuums, and Diversey kits.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [
      { q: 'How many professionals will come?', a: 'Depending on BHK size, a team of 2 to 4 trained professionals with an expert team supervisor arrives.' }
    ]
  },
  {
    id: 'sofa-cleaning',
    name: 'Sofa Cleaning',
    emoji: '🛋️',
    badge: 'FAST SELLING',
    tagline: 'Injection-extraction fabric shampooing & leather conditioning.',
    startingPrice: 499,
    rating: 4.89,
    reviewCount: 2600,
    duration: '45 - 90 mins',
    bgColor: '#fde9d3',
    heroImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-vacuuming-a-sofa-5178/1080p.mp4',
    propertyUnitLabel: 'Seater Size',
    packages: [
      { label: '3-seater sofa', price: 499, referencePrice: 585, description: 'Dry vacuum, fabric shampoo & wet extraction' },
      { label: '5-seater sofa (3+1+1 or 3+2)', price: 799, referencePrice: 940, popular: true, description: 'Complete set deep shampoo & odor removal' },
      { label: 'L-shape / 6-seater sofa', price: 999, referencePrice: 1175, description: 'Sectional corners, cushions & base extraction' },
      { label: '7+ Seater / Recliner Set', price: 1299, referencePrice: 1530, description: 'Large living room luxury lounge set' }
    ],
    addons: [
      { id: 'add-cushion-wash', name: 'Throw Cushions (Pack of 5)', price: 199, description: 'Shampoo and sun-dry sanitization' },
      { id: 'add-leather-polish', name: 'Leather Wax & Conditioner', price: 299, description: 'Prevents leather cracking and brings matte glow' }
    ],
    inclusions: ['Dry high-power vacuuming', 'Foam shampoo & stain spotting', 'High-pressure wet extraction (removes 90% water)'],
    exclusions: ['Permanent dye bleed repair', 'Torn stitch restoration'],
    safety: 'pH-balanced fabric shampoo safe for silk, velvet, suede, and microfiber.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [
      { q: 'How long does the sofa take to dry?', a: 'Thanks to our high-suction German extraction machines, your sofa dries in about 2 to 3 hours under normal ceiling fans.' }
    ]
  },
  {
    id: 'carpet-cleaning',
    name: 'Carpet Cleaning',
    emoji: '🧶',
    tagline: 'High-lift shampoo wash, dust mite extraction & sanitization.',
    startingPrice: 399,
    rating: 4.86,
    reviewCount: 950,
    duration: '40 - 75 mins',
    bgColor: '#ede9fe',
    heroImage: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-vacuuming-a-sofa-5178/1080p.mp4',
    propertyUnitLabel: 'Carpet Area',
    packages: [
      { label: 'Small Rug (Up to 50 sq ft)', price: 399, referencePrice: 470, description: 'Living room center rug shampoo & dry' },
      { label: 'Medium Carpet (Up to 100 sq ft)', price: 699, referencePrice: 820, popular: true, description: 'Dining area or bedroom carpet wash' },
      { label: 'Large Carpet (Up to 250 sq ft)', price: 1299, referencePrice: 1530, description: 'Large hall wall-to-wall or Persian carpet' }
    ],
    addons: [
      { id: 'add-carpet-deodor', name: 'Anti-Bacterial Deodorizing Mist', price: 149, description: 'Long-lasting lavender fragrance' }
    ],
    inclusions: ['Rotary brush shampooing', 'Deep fiber stain extraction', 'Anti-mite moisture suction'],
    exclusions: ['Fringe thread re-weaving'],
    safety: 'Safe for wool, silk, and synthetic fiber rugs.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Do you take the carpet away?', a: 'No, we do it right in your home in under 60 minutes with minimal disruption.' }]
  },
  {
    id: 'mattress-cleaning',
    name: 'Mattress Cleaning',
    emoji: '🛏️',
    tagline: 'Dust-mite eradication, stain breakdown & UV sanitizing.',
    startingPrice: 449,
    rating: 4.87,
    reviewCount: 780,
    duration: '35 - 60 mins',
    bgColor: '#e0f2fe',
    heroImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-vacuuming-a-sofa-5178/1080p.mp4',
    propertyUnitLabel: 'Mattress Size',
    packages: [
      { label: 'Single Mattress', price: 449, referencePrice: 530, description: 'Kids or single bed vacuuming & shampoo' },
      { label: 'Double / Queen Mattress', price: 649, referencePrice: 765, popular: true, description: 'Both sides dust-mite suction & sanitizing' },
      { label: 'King Size Mattress', price: 799, referencePrice: 940, description: 'Deep anti-allergen extraction for master beds' }
    ],
    addons: [
      { id: 'add-pillow-sanitize', name: '2 Pillows UV Steam Clean', price: 149, description: 'De-odorizes and kills bacteria' }
    ],
    inclusions: ['HEPA vacuum for dead skin cells', 'Enzyme stain treatment', 'Hot moisture extraction'],
    exclusions: ['Old burn marks'],
    safety: 'Hypoallergenic solutions safe for toddlers and pets.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Does it eliminate bed bugs?', a: 'It extracts dust-mites and surface allergens. For live bug infestations, we recommend specialized heat treatment.' }]
  },
  {
    id: 'floor-cleaning',
    name: 'Floor Scrubbing & Polishing',
    emoji: '✨',
    tagline: 'Single-disc rotary scrubbing for marble, vitrified tiles & hardwood.',
    startingPrice: 699,
    rating: 4.91,
    reviewCount: 1120,
    duration: '60 - 150 mins',
    bgColor: '#f1f5f9',
    heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Floor Area',
    packages: [
      { label: 'Up to 500 sq ft', price: 699, referencePrice: 820, description: 'Living area or hallway single-disc rotary wash' },
      { label: 'Up to 1000 sq ft', price: 1199, referencePrice: 1410, popular: true, description: 'Complete 2 BHK floor scrubbing with neutral cleaner' },
      { label: 'Up to 2000 sq ft', price: 1999, referencePrice: 2350, description: 'Complete 3/4 BHK floor wash and mirror buffing' }
    ],
    addons: [
      { id: 'add-skirting-scrub', name: 'Base Skirting Detailed Hand Scrub', price: 199, description: 'Edge dust & cement mark removal' }
    ],
    inclusions: ['Rotary single-disc machine scrub', 'Grout line grime extraction', 'Microfiber mop drying'],
    exclusions: ['Diamond cutting / marble crystallization grinding'],
    safety: 'Neutral pH hospital-grade surfactant prevents marble corrosion.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Will scuff marks and yellow stains vanish?', a: 'Surface stains, construction dust, and grime are 100% removed.' }]
  },
  {
    id: 'window-cleaning',
    name: 'Window & Track Cleaning',
    emoji: '🪟',
    tagline: 'Streak-free crystal glass buffing and sliding track mud vacuuming.',
    startingPrice: 499,
    rating: 4.84,
    reviewCount: 640,
    duration: '45 - 90 mins',
    bgColor: '#f8fafc',
    heroImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-window-with-a-squeegee-5421/1080p.mp4',
    propertyUnitLabel: 'Windows Count',
    packages: [
      { label: 'Up to 5 Windows', price: 499, referencePrice: 585, description: 'Glass squeegee wash and track vacuuming' },
      { label: 'Up to 10 Windows', price: 899, referencePrice: 1060, popular: true, description: 'Complete 2/3 BHK apartment windows and meshes' },
      { label: 'Full Villa Windows (Up to 18)', price: 1499, referencePrice: 1765, description: 'Includes french windows and balcony glass' }
    ],
    addons: [
      { id: 'add-mesh-wash', name: 'Mosquito Mesh Pressure Wash (Pack of 4)', price: 199, description: 'Dust removal without tearing' }
    ],
    inclusions: ['Glass rubber squeegee buffing', 'Sliding channel narrow nozzle vacuuming', 'Frame borders wipe'],
    exclusions: ['Exterior facade rope rappelling beyond arm reach'],
    safety: 'Zero-drop safety harnesses for high-rise apartment windows.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Do you clean outside glass in high-rises?', a: 'We clean all accessible outer surfaces from inside sliding windows safely.' }]
  },
  {
    id: 'glass-cleaning',
    name: 'Glass Partition & Mirror Cleaning',
    emoji: '🪞',
    tagline: 'Chemical descaling for shower cubicles, vanity mirrors & glass tables.',
    startingPrice: 349,
    rating: 4.83,
    reviewCount: 420,
    duration: '30 - 60 mins',
    bgColor: '#e0f2fe',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-window-with-a-squeegee-5421/1080p.mp4',
    propertyUnitLabel: 'Glass Units',
    packages: [
      { label: 'Up to 2 Glass Partitions / Mirrors', price: 349, referencePrice: 410, description: 'Shower glass or large bathroom mirrors' },
      { label: 'Up to 5 Glass Partitions / Tables', price: 649, referencePrice: 765, popular: true, description: 'Balcony glass, dining table & bathroom cabins' }
    ],
    addons: [{ id: 'add-nano-coating', name: 'Hydrophobic Water-Repellent Coat', price: 299, description: 'Stops hard-water spots for up to 30 days' }],
    inclusions: ['Acid-free scale dissolve', 'Diversey Taski R3 glass cleaner', 'Streak-free microfiber dry'],
    exclusions: ['Cracked glass handling'],
    safety: 'Soft silicone squeegees prevent scratches.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Can you clean milky white deposits on shower glass?', a: 'Yes! That is hard water scale which Taski R9 effectively lifts.' }]
  },
  {
    id: 'door-cleaning',
    name: 'Door & Woodwork Polish Cleaning',
    emoji: '🚪',
    tagline: 'Dusting, finger mark removal & protective polish for wooden doors.',
    startingPrice: 299,
    rating: 4.81,
    reviewCount: 310,
    duration: '30 - 60 mins',
    bgColor: '#fef3c7',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-bathroom-countertop-4712/1080p.mp4',
    propertyUnitLabel: 'Doors Count',
    packages: [
      { label: 'Up to 4 Doors', price: 299, referencePrice: 350, description: 'Main entrance door + 3 room doors wipe' },
      { label: 'Up to 8 Doors', price: 549, referencePrice: 645, popular: true, description: 'All house doors, brass handles & hinges buffed' }
    ],
    addons: [{ id: 'add-beeswax', name: 'Pure Beeswax Nourish Coat', price: 249, description: 'Enriches dark mahogany and teak wood shine' }],
    inclusions: ['Dust removal from grooves', 'Handle & lock disinfection', 'Wood shine wipe'],
    exclusions: ['Carpenter hinge repairs'],
    safety: 'Wood-friendly non-moisture formulas.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Does it remove grease around door handles?', a: 'Yes, handles are sanitized with alcohol-free degreasing wipes.' }]
  },
  {
    id: 'move-in-cleaning',
    name: 'Move-In Deep Cleaning',
    emoji: '📦',
    tagline: 'Sterilized move-in readiness for newly leased or purchased homes.',
    startingPrice: 2299,
    rating: 4.95,
    reviewCount: 1450,
    duration: '4 - 8 hours',
    bgColor: '#e2f3e6',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Apartment Size',
    packages: [
      { label: '1 BHK Move-In', price: 2299, referencePrice: 2700, description: 'Sterilization of cupboards, kitchen & bathrooms' },
      { label: '2 BHK Move-In', price: 3199, referencePrice: 3760, popular: true, description: 'Complete empty home floor scrub, fans & balcony wash' },
      { label: '3 BHK Move-In', price: 4299, referencePrice: 5055, description: 'Complete deep hygiene sanitization before unpacking' }
    ],
    addons: [{ id: 'add-antibac-fog', name: 'Whole Home Anti-Viral Fogging', price: 499, description: 'Medical fogging reaches every corner' }],
    inclusions: ['Cupboards inside/outside wipe', 'Kitchen chimney & bathroom descaling', 'Machine floor buffing', 'Switchboards & fans'],
    exclusions: ['Unpacking boxes'],
    safety: 'Hospital grade sterilization before your family moves in.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Should I book this before or after moving furniture?', a: 'Best booked when the home is empty right before shifting your luggage.' }]
  },
  {
    id: 'move-out-cleaning',
    name: 'Move-Out / Tenant Handover Cleaning',
    emoji: '🚚',
    tagline: 'Get your full security deposit back with our rigorous inspection clean.',
    startingPrice: 2299,
    rating: 4.93,
    reviewCount: 980,
    duration: '4 - 7 hours',
    bgColor: '#ede9fe',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Flat Size',
    packages: [
      { label: '1 BHK Handover', price: 2299, referencePrice: 2700, description: 'Deep scrub so landlord signs off smoothly' },
      { label: '2 BHK Handover', price: 3199, referencePrice: 3760, popular: true, description: 'Removes all tenant grime, kitchen stains & bath scale' },
      { label: '3 BHK Handover', price: 4299, referencePrice: 5055, description: 'Detailed full apartment sign-off standard clean' }
    ],
    addons: [{ id: 'add-adhesive-remove', name: 'Wall Sticker & Tape Glue Removal', price: 249, description: 'Solves sticky residue without peeling paint' }],
    inclusions: ['Complete deep cleaning matching owner inspection criteria', 'Bathroom descaling', 'Kitchen degreasing', 'Floor buffing'],
    exclusions: ['Civil repair work'],
    safety: 'Fast 1-day turnaround for quick key handover.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Do you give an inspection report?', a: 'Yes, supervisor signs off a comprehensive checklist.' }]
  },
  {
    id: 'room-cleaning',
    name: 'Single Room / Bedroom Deep Cleaning',
    emoji: '🛏️',
    tagline: 'Targeted deep clean for individual bedrooms, study rooms or guest rooms.',
    startingPrice: 799,
    rating: 4.86,
    reviewCount: 510,
    duration: '60 - 90 mins',
    bgColor: '#fde9d3',
    heroImage: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-vacuuming-a-sofa-5178/1080p.mp4',
    propertyUnitLabel: 'Rooms',
    packages: [
      { label: '1 Bedroom Deep Clean', price: 799, referencePrice: 940, description: 'Fan, windows, under bed vacuum & wardrobe exterior' },
      { label: 'Master Bedroom + Attached Balcony', price: 1199, referencePrice: 1410, popular: true, description: 'Includes dressing mirror & balcony floor scrub' }
    ],
    addons: [{ id: 'add-under-bed', name: 'Behind Heavy Bed Shift & Vacuum', price: 149, description: 'Removes years of trapped dust' }],
    inclusions: ['Floor scrub', 'Cobweb cleaning', 'Fan & switchboard shine', 'Window tracks'],
    exclusions: ['Curtain dry cleaning'],
    safety: 'Cleaners use protective socks over shoes.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Can I stay in the house while you clean the room?', a: 'Absolutely, our silent vacuums operate quietly.' }]
  },
  {
    id: 'balcony-cleaning',
    name: 'Balcony & Utility Area Cleaning',
    emoji: '🌿',
    tagline: 'Water pressure scrub, bird dropping removal & railing shine.',
    startingPrice: 399,
    rating: 4.88,
    reviewCount: 890,
    duration: '40 - 60 mins',
    bgColor: '#dbeafe',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Balcony Count',
    packages: [
      { label: '1 Balcony', price: 399, referencePrice: 470, description: 'High-pressure water scrub & drain unclog' },
      { label: '2 Balconies', price: 699, referencePrice: 820, popular: true, description: 'Front & kitchen utility balcony wash' },
      { label: '3 Balconies', price: 949, referencePrice: 1115, description: 'Complete outdoor floor & glass railings buff' }
    ],
    addons: [{ id: 'add-bird-disinfect', name: 'Bird Mesh Anti-Fungal Treatment', price: 199, description: 'Kills pigeon mites and dries sterile' }],
    inclusions: ['Floor power scrub', 'Railing wipe', 'Glass panels squeegee', 'Drain water clearing'],
    exclusions: ['Exterior building walls'],
    safety: 'Slip-resistant footwear and controlled water flow to prevent neighbor dripping.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Will the water drop to the lower floor flat?', a: 'No, our staff uses wet extraction vacuums to suck dirty water instantly.' }]
  },
  {
    id: 'water-tank-cleaning',
    name: 'Water Tank Exterior & Interior Cleaning',
    emoji: '💧',
    tagline: 'Sludge suction, high-pressure jet scrub & UV disinfection.',
    startingPrice: 699,
    rating: 4.91,
    reviewCount: 620,
    duration: '60 - 90 mins',
    bgColor: '#cffafe',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-bathroom-countertop-4712/1080p.mp4',
    propertyUnitLabel: 'Tank Capacity',
    packages: [
      { label: 'Up to 500 Liters', price: 699, referencePrice: 820, description: 'Overhead Sintex or poly plastic tank' },
      { label: 'Up to 1000 Liters', price: 999, referencePrice: 1175, popular: true, description: 'Complete sludge drain, scrub & chlorine sterilize' },
      { label: 'Up to 2000 Liters / Underground', price: 1699, referencePrice: 2000, description: 'Large sump or dual tank disinfection' }
    ],
    addons: [{ id: 'add-uv-tube', name: 'Submersible UV Sanitizer Run', price: 299, description: '15-min microbial sterilization' }],
    inclusions: ['Sludge removal using pump', 'Rotary jet scrub of inner walls', 'Antibacterial potassium permanganate rinse'],
    exclusions: ['Plumbing motor repair'],
    safety: 'Safe food-grade rinse agents. 100% safe drinking water guarantee.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'How often should tanks be cleaned?', a: 'Every 6 months to prevent algae, sediment, and bacteria buildup.' }]
  },
  {
    id: 'appliance-cleaning',
    name: 'Appliance Exterior Cleaning',
    emoji: '🔌',
    tagline: 'Exterior deep steam degreasing for fridge, microwave, OTG & chimney.',
    startingPrice: 499,
    rating: 4.82,
    reviewCount: 390,
    duration: '45 - 75 mins',
    bgColor: '#f1f5f9',
    heroImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-bathroom-countertop-4712/1080p.mp4',
    propertyUnitLabel: 'Appliance Bundle',
    packages: [
      { label: '2 Appliances (Fridge + Microwave Exterior)', price: 499, referencePrice: 585, description: 'Stainless steel buffing and degreasing' },
      { label: '3 Appliances (Chimney + Fridge + Oven)', price: 799, referencePrice: 940, popular: true, description: 'Outer oil breakdown and gloss shine' },
      { label: 'All Kitchen Appliances (Up to 5)', price: 1199, referencePrice: 1410, description: 'Dishwasher, air fryer, fridge, microwave, stove' }
    ],
    addons: [{ id: 'add-fridge-coils', name: 'Back Condenser Coil Vacuum', price: 199, description: 'Improves cooling efficiency & saves electricity' }],
    inclusions: ['Degreasing hoods', 'Handle sanitation', 'Streak-free stainless steel polish'],
    exclusions: ['Internal electronic motherboard repair'],
    safety: 'Moisture-safe techniques ensure zero short-circuit risk.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Is this safe for touchscreens?', a: 'Yes, we use electronic-safe specialized anti-static wipes.' }]
  },
  {
    id: 'commercial-cleaning',
    name: 'Commercial & Office Deep Cleaning',
    emoji: '🏢',
    tagline: 'Hospital-grade sanitization for tech parks, clinics, co-working & retail.',
    startingPrice: 2999,
    rating: 4.96,
    reviewCount: 540,
    duration: '4 - 10 hours',
    bgColor: '#dbeafe',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Office Area',
    packages: [
      { label: 'Small Office (Up to 1000 sq ft)', price: 2999, referencePrice: 3530, description: 'Desks, washrooms, pantry & machine floor scrub' },
      { label: 'Mid-Sized Office (Up to 2500 sq ft)', price: 5499, referencePrice: 6470, popular: true, description: 'Conference rooms, chair shampooing & glass partitions' },
      { label: 'Corporate Space (Up to 5000 sq ft)', price: 9999, referencePrice: 11760, description: 'Large dedicated industrial cleaning crew' }
    ],
    addons: [{ id: 'add-chair-shampoo', name: 'Office Chairs Shampoo (Pack of 10)', price: 999, description: 'Anti-stain injection extraction' }],
    inclusions: ['Workstation dusting & cable wipe', 'Pantry deep scrub & washroom sanitize', 'Floor single-disc rotary machine buff'],
    exclusions: ['Confidential server rack internals'],
    safety: 'GST invoice provided. Police-verified industrial personnel.',
    cancellationPolicy: 'Free cancellation up to 4 hours before scheduled slot.',
    faqs: [{ q: 'Can you work on weekends or nights?', a: 'Yes, night and Sunday slots are available on request.' }]
  },
  {
    id: 'recurring-cleaning',
    name: 'Recurring Cleaning Subscription',
    emoji: '🔄',
    tagline: 'Scheduled bi-weekly or monthly deep hygiene maintenance at VIP rates.',
    startingPrice: 1999,
    rating: 4.97,
    reviewCount: 1800,
    duration: 'Monthly Schedule',
    bgColor: '#e2f3e6',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-the-floor-with-a-mop-4710/1080p.mp4',
    propertyUnitLabel: 'Plan Frequency',
    packages: [
      { label: 'Bi-Weekly Sanitization (2 Visits/Month)', price: 1999, referencePrice: 2350, description: 'Bathrooms, kitchen degrease & floor machine clean' },
      { label: 'Weekly Deep Care (4 Visits/Month)', price: 3499, referencePrice: 4115, popular: true, description: 'Full pristine home care with same dedicated specialist' }
    ],
    addons: [{ id: 'add-vip-priority', name: 'VIP Weekend Slot Reservation', price: 199, description: 'Guaranteed preferred Sunday morning timing' }],
    inclusions: ['Same dedicated 5-star professional', 'All chemicals & machines included', 'Free reschedule anytime'],
    exclusions: ['Daily maid cooking/dusting'],
    safety: 'Consistent trusted team for maximum family security.',
    cancellationPolicy: 'Pause or cancel anytime with prorated refund.',
    faqs: [{ q: 'Can I change my visit date?', a: 'Yes, 1-click date reschedule inside your customer portal.' }]
  },
  {
    id: 'special-cleaning',
    name: 'Post-Construction & Festive Deep Clean',
    emoji: '🎉',
    tagline: 'Paint mark scraping, cement dust extraction & Diwali/Eid deep shine.',
    startingPrice: 2899,
    rating: 4.92,
    reviewCount: 880,
    duration: '4 - 8 hours',
    bgColor: '#fde9d3',
    heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-window-with-a-squeegee-5421/1080p.mp4',
    propertyUnitLabel: 'Scope',
    packages: [
      { label: 'Festive Ready (Up to 2 BHK)', price: 2899, referencePrice: 3410, description: 'Brass polishing, chandelier dusting & festive sparkle' },
      { label: 'Post-Renovation Dust Scrub (2-3 BHK)', price: 3999, referencePrice: 4705, popular: true, description: 'Paint splatter razor scraping & single-disc buffing' },
      { label: 'Complete Luxury Villa Makeover', price: 6499, referencePrice: 7645, description: 'Intensive restoration for high-end properties' }
    ],
    addons: [{ id: 'add-puja-brass', name: 'Puja Room Idols & Brass Polish', price: 249, description: 'Pitambari & lemon shine restoration' }],
    inclusions: ['Fine POP dust vacuuming with HEPA filters', 'Paint drop removal', 'Window groove scraping'],
    exclusions: ['Wall plaster work'],
    safety: 'Heavy-duty safety goggles and multi-stage industrial dust extractors.',
    cancellationPolicy: 'Free cancellation up to 2 hours before scheduled slot.',
    faqs: [{ q: 'Can you remove paint drops from wooden flooring?', a: 'Yes, with non-scratch wooden solvent cleaners.' }]
  },
  {
    id: 'cleaning-addons',
    name: 'Cleaning Add-ons & Extra Care',
    emoji: '➕',
    tagline: 'Individual specialized add-ons to customize any cleaning service.',
    startingPrice: 199,
    rating: 4.89,
    reviewCount: 1650,
    duration: '20 - 45 mins',
    bgColor: '#ede9fe',
    heroImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-cleaning-a-bathroom-countertop-4712/1080p.mp4',
    propertyUnitLabel: 'Add-on Pack',
    packages: [
      { label: 'Chimney Baffle Filter Boil Scrub', price: 299, referencePrice: 350, description: 'Caustic-free hot boil degreasing' },
      { label: 'Refrigerator Deep Interior Steam', price: 249, referencePrice: 295, popular: true, description: 'Food shelf wash & anti-fungal steam' },
      { label: 'Microwave Interior Carbon Dissolve', price: 199, referencePrice: 235, description: 'Grease breakdown & sanitization' },
      { label: 'Ceiling Fans & Chandeliers Wipe (Pack of 4)', price: 199, referencePrice: 235, description: 'Crystal drop shine & blade dust removal' }
    ],
    addons: [],
    inclusions: ['Direct add-on execution during any booking', 'No extra visiting charge'],
    exclusions: ['Stand-alone booking under ₹300'],
    safety: 'Uses standard Diversey professional solutions.',
    cancellationPolicy: 'Refunded if primary service cancelled.',
    faqs: [{ q: 'Can I add these on the spot to my cleaner?', a: 'Yes, tell the professional and they will update your digital bill!' }]
  }
];
