import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware.js";
import { blockUser, checkIsFollowing, followUser, getBlockedUsers, getMutualFollowers, getMyFollowers, getMyFollowing, getMyFollowStats, getPendingRequests, getRecommendedFollowers, getUserFollowers, getUserFollowing, getUserFollowStats, unblockUser, unFollowUser, updateFollowRequest } from "../controllers/follow.controller.js";
import { validateObjectIdAndNotSelf } from "../middlewares/validateObjectIdAndNotSelf.middleware.js";

const router = Router();

router.post('/followUser', verifyToken, validateObjectIdAndNotSelf("followingId"), followUser);
router.post('/unFollowUser',verifyToken, validateObjectIdAndNotSelf("followingId") ,unFollowUser);
router.post('/updateFollowRequest',verifyToken, validateObjectIdAndNotSelf("followerId") , updateFollowRequest);
router.post('/checkIsFollowing',verifyToken, validateObjectIdAndNotSelf("followingId") , checkIsFollowing);
router.post('/blockUser',verifyToken, validateObjectIdAndNotSelf("followingId"), blockUser);
router.post('/unblockUser',verifyToken, validateObjectIdAndNotSelf("userId") , unblockUser);

router.get('/getMyFollowStats',verifyToken,getMyFollowStats);
router.get('/getUserFollowers/:userId',verifyToken,validateObjectIdAndNotSelf("userId") , getUserFollowers);
router.get('/getUserFollowing/:userId',verifyToken,validateObjectIdAndNotSelf("userId") , getUserFollowing);

router.get('/getMyFollowing',verifyToken ,getMyFollowing);
router.get('/getMyFollowers',verifyToken ,getMyFollowers);
router.get('/getPendingRequests',verifyToken ,getPendingRequests);
router.get('/getBlockedUsers',verifyToken ,getBlockedUsers);
router.get('/getRecommendedFollowers',verifyToken ,getRecommendedFollowers);

router.get('/getMutualFollowers/:userId',verifyToken,validateObjectIdAndNotSelf("userId") ,getMutualFollowers);

//Count of Followers, Following, PendingFollowers, PendingFollowing, Blocked
router.get('/getUserFollowStats/:userId',verifyToken,validateObjectIdAndNotSelf("userId") ,getUserFollowStats);

export default router;