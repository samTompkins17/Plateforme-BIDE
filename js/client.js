/* =========================================================
   BIDE PRESSING - ESPACE CLIENT*/

// -------- CLES DU LOCALSTORAGE (identiques dans app.js) --------
let CLE_COMMANDES = 'bide_orders';
let CLE_TARIFS = 'bide_rates';
let CLE_PROFIL = 'bide_client_profile';
let CLE_UTILISATEURS = 'bide_users';
let CLE_CLIENTS = 'bide_clients';

// -------- LISTE DES CATEGORIES (utilisée aussi côté admin) --------
let CATEGORIES = [
  { id: 'quotidien', label: 'Vêtements Quotidiens' },
  { id: 'maison', label: 'Linge de Maison' },
  { id: 'delicat', label: 'Pièces Délicates' }
];

let STATUT_COMMANDE_VALIDEE = 'Commande Enregistrée';

// -------- CATALOGUE PAR DEFAUT --------
// Ce catalogue n'est utilisé que la toute première fois,
// avant que l'admin n'ait rien modifié dans "Catalogue & Tarifs".
let catalogueParDefaut = [
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
let profilParDefaut = {
  name: 'AK Amenouveve Light',
  phone: '+228 70 17 33 46',
  email: 'amenouvevelight@gmail.com',
  address: 'Résidence colas, 6 immeuble, Lomé',
  avatar: ''
};

// -------- VARIABLES GLOBALES --------
let catalogProducts = [];      // le catalogue affiché (vient du localStorage)
let monProfil = {};            // les infos du client connecté
let panier = {};                // panier en cours : { idProduit: quantite }
let mesCommandes = [];          // toutes les commandes de CE client

let modeLivraison = 'home';
let modePaiement = 'mobile';

// -------- NOTIFICATIONS CLIENT --------
// Clé séparée de celle de l'admin pour éviter les conflits
let CLE_NOTIFS_CLIENT = 'bide_client_notifications';
let notificationsClient = lireStorage(CLE_NOTIFS_CLIENT, []);

// -------- BROADCASTCHANNEL POUR SYNCHRONISATION MÊME ONGLET --------
// Le localStorage.storage ne se déclenche que dans les AUTRES onglets.
// Pour un rafraîchissement en temps réel dans le MÊME onglet,
// on utilise un canal de messagerie.
let canalBide = window.BroadcastChannel
  ? new BroadcastChannel('bide_sync')
  : { postMessage: function () {} };

if (window.BroadcastChannel) {
canalBide.onmessage = function (evenement) {
  let donnees = evenement.data;

  if (donnees.type === 'commandes_updated' || donnees.type === 'tarifs_updated') {
    chargerDonnees();
    renderCatalogue('all');
    renderDashboard();
    renderSuivi();
    renderHistorique();
  }

  if (donnees.type === 'notifications_client_updated') {
    notificationsClient = lireStorage(CLE_NOTIFS_CLIENT, []);
    mettreAJourBadgeNotificationsClient();
  }
};
}

// =========================================================
// PETITS OUTILS POUR LIRE / ECRIRE DANS LE LOCALSTORAGE
// =========================================================
// Lis la valeur JSON associée à une clé, ou renvoie la valeur par défaut
function lireStorage(cle, valeurParDefaut) {
  let texte = localStorage.getItem(cle);
  if (!texte) {
    return valeurParDefaut;
  }
  try {
    return JSON.parse(texte);
  } catch (error) {
    return valeurParDefaut;
  }
}

// Sérialise la valeur en JSON et la sauvegarde dans le localStorage
function ecrireStorage(cle, valeur) {
  localStorage.setItem(cle, JSON.stringify(valeur));
}

// Protège contre les failles XSS en convertissant les caractères
// spéciaux HTML en leurs équivalents échappés (& → &amp;, etc.)
function echapperHTML(valeur) {
  return String(valeur ?? '').replace(/[&<>"']/g, function (caractere) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[caractere];
  });
}

// Échappe les caractères spéciaux pour les insérer dans une
// chaîne JavaScript (utilisé dans les onclick générés dynamiquement)
function echapperJSChaine(valeur) {
  return String(valeur ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

// Lis la liste des utilisateurs inscrits depuis le localStorage
function lireUtilisateurs() {
  return lireStorage(CLE_UTILISATEURS, []);
}

// Sauvegarde la liste des utilisateurs dans le localStorage
function ecrireUtilisateurs(utilisateurs) {
  ecrireStorage(CLE_UTILISATEURS, utilisateurs);
}

// Lis la liste des fiches clients depuis le localStorage
function lireClients() {
  return lireStorage(CLE_CLIENTS, []);
}

// Sauvegarde la liste des fiches clients dans le localStorage
function ecrireClients(clients) {
  ecrireStorage(CLE_CLIENTS, clients);
}

// Renvoie le libellé lisible d'une catégorie à partir de son identifiant
function labelCategorie(idCategorie) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === idCategorie) {
      return CATEGORIES[i].label;
    }
  }
  return idCategorie;
}

// Normalise les anciennes variantes de statut vers la valeur canonique
// Gère les fautes de frappe historiques ("Enrégstré", "Enregistré")
function normaliserStatut(statut) {
  if (!statut) return 'En attente';
  if (statut === 'Commande Enrégstré' || statut === 'Commande Enregistré') {
    return STATUT_COMMANDE_VALIDEE;
  }
  return statut;
}

