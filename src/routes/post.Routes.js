import { Router } from "express";
import { addPost, deletePost, fetchPostsOnSearch, getAllMyPosts, getPostDetail, getUserPosts, updatePost } from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/token.middleware.js";

const router = Router();

router.get("/get-all",verifyToken,getAllMyPosts);
router.post("/add-post",verifyToken,addPost);
router.post("/update-post/:id",verifyToken,updatePost);
router.post("/delete-post/:id",verifyToken,deletePost);
router.post("/get-user-posts/:userId",verifyToken,getUserPosts);
router.get("/get-post-detail/:postId",verifyToken,getPostDetail);
router.get("/search-posts",verifyToken,fetchPostsOnSearch);
export default router;