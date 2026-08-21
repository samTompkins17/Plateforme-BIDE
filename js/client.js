const catalogProducts = [
  { id: 'chemise', name: 'Chemise / Chemisier', category: 'quotidien', price: 2500, service: 'Lavage & Repassage', icon: 'bi-person-workspace' },
  { id: 'costume', name: 'Costume 2 Pièces', category: 'delicat', price: 7000, service: 'Nettoyage à sec', icon: 'bi-square-fill' },
  { id: 'pantalon', name: 'Pantalon Simple', category: 'quotidien', price: 2000, service: 'Lavage & Repassage', icon: 'bi-layers' },
  { id: 'drap', name: 'Drap de Lit (Grand)', category: 'maison', price: 3500, service: 'Lavage complet', icon: 'bi-house-heart' },
  { id: 'robe', name: 'Robe de Soirée', category: 'delicat', price: 5500, service: 'Soin spécialisé', icon: 'bi-stars' }
];

let cart = {}; 
let activeOrders = []; 
let orderHistory = []; 

let deliveryMode = 'home';
let paymentMode = 'mobile';

document.addEventListener('DOMContentLoaded', () => {
  initMobileSidebar();
  initNavigation();
  renderCatalog('all');
  renderDashboard();
  renderTrackingList();
  renderHistoryTable();
});

function initMobileSidebar() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function close() {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
  });

  overlay.addEventListener('click', close);
}

function navigateTo(targetId) {
  document.querySelectorAll('.tab-pane-custom').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    if (link.getAttribute('data-target') === targetId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const activePane = document.getElementById(targetId);
  if (activePane) activePane.classList.add('active');

  document.getElementById('sidebar').classList.remove('show');
  document.getElementById('sidebar-overlay').classList.remove('show');

  if (targetId === 'checkout') renderCheckoutPage();
}

function initNavigation() {
  document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.getAttribute('data-target'));
    });
  });
}

function renderDashboard() {
  const container = document.getElementById('dashboard-content-area');
  container.innerHTML = '';

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card border-0 mb-4">
        <div class="empty-state-icon">
          <i class="bi bi-basket3"></i>
        </div>
        <h4 class="fw-bold text-dark mb-2">Vous n'avez aucune commande en cours</h4>
        <p class="text-muted mb-4 mx-auto" style="max-width: 500px;">
          Confiez-nous le soin de votre linge dès aujourd'hui. Dépôt rapide en agence ou collecte directe à votre domicile.
        </p>
        <button class="btn btn-cta btn-lg px-4 py-3 fw-bold" onclick="navigateTo('new-order')">
          <i class="bi bi-plus-circle me-2"></i>Passer une nouvelle commande
        </button>
      </div>
    `;
  } else {
    let ordersHtml = '';
    activeOrders.forEach(o => {
      ordersHtml += `
        <div class="col-md-6">
          <div class="p-3 border rounded-3 bg-white shadow-sm d-flex justify-content-between align-items-center">
            <div>
              <span class="badge bg-light text-dark fw-bold mb-1">${o.id}</span>
              <h6 class="fw-bold mb-0">${o.items}</h6>
              <small class="text-muted">${o.deliveryMode === 'home' ? 'Livraison Domicile' : 'Retrait Agence'}</small>
            </div>
            <button class="btn btn-brand-outline btn-sm" onclick="navigateTo('tracking')">Suivre</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="card border-0 shadow-sm p-4 rounded-4 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Commandes actives (${activeOrders.length})</h5>
          <button class="btn btn-brand-outline btn-sm" onclick="navigateTo('tracking')">Voir le suivi complet</button>
        </div>
        <div class="row g-3">
          ${ordersHtml}
        </div>
      </div>
    `;
  }
}

function renderCatalog(categoryFilter = 'all') {
  const grid = document.getElementById('articles-grid');
  grid.innerHTML = '';

  const filtered = categoryFilter === 'all' 
    ? catalogProducts 
    : catalogProducts.filter(p => p.category === categoryFilter);

  filtered.forEach(p => {
    const qty = cart[p.id] || 0;
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';
    col.innerHTML = `
      <div class="service-card d-flex flex-column justify-content-between">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box"><i class="bi ${p.icon}"></i></div>
            <div>
              <h6 class="fw-bold mb-0">${p.name}</h6>
              <small class="text-muted">${p.service}</small>
            </div>
          </div>
          <span class="fw-bold text-nowrap" style="color: var(--bleu-pressing);">${p.price.toLocaleString()} CFA</span>
        </div>
        <div class="d-flex justify-content-center align-items-center gap-4 bg-light p-2 rounded-3">
          <button class="counter-btn" onclick="updateCartQuantity('${p.id}', -1)">-</button>
          <span class="fw-bold" id="qty-${p.id}">${qty}</span>
          <button class="counter-btn" style="background: var(--bleu-pressing); color: white;" onclick="updateCartQuantity('${p.id}', 1)">+</button>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });

  document.querySelectorAll('#category-filters .category-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#category-filters .category-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCatalog(btn.getAttribute('data-cat'));
    };
  });
}

