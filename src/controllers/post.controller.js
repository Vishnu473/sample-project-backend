import _ from "lodash";
import { Post } from "../models/post.model.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { getUserFollowersList } from "./follow.controller.js";

export const getAllMyPosts = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(400, "UnAuthorized!");
  }

  const posts = await Post.find().sort({ createdAt: -1 });

  if (posts.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, "No posts found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts fetched successfully"));
});

export const addPost = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(400, "UnAuthorized! Login to add Post");
  }
  const { title, description, media, privacy, tags } = req.body;

  if ([title, description].some((val) => val.trim() === "")) {
    throw new ApiError(400, "Title or description are required");
  }

  const existingPost = await Post.findOne({
    creator: req.user?._id,
    $or: [{ title }, { description }],
  });

  if (existingPost) {
    throw new ApiError(
      400,
      "Similar Post already exists with same title and description"
    );
  }

  const newPost = new Post({
    creator: req.user?._id,
    title,
    description,
    privacy,
    media,
    tags,
  });
  newPost.trimTags();
  const post = await Post.create(newPost);

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post uploaded successfully"));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const post = await Post.findById(id);

  if (!post) {
    throw new ApiError(400, "No post found with the Id");
  }

  if (post.creator.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized");
  }
  //console.log(Object.keys(updates)); //[ 'title', 'description', 'mediaUrl', 'privacy', 'tags' ]

  if (updates.tags && updates.tags.length > 0) {
    updates.tags = updates.tags
      .map((tag) => tag.trim())
      .filter((t) => t !== "");
  }
  const isUpdated = Object.keys(updates).some(
    (key) => !_.isEqual(post[key], updates[key])
  );

  if (!isUpdated) {
    return res
      .status(200)
      .json(new ApiResponse(200, post, "No changes detected"));
  }

  const updatedPost = await Post.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postExisted = await Post.findById(id);

  if (!postExisted) {
    throw new ApiError(400, "Post not found");
  }

  if (
    !req.user ||
    postExisted.creator.toString() !== req.user?._id.toString()
  ) {
    throw new ApiError(400, "UnAuthorized");
  }

  const postDeleted = await Post.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export const getPostDetail = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(400, "Post not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(400, "UserId is required!");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "UserId is invalid");
  }

  const userExists = await User.findById(userId).select("privacy");
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const requestingUserId = req.user?._id;
 
  let userPosts = [];

  const userFollowers = await getUserFollowersList(userId);

  if (
    userExists.privacy === "public" || 
    requestingUserId?.toString() === userId || 
    (userExists.privacy === "followers" && userFollowers.includes(requestingUserId.toString()))
  ) {
    userPosts = await Post.find({ creator: userId }).sort({ createdAt: -1 });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userPosts, "Posts fetched successfully"));
});

export const fetchPostsOnSearch = asyncHandler(async (req, res) => {
  const search = req.query.search;

  if (!search || search.trim() === "") {
    throw new ApiError(400, "seach is required");
  }

  const posts = await Post.find({ 
    $or: [{ tags: {$regex: `^${search}`, $options : "i"} }, 
          { title:  {$regex: `${search}`, $options : "i"} }] 
        });

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "successfully fetched posts"));
});
