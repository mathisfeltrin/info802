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
  const autonomy = 300; // TODO: récupérer l'autonomie du véhicule

  try {
    const response = await fetch(
      `http://localhost:3001/api/map/route?startCity=${encodeURIComponent(
        startCity
      )}&endCity=${encodeURIComponent(endCity)}&autonomy=${autonomy}`
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération de l'itinéraire.");

    const { route, startCoords, endCoords, chargingStations } =
      await response.json();

    // Supprimer les anciennes couches (itinéraires et bornes précédentes)
    map.eachLayer((layer) => {
      if (!!layer.toGeoJSON || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // 1️⃣ Afficher l'itinéraire
    const routeLayer = L.geoJSON(
      {
        type: "LineString",
        coordinates: route,
      },
      { color: "blue" }
    ).addTo(map);

    // 2️⃣ Ajouter les marqueurs de départ et d’arrivée
    L.marker([startCoords[1], startCoords[0]])
      .addTo(map)
      .bindPopup(`Départ : ${startCity}`);

    L.marker([endCoords[1], endCoords[0]])
      .addTo(map)
      .bindPopup(`Arrivée : ${endCity}`);

    // 3️⃣ Afficher les bornes nécessaires
    console.log("🔍 Liste des bornes envoyées au frontend :");
    chargingStations.forEach((station, index) => {
      if (index != 0) {
        console.log(
          `📌 Borne ${index + 1} : ${station.nom} - Coordonnées : ${
            station.coordonnees
          }`
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

    // 4️⃣ Ajuster la carte à l'itinéraire
    map.fitBounds(routeLayer.getBounds());

    // L.geoJSON(route, { color: "blue" }).addTo(map);
    // L.marker([startCoords.lat, startCoords.lon])
    //   .addTo(map)
    //   .bindPopup(`Départ : ${startCity}`);
    // L.marker([endCoords.lat, endCoords.lon])
    //   .addTo(map)
    //   .bindPopup(`Arrivée : ${endCity}`);

    // const bounds = L.geoJSON(route).getBounds();
    // map.fitBounds(bounds);
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
});

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
fetchVehicles();
