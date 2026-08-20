/* ================================
   BIDÈ - APPLICATION ADMIN
   Tout est stocké dans localStorage
   ================================ */

const STORAGE_KEY = "bide_admin_data_v1";

const defaultData = {
  orders: [
    {id:"CMD-1008", client:"Afi Mensah", destination:"Agoè-Nyivé", driver:"Kossi Adama", amount:4500, date:"20/08/2026", status:"En livraison"},
    {id:"CMD-1007", client:"Mawuli K.", destination:"Tokoin", driver:"Kodjo Mensah", amount:3000, date:"20/08/2026", status:"Livrée"},
    {id:"CMD-1006", client:"Eyram A.", destination:"Bè-Klikamé", driver:"Sena D.", amount:2500, date:"20/08/2026", status:"En attente"},
    {id:"CMD-1005", client:"Nadia B.", destination:"Adidogomé", driver:"Kossi Adama", amount:5000, date:"19/08/2026", status:"Livrée"},
    {id:"CMD-1004", client:"Yao K.", destination:"Hédzranawoé", driver:"Sami T.", amount:3500, date:"19/08/2026", status:"Annulée"},
    {id:"CMD-1003", client:"Mélissa A.", destination:"Nyékonakpoè", driver:"Kodjo Mensah", amount:4000, date:"19/08/2026", status:"Livrée"}
  ],
  clients: [
    {id:1,name:"Afi Mensah",phone:"+228 90 12 34 56",email:"afi@example.com"},
    {id:2,name:"Mawuli K.",phone:"+228 91 22 33 44",email:"mawuli@example.com"},
    {id:3,name:"Eyram A.",phone:"+228 92 45 67 89",email:"eyram@example.com"},
    {id:4,name:"Nadia B.",phone:"+228 98 11 22 33",email:"nadia@example.com"}
  ],
  drivers: [
    {id:1,name:"Kossi Adama",phone:"+228 90 45 67 12",zone:"Lomé Centre",status:"En ligne",deliveries:8},
    {id:2,name:"Kodjo Mensah",phone:"+228 91 45 22 10",zone:"Tokoin",status:"En ligne",deliveries:6},
    {id:3,name:"Sena D.",phone:"+228 98 33 44 11",zone:"Bè",status:"Hors ligne",deliveries:4},
    {id:4,name:"Sami T.",phone:"+228 99 10 20 30",zone:"Agoè",status:"En ligne",deliveries:7}
  ],
  rates: [
    {id:1,name:"Standard",zone:"Lomé Centre",price:1500},
    {id:2,name:"Express",zone:"Lomé + périphérie",price:2500},
    {id:3,name:"Grande distance",zone:"Zones éloignées",price:4000}
  ]
};

let data = loadData();
let revenueChart = null;
let statsChart = null;
let currentModalMode = null;
let currentEditId = null;
let confirmCallback = null;

const appModal = new bootstrap.Modal(document.getElementById("appModal"));
const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
const toast = new bootstrap.Toast(document.getElementById("appToast"), {delay:2200});

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindGlobalActions();
  renderAll();
  showPage(location.hash.replace("#","") || "dashboard", false);
});

function loadData(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultData);
  } catch(e) {
    return structuredClone(defaultData);
  }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function money(value){ return Number(value || 0).toLocaleString("fr-FR") + " FCFA"; }
function today(){ return new Date().toLocaleDateString("fr-FR"); }
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function notify(message){
  document.getElementById("toastMessage").textContent = message;
  toast.show();
}
function nextId(items){ return items.length ? Math.max(...items.map(x => Number(x.id)||0))+1 : 1; }

function bindNavigation(){
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
  document.querySelectorAll("[data-page-target]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.pageTarget));
  });
  window.addEventListener("hashchange", () => showPage(location.hash.replace("#",""), false));
  document.getElementById("mobileMenuBtn").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
}

function showPage(page, updateHash=true){
  const valid = ["dashboard","commandes","clients","livreurs","statistiques","tarifs"];
  if(!valid.includes(page)) page = "dashboard";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  document.querySelectorAll(".nav-link").forEach(n => n.classList.toggle("active", n.dataset.page===page));
  document.getElementById("sidebar").classList.remove("open");
  if(updateHash) history.replaceState(null,"","#"+page);
  if(page==="dashboard") setTimeout(drawRevenueChart, 50);
  if(page==="statistiques") setTimeout(drawStatsChart, 50);
}

