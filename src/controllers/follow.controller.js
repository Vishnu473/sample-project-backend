import mongoose from "mongoose";
import { Follow } from "../models/follow.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../services/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

export const followUser = asyncHandler(async (req, res) => {
  const { followingId } = req.body;

  if (req.user?._id.toString() === followingId.toString()) {
    throw new ApiError(400, "You cannot follow yourself!");
  }

  const followingUser = await User.findById(followingId).select("followersPrivacy");
  if (!followingUser) throw new ApiError(404, "User not found!");

  const alreadyFollowing = await Follow.findOne({
    follower: req.user?._id,
    following: followingId,
  });

  if (alreadyFollowing) {
    throw new ApiError(400, `You are already following this user`);
  }

  const isPrivate = followingUser.followersPrivacy === "private";
  const followStatus = isPrivate ? "pending" : "accepted";

  const newFollow = await Follow.create({
    follower: req.user._id,
    following: followingId,
    status: followStatus,
  });

  const message = isPrivate
    ? "Follow request sent."
    : "You are now following this user.";

  return res.status(201).json(new ApiResponse(201, newFollow, message));
});

export const acceptFollowRequest = asyncHandler(async (req, res) => {
  const { followerId } = req.body;
  
  const followRequest = await Follow.findOneAndUpdate(
    { follower: followerId, following: req.user._id, status: "pending" }, //filter
    { status: "accepted" }, //update field
    { new: true }
  );

  if (!followRequest) throw new ApiError(404, "No pending follow request found.");

  return res.status(200).json(new ApiResponse(200, followRequest, "Follow request accepted."));
});

export const unFollowUser = asyncHandler(async (req, res) => {
  const { followingId } = req.body;
  
  const isFollowing = await Follow.findOne({
    follower: req.user._id,
    following: followingId,
    blocked: false, // Prevent unfollowing if the user is blocked
  });

  if (!isFollowing) throw new ApiError(400, "You are not following this user.");

  await Follow.findOneAndDelete({ follower: req.user._id, following: followingId });

  return res.status(200).json(new ApiResponse(200, null, "Unfollowed successfully."));
});

export const getUserFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("followersPrivacy");
  if (!user) throw new ApiError(404, "User not found.");

  if (user.followersPrivacy === "private" && req.user?._id.toString() !== userId) {
    throw new ApiError(403, "You do not have permission to view this user's followers.");
  }

  if (user.followersPrivacy === "followers") {
    const isFollowing = await Follow.exists({ follower: req.user?._id, following: userId, status: "accepted" });
    if (!isFollowing) {
      throw new ApiError(403, "Only followers can see this user's followers.");
    }
  }

  const followers = await Follow.find({ following: userId, blocked: false, status: "accepted" })
    .populate("follower", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { followers }, "Followers fetched successfully."));
});

export const getUserFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID.");

  const user = await User.findById(userId).select("followingPrivacy");
  if (!user) throw new ApiError(404, "User not found.");

  if (user.followingPrivacy === "private" && req.user?._id.toString() !== userId) {
    throw new ApiError(403, "You do not have permission to view this user's following list.");
  }

  if (user.followingPrivacy === "followers") {
    const isFollowing = await Follow.exists({ follower: req.user?._id, following: userId, status: "accepted" });
    if (!isFollowing) {
      throw new ApiError(403, "Only followers can see this user's following list.");
    }
  }

  const following = await Follow.find({ follower: userId, blocked: false, status: "accepted" })
    .populate("following", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { following }, "Following list fetched successfully."));
});

export const getMyFollowing = asyncHandler(async (req, res) => {
  const following = await Follow.find({ follower: req.user._id, blocked: false,status: "accepted" })
    .populate("following", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { following }, "Your following list."));
});

export const getMyFollowers = asyncHandler(async (req, res) => {
  const followers = await Follow.find({ following: req.user._id, status:"accepted", blocked:false })
    .populate("follower", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { followers }, "Your followers list."));
});

export const getUserFollowStats  = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized!");
  }

  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, "User not found!");
  }

  const userObjectId = new mongoose.mongo.ObjectId(userId);

  const counts = await Follow.aggregate([
    {
      $match: {
        $or: [{ following: userObjectId }, { follower: userObjectId }]
      }
    },
    {
      $facet: {
        followers: [{ $match: { following: userObjectId, status:"accepted", blocked: false } }, { $count: "count" }],
        following: [{ $match: { follower: userObjectId, status:"accepted", blocked: false } }, { $count: "count" }],
        pendingFollowers: [{ $match: { following: userObjectId, status: "pending", blocked: false } }, { $count: "count" }],
        pendingFollowing: [{ $match: { follower: userObjectId, status: "pending", blocked: false } }, { $count: "count" }],
        blockedFollowers:[{ $match: {follower: userObjectId, status: "blocked", blocked:true}},{ $count: "count" }]
      }
    }
  ]);

  // Extract counts properly
  const followerCount = counts[0].followers[0]?.count || 0;
  const followingCount = counts[0].following[0]?.count || 0;
  const pendingFollowerCount = counts[0].pendingFollowers[0]?.count || 0;
  const pendingFollowingCount = counts[0].pendingFollowing[0]?.count || 0;
  const blockedFollowercount = counts[0].blockedFollowers[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(200, 
      { 
        followers: followerCount, 
        following: followingCount,
        pendingFollowers: pendingFollowerCount,
        pendingFollowing: pendingFollowingCount,
        blockedUsers: blockedFollowercount
      }, "Fetched Successfully")
  );
});

