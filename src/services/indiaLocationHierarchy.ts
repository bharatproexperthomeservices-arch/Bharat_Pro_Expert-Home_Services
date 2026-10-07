/**
 * BHARAT PRO EXPERT - COMPREHENSIVE INDIA-WIDE LOCATION & SERVICEABILITY ENGINE
 * 
 * Supports complete Indian administrative hierarchy:
 * INDIA -> STATE / UT -> DISTRICT -> SUB-DISTRICT / TEHSIL -> CITY / TOWN -> LOCALITY -> SECTOR -> PINCODE -> LAT/LNG -> HUB
 * 
 * Includes all 28 States + 8 Union Territories
 * Device GPS detection + Reverse Geocoding + Country Validation + Nearest Hub Distance
 */

export interface IndiaAdministrativeUnit {
  country: 'India';
  state: string;
  isUnionTerritory: boolean;
  stateCode: string;
  capital: string;
  districts: string[];
  popularCities: string[];
}

export interface ResolvedCustomerLocation {
  country: string;
  isIndia: boolean;
  state: string;
  district: string;
  subDistrict?: string;
  city: string;
  locality?: string;
  sector?: string;
  flatOrTower?: string;
  buildingOrStreet?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  formattedAddress: string;
  serviceable: boolean;
  serviceTier: 'TIER_1_EXPRESS' | 'TIER_2_STANDARD' | 'TIER_3_ON_DEMAND';
  nearestHub: {
    id: string;
    name: string;
    city: string;
    state: string;
    distanceKm: number;
    estimatedArrivalMins: number;
  };
}

