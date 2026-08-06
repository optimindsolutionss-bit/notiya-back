require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const negociosRoutes = require("./routes/negocios.routes");
const pantallaRoutes = require("./routes/pantalla.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/negocios", negociosRoutes);
app.use("/api/pantalla", pantallaRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor NotiYa corriendo en http://localhost:${PORT}`);
});