// Parcourt la liste des commandes et normalise les statuts.
// Renvoie un objet { commandes, aChange } pour savoir
// si des modifications ont été appliquées.
function normaliserCommandes(liste) {
  let aChange = false;
  if (!Array.isArray(liste)) {
    return { commandes: [], aChange: false };
  }

  for (let i = 0; i < liste.length; i++) {
    if (!liste[i]) continue;
    let statutNormalise = normaliserStatut(liste[i].status);
    if (liste[i].status !== statutNormalise) {
      liste[i].status = statutNormalise;
      aChange = true;
    }
  }

  return { commandes: liste, aChange: aChange };
}

// =========================================================
// SYSTÈME DE NOTIFICATIONS CLIENT
// =========================================================
// Ajoute une notification dans le localStorage et met à jour le badge
function ajouterNotificationClient(titre, texte, type) {
  let notif = {
    id: Date.now() + Math.random(),
    titre: titre,
    texte: texte,
    type: type || 'info',
    date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    lue: false
  };
  notificationsClient.unshift(notif);
  if (notificationsClient.length > 30) notificationsClient = notificationsClient.slice(0, 30);
  ecrireStorage(CLE_NOTIFS_CLIENT, notificationsClient);
  mettreAJourBadgeNotificationsClient();
}

// Met à jour le compteur et le contenu du dropdown notifications client
function mettreAJourBadgeNotificationsClient() {
  let nonLues = notificationsClient.filter(function (n) { return !n.lue; }).length;

  // Badge rouge sur la cloche
  let dot = document.querySelector('.notif-dot-client');
  if (dot) {
    dot.style.display = nonLues > 0 ? 'block' : 'none';
  }

  // Remplir le menu dropdown
  let menu = document.getElementById('clientNotificationMenu');
  let listeVide = document.getElementById('clientEmptyNotifications');
  if (!menu) return;

  // Supprimer les anciennes notifications du DOM
  let itemsExistants = menu.querySelectorAll('.notif-item-client');
  for (let n = 0; n < itemsExistants.length; n++) {
    itemsExistants[n].remove();
  }

  if (notificationsClient.length === 0) {
    if (listeVide) listeVide.style.display = 'block';
    return;
  }

  if (listeVide) listeVide.style.display = 'none';

  let maxAfficher = Math.min(notificationsClient.length, 8);
  for (let i = 0; i < maxAfficher; i++) {
    let notif = notificationsClient[i];
    let icone = 'bi-info-circle text-primary';
    if (notif.type === 'statut') icone = 'bi-arrow-repeat text-info';
    if (notif.type === 'confirmation') icone = 'bi-check-circle text-success';
    if (notif.type === 'livreur') icone = 'bi-bicycle text-success';
    if (notif.type === 'alerte') icone = 'bi-exclamation-triangle text-warning';
    if (notif.type === 'annulation') icone = 'bi-x-circle text-danger';

    let li = document.createElement('li');
    li.className = 'notif-item-client px-3 py-2' + (notif.lue ? '' : ' bg-light');
    li.innerHTML =
      '<div class="d-flex align-items-start gap-2">' +
        '<i class="bi ' + icone + ' mt-1"></i>' +
        '<div class="small">' +
          '<strong class="d-block">' + echapperHTML(notif.titre) + '</strong>' +
          '<span class="text-muted">' + echapperHTML(notif.texte) + '</span>' +
          '<small class="text-muted d-block">' + echapperHTML(notif.date) + '</small>' +
        '</div>' +
      '</div>';
    menu.appendChild(li);
  }

  // Bouton "Tout marquer comme lu" en bas
  let liMarquer = document.createElement('li');
  liMarquer.className = 'notif-item-client text-center px-2 py-2';
  liMarquer.innerHTML = '<button class="btn btn-sm btn-link text-decoration-none" id="clientMarkAllRead">Tout marquer comme lu</button>';
  menu.appendChild(liMarquer);

  let markBtn = document.getElementById('clientMarkAllRead');
  if (markBtn) {
    markBtn.addEventListener('click', function () {
      for (let m = 0; m < notificationsClient.length; m++) {
        notificationsClient[m].lue = true;
      }
      ecrireStorage(CLE_NOTIFS_CLIENT, notificationsClient);
      mettreAJourBadgeNotificationsClient();
    });
  }
}

// Convertit un statut admin en numéro d'étape (0-5)
// 0 = En attente (avant validation admin), 1-5 = étapes du traitement
function etapeDepuisStatut(statut) {
  if (statut === 'En attente') return 0;
  if (statut === STATUT_COMMANDE_VALIDEE) return 1;
  if (statut === 'Lavage en cours') return 2;
  if (statut === 'Prêt & Emballé') return 3;
  if (statut === 'En livraison') return 4;
  if (statut === 'Livrée') return 5;
  return 0;
}

