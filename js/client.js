/* =========================================================
   BIDE PRESSING - ESPACE CLIENT*/

// -------- CLES DU LOCALSTORAGE (identiques dans app.js) --------
var CLE_COMMANDES = 'bide_orders';
var CLE_CLIENTS = 'bide_clients';
var CLE_TARIFS = 'bide_rates';
var CLE_PROFIL = 'bide_client_profile';

// -------- LISTE DES CATEGORIES (utilisée aussi côté admin) --------
var CATEGORIES = [
  { id: 'quotidien', label: 'Vêtements Quotidiens' },
  { id: 'maison', label: 'Linge de Maison' },
  { id: 'delicat', label: 'Pièces Délicates' }
];

// -------- CATALOGUE PAR DEFAUT --------
// Ce catalogue n'est utilisé que la toute première fois,
// avant que l'admin n'ait rien modifié dans "Catalogue & Tarifs".
var catalogueParDefaut = [
  { id: 'chemise', name: 'Chemise (Cintrée)', category: 'quotidien', price: 1500, unit: 'pièce', service: 'Lavage & Repassage', icon: 'bi-person-workspace' },
  { id: 'costume', name: 'Costume complet', category: 'delicat', price: 7000, unit: 'pièce', service: 'Nettoyage à sec', icon: 'bi-square-fill' },
  { id: 'pantalon', name: 'Pantalon Simple', category: 'quotidien', price: 2000, unit: 'pièce', service: 'Lavage & Repassage', icon: 'bi-layers' },
  { id: 'drap', name: 'Drap de Lit (Grand)', category: 'maison', price: 3000, unit: 'pièce', service: 'Lavage complet', icon: 'bi-house-heart' },
  { id: 'robe', name: 'Robe de Soirée', category: 'delicat', price: 2500, unit: 'pièce', service: 'Soin spécialisé', icon: 'bi-stars' },
  { id: 'tshirt', name: 'T-shirt', category: 'quotidien', price: 1000, unit: 'pièce', service: 'Lavage & Repassage', icon: 'bi-person' },
  { id: 'veste', name: 'Veste/Manteau', category: 'quotidien', price: 3500, unit: 'pièce', service: 'Lavage complet', icon: 'bi-stars' },
  { id: 'jupe', name: 'Jupe', category: 'quotidien', price: 2000, unit: 'pièce', service: 'Lavage & Repassage', icon: 'bi-layers' },
  { id: 'taies', name: "Taies d'oreiller", category: 'maison', price: 1500, unit: 'pièce', service: 'Lavage complet', icon: 'bi-house-heart' },
  { id: 'nappes', name: 'Nappes', category: 'maison', price: 2500, unit: 'pièce', service: 'Lavage complet', icon: 'bi-house-heart' },
  { id: 'serviette', name: 'Serviette', category: 'maison', price: 1500, unit: 'pièce', service: 'Lavage complet', icon: 'bi-house-heart' },
  { id: 'rideau', name: 'Rideau', category: 'maison', price: 5000, unit: 'pièce', service: 'Lavage complet', icon: 'bi-house-heart' }
];

// -------- PROFIL CLIENT PAR DEFAUT --------
var profilParDefaut = {
  name: 'AK Amenouveve Light',
  phone: '+228 70 17 33 46',
  email: 'amenouvevelight@gmail.com',
  address: 'Résidence colas, 6 immeuble, Lomé',
  avatar: ''
};

// -------- VARIABLES GLOBALES --------
var catalogProducts = [];      // le catalogue affiché (vient du localStorage)
var monProfil = {};            // les infos du client connecté
var panier = {};                // panier en cours : { idProduit: quantite }
var mesCommandes = [];          // toutes les commandes de CE client

var modeLivraison = 'home';
var modePaiement = 'mobile';

// =========================================================
// PETITS OUTILS POUR LIRE / ECRIRE DANS LE LOCALSTORAGE
// =========================================================
function lireStorage(cle, valeurParDefaut) {
  var texte = localStorage.getItem(cle);
  if (!texte) {
    return valeurParDefaut;
  }
  return JSON.parse(texte);
}

function ecrireStorage(cle, valeur) {
  localStorage.setItem(cle, JSON.stringify(valeur));
}

