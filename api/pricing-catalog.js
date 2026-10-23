// Server-authoritative prices for the current cleaning catalogue. `srv-*` prices match
// the customer-facing discounted basePrice values in src/data.ts; other canonical
// IDs are retained for compatibility. Update both catalogues together. Never accept browser prices.
export const SERVICE_PRICES = {
  "home-1bhk-furnished": {
    "name": "1 BHK Furnished Home Cleaning",
    "price": 3499
  },
  "home-1bhk-unfurnished": {
    "name": "1 BHK Unfurnished Home Cleaning",
    "price": 2799
  },
  "home-2bhk-furnished": {
    "name": "2 BHK Furnished Home Cleaning",
    "price": 4799
  },
  "home-2bhk-unfurnished": {
    "name": "2 BHK Unfurnished Home Cleaning",
    "price": 3999
  },
  "home-3bhk-furnished": {
    "name": "3 BHK Furnished Home Cleaning",
    "price": 6299
  },
  "home-3bhk-unfurnished": {
    "name": "3 BHK Unfurnished Home Cleaning",
    "price": 5499
  },
  "home-4bhk": {
    "name": "4 BHK Complete Home Cleaning",
    "price": 7999
  },
  "home-villa": {
    "name": "Villa / Bungalow (5+ BHK)",
    "price": 11999
  },
  "apartment-1bhk": {
    "name": "1 BHK Apartment Cleaning",
    "price": 2199
  },
  "apartment-2bhk": {
    "name": "2 BHK Apartment Cleaning",
    "price": 3499
  },
  "apartment-3bhk": {
    "name": "3 BHK Apartment Cleaning",
    "price": 4499
  },
  "apartment-4bhk": {
    "name": "4 BHK Apartment Cleaning",
    "price": 5999
  },
  "apartment-5bhk": {
    "name": "5 BHK Apartment Cleaning",
    "price": 8999
  },
  "room-bedroom": {
    "name": "Bedroom Deep Cleaning",
    "price": 599
  },
  "room-living": {
    "name": "Living Room Deep Cleaning",
    "price": 799
  },
  "room-kids": {
    "name": "Kids Room Cleaning",
    "price": 649
  },
  "room-study": {
    "name": "Study Room / Home Office Cleaning",
    "price": 749
  },
  "room-dining": {
    "name": "Dining Room Cleaning",
    "price": 649
  },
  "kitchen-basic": {
    "name": "Kitchen Basic Cleaning",
    "price": 699
  },
  "kitchen-deep": {
    "name": "Kitchen Deep Cleaning",
    "price": 1799
  },
  "kitchen-chimney": {
    "name": "Chimney Deep Cleaning",
    "price": 799
  },
  "kitchen-fridge": {
    "name": "Fridge Deep Cleaning",
    "price": 599
  },
  "kitchen-oven": {
    "name": "Oven / Microwave Deep Clean",
    "price": 699
  },
  "kitchen-stove": {
    "name": "Stove / Gas Cooktop Cleaning",
    "price": 499
  },
  "kitchen-cabinet": {
    "name": "Kitchen Cabinet Cleaning",
    "price": 899
  },
  "kitchen-sink": {
    "name": "Kitchen Sink Deep Clean",
    "price": 349
  },
  "bathroom-basic-1": {
    "name": "Bathroom Basic Cleaning - 1 Bathroom",
    "price": 449
  },
  "bathroom-deep-1": {
    "name": "Bathroom Deep Cleaning - 1 Bathroom",
    "price": 749
  },
  "bathroom-deep-2": {
    "name": "Bathroom Deep Cleaning - 2 Bathrooms",
    "price": 1399
  },
  "bathroom-deep-3": {
    "name": "Bathroom Deep Cleaning - 3 Bathrooms",
    "price": 1899
  },
  "bathroom-deep-4": {
    "name": "Bathroom Deep Cleaning - 4 Bathrooms",
    "price": 2599
  },
  "bathroom-deep-5": {
    "name": "Bathroom Deep Cleaning - 5 Bathrooms",
    "price": 3199
  },
  "bathroom-toilet": {
    "name": "Toilet Deep Cleaning (Single)",
    "price": 349
  },
  "floor-marble": {
    "name": "Marble Floor Cleaning & Polishing",
    "price": 1399
  },
  "floor-granite": {
    "name": "Granite Floor Deep Cleaning",
    "price": 1199
  },
  "floor-tile": {
    "name": "Tile Floor Deep Cleaning",
    "price": 899
  },
  "floor-wooden": {
    "name": "Wooden Floor Cleaning & Polish",
    "price": 1199
  },
  "sofa-3-seat": {
    "name": "3 Seater Sofa Deep Clean",
    "price": 599
  },
  "sofa-5-seat": {
    "name": "5 Seater Sofa Deep Clean",
    "price": 1299
  },
  "sofa-7-seat": {
    "name": "7 Seater Sofa Deep Clean",
    "price": 1699
  },
  "sofa-l-shape": {
    "name": "L-Shape Sofa Deep Clean",
    "price": 1899
  },
  "sofa-u-shape": {
    "name": "U-Shape Sofa Deep Clean",
    "price": 2799
  },
  "sofa-recliner": {
    "name": "Recliner / Single Sofa Cleaning",
    "price": 649
  },
  "sofa-cushion": {
    "name": "Sofa Cushion / Pillow Cleaning",
    "price": 449
  },
  "carpet-small": {
    "name": "Small Carpet (0-50 sqft)",
    "price": 549
  },
  "carpet-medium": {
    "name": "Medium Carpet (50-150 sqft)",
    "price": 999
  },
  "carpet-large": {
    "name": "Large Carpet (150-400 sqft)",
    "price": 1999
  },
  "carpet-xl": {
    "name": "Extra Large Carpet (400+ sqft)",
    "price": 3199
  },
  "mattress-single": {
    "name": "Single Bed Mattress",
    "price": 599
  },
  "mattress-double": {
    "name": "Double Bed Mattress",
    "price": 999
  },
  "mattress-queen": {
    "name": "Queen Size Mattress",
    "price": 1299
  },
  "mattress-king": {
    "name": "King Size Mattress",
    "price": 1499
  },
  "chair-1-5": {
    "name": "1-5 Chairs Deep Clean",
    "price": 499
  },
  "chair-5-10": {
    "name": "5-10 Chairs Deep Clean",
    "price": 699
  },
  "chair-10-20": {
    "name": "10-20 Chairs Deep Clean",
    "price": 1399
  },
  "chair-20-50": {
    "name": "20-50 Chairs Deep Clean",
    "price": 2899
  },
  "glass-small": {
    "name": "Small Windows (0-100 sqft)",
    "price": 399
  },
  "glass-medium": {
    "name": "Apartment Windows (100-300 sqft)",
    "price": 699
  },
  "glass-large": {
    "name": "French Windows / Facade (300-600 sqft)",
    "price": 1399
  },
  "glass-doors": {
    "name": "Glass Doors Cleaning",
    "price": 449
  },
  "glass-partition": {
    "name": "Glass Partition Cleaning",
    "price": 649
  },
  "fan-ceiling-1": {
    "name": "Ceiling Fan Cleaning - 1 Fan",
    "price": 149
  },
  "fan-ceiling-2": {
    "name": "Ceiling Fan Cleaning - 2 Fans",
    "price": 249
  },
  "fan-ceiling-5": {
    "name": "Ceiling Fan Cleaning - 5 Fans",
    "price": 599
  },
  "fan-exhaust": {
    "name": "Exhaust Fan Cleaning",
    "price": 179
  },
  "fan-wall": {
    "name": "Wall Fan Cleaning",
    "price": 179
  },
  "fan-table": {
    "name": "Table / Pedestal / Tower Fan Cleaning",
    "price": 179
  },
  "fan-chandelier": {
    "name": "Chandelier Cleaning",
    "price": 599
  },
  "curtain-basic": {
    "name": "Curtain Dry Cleaning (1 Panel)",
    "price": 249
  },
  "curtain-blinds": {
    "name": "Blinds Cleaning (Per sqft)",
    "price": 449
  },
  "balcony-1": {
    "name": "Balcony Cleaning - 1 Balcony",
    "price": 349
  },
  "balcony-2": {
    "name": "Balcony Cleaning - 2 Balconies",
    "price": 599
  },
  "terrace-cleaning": {
    "name": "Terrace Deep Cleaning",
    "price": 1399
  },
  "door-single": {
    "name": "Single Door Deep Cleaning",
    "price": 149
  },
  "door-all-home": {
    "name": "All Doors Deep Cleaning (5-8 Doors)",
    "price": 799
  },
  "move-in-1bhk": {
    "name": "Move-In 1 BHK",
    "price": 3499
  },
  "move-in-2bhk": {
    "name": "Move-In 2 BHK",
    "price": 4999
  },
  "move-in-3bhk": {
    "name": "Move-In 3 BHK",
    "price": 6499
  },
  "move-out-1bhk": {
    "name": "Move-Out 1 BHK",
    "price": 3499
  },
  "move-out-2bhk": {
    "name": "Move-Out 2 BHK",
    "price": 4999
  },
  "move-out-3bhk": {
    "name": "Move-Out 3 BHK",
    "price": 6499
  },
  "recurring-daily": {
    "name": "Daily Home Cleaning",
    "price": 999
  },
  "recurring-weekly": {
    "name": "Weekly Home Cleaning",
    "price": 1299
  },
  "recurring-monthly": {
    "name": "Monthly Deep Cleaning",
    "price": 2299
  },
  "commercial-small-office": {
    "name": "Small Office (Under 1000 sqft)",
    "price": 2499
  },
  "commercial-large-office": {
    "name": "Large Office (1000-3000 sqft)",
    "price": 4499
  },
  "commercial-clinic": {
    "name": "Clinic / Doctor Office Cleaning",
    "price": 2999
  },
  "commercial-shop": {
    "name": "Shop / Retail Store Cleaning",
    "price": 2499
  },
  "commercial-warehouse": {
    "name": "Warehouse / Godown Cleaning",
    "price": 6999
  }
,
  "srv-home-unfurn-apt": {
    name: "Unfurnished Apartment – Home Deep Cleaning",
    price: 2719
  },
  "srv-home-furn-apt": {
    name: "Furnished Apartment – Home Deep Cleaning",
    price: 2974
  },
  "srv-home-unfurn-bungalow": {
    name: "Unfurnished Bungalow / Duplex – Home Deep Cleaning",
    price: 3569
  },
  "srv-home-furn-bungalow": {
    name: "Furnished Bungalow / Duplex – Home Deep Cleaning",
    price: 3994
  },
  "srv-home-partial": {
    name: "Partial Home Cleaning",
    price: 2166
  },
  "srv-home-living-bed-balcony": {
    name: "Living + Bedroom + Balcony Custom Package",
    price: 2379
  },
  "srv-bath-intense": {
    name: "Intense Bathroom Cleaning",
    price: 467
  },
  "srv-bath-movein": {
    name: "Move-in Bathroom Cleaning",
    price: 535
  },
  "srv-bath-2pack": {
    name: "Intense Cleaning – 2 Bathrooms",
    price: 814
  },
  "srv-bath-3pack": {
    name: "Intense Cleaning – 3 Bathrooms",
    price: 1170
  },
  "srv-bath-4pack": {
    name: "Intense Cleaning – 4 Bathrooms",
    price: 1357
  },
  "srv-bath-fan-pack": {
    name: "Intense Bathroom + Ceiling Fan Pack (2)",
    price: 983
  },
  "srv-bath-balcony": {
    name: "Balcony Cleaning",
    price: 467
  },
  "srv-kitchen-chimney-stove": {
    name: "Regular Chimney & Stove Cleaning",
    price: 466
  },
  "srv-kitchen-fan-window": {
    name: "Kitchen Fan & Window Cleaning",
    price: 424
  },
  "srv-kitchen-cabinets-tiles": {
    name: "Cabinets, Tiles & Sink Cleaning",
    price: 552
  },
  "srv-kitchen-complete-deep": {
    name: "Complete Kitchen Deep Cleaning",
    price: 849
  },
  "srv-kitchen-chimney-only": {
    name: "Chimney Cleaning",
    price: 339
  },
  "srv-kitchen-chimney-stove-pack": {
    name: "Chimney + Stove Package",
    price: 424
  },
  "srv-kitchen-fridge": {
    name: "Fridge Cleaning",
    price: 339
  },
  "srv-kitchen-microwave": {
    name: "Microwave Cleaning",
    price: 169
  },
  "srv-kitchen-gas-stove": {
    name: "Gas Stove Cleaning",
    price: 84
  },
  "srv-kitchen-airfryer": {
    name: "Air Fryer Cleaning",
    price: 169
  },
  "srv-kitchen-otg": {
    name: "OTG Cleaning",
    price: 339
  },
  "srv-kitchen-griller": {
    name: "Sandwich Maker / Griller",
    price: 84
  },
  "srv-kitchen-exhaust": {
    name: "Kitchen Exhaust Fan",
    price: 84
  },
  "srv-kitchen-window": {
    name: "Kitchen Window",
    price: 339
  },
  "srv-kitchen-hygiene": {
    name: "Kitchen Intensive Hygiene Cleaning",
    price: 135
  },
  "srv-sofa-fabric": {
    name: "Fabric Sofa Cleaning",
    price: 339
  },
  "srv-sofa-leather": {
    name: "Leather Sofa Cleaning & Polishing",
    price: 339
  },
  "srv-sofa-cumbed": {
    name: "Sofa Cum Bed",
    price: 339
  },
  "srv-carpet-deep": {
    name: "Carpet Cleaning",
    price: 339
  },
  "srv-sofa-protection": {
    name: "Sofa Cleaning + Stain Protection Coating",
    price: 1274
  },
  "srv-curtain-refresh": {
    name: "Curtain Refresh / Curtain Cleaning",
    price: 128
  },
  "srv-sofa-window-cobweb": {
    name: "Sofa + Windows + Cobweb Cleaning",
    price: 631
  },
  "srv-bedroom-essential": {
    name: "Bedroom Essential Cleaning",
    price: 679
  },
  "srv-mattress-deep": {
    name: "Mattress Cleaning",
    price: 339
  },
  "srv-bed-cleaning": {
    name: "Bed Cleaning",
    price: 382
  },
  "srv-furn-headboard": {
    name: "Fabric Headboard",
    price: 212
  },
  "srv-furn-dining": {
    name: "Dining Table & Chairs Cleaning",
    price: 424
  },
  "srv-furn-ottoman": {
    name: "Ottoman",
    price: 101
  },
  "srv-furn-showcase": {
    name: "Showcase / Cabinet",
    price: 169
  },
  "srv-furn-centre-table": {
    name: "Sofa Centre Table",
    price: 169
  },
  "srv-furn-study-table": {
    name: "Study Table & Chair",
    price: 212
  },
  "srv-furn-recliner": {
    name: "Recliner / Lounge Chair",
    price: 212
  },
  "srv-rec-sofa-2visit": {
    name: "2 Visits – Fabric Sofa Cleaning (Recurring)",
    price: 542
  },
  "srv-rec-mattress-3visit": {
    name: "3 Visits – Mattress Cleaning (Recurring)",
    price: 813
  },
  "srv-balcony-pressure-deep": {
    name: "Balcony High-Pressure Wash & Tile Grout Buffing",
    price: 679
  },
  "srv-chimney-exhaust-buffing": {
    name: "Heavy Kitchen Chimney & Exhaust Degreasing",
    price: 1019
  },
  "srv-leather-sofa-polish": {
    name: "Pure Leather Sofa Conditioning & Wax Buffing",
    price: 1444
  },
  "srv-mattress-steam-uv": {
    name: "King Size Mattress Anti-Mite & Steam Extraction",
    price: 1104
  },
  "srv-window-mesh-track-deep": {
    name: "Glass Windows & Mesh Track Deep High-Pressure Scrub",
    price: 764
  },
  "srv-terrace-courtyard-wash": {
    name: "Terrace & Courtyard Anti-Fungal Pressure Scrub",
    price: 1699
  }
};
export const ADDON_PRICES = {
  "bath-exhaust-fan": {
    "name": "Exhaust Fan Cleaning",
    "price": 149
  },
  "bath-mirror": {
    "name": "Mirror Deep Clean",
    "price": 99
  },
  "bath-tile-deep": {
    "name": "Tile Deep Scrubbing",
    "price": 249
  },
  "bath-extra-toilet": {
    "name": "Additional Toilet",
    "price": 199
  },
  "kit-chimney-ext": {
    "name": "Chimney Exterior Clean",
    "price": 299
  },
  "kit-cabinet-ext": {
    "name": "Cabinet Exterior Clean",
    "price": 199
  },
  "kit-fridge-ext": {
    "name": "Fridge Exterior Clean",
    "price": 149
  },
  "kit-microwave": {
    "name": "Microwave Deep Clean",
    "price": 199
  },
  "home-balcony": {
    "name": "Balcony Cleaning",
    "price": 299
  },
  "home-ceiling-fan": {
    "name": "Ceiling Fan Cleaning",
    "price": 99
  },
  "home-fridge-int": {
    "name": "Fridge Interior Clean",
    "price": 399
  },
  "home-oven": {
    "name": "Oven Deep Clean",
    "price": 499
  },
  "home-switchboard": {
    "name": "Switchboard Cleaning",
    "price": 149
  },
  "home-doors": {
    "name": "Doors Cleaning",
    "price": 199
  },
  "fan-extra-ceiling": {
    "name": "Additional Ceiling Fan",
    "price": 99
  },
  "fan-exhaust": {
    "name": "Exhaust Fan Cleaning",
    "price": 149
  },
  "fan-wall": {
    "name": "Wall Fan Cleaning",
    "price": 149
  },
  "sofa-1-seat": {
    "name": "1 Seater Sofa",
    "price": 249
  },
  "sofa-cushion": {
    "name": "Additional Cushion",
    "price": 99
  },
  "carpet-stain": {
    "name": "Stain Treatment",
    "price": 199
  },
  "carpet-extra": {
    "name": "Additional Carpet",
    "price": 299
  },
  "curtain-extra": {
    "name": "Additional Curtain",
    "price": 149
  },
  "curtain-rod": {
    "name": "Curtain Rod Cleaning",
    "price": 99
  },
  "add-fridge": {
    "name": "Fridge Deep Clean",
    "price": 249
  },
  "add-chimney": {
    "name": "Chimney Degreasing",
    "price": 449
  },
  "add-fan": {
    "name": "Ceiling Fan Detail",
    "price": 99
  },
  "add-balcony": {
    "name": "Balcony Jet Wash",
    "price": 299
  },
  "add-bathroom": {
    "name": "Extra Bathroom Clean",
    "price": 599
  },
  "add-window": {
    "name": "Glass Window Cleaning",
    "price": 299
  },
  "add-balcony-extra": {
    name: "Additional Balcony Deep Wash",
    price: 299
  },
  "add-wood-polish": {
    name: "Wooden Doors Wax Polish (Pack of 4)",
    price: 449
  },
  "add-fridge-int": {
    name: "Interior Fridge Deep Scrub",
    price: 299
  },
  "add-oven-int": {
    name: "Microwave/Oven Carbon Removal",
    price: 199
  },
  "add-terrace-wash": {
    name: "Terrace Power Wash (up to 1000 sq ft)",
    price: 799
  },
  "add-carpet-shampoo": {
    name: "Master Living Carpet Shampoo Addon",
    price: 349
  },
  "add-extra-room": {
    name: "Add Another Room",
    price: 599
  },
  "add-kitchen-express": {
    name: "Add Express Kitchen Degrease",
    price: 499
  },
  "add-bath-exhaust": {
    name: "Bathroom Exhaust Fan Deep Clean",
    price: 76
  },
  "add-bath-door": {
    name: "Bathroom Door Both Sides Scrub",
    price: 76
  },
  "add-bath-mirror": {
    name: "Mirror Anti-Fog Nano Polish",
    price: 69
  },
  "add-bath-drain": {
    name: "Drain Trap & Pipe Clearance",
    price: 89
  },
  "add-bath-exhaust-2": {
    name: "2 Exhaust Fans Deep Degrease",
    price: 140
  },
  "add-bath-door-3": {
    name: "All 3 Doors Both Sides Scrub",
    price: 199
  },
  "add-bath-exhaust-4": {
    name: "4 Exhaust Fans Degrease",
    price: 249
  },
  "add-extra-fan": {
    name: "Add 1 More Ceiling Fan",
    price: 79
  },
  "add-balcony-pots": {
    name: "Plant Pots Wipe & Rearrange",
    price: 99
  },
  "add-stove-pipe": {
    name: "Gas Pipe & Regulator Degrease",
    price: 49
  },
  "add-extra-kit-win": {
    name: "Additional Kitchen Window",
    price: 149
  },
  "add-cabinet-int": {
    name: "Cabinet Interior Wipe (Empty)",
    price: 249
  },
  "add-fridge-deep": {
    name: "Refrigerator Interior Scrub",
    price: 299
  },
  "add-stove-top": {
    name: "Gas Stove Top Scrub",
    price: 99
  },
  "add-micro-clean": {
    name: "Microwave Deep Clean Addon",
    price: 169
  },
  "add-deep-freeze": {
    name: "Deep Freezer Frost Removal & Wash",
    price: 99
  },
  "add-cushion-small": {
    name: "Throw Cushion Shampoo (Pack of 2)",
    price: 99
  },
  "add-stain-guard": {
    name: "Hydrophobic Stain Guard Shield",
    price: 199
  },
  "add-leather-recliner": {
    name: "Footrest & Armrest Polish",
    price: 99
  },
  "add-carpet-shield": {
    name: "Anti-Stain Fluoropolymer Coat",
    price: 149
  },
  "add-bed-wash": {
    name: "Attached Bathroom Quick Descaling",
    price: 349
  },
  "add-pillow-shampoo": {
    name: "Pillow Deep Shampoo (Pack of 2)",
    price: 99
  },
  "add-extra-chair": {
    name: "Extra Dining Chair Shampoo",
    price: 69
  }
};
export const COUPON_CODES = new Set(["BHARAT10", "PRO10", "FIRST10", "CLEAN10", "SAVE10"]);
export const CONVENIENCE_FEE_INR = 49;
export const GST_RATE = 0.18;
