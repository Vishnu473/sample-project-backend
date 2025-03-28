import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const validateObjectIdAndNotSelf  = (idField) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Unauthorized!"));
  }

  const idValue = req.body[idField] || req.params[idField];

  if (!mongoose.isValidObjectId(idValue)) {
    return next(new ApiError(400, `Invalid ${idField} provided.`));
  }

  if (idValue === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot perform this action on yourself."));
  }

  next();
};
