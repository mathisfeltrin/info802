const axios = require("axios");
require("dotenv").config();

const fetchStations = async () => {
  try {
    const response = await axios.get(
      "https://opendata.reseaux-energies.fr/api/records/1.0/search/",
      {
        params: {
          dataset: "bornes-irve",
          rows: 10, // Nombre de résultats à récupérer
        },
      }
    );
    return response.data.records.map((record) => record.fields);
  } catch (error) {
    throw new Error("Impossible de récupérer les bornes : " + error.message);
  }
};

module.exports = fetchStations;
