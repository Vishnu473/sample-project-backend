import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware.js";
import {
  getAllUsers,
  changeCurrentPassword,
  loginUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  updatePrivacySettings
} from "../controllers/user.controller.js";

const router = Router();

router.get("/all", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);

//protected routes
router.post("/logout", verifyToken, logOutUser);
router.post("/change-password", verifyToken, changeCurrentPassword);
router.post("/update-profile",verifyToken,updateUserProfile);
router.post("/get-user-profile",verifyToken,getUserProfile);
router.post("/get-user-profile/:id",verifyToken,getUserProfile);
router.post("/search-users",verifyToken,searchUsers);
router.post("/refresh-token",verifyToken, refreshAccessToken);
router.post("/updatePrivacySettings",verifyToken,updatePrivacySettings);

export default router;
