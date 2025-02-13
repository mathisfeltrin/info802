const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/stations", require("./routes/stations"));
app.use("/api/map", require("./routes/map"));
app.use("/api/vehicles", require("./routes/vehicles"));

// Route par défaut
// app.get("/", (req, res) => {});

// Proxy pour récupérer l'itinéraire via OpenRouteService
app.get("/api/proxy-route", async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Paramètres start et end requis." });
  }

  try {
    const response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: process.env.OPENROUTE_API_KEY,
          start,
          end,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Erreur OpenRouteService :", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Erreur OpenRouteService" });
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