function updateCartQuantity(productId, delta) {
  const currentQty = cart[productId] || 0;
  const newQty = Math.max(0, currentQty + delta);
  
  if (newQty === 0) {
    delete cart[productId];
  } else {
    cart[productId] = newQty;
  }

  const qtyElem = document.getElementById(`qty-${productId}`);
  if (qtyElem) qtyElem.innerText = newQty;

  updateCartSummary();
}

function updateCartSummary() {
  const summaryItemsContainer = document.getElementById('cart-summary-items');
  summaryItemsContainer.innerHTML = '';

  let subtotal = 0;
  const keys = Object.keys(cart);

  if (keys.length === 0) {
    summaryItemsContainer.innerHTML = '<p class="text-muted small mb-0">Votre panier est vide.</p>';
  } else {
    keys.forEach(id => {
      const product = catalogProducts.find(p => p.id === id);
      const qty = cart[id];
      const itemTotal = product.price * qty;
      subtotal += itemTotal;

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between mb-2 small';
      row.innerHTML = `
        <span>${product.name} (x${qty})</span>
        <span class="fw-semibold">${itemTotal.toLocaleString()} CFA</span>
      `;
      summaryItemsContainer.appendChild(row);
    });
  }

  document.getElementById('cart-subtotal').innerText = `${subtotal.toLocaleString()} CFA`;
  document.getElementById('cart-total').innerText = `${subtotal.toLocaleString()} CFA`;
  document.getElementById('btn-proceed-checkout').disabled = subtotal === 0;
}

function selectDeliveryMode(mode) {
  deliveryMode = mode;
  document.getElementById('option-delivery-home').classList.toggle('selected', mode === 'home');
  document.getElementById('option-delivery-store').classList.toggle('selected', mode === 'store');
  document.getElementById('home-address-block').style.display = mode === 'home' ? 'block' : 'none';
  renderCheckoutPage();
}

function selectPaymentMode(mode) {
  paymentMode = mode;
  const modes = ['mobile', 'card', 'cash'];
  modes.forEach(m => {
    const card = document.getElementById(`pay-${m}`);
    const isSelected = m === mode;
    card.classList.toggle('selected', isSelected);
    card.querySelector('.check-icon').classList.toggle('d-none', !isSelected);
  });
}

function renderCheckoutPage() {
  const summaryList = document.getElementById('checkout-summary-list');
  summaryList.innerHTML = '';
  let subtotal = 0;

  Object.keys(cart).forEach(id => {
    const product = catalogProducts.find(p => p.id === id);
    const qty = cart[id];
    const itemTotal = product.price * qty;
    subtotal += itemTotal;

    const row = document.createElement('div');
    row.className = 'd-flex justify-content-between mb-2 small';
    row.innerHTML = `<span>${product.name} (x${qty})</span><span class="fw-bold">${itemTotal.toLocaleString()} CFA</span>`;
    summaryList.appendChild(row);
  });

  const shipping = deliveryMode === 'home' ? 1000 : 0;

  document.getElementById('checkout-subtotal').innerText = `${subtotal.toLocaleString()} CFA`;
  document.getElementById('checkout-shipping').innerText = `${shipping.toLocaleString()} CFA`;
  document.getElementById('checkout-final-total').innerText = `${(subtotal + shipping).toLocaleString()} CFA`;
}

