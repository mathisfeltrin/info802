const express = require("express");
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

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