function labelCategorie(idCategorie) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === idCategorie) {
      return CATEGORIES[i].label;
    }
  }
  return idCategorie;
}

// On transforme un statut en numéro d'étape (1 à 5) pour la barre de suivi
function etapeDepuisStatut(statut) {
  if (statut === 'En attente') return 1;
  if (statut === 'Commande Enrégstré') return 2;
  if (statut === 'Lavage en cours') return 2;
  if (statut === 'Prêt & Emballé') return 3;
  if (statut === 'En livraison') return 4;
  if (statut === 'Livrée') return 5;
  return 1;
}


// CHARGEMENT DES DONNEES DEPUIS LE LOCALSTORAGE

function chargerDonnees() {
  // 1) le catalogue : si l'admin en a déjà enregistré un, on le prend.
  //    sinon on enregistre le catalogue par défaut pour la première fois.
  if (localStorage.getItem(CLE_TARIFS)) {
    catalogProducts = lireStorage(CLE_TARIFS, catalogueParDefaut);
  } else {
    catalogProducts = catalogueParDefaut;
    ecrireStorage(CLE_TARIFS, catalogProducts);
  }

  // 2) le profil du client connecté
  monProfil = lireStorage(CLE_PROFIL, profilParDefaut);
  if (!localStorage.getItem(CLE_PROFIL)) {
    ecrireStorage(CLE_PROFIL, monProfil);
  }

  // 3) les commandes : on lit TOUTES les commandes du pressing,
  //    puis on ne garde que celles qui appartiennent à ce client.
  var toutesLesCommandes = lireStorage(CLE_COMMANDES, []);
  mesCommandes = [];
  for (var i = 0; i < toutesLesCommandes.length; i++) {
    if (toutesLesCommandes[i].clientName === monProfil.name) {
      mesCommandes.push(toutesLesCommandes[i]);
    }
  }
}

// On ajoute (ou remplace) UNE commande dans la liste globale, puis on sauvegarde
function sauvegarderCommande(commande) {
  var toutesLesCommandes = lireStorage(CLE_COMMANDES, []);
  toutesLesCommandes.unshift(commande);
  ecrireStorage(CLE_COMMANDES, toutesLesCommandes);
}


// AU CHARGEMENT DE LA PAGE

document.addEventListener('DOMContentLoaded', function () {
  chargerDonnees();

  initMenuMobile();
  initNavigation();

  renderProfil();
  renderCatalogue('all');
  renderDashboard();
  renderSuivi();
  renderHistorique();

  // Si l'admin change quelque chose (statut, livreur, tarif...) dans un
  // AUTRE onglet, le navigateur envoie un événement "storage" ici.
  // On en profite pour tout ré-afficher avec les données à jour.
  window.addEventListener('storage', function (evenement) {
    if (evenement.key === CLE_COMMANDES || evenement.key === CLE_TARIFS) {
      chargerDonnees();
      renderCatalogue('all');
      renderDashboard();
      renderSuivi();
      renderHistorique();
    }
  });
});

function initMenuMobile() {
  var boutonMenu = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');

  function fermerMenu() {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  }

  boutonMenu.addEventListener('click', function () {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
  });

  overlay.addEventListener('click', fermerMenu);
}

function initNavigation() {
  var liens = document.querySelectorAll('.sidebar-menu .nav-link');
  for (var i = 0; i < liens.length; i++) {
    liens[i].addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo(this.getAttribute('data-target'));
    });
  }
}

function navigateTo(idCible) {
  var onglets = document.querySelectorAll('.tab-pane-custom');
  for (var i = 0; i < onglets.length; i++) {
    onglets[i].classList.remove('active');
  }

  var liens = document.querySelectorAll('.sidebar-menu .nav-link');
  for (var j = 0; j < liens.length; j++) {
    if (liens[j].getAttribute('data-target') === idCible) {
      liens[j].classList.add('active');
    } else {
      liens[j].classList.remove('active');
    }
  }

  var ongletActif = document.getElementById(idCible);
  if (ongletActif) {
    ongletActif.classList.add('active');
  }

  document.getElementById('sidebar').classList.remove('show');
  document.getElementById('sidebar-overlay').classList.remove('show');

  if (idCible === 'checkout') {
    renderCheckoutPage();
  }
}

