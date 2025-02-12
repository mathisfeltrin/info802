const express = require("express");
const router = express.Router();
const fetchStations = require("../services/fetchStations");

router.get("/", async (req, res) => {
  try {
    const stations = await fetchStations();
    res.json(stations);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Erreur lors de la récupération des bornes",
        details: error.message,
      });
  }
});

module.exports = router;
