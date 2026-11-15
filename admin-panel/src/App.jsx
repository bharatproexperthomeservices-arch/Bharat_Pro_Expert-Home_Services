import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BadgePercent, BarChart3, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileImage, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Sparkles, Users, Wrench, X } from 'lucide-react';
import { isSupabaseConfigured, requireAdmin, supabase } from './lib/supabase';

const groups = [
  { title: 'Website Content', items: [
    { to: '/content/services', label: 'Services Manager', icon: Wrench },
    { to: '/content/homepage', label: 'Homepage Settings', icon: Sparkles },
    { to: '/content/media', label: 'Media & Images', icon: FileImage },
    { to: '/content/coupons', label: 'Coupons', icon: BadgePercent }
  ]},
  { title: 'Operations', items: [
    { to: '/operations/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/operations/partners', label: 'Partner KYC', icon: ShieldCheck },
    { to: '/operations/bookings', label: 'Bookings & Dispatch', icon: CalendarDays },
    { to: '/operations/waitlist', label: 'Demand / Waitlist', icon: Users }
  ]}
];
const titles = Object.fromEntries(groups.flatMap(g => g.items.map(i => [i.to, i.label])));

function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      const allowed = await requireAdmin(data.user);
      if (!allowed) { await supabase.auth.signOut(); throw new Error('This account is not on the Admin allowlist.'); }
      onLogin(data.user);
    } catch (err) { setError(err.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  return <main className="login-shell"><div className="login-card">
    <div className="brand-mark">BPE</div><p className="eyebrow">BHARAT PRO EXPERT</p><h1>Admin workspace</h1>
    <p className="muted">Sign in with an authorized administrator account.</p>
    <form onSubmit={submit} className="stack">
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@company.com" /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" /></label>
      {error && <div className="alert">{error}</div>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button>
    </form><p className="tiny">Access is controlled by Supabase Auth and the admin_users database allowlist.</p>
  </div></main>;
}

function Shell({ user, children, onLogout }) {
  const [collapsed,setCollapsed]=useState(false); const [mobileOpen,setMobileOpen]=useState(false);
  const loc=useLocation();
  useEffect(()=>setMobileOpen(false),[loc.pathname]);
  const sidebar=<aside className={`sidebar ${collapsed?'sidebar-small':''} ${mobileOpen?'sidebar-mobile-open':''}`}>
    <div className="sidebar-brand"><div className="brand-mark small">BPE</div>{!collapsed&&<div><b>Bharat Pro Expert</b><small>ADMIN CONSOLE</small></div>}
      <button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
    <nav>{groups.map(group=><section className="nav-group" key={group.title}>
      {!collapsed&&<p className="nav-heading">{group.title}</p>}
      {group.items.map(item=><NavLink key={item.to} to={item.to} title={collapsed?item.label:undefined} className={({isActive})=>`nav-link ${isActive?'active':''}`}><item.icon size={18}/>{!collapsed&&<span>{item.label}</span>}</NavLink>)}
    </section>)}</nav>
    <div className="sidebar-bottom"><button className="nav-link" onClick={onLogout}><LogOut size={18}/>{!collapsed&&<span>Sign out</span>}</button></div>
  </aside>;
  return <div className="app-shell">{sidebar}{mobileOpen&&<button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <div className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu/></button>
      <button className="icon-btn desktop-collapse" onClick={()=>setCollapsed(v=>!v)} aria-label="Toggle sidebar">{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</button>
      <div className="crumb">{titles[loc.pathname]||'Admin workspace'}</div><div className="top-user"><span className="status-dot"/><span>{user.email}</span><button className="icon-btn signout-mobile" onClick={onLogout} aria-label="Sign out"><LogOut size={17}/></button></div>
    </header><main className="page-content">{children}</main></div>
  </div>;
}

function PageHeading({title,subtitle,action}) { return <div className="page-heading"><div><p className="eyebrow">BHARAT PRO EXPERT</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>; }
function EmptyState({title,detail}) { return <div className="empty-state"><div className="empty-icon"><Activity/></div><b>{title}</b><p>{detail}</p></div>; }
function ErrorNote({children}) { return children?<div className="alert">{children}</div>:null; }

function useTable(table, order='created_at') {
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  async function reload() {
    setLoading(true); setError('');
    const {data,error}=await supabase.from(table).select('*').order(order,{ascending:false}).limit(250);
    if(error){setError(error.message);setRows([]);} else setRows(data||[]);
    setLoading(false);
  }
  useEffect(()=>{reload();},[table]);
  return {rows,setRows,loading,error,reload};
}

function Dashboard() {
  const bookings=useTable('bookings'); const partners=useTable('partners');
  const total=bookings.rows.length;
  const revenue=bookings.rows.reduce((sum,b)=>sum+Number(b.total_amount??b.amount??b.price??0),0);
  const active=partners.rows.filter(p=>String(p.status||'').toUpperCase()==='ACTIVE').length;
  return <><PageHeading title="Operations dashboard" subtitle="A live overview of bookings, partner capacity and collected booking value."/>
    <div className="kpi-grid"><Kpi icon={ClipboardList} label="Total bookings" value={bookings.loading?'—':total.toLocaleString()} hint="Latest 250 records"/><Kpi icon={Users} label="Active partners" value={partners.loading?'—':active.toLocaleString()} hint="Approved partner profiles"/><Kpi icon={BarChart3} label="Booking value" value={bookings.loading?'—':`₹${revenue.toLocaleString('en-IN')}`} hint="Sum of available amount fields"/></div>
    <div className="two-col"><div className="panel"><div className="panel-head"><h3>Recent bookings</h3><span className="pill">Latest 8</span></div><DataTable rows={bookings.rows.slice(0,8)} columns={['id','status','created_at']} loading={bookings.loading} error={bookings.error}/></div>
    <div className="panel"><div className="panel-head"><h3>Partner snapshot</h3><span className="pill">{partners.rows.length} loaded</span></div><DataTable rows={partners.rows.slice(0,8)} columns={['full_name','city','status']} loading={partners.loading} error={partners.error}/></div></div>
  </>;
}
function Kpi({icon:Icon,label,value,hint}) {return <div className="kpi-card"><div className="kpi-top"><span>{label}</span><Icon size={19}/></div><strong>{value}</strong><small>{hint}</small></div>;}
function DataTable({rows,columns,loading,error}) {if(loading)return <p className="muted pad">Loading records…</p>;if(error)return <ErrorNote>{error}</ErrorNote>;if(!rows.length)return <EmptyState title="No records found" detail="Records will appear here when they are available to this admin account."/>;return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{columns.map(c=><td key={c}>{String(r[c]??'—').slice(0,80)}</td>)}</tr>)}</tbody></table></div>;}

const CATEGORIES=[['deep','Home Deep Cleaning'],['bath','Bathroom Cleaning'],['kitchen','Kitchen Cleaning'],['sofa','Sofa & Carpet'],['appl','Appliance Cleaning'],['floor','Floor & Window'],['dust','Fans & Wardrobes'],['special','Move-in & Special']];
function Services() {
  const {rows,loading,error,reload}=useTable('admin_services');
  const [category,setCategory]=useState('deep'); const [editing,setEditing]=useState(null); const [saving,setSaving]=useState(false); const [notice,setNotice]=useState('');
  const filtered=rows.filter(r=>r.category_id===category);
  async function save(e){e.preventDefault();setSaving(true);setNotice('');const payload={title:editing.title,image_url:editing.image_url,price:Number(editing.price),strike_price:editing.strike_price===''?null:Number(editing.strike_price),duration:editing.duration===''?null:Number(editing.duration),category_id:category};
    const q=editing.id?supabase.from('admin_services').update(payload).eq('id',editing.id):supabase.from('admin_services').insert(payload);
    const {error}=await q;if(error)setNotice(error.message);else{setEditing(null);setNotice('Saved to the admin content database.');await reload();}setSaving(false);}
  return <><PageHeading title="Services manager" subtitle="Manage the eight service categories and editable service records." action={<button className="btn btn-primary" onClick={()=>setEditing({title:'',image_url:'',price:'',strike_price:'',duration:''})}>+ Add service</button>}/>
    <div className="category-tabs">{CATEGORIES.map(([id,name])=><button key={id} className={category===id?'selected':''} onClick={()=>setCategory(id)}>{name}</button>)}</div>
    <ErrorNote>{error}</ErrorNote>{notice&&<div className="success-note">{notice}</div>}
    {loading?<p className="muted">Loading services…</p>:filtered.length?<div className="service-grid">{filtered.map(s=><article className="service-card" key={s.id}><div className="service-image">{s.image_url?<img src={s.image_url} alt={s.title}/>:<FileImage/>}</div><div className="service-info"><b>{s.title}</b><p>₹{s.price??'—'} {s.strike_price&&<del>₹{s.strike_price}</del>} · {s.duration??'—'} min</p><button className="btn btn-outline" onClick={()=>setEditing({...s})}>Edit service</button></div></article>)}</div>:<EmptyState title="No service records in admin_services yet" detail="The current customer catalogue is stored in the website source, not this table. Add records here; publishing them to the customer website requires a separate, approved customer-site integration."/>}
    {editing&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setEditing(null)}><form className="modal" onSubmit={save}><div className="panel-head"><h3>{editing.id?'Edit service':'Add service'}</h3><button type="button" className="icon-btn" onClick={()=>setEditing(null)}><X/></button></div>
      <label>Service title<input required value={editing.title||''} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>Image URL<input value={editing.image_url||''} onChange={e=>setEditing({...editing,image_url:e.target.value})}/></label>
      <div className="form-grid"><label>Price (₹)<input required type="number" min="0" value={editing.price??''} onChange={e=>setEditing({...editing,price:e.target.value})}/><small> </small></label><label>Strike price (₹)<input type="number" min="0" value={editing.strike_price??''} onChange={e=>setEditing({...editing,strike_price:e.target.value})}/></label><label>Duration (minutes)<input type="number" min="0" value={editing.duration??''} onChange={e=>setEditing({...editing,duration:e.target.value})}/></label></div>
      <ErrorNote>{notice}</ErrorNote><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save service'}</button></div></form></div>}
  </>;
}
function SettingsPage() {
  const [values,setValues]=useState({hero_title:'',hero_subtitle:'',offer_title:'',offer_subtitle:'',offer_code:''});const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');
  useEffect(()=>{(async()=>{const {data,error}=await supabase.from('admin_site_settings').select('key,value');if(!error&&data){setValues(v=>({...v,...Object.fromEntries(data.map(x=>[x.key,x.value||'']))}));}else if(error)setMessage(error.message);setLoading(false);})();},[]);
  async function save(e){e.preventDefault();setMessage('');const records=Object.entries(values).map(([key,value])=>({key,value}));const {error}=await supabase.from('admin_site_settings').upsert(records,{onConflict:'key'});setMessage(error?error.message:'Settings saved to the admin content database.');}
  return <><PageHeading title="Homepage settings" subtitle="Edit hero and offer banner copy stored in the admin content database."/><form className="panel stack" onSubmit={save}>{loading?<p>Loading…</p>:<><h3>Hero banner</h3><label>Hero title<input value={values.hero_title} onChange={e=>setValues({...values,hero_title:e.target.value})}/></label><label>Hero subtitle<input value={values.hero_subtitle} onChange={e=>setValues({...values,hero_subtitle:e.target.value})}/></label><hr/><h3>Offer banner</h3><label>Offer title<input value={values.offer_title} onChange={e=>setValues({...values,offer_title:e.target.value})}/></label><label>Offer subtitle<input value={values.offer_subtitle} onChange={e=>setValues({...values,offer_subtitle:e.target.value})}/></label><label>Offer code<input value={values.offer_code} onChange={e=>setValues({...values,offer_code:e.target.value})}/></label><ErrorNote>{message.includes('saved')?'':message}</ErrorNote>{message.includes('saved')&&<div className="success-note">{message}</div>}<button className="btn btn-primary self-start">Save homepage settings</button></>}</form></>;
}
function Media() {
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [name,setName]=useState('');const [url,setUrl]=useState('');
  async function load(){setLoading(true);const {data,error}=await supabase.from('admin_media').select('*').order('created_at',{ascending:false});if(error)setError(error.message);else setRows(data||[]);setLoading(false);}
  useEffect(()=>{load();},[]);
  async function add(e){e.preventDefault();const {error}=await supabase.from('admin_media').insert({label:name,image_url:url});if(error)setError(error.message);else{setName('');setUrl('');load();}}
  return <><PageHeading title="Media & images" subtitle="Store replacement image URLs for banners and service photography."/><form className="panel inline-form" onSubmit={add}><label>Image label<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Homepage hero"/></label><label>Image URL<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label><button className="btn btn-primary">Add image</button></form><ErrorNote>{error}</ErrorNote>
    {loading?<p>Loading…</p>:<div className="media-grid">{rows.map(r=><div className="media-card" key={r.id}>{r.image_url&&<img src={r.image_url} alt={r.label}/>}<b>{r.label}</b><a href={r.image_url} target="_blank" rel="noreferrer">Open image</a></div>)}</div>}</>;
}
function Coupons() {
  const {rows,loading,error,reload}=useTable('admin_coupons');const [form,setForm]=useState({code:'',label:'',discount_type:'flat',value:'',minimum_order:0});const [message,setMessage]=useState('');
  async function add(e){e.preventDefault();const {error}=await supabase.from('admin_coupons').insert({...form,code:form.code.toUpperCase(),value:Number(form.value),minimum_order:Number(form.minimum_order)});if(error)setMessage(error.message);else{setForm({code:'',label:'',discount_type:'flat',value:'',minimum_order:0});setMessage('Coupon saved.');reload();}}
  async function toggle(row){const {error}=await supabase.from('admin_coupons').update({active:!row.active}).eq('id',row.id);if(error)setMessage(error.message);else reload();}
  return <><PageHeading title="Coupons" subtitle="Create discount codes and switch them on or off."/><form className="panel inline-form" onSubmit={add}><label>Code<input required value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label><label>Label<input value={form.label} onChange={e=>setForm({...form,label:e.target.value})}/></label><label>Type<select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})}><option value="flat">Flat ₹</option><option value="percent">Percent %</option></select></label><label>Value<input required type="number" min="1" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label><label>Minimum order<input type="number" min="0" value={form.minimum_order} onChange={e=>setForm({...form,minimum_order:e.target.value})}/></label><button className="btn btn-primary">Create coupon</button></form><ErrorNote>{error}</ErrorNote>{message&&<p className="success-note">{message}</p>}<div className="panel"><DataTable rows={rows.map(r=>({...r,status:r.active?'Active':'Paused'}))} columns={['code','label','discount_type','value','minimum_order','status']} loading={loading} error={error}/>{rows.map(r=><button key={r.id} className="btn btn-outline btn-sm" onClick={()=>toggle(r)}>{r.active?'Pause':'Activate'} {r.code}</button>)}</div></>;
}
function Partners() {
  const {rows,loading,error,reload}=useTable('partners');
  async function setStatus(row,status){const {error}=await supabase.from('partners').update({status,updated_at:new Date().toISOString()}).eq('id',row.id);if(error)window.alert(error.message);else reload();}
  return <><PageHeading title="Partner KYC" subtitle="Review partner profiles and update approval status. Document links appear when present in partner records."/><ErrorNote>{error}</ErrorNote>{loading?<p>Loading partner applications…</p>:rows.length?<div className="panel"><div className="table-wrap"><table><thead><tr><th>Partner</th><th>Phone</th><th>City</th><th>Status</th><th>Documents</th><th>Review</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.full_name||'—'}</td><td>{p.phone||'—'}</td><td>{p.city||'—'}</td><td><span className="pill">{p.status||'—'}</span></td><td>{['document_url','aadhaar_url','pan_url','photo_url'].filter(k=>p[k]).map(k=><a className="doc-link" key={k} href={p[k]} target="_blank" rel="noreferrer">{k.replace('_url','')}</a>)}</td><td><div className="actions"><button className="btn btn-primary btn-sm" onClick={()=>setStatus(p,'ACTIVE')}>Approve</button><button className="btn btn-danger btn-sm" onClick={()=>setStatus(p,'INACTIVE')}>Reject</button></div></td></tr>)}</tbody></table></div></div>:<EmptyState title="No partner applications" detail="New partner profiles from the partners table will appear here."/>}</>;
}
function Bookings() {
  const {rows,loading,error,reload}=useTable('bookings');const {rows:partners}=useTable('partners');const [chosen,setChosen]=useState({});
  const stages=[['PENDING','Pending'],['ASSIGNED','Assigned'],['COMPLETED','Completed']];
  async function assign(row){const partner=chosen[row.id];if(!partner)return;const {error}=await supabase.from('bookings').update({assigned_partner_id:partner,dispatch_status:'ASSIGNED',assigned_at:new Date().toISOString()}).eq('id',row.id);if(error)window.alert(error.message);else reload();}
  const stageOf=b=>{const s=String(b.dispatch_status||b.status||'PENDING').toUpperCase();if(s.includes('COMPLETE'))return 'COMPLETED';if(s.includes('ASSIGN'))return 'ASSIGNED';return 'PENDING';};
  return <><PageHeading title="Bookings & dispatch" subtitle="Review bookings by dispatch stage and manually assign an active partner."/><ErrorNote>{error}</ErrorNote>{loading?<p>Loading bookings…</p>:<div className="kanban">{stages.map(([key,label])=><section className="kanban-col" key={key}><div className="kanban-title"><b>{label}</b><span>{rows.filter(r=>stageOf(r)===key).length}</span></div>{rows.filter(r=>stageOf(r)===key).map(b=><article className="booking-card" key={b.id}><b>Booking #{String(b.id).slice(0,8)}</b><p>{b.customer_name||b.name||b.phone||'Customer booking'}</p><small>{b.service_name||b.service_id||'Service'} · {b.city||'—'}</small>{key!=='COMPLETED'&&<div className="assign-row"><select value={chosen[b.id]||b.assigned_partner_id||''} onChange={e=>setChosen({...chosen,[b.id]:e.target.value})}><option value="">Choose partner</option>{partners.filter(p=>String(p.status).toUpperCase()==='ACTIVE').map(p=><option value={p.id} key={p.id}>{p.full_name}</option>)}</select><button className="btn btn-primary btn-sm" onClick={()=>assign(b)}>Assign</button></div>}</article>)}</section>)}</div>}</>;
}
function Waitlist() {
  const {rows,loading,error,reload}=useTable('notify_requests');
  return <><PageHeading title="Demand & waitlist" subtitle="Customer requests captured when no partner was available."/><ErrorNote>{error}</ErrorNote><div className="panel"><DataTable rows={rows} columns={['customer_name','phone','city','pincode','service_id','status','created_at']} loading={loading} error={error}/><button className="btn btn-outline btn-sm" onClick={reload}>Refresh requests</button></div><p className="tiny">Notifications are not sent from this screen. Connect an approved SMS/WhatsApp provider and a protected server endpoint before enabling outreach.</p></>;
}

export default function App() {
  const [user,setUser]=useState(null);const [checking,setChecking]=useState(true);const [authError,setAuthError]=useState('');
  useEffect(()=>{if(!supabase){setChecking(false);return;}let alive=true;
    supabase.auth.getSession().then(async({data})=>{if(!alive)return;const current=data.session?.user;if(current){try{if(await requireAdmin(current))setUser(current);else{await supabase.auth.signOut();setAuthError('Signed-in account is not an administrator.');}}catch(e){setAuthError(e.message);}}setChecking(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(alive&&!session)setUser(null);});
    return()=>{alive=false;subscription.unsubscribe();};
  },[]);
  async function logout(){await supabase.auth.signOut();setUser(null);}
  if(checking)return <div className="loading-screen">Loading secure admin session…</div>;
  if(!isSupabaseConfigured)return <div className="login-shell"><div className="login-card"><div className="brand-mark">BPE</div><h1>Supabase setup required</h1><p className="muted">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to admin-panel/.env.local, then restart Vite.</p></div></div>;
  if(!user)return <><Login onLogin={setUser}/>{authError&&<div className="floating-error">{authError}</div>}</>;
  return <Shell user={user} onLogout={logout}><Routes>
    <Route path="/" element={<Navigate to="/operations/dashboard" replace/>}/>
    <Route path="/operations/dashboard" element={<Dashboard/>}/><Route path="/operations/partners" element={<Partners/>}/><Route path="/operations/bookings" element={<Bookings/>}/><Route path="/operations/waitlist" element={<Waitlist/>}/>
    <Route path="/content/services" element={<Services/>}/><Route path="/content/homepage" element={<SettingsPage/>}/><Route path="/content/media" element={<Media/>}/><Route path="/content/coupons" element={<Coupons/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Shell>;
}