// =========================================================
// TABLEAU DE BORD
// =========================================================
function renderDashboard() {
  var container = document.getElementById('dashboard-content-area');
  container.innerHTML = '';

  var commandesActives = getCommandesActives();

  if (commandesActives.length === 0) {
    container.innerHTML =
      '<div class="empty-state-card border-0 mb-4">' +
        '<div class="empty-state-icon"><i class="bi bi-basket3"></i></div>' +
        '<h4 class="fw-bold text-dark mb-2">Vous n\'avez aucune commande en cours</h4>' +
        '<p class="text-muted mb-4 mx-auto" style="max-width: 500px;">' +
          'Confiez-nous le soin de votre linge dès aujourd\'hui. Dépôt rapide en agence ou collecte directe à votre domicile.' +
        '</p>' +
        '<button class="btn btn-cta btn-lg px-4 py-3 fw-bold" onclick="navigateTo(\'new-order\')">' +
          '<i class="bi bi-plus-circle me-2"></i>Passer une nouvelle commande' +
        '</button>' +
      '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < commandesActives.length; i++) {
    var o = commandesActives[i];
    html +=
      '<div class="col-md-6">' +
        '<div class="p-3 border rounded-3 bg-white shadow-sm d-flex justify-content-between align-items-center">' +
          '<div>' +
            '<span class="badge bg-light text-dark fw-bold mb-1">#' + o.id + '</span>' +
            '<h6 class="fw-bold mb-0">' + o.items + '</h6>' +
            '<small class="text-muted">' + (o.deliveryMode === 'home' ? 'Livraison Domicile' : 'Retrait Agence') + '</small>' +
          '</div>' +
          '<button class="btn btn-brand-outline btn-sm" onclick="navigateTo(\'tracking\')">Suivre</button>' +
        '</div>' +
      '</div>';
  }

  container.innerHTML =
    '<div class="card border-0 shadow-sm p-4 rounded-4 mb-4">' +
      '<div class="d-flex justify-content-between align-items-center mb-3">' +
        '<h5 class="fw-bold mb-0">Commandes actives (' + commandesActives.length + ')</h5>' +
        '<button class="btn btn-brand-outline btn-sm" onclick="navigateTo(\'tracking\')">Voir le suivi complet</button>' +
      '</div>' +
      '<div class="row g-3">' + html + '</div>' +
    '</div>';
}

function getCommandesActives() {
  var resultat = [];
  for (var i = 0; i < mesCommandes.length; i++) {
    if (mesCommandes[i].status !== 'Livrée' && mesCommandes[i].status !== 'Annulée') {
      resultat.push(mesCommandes[i]);
    }
  }
  return resultat;
}

// =========================================================
// CATALOGUE / NOUVELLE COMMANDE
// =========================================================
function renderCatalogue(categorieChoisie) {
  var grille = document.getElementById('articles-grid');
  grille.innerHTML = '';

  var listeAffichee = [];
  for (var i = 0; i < catalogProducts.length; i++) {
    var produit = catalogProducts[i];
    if (categorieChoisie === 'all' || produit.category === categorieChoisie) {
      listeAffichee.push(produit);
    }
  }

  for (var j = 0; j < listeAffichee.length; j++) {
    var p = listeAffichee[j];
    var quantite = panier[p.id] || 0;

    var colonne = document.createElement('div');
    colonne.className = 'col-12 col-md-6';
    colonne.innerHTML =
      '<div class="service-card d-flex flex-column justify-content-between">' +
        '<div class="d-flex justify-content-between align-items-start mb-3">' +
          '<div class="d-flex align-items-center gap-3">' +
            '<div class="icon-box"><i class="bi ' + (p.icon || 'bi-basket') + '"></i></div>' +
            '<div>' +
              '<h6 class="fw-bold mb-0">' + p.name + '</h6>' +
              '<small class="text-muted">' + (p.service || labelCategorie(p.category)) + '</small>' +
            '</div>' +
          '</div>' +
          '<span class="fw-bold text-nowrap" style="color: var(--bleu-pressing);">' + Number(p.price).toLocaleString() + ' CFA</span>' +
        '</div>' +
        '<div class="d-flex justify-content-center align-items-center gap-4 bg-light p-2 rounded-3">' +
          '<button class="counter-btn" onclick="updateCartQuantity(\'' + p.id + '\', -1)">-</button>' +
          '<span class="fw-bold" id="qty-' + p.id + '">' + quantite + '</span>' +
          '<button class="counter-btn" style="background: var(--bleu-pressing); color: white;" onclick="updateCartQuantity(\'' + p.id + '\', 1)">+</button>' +
        '</div>' +
      '</div>';
    grille.appendChild(colonne);
  }

  var boutonsFiltre = document.querySelectorAll('#category-filters .category-pill');
  for (var k = 0; k < boutonsFiltre.length; k++) {
    boutonsFiltre[k].onclick = function () {
      for (var m = 0; m < boutonsFiltre.length; m++) {
        boutonsFiltre[m].classList.remove('active');
      }
      this.classList.add('active');
      renderCatalogue(this.getAttribute('data-cat'));
    };
  }
}

