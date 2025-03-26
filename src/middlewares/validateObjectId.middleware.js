import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

export const validateObjectId = (idField) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized!"));
  }

  const idValue = req.body[idField] || req.params[idField];

  if (!mongoose.isValidObjectId(idValue)) {
    return next(new ApiError(400, `Invalid ${idField} provided.`));
  }

  next();
};
