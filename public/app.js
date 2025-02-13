document.addEventListener("DOMContentLoaded", () => {
  initMap();
  fetchVehicles();
});

let autonomy = 300; // Autonomie par défaut
let map;

// 🗺️ Initialisation de la carte Leaflet
function initMap() {
  map = L.map("map").setView([48.8566, 2.3522], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  document.getElementById("routeForm").addEventListener("submit", fetchRoute);
}

// 🔍 Récupérer et afficher l'itinéraire en passant par toutes les bornes
async function fetchRoute(event) {
  event.preventDefault();

  const startCity = document.getElementById("startCity").value;
  const endCity = document.getElementById("endCity").value;

  try {
    const response = await fetch(
      `https://electrictravel.azurewebsites.net/api/map/route?startCity=${encodeURIComponent(
        startCity
      )}&endCity=${encodeURIComponent(endCity)}&autonomy=${autonomy}`
    );

    if (!response.ok)
      throw new Error("Erreur lors de la récupération de l'itinéraire.");

    let { route, startCoords, endCoords, chargingStations } =
      await response.json();

    if (chargingStations.length > 1) {
      chargingStations.shift(); // Supprime la première borne
    }

    if (chargingStations.length > 0) {
      console.log("📍 Bornes sélectionnées :", chargingStations);
      const fullRoute = await getMultiSegmentRoute(
        startCoords,
        endCoords,
        chargingStations
      );
      updateMap(
        fullRoute,
        startCoords,
        endCoords,
        chargingStations,
        startCity,
        endCity
      );
    } else {
      console.warn(
        "Aucune borne trouvée sur le trajet, affichage du trajet direct."
      );
      updateMap(route, startCoords, endCoords, [], startCity, endCity);
    }
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
}

// 🗺️ Fonction pour générer l’itinéraire en passant par toutes les bornes
async function getMultiSegmentRoute(startCoords, endCoords, chargingStations) {
  const fullRoute = [];
  let previousPoint = startCoords;

  for (const station of chargingStations) {
    const stationCoords = [station.coordonnees[1], station.coordonnees[0]]; // Leaflet utilise [lat, lon]
    const segmentRoute = await fetchSegmentRoute(previousPoint, stationCoords);

    if (segmentRoute.length > 0) {
      fullRoute.push(...segmentRoute);
    }
    previousPoint = stationCoords;
  }

  // Dernière portion entre la dernière borne et l’arrivée
  const finalSegment = await fetchSegmentRoute(previousPoint, endCoords);
  if (finalSegment.length > 0) {
    fullRoute.push(...finalSegment);
  }

  return fullRoute;
}

// 🌍 Fonction pour récupérer l’itinéraire entre deux points
async function fetchSegmentRoute(start, end) {
  try {
    const response = await fetch(
      `https://electrictravel.azurewebsites.net/api/proxy-route?start=${start.join(
        ","
      )}&end=${end.join(",")}`
    );
    if (!response.ok)
      throw new Error(
        "Erreur lors de la récupération d’un segment d’itinéraire."
      );

    const data = await response.json();
    return data.features[0]?.geometry?.coordinates || [];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération d’un segment d’itinéraire :",
      error
    );
    return [];
  }
}

// 📍 Mise à jour de la carte avec un itinéraire passant par les bornes
function updateMap(
  route,
  startCoords,
  endCoords,
  chargingStations,
  startCity,
  endCity
) {
  // Nettoyage des anciennes couches sauf le fond de carte
  map.eachLayer((layer) => {
    if (!layer._url) map.removeLayer(layer);
  });

  // Affichage du trajet avec toutes les bornes
  const routeLayer = L.polyline(
    route.map((coord) => [coord[1], coord[0]]),
    { color: "blue" }
  ).addTo(map);

  // Ajouter les marqueurs de départ et d'arrivée
  L.marker([startCoords[1], startCoords[0]])
    .addTo(map)
    .bindPopup(`Départ : ${startCity}`);
  L.marker([endCoords[1], endCoords[0]])
    .addTo(map)
    .bindPopup(`Arrivée : ${endCity}`);

  // Ajouter les bornes de recharge
  chargingStations.forEach((station, index) => {
    const [lat, lon] = station.coordonnees;

    L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: "assets/charging-station.png",
        iconSize: [32, 32],
      }),
    })
      .addTo(map)
      .bindPopup(`<b>${station.nom}</b><br>${station.adresse}`);
  });

  // Ajuster la carte à l'itinéraire
  map.fitBounds(routeLayer.getBounds());
}

// 🚗 Récupérer et afficher les véhicules électriques
async function fetchVehicles() {
  const vehicleContainer = document.getElementById("vehicleList");
  vehicleContainer.innerHTML = "<p>Chargement des véhicules...</p>";

  try {
    const response = await fetch(
      "https://electrictravel.azurewebsites.net/api/vehicles"
    );
    const vehicles = await response.json();

    if (!vehicles.length) {
      vehicleContainer.innerHTML = "<p>Aucun véhicule trouvé.</p>";
      return;
    }

    displayVehicleList(vehicles);
  } catch (error) {
    console.error("Erreur lors de la récupération des véhicules :", error);
    vehicleContainer.innerHTML = "<p>Une erreur est survenue.</p>";
  }
}

// Variable globale pour suivre l'élément sélectionné
let selectedVehicleElement = null;

// 🚘 Afficher la liste des véhicules
function displayVehicleList(vehicles) {
  const vehicleContainer = document.getElementById("vehicleList");
  vehicleContainer.innerHTML = "";

  vehicles.forEach((vehicle) => {
    const imageUrl = `https://electrictravel.azurewebsites.net/api/vehicles/image?url=${encodeURIComponent(
      vehicle.media.image.thumbnail_url
    )}`;

    const listItem = document.createElement("li");
    listItem.classList.add("vehicle-item");

    listItem.innerHTML = `
            <img src="${imageUrl}" alt="${
      vehicle.naming.model
    }" class="vehicle-image">
            <div class="vehicle-details">
                <strong>${vehicle.naming.make} ${
      vehicle.naming.model
    }</strong><br>
                Version : ${vehicle.naming.chargetrip_version || "N/A"}<br>
                Autonomie (km) : ${
                  vehicle.range.chargetrip_range.worst || "N/A"
                }<br>
                Temps de charge : ${vehicle.connectors[0]?.time || "N/A"} min
            </div>
        `;

    // 🎯 Ajouter un événement au clic
    listItem.addEventListener("click", () => {
      updateAutonomy(vehicle, listItem);
    });

    vehicleContainer.appendChild(listItem);
  });
}

// ⚡ Mettre à jour l'autonomie et le visuel du véhicule sélectionné
function updateAutonomy(vehicle, listItem) {
  console.log("Autonomie avant :", autonomy);
  autonomy = vehicle.range.chargetrip_range.worst;
  console.log("Autonomie après :", autonomy);

  // 🔥 Réinitialiser l'ancien véhicule sélectionné
  if (selectedVehicleElement) {
    selectedVehicleElement.classList.remove("selected-vehicle");
  }

  // 🎯 Ajouter la classe au nouvel élément sélectionné
  listItem.classList.add("selected-vehicle");
  selectedVehicleElement = listItem;
}