function updateCartQuantity(idProduit, delta) {
  var quantiteActuelle = panier[idProduit] || 0;
  var nouvelleQuantite = Math.max(0, quantiteActuelle + delta);

  if (nouvelleQuantite === 0) {
    delete panier[idProduit];
  } else {
    panier[idProduit] = nouvelleQuantite;
  }

  var span = document.getElementById('qty-' + idProduit);
  if (span) {
    span.innerText = nouvelleQuantite;
  }

  updateCartSummary();
}

function trouverProduit(idProduit) {
  for (var i = 0; i < catalogProducts.length; i++) {
    if (catalogProducts[i].id === idProduit) {
      return catalogProducts[i];
    }
  }
  return null;
}

function updateCartSummary() {
  var container = document.getElementById('cart-summary-items');
  container.innerHTML = '';

  var idsPanier = Object.keys(panier);
  var sousTotal = 0;

  if (idsPanier.length === 0) {
    container.innerHTML = '<p class="text-muted small mb-0">Votre panier est vide.</p>';
  } else {
    for (var i = 0; i < idsPanier.length; i++) {
      var produit = trouverProduit(idsPanier[i]);
      var quantite = panier[idsPanier[i]];
      var totalArticle = produit.price * quantite;
      sousTotal += totalArticle;

      var ligne = document.createElement('div');
      ligne.className = 'd-flex justify-content-between mb-2 small';
      ligne.innerHTML =
        '<span>' + produit.name + ' (x' + quantite + ')</span>' +
        '<span class="fw-semibold">' + totalArticle.toLocaleString() + ' CFA</span>';
      container.appendChild(ligne);
    }
  }

  document.getElementById('cart-subtotal').innerText = sousTotal.toLocaleString() + ' CFA';
  document.getElementById('cart-total').innerText = sousTotal.toLocaleString() + ' CFA';
  document.getElementById('btn-proceed-checkout').disabled = sousTotal === 0;
}

// =========================================================
// LIVRAISON / PAIEMENT (CHECKOUT)
// =========================================================
function selectDeliveryMode(mode) {
  modeLivraison = mode;
  document.getElementById('option-delivery-home').classList.toggle('selected', mode === 'home');
  document.getElementById('option-delivery-store').classList.toggle('selected', mode === 'store');
  document.getElementById('home-address-block').style.display = mode === 'home' ? 'block' : 'none';
  renderCheckoutPage();
}

function selectPaymentMode(mode) {
  modePaiement = mode;
  var modes = ['mobile', 'card', 'cash'];
  for (var i = 0; i < modes.length; i++) {
    var carte = document.getElementById('pay-' + modes[i]);
    var estSelectionne = modes[i] === mode;
    carte.classList.toggle('selected', estSelectionne);
    carte.querySelector('.check-icon').classList.toggle('d-none', !estSelectionne);
  }
}

function libellePaiement(mode) {
  if (mode === 'card') return 'Carte Visa/MC';
  if (mode === 'cash') return 'Espèces';
  return 'Mobile Money';
}

