import { uploadFiles } from "../middlewares/multer.middleware.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadSingleFile = asyncHandler((req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  res.json({
    success: true,
    url: req.file.path,
    file: req.file,
    message: `${req.fileCategory} uploaded successfully`,
  });
});

export const uploadMultipleFiles = asyncHandler((req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const fileUrls = req.files.map((file) => file.path);

  res.json({
    success: true,
    urls: fileUrls,
    files: req.files,
    message: `${req.fileCategory}s uploaded successfully`,
  });
});
