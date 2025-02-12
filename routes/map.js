const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
}

// Fonction pour récupérer les bornes proches d'un itinéraire
async function fetchNearbyStations(routeCoordinates, autonomy, startCoords) {
  try {
    const response = await axios.get(process.env.IRVE_API_URL, {
      params: { dataset: "bornes-irve", rows: 5000 },
    });

    console.log(
      "📡 Données brutes reçues de l'API IRVE :",
      JSON.stringify(response.data.records.slice(0, 5), null, 2)
    );

    const stations = response.data.records
      .map((record) => {
        const fields = record.fields || {};
        const geometry = record.geometry || {};

        let coordonnees = null;

        // 1️⃣ Vérification avancée des différentes sources de coordonnées
        if (
          fields.geo_point_borne &&
          Array.isArray(fields.geo_point_borne) &&
          fields.geo_point_borne.length === 2 &&
          !isNaN(fields.geo_point_borne[0]) &&
          !isNaN(fields.geo_point_borne[1])
        ) {
          coordonnees = [
            parseFloat(fields.geo_point_borne[0]), // latitude
            parseFloat(fields.geo_point_borne[1]), // longitude
          ];
        } else if (
          geometry &&
          geometry.coordinates &&
          Array.isArray(geometry.coordinates) &&
          geometry.coordinates.length === 2 &&
          !isNaN(geometry.coordinates[0]) &&
          !isNaN(geometry.coordinates[1])
        ) {
          coordonnees = [
            parseFloat(geometry.coordinates[1]), // latitude
            parseFloat(geometry.coordinates[0]), // longitude
          ];
        } else if (
          fields.ylatitude !== undefined &&
          fields.xlongitude !== undefined &&
          !isNaN(fields.ylatitude) &&
          !isNaN(fields.xlongitude)
        ) {
          coordonnees = [
            parseFloat(fields.ylatitude), // latitude
            parseFloat(fields.xlongitude), // longitude
          ];
        }

        if (!coordonnees || isNaN(coordonnees[0]) || isNaN(coordonnees[1])) {
          return null; // Ignore cette borne si les coordonnées sont invalides
        }

        return {
          nom: fields.n_station || "Borne inconnue",
          adresse: fields.ad_station || "Adresse inconnue",
          coordonnees,
        };
      })
      .filter((station) => station !== null);

    console.log(`📌 Bornes AVANT filtrage : ${stations.length}`);

    // 2️⃣ Sélection des bornes : UNE tous les `autonomy` km
    const selectedStations = [];
    let lastSelectedCoord =
      Array.isArray(startCoords) && startCoords.length === 2
        ? startCoords
        : routeCoordinates[0];

    let distanceSinceLast = 0;

    for (let i = 1; i < routeCoordinates.length; i++) {
      const [curLon, curLat] = routeCoordinates[i];
      const [prevLon, prevLat] = lastSelectedCoord;

      const distance = haversine(prevLat, prevLon, curLat, curLon);
      distanceSinceLast += distance;

      if (distanceSinceLast >= autonomy) {
        // Trouver la borne la plus proche du point actuel du trajet
        const nearbyStations = stations
          .map((station) => {
            const [stationLat, stationLon] = station.coordonnees;
            return {
              station,
              distance: haversine(curLat, curLon, stationLat, stationLon),
            };
          })
          .filter((s) => s.distance < 15) // 🔥 On prend uniquement les bornes ≤ 15 km du trajet
          .sort((a, b) => a.distance - b.distance); // Trier par proximité

        if (nearbyStations.length > 0) {
          const chosenStation = nearbyStations[0].station; // Prendre la plus proche

          // 🔥 Vérifier si la borne est bien espacée de la précédente
          if (
            selectedStations.length === 0 ||
            haversine(
              selectedStations[selectedStations.length - 1].coordonnees[0],
              selectedStations[selectedStations.length - 1].coordonnees[1],
              chosenStation.coordonnees[0],
              chosenStation.coordonnees[1]
            ) >=
              autonomy * 0.8 // On laisse une petite tolérance
          ) {
            selectedStations.push(chosenStation);
            lastSelectedCoord = [curLon, curLat]; // Met à jour la position
            distanceSinceLast = 0; // Reset la distance
          }
        }
      }
    }

    console.log(`📌 Bornes APRÈS filtrage : ${selectedStations.length}`);
    return selectedStations;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des bornes :",
      error.message
    );
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
    const chargingStations = await fetchNearbyStations(route, carAutonomy);

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
