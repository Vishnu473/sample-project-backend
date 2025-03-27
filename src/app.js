import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const allowedOrigins = ["https://followave-vishnu.netlify.app","https://vishnu473.github.io","http://localhost:5173"]
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
import uploadRoutes from "./routes/upload.Routes.js";
import followRoutes from "./routes/follow.Routes.js";

app.use("/api/v1/users",userRoutes);
app.use("/api/v1/posts",postRoutes);
app.use("/api/v1/upload",uploadRoutes);
app.use("/api/v1/follow",followRoutes);


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
