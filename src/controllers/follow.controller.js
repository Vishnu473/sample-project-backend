import mongoose from "mongoose";
import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const followUser = asyncHandler(async (req, res) => {
  const { followingId } = req.body;

  const followingUser = await User.findById(followingId).select("privacy");
  if (!followingUser) throw new ApiError(404, "User not found!");

  const alreadyFollowing = await Follow.findOne({
    follower: req.user?._id,
    following: followingId,
  });

  if (alreadyFollowing) {
    throw new ApiError(400, `You have already ${alreadyFollowing.status === "pending" ? "sent a follow request" : "followed this user"}`);
  }

  const isPrivateOrFollowers = followingUser.privacy === "private" || followingUser.privacy === "followers";
  const followStatus = isPrivateOrFollowers ? "pending" : "accepted";

  const newFollow = await Follow.create({
    follower: req.user._id,
    following: followingId,
    status: followStatus,
  });

  const message = followStatus === "pending" ? "Follow request sent." : "You are now following this user.";

  return res.status(201).json(new ApiResponse(201, newFollow, message));
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

  const user = await User.findById(userId).select("privacy");
  if (!user) throw new ApiError(404, "User not found.");

  let followers = [];
  let isFollower = false;
  const requestingUserId = req.user?._id?.toString();

  if (user.privacy === "public" || requestingUserId === userId) {
    isFollower = true;
  } else if (user.privacy === "followers") {
    isFollower = await Follow.exists({
      follower: requestingUserId,
      following: userId,
      status: "accepted",
    });

    if (isFollower) {
      followers = await Follow.find({ following: userId, blocked: false, status: "accepted" })
        .populate("follower", "username profilePic")
        .lean();
    }
  }

  return res.status(200).json(new ApiResponse(200, { followers }, "Followers fetched successfully."));
});

export const getUserFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("privacy");
  if (!user) throw new ApiError(404, "User not found.");

  let following = [];
  let isFollower = false;
  const requestingUserId = req.user?._id?.toString();

  if (user.privacy === "public" || requestingUserId === userId) {
    isFollower = true;
  } else if (user.privacy === "followers") {
    // If privacy is "followers", check if the requester is a follower
    isFollower = await Follow.exists({
      follower: requestingUserId,
      following: userId,
      status: "accepted",
    });

    if (isFollower) {
      following = await Follow.find({ follower: userId, blocked: false, status: "accepted" })
        .populate("following", "username profilePic")
        .lean();
    }
  }

  return res.status(200).json(new ApiResponse(200, { following }, "Following list fetched successfully."));
});

export const getMyFollowing = asyncHandler(async (req, res) => {
  const following = await Follow.find({ follower: req.user._id, blocked: false, status:"accepted" })
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
  const { userId } = req.params;

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, "User not found!");
  }

  const userObjectId = new mongoose.mongo.ObjectId(userId);

  const counts = await Follow.aggregate([
    {
      $facet: {
        followers: [
          { $match: { following: userObjectId, status: "accepted", blocked: false } },
          { $count: "count" }
        ],
        following: [
          { $match: { follower: userObjectId, status: "accepted", blocked: false } },
          { $count: "count" }
        ],
        pendingFollowers: [
          { $match: { following: userObjectId, status: "pending", blocked: false } },
          { $count: "count" }
        ],
        pendingFollowing: [
          { $match: { follower: userObjectId, status: "pending", blocked: false } },
          { $count: "count" }
        ],
        blockedFollowers: [
          { $match: { follower: userObjectId, status: "blocked", blocked:true } }, // Removed redundant `blocked: true`
          { $count: "count" }
        ]
      }
    }
  ]);
  

  // Extract counts properly
  const formattedCounts = {
    followers: counts[0].followers[0]?.count || 0,
    following: counts[0].following[0]?.count || 0,
    pendingFollowers: counts[0].pendingFollowers[0]?.count || 0,
    pendingFollowing: counts[0].pendingFollowing[0]?.count || 0,
    blockedFollowers: counts[0].blockedFollowers[0]?.count || 0
  };

  return res.status(200).json(
    new ApiResponse(200, 
      formattedCounts, "Fetched Successfully")
  );
});

