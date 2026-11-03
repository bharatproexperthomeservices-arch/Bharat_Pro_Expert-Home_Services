// Read-only customer booking queue. Every request validates the Supabase user and admin membership.
// No write paths are exposed by this endpoint.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).json({error:"Method not allowed."}); }
  const projectUrl=String(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||"").replace(/\/$/,"");
  const secret=String(process.env.SUPABASE_SERVICE_ROLE_KEY||"").trim();
  const auth=String(req.headers.authorization||"").match(/^Bearer\s+(.+)$/i);
  if(!projectUrl||!secret)return res.status(503).json({error:"Admin access is not configured."});
  if(!auth)return res.status(401).json({error:"Sign in is required."});
  try{
    const userRes=await fetch(projectUrl+"/auth/v1/user",{headers:{apikey:secret,Authorization:"Bearer "+auth[1]},cache:"no-store"});
    if(!userRes.ok)return res.status(401).json({error:"Session is invalid or expired."});
    const user=await userRes.json();
    if(!user?.id)return res.status(401).json({error:"Session identity could not be confirmed."});
    const memberRes=await fetch(projectUrl+"/rest/v1/admin_memberships?auth_user_id=eq."+encodeURIComponent(user.id)+"&active=eq.true&select=auth_user_id,role,active&limit=1",{headers:{apikey:secret,Authorization:"Bearer "+secret},cache:"no-store"});
    if(!memberRes.ok){console.error("Admin membership check failed",memberRes.status);return res.status(503).json({error:"Admin access directory is unavailable."});}
    const rows=await memberRes.json(),member=Array.isArray(rows)?rows[0]:null;
    if(!member||member.auth_user_id!==user.id||member.active!==true)return res.status(403).json({error:"Admin approval required."});
    if(!["owner","operations","support"].includes(member.role))return res.status(403).json({error:"Your admin role cannot access customer request details."});
    // Schema inspection has not yet established canonical column names. Fetch a capped read-only
    // sample and normalize only recognized fields; never mutate or assume missing columns.
    const dataRes=await fetch(projectUrl+"/rest/v1/bookings?select=*&limit=100",{headers:{apikey:secret,Authorization:"Bearer "+secret,Prefer:"count=none"},cache:"no-store"});
    if(!dataRes.ok){console.error("Booking queue read failed",dataRes.status);return res.status(503).json({error:"Bookings table could not be read. Verify its schema and service-role access."});}
    const raw=await dataRes.json();
    if(!Array.isArray(raw))return res.status(502).json({error:"Unexpected booking data response."});
    const pick=(o,keys)=>{for(const k of keys)if(o[k]!==undefined&&o[k]!==null)return o[k];return null;};
    const bookings=raw.map((b)=>{
      const rawAddress=pick(b,["address"]);
      const address=rawAddress&&typeof rawAddress==="object"?{
        area:pick(rawAddress,["area","locality"]),city:pick(rawAddress,["city"]),pincode:pick(rawAddress,["pincode","postalCode","postal_code"])
      }:null;
      const rawItems=pick(b,["items","services"]);
      const items=Array.isArray(rawItems)?rawItems.slice(0,30).map(it=>typeof it==="string"?{serviceName:it}:{serviceName:pick(it||{},["serviceName","name","id"])||"Service",quantity:pick(it||{},["quantity","qty"])}):[];
      return ({
      id:pick(b,["bookingCode","booking_code","id"]),
      createdAt:pick(b,["createdAt","created_at"]),
      date:pick(b,["date","bookingDate","booking_date"]),
      slot:pick(b,["slot","timeSlot","time_slot"]),
      status:pick(b,["status","bookingStatus","booking_status"]),
      paymentStatus:pick(b,["payStatus","pay_status","paymentStatus","payment_status"]),
      amount:pick(b,["totalAmount","total_amount"]),
      items,
      address
    });});
    return res.status(200).json({ok:true,readOnly:true,count:bookings.length,bookings});
  }catch(e){console.error("Booking queue error",e?.message||"unknown");return res.status(503).json({error:"Unable to load the booking queue."});}
}