// Master Database of All 28 Indian States
export const ALL_INDIAN_STATES: IndiaAdministrativeUnit[] = [
  {
    country: 'India',
    state: 'Andhra Pradesh',
    isUnionTerritory: false,
    stateCode: 'AP',
    capital: 'Amaravati',
    districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Anantapur', 'Kadapa', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal'],
    popularCities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool']
  },
  {
    country: 'India',
    state: 'Arunachal Pradesh',
    isUnionTerritory: false,
    stateCode: 'AR',
    capital: 'Itanagar',
    districts: ['Papum Pare', 'Changlang', 'West Kameng', 'East Siang', 'Tirap', 'Tawang', 'Lower Subansiri', 'Namsai'],
    popularCities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro']
  },
  {
    country: 'India',
    state: 'Assam',
    isUnionTerritory: false,
    stateCode: 'AS',
    capital: 'Dispur',
    districts: ['Kamrup Metropolitan', 'Kamrup', 'Dibrugarh', 'Cachar', 'Nagaon', 'Jorhat', 'Sonitpur', 'Tinsukia', 'Barpeta', 'Dhubri'],
    popularCities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur']
  },
  {
    country: 'India',
    state: 'Bihar',
    isUnionTerritory: false,
    stateCode: 'BR',
    capital: 'Patna',
    districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Rohtas', 'Begusarai', 'Saran', 'Nalanda', 'Vaishali', 'Samastipur', 'Bhojpur', 'Siwan', 'East Champaran', 'West Champaran', 'Madhubani', 'Munger'],
    popularCities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Bihar Sharif', 'Arrah', 'Begusarai']
  },
  {
    country: 'India',
    state: 'Chhattisgarh',
    isUnionTerritory: false,
    stateCode: 'CG',
    capital: 'Raipur',
    districts: ['Raipur', 'Durg', 'Bilaspur', 'Rajnandgaon', 'Korba', 'Raigarh', 'Jagdalpur', 'Dhamtari', 'Surguja'],
    popularCities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon']
  },
  {
    country: 'India',
    state: 'Goa',
    isUnionTerritory: false,
    stateCode: 'GA',
    capital: 'Panaji',
    districts: ['North Goa', 'South Goa'],
    popularCities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute', 'Candolim']
  },
  {
    country: 'India',
    state: 'Gujarat',
    isUnionTerritory: false,
    stateCode: 'GJ',
    capital: 'Gandhinagar',
    districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Kutch', 'Anand', 'Bharuch', 'Mehsana', 'Navsari', 'Valsad', 'Morbi'],
    popularCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Anand']
  },
  {
    country: 'India',
    state: 'Haryana',
    isUnionTerritory: false,
    stateCode: 'HR',
    capital: 'Chandigarh',
    districts: ['Gurugram', 'Faridabad', 'Sonipat', 'Panipat', 'Ambala', 'Karnal', 'Rohtak', 'Hisar', 'Panchkula', 'Yamunanagar', 'Rewari', 'Jhajjar', 'Bhiwani', 'Sirsa', 'Kurukshetra', 'Palwal'],
    popularCities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Panchkula', 'Karnal', 'Sonipat', 'Rohtak', 'Hisar', 'Manesar']
  },
  {
    country: 'India',
    state: 'Himachal Pradesh',
    isUnionTerritory: false,
    stateCode: 'HP',
    capital: 'Shimla',
    districts: ['Shimla', 'Kangra', 'Mandi', 'Solan', 'Kullu', 'Sirmaur', 'Hamirpur', 'Una', 'Chamba', 'Bilaspur', 'Kinnaur', 'Lahaul and Spiti'],
    popularCities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Baddi', 'Palampur']
  },
  {
    country: 'India',
    state: 'Jharkhand',
    isUnionTerritory: false,
    stateCode: 'JH',
    capital: 'Ranchi',
    districts: ['Ranchi', 'East Singhbhum', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Palamu', 'Dumka'],
    popularCities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh', 'Giridih']
  },
  {
    country: 'India',
    state: 'Karnataka',
    isUnionTerritory: false,
    stateCode: 'KA',
    capital: 'Bengaluru',
    districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dakshina Kannada', 'Belagavi', 'Dharwad', 'Kalaburagi', 'Ballari', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan', 'Davangere', 'Vijayapura'],
    popularCities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Shivamogga', 'Tumakuru', 'Udupi']
  },
  {
    country: 'India',
    state: 'Kerala',
    isUnionTerritory: false,
    stateCode: 'KL',
    capital: 'Thiruvananthapuram',
    districts: ['Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Malappuram', 'Kannur', 'Alappuzha', 'Kottayam', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad'],
    popularCities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad']
  },
  {
    country: 'India',
    state: 'Madhya Pradesh',
    isUnionTerritory: false,
    stateCode: 'MP',
    capital: 'Bhopal',
    districts: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Singrauli', 'Chhindwara'],
    popularCities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam']
  },
  {
    country: 'India',
    state: 'Maharashtra',
    isUnionTerritory: false,
    stateCode: 'MH',
    capital: 'Mumbai',
    districts: ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Palghar', 'Raigad', 'Satara', 'Sangli', 'Nanded', 'Jalgaon'],
    popularCities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Navi Mumbai', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Kalyan-Dombivli']
  },
  {
    country: 'India',
    state: 'Manipur',
    isUnionTerritory: false,
    stateCode: 'MN',
    capital: 'Imphal',
    districts: ['Imphal West', 'Imphal East', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Ukhrul', 'Kakching'],
    popularCities: ['Imphal', 'Thoubal', 'Churachandpur', 'Kakching', 'Bishnupur']
  },
  {
    country: 'India',
    state: 'Meghalaya',
    isUnionTerritory: false,
    stateCode: 'ML',
    capital: 'Shillong',
    districts: ['East Khasi Hills', 'West Garo Hills', 'Ri-Bhoi', 'West Khasi Hills', 'East Jaintia Hills', 'West Jaintia Hills'],
    popularCities: ['Shillong', 'Tura', 'Nongpoh', 'Jowai', 'Cherrapunji']
  },
  {
    country: 'India',
    state: 'Mizoram',
    isUnionTerritory: false,
    stateCode: 'MZ',
    capital: 'Aizawl',
    districts: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit'],
    popularCities: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip']
  },
  {
    country: 'India',
    state: 'Nagaland',
    isUnionTerritory: false,
    stateCode: 'NL',
    capital: 'Kohima',
    districts: ['Dimapur', 'Kohima', 'Mokokchung', 'Wokha', 'Mon', 'Tuensang', 'Zunheboto', 'Chumoukedima'],
    popularCities: ['Dimapur', 'Kohima', 'Mokokchung', 'Chumoukedima', 'Tuensang']
  },
  {
    country: 'India',
    state: 'Odisha',
    isUnionTerritory: false,
    stateCode: 'OD',
    capital: 'Bhubaneswar',
    districts: ['Khordha', 'Cuttack', 'Sundargarh', 'Ganjam', 'Balasore', 'Puri', 'Sambalpur', 'Bhadrak', 'Angul', 'Jajpur', 'Jharsuguda'],
    popularCities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore']
  },
  {
    country: 'India',
    state: 'Punjab',
    isUnionTerritory: false,
    stateCode: 'PB',
    capital: 'Chandigarh',
    districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'SAS Nagar (Mohali)', 'Bathinda', 'Hoshiarpur', 'Pathankot', 'Moga', 'Firozpur', 'Sangrur'],
    popularCities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali', 'Bathinda', 'Hoshiarpur', 'Pathankot']
  },
  {
    country: 'India',
    state: 'Rajasthan',
    isUnionTerritory: false,
    stateCode: 'RJ',
    capital: 'Jaipur',
    districts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar'],
    popularCities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar']
  },
  {
    country: 'India',
    state: 'Sikkim',
    isUnionTerritory: false,
    stateCode: 'SK',
    capital: 'Gangtok',
    districts: ['East Sikkim (Gangtok)', 'West Sikkim (Gyalshing)', 'North Sikkim (Mangan)', 'South Sikkim (Namchi)'],
    popularCities: ['Gangtok', 'Namchi', 'Gyalshing', 'Rangpo', 'Singtam']
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    isUnionTerritory: false,
    stateCode: 'TN',
    capital: 'Chennai',
    districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Tirunelveli', 'Kanchipuram', 'Chengalpattu', 'Dindigul', 'Thanjavur'],
    popularCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli']
  },
  {
    country: 'India',
    state: 'Telangana',
    isUnionTerritory: false,
    stateCode: 'TG',
    capital: 'Hyderabad',
    districts: ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Warangal', 'Hanamkonda', 'Karimnagar', 'Nizamabad', 'Khammam', 'Nalgonda', 'Mahabubnagar', 'Siddipet', 'Sangareddy'],
    popularCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad', 'Ramagundam', 'Siddipet']
  },
  {
    country: 'India',
    state: 'Tripura',
    isUnionTerritory: false,
    stateCode: 'TR',
    capital: 'Agartala',
    districts: ['West Tripura', 'South Tripura', 'Gomati', 'North Tripura', 'Dhalai', 'Unakoti', 'Khowai', 'Sepahijala'],
    popularCities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia']
  },
  {
    country: 'India',
    state: 'Uttar Pradesh',
    isUnionTerritory: false,
    stateCode: 'UP',
    capital: 'Lucknow',
    districts: ['Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Lucknow', 'Kanpur Nagar', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Ayodhya', 'Mathura', 'Jhansi', 'Muzaffarnagar'],
    popularCities: ['Noida', 'Greater Noida', 'Ghaziabad', 'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Gorakhpur', 'Ayodhya', 'Mathura', 'Bareilly']
  },
  {
    country: 'India',
    state: 'Uttarakhand',
    isUnionTerritory: false,
    stateCode: 'UK',
    capital: 'Dehradun',
    districts: ['Dehradun', 'Haridwar', 'Udham Singh Nagar', 'Nainital', 'Pauri Garhwal', 'Tehri Garhwal', 'Almora', 'Chamoli', 'Rudraprayag', 'Pithoragarh', 'Uttarkashi'],
    popularCities: ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Rudrapur', 'Nainital', 'Mussoorie']
  },
  {
    country: 'India',
    state: 'West Bengal',
    isUnionTerritory: false,
    stateCode: 'WB',
    capital: 'Kolkata',
    districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Paschim Bardhaman', 'Purba Bardhaman', 'Darjeeling', 'Jalpaiguri', 'Nadia', 'Murshidabad', 'Malda'],
    popularCities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kalyani', 'Kharagpur', 'Darjeeling']
  }
];