export const getMyFollowStats  = asyncHandler(async (req, res) => {
  
  const userObjectId = new mongoose.mongo.ObjectId(req.user?._id);

  const counts = await Follow.aggregate([
    {
      $facet: {
        followers: [
          { $match: { following: userObjectId, status: "accepted", blocked: false } },
          { $count: "count" }
        ],
        following: [
          { $match: { follower: userObjectId, status: "accepted", blocked: false } },
          { $count: "count" }
        ],
        pendingFollowers: [
          { $match: { following: userObjectId, status: "pending", blocked: false } },
          { $count: "count" }
        ],
        pendingFollowing: [
          { $match: { follower: userObjectId, status: "pending", blocked: false } },
          { $count: "count" }
        ],
        blockedFollowers: [
          { $match: { follower: userObjectId, status: "blocked", blocked:true } }, // Removed redundant `blocked: true`
          { $count: "count" }
        ]
      }
    }
  ]);
  

  // Extract counts properly
  const formattedCounts = {
    followers: counts[0].followers[0]?.count || 0,
    following: counts[0].following[0]?.count || 0,
    pendingFollowers: counts[0].pendingFollowers[0]?.count || 0,
    pendingFollowing: counts[0].pendingFollowing[0]?.count || 0,
    blockedFollowers: counts[0].blockedFollowers[0]?.count || 0
  };

  return res.status(200).json(
    new ApiResponse(200, 
      formattedCounts, "Fetched Successfully")
  );
});

export const updateFollowRequest = asyncHandler(async (req, res) => {
  const { followerId, action } = req.body;

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
  const pendingRequests = await Follow.find({ 
      following: req.user._id, 
      status: "pending", 
      blocked: false 
    })
    .populate("follower", "username profilePic")
    .lean();

    const msg = pendingRequests.length > 0 ? "Pending follow requests fetched" : "No Pending Requests";

  return res.status(200).json(new ApiResponse(200, { pendingRequests }, msg));
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

  const msg = mutualFollowers.length > 0 ? "Mutual followers list" : "Follow more people to see mutual";

  return res.status(200).json(new ApiResponse(200, { mutualFollowers }, msg));
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

  const msg = recommendedUsers.length > 0 ? "Recommended users list" : "Follow more people to see recommendations";

  return res.status(200).json(new ApiResponse(200, { recommendedUsers }, msg));
});

export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;

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
  const { followingId } = req.body;

  // Check if the user is actually following before blocking
  const followRecord = await Follow.findOne({
    follower: req.user._id,
    following: followingId,
    status: "accepted", // ✅ Ensure only accepted follows can be blocked
    blocked: false // ✅ Ensure it's not already blocked
  });

  if (!followRecord) {
    throw new ApiError(400, "No existing relationship to block.");
  }

  // Now update the existing record to blocked
  followRecord.status = "blocked";
  followRecord.blocked = true;
  await followRecord.save();

  return res.status(200).json(new ApiResponse(200, followRecord, "User blocked successfully."));
});

export const getBlockedUsers = asyncHandler(async (req,res) => {
  const blockedRequests = await Follow.find({ 
      follower: req.user._id, 
      status: "blocked",
      blocked: true 
    })
    .populate("following", "username profilePic")
    .lean();

    const msg = blockedRequests.length > 0 ? "Blocked follow requests fetched." : "No Blocked requests";

  return res.status(200).json(new ApiResponse(200, { blockedRequests }, msg));
});

export const getUserFollowersList = async (userId) => {
  const followers = await Follow.find({ following: userId, blocked: false, status: "accepted" })
    .select("follower")
    .lean();

  return followers.map((f) => f.follower.toString());
};