import jwt from "jsonwebtoken";
import { asyncHandler } from "../services/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";

const verifyToken = asyncHandler(async (req, resizeBy, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers(Authorization)?.accessToken.replace("Bearer ", "");

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
