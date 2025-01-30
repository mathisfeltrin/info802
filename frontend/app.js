// Initialisation de la carte Leaflet
const map = L.map("map").setView([48.8566, 2.3522], 6); // Carte centrée sur la France

// Ajouter une couche OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Fonction pour récupérer et afficher un itinéraire entre deux villes
document.getElementById("routeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const startCity = document.getElementById("startCity").value;
  const endCity = document.getElementById("endCity").value;

  try {
    const response = await fetch(
      `http://localhost:3001/api/map/route?startCity=${encodeURIComponent(
        startCity
      )}&endCity=${encodeURIComponent(endCity)}`
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération de l'itinéraire.");

    const { route, startCoords, endCoords } = await response.json();

    L.geoJSON(route, { color: "blue" }).addTo(map);
    L.marker([startCoords.lat, startCoords.lon])
      .addTo(map)
      .bindPopup(`Départ : ${startCity}`);
    L.marker([endCoords.lat, endCoords.lon])
      .addTo(map)
      .bindPopup(`Arrivée : ${endCity}`);

    const bounds = L.geoJSON(route).getBounds();
    map.fitBounds(bounds);
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
});

// Fonction pour récupérer les bornes de recharge
async function fetchStations() {
  try {
    const response = await fetch("http://localhost:3001/api/stations"); // API Backend
    const stations = await response.json();

    console.log("Bornes récupérées :", stations); // Vérifie si on reçoit bien les bornes

    // Ajouter les bornes sur la carte avec des icônes personnalisées
    stations.forEach((station) => {
      // if (station.coordonnees) {
      const lat = station.ylatitude;
      const lon = station.xlongitude;
      console.log("Ajout de la borne sur la carte :", lat, lon); // Vérifie les coordonnées

      L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: "assets/charging-station.png", // Icône personnalisée
          iconSize: [32, 32],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>${station.nom}</b><br>${station.adresse}`);
      // }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stations :", error);
  }
}

const proxyUrl = "http://localhost:3001/api/vehicles/image?url=";

// Fonction pour récupérer les véhicules électriques
async function fetchVehicles() {
  const vehicleContainer = document.getElementById("vehicleContainer");
  vehicleContainer.innerHTML = "<p>Chargement des véhicules...</p>";

  try {
    const response = await fetch("http://localhost:3001/api/vehicles");
    const vehicles = await response.json();

    if (!vehicles.length) {
      vehicleContainer.innerHTML = "<p>Aucun véhicule trouvé.</p>";
      return;
    }

    // Générer une liste ul > li pour afficher les données
    const list = document.createElement("ul");
    list.classList.add("vehicle-list");

    // vehicleList.innerHTML = ""; // Nettoyer la liste avant d'ajouter des véhicules

    vehicles.forEach((vehicle) => {
      const imageUrl =
        proxyUrl + encodeURIComponent(vehicle.media.image.thumbnail_url);

      const listItem = document.createElement("li");
      listItem.classList.add("vehicle-item");

      listItem.innerHTML = `
          <img src="${imageUrl}" alt="${
        vehicle.naming.model
      }" class="vehicle-image">
          <div class="vehicle-details">
            <strong>${vehicle.naming.make} ${vehicle.naming.model}</strong><br>
            Version : ${vehicle.naming.chargetrip_version || "N/A"}<br>
            Autonomie (km) : ${
              vehicle.range.chargetrip_range.worst || "N/A"
            }<br>
            Temps de charge : ${vehicle.connectors[0]?.time || "N/A"} min
          </div>
        `;

      list.appendChild(listItem);
    });

    vehicleContainer.innerHTML = "";
    vehicleContainer.appendChild(list);
  } catch (error) {
    console.error("Erreur lors de la récupération des véhicules :", error);
    vehicleContainer.innerHTML =
      "<p>Une erreur est survenue lors du chargement des véhicules.</p>";
  }
}

// Charger les données au démarrage
fetchStations();
fetchVehicles();
