const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ LOAD ROUTES (PATH MUST BE EXACT)
const subscriptionRoutes = require("./routes/subscriptionRoutes");

// ✅ MOUNT ROUTES
app.use("/api/subscriptions", subscriptionRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Serial Subscription Backend is running");
});

// Server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
