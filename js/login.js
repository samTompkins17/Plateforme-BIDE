/* =========================================================
   BIDE PRESSING - SYSTÈME DE CONNEXION
   Identifiants admin codés en dur pour la démo.
   Tout autre email/mot de passe → espace client.
========================================================= */

// -------- IDENTIFIANTS ADMIN PRÉDÉFINIS --------
var ADMIN_EMAIL = "admin@bide.tg";
var ADMIN_PASSWORD = "AdminPassword123";

// -------- URLS DE REDIRECTION --------
var ADMIN_URL = "../Dashboard-Admin/dashboard.html";
var CLIENT_URL = "../pages/client.html";

// -------- ÉCOUTE DU FORMULAIRE --------
document.addEventListener("DOMContentLoaded", function () {
  var formulaire = document.querySelector(".login-section form");

  if (!formulaire) return;

  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();

    var emailInput = document.getElementById("email");
    var passwordInput = document.getElementById("password");

    var email = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;

    // Validation de base
    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    // Vérification des identifiants
    var estAdmin = (email === ADMIN_EMAIL.toLowerCase()) && (password === ADMIN_PASSWORD);

    if (estAdmin) {
      // ---- CONNEXION ADMIN ----
      var administrateur = {
        email: email,
        role: "admin"
      };
      localStorage.setItem("utilisateurConnecte", JSON.stringify(administrateur));
      window.location.href = ADMIN_URL;

    } else {
      // ---- CONNEXION CLIENT ----
      // On crée un profil basique à partir de l'email
      var nomAffiche = email.split("@")[0];
      // Mettre en forme : première lettre en majuscule
      nomAffiche = nomAffiche.charAt(0).toUpperCase() + nomAffiche.slice(1);

      var client = {
        email: email,
        role: "client"
      };
      localStorage.setItem("utilisateurConnecte", JSON.stringify(client));

      // Sauvegarder aussi le profil au format attendu par client.js
      var profilClient = {
        name: nomAffiche,
        phone: "",
        email: email,
        address: "",
        avatar: ""
      };
      localStorage.setItem("bide_client_profile", JSON.stringify(profilClient));
      window.location.href = CLIENT_URL;
    }
  });
});
