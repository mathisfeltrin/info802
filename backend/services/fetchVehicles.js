const axios = require("axios");
require("dotenv").config();

const fetchVehicles = async () => {
  const query = `
    query {
      vehicleList(
        page: 0, 
        size: 50, 
        search: "" 
      ) {
        id
        naming {
          make
          model
          chargetrip_version
        }
        range {
          chargetrip_range {
            worst
          }
        }
        connectors {
          time
        }
        media {
          image {
            thumbnail_url
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      process.env.CHARGETRIP_API_URL,
      { query }, // Axios envoie le body directement sous forme d'objet JSON
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CHARGETRIP_CLIENT_ID,
          "x-app-id": process.env.CHARGETRIP_APP_ID,
        },
      }
    );

    return response.data.data.vehicleList;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données :",
      error.message
    );
    throw error;
  }
};

module.exports = fetchVehicles;