function bindGlobalActions(){
  document.getElementById("globalSearch").addEventListener("input", globalSearch);
  document.addEventListener("click", e => {
    if(!e.target.closest(".global-search")) document.getElementById("searchResults").classList.remove("show");
  });

  document.getElementById("profileBtn").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("profileMenu").classList.toggle("show");
  });
  document.addEventListener("click", () => document.getElementById("profileMenu").classList.remove("show"));

  document.getElementById("notificationBtn").addEventListener("click", () => {
    notify("Vous avez 3 nouvelles notifications.");
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("menuLogout").addEventListener("click", logout);
  document.getElementById("profileAction").addEventListener("click", () => openProfile());
  document.getElementById("settingsAction").addEventListener("click", () => notify("Les paramètres sont prêts à être configurés."));

  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const a = btn.dataset.action;
      if(a==="new-order") openOrderModal();
      if(a==="new-client") openClientModal();
      if(a==="new-driver") openDriverModal();
      if(a==="new-rate") openRateModal();
    });
  });

  document.getElementById("ordersSearch").addEventListener("input", renderOrders);
  document.getElementById("orderStatusFilter").addEventListener("change", renderOrders);
  document.getElementById("clientsSearch").addEventListener("input", renderClients);
  document.getElementById("dashboardPeriod").addEventListener("change", drawRevenueChart);

  document.getElementById("appForm").addEventListener("submit", submitModalForm);
  document.getElementById("confirmYes").addEventListener("click", () => {
    if(typeof confirmCallback === "function") confirmCallback();
    confirmCallback = null;
    confirmModal.hide();
  });
  document.getElementById("exportStats").addEventListener("click", exportCSV);
}

function renderAll(){
  renderOrders();
  renderClients();
  renderDrivers();
  renderRates();
  renderDashboard();
  renderStats();
}

