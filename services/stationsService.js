const axios = require("axios");
const { haversine } = require("../utils/haversine");
const { IRVE_API_URL } = require("../utils/env");

async function fetchStations() {
  try {
    const response = await axios.get(IRVE_API_URL, {
      params: { dataset: "bornes-irve", rows: 5000 },
    });
    return response.data.records || [];
  } catch (error) {
    console.error("❌ Erreur API IRVE :", error.message);
    return [];
  }
}

function extractCoordinates(fields, geometry) {
  if (fields.geo_point_borne && Array.isArray(fields.geo_point_borne)) {
    return [
      parseFloat(fields.geo_point_borne[0]),
      parseFloat(fields.geo_point_borne[1]),
    ];
  }
  if (geometry?.coordinates?.length === 2) {
    return [
      parseFloat(geometry.coordinates[1]),
      parseFloat(geometry.coordinates[0]),
    ];
  }
  if (fields.ylatitude !== undefined && fields.xlongitude !== undefined) {
    return [parseFloat(fields.ylatitude), parseFloat(fields.xlongitude)];
  }
  return null;
}

async function fetchNearbyStations(route, autonomy, startCoords) {
  const stationsRaw = await fetchStations();

  const stations = stationsRaw
    .map(({ fields, geometry }) => {
      const coordonnees = extractCoordinates(fields, geometry);
      return coordonnees
        ? {
            nom: fields.n_station || "Borne inconnue",
            adresse: fields.ad_station || "Adresse inconnue",
            coordonnees,
          }
        : null;
    })
    .filter(Boolean);

  console.log(`📌 Bornes disponibles : ${stations.length}`);

  const selectedStations = [];
  let lastSelectedCoord = startCoords || route[0];
  let distanceSinceLast = 0;

  for (let i = 1; i < route.length; i++) {
    const [curLon, curLat] = route[i];
    const [prevLon, prevLat] = lastSelectedCoord;

    distanceSinceLast += haversine(prevLat, prevLon, curLat, curLon);

    if (distanceSinceLast >= autonomy) {
      const nearestStations = stations
        .map((station) => ({
          station,
          distance: haversine(
            curLat,
            curLon,
            station.coordonnees[0],
            station.coordonnees[1]
          ),
        }))
        .filter(({ distance }) => distance < 15)
        .sort((a, b) => a.distance - b.distance);

      if (nearestStations.length > 0) {
        const chosenStation = nearestStations[0].station;
        if (
          selectedStations.length === 0 ||
          haversine(
            selectedStations[selectedStations.length - 1].coordonnees[0],
            selectedStations[selectedStations.length - 1].coordonnees[1],
            chosenStation.coordonnees[0],
            chosenStation.coordonnees[1]
          ) >=
            autonomy * 0.8
        ) {
          selectedStations.push(chosenStation);
          lastSelectedCoord = [curLon, curLat];
          distanceSinceLast = 0;
        }
      }
    }
  }

  console.log(`📌 Bornes retenues : ${selectedStations.length}`);
  return selectedStations;
}

module.exports = { fetchNearbyStations };
