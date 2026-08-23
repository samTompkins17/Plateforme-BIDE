var register = document.getElementById('register');

// Identifiants administrateur prédéfinis
var ADMIN_EMAIL = "admin@bide.tg";
var ADMIN_PASSWORD = "AdminPassword123";

// Liens de redirection
var ADMIN_URL = "../Dashboard-Admin/dashboard.html";
var CLIENT_URL = "../pages/client.html";

register.addEventListener('click', function (event) {
  event.preventDefault();

  var nom = document.getElementById('nom');
  var prenom = document.getElementById('prenom');
  var telephone = document.getElementById('telephone');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var confirm = document.getElementById('confirm_password');
  var terms = document.getElementById('terms');

  var estValide = true;

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
  var phoneRegex = /^[0-9\s\+\-]{8,}$/;
  if (!phoneRegex.test(telephone.value.trim())) {
    showError(telephone, "Numéro de téléphone invalide.");
    estValide = false;
  } else {
    clearError(telephone);
  }

  // Validation Email
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var userEmail = email.value.trim().toLowerCase();
  if (!emailRegex.test(userEmail)) {
    showError(email, "Veuillez entrer une adresse email valide.");
    estValide = false;
  } else {
    clearError(email);
  }

  // Validation Mot de passe
  var passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password.value)) {
    showError(password, "Le mot de passe doit contenir 8 caractères min., avec au moins 1 majuscule et 1 chiffre.");
    estValide = false;
  } else {
    clearError(password);
  }

  // Validation Confirmation mot de passe
  if (confirm.value !== password.value || confirm.value === "") {
    showError(confirm, "Les mots de passe ne correspondent pas.");
    estValide = false;
  } else {
    clearError(confirm);
  }

  if (!terms.checked) {
    showError(terms, "Vous devez accepter les conditions d'utilisation.");
    estValide = false;
  } else {
    clearError(terms);
  }

  if (estValide) {
    var userPassword = password.value;
    var isAdmin = (userEmail === ADMIN_EMAIL.toLowerCase()) && (userPassword === ADMIN_PASSWORD);

    var utilisateur = {
      nom: nom.value.trim(),
      prenom: prenom.value.trim(),
      telephone: telephone.value.trim(),
      email: userEmail,
      role: isAdmin ? 'admin' : 'client'
    };

    localStorage.setItem('utilisateurConnecte', JSON.stringify(utilisateur));

    // Sauvegarder aussi le profil au format attendu par client.js
    // (clé 'bide_client_profile' avec champs name, phone, email, address)
    var profilClient = {
      name: nom.value.trim() + ' ' + prenom.value.trim(),
      phone: telephone.value.trim(),
      email: userEmail,
      address: '',
      avatar: ''
    };
    localStorage.setItem('bide_client_profile', JSON.stringify(profilClient));

    if (isAdmin) {
      window.location.href = ADMIN_URL;
    } else {
      window.location.href = CLIENT_URL;
    }
  }
});

// Fonctions d'affichage des erreurs
function showError(inputElement, errorMessageText) {
  var parentContainer = inputElement.parentElement;
  var errorSpan = parentContainer.querySelector('.error-message');

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

function clearError(inputElement) {
  var parentContainer = inputElement.parentElement;
  var errorSpan = parentContainer.querySelector('.error-message');

  if (errorSpan) {
    errorSpan.remove();
  }
  inputElement.style.borderColor = '';
}