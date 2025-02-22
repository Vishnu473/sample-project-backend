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

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET_TOKEN
    );

    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid accessToken");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export { verifyToken };
