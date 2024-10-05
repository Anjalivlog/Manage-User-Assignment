const express = require("express");
const { connectDb } = require("./database/db");
require("dotenv").config();
const cors = require("cors");
const router = require("./routers/userRoutes");
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;
const MODE = process.env.NODE_ENV || "production";

connectDb();

app.use(router);

app.listen(PORT, () => {
  console.log(`App is running at  http://localhost:${PORT} in ${MODE} mode`);
});
