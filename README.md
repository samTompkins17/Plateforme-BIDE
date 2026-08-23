# 🧺 Bidé Pressing — Application Web de Pressing à Domicile

> Projet de développement web — Application complète de gestion de pressing à domicile pour la ville de Lomé, Togo.

---

## 📋 Table des matières

- [Présentation du projet](#-présentation-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Architecture du projet](#-architecture-du-projet)
- [Installation et utilisation](#-installation-et-utilisation)
- [Identifiants de démonstration](#-identifiants-de-démonstration)
- [Maquettes et design](#-maquettes-et-design)
- [Sécurité](#-sécurité)
- [Déploiement](#-déploiement)
- [Auteurs](#-auteurs)

---

## 🎯 Présentation du projet

**Bidé Pressing** est une platefiorme web frontale complète simulant un service de pressing à domicile disponible 24h/24 à Lomé, Togo. Le projet comprend :

- Une **page vitrine** publique présentant les services et tarifs
- Un **espace client** permettant de passer des commandes et suivre leur traitement en temps réel
- Un **espace administrateur** pour gérer les commandes, clients, livreurs(en développement) et le catalogue

Le système de synchronisation en temps réel entre l'espace client et l'espace administrateur utilise les **BroadcastChannel API** et les **événements storage** du navigateur.

---

## ✨ Fonctionnalités

### Page d'accueil (vitrine)
- Hero avec vidéo de fond et animation typewriter
- Présentation des 3 services (nettoyage à sec, repassage professionnel, service express)
- Section "Comment ça marche" en 3 étapes
- Grille de tarifs avec images pour 13 articles (vêtements + linge de maison)
- Carte Google Maps des zones d'intervention à Lomé
- Animations de scroll reveal

### Espace Client
| Module | Description |
|--------|-------------|
| **Tableau de bord** | Résumé des commandes actives, points fidélité, adresse enregistrée |
| **Catalogue** | 12 articles filtrables par catégorie (Quotidien, Maison, Délicat) avec quantités +/- |
| **Panier** | Récapitulatif en temps réel, sous-total, bouton de validation |
| **Checkout** | Choix du mode de livraison (domicile/agence) et de paiement (Mobile Money, Carte, Espèces) |
| **Suivi** | Stepper visuel à 5 étapes avec notifications en temps réel |
| **Historique** | Tableau de toutes les commandes avec badges colorés par statut |
| **Profil** | Édition des informations personnelles, upload photo, changement de mot de passe |
| **Notifications** | Cloche avec badge, dropdown, synchronisation admin → client |

### Espace Administrateur
| Module | Description |
|--------|-------------|
# BIDE

Ce dépôt contient le prototype front-end du projet. Il permet de parcourir la vitrine, de créer un compte client, de simuler une commande et de gérer les commandes depuis un tableau de bord administrateur.

## Ce que l'on peut tester

### Côté client

- consulter les services et les tarifs depuis la page d'accueil ;
- créer un compte et se connecter ;
- parcourir le catalogue et ajouter des articles au panier ;
- choisir un mode de livraison et un moyen de paiement ;
- consulter le statut et l'historique de ses commandes ;
- modifier les informations de son profil et gérer ses notifications.

### Côté administration

Le dashboard permet de simuler la gestion quotidienne du pressing :

- voir les indicateurs principaux et les commandes récentes ;
- rechercher et filtrer les commandes ;
- modifier leur statut et affecter un livreur ;
- consulter les clients et l'équipe de livraison ;
- suivre quelques statistiques ;
- modifier les articles et les tarifs du catalogue.

Les changements sont conservés dans le `localStorage`. Lorsqu'une commande est modifiée dans le dashboard, l'espace client peut être mis à jour grâce aux mécanismes de synchronisation du navigateur (`BroadcastChannel` et événement `storage`).

## Technologies

Le projet ne repose pas sur un framework JavaScript. Il utilise :

- HTML5 pour les pages ;
- CSS3 pour la mise en page, le responsive et les animations ;
- JavaScript vanilla (ES6+) pour les interactions ;
- Bootstrap 5.3.3 et Bootstrap Icons via CDN ;
- Chart.js via CDN pour les graphiques de l'administration ;
- Google Fonts et Material Symbols pour la typographie et les icônes ;
- `localStorage` et `BroadcastChannel` pour la persistance et la synchronisation côté navigateur ;
- Vercel pour le déploiement éventuel.

## Lancer le projet en local

Un navigateur récent suffit. L'utilisation de Live Server est recommandée, car elle reproduit mieux le fonctionnement d'un vrai site et évite certains problèmes liés à l'ouverture directe de fichiers HTML.

1. Cloner le dépôt et se placer dans le dossier du projet :

   ```bash
   git clone https://github.com/samTompkins17/Plateforme-BIDE.git
   cd Plateforme-BIDE
   ```

2. Ouvrir le dossier dans VS Code.

3. Lancer `pages/index.html` avec l'extension **Live Server**, ou ouvrir directement le fichier dans le navigateur.

Le projet ne contient pas de script npm de démarrage. Le fichier `package.json` sert actuellement à déclarer la dépendance `sharp`, utilisée pour le traitement éventuel des ressources, et n'est pas nécessaire pour consulter l'application.

Une connexion Internet est nécessaire pour charger Bootstrap, Bootstrap Icons, Chart.js, Google Fonts et la carte Google Maps intégrée à la vitrine.

## Parcours rapide

Depuis `pages/index.html` :

1. cliquer sur **Connexion** ;
2. créer un compte depuis **Inscription**, ou utiliser le compte administrateur ;
3. tester le parcours client ;
4. ouvrir le dashboard pour observer la gestion des commandes.

### Compte administrateur de démonstration

```text
Email : admin@bide.tg
Mot de passe : AdminPassword123
```

Pour tester le parcours client, il suffit de créer un compte avec une autre adresse e-mail.

## Organisation des fichiers

```text
.
├── pages/
│   ├── index.html              # Page vitrine
│   ├── login.html              # Connexion
│   ├── register.html           # Inscription
│   └── client.html             # Espace client
├── Dashboard-Admin/
│   ├── dashboard.html          # Interface administrateur
│   ├── css/dashboard.css       # Styles du dashboard
│   └── js/app.js               # Logique du dashboard
├── css/
│   ├── vitrine.css             # Styles de la vitrine
│   ├── client.css              # Styles de l'espace client
│   ├── login.css               # Styles de connexion et inscription
│   └── nav-bar.css             # Navigation commune
├── js/
│   ├── animations.js            # Animations de la vitrine
│   ├── main.js                  # Interactions de la page d'accueil
│   ├── client.js                # Fonctionnalités client
│   ├── login.js                 # Connexion et redirection
│   └── register.js              # Création de compte
├── assets/                      # Logos, photos, vidéo et autres médias
├── package.json
└── vercel.json                  # Réécriture de l'URL racine vers la vitrine
```

## Déploiement

Le projet peut être publié comme un site statique. La configuration Vercel redirige la racine du domaine vers `pages/index.html` et applique un cache longue durée aux fichiers du dossier `assets`.

Avec la CLI Vercel :

```bash
npx vercel --prod
```

Il est également possible de connecter le dépôt à Vercel et de déployer à chaque push sur la branche choisie.

## À propos des données

Ce projet est un prototype pédagogique. Il n'y a pas de serveur ni de base de données :

- les comptes et les commandes sont enregistrés dans le navigateur ;
- les identifiants administrateur sont présents dans le code ;
- les données ne sont pas partagées entre plusieurs utilisateurs ou appareils ;
- vider les données du site réinitialise l'état local de l'application.

Avant une mise en production, il faudrait ajouter une API, une vraie authentification, une base de données, une gestion sécurisée des paiements et un contrôle des droits côté serveur.

## Équipe

Projet réalisé dans le cadre de la formation en développement web à l'ADN par :

<table>
   <tr>
      <td align="center">
         <img src="assets/samuel.jpeg" width="120" alt="Photo de Kossi Alexis Samuel Segbegno">
         <br>
         <b>Kossi Alexis Samuel Segbegno</b>
         <br>
         <small>samtompkins1702@gmail.com</small>
      </td>
      <td align="center">
         <img src="assets/gloria.jpeg" width="120" alt="Photo de Hulda Gloria NOUDJRODOU">
         <br>
         <b>Hulda Gloria NOUDJRODOU</b>
         <br>
         <small>noudjrodouhuldagloria@gmail.com</small>
      </td>
   </tr>
</table>