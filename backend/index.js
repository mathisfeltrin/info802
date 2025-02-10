const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "frontend")));

// Routes
app.use("/api/stations", require("./routes/stations"));
app.use("/api/map", require("./routes/map"));
app.use("/api/vehicles", require("./routes/vehicles"));

// Route par défaut
app.get("/", (req, res) => {
  // res.send(
  //   "Bienvenue sur l'API Agrégatrice pour les véhicules électriques ! 🚗⚡"
  // );
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
