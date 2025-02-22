import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware.js";
import { getAllUsers,changeCurrentPassword, loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";

const router = Router();

router.get('/all',getAllUsers);
router.post('/register',registerUser);
router.post('/login',loginUser);

//protected routes
router.post('/logout',verifyToken,logOutUser);
router.post('/change-password',verifyToken,changeCurrentPassword);


export default router