const express = require("express");
const { getCoordinates, getRoute } = require("../services/routeService");
const { fetchNearbyStations } = require("../services/stationsService");

const router = express.Router();

router.get("/route", async (req, res) => {
  const { startCity, endCity, autonomy = 300 } = req.query;

  if (!startCity || !endCity) {
    return res
      .status(400)
      .json({ error: "Les villes de départ et d'arrivée sont requises." });
  }

  try {
    const startCoords = await getCoordinates(startCity);
    const endCoords = await getCoordinates(endCity);

    if (!startCoords || !endCoords) {
      return res.status(404).json({ error: "Ville introuvable." });
    }

    const route = await getRoute(startCoords, endCoords);
    if (!route.length) {
      return res
        .status(500)
        .json({ error: "Impossible de récupérer l'itinéraire." });
    }

    const chargingStations = await fetchNearbyStations(
      route,
      autonomy,
      startCoords
    );

    res.json({ route, startCoords, endCoords, chargingStations });
  } catch (error) {
    console.error("❌ Erreur :", error.message);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