// Master Database of All 8 Union Territories
export const ALL_INDIAN_UNION_TERRITORIES: IndiaAdministrativeUnit[] = [
  {
    country: 'India',
    state: 'Andaman and Nicobar Islands',
    isUnionTerritory: true,
    stateCode: 'AN',
    capital: 'Port Blair',
    districts: ['South Andaman', 'North and Middle Andaman', 'Nicobar'],
    popularCities: ['Port Blair', 'Diglipur', 'Mayabunder', 'Garacharma']
  },
  {
    country: 'India',
    state: 'Chandigarh',
    isUnionTerritory: true,
    stateCode: 'CH',
    capital: 'Chandigarh',
    districts: ['Chandigarh'],
    popularCities: ['Chandigarh (Sector 1-60)']
  },
  {
    country: 'India',
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    isUnionTerritory: true,
    stateCode: 'DNHDD',
    capital: 'Daman',
    districts: ['Daman', 'Diu', 'Dadra and Nagar Haveli'],
    popularCities: ['Daman', 'Diu', 'Silvassa']
  },
  {
    country: 'India',
    state: 'Delhi',
    isUnionTerritory: true,
    stateCode: 'DL',
    capital: 'New Delhi',
    districts: ['South Delhi', 'South West Delhi', 'Central Delhi', 'New Delhi', 'North Delhi', 'North West Delhi', 'West Delhi', 'East Delhi', 'North East Delhi', 'Shahdara', 'South East Delhi'],
    popularCities: ['New Delhi', 'South Delhi (Saket/GK/Hauz Khas)', 'Connaught Place', 'Dwarka', 'Rohini', 'Vasant Kunj', 'Janakpuri', 'Lajpat Nagar', 'Pitampura']
  },
  {
    country: 'India',
    state: 'Jammu and Kashmir',
    isUnionTerritory: true,
    stateCode: 'JK',
    capital: 'Srinagar / Jammu',
    districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Udhampur', 'Budgam', 'Pulwama'],
    popularCities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Katra']
  },
  {
    country: 'India',
    state: 'Ladakh',
    isUnionTerritory: true,
    stateCode: 'LA',
    capital: 'Leh',
    districts: ['Leh', 'Kargil'],
    popularCities: ['Leh', 'Kargil', 'Nubra Valley']
  },
  {
    country: 'India',
    state: 'Lakshadweep',
    isUnionTerritory: true,
    stateCode: 'LD',
    capital: 'Kavaratti',
    districts: ['Lakshadweep'],
    popularCities: ['Kavaratti', 'Agatti', 'Andrott', 'Minicoy']
  },
  {
    country: 'India',
    state: 'Puducherry',
    isUnionTerritory: true,
    stateCode: 'PY',
    capital: 'Puducherry',
    districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    popularCities: ['Puducherry (White Town/Heritage)', 'Karaikal', 'Ozhukarai']
  }
];

