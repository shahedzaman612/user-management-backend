const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Basic home route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(
    express.static(
      path.join(__dirname, "..", "user-management-frontend", "build")
    )
  );

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(
        __dirname,
        "..",
        "user-management-frontend",
        "build",
        "index.html"
      )
    );
  });
} else {
  // Basic home route for testing in development
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
