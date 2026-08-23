/* =========================================================
   BIDE PRESSING - SYSTÈME DE CONNEXION
   Identifiants admin codés en dur pour la démo.
   Tout autre email/mot de passe → espace client.
========================================================= */

// -------- IDENTIFIANTS ADMIN PRÉDÉFINIS --------
let ADMIN_EMAIL = "admin@bide.tg";
let ADMIN_PASSWORD = "AdminPassword123";
let USERS_KEY = "bide_users";

// -------- URLS DE REDIRECTION --------
let ADMIN_URL = "dashboard.html";
let CLIENT_URL = "client.html";

// Lis la liste des utilisateurs inscrits depuis le localStorage
function lireUtilisateurs() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

// Lis le profil du client connecté depuis le localStorage
function lireProfilClient() {
  try {
    return JSON.parse(localStorage.getItem("bide_client_profile")) || null;
  } catch (error) {
    return null;
  }
}

// -------- ÉCOUTE DU FORMULAIRE --------
document.addEventListener("DOMContentLoaded", function () {
  let formulaire = document.querySelector(".login-section form");

  if (!formulaire) return;

  // Restaurer l'email sauvegardé si "Se souvenir de moi" était coché
  let emailSauvegarde = localStorage.getItem("bide_remember_email");
  if (emailSauvegarde) {
    let emailInput = document.getElementById("email");
    let rememberMe = document.getElementById("remember_me");
    if (emailInput) emailInput.value = emailSauvegarde;
    if (rememberMe) rememberMe.checked = true;
  }

  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();

    let emailInput = document.getElementById("email");
    let passwordInput = document.getElementById("password");

    let email = emailInput.value.trim().toLowerCase();
    let password = passwordInput.value;
    let rememberMe = document.getElementById("remember_me");
    let seSouvenir = rememberMe ? rememberMe.checked : false;

    // Validation de base
    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    // Sauvegarder l'email si "Se souvenir de moi" est coché
    if (seSouvenir) {
      localStorage.setItem("bide_remember_email", email);
    } else {
      localStorage.removeItem("bide_remember_email");
    }

    // Vérification des identifiants
    let estAdmin = (email === ADMIN_EMAIL.toLowerCase()) && (password === ADMIN_PASSWORD);

    if (estAdmin) {
      // ---- CONNEXION ADMIN ----
      let administrateur = {
        email: email,
        role: "admin"
      };
      localStorage.setItem("utilisateurConnecte", JSON.stringify(administrateur));
      window.location.href = ADMIN_URL;

    } else {
      // ---- CONNEXION CLIENT ----
      let utilisateurs = lireUtilisateurs();
      let utilisateurTrouve = utilisateurs.find(function (utilisateur) {
        return utilisateur.email === email && utilisateur.password === password;
      });

      if (!utilisateurTrouve) {
        alert("Email ou mot de passe incorrect.");
        return;
      }

      let client = {
        email: email,
        role: "client"
      };
      localStorage.setItem("utilisateurConnecte", JSON.stringify(client));

      // Sauvegarder aussi le profil au format attendu par client.js
      let profilExistant = lireProfilClient();
      let profilMemeClient = profilExistant && profilExistant.email === email ? profilExistant : {};
      let profilClient = {
        name: profilMemeClient.name || utilisateurTrouve.name,
        phone: profilMemeClient.phone || utilisateurTrouve.phone || "",
        email: email,
        address: profilMemeClient.address || utilisateurTrouve.address || "",
        avatar: profilMemeClient.avatar || utilisateurTrouve.avatar || ""
      };
      localStorage.setItem("bide_client_profile", JSON.stringify(profilClient));
      window.location.href = CLIENT_URL;
    }
  });
});
