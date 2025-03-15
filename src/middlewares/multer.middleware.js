import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinaryConfig.js";
import path from "path";

const allowedImageFormats = ["jpg", "jpeg", "png", "gif", "webp"];
const allowedVideoFormats = ["mp4", "mov", "avi", "mkv"];
const MAX_FILES = 10;

// Separate storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "images",
    allowed_formats: allowedImageFormats,
  },
});

// Separate storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "videos",
    allowed_formats: allowedVideoFormats,
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (
    (req.fileCategory === "image" && allowedImageFormats.includes(ext)) ||
    (req.fileCategory === "video" && allowedVideoFormats.includes(ext))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format"));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for images
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for videos
});


const uploadFiles = (fileType) => (req, res, next) => {
  if (req.params.type === "image") {
    req.fileCategory = "image";
    return fileType === "single"
      ? uploadImage.single("file")(req, res, next)
      : uploadImage.array("files", MAX_FILES)(req, res, next);
  } else if (req.params.type === "video") {
    req.fileCategory = "video";
    return fileType === "single"
      ? uploadVideo.single("file")(req, res, next)
      : uploadVideo.array("files", MAX_FILES)(req, res, next);
  } else {
    return res.status(400).json({ error: "Invalid file type. Use 'image' or 'video'" });
  }
};

export { uploadFiles };