function confirmOrderProcess() {
  const keys = Object.keys(cart);
  if (keys.length === 0) return;

  let subtotal = 0;
  let itemsArray = [];

  keys.forEach(id => {
    const product = catalogProducts.find(p => p.id === id);
    subtotal += product.price * cart[id];
    itemsArray.push(`${cart[id]} ${product.name}`);
  });

  const shipping = deliveryMode === 'home' ? 1000 : 0;
  const newOrderId = '#BD-' + Math.floor(1000 + Math.random() * 9000);

  let pModeLabel = 'Mobile Money';
  if (paymentMode === 'card') pModeLabel = 'Carte Visa/MC';
  if (paymentMode === 'cash') pModeLabel = 'Espèces';

  const orderObj = {
    id: newOrderId,
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    items: itemsArray.join(', '),
    deliveryMode: deliveryMode,
    paymentMode: pModeLabel,
    subtotal: subtotal,
    shipping: shipping,
    total: subtotal + shipping,
    step: 1,
    status: 'En traitement'
  };

  activeOrders.unshift(orderObj);
  orderHistory.unshift(orderObj);

  cart = {};
  renderCatalog('all');
  updateCartSummary();

  renderDashboard();
  renderTrackingList();
  renderHistoryTable();

  alert(`Commande ${newOrderId} enregistrée et réglée avec succès !`);
  navigateTo('tracking');
}