export const MASTER_ALL_INDIA_REGIONS: IndiaAdministrativeUnit[] = [
  ...ALL_INDIAN_STATES,
  ...ALL_INDIAN_UNION_TERRITORIES
];

// Operational BPE Micro-Hubs with high accuracy coordinates
export interface OperationalHub {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  radiusKm: number;
  expressDispatch: boolean;
  contactPhone: string;
}

export const OPERATIONAL_BPE_HUBS: OperationalHub[] = [
  {
    id: 'hub_delhi_ncr_gurugram',
    name: 'BPE DLF CyberCity Hub',
    city: 'Gurugram',
    state: 'Haryana',
    lat: 28.4595,
    lng: 77.0266,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_delhi_south',
    name: 'BPE South Delhi Hub',
    city: 'South Delhi',
    state: 'Delhi',
    lat: 28.5355,
    lng: 77.2185,
    radiusKm: 30,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_delhi_central',
    name: 'BPE Connaught Place Hub',
    city: 'Central Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    radiusKm: 30,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_noida_exp',
    name: 'BPE Noida Expressway Hub',
    city: 'Noida',
    state: 'Uttar Pradesh',
    lat: 28.5355,
    lng: 77.3910,
    radiusKm: 30,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_mumbai_metro',
    name: 'BPE Mumbai Western & BKC Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    radiusKm: 40,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_pune_core',
    name: 'BPE Pune Metro Hub',
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_bengaluru_tech',
    name: 'BPE Bengaluru Silicon Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    radiusKm: 45,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_hyderabad_hitech',
    name: 'BPE Hyderabad HITEC City Hub',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3850,
    lng: 78.4867,
    radiusKm: 40,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_chennai_omr',
    name: 'BPE Chennai Central & OMR Hub',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_kolkata_saltlake',
    name: 'BPE Kolkata Salt Lake Hub',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_bihar_patna',
    name: 'BPE Patna Capital Hub',
    city: 'Patna',
    state: 'Bihar',
    lat: 25.5941,
    lng: 85.1376,
    radiusKm: 45,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_jharkhand_ranchi',
    name: 'BPE Ranchi Main Hub',
    city: 'Ranchi',
    state: 'Jharkhand',
    lat: 23.3441,
    lng: 85.3096,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_rajasthan_jaipur',
    name: 'BPE Jaipur Pink City Hub',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_up_lucknow',
    name: 'BPE Lucknow Gomti Nagar Hub',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_chandigarh_tri',
    name: 'BPE Chandigarh Tricity Hub',
    city: 'Chandigarh',
    state: 'Chandigarh',
    lat: 30.7333,
    lng: 76.7794,
    radiusKm: 30,
    expressDispatch: true,
    contactPhone: '+919266023301'
  },
  {
    id: 'hub_gujarat_ahmedabad',
    name: 'BPE Ahmedabad SG Highway Hub',
    city: 'Ahmedabad',
    state: 'Gujarat',
    lat: 23.0225,
    lng: 72.5714,
    radiusKm: 35,
    expressDispatch: true,
    contactPhone: '+919266023301'
  }
];

