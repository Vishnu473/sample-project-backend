import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());




import userRoutes from "./routes/user.Routes.js";
import postRoutes from "./routes/post.Routes.js";

app.use("/api/v1/users",userRoutes);
app.use("/api/v1/posts",postRoutes);


app.use((err, req, res, next) => {
  console.error("Error Middleware:", err); // Debugging

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
