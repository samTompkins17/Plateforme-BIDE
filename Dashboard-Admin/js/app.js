/*  BIDE PRESSING - ADMINISTRATION */

document.addEventListener('DOMContentLoaded', function () {

  //  CLES DU LOCALSTORAGE (identiques dans client.js) --------
  let CLE_COMMANDES = 'bide_orders';
  let CLE_CLIENTS = 'bide_clients';
  let CLE_LIVREURS = 'bide_drivers';
  let CLE_TARIFS = 'bide_rates';
  let CLE_UTILISATEURS = 'bide_users';

  let donneesSession = localStorage.getItem('utilisateurConnecte');
  let utilisateurSession = null;
  try {
    utilisateurSession = donneesSession ? JSON.parse(donneesSession) : null;
  } catch (error) {
    utilisateurSession = null;
  }

  if (!utilisateurSession || utilisateurSession.role !== 'admin') {
    alert("Accès refusé. Vous n'avez pas les autorisations nécessaires.");
    window.location.href = "../pages/index.html";
    return;
  }

  // -------- LISTE DES CATEGORIES (identique dans client.js) --------
  let CATEGORIES = [
    { id: 'quotidien', label: 'Vêtements Quotidiens' },
    { id: 'maison', label: 'Linge de Maison' },
    { id: 'delicat', label: 'Pièces Délicates' }
  ];

  let STATUT_COMMANDE_VALIDEE = 'Commande Enregistrée';

  // ID de l'article en cours d'édition (null si on crée un nouveau)
  let tarifEnEdition = null;

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
  function normaliserStatut(statut) {
    if (!statut) return 'En attente';
    if (statut === 'Commande Enrégstré' || statut === 'Commande Enregistré') {
      return STATUT_COMMANDE_VALIDEE;
    }
    return statut;
  }

  // -------- DONNEES PAR DEFAUT (si le localStorage est vide) --------
  let LIVREURS_PAR_DEFAUT = [
    { id: 'DRV-1', name: 'Koffi Mensah', phone: '90 12 34 56', status: 'Disponible', activeDeliveries: 1 },
    { id: 'DRV-2', name: 'Abla Mawulolo', phone: '91 23 45 67', status: 'En livraison', activeDeliveries: 3 },
    { id: 'DRV-3', name: 'Yao Denis', phone: '92 34 56 78', status: 'Hors service', activeDeliveries: 0 }
  ];

  let TARIFS_PAR_DEFAUT = [
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

  // -------- NOTIFICATIONS --------
  let CLE_NOTIFS = 'bide_notifications';
  let CLE_NOTIFS_CLIENT = 'bide_client_notifications';
  let notifications = lireStorage(CLE_NOTIFS, []);
  let nombreNotifsNonLues = notifications.filter(function (n) { return !n.lue; }).length;

  // Ajoute une notification et met à jour l'interface
  // Ajoute une notification admin (commande, alerte, etc.)
  // Si commandeId est fourni, on l'ajoute à l'objet pour le bouton "Voir"
  function ajouterNotification(titre, texte, type, commandeId) {
    let notif = {
      id: Date.now(),
      titre: titre,
      texte: texte,
      type: type || 'info',
      commandeId: commandeId || null,
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      lue: false
    };
    notifications.unshift(notif);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    ecrireStorage(CLE_NOTIFS, notifications);
    mettreAJourBadgeNotifications();
    afficherToast(titre + ' — ' + texte);
  }

  // Met à jour le compteur et le contenu du dropdown notifications
  function mettreAJourBadgeNotifications() {
    nombreNotifsNonLues = notifications.filter(function (n) { return !n.lue; }).length;

    // Badge rouge sur la cloche
    let dot = document.querySelector('.notification-dot');
    if (dot) {
      dot.style.display = nombreNotifsNonLues > 0 ? 'block' : 'none';
    }

    // Remplir le menu dropdown
    let menu = document.getElementById('notificationMenu');
    let listeVide = document.getElementById('emptyNotifications');
    if (!menu) return;

    // Supprimer les anciennes notifications du DOM (sauf le header et le divider)
    let itemsExistants = menu.querySelectorAll('.notif-item');
    for (let n = 0; n < itemsExistants.length; n++) {
      itemsExistants[n].remove();
    }

    if (notifications.length === 0) {
      if (listeVide) listeVide.style.display = 'block';
      return;
    }

    if (listeVide) listeVide.style.display = 'none';

    let maxAfficher = Math.min(notifications.length, 10);
    for (let i = 0; i < maxAfficher; i++) {
      let notif = notifications[i];
      let icone = 'bi-info-circle text-primary';
      if (notif.type === 'commande') icone = 'bi-bag-check text-success';
      if (notif.type === 'alerte') icone = 'bi-exclamation-triangle text-warning';

      let li = document.createElement('li');
      li.className = 'notif-item px-2 py-2' + (notif.lue ? '' : ' bg-light');
      let idCommandeNotif = echapperHTML(notif.commandeId || '');

      // Construire le contenu de la notification
      let htmlNotif =
        '<div class="d-flex align-items-start gap-2">' +
          '<i class="bi ' + icone + ' mt-1"></i>' +
          '<div class="small flex-grow-1">' +
            '<strong class="d-block">' + echapperHTML(notif.titre) + '</strong>' +
            '<span class="text-muted">' + echapperHTML(notif.texte) + '</span>' +
            '<small class="text-muted d-block">' + echapperHTML(notif.date) + '</small>' +
          '</div>' +
        '</div>';

      // Si c'est une notification de commande, ajouter le bouton "Voir"
      if (notif.type === 'commande' && notif.commandeId) {
        htmlNotif +=
          '<div class="mt-2 ms-4">' +
            '<button class="btn btn-sm btn-outline-primary btn-view-order" data-id="' + idCommandeNotif + '" style="font-size:0.7rem; padding:2px 10px;">' +
              '<i class="bi bi-eye me-1"></i>Voir la commande' +
            '</button>' +
          '</div>';
      }

      li.innerHTML = htmlNotif;
      menu.appendChild(li);
    }

    // Bouton "Tout marquer comme lu" en bas du menu
    let liMarquer = document.createElement('li');
    liMarquer.className = 'notif-item text-center px-2 py-2';
    liMarquer.innerHTML = '<button class="btn btn-sm btn-link text-decoration-none" id="markAllRead">Tout marquer comme lu</button>';
    menu.appendChild(liMarquer);

    document.getElementById('markAllRead').addEventListener('click', function () {
      for (let m = 0; m < notifications.length; m++) {
        notifications[m].lue = true;
      }
      ecrireStorage(CLE_NOTIFS, notifications);
      mettreAJourBadgeNotifications();
    });

    // Attacher les écouteurs sur les boutons "Voir la commande"
    let boutonsVoir = menu.querySelectorAll('.btn-view-order');
    for (let v = 0; v < boutonsVoir.length; v++) {
      boutonsVoir[v].addEventListener('click', function (e) {
        e.stopPropagation();
        let idCommande = this.getAttribute('data-id');
        // Marquer la notification comme lue
        for (let m = 0; m < notifications.length; m++) {
          if (notifications[m].commandeId === idCommande) {
            notifications[m].lue = true;
          }
        }
        ecrireStorage(CLE_NOTIFS, notifications);
        mettreAJourBadgeNotifications();
        // Naviguer vers la page commandes
        changerDePage('commandes');
      });
    }
  }

  // =========================================================
  // NOTIFICATIONS CÔTÉ CLIENT (synchronisation)
  // =========================================================
  // Écrit une notification dans la clé localStorage du client
  // pour que le client voie les changements en temps réel
  let notificationsClient = lireStorage(CLE_NOTIFS_CLIENT, []);

  // Écrit une notification dans la clé localStorage du client
  // pour que le client voie les changements en temps réel
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

    // Notifier l'onglet client via BroadcastChannel
    canalBide.postMessage({ type: 'notifications_client_updated' });
  }

  // -------- BROADCASTCHANNEL POUR SYNCHRONISATION MÊME ONGLET --------
  let canalBide = window.BroadcastChannel
    ? new BroadcastChannel('bide_sync')
    : { postMessage: function () {} };

  if (window.BroadcastChannel) {
  canalBide.onmessage = function (evenement) {
    let donnees = evenement.data;
    if (donnees.type === 'commandes_updated') {
      let ancienNombre = commandes.length;
      commandes = normaliserCommandesDepuisStorage();
      // Détecter les nouvelles commandes reçues via BroadcastChannel (même onglet)
      if (commandes.length > ancienNombre) {
        for (let n = 0; n < commandes.length - ancienNombre; n++) {
          let cmd = commandes[n];
          ajouterNotification(
            'Nouvelle commande #' + cmd.id,
            (cmd.clientName || 'Client') + ' — ' + Number(cmd.total || 0).toLocaleString('fr-FR') + ' FCFA',
            'commande',
            cmd.id
          );
        }
      }
      toutRedessiner();
    }
    if (donnees.type === 'tarifs_updated') {
      tarifs = lireStorage(CLE_TARIFS, TARIFS_PAR_DEFAUT);
      toutRedessiner();
    }
  };
  }

  // -------- PETITS OUTILS POUR LIRE / ECRIRE DANS LE LOCALSTORAGE --------
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

  // Lit toutes les commandes depuis le localStorage et normalise les statuts
  // pour corriger les anciennes variantes ("Enrégstré" → "Enregistrée")
  function normaliserCommandesDepuisStorage() {
    let liste = lireStorage(CLE_COMMANDES, []);
    let aChange = false;

    if (!Array.isArray(liste)) {
      return [];
    }

    for (let i = 0; i < liste.length; i++) {
      if (!liste[i]) continue;
      let statutNormalise = normaliserStatut(liste[i].status);
      if (liste[i].status !== statutNormalise) {
        liste[i].status = statutNormalise;
        aChange = true;
      }
    }

    if (aChange) {
      ecrireStorage(CLE_COMMANDES, liste);
    }

    return liste;
  }

  // Protège contre les failles XSS en échappant les caractères spéciaux HTML
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

  // Échappe les caractères spéciaux pour les insérer dans une chaîne JS
  function echapperJSChaine(valeur) {
    return String(valeur ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
  }

  // -------- CHARGEMENT INITIAL DES DONNEES --------
  let commandes = normaliserCommandesDepuisStorage();
  let clients = lireStorage(CLE_CLIENTS, []);
  let livreurs = lireStorage(CLE_LIVREURS, LIVREURS_PAR_DEFAUT);
  let tarifs = lireStorage(CLE_TARIFS, TARIFS_PAR_DEFAUT);

  // Si rien n'existe encore, on enregistre les valeurs par défaut
  if (!localStorage.getItem(CLE_LIVREURS)) ecrireStorage(CLE_LIVREURS, livreurs);
  if (!localStorage.getItem(CLE_TARIFS)) ecrireStorage(CLE_TARIFS, tarifs);

  // -------- REFERENCES DOM --------
  let sidebar = document.getElementById('sidebar');
  let sidebarOverlay = document.getElementById('sidebarOverlay');
  let boutonMenuMobile = document.getElementById('mobileMenuBtn');
  let liensNavigation = document.querySelectorAll('.sidebar-menu .nav-link, [data-page-target]');
  let pages = document.querySelectorAll('.page');

  // Modales Bootstrap
  let modaleFormulaire = new bootstrap.Modal(document.getElementById('appModal'));
  let modaleConfirmation = new bootstrap.Modal(document.getElementById('confirmModal'));
  let toastInfo = new bootstrap.Toast(document.getElementById('appToast'));

  // Graphiques Chart.js
  let graphiqueRevenus = null;
  let graphiqueStats = null;

  // =========================================================
  // NAVIGATION ENTRE LES PAGES
  // =========================================================
  // Affiche la section (page) demandée et met à jour
  // l'état actif dans la sidebar + déclenche le graphique si besoin
  function changerDePage(pageCible) {
    let idCible = pageCible.indexOf('page-') === 0 ? pageCible : 'page-' + pageCible;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].id === idCible) {
        pages[i].classList.add('active');
      } else {
        pages[i].classList.remove('active');
      }
    }

    for (let j = 0; j < liensNavigation.length; j++) {
      let cible = liensNavigation[j].getAttribute('data-page-target');
      if (cible === pageCible || 'page-' + cible === idCible) {
        liensNavigation[j].classList.add('active');
      } else {
        liensNavigation[j].classList.remove('active');
      }
    }

    if (sidebar.classList.contains('show')) {
      basculerMenuLateral();
    }

    if (idCible === 'page-dashboard') dessinerGraphiqueDashboard();
    if (idCible === 'page-statistiques') dessinerGraphiqueStats();
    if (idCible === 'page-profil') renderProfilAdmin();
  }

  for (let i = 0; i < liensNavigation.length; i++) {
    liensNavigation[i].addEventListener('click', function (e) {
      e.preventDefault();
      let cible = this.getAttribute('data-page-target');
      if (cible) changerDePage(cible);
    });
  }

  // Ouvre ou ferme la sidebar sur mobile en basculant la classe 'show'
  function basculerMenuLateral() {
    sidebar.classList.toggle('show');
    sidebarOverlay.classList.toggle('show');
  }

  if (boutonMenuMobile) boutonMenuMobile.addEventListener('click', basculerMenuLateral);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', basculerMenuLateral);

  // =========================================================
  // BADGES DE STATUT
  // =========================================================
  // Génère le HTML d'un badge coloré selon le statut de la commande
  function badgeStatut(statut) {
    let couleurs = {
      'En attente': 'bg-warning text-dark',
      [STATUT_COMMANDE_VALIDEE]: 'bg-info text-dark',
      'Lavage en cours': 'bg-info text-white',
      'Prêt & Emballé': 'bg-primary text-white',
      'En livraison': 'bg-violet text-white',
      'Livrée': 'bg-success text-white',
      'Annulée': 'bg-danger text-white'
    };
    let classe = couleurs[statut] || 'bg-secondary';
    return '<span class="badge ' + classe + '">' + echapperHTML(statut) + '</span>';
  }

  // =========================================================
  // TABLEAU DE BORD (VUE D'ENSEMBLE)
  // =========================================================
  // Calcule le chiffre d'affaires total (hors annulées), le nombre de livreurs
  // actifs, et affiche les 5 commandes les plus récentes dans le dashboard
  function renderDashboard() {
    let chiffreAffaires = 0;
    for (let i = 0; i < commandes.length; i++) {
      if (commandes[i].status !== 'Annulée') {
        chiffreAffaires += Number(commandes[i].total || 0);
      }
    }

    let livreursActifs = 0;
    for (let j = 0; j < livreurs.length; j++) {
      if (livreurs[j].status === 'En livraison' || livreurs[j].status === 'Disponible') {
        livreursActifs++;
      }
    }

    document.getElementById('kpiOrders').textContent = commandes.length;
    document.getElementById('kpiRevenue').textContent = chiffreAffaires.toLocaleString('fr-FR');
    document.getElementById('kpiDrivers').textContent = livreursActifs;

    let corpsTableau = document.getElementById('recentOrdersBody');
    corpsTableau.innerHTML = '';

    let commandesRecentes = commandes.slice(0, 5);

    if (commandesRecentes.length === 0) {
      corpsTableau.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Aucune commande enregistrée.</td></tr>';
      return;
    }

    for (let k = 0; k < commandesRecentes.length; k++) {
      let c = commandesRecentes[k];
      let ligne = document.createElement('tr');
      ligne.innerHTML =
        '<td><strong>#' + echapperHTML(c.id) + '</strong></td>' +
        '<td>' + echapperHTML(c.clientName || 'Client inconnu') + '</td>' +
        '<td><i class="bi bi-person me-1"></i>' + echapperHTML(c.driver || 'Non assigné') + '</td>' +
        '<td><strong>' + Number(c.total || 0).toLocaleString('fr-FR') + ' FCFA</strong></td>' +
        '<td>' + badgeStatut(c.status) + '</td>';
      corpsTableau.appendChild(ligne);
    }
  }

  // =========================================================
  // GESTION DES COMMANDES
  // =========================================================
  // Remplit le tableau des commandes en appliquant la recherche texte
  // et le filtre par statut, puis attache les écouteurs sur les selects
  function renderOrdersTable() {
    let corpsTableau = document.getElementById('ordersBody');
    let recherche = (document.getElementById('ordersSearch') && document.getElementById('ordersSearch').value || '').toLowerCase();
    let statutChoisi = (document.getElementById('orderStatusFilter') && document.getElementById('orderStatusFilter').value) || 'all';

    corpsTableau.innerHTML = '';

    let commandesFiltrees = [];
    for (let i = 0; i < commandes.length; i++) {
      let o = commandes[i];
      let correspondRecherche =
        o.id.toString().toLowerCase().indexOf(recherche) !== -1 ||
        (o.clientName || '').toLowerCase().indexOf(recherche) !== -1 ||
        (o.address || '').toLowerCase().indexOf(recherche) !== -1;
      let correspondStatut = statutChoisi === 'all' || o.status === statutChoisi;

      if (correspondRecherche && correspondStatut) {
        commandesFiltrees.push(o);
      }
    }

    if (commandesFiltrees.length === 0) {
      corpsTableau.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Aucune commande trouvée.</td></tr>';
      return;
    }

    let optionsLivreurs = '';
    for (let d = 0; d < livreurs.length; d++) {
      optionsLivreurs += '<option value="' + livreurs[d].name + '">' + livreurs[d].name + '</option>';
    }

    for (let j = 0; j < commandesFiltrees.length; j++) {
      let o2 = commandesFiltrees[j];
      let ligne = document.createElement('tr');
      let idCommande = echapperHTML(o2.id);
      ligne.innerHTML =
        '<td><strong>#' + idCommande + '</strong></td>' +
        '<td><div class="fw-bold">' + echapperHTML(o2.clientName || 'Inconnu') + '</div><small class="text-muted">' + echapperHTML(o2.phone || '') + '</small></td>' +
        '<td><small class="text-muted">' + echapperHTML(o2.address || 'Au comptoir') + '</small></td>' +
        '<td>' +
          '<select class="form-select form-select-sm driver-select" data-id="' + idCommande + '">' +
            '<option value="">-- Assigner --</option>' +
            genererOptionsLivreurs(o2.driver) +
          '</select>' +
        '</td>' +
        '<td><strong>' + Number(o2.total || 0).toLocaleString('fr-FR') + ' FCFA</strong></td>' +
        '<td><small>' + (o2.date || new Date().toLocaleDateString('fr-FR')) + '</small></td>' +
        '<td>' +
          '<select class="form-select form-select-sm status-select fw-semibold" data-id="' + idCommande + '">' +
            genererOptionsStatut(o2.status) +
          '</select>' +
        '</td>' +
        '<td><button class="btn btn-sm btn-outline-danger btn-delete-order" data-id="' + idCommande + '" title="Supprimer"><i class="bi bi-trash"></i></button></td>';
      corpsTableau.appendChild(ligne);
    }

    let selectsStatut = corpsTableau.querySelectorAll('.status-select');
    for (let s = 0; s < selectsStatut.length; s++) {
      selectsStatut[s].addEventListener('change', function (e) {
        mettreAJourStatutCommande(e.target.dataset.id, e.target.value);
      });
    }

    let selectsLivreur = corpsTableau.querySelectorAll('.driver-select');
    for (let l = 0; l < selectsLivreur.length; l++) {
      selectsLivreur[l].addEventListener('change', function (e) {
        mettreAJourLivreurCommande(e.target.dataset.id, e.target.value);
      });
    }

    let boutonsSupprimer = corpsTableau.querySelectorAll('.btn-delete-order');
    for (let b = 0; b < boutonsSupprimer.length; b++) {
      boutonsSupprimer[b].addEventListener('click', function (e) {
        demanderSuppressionCommande(e.currentTarget.dataset.id);
      });
    }
  }

  // Génère les <option> HTML pour la liste déroulante des livreurs
  // en pré-sélectionnant le livreur actuellement assigné
  function genererOptionsLivreurs(livreurActuel) {
    let html = '';
    for (let i = 0; i < livreurs.length; i++) {
      let selectionne = livreurs[i].name === livreurActuel ? 'selected' : '';
      html += '<option value="' + echapperHTML(livreurs[i].name) + '" ' + selectionne + '>' + echapperHTML(livreurs[i].name) + '</option>';
    }
    return html;
  }

  // Génère les <option> HTML pour la liste déroulante des statuts
  // en pré-sélectionnant le statut actuel de la commande
  function genererOptionsStatut(statutActuel) {
    let statutsPossibles = ['En attente', STATUT_COMMANDE_VALIDEE, 'Lavage en cours', 'Prêt & Emballé', 'En livraison', 'Livrée', 'Annulée'];
    let html = '';
    for (let i = 0; i < statutsPossibles.length; i++) {
      let selectionne = statutsPossibles[i] === statutActuel ? 'selected' : '';
      html += '<option value="' + echapperHTML(statutsPossibles[i]) + '" ' + selectionne + '>' + echapperHTML(statutsPossibles[i]) + '</option>';
    }
    return html;
  }

  // Met à jour le statut d'une commande dans le tableau en mémoire,
  // sauvegarde dans le localStorage et rafraîchit tous les affichages
  // Écrit aussi une notification côté client pour le suivi en temps réel
  function mettreAJourStatutCommande(idCommande, nouveauStatut) {
    for (let i = 0; i < commandes.length; i++) {
      if (commandes[i].id == idCommande) {
        commandes[i].status = nouveauStatut;
        ecrireStorage(CLE_COMMANDES, commandes);

        // Notifier le client du changement de statut
        if (nouveauStatut === STATUT_COMMANDE_VALIDEE) {
          ajouterNotificationClient(
            'Commande #' + idCommande + ' confirmée',
            'Votre commande a été acceptée par l\'agence !',
            'confirmation'
          );
        } else {
          ajouterNotificationClient(
            'Commande #' + idCommande,
            'Statut mis à jour : ' + nouveauStatut,
            nouveauStatut === 'Annulée' ? 'annulation' : 'statut'
          );
        }

        // Notifier les autres onglets/mêmes onglets via BroadcastChannel
        canalBide.postMessage({ type: 'commandes_updated' });

        afficherToast('Statut de la commande #' + idCommande + ' mis à jour : ' + nouveauStatut);
        toutRedessiner();
        return;
      }
    }
  }

  // Assigne un livreur à une commande dans le tableau en mémoire,
  // sauvegarde dans le localStorage et rafraîchit tous les affichages
  // Écrit aussi une notification côté client pour le suivi en temps réel
  function mettreAJourLivreurCommande(idCommande, nomLivreur) {
    for (let i = 0; i < commandes.length; i++) {
      if (commandes[i].id == idCommande) {
        commandes[i].driver = nomLivreur;
        ecrireStorage(CLE_COMMANDES, commandes);

        // Notifier le client de l'assignation du livreur
        ajouterNotificationClient(
          'Commande #' + idCommande,
          'Livreur assigné : ' + nomLivreur,
          'livreur'
        );

        // Notifier les autres onglets/mêmes onglets via BroadcastChannel
        canalBide.postMessage({ type: 'commandes_updated' });

        afficherToast('Livreur ' + nomLivreur + ' assigné à la commande #' + idCommande);
        toutRedessiner();
        return;
      }
    }
  }

  // Affiche une modale de confirmation puis supprime la commande
  // du tableau en mémoire et du localStorage si l'admin confirme
  function demanderSuppressionCommande(idCommande) {
    afficherConfirmation('Supprimer la commande', 'Êtes-vous sûr de vouloir supprimer la commande #' + idCommande + ' ?', function () {
      let nouvelleListe = [];
      for (let i = 0; i < commandes.length; i++) {
        if (commandes[i].id != idCommande) {
          nouvelleListe.push(commandes[i]);
        }
      }
      commandes = nouvelleListe;
      ecrireStorage(CLE_COMMANDES, commandes);
      canalBide.postMessage({ type: 'commandes_updated' });
      afficherToast('Commande #' + idCommande + ' supprimée.');
      toutRedessiner();
    });
  }

  // =========================================================
  // GESTION DES CLIENTS
  // =========================================================
  // Remplit le tableau des clients en fusionnant les clients enregistrés
  // manuellement et ceux extraits automatiquement des commandes
  function renderClientsTable() {
    let corpsTableau = document.getElementById('clientsBody');
    let recherche = (document.getElementById('clientsSearch') && document.getElementById('clientsSearch').value || '').toLowerCase();

    corpsTableau.innerHTML = '';

    // On part des clients enregistrés manuellement, puis on ajoute
    // automatiquement les clients trouvés dans les commandes
    let listeClients = clients.slice();
    let utilisateursInscrits = lireStorage(CLE_UTILISATEURS, []);

    for (let u = 0; u < utilisateursInscrits.length; u++) {
      let utilisateur = utilisateursInscrits[u];
      let emailUtilisateur = (utilisateur.email || '').toLowerCase();
      let dejaPresentUtilisateur = false;

      for (let c = 0; c < listeClients.length; c++) {
        if ((listeClients[c].email || '').toLowerCase() === emailUtilisateur) {
          dejaPresentUtilisateur = true;
          break;
        }
      }

      if (emailUtilisateur && !dejaPresentUtilisateur) {
        listeClients.push({
          id: 'CLI-USER-' + emailUtilisateur,
          name: utilisateur.name || utilisateur.nom || 'Client',
          phone: utilisateur.phone || utilisateur.telephone || 'N/A',
          email: utilisateur.email,
          totalSpent: 0,
          ordersCount: 0
        });
      }
    }

    for (let i = 0; i < commandes.length; i++) {
      let o = commandes[i];
      let dejaPresent = false;
      for (let j = 0; j < listeClients.length; j++) {
        if (o.clientName && listeClients[j].name.toLowerCase() === o.clientName.toLowerCase()) {
          dejaPresent = true;
          break;
        }
      }
      if (o.clientName && !dejaPresent) {
        listeClients.push({
          id: 'CLI-' + Math.floor(Math.random() * 100000),
          name: o.clientName,
          phone: o.phone || 'N/A',
          email: o.email || 'non-renseigné@mail.com',
          totalSpent: 0,
          ordersCount: 0
        });
      }
    }

    let listeFiltree = [];
    for (let k = 0; k < listeClients.length; k++) {
      let c = listeClients[k];
      if (c.name.toLowerCase().indexOf(recherche) !== -1 || (c.phone && c.phone.indexOf(recherche) !== -1)) {
        listeFiltree.push(c);
      }
    }

    if (listeFiltree.length === 0) {
      corpsTableau.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Aucun client trouvé.</td></tr>';
      return;
    }

    for (let m = 0; m < listeFiltree.length; m++) {
      let client = listeFiltree[m];

      let depense = client.totalSpent || 0;
      let nombreCommandes = 0;
      for (let n = 0; n < commandes.length; n++) {
        if (commandes[n].clientName && commandes[n].clientName.toLowerCase() === client.name.toLowerCase()) {
          depense += Number(commandes[n].total || 0);
          nombreCommandes++;
        }
      }
      if (nombreCommandes === 0) nombreCommandes = client.ordersCount || 0;

      let ligne = document.createElement('tr');
      ligne.innerHTML =
        '<td><div class="d-flex align-items-center gap-2"><div class="header-avatar">' + echapperHTML(client.name.substring(0, 2).toUpperCase()) + '</div><strong class="text-dark">' + echapperHTML(client.name) + '</strong></div></td>' +
        '<td>' + echapperHTML(client.phone || 'N/A') + '</td>' +
        '<td><small class="text-muted">' + echapperHTML(client.email || 'N/A') + '</small></td>' +
        '<td><span class="badge bg-light text-dark border">' + nombreCommandes + ' commande(s)</span></td>' +
        '<td><strong>' + depense.toLocaleString('fr-FR') + ' FCFA</strong></td>' +
        '<td><button class="btn btn-sm btn-outline-danger btn-delete-client" data-id="' + echapperHTML(client.id) + '"><i class="bi bi-trash"></i></button></td>';
      corpsTableau.appendChild(ligne);
    }

    let boutonsSupprimer = corpsTableau.querySelectorAll('.btn-delete-client');
    for (let p = 0; p < boutonsSupprimer.length; p++) {
      boutonsSupprimer[p].addEventListener('click', function (e) {
        let id = e.currentTarget.dataset.id;
        afficherConfirmation('Supprimer le client', 'Souhaitez-vous supprimer cette fiche client ?', function () {
          let nouvelleListe = [];
          for (let q = 0; q < clients.length; q++) {
            if (clients[q].id !== id) nouvelleListe.push(clients[q]);
          }
          clients = nouvelleListe;
          ecrireStorage(CLE_CLIENTS, clients);
          afficherToast('Client supprimé avec succès.');
          toutRedessiner();
        });
      });
    }
  }

  // =========================================================
  // GESTION DES LIVREURS
  // =========================================================
  // Affiche les cartes de chaque livreur avec son statut,
  // le nombre de courses actives et le bouton de suppression
  function renderDriversGrid() {
    let grille = document.getElementById('driversGrid');
    grille.innerHTML = '';

    for (let i = 0; i < livreurs.length; i++) {
      let d = livreurs[i];

      let coursesActives = 0;
      for (let j = 0; j < commandes.length; j++) {
        if (commandes[j].driver === d.name && commandes[j].status === 'En livraison') {
          coursesActives++;
        }
      }

      let couleurBadge = 'bg-secondary';
      if (d.status === 'Disponible') couleurBadge = 'bg-success';
      if (d.status === 'En livraison') couleurBadge = 'bg-primary';

      let carte = document.createElement('div');
      carte.className = 'col-12 col-md-6 col-xl-4';
      carte.innerHTML =
        '<div class="service-card h-100 d-flex flex-column justify-content-between">' +
          '<div class="d-flex justify-content-between align-items-start mb-3">' +
            '<div class="d-flex align-items-center gap-3">' +
              '<div class="p-3 bg-light rounded-circle text-primary fs-4"><i class="bi bi-bicycle"></i></div>' +
              '<div><h3 class="h6 fw-bold mb-1">' + echapperHTML(d.name) + '</h3><small class="text-muted"><i class="bi bi-telephone me-1"></i>' + echapperHTML(d.phone) + '</small></div>' +
            '</div>' +
            '<span class="badge ' + couleurBadge + '">' + echapperHTML(d.status) + '</span>' +
          '</div>' +
          '<div class="border-top pt-3 mt-2 d-flex justify-content-between align-items-center">' +
            '<small class="text-muted">Courses actives: <strong>' + coursesActives + '</strong></small>' +
            '<button class="btn btn-sm btn-outline-danger btn-delete-driver" data-id="' + echapperHTML(d.id) + '"><i class="bi bi-trash"></i></button>' +
          '</div>' +
        '</div>';
      grille.appendChild(carte);
    }

    let boutonsSupprimer = grille.querySelectorAll('.btn-delete-driver');
    for (let k = 0; k < boutonsSupprimer.length; k++) {
      boutonsSupprimer[k].addEventListener('click', function (e) {
        let id = e.currentTarget.dataset.id;
        afficherConfirmation('Supprimer le livreur', 'Confirmez-vous le retrait de ce livreur ?', function () {
          let nouvelleListe = [];
          for (let m = 0; m < livreurs.length; m++) {
            if (livreurs[m].id !== id) nouvelleListe.push(livreurs[m]);
          }
          livreurs = nouvelleListe;
          ecrireStorage(CLE_LIVREURS, livreurs);
          afficherToast('Livreur retiré.');
          toutRedessiner();
        });
      });
    }
  }

  // =========================================================
  // GESTION DU CATALOGUE / TARIFS
  // =========================================================
  // Affiche les cartes du catalogue/tarifs avec prix et bouton supprimer
  // Affiche les cartes du catalogue/tarifs avec prix, modification inline et suppression
  function renderRatesGrid() {
    let grille = document.getElementById('ratesGrid');
    grille.innerHTML = '';

    for (let i = 0; i < tarifs.length; i++) {
      let r = tarifs[i];

      let carte = document.createElement('div');
      carte.className = 'col-12 col-sm-6 col-md-4 col-xl-3';
      carte.innerHTML =
        '<div class="service-card h-100 d-flex flex-column justify-content-between">' +
          '<div>' +
            '<span class="badge bg-light text-dark border mb-2">' + echapperHTML(labelCategorie(r.category)) + '</span>' +
            '<h3 class="h6 fw-bold text-dark">' + echapperHTML(r.name) + '</h3>' +
            '<div class="d-flex align-items-center gap-2 my-2">' +
              '<input type="number" class="form-control form-control-sm d-inline-block price-input" ' +
                'data-id="' + echapperHTML(r.id) + '" value="' + echapperHTML(r.price) + '" ' +
                'style="width: 120px; font-weight: bold; font-size: 1.1rem; color: var(--bleu-pressing);">' +
              '<small class="text-muted">FCFA / ' + echapperHTML(r.unit || 'pièce') + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="border-top pt-2 mt-3 d-flex justify-content-end gap-2">' +
            '<button class="btn btn-sm btn-primary btn-save-rate" data-id="' + echapperHTML(r.id) + '"><i class="bi bi-check-lg"></i> Enregistrer</button>' +
            '<button class="btn btn-sm btn-outline-danger btn-delete-rate" data-id="' + echapperHTML(r.id) + '"><i class="bi bi-trash"></i></button>' +
          '</div>' +
        '</div>';
      grille.appendChild(carte);
    }

    // Écouteurs sur les boutons "Enregistrer" (modification prix)
    let boutonsEnregistrer = grille.querySelectorAll('.btn-save-rate');
    for (let s = 0; s < boutonsEnregistrer.length; s++) {
      boutonsEnregistrer[s].addEventListener('click', function (e) {
        let id = e.currentTarget.dataset.id;
        let champPrix = grille.querySelector('.price-input[data-id="' + id + '"]');
        let nouveauPrix = Number(champPrix.value);

        if (!nouveauPrix || nouveauPrix < 0) {
          afficherToast('Veuillez entrer un prix valide.');
          return;
        }

        for (let t = 0; t < tarifs.length; t++) {
          if (tarifs[t].id === id) {
            tarifs[t].price = nouveauPrix;
            break;
          }
        }
        ecrireStorage(CLE_TARIFS, tarifs);
        canalBide.postMessage({ type: 'tarifs_updated' });
        afficherToast('Prix mis à jour : ' + nouveauPrix.toLocaleString('fr-FR') + ' FCFA');
        toutRedessiner();
      });
    }

    // Écouteurs sur les boutons "Supprimer"
    let boutonsSupprimer = grille.querySelectorAll('.btn-delete-rate');
    for (let j = 0; j < boutonsSupprimer.length; j++) {
      boutonsSupprimer[j].addEventListener('click', function (e) {
        let id = e.currentTarget.dataset.id;
        afficherConfirmation("Supprimer l'article", 'Supprimer cet article de la grille tarifaire ?', function () {
          let nouvelleListe = [];
          for (let k = 0; k < tarifs.length; k++) {
            if (tarifs[k].id !== id) nouvelleListe.push(tarifs[k]);
          }
          tarifs = nouvelleListe;
          ecrireStorage(CLE_TARIFS, tarifs);
          canalBide.postMessage({ type: 'tarifs_updated' });
          afficherToast('Tarif supprimé.');
          toutRedessiner();
        });
      });
    }
  }

  // =========================================================
  // STATISTIQUES
  // =========================================================
  // Calcule et affiche les KPIs statistiques : CA total, nombre de commandes,
  // panier moyen et taux de livraison (hors annulées)
  function renderStats() {
    let commandesValides = [];
    for (let i = 0; i < commandes.length; i++) {
      if (commandes[i].status !== 'Annulée') commandesValides.push(commandes[i]);
    }

    let revenuTotal = 0;
    for (let j = 0; j < commandesValides.length; j++) {
      revenuTotal += Number(commandesValides[j].total || 0);
    }

    let panierMoyen = commandesValides.length > 0 ? Math.round(revenuTotal / commandesValides.length) : 0;

    let nombreLivrees = 0;
    for (let k = 0; k < commandes.length; k++) {
      if (commandes[k].status === 'Livrée') nombreLivrees++;
    }
    let tauxLivraison = commandes.length > 0 ? Math.round((nombreLivrees / commandes.length) * 100) : 0;

    document.getElementById('statRevenue').textContent = revenuTotal.toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('statOrders').textContent = commandes.length;
    document.getElementById('statAverage').textContent = panierMoyen.toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('statDeliveryRate').textContent = tauxLivraison + '%';
  }

  // =========================================================
  // GRAPHIQUES (CHART.JS)
  // =========================================================
  // Dessine le graphique en courbes des revenus hebdomadaires (Chart.js)
  // Détruit le précédent graphique s'il existe pour éviter les doublons
  // Calcule les revenus des 7 derniers jours à partir des commandes réelles
  // Les dates des commandes sont au format '23 août 2026' (FR)
  function calculerRevenusHebdo() {
    let jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    let revenus = [0, 0, 0, 0, 0, 0, 0];
    let maintenant = new Date();

    for (let i = 0; i < commandes.length; i++) {
      let cmd = commandes[i];
      if (cmd.status === 'Annulée') continue;

      // Parser la date FR '23 août 2026' en objet Date
      let dateCmd = parserDateFrancais(cmd.date);
      if (!dateCmd) continue;

      // Vérifier si la commande est dans les 7 derniers jours
      let diffJours = Math.floor((maintenant - dateCmd) / (1000 * 60 * 60 * 24));
      if (diffJours >= 0 && diffJours < 7) {
        revenus[dateCmd.getDay()] += Number(cmd.total || 0);
      }
    }

    // Remonter les 7 derniers jours dans l'ordre (il y a 6j, il y a 5j, ..., aujourd'hui)
    let labels = [];
    let data = [];
    for (let j = 6; j >= 0; j--) {
      let dateJ = new Date(maintenant);
      dateJ.setDate(dateJ.getDate() - j);
      labels.push(jours[dateJ.getDay()] + ' ' + dateJ.getDate());
      data.push(revenus[dateJ.getDay()]);
    }

    return { labels: labels, data: data };
  }

  // Parse une date FR '23 août 2026' en objet Date JavaScript
  function parserDateFrancais(chaineDate) {
    if (!chaineDate) return null;
    let moisFR = {
      'janv': 0, 'févr': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11
    };
    let parties = chaineDate.toLowerCase().replace(/é/g, 'e').replace(/û/g, 'u').split(/\s+/);
    if (parties.length < 3) return null;
    let jour = parseInt(parties[0], 10);
    let mois = moisFR[parties[1].substring(0, 4)];
    let annee = parseInt(parties[2], 10);
    if (isNaN(jour) || mois === undefined || isNaN(annee)) return null;
    return new Date(annee, mois, jour);
  }

  // Dessine le graphique en courbes des revenus hebdomadaires (Chart.js)
  // Utilise les données réelles des commandes
  function dessinerGraphiqueDashboard() {
    let contexte = document.getElementById('revenueChart') && document.getElementById('revenueChart').getContext('2d');
    if (!contexte) return;

    if (graphiqueRevenus) graphiqueRevenus.destroy();

    let donnees = calculerRevenusHebdo();

    graphiqueRevenus = new Chart(contexte, {
      type: 'line',
      data: {
        labels: donnees.labels,
        datasets: [{
          label: 'Revenus (FCFA)',
          data: donnees.data,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  // Dessine le graphique en barres des revenus mensuels (Chart.js)
  // Calcule les revenus par mois à partir des commandes réelles
  function dessinerGraphiqueStats() {
    let contexte = document.getElementById('statsChart') && document.getElementById('statsChart').getContext('2d');
    if (!contexte) return;

    if (graphiqueStats) graphiqueStats.destroy();

    // Regrouper les revenus par mois (0-11)
    let moisNoms = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    let revenusParMois = {};
    let maintenant = new Date();

    // Initialiser les 8 derniers mois
    for (let m = 7; m >= 0; m--) {
      let dateM = new Date(maintenant.getFullYear(), maintenant.getMonth() - m, 1);
      let cle = dateM.getFullYear() + '-' + dateM.getMonth();
      revenusParMois[cle] = { mois: dateM.getMonth(), annee: dateM.getFullYear(), total: 0 };
    }

    // Calculer les revenus réels par mois
    for (let i = 0; i < commandes.length; i++) {
      let cmd = commandes[i];
      if (cmd.status === 'Annulée') continue;

      let dateCmd = parserDateFrancais(cmd.date);
      if (!dateCmd) continue;

      let cle = dateCmd.getFullYear() + '-' + dateCmd.getMonth();
      if (revenusParMois[cle]) {
        revenusParMois[cle].total += Number(cmd.total || 0);
      }
    }

    // Construire les labels et data dans l'ordre chronologique
    let cles = Object.keys(revenusParMois).sort();
    let labels = [];
    let data = [];
    for (let k = 0; k < cles.length; k++) {
      let info = revenusParMois[cles[k]];
      labels.push(moisNoms[info.mois]);
      data.push(info.total);
    }

    graphiqueStats = new Chart(contexte, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: "Chiffre d'affaires mensuel",
          data: data,
          backgroundColor: '#0d6efd',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // =========================================================
  // RECHERCHE GLOBALE (BARRE DU HAUT)
  // =========================================================
  let champRecherche = document.getElementById('globalSearch');
  let zoneResultats = document.getElementById('searchResults');

  if (champRecherche && zoneResultats) {
    champRecherche.addEventListener('input', function (e) {
      let requete = e.target.value.toLowerCase().trim();
      if (!requete) {
        zoneResultats.classList.add('d-none');
        return;
      }

      let resultats = [];
      for (let i = 0; i < commandes.length; i++) {
        let o = commandes[i];
        if (o.id.toString().toLowerCase().indexOf(requete) !== -1 || (o.clientName || '').toLowerCase().indexOf(requete) !== -1) {
          resultats.push(o);
        }
      }

      zoneResultats.innerHTML = '';
      if (resultats.length === 0) {
        zoneResultats.innerHTML = '<div class="p-3 text-muted text-center small">Aucun résultat</div>';
      } else {
        for (let j = 0; j < resultats.length; j++) {
          let o2 = resultats[j];
          let lien = document.createElement('a');
          lien.className = 'dropdown-item p-2 border-bottom d-flex justify-content-between align-items-center';
          lien.href = '#';
          lien.innerHTML = '<div><strong>Commande #' + o2.id + '</strong> - ' + (o2.clientName || 'Inconnu') + '</div>' + badgeStatut(o2.status);
          lien.addEventListener('click', function (ev) {
            ev.preventDefault();
            changerDePage('commandes');
            zoneResultats.classList.add('d-none');
          });
          zoneResultats.appendChild(lien);
        }
      }
      zoneResultats.classList.remove('d-none');
    });

    document.addEventListener('click', function (e) {
      if (!champRecherche.contains(e.target) && !zoneResultats.contains(e.target)) {
        zoneResultats.classList.add('d-none');
      }
    });
  }

  // FILTRES DE RECHERCHE DES TABLEAUX
  let champRechercheCommandes = document.getElementById('ordersSearch');
  if (champRechercheCommandes) champRechercheCommandes.addEventListener('input', renderOrdersTable);

  let filtreStatut = document.getElementById('orderStatusFilter');
  if (filtreStatut) filtreStatut.addEventListener('change', renderOrdersTable);

  let champRechercheClients = document.getElementById('clientsSearch');
  if (champRechercheClients) champRechercheClients.addEventListener('input', renderClientsTable);

  // =========================================================
  // FORMULAIRES DANS LES MODALES (AJOUT)
  // =========================================================
  let titreModal = document.getElementById('modalTitle');
  let corpsModal = document.getElementById('modalBody');
  let formulaireModal = document.getElementById('appForm');

  let boutonsAction = document.querySelectorAll('[data-action]');
  for (let i = 0; i < boutonsAction.length; i++) {
    boutonsAction[i].addEventListener('click', function () {
      ouvrirModal(this.getAttribute('data-action'));
    });
  }

  // Ouvre la modale de formulaire avec le bon titre et les bons champs
  // selon l'action demandée (new-client, new-driver, new-rate)
  function ouvrirModal(action) {
    formulaireModal.dataset.action = action;

    if (action === 'new-client') {
      titreModal.textContent = 'Ajouter un nouveau client';
      corpsModal.innerHTML =
        '<div class="mb-3"><label class="form-label">Nom complet</label><input type="text" id="formClientName" class="form-control" required placeholder="Ex: Jean Dupont"></div>' +
        '<div class="mb-3"><label class="form-label">Téléphone</label><input type="tel" id="formClientPhone" class="form-control" required placeholder="Ex: 90 00 00 00"></div>' +
        '<div class="mb-3"><label class="form-label">Email</label><input type="email" id="formClientEmail" class="form-control" placeholder="Ex: jean@mail.com"></div>';

    } else if (action === 'new-driver') {
      titreModal.textContent = 'Ajouter un livreur';
      corpsModal.innerHTML =
        '<div class="mb-3"><label class="form-label">Nom du livreur</label><input type="text" id="formDriverName" class="form-control" required placeholder="Ex: Paul Lawson"></div>' +
        '<div class="mb-3"><label class="form-label">Téléphone</label><input type="tel" id="formDriverPhone" class="form-control" required placeholder="Ex: 92 00 00 00"></div>';

    } else if (action === 'new-rate') {
      titreModal.textContent = 'Ajouter un article au catalogue';

      let optionsCategories = '';
      for (let c = 0; c < CATEGORIES.length; c++) {
        optionsCategories += '<option value="' + CATEGORIES[c].id + '">' + CATEGORIES[c].label + '</option>';
      }

      corpsModal.innerHTML =
        '<div class="mb-3"><label class="form-label">Nom de la prestation</label><input type="text" id="formRateName" class="form-control" required placeholder="Ex: Veste en cuir"></div>' +
        '<div class="mb-3"><label class="form-label">Catégorie</label><select id="formRateCategory" class="form-select" required>' + optionsCategories + '</select></div>' +
        '<div class="mb-3"><label class="form-label">Prix (FCFA)</label><input type="number" id="formRatePrice" class="form-control" min="100" required placeholder="2500"></div>';
    }

    modaleFormulaire.show();
  }

  formulaireModal.addEventListener('submit', function (e) {
    e.preventDefault();
    let action = formulaireModal.dataset.action;

    if (action === 'new-client') {
      clients.push({
        id: 'CLI-' + Date.now(),
        name: document.getElementById('formClientName').value,
        phone: document.getElementById('formClientPhone').value,
        email: document.getElementById('formClientEmail').value,
        totalSpent: 0,
        ordersCount: 0
      });
      ecrireStorage(CLE_CLIENTS, clients);
      afficherToast('Nouveau client ajouté !');

    } else if (action === 'new-driver') {
      livreurs.push({
        id: 'DRV-' + Date.now(),
        name: document.getElementById('formDriverName').value,
        phone: document.getElementById('formDriverPhone').value,
        status: 'Disponible',
        activeDeliveries: 0
      });
      ecrireStorage(CLE_LIVREURS, livreurs);
      afficherToast('Nouveau livreur enregistré !');

    } else if (action === 'new-rate') {
      tarifs.push({
        id: 'ITEM-' + Date.now(),
        name: document.getElementById('formRateName').value,
        category: document.getElementById('formRateCategory').value,
        price: Number(document.getElementById('formRatePrice').value),
        unit: 'pièce',
        icon: 'bi-basket'
      });
      ecrireStorage(CLE_TARIFS, tarifs);
      afficherToast('Nouvel article ajouté au catalogue client !');
    }

    modaleFormulaire.hide();
    toutRedessiner();
  });

  // =========================================================
  // MODALE DE CONFIRMATION
  // =========================================================
  let actionAConfirmer = null;

  // Affiche une modale de confirmation générique avec titre, texte
  // et callback exécuté uniquement si l'utilisateur clique "Confirmer"
  function afficherConfirmation(titre, texte, callback) {
    document.getElementById('confirmTitle').textContent = titre;
    document.getElementById('confirmText').textContent = texte;
    actionAConfirmer = callback;
    modaleConfirmation.show();
  }

  let boutonConfirmerOui = document.getElementById('confirmYes');
  if (boutonConfirmerOui) {
    boutonConfirmerOui.addEventListener('click', function () {
      if (actionAConfirmer) actionAConfirmer();
      modaleConfirmation.hide();
    });
  }

  // =========================================================
  // TOAST (PETIT MESSAGE DE CONFIRMATION)
  // =========================================================
  // Affiche un petit message toast en haut à droite pendant 2 secondes
  function afficherToast(message) {
    document.getElementById('toastMessage').textContent = message;
    toastInfo.show();
  }

  // =========================================================
  // SYNCHRONISATION EN DIRECT AVEC LE CLIENT
  // =========================================================
  // Quand le client passe une commande ou modifie son profil dans un
  // autre onglet, le navigateur envoie un événement "storage" ici.
  window.addEventListener('storage', function (e) {
    if (e.key === CLE_COMMANDES || e.key === CLE_CLIENTS || e.key === CLE_LIVREURS || e.key === CLE_TARIFS) {
      let anciennesCommandes = commandes.length;
      commandes = normaliserCommandesDepuisStorage();
      clients = lireStorage(CLE_CLIENTS, []);
      livreurs = lireStorage(CLE_LIVREURS, LIVREURS_PAR_DEFAUT);
      tarifs = lireStorage(CLE_TARIFS, TARIFS_PAR_DEFAUT);

      // Détecter les nouvelles commandes et créer une notification
      // avec un bouton "Voir la commande" cliquable
      if (commandes.length > anciennesCommandes) {
        let nouvellesCommandes = commandes.slice(0, commandes.length - anciennesCommandes);
        for (let n = 0; n < nouvellesCommandes.length; n++) {
          let cmd = nouvellesCommandes[n];
          ajouterNotification(
            'Nouvelle commande #' + cmd.id,
            (cmd.clientName || 'Client') + ' — ' + Number(cmd.total || 0).toLocaleString('fr-FR') + ' FCFA',
            'commande',
            cmd.id
          );
        }
      }

      toutRedessiner();
    }
  });

  // Bouton "Charger les demandes reçues" : permet de forcer une
  // relecture manuelle du localStorage (utile pendant les tests dans
  // le même onglet, où l'événement "storage" ne se déclenche pas).
  let boutonChargerCommandes = document.getElementById('btn-fetch-orders');
  if (boutonChargerCommandes) {
    boutonChargerCommandes.addEventListener('click', function () {
      commandes = normaliserCommandesDepuisStorage();
      toutRedessiner();
      afficherToast('Commandes actualisées depuis le site client.');
    });
  }

  // =========================================================
  // MISE A JOUR GLOBALE ET LANCEMENT INITIAL
  // =========================================================
  // Recharge et ré-affiche toutes les vues (dashboard, tableaux, grilles, stats)
  function toutRedessiner() {
    renderDashboard();
    renderOrdersTable();
    renderClientsTable();
    renderDriversGrid();
    renderRatesGrid();
    renderStats();
  }

  // Initialiser les notifications au chargement
  mettreAJourBadgeNotifications();

  // =========================================================
  // PROFIL ADMIN
  // =========================================================
  // Charger le profil admin depuis localStorage
  let profilAdmin = lireStorage('bide_admin_profile', {
    name: 'Admin Principal',
    email: 'admin@bide.tg',
    phone: '+228 90 00 00 00'
  });

  // Remplit le formulaire profil admin et l'avatar avec les données sauvegardées
  function renderProfilAdmin() {
    document.getElementById('admin-profile-name').value = profilAdmin.name || '';
    document.getElementById('admin-profile-email').value = profilAdmin.email || '';
    document.getElementById('admin-profile-phone').value = profilAdmin.phone || '';
    document.getElementById('adminProfileName').textContent = profilAdmin.name || 'Admin Principal';
    let avatarEl = document.querySelector('#page-profil .header-avatar');
    if (avatarEl && profilAdmin.name) {
      let mots = profilAdmin.name.trim().split(' ');
      let initiales = mots.length >= 2 ? (mots[0][0] + mots[1][0]).toUpperCase() : mots[0].substring(0, 2).toUpperCase();
      avatarEl.textContent = initiales;
    }
  }

  let formulaireProfilAdmin = document.getElementById('admin-profile-form');
  if (formulaireProfilAdmin) {
    formulaireProfilAdmin.addEventListener('submit', function (e) {
      e.preventDefault();
      profilAdmin.name = document.getElementById('admin-profile-name').value;
      profilAdmin.phone = document.getElementById('admin-profile-phone').value;
      ecrireStorage('bide_admin_profile', profilAdmin);
      renderProfilAdmin();
      afficherToast('Profil admin mis à jour !');
    });
  }

  // =========================================================
  // DÉCONNEXION
  // =========================================================
  function deconnexion() {
    localStorage.removeItem('utilisateurConnecte');
    window.location.href = '../pages/login.html';
  }

  let boutonLogoutSidebar = document.getElementById('logoutBtn');
  if (boutonLogoutSidebar) boutonLogoutSidebar.addEventListener('click', deconnexion);

  // Écouteur sur le bouton cloche pour fermer le menu en cliquant dessus
  let boutonNotifs = document.getElementById('notificationBtn');
  if (boutonNotifs) {
    boutonNotifs.addEventListener('click', function () {
      // Bootstrap gère le dropdown, on met juste à jour le badge
      nombreNotifsNonLues = notifications.filter(function (n) { return !n.lue; }).length;
    });
  }

  renderProfilAdmin();
  toutRedessiner();
  dessinerGraphiqueDashboard();
  // dessinerGraphiqueStats() est appelé uniquement quand on visite la page Statistiques
});