function renderCheckoutPage() {
  var liste = document.getElementById('checkout-summary-list');
  liste.innerHTML = '';
  var sousTotal = 0;

  var idsPanier = Object.keys(panier);
  for (var i = 0; i < idsPanier.length; i++) {
    var produit = trouverProduit(idsPanier[i]);
    var quantite = panier[idsPanier[i]];
    var totalArticle = produit.price * quantite;
    sousTotal += totalArticle;

    var ligne = document.createElement('div');
    ligne.className = 'd-flex justify-content-between mb-2 small';
    ligne.innerHTML = '<span>' + produit.name + ' (x' + quantite + ')</span><span class="fw-bold">' + totalArticle.toLocaleString() + ' CFA</span>';
    liste.appendChild(ligne);
  }

  var fraisLivraison = modeLivraison === 'home' ? 1000 : 0;

  document.getElementById('checkout-subtotal').innerText = sousTotal.toLocaleString() + ' CFA';
  document.getElementById('checkout-shipping').innerText = fraisLivraison.toLocaleString() + ' CFA';
  document.getElementById('checkout-final-total').innerText = (sousTotal + fraisLivraison).toLocaleString() + ' CFA';
}

function confirmOrderProcess() {
  var idsPanier = Object.keys(panier);
  if (idsPanier.length === 0) {
    return;
  }

  var sousTotal = 0;
  var listeArticlesTexte = [];

  for (var i = 0; i < idsPanier.length; i++) {
    var produit = trouverProduit(idsPanier[i]);
    var quantite = panier[idsPanier[i]];
    sousTotal += produit.price * quantite;
    listeArticlesTexte.push(quantite + ' ' + produit.name);
  }

  var fraisLivraison = modeLivraison === 'home' ? 1000 : 0;
  var nouvelId = 'BD-' + Math.floor(1000 + Math.random() * 9000);

  var adresseUtilisee = modeLivraison === 'home'
    ? document.getElementById('checkout-address-input').value
    : 'Retrait en agence';

  // Cette commande utilise EXACTEMENT les mêmes noms de champs que
  // ceux attendus par l'admin (app.js) : clientName, phone, address,
  // total, status, driver, date...
  var commande = {
    id: nouvelId,
    clientName: monProfil.name,
    phone: monProfil.phone,
    email: monProfil.email,
    address: adresseUtilisee,
    items: listeArticlesTexte.join(', '),
    deliveryMode: modeLivraison,
    paymentMode: libellePaiement(modePaiement),
    subtotal: sousTotal,
    shipping: fraisLivraison,
    total: sousTotal + fraisLivraison,
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'En attente',  // Statut de départ, l'admin le fera évoluer
    driver: ''             // Pas encore de livreur assigné
  };

  sauvegarderCommande(commande);
  chargerDonnees();

  panier = {};
  renderCatalogue('all');
  updateCartSummary();

  renderDashboard();
  renderSuivi();
  renderHistorique();

  alert('Commande #' + nouvelId + ' enregistrée et réglée avec succès !');
  navigateTo('tracking');
}

