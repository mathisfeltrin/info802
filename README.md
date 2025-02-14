# 🚗 API de Gestion des Stations et Véhicules Électriques

![Express.js](https://img.shields.io/badge/Express.js-4.x-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![License](https://img.shields.io/badge/License-ISC-blue)

## 📌 Description

Cette API permet de gérer les stations de recharge, les itinéraires et les véhicules électriques. Elle fournit des endpoints pour récupérer les stations, les trajets et les véhicules disponibles ainsi qu'un proxy pour interroger l'API OpenRouteService.

## 🏗️ Installation

### Prérequis

- **Node.js** (v18.x recommandé)
- **npm**

### Étapes d'installation

1. **Cloner le projet** :

   ```sh
   git clone https://github.com/mathisfeltrin/info802.git
   cd info802
   ```

2. **Installer les dépendances** :

   ```sh
   npm install
   ```

3. **Créer un fichier `.env`** avec les variables suivantes :

   ```sh
   # Configuration du serveur
   PORT=3001
   ```

# API IRVE (Bornes de recharge)

IRVE_API_URL =

# OpenStreetMap (exemple pour l'utilisation de Nominatim)

OSM_API_URL =
OPENROUTE_API_KEY =

# API ChargeTrip

CHARGETRIP_API_URL =
CHARGETRIP_CLIENT_ID =
CHARGETRIP_APP_ID =

````

4. **Lancer l'API en mode développement** :

```sh
npm run dev
````

5. **Lancer en mode production** :
   ```sh
   npm start
   ```

---

## 🛠️ Technologies Utilisées

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Axios](https://axios-http.com/)
- [Cors](https://www.npmjs.com/package/cors)
- [Dotenv](https://www.npmjs.com/package/dotenv)
- [OpenRouteService API](https://openrouteservice.org/)

---

## 📡 Endpoints de l'API

### 🚉 **Stations**

| Méthode | Endpoint        | Description                   |
| ------- | --------------- | ----------------------------- |
| **GET** | `/api/stations` | Récupérer toutes les stations |

### 🚗 **Véhicules**

| Méthode | Endpoint        | Description                      |
| ------- | --------------- | -------------------------------- |
| **GET** | `/api/vehicles` | Récupérer la liste des véhicules |

### 🛣 **Itinéraires**

| Méthode | Endpoint                                     | Description                                   |
| ------- | -------------------------------------------- | --------------------------------------------- |
| **GET** | `/api/map`                                   | Récupérer des cartes                          |
| **GET** | `/api/proxy-route?start=lon,lat&end=lon,lat` | Obtenir un itinéraire depuis OpenRouteService |

---

## 🏗️ Architecture du Projet

```
.
├── index.js
├── package.json
├── public
│   ├── app.js
│   ├── index.html
│   └── style.css
├── routes
│   ├── map.js
│   ├── stations.js
│   └── vehicles.js
├── services
│   ├── fetchVehicles.js
│   ├── routeService.js
│   └── stationsService.js
└── utils
    ├── env.js
    ├── haversine.js
```

### 📜 Explication des Dossiers

- **routes/** → Contient les routes de l’API.
- **services/** → Contient la logique métier et les appels aux données.
- **utils/** → Fonctions utilitaires comme le calcul de distance avec `haversine.js`.
- **public/** → Contient les fichiers statiques.

---

## ⚡ Exemples d'Utilisation avec Postman

### 🔹 Récupérer la liste des véhicules

```sh
curl -X GET https://electrictravel.azurewebsites.net/api/vehicles
```

### 🔹 Récupérer un itinéraire entre deux points

```sh
curl -X GET "https://electrictravel.azurewebsites.net/api/proxy-route?start=2.3522,48.8566&end=4.8357,45.7640"
```

---

## 📄 Licence

Ce projet est sous licence **ISC**.

---

🚀 _Développé avec ❤️ en Node.js et Express.js_
