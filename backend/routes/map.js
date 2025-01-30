const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// Route pour récupérer un itinéraire entre deux villes
router.get("/route", async (req, res) => {
  const { startCity, endCity } = req.query;

  if (!startCity || !endCity) {
    return res
      .status(400)
      .json({ error: "Les villes de départ et d'arrivée sont requises." });
  }

  try {
    // 🔹 1. Obtenir les coordonnées des villes avec Nominatim (OpenStreetMap)
    const startResponse = await axios.get(`${process.env.OSM_API_URL}`, {
      params: { q: startCity, format: "json", limit: 1 },
    });

    const endResponse = await axios.get(`${process.env.OSM_API_URL}`, {
      params: { q: endCity, format: "json", limit: 1 },
    });

    // 🔹 2. Vérifier si Nominatim a bien trouvé les villes
    console.log("Réponse Nominatim - Start:", startResponse.data);
    console.log("Réponse Nominatim - End:", endResponse.data);

    if (!startResponse.data.length || !endResponse.data.length) {
      return res
        .status(404)
        .json({
          error: "Une des villes n'a pas été trouvée. Vérifiez l'orthographe.",
        });
    }

    // 🔹 3. Extraire les coordonnées des villes
    const startCoords = {
      lat: parseFloat(startResponse.data[0].lat),
      lon: parseFloat(startResponse.data[0].lon),
    };

    const endCoords = {
      lat: parseFloat(endResponse.data[0].lat),
      lon: parseFloat(endResponse.data[0].lon),
    };

    console.log("Coordonnées Start:", startCoords);
    console.log("Coordonnées End:", endCoords);

    // 🔹 4. Obtenir l'itinéraire avec OpenRouteService
    const routeResponse = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: process.env.OPENROUTE_API_KEY, // Assurez-vous que la clé API est bien présente dans .env
          start: `${startCoords.lon},${startCoords.lat}`,
          end: `${endCoords.lon},${endCoords.lat}`,
        },
      }
    );

    if (!routeResponse.data || !routeResponse.data.features) {
      return res
        .status(500)
        .json({ error: "Impossible de récupérer l'itinéraire." });
    }

    // 🔹 5. Renvoyer les données JSON à l’utilisateur
    res.json({
      route: routeResponse.data,
      startCoords,
      endCoords,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'itinéraire :",
      error.message
    );
    res
      .status(500)
      .json({ error: "Erreur interne du serveur", details: error.message });
  }
});

module.exports = router;
