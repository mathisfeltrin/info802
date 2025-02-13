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

// 🔍 Récupérer et afficher l'itinéraire
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

    const { route, startCoords, endCoords, chargingStations } =
      await response.json();
    updateMap(
      route,
      startCoords,
      endCoords,
      chargingStations,
      startCity,
      endCity
    );
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
}

// 📍 Mise à jour de la carte avec itinéraire et bornes
function updateMap(
  route,
  startCoords,
  endCoords,
  chargingStations,
  startCity,
  endCity
) {
  // Supprimer toutes les anciennes couches sauf le fond de carte
  map.eachLayer((layer) => {
    if (!layer._url) map.removeLayer(layer);
  });

  // Afficher l'itinéraire
  const routeLayer = L.geoJSON(
    { type: "LineString", coordinates: route },
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
    if (index !== 0) {
      console.log(
        `📌 Borne ${index} : ${station.nom} - Coordonnées : ${station.coordonnees}`
      );
      const [lat, lon] = station.coordonnees;

      L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: "assets/charging-station.png",
          iconSize: [32, 32],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>${station.nom}</b><br>${station.adresse}`);
    }
  });

  // Ajuster la vue sur l'itinéraire
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

    listItem.addEventListener("click", () => updateAutonomy(vehicle));

    vehicleContainer.appendChild(listItem);
  });
}

// ⚡ Mettre à jour l'autonomie selon le véhicule sélectionné
function updateAutonomy(vehicle) {
  console.log("Autonomie avant :", autonomy);
  autonomy = vehicle.range.chargetrip_range.worst;
  console.log("Autonomie après :", autonomy);
}
