import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getAllPosts = asyncHandler(async (req,res)=>{
    if(!req.user){
        throw new ApiError(400,"UnAuthorized!")
    }

    const posts = await Post.find({creator:req.user?._id});

    if(posts.length === 0){
        throw new ApiError(400,"No posts found")
    }

    return res.status(200).
    json(new ApiResponse(200,posts,"Posts fetched successfully"))
})

export const addPost = asyncHandler(async(req,res) => {
    if(!req.user){
        throw new ApiError(400,"UnAuthorized! Login to add Post")
    }
    const {title, description, mediaUrl, privacy} = req.body;
    
    console.log(req.user);
    
    if([title,description].some(val => val.trim() === "")){
        throw new ApiError(400,"Title or description are required")
    }

    const user = await Post.create({
        creator:req.user?._id,
        title, description, privacy, mediaUrl
    });

    return res.status(201).json(new ApiResponse(201, user, "Post published successfully"))
})