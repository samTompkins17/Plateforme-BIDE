# BIDE

# Présentation du projet

BIDE est un prototype front-end de plateforme web pour un service de pressing à domicile à Lomé, au Togo. Il permet de parcourir les services, de créer un compte client, de simuler une commande et de gérer les commandes depuis un tableau de bord administrateur.

Le projet est réalisé dans le cadre d'un projet scolaire de développement web.

# Fonctionnalités

## Vitrine

- présentation des services et des tarifs ;
- hero avec vidéo de fond et animation typewriter ;
- présentation des trois étapes du service ;
- catalogue de 12 articles avec catégories et tarifs ;
- carte Google Maps des zones d'intervention à Lomé ;
- animations au défilement.

## Espace client

- création de compte et connexion ;
- tableau de bord avec commandes actives et points de fidélité ;
- catalogue filtrable par catégorie avec gestion des quantités ;
- panier et validation de commande ;
- choix du mode de livraison et du moyen de paiement ;
- suivi de commande avec indicateur d'avancement ;
- historique des commandes ;
- modification du profil et gestion des notifications.

## Espace administrateur

- consultation des indicateurs et des commandes récentes ;
- recherche et filtrage des commandes ;
- modification du statut des commandes ;
- affectation d'un livreur ;
- consultation des clients et des livreurs ;
- statistiques de l'activité ;
- modification des articles et des tarifs du catalogue.

Les données sont conservées dans le `localStorage`. Les espaces client et administrateur peuvent se synchroniser dans le navigateur grâce à `BroadcastChannel` et à l'événement `storage`.

# Technologies

- HTML5 ;
- CSS3, responsive design et animations ;
- JavaScript vanilla (ES6+) ;
- Bootstrap 5.3.3 et Bootstrap Icons via CDN ;
- Chart.js via CDN pour les graphiques ;
- Google Fonts et Material Symbols ;
- `localStorage` et `BroadcastChannel` ;
- Vercel pour un éventuel déploiement statique.

# Tester le projet en local

Ouvrir [index.html](index.html), puis :

1. cliquer sur **Connexion** ;
2. créer un compte depuis **Inscription**, ou utiliser le compte administrateur ;
3. tester le parcours client ;
4. ouvrir [dashboard.html](dashboard.html) pour gérer les commandes.

## Compte administrateur de démonstration

```text
Email : admin@bide.tg
Mot de passe : AdminPassword123
```

Pour tester le parcours client, créer un compte avec une autre adresse e-mail.

## Organisation des fichiers

```text
.
├── index.html                 # Page vitrine
├── login.html                 # Connexion
├── register.html              # Inscription
├── client.html                # Espace client
├── dashboard.html             # Tableau de bord administrateur
├── Dashboard-Admin/
│   ├── app.js                 # Logique du dashboard
│   └── dashboard.css          # Styles du dashboard
├── css/
│   ├── vitrine.css            # Styles de la vitrine
│   ├── client.css             # Styles de l'espace client
│   ├── login.css              # Styles de connexion et inscription
│   └── nav-bar.css            # Navigation commune
├── js/
│   ├── animations.js          # Animations de la vitrine
│   ├── main.js                # Interactions de la page d'accueil
│   ├── client.js              # Fonctionnalités client
│   ├── login.js               # Connexion et redirection
│   └── register.js            # Création de compte
├── assets/                    # Logos, images, vidéo et autres médias
└── vercel.json
```

## Limites du prototype

Il n'y a pas de serveur ni de base de données :

- les comptes et les commandes sont enregistrés dans le navigateur ;
- les identifiants administrateur sont présents dans le code ;
- les données ne sont pas partagées entre plusieurs utilisateurs ou appareils ;

# Équipe

Projet réalisé dans le cadre de la formation en développement web à l'ADN par :

<table>
   <tr>
      <td align="center">
         <img src="assets/samuel.png" width="120" alt="Photo de Kossi Alexis Samuel Segbegno">
         <br>
         <strong>Kossi Alexis Samuel Segbegno</strong>
         <br>
         <small>samtompkins1702@gmail.com</small>
      </td>
      <td align="center">
         <img src="assets/gloria.jpeg" width="120" alt="Photo de Hulda Gloria NOUDJRODOU">
         <br>
         <strong>Hulda Gloria NOUDJRODOU</strong>
         <br>
         <small>noudjrodouhuldagloria@gmail.com</small>
      </td>
      <td align="center">
         <img src="assets/prince.jpeg" width="120" alt="Photo de Duah Prince Yao AMANKWAAH">
         <br>
         <strong>Duah Prince Yao AMANKWAAH</strong>
         <br>
         <small>ypad0510@gmail.com</small>
      </td>
      <td align="center">
         <img src="assets/norbert.png" width="120" alt="Photo de Folly Norbert MESSANH">
         <br>
         <strong>Folly Norbert MESSANH</strong>
         <br>
         <small>amenouvevelight@gmail.com</small>
      </td>
   </tr>
</table>
