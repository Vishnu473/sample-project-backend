import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware";
import { changeCurrentPassword, loginUser, logOutUser, registerUser } from "../controllers/user.controller";


const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

//protected routes
router.route('/logOut').post(logOutUser);
router.route('/change-password').post(changeCurrentPassword);


export default router