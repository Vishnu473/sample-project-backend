import { uploadFiles } from "../middlewares/multer.middleware.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../utils/cloudinaryConfig.js";

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
    url: fileUrls,
    file: req.files,
    message: `${req.fileCategory}s uploaded successfully`,
  });
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const { publicIds } = req.body;

  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    throw new ApiError("400", "Public IDs are required!");
  }

  const result = await cloudinary.api.delete_resources(publicIds);

  const failedDeletions = Object.entries(result.deleted).filter(
    ([, status]) => status !== "deleted"
  );

  if (failedDeletions.length > 0) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { failedDeletions },
          "Some media could not be deleted."
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Media deleted successfully"));
});