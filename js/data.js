/* Bharat Pro Expert - cleaning services catalogue (ES5, no dependencies) */
(function () {
  'use strict';

  var services = [];
  function S(cat, slug, name, nameHi, emoji, price, mrp, rating, reviews, duration, desc, includes, excludes, faqs, tag) {
    var f = [];
    for (var i = 0; i < faqs.length; i++) { f.push({ q: faqs[i][0], a: faqs[i][1] }); }
    var o = {
      id: cat + '-' + slug, cat: cat, name: name, nameHi: nameHi, emoji: emoji,
      price: price, mrp: mrp, rating: rating, reviews: reviews, duration: duration,
      desc: desc, includes: includes, excludes: excludes, faqs: f
    };
    if (tag) { o.tag = tag; }
    services.push(o);
  }

  /* one shared question per category, added to every service of that category */
  var FQ = {
    deep: ['How many experts will come?', 'A team of 2 to 4 trained experts arrives with machines, tools and eco-safe chemicals, based on the size of your home.'],
    bath: ['Do I need to arrange cleaning products?', 'No. Our experts bring all chemicals, brushes and machines. Please keep water and a power point ready.'],
    kitchen: ['Do I need to arrange cleaning products?', 'No. Our experts bring degreasers, brushes and machines. Please keep water and a power point ready.'],
    sofa: ['How long will the fabric take to dry?', 'Usually 3 to 5 hours with a fan on. Avoid sitting on it until it is fully dry.'],
    appl: ['Will the floor and nearby items be protected?', 'Yes, the expert covers the area with sheets and wipes the place clean before leaving.'],
    floor: ['Will the floor be slippery afterwards?', 'No. We dry-mop at the end so the floor is safe to walk on straight away.'],
    dust: ['Will it make a mess in my home?', 'No. Our experts use covers and cloths to catch dust and wipe the area clean after the work.'],
    special: ['How many experts will come?', 'A team of 2 to 4 trained experts arrives with machines, tools and eco-safe chemicals, based on the size of your home.']
  };

  /* ---------------- FULL HOME DEEP CLEANING (APARTMENT) ---------------- */
  S('deep', '1bhk', '1 BHK Full Home Deep Cleaning', '1 BHK पूरे घर की डीप क्लीनिंग', '🏠', 2999, 3999, 4.8, 9420, 300,
    'Top-to-bottom machine cleaning of a 1 BHK home, from ceiling fans to floors.',
    ['Floor scrubbing and machine wash', 'Bedroom, hall and balcony cleaning', 'Kitchen and bathroom deep cleaning', 'Fan, light and window cleaning', 'Cobweb and dust removal'],
    ['Moving of heavy furniture', 'Post-construction debris removal'],
    [['How long does a 1 BHK take?', 'About 5 hours with a team of 2 experts.'], FQ.deep], 'Bestseller');
  S('deep', '2bhk', '2 BHK Full Home Deep Cleaning', '2 BHK पूरे घर की डीप क्लीनिंग', '🏡', 4499, 5999, 4.8, 12560, 420,
    'Complete deep cleaning of a 2 BHK home with machines and eco-safe chemicals.',
    ['Floor scrubbing and machine wash', 'Bedrooms, hall and balcony cleaning', 'Kitchen and both bathrooms deep cleaning', 'Fan, light and window cleaning', 'Wardrobe exterior and door cleaning'],
    ['Moving of heavy furniture', 'Post-construction debris removal'],
    [['Is kitchen cleaning included?', 'Yes. The counter, sink, tiles, cabinet exteriors and hob are cleaned.'], FQ.deep], 'Popular');
  S('deep', '3bhk', '3 BHK Full Home Deep Cleaning', '3 BHK पूरे घर की डीप क्लीनिंग', '🏘️', 5999, 7999, 4.7, 8130, 540,
    'Deep cleaning of every room, kitchen and bathroom in a 3 BHK home.',
    ['Floor scrubbing and machine wash', 'All bedrooms, hall and balconies', 'Kitchen and all bathrooms deep cleaning', 'Fan, light and window cleaning', 'Wardrobe exterior and door cleaning'],
    ['Moving of heavy furniture', 'Post-construction debris removal'],
    [['Can the work be split over two days?', 'Yes. Tell us when booking and we will plan two visits without any extra visit fee.'], FQ.deep], '');
  S('deep', '4bhk', '4 BHK Apartment Deep Cleaning', '4 BHK अपार्टमेंट डीप क्लीनिंग', '🏰', 7499, 9999, 4.7, 3210, 660,
    'Deep cleaning of a large 4 BHK apartment by a bigger team with machines.',
    ['Floor scrubbing and machine wash', 'All bedrooms, hall and balconies', 'Kitchen and all bathrooms deep cleaning', 'Fan, light and window cleaning', 'Wardrobe exterior and door cleaning'],
    ['Moving of heavy furniture', 'Post-construction debris removal'],
    [['How many experts come for a 4 BHK?', 'A team of 4 trained experts, usually for 2 days or one long day.'], FQ.deep], '');
  S('deep', 'studio', 'Studio Apartment Deep Cleaning', 'स्टूडियो अपार्टमेंट डीप क्लीनिंग', '🏢', 2199, 2999, 4.7, 5120, 240,
    'Complete deep cleaning of a studio or 1 RK apartment, including kitchenette and bathroom.',
    ['Floor scrubbing and machine wash', 'Kitchenette and bathroom deep cleaning', 'Fan, light and window cleaning', 'Balcony cleaning', 'Cobweb and dust removal'],
    ['Moving of heavy furniture', 'Post-construction debris removal'],
    [['Is this suitable for a 1 RK?', 'Yes. It covers studio apartments and 1 RK homes up to 500 sq ft.'], FQ.deep], '');
  S('deep', 'room', 'Single Room Deep Cleaning', 'सिंगल रूम डीप क्लीनिंग', '🛏️', 1199, 1599, 4.6, 6120, 120,
    'Deep cleaning of one room, ideal for a bedroom, hall or study.',
    ['Floor scrubbing', 'Fan and light cleaning', 'Window and door cleaning', 'Wardrobe exterior wipe-down'],
    ['Inside of wardrobes', 'Moving of heavy furniture'],
    [['Can I add a bathroom?', 'Yes. Add a Bathroom Deep Cleaning to the cart and both are done in one visit.'], FQ.deep], '');
  S('deep', 'empty2', '2 BHK Empty Flat Deep Cleaning', '2 BHK खाली फ्लैट डीप क्लीनिंग', '🏡', 3499, 4699, 4.7, 4380, 330,
    'Deep cleaning of an unfurnished 2 BHK flat, including the inside of cupboards and shelves.',
    ['Empty-flat floor machine wash', 'Inside of cupboards, shelves and drawers', 'Kitchen and bathroom deep cleaning', 'Window, grill and door cleaning', 'Fan, light and switchboard cleaning'],
    ['Packing or moving of belongings', 'Debris removal'],
    [['Does the flat have to be empty?', 'An empty or almost empty flat gives the best result, since we can reach every corner.'], FQ.deep], '');
  S('deep', 'empty3', '3 BHK Empty Flat Deep Cleaning', '3 BHK खाली फ्लैट डीप क्लीनिंग', '🏘️', 4499, 5999, 4.7, 3150, 420,
    'Deep cleaning of an unfurnished 3 BHK flat, including the inside of cupboards and shelves.',
    ['Empty-flat floor machine wash', 'Inside of cupboards, shelves and drawers', 'Kitchen and bathrooms deep cleaning', 'Window, grill and door cleaning', 'Fan, light and switchboard cleaning'],
    ['Packing or moving of belongings', 'Debris removal'],
    [['How long does it take?', 'About 7 hours with a team of 3 experts.'], FQ.deep], '');

  /* ---------------- BATHROOM CLEANING ---------------- */
  S('bath', '1', 'Bathroom Deep Cleaning (1 Bathroom)', 'बाथरूम डीप क्लीनिंग (1 बाथरूम)', '🚿', 499, 699, 4.8, 21340, 45,
    'Scrub and shine for tiles, taps, sink, commode and glass.',
    ['Wall and floor tile scrubbing', 'Commode and washbasin cleaning', 'Taps and fittings polish', 'Mirror and glass cleaning', 'Drain cover cleaning'],
    ['Removal of very old rust marks', 'Cleaning above 10 feet height'],
    [['How long does it take?', 'About 45 minutes for one bathroom.'], FQ.bath], 'Bestseller');
  S('bath', '2', 'Bathroom Deep Cleaning (2 Bathrooms)', 'बाथरूम डीप क्लीनिंग (2 बाथरूम)', '🛁', 899, 1299, 4.7, 9870, 80,
    'Deep cleaning of two bathrooms in a single visit at a lower price.',
    ['Wall and floor tile scrubbing', 'Commode and washbasin cleaning', 'Taps and fittings polish', 'Mirror and glass cleaning', 'Drain cover cleaning'],
    ['Removal of very old rust marks', 'Cleaning above 10 feet height'],
    [['Can I book three bathrooms?', 'Yes. Add this pack plus one single bathroom to the cart.'], FQ.bath], '');
  S('bath', '3', 'Bathroom Deep Cleaning (3 Bathrooms)', 'बाथरूम डीप क्लीनिंग (3 बाथरूम)', '🛁', 1299, 1899, 4.7, 4310, 120,
    'Deep cleaning of three bathrooms in a single visit at the best price.',
    ['Wall and floor tile scrubbing', 'Commode and washbasin cleaning', 'Taps and fittings polish', 'Mirror and glass cleaning', 'Drain cover cleaning'],
    ['Removal of very old rust marks', 'Cleaning above 10 feet height'],
    [['Can I book four bathrooms?', 'Yes. Add this pack plus one single bathroom to the cart.'], FQ.bath], 'Popular');
  S('bath', 'toilet', 'Toilet & Washbasin Sanitisation', 'टॉयलेट और वॉशबेसिन सैनिटाइज़', '🚽', 349, 499, 4.7, 8940, 30,
    'Quick deep clean and disinfection of the commode and washbasin.',
    ['Commode deep cleaning', 'Washbasin and tap cleaning', 'Disinfectant spray', 'Floor wash'],
    ['Wall tile scrubbing', 'Drain unblocking'],
    [['Is this a full bathroom cleaning?', 'No, this is a quick toilet and basin clean. Choose Bathroom Deep Cleaning for walls and floors.'], FQ.bath], '');
  S('bath', 'tile', 'Tile & Grout Scrubbing', 'टाइल और ग्राउट स्क्रबिंग', '🔲', 599, 849, 4.6, 4260, 60,
    'Machine scrubbing of floor and wall tiles to lift dirt from the grout lines.',
    ['Tile scrubbing with machine', 'Grout line cleaning', 'Stain and scale removal', 'Final wash and wipe'],
    ['Cleaning above 10 feet height', 'Removal of permanent stains'],
    [['Will the grout colour change?', 'The grout looks fresher after cleaning, but its original colour is not changed.'], FQ.bath], '');
  S('bath', 'shower', 'Shower Cabin & Glass Partition Cleaning', 'शॉवर केबिन और ग्लास पार्टिशन सफाई', '🚿', 549, 799, 4.5, 1860, 45,
    'Removes soap scum and hard-water marks from shower glass and frames.',
    ['Glass scrubbing and descaling', 'Frame and track cleaning', 'Shower tray cleaning', 'Streak-free wipe'],
    ['Removal of etched or permanent marks', 'Cleaning above 10 feet height'],
    [['Will the glass look new?', 'Soap scum and water marks are removed. Deep etching on old glass cannot be removed.'], FQ.bath], '');
  S('bath', 'exhaust', 'Bathroom Exhaust Fan & Ceiling Cleaning', 'बाथरूम एग्जॉस्ट फैन और सीलिंग सफाई', '💨', 299, 449, 4.5, 2210, 30,
    'Dust and damp stain removal from the bathroom exhaust fan, ceiling and vents.',
    ['Exhaust fan blade and grill cleaning', 'Ceiling wipe-down', 'Vent dusting'],
    ['Replacement of fan or parts', 'Wiring work'],
    [['Is the fan removed?', 'Only the cover is opened for cleaning. The fan is not taken out.'], FQ.bath], '');
  S('bath', 'fittings', 'Taps & Shower Head Descaling', 'नल और शॉवर हेड डिस्केलिंग', '🚰', 349, 499, 4.6, 2740, 30,
    'Removes hard-water scale from taps, shower heads and bathroom fittings.',
    ['Tap and spout descaling', 'Shower head scale removal', 'Fitting polish', 'Water flow improvement'],
    ['Replacement of fittings', 'Pipe work'],
    [['Will water flow improve?', 'Yes. Clearing scale from the holes of the shower head and taps improves flow.'], FQ.bath], '');

  /* ---------------- KITCHEN CLEANING ---------------- */
  S('kitchen', 'empty', 'Kitchen Deep Cleaning (Empty Kitchen)', 'किचन डीप क्लीनिंग (खाली किचन)', '🍳', 1299, 1799, 4.8, 11200, 120,
    'Degreasing and deep cleaning of an empty or lightly stocked kitchen.',
    ['Counter, sink and tile degreasing', 'Hob and burner cleaning', 'Cabinet exterior cleaning', 'Exhaust fan and wall cleaning', 'Floor scrubbing'],
    ['Inside of cabinets', 'Chimney deep cleaning'],
    [['What is an empty kitchen?', 'The cabinets and shelves have no items inside, so we can reach every corner.'], FQ.kitchen], 'Popular');
  S('kitchen', 'furnished', 'Kitchen Deep Cleaning (Furnished)', 'किचन डीप क्लीनिंग (सामान सहित)', '🍴', 1999, 2699, 4.7, 7640, 180,
    'Complete kitchen cleaning including the inside of cabinets, drawers and shelves.',
    ['Inside and outside of cabinets', 'Shelf and drawer cleaning', 'Counter, sink and tile degreasing', 'Hob and appliance exterior cleaning', 'Floor scrubbing'],
    ['Fridge and microwave deep cleaning', 'Chimney deep cleaning'],
    [['Do I need to empty the cabinets?', 'No. Our team removes and puts back items carefully.'], FQ.kitchen], '');
  S('kitchen', 'chimney', 'Chimney & Hob Degreasing', 'चिमनी और हॉब की ग्रीस सफाई', '💨', 699, 999, 4.6, 5320, 60,
    'Removes thick oil and grease from the chimney, filters and hob.',
    ['Chimney body and filter degreasing', 'Hob and burner cleaning', 'Backsplash tile wiping', 'Oil collector cleaning'],
    ['Replacement of motor or parts', 'Deep scrubbing of all wall tiles'],
    [['How often should a chimney be cleaned?', 'Every 2 to 3 months if you prepare meals at home daily.'], FQ.kitchen], '');
  S('kitchen', 'cabinet', 'Cabinet & Shelf Cleaning', 'अलमारी और शेल्फ की सफाई', '🗄️', 799, 1099, 4.5, 3180, 90,
    'Dust and grease removal from kitchen cabinets, shelves and drawers.',
    ['Inside and outside cabinet cleaning', 'Shelf and drawer wiping', 'Dust and grease removal', 'Corner and hinge cleaning'],
    ['Re-arranging of belongings', 'Cleaning of items stored inside'],
    [['Do you wipe wooden cabinets?', 'Yes, with a damp microfibre cloth that is safe for wood and laminate.'], FQ.kitchen], '');
  S('kitchen', 'fridge', 'Refrigerator Deep Cleaning', 'फ्रिज डीप क्लीनिंग', '🧊', 699, 999, 4.6, 3980, 60,
    'Inside and outside cleaning of single and double door refrigerators.',
    ['Shelf and tray cleaning', 'Inside wall and door cleaning', 'Rubber seal cleaning', 'Outer body wipe', 'Odour removal'],
    ['Defrosting of heavy ice build-up', 'Part replacement'],
    [['Do I need to empty the fridge?', 'Please empty it in advance. Our expert will switch it off and clean it.'], FQ.kitchen], '');
  S('kitchen', 'microwave', 'Microwave & Oven Cleaning', 'माइक्रोवेव और ओवन की सफाई', '🍽️', 399, 599, 4.5, 2450, 40,
    'Degreasing and odour removal for microwaves and oven toasters.',
    ['Inside cavity degreasing', 'Turntable and rack cleaning', 'Door and outer body wipe', 'Odour removal'],
    ['Part replacement', 'Cleaning of built-in ovens above 60 litres'],
    [['Is the cleaning food safe?', 'Yes. We use food-safe cleaners and wipe all surfaces twice.'], FQ.kitchen], '');
  S('kitchen', 'walls', 'Kitchen Exhaust & Wall Tile Degreasing', 'किचन एग्जॉस्ट और दीवार टाइल ग्रीस सफाई', '🔲', 599, 849, 4.6, 3310, 60,
    'Removes sticky oil from the kitchen exhaust fan, wall tiles and ceiling.',
    ['Exhaust fan degreasing', 'Wall tile degreasing', 'Ceiling and corner wipe', 'Switchboard wipe'],
    ['Replacement of fan or parts', 'Chimney deep cleaning'],
    [['How old grease is handled?', 'We soften it with a degreaser and scrub it off. Very old burnt marks may remain faintly.'], FQ.kitchen], '');
  S('kitchen', 'sink', 'Kitchen Sink & Drain Cleaning', 'किचन सिंक और ड्रेन की सफाई', '🍽️', 349, 499, 4.5, 2890, 30,
    'Deep cleaning and deodorising of the kitchen sink, tap and drain mouth.',
    ['Sink scrubbing and descaling', 'Tap and fitting polish', 'Drain mouth cleaning', 'Odour removal'],
    ['Drain unblocking', 'Pipe work'],
    [['Does it remove drain smell?', 'Yes. We clean the drain mouth and apply a deodorising treatment.'], FQ.kitchen], '');

  /* ---------------- SOFA, CARPET & MATTRESS ---------------- */
  S('sofa', 'seat', 'Sofa Shampoo Cleaning (per seat)', 'सोफा शैम्पू क्लीनिंग (प्रति सीट)', '🛋️', 249, 349, 4.7, 17620, 30,
    'Dry vacuum and shampoo cleaning for fabric sofas, priced per seat.',
    ['Dry vacuuming', 'Shampoo scrubbing', 'Stain treatment', 'Wet vacuum extraction'],
    ['Leather sofa cleaning', 'Washing of removable covers'],
    [['What counts as one seat?', 'Each seating space counts as one seat. A 3-seater sofa is 3 seats.'], FQ.sofa], 'Bestseller');
  S('sofa', 'lshape', 'L-Shape Sofa Cleaning (up to 6 seats)', 'एल-शेप सोफा क्लीनिंग (6 सीट तक)', '🛋️', 1499, 1999, 4.7, 6280, 120,
    'Full shampoo cleaning of an L-shape or large corner sofa at a pack price.',
    ['Dry vacuuming', 'Shampoo scrubbing of all seats', 'Armrest and back cleaning', 'Stain treatment', 'Wet vacuum extraction'],
    ['Leather sofa cleaning', 'Fabric dye or colour restoration'],
    [['Is this cheaper than per-seat pricing?', 'Yes. This pack saves money on large sofas of up to 6 seats.'], FQ.sofa], '');
  S('sofa', 'leather', 'Leather Sofa Cleaning & Conditioning', 'लेदर सोफा क्लीनिंग और कंडीशनिंग', '🧴', 1799, 2399, 4.6, 2140, 120,
    'Gentle cleaning and conditioning that keeps leather soft and shiny.',
    ['Dust removal', 'Leather-safe cleaner wipe', 'Stain spot treatment', 'Conditioning for softness and shine'],
    ['Colour restoration', 'Crack filling'],
    [['Can cleaning fix cracks in leather?', 'No. Cleaning and conditioning improve the look and feel but do not fill cracks.'], FQ.sofa], '');
  S('sofa', 'carpet', 'Carpet Cleaning (up to 50 sq ft)', 'कारपेट क्लीनिंग (50 वर्ग फुट तक)', '🧶', 599, 849, 4.6, 5410, 60,
    'Shampoo cleaning of small and medium carpets and rugs at your home.',
    ['Dry vacuuming', 'Shampoo scrubbing', 'Stain treatment', 'Wet vacuum extraction'],
    ['Silk or antique carpet cleaning', 'Colour restoration'],
    [['Do you take the carpet away?', 'No. The cleaning is done at your home on the spot.'], FQ.sofa], '');
  S('sofa', 'carpet-large', 'Large Carpet Cleaning (up to 120 sq ft)', 'बड़े कारपेट की क्लीनिंग (120 वर्ग फुट तक)', '🧶', 1299, 1799, 4.6, 2340, 90,
    'Deep shampoo cleaning for large room carpets and wall-to-wall carpeting.',
    ['Dry vacuuming', 'Shampoo scrubbing', 'Stain treatment', 'Wet vacuum extraction'],
    ['Silk or antique carpet cleaning', 'Colour restoration'],
    [['How do I measure my carpet?', 'Multiply length by width in feet. If unsure, our expert will confirm the size on arrival.'], FQ.sofa], '');
  S('sofa', 'mattress-single', 'Mattress Deep Cleaning (Single)', 'गद्दा डीप क्लीनिंग (सिंगल)', '🛏️', 499, 699, 4.7, 7120, 40,
    'Removes dust, mites and stains from single mattresses for a healthier sleep.',
    ['Deep vacuuming of dust and mites', 'Anti-bacterial shampoo', 'Stain treatment', 'Blower drying'],
    ['Washing of mattress covers', 'Removal of very old stains'],
    [['Does it remove dust mites?', 'Deep vacuuming and shampoo remove most dust and mites.'], FQ.sofa], 'Popular');
  S('sofa', 'mattress-double', 'Mattress Deep Cleaning (Double / King)', 'गद्दा डीप क्लीनिंग (डबल / किंग)', '🛌', 799, 1099, 4.8, 10290, 50,
    'Complete dust, mite and stain removal for double and king size mattresses.',
    ['Deep vacuuming of dust and mites', 'Anti-bacterial shampoo', 'Stain treatment', 'Blower drying'],
    ['Washing of mattress covers', 'Removal of very old stains'],
    [['How often should I clean my mattress?', 'Every 6 months, or after spills and during allergy season.'], FQ.sofa], '');
  S('sofa', 'curtain', 'Curtain Steam Cleaning (per window)', 'पर्दे की स्टीम क्लीनिंग (प्रति खिड़की)', '🧵', 299, 449, 4.5, 2610, 45,
    'Steam cleaning that removes dust and odour while the curtains stay hanging.',
    ['Steam cleaning on the rod', 'Dust removal', 'Freshness treatment'],
    ['Washing of heavy curtains away from home', 'Stitching or alteration'],
    [['Do the curtains need to be taken down?', 'No. Steam cleaning is done while the curtains stay hanging.'], FQ.sofa], '');

  /* ---------------- APPLIANCE CLEANING ---------------- */
  S('appl', 'split-ac', 'Split AC Jet-Pump Wash', 'स्प्लिट एसी जेट-पंप वॉश', '❄️', 549, 799, 4.8, 18420, 60,
    'Deep jet-pump cleaning of the indoor and outdoor unit for better cooling and a lower power bill.',
    ['Jet-pump wash of indoor unit', 'Outdoor unit cleaning', 'Filter and coil cleaning', 'Drain pipe cleaning'],
    ['Refrigerant top-up', 'Part replacement'],
    [['How often should I clean my AC?', 'Every 6 months, or before summer starts, for the best cooling.'], FQ.appl], 'Bestseller');
  S('appl', 'window-ac', 'Window AC Foam Wash', 'विंडो एसी फोम वॉश', '🌬️', 449, 649, 4.7, 12310, 50,
    'Foam-jet cleaning of a window AC with filter, coil and blower wash.',
    ['Foam-jet cleaning', 'Filter and coil wash', 'Blower and fan cleaning', 'Outer body wipe'],
    ['Refrigerant top-up', 'Part replacement'],
    [['Do you remove the AC from the window?', 'Only if needed for deep cleaning. Our expert will tell you first.'], FQ.appl], 'Popular');
  S('appl', 'ac-combo', 'Two Split AC Jet-Pump Wash Combo', '2 स्प्लिट एसी जेट-पंप वॉश कॉम्बो', '❄️', 999, 1499, 4.8, 7240, 110,
    'Save on cleaning two split ACs in one visit with the same jet-pump wash.',
    ['Jet-pump wash of 2 indoor units', 'Outdoor unit cleaning', 'Filter and coil cleaning', 'Drain pipe cleaning'],
    ['Refrigerant top-up', 'Part replacement'],
    [['Can I add a third AC?', 'Yes. Add a Split AC Jet-Pump Wash to the cart and all three are done together.'], FQ.appl], 'Popular');
  S('appl', 'wm-top', 'Washing Machine Descaling (Top Load)', 'वॉशिंग मशीन डिस्केलिंग (टॉप लोड)', '🧺', 599, 849, 4.7, 6120, 60,
    'Removes scale, soap residue and odour from the drum and tub of top load machines.',
    ['Drum and tub descaling', 'Detergent tray and filter cleaning', 'Hose and rubber seal wipe', 'Sanitising wash cycle'],
    ['Part replacement', 'Drain pump work'],
    [['How often should I descale?', 'Every 6 months, or when clothes start smelling damp.'], FQ.appl], '');
  S('appl', 'wm-front', 'Washing Machine Descaling (Front Load)', 'वॉशिंग मशीन डिस्केलिंग (फ्रंट लोड)', '🌀', 749, 1049, 4.7, 4310, 75,
    'Deep cleaning of the drum, door seal and drawer in front load machines.',
    ['Drum descaling', 'Rubber door seal and glass cleaning', 'Detergent drawer cleaning', 'Sanitising wash cycle'],
    ['Part replacement', 'Drain pump work'],
    [['Why does my front load machine smell?', 'Moisture and soap collect behind the door seal. Cleaning removes the build-up and the smell.'], FQ.appl], '');
  S('appl', 'geyser', 'Water Geyser Descaling', 'गीज़र डिस्केलिंग', '♨️', 499, 749, 4.6, 5170, 45,
    'Removes hard-water scale from the geyser tank for faster heating.',
    ['Tank descaling', 'Heating element scale removal', 'Outer body cleaning'],
    ['Part replacement', 'Wiring work'],
    [['How do I know my geyser needs descaling?', 'Slow heating and a higher power bill are common signs of scale build-up.'], FQ.appl], '');
  S('appl', 'dispenser', 'Water Dispenser Cleaning', 'वाटर डिस्पेंसर की सफाई', '🚰', 449, 649, 4.5, 1820, 40,
    'Sanitising wash for the tank, taps and drip tray of water dispensers and coolers.',
    ['Tank and tap cleaning', 'Drip tray cleaning', 'Sanitiser flush', 'Outer body wipe'],
    ['Part replacement', 'Cooling system work'],
    [['How often should a dispenser be cleaned?', 'Every 3 months for safe drinking water.'], FQ.appl], '');
  S('appl', 'cooler', 'Air Cooler Deep Cleaning', 'एयर कूलर डीप क्लीनिंग', '🌀', 349, 499, 4.4, 1360, 40,
    'Tank, pad, pump and body cleaning that brings back strong cooling and removes smell.',
    ['Tank and body cleaning', 'Cooling pad cleaning', 'Fan blade cleaning', 'Odour removal'],
    ['Pump or motor replacement', 'Pad replacement'],
    [['When should I clean my cooler?', 'Before summer, and every month in heavy use, to avoid smell and dust.'], FQ.appl], '');

  /* ---------------- FLOOR, WINDOW & BALCONY ---------------- */
  S('floor', 'scrub500', 'Floor Machine Scrubbing (up to 500 sq ft)', 'फ्लोर मशीन स्क्रबिंग (500 वर्ग फुट तक)', '🧹', 1499, 1999, 4.7, 6320, 120,
    'Machine scrubbing that lifts deep dirt and marks from tile and stone floors.',
    ['Dry sweeping and vacuuming', 'Machine scrubbing with floor cleaner', 'Stain and mark removal', 'Wet vacuum and final wipe'],
    ['Polishing or crystallisation', 'Removal of heavy cement stains'],
    [['Does it suit tile and marble?', 'Yes. We use pads and cleaners matched to your floor type.'], FQ.floor], 'Popular');
  S('floor', 'scrub1000', 'Floor Machine Scrubbing (500-1000 sq ft)', 'फ्लोर मशीन स्क्रबिंग (500–1000 वर्ग फुट)', '🧽', 2499, 3299, 4.6, 3180, 180,
    'Machine scrubbing for larger apartments and big halls.',
    ['Dry sweeping and vacuuming', 'Machine scrubbing with floor cleaner', 'Stain and mark removal', 'Wet vacuum and final wipe'],
    ['Polishing or crystallisation', 'Removal of heavy cement stains'],
    [['Can you clean in one visit?', 'Yes. A team of 2 experts finishes up to 1000 sq ft in one visit.'], FQ.floor], '');
  S('floor', 'marble', 'Marble Floor Cleaning & Shine', 'मार्बल फ्लोर क्लीनिंग और शाइन', '✨', 1799, 2399, 4.6, 2640, 150,
    'Deep cleaning of marble floors with light buffing for a brighter finish.',
    ['Dust removal', 'Machine scrubbing', 'Stain and mark treatment', 'Buffing for shine'],
    ['Diamond polishing', 'Crack filling'],
    [['Will it remove deep scratches?', 'No. This is a deep clean with light buffing and does not remove deep scratches.'], FQ.floor], '');
  S('floor', 'window10', 'Window Glass Cleaning (up to 10 panes)', 'खिड़की के शीशे की सफाई (10 पैन तक)', '🏙️', 499, 699, 4.7, 7380, 60,
    'Streak-free cleaning of window glass, frames and tracks.',
    ['Glass cleaning on reachable sides', 'Frame and track cleaning', 'Grill dusting', 'Streak-free wipe'],
    ['Outside glass above the first floor without safe access', 'Net or mesh replacement'],
    [['What counts as a pane?', 'One glass section of a window. A 3-sliding window is usually 3 panes.'], FQ.floor], 'Bestseller');
  S('floor', 'window25', 'Window Glass Cleaning (up to 25 panes)', 'खिड़की के शीशे की सफाई (25 पैन तक)', '🌆', 999, 1399, 4.7, 3950, 100,
    'Glass, frame and track cleaning for larger apartments.',
    ['Glass cleaning on reachable sides', 'Frame and track cleaning', 'Grill dusting', 'Streak-free wipe'],
    ['Outside glass above the first floor without safe access', 'Net or mesh replacement'],
    [['Do you clean window tracks?', 'Yes. Dust and dirt are removed from every track.'], FQ.floor], '');
  S('floor', 'balcony', 'Balcony Deep Cleaning', 'बालकनी डीप क्लीनिंग', '🌇', 599, 849, 4.7, 6720, 60,
    'Scrubbing of the balcony floor, railing, grill and glass.',
    ['Floor scrubbing', 'Railing and grill cleaning', 'Glass and door cleaning', 'Corner and plant pot dusting'],
    ['Moving of heavy furniture', 'Cleaning outside the balcony railing'],
    [['Do you clean balcony grills?', 'Yes. Grills and railings are wiped down and dusted.'], FQ.floor], 'Popular');
  S('floor', 'sliding', 'Sliding Door & Glass Track Cleaning', 'स्लाइडिंग डोर और ग्लास ट्रैक सफाई', '🏙️', 449, 649, 4.6, 2140, 45,
    'Glass, frame and track cleaning for balcony sliding doors and glass partitions.',
    ['Glass wiping with a squeegee', 'Track and frame cleaning', 'Spot and water-mark removal'],
    ['Cleaning that needs rope access or cradles', 'Film or sticker removal'],
    [['Do you clean the bottom tracks?', 'Yes. Dust and dirt are removed from every track.'], FQ.floor], '');
  S('floor', 'grill', 'Balcony Grill & Railing Cleaning', 'बालकनी ग्रिल और रेलिंग सफाई', '🌇', 399, 549, 4.5, 1580, 40,
    'Dust, bird-dropping and stain removal from balcony grills and railings.',
    ['Grill and railing scrubbing', 'Dust and bird-dropping removal', 'Final wipe'],
    ['Cleaning that needs rope access or cradles', 'Removal of rust'],
    [['Is this safe on higher floors?', 'We clean only the parts reachable from inside the balcony. We do not climb outside the railing.'], FQ.floor], '');

  /* ---------------- FANS, WARDROBES & DUSTING ---------------- */
  S('dust', 'fan1', 'Ceiling Fan Cleaning (per fan)', 'सीलिंग फैन सफाई (प्रति पंखा)', '🌀', 99, 149, 4.7, 12340, 15,
    'Quick cleaning of fan blades, motor cover and rod without making a mess.',
    ['Blade cleaning on both sides', 'Motor cover and rod wipe', 'Dust catching with a cover'],
    ['Part replacement', 'Fans above 12 feet height'],
    [['Will dust fall on my bed?', 'No. The expert uses a cover bag that catches the dust.'], FQ.dust], 'Popular');
  S('dust', 'fan4', 'Ceiling Fan Cleaning (4 fans pack)', 'सीलिंग फैन सफाई (4 पंखे पैक)', '🌀', 349, 499, 4.7, 6120, 50,
    'Pack price for cleaning four ceiling fans in one visit.',
    ['Blade cleaning on both sides', 'Motor cover and rod wipe', 'Dust catching with a cover'],
    ['Part replacement', 'Fans above 12 feet height'],
    [['Can I add more fans?', 'Yes. Add a single fan cleaning for each extra fan.'], FQ.dust], '');
  S('dust', 'wardrobe', 'Wardrobe Inside Cleaning (per wardrobe)', 'अलमारी के अंदर की सफाई (प्रति अलमारी)', '🗄️', 399, 599, 4.6, 3450, 40,
    'Dust and odour removal from the inside of wardrobes, shelves and drawers.',
    ['Inside and shelf wiping', 'Drawer cleaning', 'Odour removal', 'Corner dusting'],
    ['Re-arranging of clothes', 'Cleaning of stored items'],
    [['Do I need to empty the wardrobe?', 'Yes. Please empty the shelves so we can clean every corner. We do not touch your belongings.'], FQ.dust], '');
  S('dust', 'light', 'Light & Chandelier Cleaning (per room)', 'लाइट और झूमर सफाई (प्रति कमरा)', '💡', 249, 349, 4.5, 1810, 30,
    'Careful dusting and wiping of lights, shades and chandeliers.',
    ['Shade and bulb cover wiping', 'Chandelier dusting', 'Tube light and panel cleaning'],
    ['Wiring work', 'Replacement of bulbs or parts'],
    [['Is it safe for glass chandeliers?', 'Yes. We use a soft dry or damp cloth and handle each piece gently.'], FQ.dust], '');
  S('dust', 'cobweb', 'Cobweb & Ceiling Dusting (per room)', 'जाले और सीलिंग की सफाई (प्रति कमरा)', '🧹', 249, 349, 4.6, 4230, 30,
    'Removes cobwebs and dust from ceilings, corners and cornices.',
    ['Cobweb removal', 'Ceiling and corner dusting', 'Cornice dusting'],
    ['Wall washing', 'Ceilings above 12 feet height'],
    [['Does it cover the walls?', 'It covers ceilings and corners. Add Wall Dusting & Spot Cleaning for the walls.'], FQ.dust], '');
  S('dust', 'door', 'Door, Grill & Switchboard Cleaning', 'दरवाज़ा, ग्रिल और स्विचबोर्ड सफाई', '🚪', 599, 849, 4.5, 2680, 60,
    'Wipe-down of doors, window grills, handles and switchboards across the home.',
    ['Door and frame wiping', 'Window grill cleaning', 'Handle and lock polish', 'Switchboard wipe'],
    ['Polishing of wood', 'Rust removal'],
    [['How many doors are covered?', 'Up to 6 doors and all window grills in a 2 BHK. Extra doors can be added at the visit.'], FQ.dust], '');
  S('dust', 'shoe', 'Shoe Rack & Entrance Cleaning', 'शू रैक और एंट्रेंस की सफाई', '🚪', 199, 299, 4.4, 960, 20,
    'Cleaning of the shoe rack, entrance floor and door area.',
    ['Shoe rack wiping', 'Entrance floor scrubbing', 'Door and nameplate wipe', 'Odour removal'],
    ['Cleaning of shoes', 'Re-arranging of belongings'],
    [['Does it include shoes?', 'No. We clean the rack and entrance. Shoes are put back as they were.'], FQ.dust], '');
  S('dust', 'wall', 'Wall Dusting & Spot Cleaning (per room)', 'दीवार की धूल और दाग की सफाई (प्रति कमरा)', '🧽', 349, 499, 4.5, 1740, 40,
    'Dry dusting and gentle spot cleaning of walls, skirting and frames.',
    ['Dry dusting of walls', 'Spot cleaning of marks', 'Skirting and photo frame wiping'],
    ['Wall washing', 'Removal of permanent stains'],
    [['Can it remove pen or crayon marks?', 'Most light marks come off. Stains on porous walls may stay faintly.'], FQ.dust], '');

  /* ---------------- SPECIAL & PLAN CLEANING ---------------- */
  S('special', 'move', 'Move-in Cleaning (Empty Flat)', 'मूव-इन क्लीनिंग (खाली फ्लैट)', '📦', 3499, 4699, 4.7, 4410, 360,
    'Get a new or empty flat ready to settle in with a full deep clean.',
    ['Empty-flat floor machine wash', 'Inside of cupboards and shelves', 'Kitchen and bathroom deep cleaning', 'Window, grill and door cleaning', 'Switchboard and fitting wipe-down'],
    ['Packing or moving of belongings', 'Debris removal'],
    [['Should the flat be empty?', 'An empty or almost empty flat gives the best result.'], FQ.special], '');
  S('special', 'handover', 'Rental Handover Cleaning', 'रेंटल हैंडओवर क्लीनिंग', '🔑', 2999, 3999, 4.7, 2850, 300,
    'Clean the flat to handover standard before returning it to the owner.',
    ['Floor machine wash', 'Kitchen and bathroom deep cleaning', 'Cupboard and shelf cleaning', 'Window, grill and door cleaning'],
    ['Wall touch-ups', 'Debris removal'],
    [['Will it help me get my deposit back?', 'A clean flat helps, but the deposit depends on the owner and the condition of the flat.'], FQ.special], 'Popular');
  S('special', 'reno', 'Post-Renovation Dust Cleaning', 'रेनोवेशन के बाद की सफाई', '🧱', 4999, 6499, 4.5, 2890, 480,
    'Removes fine dust and cement marks after renovation work is finished.',
    ['Fine dust removal from all surfaces', 'Cement and stain removal from floors and tiles', 'Window and glass cleaning', 'Kitchen and bathroom fitting cleaning', 'Final mop and shine'],
    ['Debris or rubble removal', 'Removal of permanent stains on natural stone'],
    [['How soon after the work can you come?', 'Once the work is complete and the debris is removed, we can clean the next day.'], FQ.special], '');
  S('special', 'festival', 'Festival Deep Cleaning (Diwali Special)', 'त्योहार स्पेशल डीप क्लीनिंग', '🎆', 3999, 5499, 4.8, 7020, 420,
    'Get your home festival-ready with a full machine deep clean before guests arrive.',
    ['Full-home floor machine wash', 'Kitchen and bathroom deep cleaning', 'Fan, light and window cleaning', 'Puja room and balcony cleaning', 'Cobweb and dust removal'],
    ['Moving of heavy furniture', 'Cleaning of outside walls'],
    [['Should I book early?', 'Yes. Slots fill up quickly in the 2 weeks before Diwali, so book early for your preferred date.'], FQ.special], 'New');
  S('special', 'party', 'Post-Party Cleaning', 'पार्टी के बाद की सफाई', '🎉', 1799, 2399, 4.6, 2140, 150,
    'Quick clean-up of the hall, kitchen and balcony after a party or gathering.',
    ['Floor scrubbing and spot cleaning', 'Table and counter wiping', 'Kitchen and sink cleaning', 'Dustbin clearing', 'Balcony wipe'],
    ['Washing of utensils', 'Disposal of large quantities of waste'],
    [['Can you come the next morning?', 'Yes. Pick a morning slot the day after your party.'], FQ.special], '');
  S('special', 'griha', 'Housewarming (Griha Pravesh) Cleaning', 'गृह प्रवेश क्लीनिंग', '🪔', 3999, 5299, 4.8, 2610, 360,
    'Spotless cleaning of your new flat before the housewarming puja.',
    ['Full-home floor machine wash', 'Puja room cleaning', 'Kitchen and bathroom deep cleaning', 'Window, grill and door cleaning', 'Dust and cobweb removal'],
    ['Decoration or rangoli', 'Debris removal'],
    [['Can you finish before the puja time?', 'Tell us your puja date and time when booking and we will plan the visit to finish early.'], FQ.special], '');
  S('special', 'turnover', 'Short-Stay Rental Turnover Cleaning', 'शॉर्ट-स्टे टर्नओवर क्लीनिंग', '🛎️', 1499, 1999, 4.6, 1370, 120,
    'Fast cleaning between guests for furnished studio and 1 BHK rentals.',
    ['Floor mopping and vacuuming', 'Bathroom and kitchen cleaning', 'Bed area and surface wiping', 'Dustbin clearing'],
    ['Bed linen washing', 'Restocking of supplies'],
    [['Can you come on short notice?', 'Choose the earliest slot available. Slots can be booked on the same day when available.'], FQ.special], '');
  S('special', 'plan', 'Monthly Home Cleaning Plan (4 visits)', 'मंथली होम क्लीनिंग प्लान (4 विज़िट)', '🗓️', 3999, 5499, 4.7, 1980, 120,
    'Four scheduled cleanings a month for homes up to 2 BHK.',
    ['4 scheduled visits per month', 'Floor mopping and dusting', 'Kitchen counter and bathroom cleaning', 'Dustbin clearing'],
    ['Deep machine scrubbing', 'Washing of utensils or clothes'],
    [['Can I choose the visit days?', 'Yes. Tell us your fixed days and time when you book.'], FQ.special], 'Bestseller');

  var D = {
    brand: {
      name: 'Bharat Pro Expert',
      tagline: 'Ghar ki safai, Bharat ke apne Experts',
      phone: '+91 89202 52647',
      email: 'bharatproexpert@gmail.com',
      companyEmail: 'bharatproexperthomeservices@gmail.com',
      city: 'Gurgaon'
    },

    gstDetails: {
      gstin: '06FCUPM9518L1ZM',
      businessName: 'Bharat Pro Expert home services',
      legalName: 'ANIL KUMAR',
      address: 'Unit No. 309, 3rd Floor, Tower A, SAS Tower, Medicity, Sector 38, Gurugram, Haryana, 122001'
    },

    cities: ['Gurgaon', 'Delhi', 'Noida', 'Patna', 'Jale (Darbhanga)', 'Darbhanga', 'Muzaffarpur', 'Gaya'],

    categories: [
      { id: 'deep', name: 'Home Deep Cleaning', nameHi: 'होम डीप क्लीनिंग', emoji: '🏠', g1: '#34C759', g2: '#30B0C7', blurb: 'Full apartment, studio, single room and empty flat cleaning' },
      { id: 'bath', name: 'Bathroom Cleaning', nameHi: 'बाथरूम सफाई', emoji: '🚿', g1: '#5AC8FA', g2: '#007AFF', blurb: 'Bathroom, toilet, tile, shower glass and fittings cleaning' },
      { id: 'kitchen', name: 'Kitchen Cleaning', nameHi: 'किचन सफाई', emoji: '🍳', g1: '#FF9F0A', g2: '#FF6B35', blurb: 'Kitchen, chimney, cabinet, fridge and microwave cleaning' },
      { id: 'sofa', name: 'Sofa & Carpet', nameHi: 'सोफा और कारपेट', emoji: '🛋️', g1: '#BF5AF2', g2: '#5E5CE6', blurb: 'Sofa, carpet, mattress and curtain cleaning' },
      { id: 'appl', name: 'Appliance Cleaning', nameHi: 'अप्लायंस सफाई', emoji: '❄️', g1: '#64D2FF', g2: '#0A84FF', blurb: 'AC, washing machine, geyser, dispenser and cooler cleaning' },
      { id: 'floor', name: 'Floor & Window', nameHi: 'फर्श और खिड़की', emoji: '✨', g1: '#FFD60A', g2: '#FF9500', blurb: 'Floor scrubbing, window, balcony and sliding door cleaning' },
      { id: 'dust', name: 'Fans & Wardrobes', nameHi: 'पंखे और अलमारी', emoji: '🌀', g1: '#30D158', g2: '#00C7BE', blurb: 'Ceiling fan, wardrobe, light, cobweb and door cleaning' },
      { id: 'special', name: 'Move-in & Special', nameHi: 'मूव-इन और स्पेशल', emoji: '🎆', g1: '#FF6482', g2: '#FF453A', blurb: 'Move-in, renovation, festival, party and monthly plans' }
    ],

    services: services,

    sections: [
      { id: 'sec-deep', title: 'Full Home Deep Cleaning', titleHi: 'पूरे घर की डीप क्लीनिंग', cat: 'deep' },
      { id: 'sec-bath', title: 'Bathroom Cleaning', titleHi: 'बाथरूम की सफाई', cat: 'bath' },
      { id: 'sec-kitchen', title: 'Kitchen Cleaning', titleHi: 'किचन की सफाई', cat: 'kitchen' },
      { id: 'sec-sofa', title: 'Sofa, Carpet & Mattress Cleaning', titleHi: 'सोफा, कारपेट और गद्दे की सफाई', cat: 'sofa' },
      { id: 'sec-appl', title: 'Appliance Cleaning', titleHi: 'अप्लायंस की सफाई', cat: 'appl' },
      { id: 'sec-floor', title: 'Floor, Window & Balcony Cleaning', titleHi: 'फर्श, खिड़की और बालकनी की सफाई', cat: 'floor' },
      { id: 'sec-dust', title: 'Fans, Wardrobes & Dusting', titleHi: 'पंखे, अलमारी और धूल की सफाई', cat: 'dust' },
      { id: 'sec-special', title: 'Move-in, Festival & Monthly Plans', titleHi: 'मूव-इन, त्योहार और मंथली प्लान', cat: 'special' }
    ],

    heroSlides: [
      { id: 'h1', title: 'Apartment deep cleaning from ₹2,199', sub: 'Machines and eco-safe chemicals by trained experts', emoji: '🏠', g1: '#34C759', g2: '#30B0C7', cta: 'Book Deep Cleaning', cat: 'deep' },
      { id: 'h2', title: 'Bathroom cleaning from ₹499', sub: 'Spotless tiles, taps and fittings in 45 minutes', emoji: '🚿', g1: '#5AC8FA', g2: '#007AFF', cta: 'Book Bathroom Cleaning', cat: 'bath' },
      { id: 'h3', title: 'Kitchen cleaning from ₹1,299', sub: 'Degreasing of counters, hob, tiles and cabinets', emoji: '🍳', g1: '#FF9F0A', g2: '#FF6B35', cta: 'Book Kitchen Cleaning', cat: 'kitchen' },
      { id: 'h4', title: 'Sofa cleaning from ₹249 per seat', sub: 'Shampoo cleaning that removes dust, mites and stains', emoji: '🛋️', g1: '#BF5AF2', g2: '#5E5CE6', cta: 'Book Sofa Cleaning', cat: 'sofa' }
    ],

    promo: {
      title: 'Flat ₹100 off on your first cleaning',
      sub: 'New to Bharat Pro Expert? Use the code at checkout on orders above ₹299.',
      cta: 'Claim Offer',
      code: 'FIRST100'
    },

    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],

    coupons: [
      { code: 'FIRST100', label: 'Flat ₹100 off on first booking', type: 'flat', value: 100, min: 299 },
      { code: 'BPE10', label: '10% off up to ₹150', type: 'pct', value: 10, min: 499 },
      { code: 'BHARAT50', label: 'Flat ₹50 off', type: 'flat', value: 50, min: 199 }
    ],

    howItWorks: [
      { emoji: '🔍', title: 'Choose a cleaning', sub: 'Pick from 60+ cleaning services' },
      { emoji: '📅', title: 'Select date & time', sub: 'Book a slot that suits you' },
      { emoji: '💳', title: '100% Online Payment', sub: 'Pay securely via UPI, Cards, or NetBanking' },
      { emoji: '🧹', title: 'Experts arrive', sub: 'A trained team brings machines and chemicals' }
    ],

    trust: [
      { emoji: '🛡️', title: 'Verified Experts', sub: 'Background-checked and trained cleaners' },
      { emoji: '🌿', title: 'Eco-safe Chemicals', sub: 'Safe for kids, elders and pets' },
      { emoji: '🔁', title: 'Free Re-clean', sub: 'We clean again if you are not satisfied' },
      { emoji: '📞', title: 'Local Support', sub: 'Call us anytime on +91 89202 52647' }
    ],

    faqs: [
      { q: 'How do I book a cleaning?', a: 'Choose a service, add it to the cart, pick a date and time slot, enter your address and pay online. It takes under two minutes.' },
      { q: 'When do I pay?', a: 'All bookings require 100% online payment (UPI, Credit/Debit Cards, NetBanking) at the time of booking to confirm your slot.' },
      { q: 'What do I need to arrange?', a: 'Please keep water and a power point ready and tell your society guard about the visit. Our experts carry ID cards and bring the machines, tools and chemicals.' },
      { q: 'Are the chemicals safe for kids and pets?', a: 'We use eco-safe, skin-friendly products. Keep pets in another room until the surfaces dry.' },
      { q: 'How long does a deep cleaning take?', a: 'A 2 BHK apartment takes about 7 hours with a team of 2 to 4 experts. The exact time is shown on each service page.' },
      { q: 'Can I reschedule or cancel a booking?', a: 'Yes. From the Bookings page you can reschedule or cancel free of charge up to 2 hours before the slot.' },
      { q: 'What if I am not satisfied with the cleaning?', a: 'Tell us within 48 hours and we will send the team again to clean the missed spots free of charge.' },
      { q: 'How can I become a partner expert?', a: 'Open the Partner page, fill the short form and our team will call you for verification and training.' }
    ],

    testimonials: [
      { name: 'Priya Sharma', city: 'Gurgaon', text: 'Booked a 2 BHK deep cleaning before Diwali. The team was on time and the floors and kitchen look brand new.', rating: 5 },
      { name: 'Rahul Verma', city: 'Noida', text: 'The kitchen and chimney cleaning was very thorough. Fair price and no hidden charges.', rating: 5 },
      { name: 'Sunita Devi', city: 'Patna', text: 'Sofa and mattress cleaning removed years of stains. The expert explained every step.', rating: 4 },
      { name: 'Amit Kumar', city: 'Darbhanga', text: 'Bathroom and kitchen cleaning in my flat was spotless. The experts were polite and careful with the furniture.', rating: 5 }
    ]
  };

  window.BPE_DATA = D;
}());
