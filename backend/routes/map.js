const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// Fonction pour récupérer les bornes proches d'un itinéraire
async function fetchNearbyStations(routeCoordinates) {
  try {
    const response = await axios.get(process.env.IRVE_API_URL, {
      params: { dataset: "bornes-irve", rows: 5000 }, // Récupère un max de bornes
    });

    console.log("Exemple de données IRVE :", response.data.records[0]);

    const stations = response.data.records
      .map((record) => {
        const fields = record.fields || {};
        const geometry = record.geometry || {};

        let coordonnees = null;

        // Vérifier la présence des coordonnées et les normaliser
        if (fields.geo_point_borne) {
          coordonnees = [
            parseFloat(fields.geo_point_borne[0]), // lat
            parseFloat(fields.geo_point_borne[1]), // lon
          ];
        } else if (geometry.coordinates) {
          coordonnees = [
            parseFloat(geometry.coordinates[1]), // lat
            parseFloat(geometry.coordinates[0]), // lon
          ];
        }

        return {
          nom: fields.n_station || "Borne inconnue",
          adresse: fields.ad_station || "Adresse inconnue",
          coordonnees,
        };
      })
      .filter((station) => station.coordonnees); // Filtrer les bornes valides

    console.log("Bornes AVANT filtrage :", stations.length);
    console.log("Coordonnées des bornes extraites :", stations);

    // Sélectionner les bornes proches du trajet
    const selectedStations = stations.filter((station) => {
      return routeCoordinates.some((coord) => {
        const distance = Math.sqrt(
          Math.pow(coord[1] - station.coordonnees[0], 2) +
            Math.pow(coord[0] - station.coordonnees[1], 2)
        );
        return distance < 0.2; // Seules les bornes à 20 km max du trajet
      });
    });

    console.log("Bornes APRÈS filtrage :", selectedStations.length);

    return selectedStations;
  } catch (error) {
    console.error("Erreur lors de la récupération des bornes :", error.message);
    return [];
  }
}

// Route pour récupérer un itinéraire et les bornes sur le trajet
router.get("/route", async (req, res) => {
  const { startCity, endCity, autonomy } = req.query;
  const carAutonomy = parseFloat(autonomy) || 300; // Autonomie par défaut : 300 km

  if (!startCity || !endCity) {
    return res
      .status(400)
      .json({ error: "Les villes de départ et d'arrivée sont requises." });
  }

  try {
    // 1️⃣ Obtenir les coordonnées des villes
    const startResponse = await axios.get(`${process.env.OSM_API_URL}`, {
      params: { q: startCity, format: "json", limit: 1 },
    });

    const endResponse = await axios.get(`${process.env.OSM_API_URL}`, {
      params: { q: endCity, format: "json", limit: 1 },
    });

    if (!startResponse.data.length || !endResponse.data.length) {
      return res
        .status(404)
        .json({ error: "Une des villes n'a pas été trouvée." });
    }

    const startCoords = [
      parseFloat(startResponse.data[0].lon),
      parseFloat(startResponse.data[0].lat),
    ];
    const endCoords = [
      parseFloat(endResponse.data[0].lon),
      parseFloat(endResponse.data[0].lat),
    ];

    // 2️⃣ Obtenir l’itinéraire via OpenRouteService
    const routeResponse = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: process.env.OPENROUTE_API_KEY,
          start: startCoords.join(","),
          end: endCoords.join(","),
        },
      }
    );

    if (!routeResponse.data || !routeResponse.data.features) {
      return res
        .status(500)
        .json({ error: "Impossible de récupérer l'itinéraire." });
    }

    const route = routeResponse.data.features[0].geometry.coordinates;

    // 3️⃣ Sélectionner les bornes sur le trajet
    const chargingStations = await fetchNearbyStations(route);

    res.json({
      route,
      startCoords,
      endCoords,
      chargingStations,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'itinéraire :",
      error.message
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