// Haversine Distance in Kilometers
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find nearest operational BPE Hub
export function findNearestBpeHub(lat: number, lng: number): {
  hub: OperationalHub;
  distanceKm: number;
  serviceable: boolean;
  arrivalMinutes: number;
} {
  let closest = OPERATIONAL_BPE_HUBS[0];
  let minDistance = calculateHaversineKm(lat, lng, closest.lat, closest.lng);

  for (let i = 1; i < OPERATIONAL_BPE_HUBS.length; i++) {
    const hub = OPERATIONAL_BPE_HUBS[i];
    const dist = calculateHaversineKm(lat, lng, hub.lat, hub.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = hub;
    }
  }

  // Arrival calculation: 25 mins base preparation + 2 mins per km
  const arrivalMinutes = Math.min(180, Math.max(30, Math.round(25 + minDistance * 1.8)));

  return {
    hub: closest,
    distanceKm: minDistance,
    serviceable: minDistance <= 65, // within 65 km is express / standard serviceable
    arrivalMinutes
  };
}

/**
 * Capture Real Device GPS Coordinates using Geolocation API
 */
export async function getRealDeviceGps(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now()
        });
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) msg = 'Location permission was denied by user.';
        else if (err.code === 2) msg = 'Location position unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Reverse Geocode GPS coordinates with Google Maps API or OpenStreetMap
 * Resolves full hierarchy: Country, State, District, City, Locality, Pincode
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  accuracy: number = 20
): Promise<ResolvedCustomerLocation> {
  const timestamp = Date.now();
  
  // Find nearest operational BPE Hub geographically by Haversine formula
  const { hub, distanceKm, serviceable, arrivalMinutes } = findNearestBpeHub(lat, lng);

  let country = 'India';
  let countryCode = 'in';
  let state = hub.state;
  let district = hub.city;
  let subDistrict = '';
  let city = hub.city;
  let locality = '';
  let sector = '';
  let flatOrTower = '';
  let buildingOrStreet = '';
  let pincode = '';
  let formattedAddress = '';

  try {
    // 1. High accuracy OpenStreetMap / Nominatim reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
    const resp = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'BharatProExpert-IndiaLocationService/3.0'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};
      
      country = addr.country || 'India';
      countryCode = (addr.country_code || 'in').toLowerCase();
      
      if (addr.state) {
        state = addr.state;
      }

      // District
      const rawDistrict = addr.state_district || addr.county || addr.district || '';
      if (rawDistrict) {
        district = rawDistrict.replace(/\s+district$/i, '').trim();
      }

      subDistrict = addr.subdistrict || addr.tehsil || addr.taluk || '';

      // City resolution: handle Indian aliases
      let rawCity = addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
      
      // If rawCity is empty, check district or state_district
      if (!rawCity && rawDistrict) {
        rawCity = rawDistrict;
      }

      // Normalize Indian metro & city aliases
      const normalizedCity = rawCity.trim().toLowerCase();
      if (normalizedCity.includes('gurgaon') || normalizedCity.includes('manesar')) {
        city = 'Gurugram';
      } else if (normalizedCity.includes('bangalore') || normalizedCity.includes('bengaluru')) {
        city = 'Bengaluru';
      } else if (normalizedCity.includes('bombay') || normalizedCity.includes('mumbai')) {
        city = 'Mumbai';
      } else if (normalizedCity.includes('calcutta') || normalizedCity.includes('kolkata')) {
        city = 'Kolkata';
      } else if (normalizedCity.includes('madras') || normalizedCity.includes('chennai')) {
        city = 'Chennai';
      } else if (normalizedCity.includes('poona') || normalizedCity.includes('pune')) {
        city = 'Pune';
      } else if (normalizedCity.includes('delhi') || normalizedCity.includes('new delhi')) {
        city = 'Delhi';
      } else if (normalizedCity.includes('patna')) {
        city = 'Patna';
      } else if (rawCity) {
        city = rawCity;
      } else {
        city = hub.city;
      }

      // Locality / Sector / Suburb
      locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || '';
      sector = addr.road || addr.quarter || addr.suburb || '';

      // Tower / Flat / Building
      flatOrTower = addr.house_number || addr.unit || addr.floor || '';
      buildingOrStreet = [addr.building, addr.road || addr.residential].filter(Boolean).join(', ');

      pincode = addr.postcode || '';
      formattedAddress = data.display_name || `${sector ? sector + ', ' : ''}${city}, ${state}`;
    }
  } catch (e) {
    console.warn('Geocoding lookup notice:', e);
  }

  // Validate Country
  const isIndia = countryCode === 'in' || country.toLowerCase().includes('india');

  // Match state with master India database if possible
  if (isIndia && state) {
    const matchedState = MASTER_ALL_INDIA_REGIONS.find(
      (r) => r.state.toLowerCase() === state.toLowerCase() ||
             r.popularCities.some(c => c.toLowerCase() === city.toLowerCase())
    );
    if (matchedState) {
      state = matchedState.state;
      if (!district && matchedState.districts.length > 0) {
        district = matchedState.districts[0];
      }
    }
  }

  let serviceTier: 'TIER_1_EXPRESS' | 'TIER_2_STANDARD' | 'TIER_3_ON_DEMAND' = 'TIER_1_EXPRESS';
  if (distanceKm > 40) serviceTier = 'TIER_3_ON_DEMAND';
  else if (distanceKm > 15) serviceTier = 'TIER_2_STANDARD';

  return {
    country,
    isIndia,
    state: state || hub.state,
    district: district || city || hub.city,
    subDistrict: subDistrict || undefined,
    city: city || hub.city,
    locality: locality || undefined,
    sector: sector || undefined,
    flatOrTower: flatOrTower || undefined,
    buildingOrStreet: buildingOrStreet || undefined,
    pincode: pincode || undefined,
    latitude: lat,
    longitude: lng,
    accuracy,
    timestamp,
    formattedAddress: formattedAddress || `${city}, ${state}, India`,
    serviceable: isIndia && serviceable,
    serviceTier,
    nearestHub: {
      id: hub.id,
      name: hub.name,
      city: hub.city,
      state: hub.state,
      distanceKm,
      estimatedArrivalMins: arrivalMinutes
    }
  };
}

