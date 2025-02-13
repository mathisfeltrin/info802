# 🚗 API de Gestion des Stations et Véhicules Électriques

![Express.js](https://img.shields.io/badge/Express.js-4.x-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![License](https://img.shields.io/badge/License-ISC-blue)

## 📌 Description
Cette API permet de gérer les stations de recharge et les véhicules électriques. Elle fournit des endpoints pour récupérer les stations, les trajets et les véhicules disponibles.

## 🏗️ Installation

### Prérequis
- **Node.js** (v18.x recommandé)
- **npm** ou **yarn**

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

3. **Créer un fichier `.env`** (si nécessaire) :
   ```sh
   touch .env
   ```

4. **Lancer l'API en mode développement** :
   ```sh
   npm run dev
   ```

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
- [Nodemon](https://www.npmjs.com/package/nodemon) *(pour le développement)*

---

## 📡 Endpoints de l'API

### 🚉 **Stations**
| Méthode | Endpoint        | Description |
|---------|----------------|-------------|
| **GET** | `/stations`    | Récupérer toutes les stations |

### 🚗 **Véhicules**
| Méthode | Endpoint        | Description |
|---------|----------------|-------------|
| **GET** | `/vehicles`    | Récupérer la liste des véhicules |

### 🛣 **Routes**
| Méthode | Endpoint      | Description |
|---------|--------------|-------------|
| **GET** | `/routes`    | Obtenir les trajets disponibles |

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
│   ├── route.js
│   ├── stations.js
│   └── vehicles.js
├── services
│   ├── fetchVehicles.js
│   ├── routeService.js
│   └── stationsService.js
└── utils
    ├── env.js
    └── haversine.js
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
curl -X GET http://localhost:3000/vehicles
```

---

## 📄 Licence
Ce projet est sous licence **ISC**.

---

🚀 *Développé avec ❤️ en Node.js et Express.js*

