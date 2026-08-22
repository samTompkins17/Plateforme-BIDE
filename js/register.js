const register = document.getElementById('register');

// Identifiants administrateur prédéfinis
const ADMIN_EMAIL = "admin@bide.tg";
const ADMIN_PASSWORD = "AdminPassword123";

// Liens de redirection
const ADMIN_URL = "../Dashboard-Admin/dashboard.html";
const CLIENT_URL = "../pages/client.html";

register.addEventListener('click', function (event) {
  event.preventDefault();

  // Sélection de vos variables
  let nom = document.getElementById('nom');
  let prenom = document.getElementById('prenom');
  let telephone = document.getElementById('telephone');
  let email = document.getElementById('email');
  let password = document.getElementById('password');
  let confirm = document.getElementById('confirm_password');
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
  const phoneRegex = /^[0-9\s\+\-]{8,}$/;
  if (!phoneRegex.test(telephone.value.trim())) {
    showError(telephone, "Numéro de téléphone invalide.");
    estValide = false;
  } else {
    clearError(telephone);
  }

  // Validation Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const userEmail = email.value.trim().toLowerCase();
  if (!emailRegex.test(userEmail)) {
    showError(email, "Veuillez entrer une adresse email valide.");
    estValide = false;
  } else {
    clearError(email);
  }

  // Validation Mot de passe
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
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
    const userPassword = password.value;

    const isAdmin = (userEmail === ADMIN_EMAIL.toLowerCase()) && (userPassword === ADMIN_PASSWORD);

    const utilisateur = {
      nom: nom.value.trim(),
      prenom: prenom.value.trim(),
      telephone: telephone.value.trim(),
      email: userEmail,
      role: isAdmin ? 'admin' : 'client'
    };

    localStorage.setItem('utilisateurConnecte', JSON.stringify(utilisateur));

    if (isAdmin) {
      console.log("Accès Admin autorisé. Redirection...");
      window.location.href = ADMIN_URL;
    } else {
      console.log("Accès Admin refusé. Redirection vers l'espace client...");
      window.location.href = CLIENT_URL;
    }
  }
});

// Fonctions d'affichage des erreurs
function showError(inputElement, errorMessageText) {
  const parentContainer = inputElement.parentElement;
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

function clearError(inputElement) {
  const parentContainer = inputElement.parentElement;
  const errorSpan = parentContainer.querySelector('.error-message');

  if (errorSpan) {
    errorSpan.remove();
  }
  inputElement.style.borderColor = 'green';
}