/**
 * Search across all 28 Indian States, 8 UTs, districts, and popular cities
 */
export function searchIndiaLocations(query: string): {
  state: string;
  district?: string;
  city: string;
  displayName: string;
  isUnionTerritory: boolean;
  approxLat: number;
  approxLng: number;
}[] {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();
  const results: {
    state: string;
    district?: string;
    city: string;
    displayName: string;
    isUnionTerritory: boolean;
    approxLat: number;
    approxLng: number;
  }[] = [];

  // 1. Search in operational hubs first (highest priority)
  for (const hub of OPERATIONAL_BPE_HUBS) {
    if (
      hub.city.toLowerCase().includes(q) ||
      hub.name.toLowerCase().includes(q) ||
      hub.state.toLowerCase().includes(q)
    ) {
      results.push({
        state: hub.state,
        city: hub.city,
        displayName: `${hub.city}, ${hub.state} (Direct BPE Hub)`,
        isUnionTerritory: false,
        approxLat: hub.lat,
        approxLng: hub.lng
      });
    }
  }

  // 2. Search across master Indian States, UTs, and districts
  for (const region of MASTER_ALL_INDIA_REGIONS) {
    // Match state name
    if (region.state.toLowerCase().includes(q)) {
      results.push({
        state: region.state,
        city: region.capital,
        displayName: `${region.capital}, ${region.state}`,
        isUnionTerritory: region.isUnionTerritory,
        approxLat: 22.0,
        approxLng: 78.0
      });
    }

    // Match popular cities
    for (const city of region.popularCities) {
      if (city.toLowerCase().includes(q)) {
        // avoid duplicate
        if (!results.some(r => r.city.toLowerCase() === city.toLowerCase())) {
          results.push({
            state: region.state,
            city,
            displayName: `${city}, ${region.state}`,
            isUnionTerritory: region.isUnionTerritory,
            approxLat: 22.0,
            approxLng: 78.0
          });
        }
      }
    }

    // Match districts
    for (const dist of region.districts) {
      if (dist.toLowerCase().includes(q)) {
        if (!results.some(r => r.displayName.toLowerCase().includes(dist.toLowerCase()))) {
          results.push({
            state: region.state,
            district: dist,
            city: dist,
            displayName: `${dist} District, ${region.state}`,
            isUnionTerritory: region.isUnionTerritory,
            approxLat: 22.0,
            approxLng: 78.0
          });
        }
      }
    }
  }

  return results.slice(0, 15);
}
