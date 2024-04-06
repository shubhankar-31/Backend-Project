import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";

const registerUser=asyncHandler(async (req,res)=>{
    /* Steps to register a user 
        1.Get user details from frontend
        2.Validation - not empty
        3.Check if User already Exists? : with username and email 
        4.Check for Images,Check for avatar 
            4.1.Upload them to Cloudinary
        5.Create User object-Create entry in DB
        6.Remove Password and Refresh Token field from Response
        7.Check for User creation
        8.Return Response    
    */ 

    //Step-->1 and 2
    //REMEMBER we get all our data from request.body
    const {fullName,email,username,password}=req.body;
    console.log(email);

    // here we are basically checking for empty fields
    // we could have also done it with multiple if conditions
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required ");
    }

    //Step-->3
    const existUser=await User.findOne({
        $or:[{username},{email}]
    });
    if(existUser) throw new ApiError(409,"User with email or username already exist");

    //Step-->4
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar file is required");

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
        throw new ApiError(400,"Avatar file is required");

    //Step->5
    const user=await User.create({
        //(USerModel object name , object name receiving through Req.body)
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:username?.toLowerCase()
    });

    //Step->6
    //User object without password and refresh token field
    const userCreated=await User.findById(user._id).select(
    "-password -refreshToken");

    //Step->7
    if(!userCreated)
        throw new ApiError(500,"Something went Wrong while registering user");
    
    //Step->8
    return res.status(201).json(
        new ApiResponse(200,userCreated,"User Registered with success")
    );

}); 

 

export {
    registerUser,

}