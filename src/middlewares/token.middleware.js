import jwt from "jsonwebtoken";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const verifyToken = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers.authorization?.accessToken.replace("Bearer ", "");
      
    if (!accessToken) {
      throw new ApiError(401, "UnAuthorized request");
    }

    try {
      const decodedToken = jwt.verify(
        accessToken,
        process.env.ACCESS_SECRET_TOKEN
      );

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Invalid accessToken");
      }

      req.user = user;
      next();
    } catch (error) {
      // If token expired, try refreshing
      if (error.name === "TokenExpiredError") {
        console.log("Access token expired, attempting to refresh...");

        const refreshResponse = await fetch(
          `${process.env.BACKEND_URL}/api/v1/user/refresh-token`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok) {
          // Set new token in request and proceed
          accessToken = refreshData.data.accessToken;
          req.cookies.accessToken = accessToken; // Updating token for this request
          return verifyToken(req, res, next); // Retry verification with the new token
        } else {
          throw new ApiError(401, "Session expired, please log in again");
        }
      } else {
        throw new ApiError(401, "Invalid access token");
      }
    }
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export { verifyToken };
