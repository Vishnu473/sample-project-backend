import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware.js";
import { deleteMedia, uploadMultipleFiles, uploadSingleFile } from "../controllers/upload.controller.js";
import { uploadFiles } from "../middlewares/multer.middleware.js";

const router = Router();

//protected-route
router.post("/single/:type", verifyToken, uploadFiles("single"), uploadSingleFile);
router.post("/multiple/:type", verifyToken, uploadFiles("multiple"), uploadMultipleFiles);
router.delete("/delete/media",verifyToken,deleteMedia);
export default router;