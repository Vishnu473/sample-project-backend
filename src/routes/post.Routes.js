import { Router } from "express";
import { addPost, getAllPosts } from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/token.middleware.js";

const router = Router();

router.get("/getAll",verifyToken,getAllPosts);
router.post("/add-post",verifyToken,addPost)

export default router;