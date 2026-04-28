require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const remedyRoutes = require("./routes/remedy.routes");
const ratingRoutes = require("./routes/rating.routes");
const categoryRoutes = require("./routes/category.routes");
const savedRemedyRoutes = require("./routes/savedRemedy.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ message: "Home Remedies API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/remedies", remedyRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/saved-remedies", savedRemedyRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
