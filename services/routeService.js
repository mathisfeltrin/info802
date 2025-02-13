const axios = require("axios");
const { OSM_API_URL, OPENROUTE_API_KEY } = require("../utils/env");

async function getCoordinates(city) {
  try {
    const response = await axios.get(OSM_API_URL, {
      params: { q: city, format: "json", limit: 1 },
    });
    if (!response.data.length) throw new Error(`Ville non trouvée: ${city}`);
    return [parseFloat(response.data[0].lon), parseFloat(response.data[0].lat)];
  } catch (error) {
    console.error(`❌ Erreur API OSM pour ${city} :`, error.message);
    return null;
  }
}

async function getRoute(startCoords, endCoords) {
  try {
    const response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: OPENROUTE_API_KEY,
          start: startCoords.join(","),
          end: endCoords.join(","),
        },
      }
    );

    return response.data.features?.[0]?.geometry?.coordinates || [];
  } catch (error) {
    console.error("❌ Erreur API OpenRoute :", error.message);
    return [];
  }
}

module.exports = { getCoordinates, getRoute };