export const updateFollowRequest = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized!");
  }

  const { followerId, action } = req.body;

  if (!mongoose.isValidObjectId(followerId)) {
    throw new ApiError(400, "Invalid follower ID");
  }

  const followRequest = await Follow.findOne({
    following: req.user._id,
    follower: followerId,
    status: "pending"
  });

  if (!followRequest) {
    throw new ApiError(404, "Follow request not found!");
  }

  if (action === "approve") {
    followRequest.status = "accepted";
    await followRequest.save();
    return res.status(200).json(new ApiResponse(200, {}, "Follow request approved!"));
  }

  if (action === "reject") {
    await Follow.deleteOne({ _id: followRequest._id });
    return res.status(200).json(new ApiResponse(200, {}, "Follow request rejected!"));
  }

  throw new ApiError(400, "Invalid action!");
});

//Requests Received for Follow
export const getPendingRequests = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized!");
  }

  const pendingRequests = await Follow.find({ 
      following: req.user._id, 
      status: "pending", 
      blocked: false 
    })
    .populate("follower", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { pendingRequests }, "Pending follow requests fetched."));
});

//Requests sent for Follow
export const checkIsFollowing = asyncHandler(async(req,res) =>{
  const { followingId } = req.body;

  const userExists = await User.exists({ _id: followingId });
  if (!userExists) {
    throw new ApiError(404, "User not found!");
  }

  const followRecord = await Follow.findOne({ follower: req.user?._id, following: followingId, blocked:false });
  
  let followStatus = "not_following"; // Default

  if (followRecord) {
    followStatus = followRecord.status; // "accepted" or "pending"
  }

  return res.status(200).
  json(new ApiResponse(200,{followStatus},"Follow status checked successfully."))
});

export const getMutualFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, "User not found!");
  }

  const mutualFollowers = await Follow.aggregate([
    {
      $match: {
        following: req.user._id, // People who follow the logged-in user
        status: "accepted",
        blocked: false,
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "follower",
        foreignField: "follower",
        as: "mutual",
      },
    },
    {
      $unwind: "$mutual",
    },
    {
      $match: {
        "mutual.following": new mongoose.Types.ObjectId(userId),
        "mutual.status": "accepted",
        "mutual.blocked": false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: "$user._id",
        username: "$user.username",
        profilePic: "$user.profilePic",
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { mutualFollowers }, "Mutual followers list."));
});

export const getRecommendedFollowers = asyncHandler(async (req, res) => {
  const recommendedUsers = await Follow.aggregate([
    {
      $match: {
        follower: req.user._id, // Logged-in user’s following
        status: "accepted",
        blocked: false,
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "following",
        foreignField: "follower",
        as: "connections",
      },
    },
    {
      $unwind: "$connections",
    },
    {
      $match: {
        "connections.status": "accepted",
        "connections.blocked": false,
        "connections.following": { $ne: req.user._id }, // Exclude logged-in user
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "connections.following",
        foreignField: "_id",
        as: "recommended",
      },
    },
    {
      $unwind: "$recommended",
    },
    {
      $project: {
        _id: "$recommended._id",
        username: "$recommended.username",
        profilePic: "$recommended.profilePic",
      },
    },
    {
      $limit: 10, // Limit to 10 recommendations
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { recommendedUsers }, "Recommended users list."));
});

export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const followRecord = await Follow.findOne({ follower: req.user._id, following: userId });

  if (!followRecord) {
    throw new ApiError(404, "User not found in your follow list.");
  }

  // Restore previous status (accepted or pending)
  let previousStatus = followRecord.status === "blocked" ? "accepted" : "pending";

  await Follow.findOneAndUpdate(
    { follower: req.user._id, following: userId },
    { blocked: false, status: previousStatus },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, { blocked: false }, "User unblocked successfully."));
});

export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot block yourself.");
  }

  const followRecord = await Follow.findOneAndUpdate(
    { follower: req.user._id, following: userId },
    { blocked: true, status: "blocked" },
    { new: true, upsert: true }
  );

  return res.status(200).json(new ApiResponse(200, { blocked: true }, "User blocked successfully."));
});

export const getBlockedUsers = asyncHandler(async (req,res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized!");
  }

  const blockedRequests = await Follow.find({ 
      follower: req.user._id, 
      status: "blocked",
      blocked: true 
    })
    .populate("following", "username profilePic")
    .lean();

  return res.status(200).json(new ApiResponse(200, { blockedRequests }, "Blocked follow requests fetched."));
});