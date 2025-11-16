import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./api/routes.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// apply routes
app.use("/v1", router);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT} (Localhost: http://localhost:${PORT})`);
});

export default app;
