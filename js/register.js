// Identifiants administrateur prédéfinis
let ADMIN_EMAIL = "admin@bide.tg";
let ADMIN_PASSWORD = "AdminPassword123";
let USERS_KEY = "bide_users";
let CLIENTS_KEY = "bide_clients";

// Liens de redirection
let ADMIN_URL = "../Dashboard-Admin/dashboard.html";
let CLIENT_URL = "../pages/client.html";

// Lis la liste des utilisateurs inscrits depuis le localStorage
function lireUtilisateurs() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

// Sauvegarde la liste des utilisateurs dans le localStorage
function ecrireUtilisateurs(utilisateurs) {
  localStorage.setItem(USERS_KEY, JSON.stringify(utilisateurs));
}

// Lis la liste des fiches clients depuis le localStorage
function lireClients() {
  try {
    return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

// Sauvegarde la liste des fiches clients dans le localStorage
function ecrireClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

// -------- ÉCOUTE DU FORMULAIRE D'INSCRIPTION --------
document.addEventListener('DOMContentLoaded', function () {
  let register = document.getElementById('register');
  let formulaire = register ? register.closest('form') : null;
  if (!formulaire) return;

  formulaire.addEventListener('submit', function (event) {
  event.preventDefault();

  let nom = document.getElementById('nom');
  let prenom = document.getElementById('prenom');
  let telephone = document.getElementById('telephone');
  let email = document.getElementById('email');
  let password = document.getElementById('password');
  let champConfirmation = document.getElementById('confirm_password');
  let terms = document.getElementById('terms');

  let estValide = true;

  // Validation Nom
  if (nom.value.trim().length < 2) {
    showError(nom, "Le nom doit contenir au moins 2 caractères.");
    estValide = false;
  } else {
    clearError(nom);
  }

  // Validation Prénom
  if (prenom.value.trim().length < 2) {
    showError(prenom, "Le prénom doit contenir au moins 2 caractères.");
    estValide = false;
  } else {
    clearError(prenom);
  }

  // Validation Téléphone
  let phoneRegex = /^[0-9\s\+\-]{8,}$/;
  if (!phoneRegex.test(telephone.value.trim())) {
    showError(telephone, "Numéro de téléphone invalide.");
    estValide = false;
  } else {
    clearError(telephone);
  }

  // Validation Email
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let userEmail = email.value.trim().toLowerCase();
  if (!emailRegex.test(userEmail)) {
    showError(email, "Veuillez entrer une adresse email valide.");
    estValide = false;
  } else {
    clearError(email);
  }

  // Validation Mot de passe
  let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password.value)) {
    showError(password, "Le mot de passe doit contenir 8 caractères min., avec au moins 1 majuscule et 1 chiffre.");
    estValide = false;
  } else {
    clearError(password);
  }

  // Validation Confirmation mot de passe
  if (champConfirmation.value !== password.value || champConfirmation.value === "") {
    showError(champConfirmation, "Les mots de passe ne correspondent pas.");
    estValide = false;
  } else {
    clearError(champConfirmation);
  }

  if (!terms.checked) {
    showError(terms, "Vous devez accepter les conditions d'utilisation.");
    estValide = false;
  } else {
    clearError(terms);
  }

  // Si toutes les validations passent, on crée le compte
  if (estValide) {
    let userPassword = password.value;
    // Vérifier si c'est un compte admin (identifiants prédéfinis)
    let isAdmin = (userEmail === ADMIN_EMAIL.toLowerCase()) && (userPassword === ADMIN_PASSWORD);
    let utilisateurs = lireUtilisateurs();

    // Pour un client, vérifier que l'email n'est pas déjà utilisé
    if (!isAdmin) {
      let emailExiste = utilisateurs.some(function (utilisateurExistant) {
        return utilisateurExistant.email === userEmail;
      });

      if (emailExiste) {
        showError(email, "Un compte existe déjà avec cette adresse email.");
        return;
      }
    }

    // Créer l'objet utilisateur de session (utilisé par tous les fichiers)
    let utilisateur = {
      nom: nom.value.trim(),
      prenom: prenom.value.trim(),
      telephone: telephone.value.trim(),
      email: userEmail,
      role: isAdmin ? 'admin' : 'client'
    };

    // Sauvegarder la session pour l'auth guard côté client/admin
    localStorage.setItem('utilisateurConnecte', JSON.stringify(utilisateur));

    // Sauvegarder aussi le profil au format attendu par client.js
    // (clé 'bide_client_profile' avec champs name, phone, email, address)
    let profilClient = {
      name: nom.value.trim() + ' ' + prenom.value.trim(),
      phone: telephone.value.trim(),
      email: userEmail,
      address: '',
      avatar: ''
    };

    if (!isAdmin) {
      utilisateurs.push({
        name: profilClient.name,
        phone: profilClient.phone,
        email: userEmail,
        password: userPassword,
        address: '',
        avatar: ''
      });
      ecrireUtilisateurs(utilisateurs);

      let clients = lireClients();
      let clientExiste = clients.some(function (clientExistant) {
        return (clientExistant.email || '').toLowerCase() === userEmail;
      });

      if (!clientExiste) {
        clients.push({
          id: 'CLI-' + Date.now(),
          name: profilClient.name,
          phone: profilClient.phone,
          email: userEmail,
          totalSpent: 0,
          ordersCount: 0
        });
        ecrireClients(clients);
      }
    }

    // Sauvegarder le profil au format client.js (clé bide_client_profile)
    localStorage.setItem('bide_client_profile', JSON.stringify(profilClient));

    // Rediriger vers l'espace correspondant
    if (isAdmin) {
      window.location.href = ADMIN_URL;
    } else {
      window.location.href = CLIENT_URL;
    }
  }
  });
});

// =========================================================
// FONCTIONS D'AFFICHAGE DES ERREURS DE VALIDATION
// =========================================================
// Affiche un message d'erreur sous le champ et passe sa bordure en rouge
function showError(inputElement, errorMessageText) {
  let parentContainer = inputElement.parentElement;
  let errorSpan = parentContainer.querySelector('.error-message');

  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.style.color = 'red';
    errorSpan.style.fontSize = '12px';
    errorSpan.style.display = 'block';
    errorSpan.style.marginTop = '4px';
    parentContainer.appendChild(errorSpan);
  }

  errorSpan.textContent = errorMessageText;
  inputElement.style.borderColor = 'red';
}

// Supprime le message d'erreur et réinitialise la bordure du champ
function clearError(inputElement) {
  let parentContainer = inputElement.parentElement;
  let errorSpan = parentContainer.querySelector('.error-message');

  if (errorSpan) {
    errorSpan.remove();
  }
  inputElement.style.borderColor = '';
}