// Génère un badge HTML coloré selon le statut de la commande (côté client)
function badgeStatutClient(statut) {
  let couleurs = {
    'En attente': { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
    [STATUT_COMMANDE_VALIDEE]: { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' },
    'Lavage en cours': { bg: '#e0f2fe', text: '#0284c7', border: '#38bdf8' },
    'Prêt & Emballé': { bg: '#ede9fe', text: '#6d28d9', border: '#8b5cf6' },
    'En livraison': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    'Livrée': { bg: '#d1fae5', text: '#059669', border: '#34d399' },
    'Annulée': { bg: '#fee2e2', text: '#dc2626', border: '#f87171' }
  };
  let c = couleurs[statut] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
  return '<span style="display:inline-block;background:' + c.bg + ';color:' + c.text + ';border:1px solid ' + c.border + ';border-radius:20px;padding:3px 12px;font-size:0.75rem;font-weight:600;white-space:nowrap;">' + echapperHTML(statut) + '</span>';
}

// CHARGEMENT DES DONNEES DEPUIS LE LOCALSTORAGE

// Charge toutes les données depuis le localStorage : catalogue, profil,
// et filtre les commandes pour ne garder que celles du client connecté
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
  //    On filtre par email (plus stable que le nom qui peut changer).
  let commandesNormalisees = normaliserCommandes(lireStorage(CLE_COMMANDES, []));
  let toutesLesCommandes = commandesNormalisees.commandes;
  if (commandesNormalisees.aChange) {
    ecrireStorage(CLE_COMMANDES, toutesLesCommandes);
  }
  mesCommandes = [];
  for (let i = 0; i < toutesLesCommandes.length; i++) {
    let cmd = toutesLesCommandes[i];
    if (cmd.email === monProfil.email || cmd.clientName === monProfil.name) {
      mesCommandes.push(cmd);
    }
  }
}

// Ajoute une nouvelle commande en tête de la liste globale des commandes
// dans le localStorage (le client et l'admin partagent la même liste)
function sauvegarderCommande(commande) {
  let toutesLesCommandes = lireStorage(CLE_COMMANDES, []);
  toutesLesCommandes.unshift(commande);
  ecrireStorage(CLE_COMMANDES, toutesLesCommandes);
}

// AU CHARGEMENT DE LA PAGE

document.addEventListener('DOMContentLoaded', function () {
  // -------- VERIFICATION AUTHENTIFICATION --------
  // Si l'utilisateur n'est pas connecté ou n'est pas client, on le bloque
  let donneesConnexion = localStorage.getItem('utilisateurConnecte');
  let utilisateur = donneesConnexion ? JSON.parse(donneesConnexion) : null;
  if (!utilisateur || utilisateur.role !== 'client') {
    alert("Accès refusé. Veuillez vous connecter en tant que client.");
    window.location.href = '../pages/login.html';
    return;
  }

  chargerDonnees();
  initMenuMobile();
  initNavigation();

  renderProfil();
  renderCatalogue('all');
  renderDashboard();
  renderSuivi();
  renderHistorique();
  mettreAJourBadgeNotificationsClient();

  // Bouton de déconnexion : nettoie le localStorage et redirige vers login
  let boutonDeconnexion = document.getElementById('logoutBtn');
  if (boutonDeconnexion) {
    boutonDeconnexion.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('utilisateurConnecte');
      localStorage.removeItem(CLE_PROFIL);
      window.location.href = '../pages/login.html';
    });
  }

  // Si l'admin change quelque chose (statut, livreur, tarif...) dans un
  // AUTRE onglet, le navigateur envoie un événement "storage" ici.
  // On détecte les changements de statut/livreur et on génère des notifications.
  window.addEventListener('storage', function (evenement) {
    if (evenement.key === CLE_COMMANDES || evenement.key === CLE_TARIFS) {
      chargerDonnees();
      renderCatalogue('all');
      renderDashboard();
      renderSuivi();
      renderHistorique();
    }

    // Si l'admin a modifié les notifications client directement
    if (evenement.key === CLE_NOTIFS_CLIENT) {
      notificationsClient = lireStorage(CLE_NOTIFS_CLIENT, []);
      mettreAJourBadgeNotificationsClient();
    }
  });
});

// Active le bouton hamburger pour ouvrir/fermer la sidebar sur mobile
function initMenuMobile() {
  let boutonMenu = document.getElementById('sidebar-toggle');
  let sidebar = document.getElementById('sidebar');
  let overlay = document.getElementById('sidebar-overlay');

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

// Attache un écouteur de clic à chaque lien de la sidebar pour naviguer entre onglets
function initNavigation() {
  let liens = document.querySelectorAll('.sidebar-menu .nav-link');
  for (let i = 0; i < liens.length; i++) {
    liens[i].addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo(this.getAttribute('data-target'));
    });
  }
}

// Affiche l'onglet correspondant à idCible et met à jour la classe active
// dans la sidebar + referme le menu mobile si ouvert
function navigateTo(idCible) {
  let onglets = document.querySelectorAll('.tab-pane-custom');
  for (let i = 0; i < onglets.length; i++) {
    onglets[i].classList.remove('active');
  }

  let liens = document.querySelectorAll('.sidebar-menu .nav-link');
  for (let j = 0; j < liens.length; j++) {
    if (liens[j].getAttribute('data-target') === idCible) {
      liens[j].classList.add('active');
    } else {
      liens[j].classList.remove('active');
    }
  }

  let ongletActif = document.getElementById(idCible);
  if (ongletActif) {
    ongletActif.classList.add('active');
  }

  document.getElementById('sidebar').classList.remove('show');
  document.getElementById('sidebar-overlay').classList.remove('show');

  // Rafraîchir les données quand on change d'onglet
  if (idCible === 'dashboard') {
    renderDashboard();
  }
  if (idCible === 'tracking') {
    renderSuivi();
  }
  if (idCible === 'orders') {
    renderHistorique();
  }
  if (idCible === 'checkout') {
    renderCheckoutPage();
  }
}