// =========================================================
// SUIVI DES COMMANDES
// =========================================================
function renderSuivi() {
  var container = document.getElementById('active-trackings-container');
  container.innerHTML = '';

  var commandesActives = getCommandesActives();

  if (commandesActives.length === 0) {
    container.innerHTML =
      '<div class="card border-0 shadow-sm rounded-4 p-5 text-center">' +
        '<i class="bi bi-clock-history fs-1 text-muted mb-3"></i>' +
        '<h5>Aucun suivi en cours</h5>' +
        '<p class="text-muted">Vous n\'avez aucune commande en cours de nettoyage.</p>' +
        '<div class="mt-2">' +
          '<button class="btn btn-cta" onclick="navigateTo(\'new-order\')">Créer une commande</button>' +
        '</div>' +
      '</div>';
    return;
  }

  for (var i = 0; i < commandesActives.length; i++) {
    var order = commandesActives[i];
    var etape = etapeDepuisStatut(order.status);

    var etapes = [
      { titre: 'Commande enregistrée', description: 'Paiement confirmé' },
      { titre: order.deliveryMode === 'home' ? 'Collecte à domicile' : 'Dépôt en Agence', description: order.deliveryMode === 'home' ? 'Articles récupérés chez vous' : 'Articles déposés au comptoir' },
      { titre: 'Lavage & Soin', description: 'Nettoyage en cours dans nos ateliers' },
      { titre: 'Prêt & Emballé', description: 'Contrôle qualité effectué' },
      { titre: order.deliveryMode === 'home' ? 'Livré à domicile' : 'Retiré en Agence', description: 'Commande terminée' }
    ];

    var htmlEtapes = '';
    for (var e = 0; e < etapes.length; e++) {
      var numero = e + 1;
      var classeEtat = '';
      if (numero < etape) classeEtat = 'completed';
      if (numero === etape) classeEtat = 'active';

      htmlEtapes +=
        '<div class="step-item ' + classeEtat + '">' +
          '<div class="step-icon">' + (numero < etape ? '<i class="bi bi-check"></i>' : numero) + '</div>' +
          '<h6 class="fw-bold mb-0">' + etapes[e].titre + '</h6>' +
          '<small class="text-muted">' + etapes[e].description + '</small>' +
        '</div>';
    }

    var carte = document.createElement('div');
    carte.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4';
    carte.innerHTML =
      '<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">' +
        '<div>' +
          '<span class="badge bg-light text-dark fw-bold mb-1">#' + order.id + '</span>' +
          '<h5 class="fw-bold mb-0">' + order.items + '</h5>' +
        '</div>' +
        '<span class="badge-encours">' + (order.deliveryMode === 'home' ? 'LIVRAISON DOMICILE' : 'RETRAIT AGENCE') + '</span>' +
      '</div>' +
      '<div class="row mt-4">' +
        '<div class="col-md-7"><div class="vertical-stepper">' + htmlEtapes + '</div></div>' +
        '<div class="col-md-5 bg-light p-3 rounded-3 d-flex flex-column justify-content-between">' +
          '<div>' +
            '<h6 class="fw-bold mb-2">Résumé du règlement</h6>' +
            '<div class="d-flex justify-content-between small mb-1"><span>Statut actuel :</span><span class="fw-semibold">' + order.status + '</span></div>' +
            '<div class="d-flex justify-content-between small mb-1"><span>Livreur :</span><span class="fw-semibold">' + (order.driver || 'Non assigné') + '</span></div>' +
            '<div class="d-flex justify-content-between small mb-1"><span>Paiement :</span><span class="fw-semibold">' + order.paymentMode + '</span></div>' +
            '<hr>' +
            '<div class="d-flex justify-content-between fw-bold"><span>Total payé :</span><span style="color: var(--bleu-pressing);">' + order.total.toLocaleString() + ' CFA</span></div>' +
          '</div>' +
          '<div class="mt-3">' +
            '<p class="small text-muted mb-2"><i class="bi bi-arrow-repeat me-1"></i>Le statut est mis à jour par l\'agence Bidè.</p>' +
            '<button class="btn btn-brand-outline btn-sm w-100 mb-2" onclick="actualiserMesCommandes()">' +
              '<i class="bi bi-arrow-clockwise me-1"></i> Actualiser le statut' +
            '</button>' +
            '<button class="btn btn-light btn-sm w-100 border" onclick="openReceiptModal(\'' + order.id + '\')">' +
              '<i class="bi bi-file-earmark-pdf me-1"></i> Reçu de paiement' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.appendChild(carte);
  }
}

// Permet au client de forcer un rafraîchissement (utile si l'admin
// a modifié la commande dans le même onglet/navigateur pendant les tests)
function actualiserMesCommandes() {
  chargerDonnees();
  renderDashboard();
  renderSuivi();
  renderHistorique();
}

// =========================================================
// HISTORIQUE
// =========================================================
function renderHistorique() {
  var tbody = document.getElementById('history-table-body');
  tbody.innerHTML = '';

  if (mesCommandes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Aucune commande enregistrée dans l\'historique.</td></tr>';
    return;
  }

  for (var i = 0; i < mesCommandes.length; i++) {
    var item = mesCommandes[i];
    var classeBadge = item.status === 'Livrée' ? 'badge-livre' : 'badge-encours';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="fw-bold py-3 px-4" style="color: var(--bleu-pressing);">#' + item.id + '</td>' +
      '<td class="py-3 px-4">' + item.date + '</td>' +
      '<td class="py-3 px-4"><span class="badge bg-light text-dark border">' + (item.deliveryMode === 'home' ? 'Domicile' : 'Agence') + '</span></td>' +
      '<td class="py-3 px-4">' + item.items + '</td>' +
      '<td class="fw-bold py-3 px-4">' + item.total.toLocaleString() + ' CFA</td>' +
      '<td class="py-3 px-4"><span class="' + classeBadge + '">' + item.status + '</span></td>' +
      '<td class="py-3 px-4 text-end"><button class="btn btn-sm btn-brand-outline" onclick="openReceiptModal(\'' + item.id + '\')">Détails & Reçu</button></td>';
    tbody.appendChild(tr);
  }
}

