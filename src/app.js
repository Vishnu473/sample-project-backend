import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());


import userRoutes from "./routes/user.Routes.js";
import postRoutes from "./routes/post.Routes.js";

app.use("/api/v1/users",userRoutes);
app.use("/api/v1/posts",postRoutes);

export { app };