// =========================================================
// TABLEAU DE BORD
// =========================================================
function renderDashboard() {
  let container = document.getElementById('dashboard-content-area');
  container.innerHTML = '';

  let commandesActives = getCommandesActives();

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

  let html = '';
  for (let i = 0; i < commandesActives.length; i++) {
    let o = commandesActives[i];
    let idCommande = echapperHTML(o.id);
    html +=
      '<div class="col-md-6">' +
        '<div class="p-3 border rounded-3 bg-white shadow-sm d-flex justify-content-between align-items-center">' +
          '<div>' +
            '<span class="badge bg-light text-dark fw-bold mb-1">#' + idCommande + '</span>' +
            '<h6 class="fw-bold mb-0">' + echapperHTML(o.items) + '</h6>' +
            '<small class="text-muted mb-1 d-block">' + (o.deliveryMode === 'home' ? 'Livraison Domicile' : 'Retrait Agence') + '</small>' +
            badgeStatutClient(o.status) +
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

// Filtre les commandes pour ne garder que celles pas encore livrées ou annulées
// Filtre les commandes pour ne garder que celles pas encore livrées ou annulées
// Affiche tous les statuts y compris "En attente" pour que le client
// voie ses commandes en attente de validation
function getCommandesActives() {
  let resultat = [];
  for (let i = 0; i < mesCommandes.length; i++) {
    let s = mesCommandes[i].status;
    if (s !== 'Livrée' && s !== 'Annulée') {
      resultat.push(mesCommandes[i]);
    }
  }
  return resultat;
}

// =========================================================
// CATALOGUE / NOUVELLE COMMANDE
// =========================================================
function renderCatalogue(categorieChoisie) {
  let grille = document.getElementById('articles-grid');
  grille.innerHTML = '';

  let listeAffichee = [];
  for (let i = 0; i < catalogProducts.length; i++) {
    let produit = catalogProducts[i];
    if (categorieChoisie === 'all' || produit.category === categorieChoisie) {
      listeAffichee.push(produit);
    }
  }

  for (let j = 0; j < listeAffichee.length; j++) {
    let p = listeAffichee[j];
    let quantite = panier[p.id] || 0;
    let produitIdJS = echapperHTML(echapperJSChaine(p.id));
    let produitIdHTML = echapperHTML(p.id);
    let iconeProduit = /^[a-z0-9 -]+$/i.test(p.icon || '') ? p.icon : 'bi-basket';

    let colonne = document.createElement('div');
    colonne.className = 'col-12 col-md-6';
    colonne.innerHTML =
      '<div class="service-card d-flex flex-column justify-content-between">' +
          '<div class="d-flex justify-content-between align-items-start mb-3">' +
            '<div class="d-flex align-items-center gap-3">' +
              '<div class="icon-box"><i class="bi ' + iconeProduit + '"></i></div>' +
              '<div>' +
              '<h6 class="fw-bold mb-0">' + echapperHTML(p.name) + '</h6>' +
              '<small class="text-muted">' + echapperHTML(p.service || labelCategorie(p.category)) + '</small>' +
            '</div>' +
          '</div>' +
          '<span class="fw-bold text-nowrap" style="color: var(--bleu-pressing);">' + Number(p.price).toLocaleString() + ' CFA</span>' +
        '</div>' +
        '<div class="d-flex justify-content-center align-items-center gap-4 bg-light p-2 rounded-3">' +
          '<button class="counter-btn" onclick="updateCartQuantity(\'' + produitIdJS + '\', -1)">-</button>' +
          '<span class="fw-bold" id="qty-' + produitIdHTML + '">' + quantite + '</span>' +
          '<button class="counter-btn" style="background: var(--bleu-pressing); color: white;" onclick="updateCartQuantity(\'' + produitIdJS + '\', 1)">+</button>' +
        '</div>' +
      '</div>';
    grille.appendChild(colonne);
  }

  let boutonsFiltre = document.querySelectorAll('#category-filters .category-pill');
  for (let k = 0; k < boutonsFiltre.length; k++) {
    boutonsFiltre[k].onclick = function () {
      for (let m = 0; m < boutonsFiltre.length; m++) {
        boutonsFiltre[m].classList.remove('active');
      }
      this.classList.add('active');
      renderCatalogue(this.getAttribute('data-cat'));
    };
  }
}

// Incrémente ou décrémente la quantité d'un article dans le panier
// Supprime l'article si la quantité tombe à 0
function updateCartQuantity(idProduit, delta) {
  let quantiteActuelle = panier[idProduit] || 0;
  let nouvelleQuantite = Math.max(0, quantiteActuelle + delta);

  if (nouvelleQuantite === 0) {
    delete panier[idProduit];
  } else {
    panier[idProduit] = nouvelleQuantite;
  }

  let span = document.getElementById('qty-' + idProduit);
  if (span) {
    span.innerText = nouvelleQuantite;
  }

  updateCartSummary();
}

// Recherche un produit dans le catalogue par son id et renvoie l'objet ou null
function trouverProduit(idProduit) {
  for (let i = 0; i < catalogProducts.length; i++) {
    if (catalogProducts[i].id === idProduit) {
      return catalogProducts[i];
    }
  }
  return null;
}

// Met à jour l'affichage du récapitulatif panier (liste des articles, sous-total)
// et active/désactive le bouton de validation selon que le panier est vide ou non
function updateCartSummary() {
  let container = document.getElementById('cart-summary-items');
  container.innerHTML = '';

  let idsPanier = Object.keys(panier);
  let sousTotal = 0;

  if (idsPanier.length === 0) {
    container.innerHTML = '<p class="text-muted small mb-0">Votre panier est vide.</p>';
  } else {
    for (let i = 0; i < idsPanier.length; i++) {
      let produit = trouverProduit(idsPanier[i]);
      let quantite = panier[idsPanier[i]];
      // Si l'article a été supprimé du catalogue par l'admin,
      // on le retire du panier et on saute cet itération
      if (!produit) {
        delete panier[idsPanier[i]];
        continue;
      }
      let totalArticle = produit.price * quantite;
      sousTotal += totalArticle;

      let ligne = document.createElement('div');
      ligne.className = 'd-flex justify-content-between mb-2 small';
      ligne.innerHTML =
        '<span>' + echapperHTML(produit.name) + ' (x' + quantite + ')</span>' +
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
// Bascule le mode de livraison (domicile vs agence) et rafraîchit la page checkout
function selectDeliveryMode(mode) {
  modeLivraison = mode;
  document.getElementById('option-delivery-home').classList.toggle('selected', mode === 'home');
  document.getElementById('option-delivery-store').classList.toggle('selected', mode === 'store');
  document.getElementById('home-address-block').style.display = mode === 'home' ? 'block' : 'none';
  renderCheckoutPage();
}

// Bascule le mode de paiement (mobile, carte, espèces) et met à jour l'UI
function selectPaymentMode(mode) {
  modePaiement = mode;
  let modes = ['mobile', 'card', 'cash'];
  for (let i = 0; i < modes.length; i++) {
    let carte = document.getElementById('pay-' + modes[i]);
    let estSelectionne = modes[i] === mode;
    carte.classList.toggle('selected', estSelectionne);
    carte.querySelector('.check-icon').classList.toggle('d-none', !estSelectionne);
  }
}

// Renvoie le libellé lisible du mode de paiement pour l'affichage
function libellePaiement(mode) {
  if (mode === 'card') return 'Carte Visa/MC';
  if (mode === 'cash') return 'Espèces';
  return 'Mobile Money';
}

// Affiche le récapitulatif de la page checkout (articles, sous-total, frais, total)
function renderCheckoutPage() {
  let liste = document.getElementById('checkout-summary-list');
  liste.innerHTML = '';
  let sousTotal = 0;

  let idsPanier = Object.keys(panier);
  for (let i = 0; i < idsPanier.length; i++) {
    let produit = trouverProduit(idsPanier[i]);
    let quantite = panier[idsPanier[i]];
    // Si l'article n'existe plus dans le catalogue, on le saute
    if (!produit) continue;
    let totalArticle = produit.price * quantite;
    sousTotal += totalArticle;

    let ligne = document.createElement('div');
    ligne.className = 'd-flex justify-content-between mb-2 small';
    ligne.innerHTML = '<span>' + echapperHTML(produit.name) + ' (x' + quantite + ')</span><span class="fw-bold">' + totalArticle.toLocaleString() + ' CFA</span>';
    liste.appendChild(ligne);
  }

  let fraisLivraison = modeLivraison === 'home' ? 1000 : 0;

  document.getElementById('checkout-subtotal').innerText = sousTotal.toLocaleString() + ' CFA';
  document.getElementById('checkout-shipping').innerText = fraisLivraison.toLocaleString() + ' CFA';
  document.getElementById('checkout-final-total').innerText = (sousTotal + fraisLivraison).toLocaleString() + ' CFA';
}

// Valide la commande : génère un id, crée l'objet commande avec les champs
// attendus par l'admin, sauvegarde dans le localStorage, vide le panier et redirige
function confirmOrderProcess() {
  let idsPanier = Object.keys(panier);
  if (idsPanier.length === 0) {
    return;
  }

  let sousTotal = 0;
  let listeArticlesTexte = [];

  for (let i = 0; i < idsPanier.length; i++) {
    let produit = trouverProduit(idsPanier[i]);
    let quantite = panier[idsPanier[i]];
    if (!produit) {
      delete panier[idsPanier[i]];
      continue;
    }
    sousTotal += produit.price * quantite;
    listeArticlesTexte.push(quantite + ' ' + produit.name);
  }

  if (listeArticlesTexte.length === 0) {
    updateCartSummary();
    alert("Les articles sélectionnés ne sont plus disponibles. Veuillez refaire votre panier.");
    navigateTo('new-order');
    return;
  }

  let fraisLivraison = modeLivraison === 'home' ? 1000 : 0;
  // Générer un ID unique en vérifiant qu'il n'existe pas déjà
  let toutesLesCommandes = lireStorage(CLE_COMMANDES, []);
  let nouvelId;
  let tentative = 0;
  do {
    nouvelId = 'BD-' + Math.floor(1000 + Math.random() * 9000);
    tentative++;
  } while (tentative < 100 && toutesLesCommandes.some(function (c) { return c.id === nouvelId; }));

  let adresseUtilisee = modeLivraison === 'home'
    ? document.getElementById('checkout-address-input').value.trim()
    : 'Retrait en agence';

  if (modeLivraison === 'home' && adresseUtilisee.length < 5) {
    alert("Veuillez renseigner une adresse de collecte et livraison valide.");
    return;
  }

  // Cette commande utilise EXACTEMENT les mêmes noms de champs que
  // ceux attendus par l'admin (app.js) : clientName, phone, address,
  // total, status, driver, date...
  let commande = {
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

  // Notifier l'onglet admin via BroadcastChannel
  canalBide.postMessage({ type: 'commandes_updated' });

  panier = {};
  renderCatalogue('all');
  updateCartSummary();

  renderDashboard();
  renderSuivi();
  renderHistorique();

  alert('Commande #' + nouvelId + ' envoyée avec succès !\n\nEn attente de validation par l\'agence Bidé.\nVous recevrez une notification une fois confirmée.');
  navigateTo('dashboard');
}

// =========================================================
// SUIVI DES COMMANDES
// =========================================================
// Affiche les cartes de suivi des commandes actives avec le stepper d'étapes
// Aligné sur les statuts admin : Commande Enregistrée → Lavage en cours →
// Prêt & Emballé → En livraison → Livrée
function renderSuivi() {
  let container = document.getElementById('active-trackings-container');
  container.innerHTML = '';

  let commandesActives = getCommandesActives();

  if (commandesActives.length === 0) {
    container.innerHTML =
      '<div class="card border-0 shadow-sm rounded-4 p-5 text-center">' +
        '<i class="bi bi-clock-history fs-1 text-muted mb-3"></i>' +
        '<h5>Aucun suivi en cours</h5>' +
        '<p class="text-muted">Vous n\'avez aucune commande pour le moment.</p>' +
        '<div class="mt-2">' +
          '<button class="btn btn-cta" onclick="navigateTo(\'new-order\')">Créer une commande</button>' +
        '</div>' +
      '</div>';
    return;
  }

  for (let i = 0; i < commandesActives.length; i++) {
    let order = commandesActives[i];
    let etape = etapeDepuisStatut(order.status);
    let idCommande = echapperHTML(order.id);
    let idCommandeJS = echapperHTML(echapperJSChaine(order.id));
    let articlesCommande = echapperHTML(order.items);

    // -------- CAS SPÉCIAL : EN ATTENTE --------
    // La commande n'a pas encore été validée par l'admin.
    // On affiche une carte simplifiée sans stepper.
    if (etape === 0) {
      let carteAttente = document.createElement('div');
      carteAttente.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4';
      carteAttente.innerHTML =
        '<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">' +
          '<div>' +
            '<span class="badge bg-light text-dark fw-bold mb-1">#' + idCommande + '</span>' +
            '<h5 class="fw-bold mb-0">' + articlesCommande + '</h5>' +
          '</div>' +
          '<div class="d-flex align-items-center gap-2">' +
            badgeStatutClient(order.status) +
            '<span class="badge bg-light text-dark" style="font-size:0.7rem;">' + (order.deliveryMode === 'home' ? 'DOMICILE' : 'AGENCE') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="bg-warning bg-opacity-10 border border-warning rounded-3 p-4 text-center">' +
          '<i class="bi bi-hourglass-split text-warning fs-3 mb-2 d-block"></i>' +
          '<h6 class="fw-bold text-dark mb-1">En attente de validation</h6>' +
          '<p class="text-muted small mb-3">Votre commande a été enregistrée avec succès. L\'agence va la valider plus tard</p>' +
          '<div class="d-flex justify-content-center gap-2 flex-wrap">' +
            '<button class="btn btn-brand-outline btn-sm" onclick="actualiserMesCommandes()">' +
              '<i class="bi bi-arrow-clockwise me-1"></i> Actualiser' +
            '</button>' +
            '<button class="btn btn-light btn-sm border" onclick="openReceiptModal(\'' + idCommandeJS + '\')">' +
              '<i class="bi bi-file-earmark-pdf me-1"></i> Reçu' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mt-3 row small text-muted">' +
          '<div class="col-4 text-center"><i class="bi bi-calendar me-1"></i>' + echapperHTML(order.date) + '</div>' +
          '<div class="col-4 text-center"><i class="bi bi-credit-card me-1"></i>' + echapperHTML(order.paymentMode) + '</div>' +
          '<div class="col-4 text-center fw-bold" style="color: var(--bleu-pressing);">' + order.total.toLocaleString() + ' CFA</div>' +
        '</div>';
      container.appendChild(carteAttente);
      continue;
    }

    // -------- CAS NORMAL : STEPPER 5 ÉTAPES --------
    // Les 5 étapes du stepper client (mappées aux statuts admin)
    let etapes = [
      {
        titre: 'Commande confirmée',
        description: 'L\'agence a accepté votre commande',
        statut: STATUT_COMMANDE_VALIDEE
      },
      {
        titre: 'Lavage en cours',
        description: 'Nettoyage en cours dans nos ateliers',
        statut: 'Lavage en cours'
      },
      {
        titre: 'Prêt & Emballé',
        description: 'Contrôle qualité effectué, prêt pour la livraison',
        statut: 'Prêt & Emballé'
      },
      {
        titre: 'En livraison',
        description: order.deliveryMode === 'home' ? 'En route vers votre domicile' : 'Disponible en agence pour retrait',
        statut: 'En livraison'
      },
      {
        titre: order.deliveryMode === 'home' ? 'Livré à domicile' : 'Retiré en Agence',
        description: 'Commande terminée',
        statut: 'Livrée'
      }
    ];

    // Construction du stepper vertical
    let htmlEtapes = '';
    for (let e = 0; e < etapes.length; e++) {
      let numero = e + 1;
      let classeEtat = '';
      if (numero < etape) classeEtat = 'completed';
      if (numero === etape) classeEtat = 'active';

      htmlEtapes +=
        '<div class="step-item ' + classeEtat + '">' +
          '<div class="step-icon">' + (numero < etape ? '<i class="bi bi-check"></i>' : numero) + '</div>' +
          '<div>' +
            '<h6 class="fw-bold mb-0">' + etapes[e].titre + '</h6>' +
            '<small class="text-muted">' + etapes[e].description + '</small>' +
          '</div>' +
        '</div>';
    }

    // Panneau latéral : infos résumé
    let htmlInfo =
      '<h6 class="fw-bold mb-3">Détails de la commande</h6>' +
      '<div class="mb-2">' + badgeStatutClient(order.status) + '</div>' +
      '<div class="d-flex justify-content-between small mb-2 mt-3"><span class="text-muted">Commande :</span><span class="fw-bold">#' + idCommande + '</span></div>' +
      '<div class="d-flex justify-content-between small mb-2"><span class="text-muted">Articles :</span><span class="fw-semibold text-end" style="max-width:180px;">' + articlesCommande + '</span></div>' +
      '<div class="d-flex justify-content-between small mb-2"><span class="text-muted">Mode :</span><span class="fw-semibold">' + (order.deliveryMode === 'home' ? 'Livraison domicile' : 'Retrait agence') + '</span></div>' +
      '<div class="d-flex justify-content-between small mb-2"><span class="text-muted">Livreur :</span><span class="fw-semibold">' + echapperHTML(order.driver || 'Non assigné') + '</span></div>' +
      '<div class="d-flex justify-content-between small mb-2"><span class="text-muted">Paiement :</span><span class="fw-semibold">' + echapperHTML(order.paymentMode) + '</span></div>' +
      '<div class="d-flex justify-content-between small mb-2"><span class="text-muted">Date :</span><span class="fw-semibold">' + echapperHTML(order.date) + '</span></div>' +
      '<hr class="my-2">' +
      '<div class="d-flex justify-content-between fw-bold"><span>Total payé :</span><span style="color: var(--bleu-pressing);">' + order.total.toLocaleString() + ' CFA</span>';

    // Carte de suivi complète
    let carte = document.createElement('div');
    carte.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4';
    carte.innerHTML =
      '<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">' +
        '<div>' +
          '<span class="badge bg-light text-dark fw-bold mb-1">#' + idCommande + '</span>' +
          '<h5 class="fw-bold mb-0">' + articlesCommande + '</h5>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-2">' +
          badgeStatutClient(order.status) +
          '<span class="badge bg-light text-dark" style="font-size:0.7rem;">' + (order.deliveryMode === 'home' ? 'DOMICILE' : 'AGENCE') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="row mt-3">' +
        '<div class="col-md-7"><div class="vertical-stepper">' + htmlEtapes + '</div></div>' +
        '<div class="col-md-5 bg-light p-3 rounded-3">' +
          htmlInfo +
          '<div class="mt-3">' +
            '<button class="btn btn-brand-outline btn-sm w-100 mb-2" onclick="actualiserMesCommandes()">' +
              '<i class="bi bi-arrow-clockwise me-1"></i> Actualiser' +
            '</button>' +
            '<button class="btn btn-light btn-sm w-100 border" onclick="openReceiptModal(\'' + idCommandeJS + '\')">' +
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
// Remplit le tableau d'historique avec toutes les commandes du client
function renderHistorique() {
  let tbody = document.getElementById('history-table-body');
  tbody.innerHTML = '';

  // Affiche toutes les commandes du client (tous statuts)
  if (mesCommandes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Aucune commande dans l\'historique.</td></tr>';
    return;
  }

  for (let ii = 0; ii < mesCommandes.length; ii++) {
    let item = mesCommandes[ii];
    let idCommande = echapperHTML(item.id);
    let idCommandeJS = echapperHTML(echapperJSChaine(item.id));

    let tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="fw-bold py-3 px-4" style="color: var(--bleu-pressing);">#' + idCommande + '</td>' +
      '<td class="py-3 px-4">' + echapperHTML(item.date) + '</td>' +
      '<td class="py-3 px-4"><span class="badge bg-light text-dark border">' + (item.deliveryMode === 'home' ? 'Domicile' : 'Agence') + '</span></td>' +
      '<td class="py-3 px-4">' + echapperHTML(item.items) + '</td>' +
      '<td class="fw-bold py-3 px-4">' + item.total.toLocaleString() + ' CFA</td>' +
      '<td class="py-3 px-4">' + badgeStatutClient(item.status) + '</td>' +
      '<td class="py-3 px-4 text-end"><button class="btn btn-sm btn-brand-outline" onclick="openReceiptModal(\'' + idCommandeJS + '\')">Détails & Reçu</button></td>';
    tbody.appendChild(tr);
  }
}

// Ouvre la modale de reçu de paiement pour une commande donnée
function openReceiptModal(idCommande) {
  let commande = null;
  for (let i = 0; i < mesCommandes.length; i++) {
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

  let modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
  modal.show();
}

// =========================================================
// PROFIL CLIENT
// =========================================================
// Remplit tous les champs du formulaire profil et les avatars
// avec les données de monProfil (ou les initiales si pas de photo)
function renderProfil() {
  let initiales = calculerInitiales(monProfil.name);

  let avatarHeader = document.getElementById('user-avatar');
  let avatarProfil = document.getElementById('profile-avatar');

  if (monProfil.avatar) {
    let avatarSrc = echapperHTML(monProfil.avatar);
    avatarHeader.innerHTML = '<img src="' + avatarSrc + '" alt="Photo de profil">';
    avatarProfil.innerHTML = '<img src="' + avatarSrc + '" alt="Photo de profil">';
  } else {
    avatarHeader.innerText = initiales;
    avatarProfil.innerText = initiales;
  }

  document.getElementById('header-user-name').innerText = monProfil.name;
  document.getElementById('profile-card-name').innerText = monProfil.name;

  let nomsAffiches = document.querySelectorAll('.user-display-name');
  for (let i = 0; i < nomsAffiches.length; i++) {
    nomsAffiches[i].innerText = monProfil.name;
  }

  document.getElementById('dash-address-display').innerText = monProfil.address;
  document.getElementById('checkout-address-input').value = monProfil.address;

  document.getElementById('profile-name').value = monProfil.name;
  document.getElementById('profile-phone').value = monProfil.phone;
  document.getElementById('profile-email').value = monProfil.email;
  document.getElementById('profile-address').value = monProfil.address;
}

// Extrait les deux premières lettres du nom (ou du prénom+nom)
// pour les afficher dans les avatars par défaut
function calculerInitiales(nomComplet) {
  let mots = String(nomComplet || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) {
    return 'CL';
  }
  if (mots.length === 1) {
    return mots[0].substring(0, 2).toUpperCase();
  }
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

// Lit le fichier image sélectionné et le convertit en base64
// pour l'afficher comme avatar de profil
function handleAvatarUpload(event) {
  let fichier = event.target.files[0];
  if (!fichier) return;

  let lecteur = new FileReader();
  lecteur.onload = function (e) {
    monProfil.avatar = e.target.result;
    ecrireStorage(CLE_PROFIL, monProfil);
    let utilisateurs = lireUtilisateurs();
    for (let i = 0; i < utilisateurs.length; i++) {
      if (utilisateurs[i].email === monProfil.email) {
        utilisateurs[i].avatar = monProfil.avatar;
        ecrireUtilisateurs(utilisateurs);
        break;
      }
    }
    renderProfil();
  };
  lecteur.readAsDataURL(fichier);
}

// Récupère les valeurs du formulaire profil, les sauvegarde
// dans le localStorage et rafraîchit l'affichage
function saveProfile(event) {
  event.preventDefault();

  let ancienEmail = monProfil.email;
  let ancienNom = monProfil.name;
  let nouveauNom = document.getElementById('profile-name').value.trim();
  let nouveauTelephone = document.getElementById('profile-phone').value.trim();
  let nouvelEmail = document.getElementById('profile-email').value.trim().toLowerCase();
  let nouvelleAdresse = document.getElementById('profile-address').value.trim();
  let utilisateurs = lireUtilisateurs();
  let utilisateurIndex = utilisateurs.findIndex(function (utilisateur) {
    return utilisateur.email === ancienEmail;
  });

  let emailDejaPris = utilisateurs.some(function (utilisateur, index) {
    return utilisateur.email === nouvelEmail && index !== utilisateurIndex;
  });

  if (!nouveauNom || !nouvelEmail) {
    alert('Le nom et l\'email sont obligatoires.');
    return;
  }

  if (emailDejaPris) {
    alert('Cette adresse email est déjà utilisée par un autre compte.');
    return;
  }

  monProfil.name = nouveauNom;
  monProfil.phone = nouveauTelephone;
  monProfil.email = nouvelEmail;
  monProfil.address = nouvelleAdresse;

  if (utilisateurIndex !== -1) {
    utilisateurs[utilisateurIndex].name = monProfil.name;
    utilisateurs[utilisateurIndex].phone = monProfil.phone;
    utilisateurs[utilisateurIndex].email = monProfil.email;
    utilisateurs[utilisateurIndex].address = monProfil.address;
    utilisateurs[utilisateurIndex].avatar = monProfil.avatar || '';
    ecrireUtilisateurs(utilisateurs);
  }

  let clients = lireClients();
  let ancienEmailNormalise = String(ancienEmail || '').toLowerCase();
  let clientIndex = clients.findIndex(function (client) {
    return (client.email || '').toLowerCase() === ancienEmailNormalise || client.name === ancienNom;
  });

  if (clientIndex !== -1) {
    clients[clientIndex].name = monProfil.name;
    clients[clientIndex].phone = monProfil.phone;
    clients[clientIndex].email = monProfil.email;
  } else {
    clients.push({
      id: 'CLI-' + Date.now(),
      name: monProfil.name,
      phone: monProfil.phone,
      email: monProfil.email,
      totalSpent: 0,
      ordersCount: 0
    });
  }
  ecrireClients(clients);

  let toutesLesCommandes = lireStorage(CLE_COMMANDES, []);
  let commandesModifiees = false;
  for (let i = 0; i < toutesLesCommandes.length; i++) {
    if (toutesLesCommandes[i].email === ancienEmail || toutesLesCommandes[i].clientName === ancienNom) {
      toutesLesCommandes[i].clientName = monProfil.name;
      toutesLesCommandes[i].phone = monProfil.phone;
      toutesLesCommandes[i].email = monProfil.email;
      commandesModifiees = true;
    }
  }
  if (commandesModifiees) {
    ecrireStorage(CLE_COMMANDES, toutesLesCommandes);
    canalBide.postMessage({ type: 'commandes_updated' });
  }

  let utilisateurConnecte = lireStorage('utilisateurConnecte', null);
  if (utilisateurConnecte && utilisateurConnecte.role === 'client') {
    utilisateurConnecte.email = monProfil.email;
    ecrireStorage('utilisateurConnecte', utilisateurConnecte);
  }

  ecrireStorage(CLE_PROFIL, monProfil);
  chargerDonnees(); // on recharge pour que "mesCommandes" reste bien filtré sur le nouveau nom
  renderProfil();

  alert('Informations personnelles sauvegardées !');
}

// Vérifie que le nouveau mot de passe correspond à la confirmation
// et le sauvegarde dans le localStorage (prototypage, pas sécurisé)
function changePassword(event) {
  event.preventDefault();
  let motDePasseActuel = document.getElementById('current-pass').value;
  let nouveauMdp = document.getElementById('new-pass').value;
  let confirmationMdp = document.getElementById('confirm-pass').value;
  let utilisateurs = lireUtilisateurs();
  let utilisateur = utilisateurs.find(function (item) {
    return item.email === monProfil.email;
  });

  if (!utilisateur) {
    alert('Compte introuvable. Veuillez vous reconnecter.');
    return;
  }

  if (utilisateur.password !== motDePasseActuel) {
    alert('Le mot de passe actuel est incorrect.');
    return;
  }

  if (nouveauMdp !== confirmationMdp) {
    alert('Le nouveau mot de passe et la confirmation ne correspondent pas.');
    return;
  }

  if (nouveauMdp === motDePasseActuel) {
    alert('Le nouveau mot de passe doit être différent de l\'actuel.');
    return;
  }

  if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(nouveauMdp)) {
    alert('Le mot de passe doit contenir 8 caractères minimum, avec au moins 1 majuscule et 1 chiffre.');
    return;
  }

  utilisateur.password = nouveauMdp;
  ecrireUtilisateurs(utilisateurs);

  alert('Mot de passe mis à jour avec succès !');
  document.getElementById('password-form').reset();
};