function openReceiptModal(idCommande) {
  var commande = null;
  for (var i = 0; i < mesCommandes.length; i++) {
    if (mesCommandes[i].id === idCommande) {
      commande = mesCommandes[i];
      break;
    }
  }
  if (!commande) return;

  document.getElementById('modal-order-id').innerText = '#' + commande.id;
  document.getElementById('modal-order-date').innerText = commande.date;
  document.getElementById('modal-order-mode').innerText = commande.deliveryMode === 'home' ? 'Livraison Domicile' : 'Retrait Agence';
  document.getElementById('modal-order-pay').innerText = commande.paymentMode;
  document.getElementById('modal-order-items').innerText = commande.items;
  document.getElementById('modal-order-subtotal').innerText = commande.subtotal.toLocaleString() + ' CFA';
  document.getElementById('modal-order-shipping').innerText = commande.shipping.toLocaleString() + ' CFA';
  document.getElementById('modal-order-total').innerText = commande.total.toLocaleString() + ' CFA';

  var modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
  modal.show();
}

// =========================================================
// PROFIL CLIENT
// =========================================================
function renderProfil() {
  var initiales = calculerInitiales(monProfil.name);

  var avatarHeader = document.getElementById('user-avatar');
  var avatarProfil = document.getElementById('profile-avatar');

  if (monProfil.avatar) {
    avatarHeader.innerHTML = '<img src="' + monProfil.avatar + '" alt="Photo de profil">';
    avatarProfil.innerHTML = '<img src="' + monProfil.avatar + '" alt="Photo de profil">';
  } else {
    avatarHeader.innerText = initiales;
    avatarProfil.innerText = initiales;
  }

  document.getElementById('header-user-name').innerText = monProfil.name;
  document.getElementById('profile-card-name').innerText = monProfil.name;

  var nomsAffiches = document.querySelectorAll('.user-display-name');
  for (var i = 0; i < nomsAffiches.length; i++) {
    nomsAffiches[i].innerText = monProfil.name;
  }

  document.getElementById('dash-address-display').innerText = monProfil.address;
  document.getElementById('checkout-address-input').value = monProfil.address;

  document.getElementById('profile-name').value = monProfil.name;
  document.getElementById('profile-phone').value = monProfil.phone;
  document.getElementById('profile-email').value = monProfil.email;
  document.getElementById('profile-address').value = monProfil.address;
}

function calculerInitiales(nomComplet) {
  var mots = nomComplet.trim().split(' ');
  if (mots.length === 1) {
    return mots[0].substring(0, 2).toUpperCase();
  }
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

function handleAvatarUpload(event) {
  var fichier = event.target.files[0];
  if (!fichier) return;

  var lecteur = new FileReader();
  lecteur.onload = function (e) {
    monProfil.avatar = e.target.result;
    ecrireStorage(CLE_PROFIL, monProfil);
    renderProfil();
  };
  lecteur.readAsDataURL(fichier);
}

function saveProfile(event) {
  event.preventDefault();

  monProfil.name = document.getElementById('profile-name').value;
  monProfil.phone = document.getElementById('profile-phone').value;
  monProfil.email = document.getElementById('profile-email').value;
  monProfil.address = document.getElementById('profile-address').value;

  ecrireStorage(CLE_PROFIL, monProfil);
  chargerDonnees(); // on recharge pour que "mesCommandes" reste bien filtré sur le nouveau nom
  renderProfil();

  alert('Informations personnelles sauvegardées !');
}

function changePassword(event) {
  event.preventDefault();
  var nouveauMdp = document.getElementById('new-pass').value;
  var confirmationMdp = document.getElementById('confirm-pass').value;

  if (nouveauMdp !== confirmationMdp) {
    alert('Le nouveau mot de passe et la confirmation ne correspondent pas.');
    return;
  }

  alert('Mot de passe mis à jour avec succès !');
  document.getElementById('password-form').reset();
};

 if (!utilisateur || utilisateur.role !== 'client') {
    alert("Accès refusé. Vous n'avez pas les autorisations nécessaires.");
    window.location.href = "../pages/index.html";
  }