const axios = require("axios");

const fetchMapData = async () => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: "Paris",
          format: "json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      "Impossible de récupérer les données de la carte : " + error.message
    );
  }
};

module.exports = fetchMapData;
