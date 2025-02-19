import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//create app
const app = express();

//use required middlewares

//cors - allow origin urls
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//accept json objects from req-body
app.use(express.json({ limit: "16kb" }));

//allow url-encoded when passing data through url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//use cookies to pass tokens securely
app.use(cookieParser());

export { app };