function renderTrackingList() {
  const container = document.getElementById('active-trackings-container');
  container.innerHTML = '';

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
        <i class="bi bi-clock-history fs-1 text-muted mb-3"></i>
        <h5>Aucun suivi en cours</h5>
        <p class="text-muted">Vous n'avez aucune commande en cours de nettoyage.</p>
        <div class="mt-2">
          <button class="btn btn-cta" onclick="navigateTo('new-order')">Créer une commande</button>
        </div>
      </div>
    `;
    return;
  }

  activeOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4';

    const steps = [
      { title: 'Commande enregistrée', desc: 'Paiement confirmé' },
      { title: order.deliveryMode === 'home' ? 'Collecte à domicile' : 'Dépôt en Agence', desc: order.deliveryMode === 'home' ? 'Articles récupérés chez vous' : 'Articles déposés au comptoir' },
      { title: 'Lavage & Soin', desc: 'Nettoyage en cours dans nos ateliers' },
      { title: 'Prêt & Emballé', desc: 'Contrôle qualité effectué' },
      { title: order.deliveryMode === 'home' ? 'Livré à domicile' : 'Retiré en Agence', desc: 'Commande terminée' }
    ];

    let stepperHtml = '';
    steps.forEach((s, idx) => {
      const stepNum = idx + 1;
      let stateClass = '';
      if (stepNum < order.step) stateClass = 'completed';
      if (stepNum === order.step) stateClass = 'active';

      stepperHtml += `
        <div class="step-item ${stateClass}">
          <div class="step-icon">${stepNum < order.step ? '<i class="bi bi-check"></i>' : stepNum}</div>
          <h6 class="fw-bold mb-0">${s.title}</h6>
          <small class="text-muted">${s.desc}</small>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <span class="badge bg-light text-dark fw-bold mb-1">${order.id}</span>
          <h5 class="fw-bold mb-0">${order.items}</h5>
        </div>
        <span class="badge-encours">${order.deliveryMode === 'home' ? 'LIVRAISON DOMICILE' : 'RETRAIT AGENCE'}</span>
      </div>

      <div class="row mt-4">
        <div class="col-md-7">
          <div class="vertical-stepper">
            ${stepperHtml}
          </div>
        </div>
        <div class="col-md-5 bg-light p-3 rounded-3 d-flex flex-column justify-content-between">
          <div>
            <h6 class="fw-bold mb-2">Résumé du règlement</h6>
            <div class="d-flex justify-content-between small mb-1">
              <span>Paiement:</span>
              <span class="fw-semibold">${order.paymentMode}</span>
            </div>
            <div class="d-flex justify-content-between small mb-1">
              <span>Option:</span>
              <span class="fw-semibold">${order.deliveryMode === 'home' ? 'Domicile (+1000 CFA)' : 'Agence (Gratuit)'}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between fw-bold">
              <span>Total payé:</span>
              <span style="color: var(--bleu-pressing);">${order.total.toLocaleString()} CFA</span>
            </div>
          </div>
          
          <div class="mt-3">
            <button class="btn btn-brand-outline btn-sm w-100 mb-2" onclick="advanceOrderStep('${order.id}')">
              Simuler étape suivante <i class="bi bi-fast-forward-fill ms-1"></i>
            </button>
            <button class="btn btn-light btn-sm w-100 border" onclick="openReceiptModal('${order.id}')">
              <i class="bi bi-file-earmark-pdf me-1"></i> Reçu de paiement
            </button>
          </div>

        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function advanceOrderStep(orderId) {
  const order = activeOrders.find(o => o.id === orderId);
  if (order && order.step < 5) {
    order.step++;
    if (order.step === 5) {
      order.status = 'Livré';
    }
    renderTrackingList();
    renderHistoryTable();
  }
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  tbody.innerHTML = '';

  if (orderHistory.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Aucune commande enregistrée dans l\'historique.</td></tr>';
    return;
  }

  orderHistory.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold py-3 px-4" style="color: var(--bleu-pressing);">${item.id}</td>
      <td class="py-3 px-4">${item.date}</td>
      <td class="py-3 px-4"><span class="badge bg-light text-dark border">${item.deliveryMode === 'home' ? 'Domicile' : 'Agence'}</span></td>
      <td class="py-3 px-4">${item.items}</td>
      <td class="fw-bold py-3 px-4">${item.total.toLocaleString()} CFA</td>
      <td class="py-3 px-4"><span class="${item.status === 'Livré' ? 'badge-livre' : 'badge-encours'}">${item.status}</span></td>
      <td class="py-3 px-4 text-end">
        <button class="btn btn-sm btn-brand-outline" onclick="openReceiptModal('${item.id}')">
          Détails & Reçu
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openReceiptModal(orderId) {
  const order = orderHistory.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modal-order-id').innerText = order.id;
  document.getElementById('modal-order-date').innerText = order.date;
  document.getElementById('modal-order-mode').innerText = order.deliveryMode === 'home' ? 'Livraison Domicile' : 'Retrait Agence';
  document.getElementById('modal-order-pay').innerText = order.paymentMode;
  document.getElementById('modal-order-items').innerText = order.items;
  document.getElementById('modal-order-subtotal').innerText = `${order.subtotal.toLocaleString()} CFA`;
  document.getElementById('modal-order-shipping').innerText = `${order.shipping.toLocaleString()} CFA`;
  document.getElementById('modal-order-total').innerText = `${order.total.toLocaleString()} CFA`;

  const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
  modal.show();
}

// --- GESTION PHOTO DE PROFIL ET MOT DE PASSE ---
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imgUrl = e.target.result;
      document.getElementById('profile-avatar').innerHTML = `<img src="${imgUrl}" alt="Photo de profil">`;
      document.getElementById('user-avatar').innerHTML = `<img src="${imgUrl}" alt="Photo de profil">`;
    };
    reader.readAsDataURL(file);
  }
}

function saveProfile(event) {
  event.preventDefault();
  const newName = document.getElementById('profile-name').value;
  const newAddr = document.getElementById('profile-address').value;

  document.querySelectorAll('.user-display-name').forEach(el => el.innerText = newName);
  document.getElementById('header-user-name').innerText = newName;
  document.getElementById('profile-card-name').innerText = newName;
  document.getElementById('dash-address-display').innerText = newAddr;
  document.getElementById('checkout-address-input').value = newAddr;

  alert('Informations personnelles sauvegardées !');
}

function changePassword(event) {
  event.preventDefault();
  const current = document.getElementById('current-pass').value;
  const newP = document.getElementById('new-pass').value;
  const confirmP = document.getElementById('confirm-pass').value;

  if (newP !== confirmP) {
    alert('Le nouveau mot de passe et la confirmation ne correspondent pas.');
    return;
  }

  alert('Mot de passe mis à jour avec succès !');
  document.getElementById('password-form').reset();
}
