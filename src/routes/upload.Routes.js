import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware.js";
import { uploadMultipleFiles, uploadSingleFile } from "../controllers/upload.controller.js";
import { uploadFiles } from "../middlewares/multer.middleware.js";

const router = Router();

//protected-route
router.post("/single/:type", verifyToken, uploadFiles("single"), uploadSingleFile);
router.post("/multiple/:type", verifyToken, uploadFiles("multiple"), uploadMultipleFiles);

export default router;