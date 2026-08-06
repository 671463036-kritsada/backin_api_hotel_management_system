require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
require("./config/db");

const app = express();
const roomRoutes = require("./routes/room_routes");
const historyRoutes = require("./routes/history_routes");
const furnitureRoutes = require("./routes/furniture_routes");
const bookingsRoutes = require("./routes/bookings_routes");
const checkinRoutes = require("./routes/checkin_routes");
const houskeeperRoutes = require("./routes/houskeeper_routes");
const houskeeperIssuesRoutes = require("./routes/houskeeper_issues_routes");


const authRoutes = require("./routes/auth_routes");
const userRoutes = require("./routes/user_routes");

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/uploads", express.static(path.join(__dirname, "./uploads")));

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

// domain ที่อนุญาติ
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  );
  next();
});

app.use("/api/uploads", express.static(path.join(__dirname, "./uploads")));
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingsRoutes);
// alias used by admin frontend
app.use("/api/booking-list", bookingsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/furniture", furnitureRoutes);
app.use("/api/bookings-form", bookingsRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/housekeeper", houskeeperRoutes);
app.use("/api/housekeeper/issues", houskeeperIssuesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); 

// Debug: list mounted routes (useful when route not found)
app.get("/__debug/routes", (req, res) => {
  try {
    const routes = [];
    if (app._router && app._router.stack) {
      app._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods)
            .join(",")
            .toUpperCase();
          routes.push({ path: layer.route.path, methods });
        } else if (layer.name === "router" && layer.regexp) {
          routes.push({ path: layer.regexp.toString() });
        }
      });
    }
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
