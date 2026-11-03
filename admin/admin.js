let supabase=null;
try {
  const cfgResponse=await fetch("/api/admin/config",{cache:"no-store"});
  const cfg=await cfgResponse.json();
  if(cfgResponse.ok&&cfg.configured===true&&typeof cfg.url==="string"&&typeof cfg.anonKey==="string"){
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
    supabase=createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  } else { throw new Error(cfg.error||"Admin setup incomplete."); }
} catch(error){ console.warn("Admin public config unavailable."); }
const $=id=>document.getElementById(id);
const login=$("login-card"),workspace=$("workspace"),form=$("login-form"),button=$("login-submit"),msg=$("login-message"),sess=$("session-label"),logout=$("logout");
function message(text){msg.textContent=text}
function showWorkspace(role,email){login.hidden=true;workspace.hidden=false;logout.hidden=false;sess.textContent=email||"Authorized admin";$("role-text").textContent="Verified administrator access · role: "+role}
function showLogin(){login.hidden=false;workspace.hidden=true;logout.hidden=true;sess.textContent="Not signed in"}
async function verifyAdmin(session){if(!session?.access_token)return false;const res=await fetch("/api/admin/session",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});if(!res.ok){const err=await res.json().catch(()=>({}));if(res.status===403)throw new Error("Your account is not approved for administrator access.");throw new Error(err.error||"Could not verify admin access.");}const data=await res.json();if(data.authorized!==true||!data.role)throw new Error("Admin permission was not confirmed.");showWorkspace(data.role,session.user?.email||session.user?.phone);return true}
if(!supabase){message("Admin setup incomplete. Configure SUPABASE_URL and SUPABASE_ANON_KEY (public key) for this deployment.");button.disabled=true}
form.addEventListener("submit",async e=>{e.preventDefault();if(!supabase)return;button.disabled=true;button.textContent="Verifying…";message("");try{const {data,error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)throw error;await verifyAdmin(data.session)}catch(err){message(err.message||"Sign-in failed.");await supabase.auth.signOut().catch(()=>{})}finally{button.disabled=false;button.textContent="Secure sign in"}});
logout.addEventListener("click",async()=>{if(supabase)await supabase.auth.signOut();showLogin()});
if(supabase){const {data:{session}}=await supabase.auth.getSession();if(session){try{await verifyAdmin(session)}catch{await supabase.auth.signOut();showLogin()}}}


const queue=$("booking-queue"),queueList=$("booking-list"),queueSummary=$("queue-summary"),search=$("booking-search");
let cachedBookings=[];
function safeText(v){return String(v==null?"—":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function drawQueue(){
 const q=String(search.value||"").toLowerCase().trim();
 const rows=cachedBookings.filter(b=>[b.id,b.status,b.paymentStatus].some(v=>String(v||"").toLowerCase().includes(q)));
 queueSummary.textContent=rows.length+" matching records · read-only access · "+cachedBookings.length+" loaded";
 if(!rows.length){queueList.innerHTML='<p class="notice muted">No matching booking records in the current loaded sample.</p>';return;}
 queueList.innerHTML='<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:12px;text-align:left"><thead><tr>'+["Booking","Scheduled","Status","Payment","Amount","Services","Area"].map(h=>'<th style="padding:11px;border-bottom:1px solid #e5e9f1;color:#657187">'+h+'</th>').join("")+'</tr></thead><tbody>'+rows.map(b=>{
 const items=Array.isArray(b.items)?b.items.map(it=>typeof it==="string"?it:(it?.serviceName||it?.name||it?.id||"Service")).join(", "):"—";
 const address=b.address&&typeof b.address==="object"?[b.address.area,b.address.city,b.address.pincode].filter(Boolean).join(", "):"—";
 const rupees=Number.isFinite(Number(b.amount))?"₹"+Number(b.amount).toLocaleString("en-IN"):"—";
 return '<tr>'+[b.id,b.date?(b.date+" "+(b.slot||"")):"—",b.status,b.paymentStatus,rupees,items,address].map((v,i)=>'<td style="padding:11px;border-bottom:1px solid #edf0f5;vertical-align:top;max-width:'+(i>4?'200px':'auto')+';overflow-wrap:anywhere">'+safeText(v)+'</td>').join("")+'</tr>';
 }).join("")+'</tbody></table></div>';
}
async function loadQueue(){
 if(!supabase)return;
 const btn=$("load-bookings"),refresh=$("refresh-bookings");
 if(btn){btn.disabled=true;btn.textContent="Loading verified records…"}
 if(refresh){refresh.disabled=true;refresh.textContent="Loading…"}
 queue.hidden=false;queueList.innerHTML='<p class="notice muted">Requesting authenticated booking data…</p>';
 try{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error("Your session expired. Sign in again.");
  const response=await fetch("/api/admin/bookings",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
  const data=await response.json();
  if(!response.ok||data.ok!==true)throw new Error(data.error||"Booking list unavailable.");
  cachedBookings=Array.isArray(data.bookings)?data.bookings:[];
  drawQueue();
 }catch(error){queueList.innerHTML='<p class="notice muted">'+safeText(error.message||"Unable to load records.")+'</p>'}
 finally{if(btn){btn.disabled=false;btn.textContent="Open customer request queue"}if(refresh){refresh.disabled=false;refresh.textContent="Refresh"}}
}
$("load-bookings")?.addEventListener("click",loadQueue);
$("refresh-bookings")?.addEventListener("click",loadQueue);
search?.addEventListener("input",drawQueue);