function renderDashboard(){
  const ordersToday = data.orders.filter(o => o.date === today()).length;
  const revenue = data.orders.filter(o => o.status !== "Annulée").reduce((s,o)=>s+Number(o.amount),0);
  const activeDrivers = data.drivers.filter(d => d.status==="En ligne").length;
  const inRoute = data.orders.filter(o => o.status==="En livraison").length;

  document.getElementById("kpiOrders").textContent = ordersToday || data.orders.length;
  document.getElementById("kpiRevenue").textContent = revenue.toLocaleString("fr-FR");
  document.getElementById("kpiDrivers").textContent = inRoute;

  const body = document.getElementById("recentOrdersBody");
  body.innerHTML = data.orders.slice(0,5).map(o => `
    <tr>
      <td><strong>${escapeHtml(o.id)}</strong></td>
      <td>${escapeHtml(o.client)}</td>
      <td>${escapeHtml(o.driver)}</td>
      <td>${money(o.amount)}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join("") || emptyRow(5);
  setTimeout(drawRevenueChart, 50);
}

function statusBadge(status){
  const cls = status==="Livrée" ? "status-done" : status==="En livraison" ? "status-progress" : status==="Annulée" ? "status-cancel" : "status-pending";
  return `<span class="status-badge ${cls}">${escapeHtml(status)}</span>`;
}

function renderOrders(){
  const q = document.getElementById("ordersSearch").value.toLowerCase().trim();
  const status = document.getElementById("orderStatusFilter").value;
  const rows = data.orders.filter(o => {
    const match = [o.id,o.client,o.destination,o.driver].join(" ").toLowerCase().includes(q);
    return match && (status==="all" || o.status===status);
  });
  document.getElementById("ordersBody").innerHTML = rows.map(o => `
    <tr>
      <td><strong>${escapeHtml(o.id)}</strong></td>
      <td>${escapeHtml(o.client)}</td>
      <td>${escapeHtml(o.destination)}</td>
      <td>${escapeHtml(o.driver)}</td>
      <td>${money(o.amount)}</td>
      <td>${escapeHtml(o.date)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>
        <button class="action-btn" onclick="editOrder('${o.id}')" title="Modifier"><i class="bi bi-pencil"></i></button>
        <button class="action-btn delete" onclick="deleteOrder('${o.id}')" title="Supprimer"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("") || emptyRow(8);
}

function renderClients(){
  const q = document.getElementById("clientsSearch").value.toLowerCase().trim();
  const rows = data.clients.filter(c => [c.name,c.phone,c.email].join(" ").toLowerCase().includes(q));
  document.getElementById("clientsBody").innerHTML = rows.map(c => {
    const orders = data.orders.filter(o=>o.client===c.name);
    const total = orders.reduce((s,o)=>s+Number(o.amount),0);
    return `<tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.phone)}</td><td>${escapeHtml(c.email)}</td>
      <td>${orders.length}</td><td>${money(total)}</td>
      <td>
        <button class="action-btn" onclick="editClient(${c.id})"><i class="bi bi-pencil"></i></button>
        <button class="action-btn delete" onclick="deleteClient(${c.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join("") || emptyRow(6);
}

function renderDrivers(){
  document.getElementById("driversGrid").innerHTML = data.drivers.map(d => `
    <article class="driver-card">
      <div class="driver-top">
        <div class="driver-avatar">${escapeHtml(d.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase())}</div>
        <div><div class="driver-name">${escapeHtml(d.name)}</div><div class="driver-phone">${escapeHtml(d.phone)}</div></div>
        <span class="online-dot ${d.status!=="En ligne"?"offline":""}" title="${escapeHtml(d.status)}"></span>
      </div>
      <div class="driver-info">
        <div><span>Zone</span><strong>${escapeHtml(d.zone)}</strong></div>
        <div><span>Livraisons</span><strong>${d.deliveries}</strong></div>
      </div>
      <div class="driver-actions">
        <button class="action-btn" onclick="editDriver(${d.id})"><i class="bi bi-pencil"></i></button>
        <button class="action-btn delete" onclick="deleteDriver(${d.id})"><i class="bi bi-trash"></i></button>
      </div>
    </article>`).join("") || `<div class="empty-state">Aucun livreur.</div>`;
}

function renderRates(){
  document.getElementById("ratesGrid").innerHTML = data.rates.map(r => `
    <article class="rate-card">
      <div class="rate-actions">
        <button class="action-btn" onclick="editRate(${r.id})"><i class="bi bi-pencil"></i></button>
        <button class="action-btn delete" onclick="deleteRate(${r.id})"><i class="bi bi-trash"></i></button>
      </div>
      <h3>${escapeHtml(r.name)}</h3><div class="zone">${escapeHtml(r.zone)}</div>
      <div class="rate-price">${money(r.price)} <small>/ livraison</small></div>
      <div class="text-muted small">Tarif actif</div>
    </article>`).join("");
}

function renderStats(){
  const valid = data.orders.filter(o=>o.status!=="Annulée");
  const revenue = valid.reduce((s,o)=>s+Number(o.amount),0);
  const avg = valid.length ? revenue/valid.length : 0;
  const delivered = valid.length ? valid.filter(o=>o.status==="Livrée").length/valid.length*100 : 0;
  document.getElementById("statRevenue").textContent = money(revenue);
  document.getElementById("statOrders").textContent = data.orders.length;
  document.getElementById("statAverage").textContent = money(Math.round(avg));
  document.getElementById("statDeliveryRate").textContent = delivered.toFixed(0)+"%";
  setTimeout(drawStatsChart,50);
}

function drawRevenueChart(){
  const canvas = document.getElementById("revenueChart"); if(!canvas) return;
  if(revenueChart) revenueChart.destroy();
  const period = document.getElementById("dashboardPeriod").value;
  const labels = period==="week" ? ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"] : Array.from({length:30},(_,i)=>String(i+1));
  const values = labels.map((_,i)=> Math.max(5000, 7000 + Math.sin(i*1.3)*2800 + i*350));
  revenueChart = new Chart(canvas,{type:"line",data:{labels,datasets:[{label:"Revenus",data:values,borderColor:"#066b8c",backgroundColor:"rgba(6,107,140,.10)",fill:true,tension:.35,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>Number(v).toLocaleString("fr-FR")}},x:{grid:{display:false}}}}});
}

function drawStatsChart(){
  const canvas = document.getElementById("statsChart"); if(!canvas) return;
  if(statsChart) statsChart.destroy();
  const labels=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août"];
  const values=[42000,56000,49000,68000,72000,61000,78000,85000];
  statsChart = new Chart(canvas,{type:"bar",data:{labels,datasets:[{label:"FCFA",data:values,backgroundColor:"#066b8c",borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>Number(v).toLocaleString("fr-FR")+" FCFA"}},x:{grid:{display:false}}}}});
}

function fields(type,obj={}){
  if(type==="order") return `
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label-custom">Client</label><select class="form-select-custom" name="client">${data.clients.map(c=>`<option ${obj.client===c.name?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
      <div class="col-md-6"><label class="form-label-custom">Livreur</label><select class="form-select-custom" name="driver">${data.drivers.map(d=>`<option ${obj.driver===d.name?"selected":""}>${escapeHtml(d.name)}</option>`).join("")}</select></div>
      <div class="col-md-7"><label class="form-label-custom">Destination</label><input required class="form-control-custom" name="destination" value="${escapeHtml(obj.destination||"")}"></div>
      <div class="col-md-5"><label class="form-label-custom">Montant (FCFA)</label><input required type="number" min="0" class="form-control-custom" name="amount" value="${obj.amount||""}"></div>
      <div class="col-12"><label class="form-label-custom">Statut</label><select class="form-select-custom" name="status">${["En attente","En livraison","Livrée","Annulée"].map(s=>`<option ${obj.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
    </div>`;
  if(type==="client") return `<div class="mb-3"><label class="form-label-custom">Nom complet</label><input required class="form-control-custom" name="name" value="${escapeHtml(obj.name||"")}"></div><div class="mb-3"><label class="form-label-custom">Téléphone</label><input required class="form-control-custom" name="phone" value="${escapeHtml(obj.phone||"")}"></div><div><label class="form-label-custom">Email</label><input type="email" class="form-control-custom" name="email" value="${escapeHtml(obj.email||"")}"></div>`;
  if(type==="driver") return `<div class="mb-3"><label class="form-label-custom">Nom complet</label><input required class="form-control-custom" name="name" value="${escapeHtml(obj.name||"")}"></div><div class="mb-3"><label class="form-label-custom">Téléphone</label><input required class="form-control-custom" name="phone" value="${escapeHtml(obj.phone||"")}"></div><div class="mb-3"><label class="form-label-custom">Zone</label><input required class="form-control-custom" name="zone" value="${escapeHtml(obj.zone||"")}"></div><div><label class="form-label-custom">Statut</label><select class="form-select-custom" name="status"><option ${obj.status==="En ligne"?"selected":""}>En ligne</option><option ${obj.status==="Hors ligne"?"selected":""}>Hors ligne</option></select></div>`;
  if(type==="rate") return `<div class="mb-3"><label class="form-label-custom">Nom du tarif</label><input required class="form-control-custom" name="name" value="${escapeHtml(obj.name||"")}"></div><div class="mb-3"><label class="form-label-custom">Zone</label><input required class="form-control-custom" name="zone" value="${escapeHtml(obj.zone||"")}"></div><div><label class="form-label-custom">Prix (FCFA)</label><input required type="number" min="0" class="form-control-custom" name="price" value="${obj.price||""}"></div>`;
}

function openModal(title,type,obj={},id=null){
  currentModalMode=type; currentEditId=id;
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalBody").innerHTML=fields(type,obj);
  appModal.show();
}
function openOrderModal(obj={},id=null){openModal(id?"Modifier la commande":"Nouvelle commande","order",obj,id)}
function openClientModal(obj={},id=null){openModal(id?"Modifier le client":"Ajouter un client","client",obj,id)}
function openDriverModal(obj={},id=null){openModal(id?"Modifier le livreur":"Ajouter un livreur","driver",obj,id)}
function openRateModal(obj={},id=null){openModal(id?"Modifier le tarif":"Ajouter un tarif","rate",obj,id)}

function submitModalForm(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const v = Object.fromEntries(fd.entries());
  if(currentModalMode==="order"){
    v.amount=Number(v.amount); v.date=currentEditId ? data.orders.find(o=>o.id===currentEditId).date : today();
    if(currentEditId) Object.assign(data.orders.find(o=>o.id===currentEditId),v);
    else { v.id="CMD-"+(1000+data.orders.length+1); data.orders.unshift(v); }
    notify(currentEditId?"Commande modifiée.":"Commande créée.");
  }
  if(currentModalMode==="client"){
    if(currentEditId) Object.assign(data.clients.find(c=>c.id===currentEditId),v);
    else data.clients.push({id:nextId(data.clients),...v});
    notify(currentEditId?"Client modifié.":"Client ajouté.");
  }
  if(currentModalMode==="driver"){
    v.deliveries= currentEditId ? (data.drivers.find(d=>d.id===currentEditId).deliveries||0) : 0;
    if(currentEditId) Object.assign(data.drivers.find(d=>d.id===currentEditId),v);
    else data.drivers.push({id:nextId(data.drivers),...v});
    notify(currentEditId?"Livreur modifié.":"Livreur ajouté.");
  }
  if(currentModalMode==="rate"){
    v.price=Number(v.price);
    if(currentEditId) Object.assign(data.rates.find(r=>r.id===currentEditId),v);
    else data.rates.push({id:nextId(data.rates),...v});
    notify(currentEditId?"Tarif modifié.":"Tarif ajouté.");
  }
  saveData(); appModal.hide(); renderAll();
}

window.editOrder = id => { const o=data.orders.find(x=>x.id===id); if(o) openOrderModal(o,id); };
window.deleteOrder = id => confirmDelete("Supprimer cette commande ?",()=>{data.orders=data.orders.filter(x=>x.id!==id);saveData();renderAll();notify("Commande supprimée.")});
window.editClient = id => { const c=data.clients.find(x=>x.id===id); if(c) openClientModal(c,id); };
window.deleteClient = id => confirmDelete("Supprimer ce client ?",()=>{data.clients=data.clients.filter(x=>x.id!==id);saveData();renderAll();notify("Client supprimé.")});
window.editDriver = id => { const d=data.drivers.find(x=>x.id===id); if(d) openDriverModal(d,id); };
window.deleteDriver = id => confirmDelete("Supprimer ce livreur ?",()=>{data.drivers=data.drivers.filter(x=>x.id!==id);saveData();renderAll();notify("Livreur supprimé.")});
window.editRate = id => { const r=data.rates.find(x=>x.id===id); if(r) openRateModal(r,id); };
window.deleteRate = id => confirmDelete("Supprimer ce tarif ?",()=>{data.rates=data.rates.filter(x=>x.id!==id);saveData();renderAll();notify("Tarif supprimé.")});

function confirmDelete(text,cb){
  document.getElementById("confirmTitle").textContent="Confirmation";
  document.getElementById("confirmText").textContent=text;
  confirmCallback=cb; confirmModal.show();
}

function globalSearch(e){
  const q=e.target.value.toLowerCase().trim(), box=document.getElementById("searchResults");
  if(!q){box.classList.remove("show");box.innerHTML="";return}
  const orders=data.orders.filter(o=>[o.id,o.client,o.destination].join(" ").toLowerCase().includes(q)).slice(0,4);
  const clients=data.clients.filter(c=>[c.name,c.phone,c.email].join(" ").toLowerCase().includes(q)).slice(0,4);
  const items=[
    ...orders.map(o=>`<button class="search-item" onclick="openSearchResult('commandes')"><strong>${escapeHtml(o.id)}</strong><small>Commande · ${escapeHtml(o.client)}</small></button>`),
    ...clients.map(c=>`<button class="search-item" onclick="openSearchResult('clients')"><strong>${escapeHtml(c.name)}</strong><small>Client · ${escapeHtml(c.phone)}</small></button>`)
  ];
  box.innerHTML=items.join("")||`<div class="search-item"><small>Aucun résultat.</small></div>`;
  box.classList.add("show");
}
window.openSearchResult = page => { document.getElementById("searchResults").classList.remove("show");document.getElementById("globalSearch").value="";showPage(page); };

function openProfile(){
  openModal("Mon profil","client",{name:"Admin Principal",phone:"+228 00 00 00 00",email:"admin@bide.tg"},null);
  document.getElementById("appForm").querySelectorAll("input").forEach(i=>i.disabled=true);
  document.querySelector("#appForm .btn-primary-custom").style.display="none";
}
document.getElementById("appModal").addEventListener("hidden.bs.modal",()=>{
  const btn=document.querySelector("#appForm .btn-primary-custom"); if(btn) btn.style.display="";
  document.getElementById("appForm").querySelectorAll("input").forEach(i=>i.disabled=false);
});

function logout(){
  confirmDelete("Voulez-vous vraiment vous déconnecter ?",()=>{
    notify("Déconnexion effectuée. Simulation terminée.");
  });
}

function emptyRow(cols){return `<tr><td colspan="${cols}"><div class="empty-state"><i class="bi bi-inbox"></i>Aucun résultat trouvé.</div></td></tr>`}

function exportCSV(){
  const headers=["ID","Client","Destination","Livreur","Montant","Date","Statut"];
  const lines=[headers,...data.orders.map(o=>[o.id,o.client,o.destination,o.driver,o.amount,o.date,o.status])]
    .map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+lines],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bide-statistiques.csv";a.click();URL.revokeObjectURL(a.href);
}
