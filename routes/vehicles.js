const express = require("express");
const axios = require("axios");
const router = express.Router();
const fetchVehicles = require("../services/fetchVehicles");

router.get("/", async (req, res) => {
  try {
    const vehicles = await fetchVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des véhicules",
      details: error.message,
    });
  }
});

router.get("/image", async (req, res) => {
  const { url } = req.query; // Récupère l'URL de l'image en paramètre

  if (!url) {
    return res.status(400).json({ error: "URL requise" });
  }

  try {
    // Faire une requête vers l'URL de l'image
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Définir le type de contenu pour l'image
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Erreur proxy image :", error.message);
    res.status(500).json({ error: "Impossible de récupérer l'image" });
  }
});

module.exports = router;
