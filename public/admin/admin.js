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
