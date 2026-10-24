
import express from "express";
import connnectDB from "./DB/mongose.connect.js";
import router from "./src/users/employee.router.js";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./middleware/errorhandle.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;

// Parse JSON request bodies
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log({
    method: req.method,
    path: req.path,
    time: new Date().toISOString(),
  });

  next();
});

// CORS: allow your Next.js frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Register routes
app.use("/v1", router);

// Error handler must come after routes
app.use(errorHandler);

const startServer = async () => {
  try {
    await connnectDB();

    app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  }
};

startServer();
