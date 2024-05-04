import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/fileUpload.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens= async(userID)=>{
    try {
        const user=await User.findById(userID);
        const AccessToken= user.generateAccessToken();
        const RefreshToken=user.generateRefreshToken();

        user.refreshToken=RefreshToken;
        await user.save({ validateBeforeSave: false });
        
        return [AccessToken,RefreshToken];
    } 
    catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}


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
   

    // Now we are checking for empty fields
    // we could have done it with multiple "if" conditions
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required ");
    }

    //Step-->3
    //Now we are checking whether we have a User with "username" or "email" 
    // If yes then we throw error
    const existUser=await User.findOne({
        $or:[{username},{email}]
    });
    if(existUser) throw new ApiError(409,"User with email or username already exist");

    //Step-->4
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath="";
    
    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar file is required");

    // We also need to check for Cover Image, incase if it hasn't been uploaded 
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0)
        coverImageLocalPath=req.files?.coverImage[0].path;

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
        throw new ApiError(400,"Avatar file is required");

    //Step->5
    //Creating the User object in the  DB
    const user=await User.create({
        //(User Model fields , field name receiving through req.body)
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:username?.toLowerCase()
    });

    //Step->6
    // Returning User object without password and refresh token field
    const userCreated=await User.findById(user._id).select(
    "-password -refreshToken");

    //Step->7
    // Checking for the User creation
    if(!userCreated)
        throw new ApiError(500,"This User is not registered");
    else{
        console.log(`User created with ${userCreated.userName} and ${userCreated.email} \n`);
    }
    //Step->8
    return res.status(201).json(
        new ApiResponse(200,userCreated,"User Registered with success")
    );

}); 

const loginUser=asyncHandler (async (req,res)=>{
    /*
    1.Req body->data
    2.username or email 
    3.find the user
    4.password check
    5.access and refresh token generation
    6.Send secure cookie    
    */

    const {email,username,password}=req.body;
    if(!username && !email)
        throw new ApiError(400,"Username or Email is required");

    const user=await User.findOne({
        $or:[{username},{email}]
    });
    
    if(!user)throw new ApiError(404,"User does not exist");

    const passwordValid=await user.isPasswordCorrect(password);
    if(!passwordValid)throw new ApiError(401,"Invalid user Password");
   
    const Tokens = await generateAccessAndRefreshTokens(user._id);
    const AccessToken=Tokens[0],RefreshToken = Tokens[1];
  
     
    /*  
        now currently the user(line-119) does not have the access and refresh tokens
        and we generated it at (line-128) but the the feild will still be empty
        So, we have 2 option 
        1. We can either update the "user" object 
        I think we can use await user.save()
        2. Hit another query using User.FindOne("Somthing") iff. the query is not an expensive operation  
    
    */
    //Method 2
    const loggedInUser=await User.findById(user._id)
    .select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }

    console.log(`A user with ${email},${username} and ${password} logged in `);
    return res.status(200)
    .cookie("accessToken",AccessToken,options)
    .cookie("refreshToken",RefreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,
            AccessToken,
            RefreshToken
        },"User logged in Successfully")
    )

        /* Inside the json response, we don't necesserily have to send AccessToken and
        RefreshToken again because we have already set that in the
        cookie("accessToken" and "refreshToken").
        But with this we can deal with cases like->
        1. If user wants to store/save these token in local storage,
        2. We can't set cookies during mobile development.
        
        */

});
 
const logoutUser= asyncHandler(async (req,res)=>{
    //To logout an user usually cookies are removed 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    console.log("A user Logged Out");
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out..Bye Bye"))
});

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken)
        throw new ApiError(401,"Unauthorized Request");
    
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id);
        if(!user)
            throw new ApiError(401,"Invalid Refresh Token");
        
        if(incomingRefreshToken !==user?.refreshToken)
            throw new ApiError(401,"Refresh Token is expired/used");
    
        const Tokens = await generateAccessAndRefreshTokens(user._id);
        const AccessToken=Tokens[0],RefreshToken = Tokens[1];
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken",AccessToken,options)
        .cookie("refreshToken",RefreshToken,options)
        .json(
            new ApiResponse(200,
                {AccessToken,RefreshToken},
                "Access Token Refreshed")
        );
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refresh Token");
    }
    
});

const changeCurrentUserPassword=asyncHandler(async (req,res)=>{
    const {oldPass,newPass,confPass}=req.body;

    if(newPass!==confPass)
        throw new ApiError(400,"New Password and Conformation password did not match");
    
    const user=await User.findById(req.user?._id);

    const passwordCorrect=await user.isPasswordCorrect(oldPass);
    if(!passwordCorrect)
        throw new ApiError(400,"Invalid old Password");

    user.password=newPass;
    await user.save({validateBeforeSave:false});
    console.log("Password changed of a logged in user");
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password was changed successfully"));
});

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"));

});

const updateAccDetail=asyncHandler(async (req,res)=>{
    const {fullName,email} =req.body;

    if(!fullName && !email)
        throw new ApiError(400,"All fields are required");

        const user= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName:fullName,
                    email:email
                }
            },
            {new :true}
            ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account deatils updated with success"));
});

const updateUserAvatar=asyncHandler(async (req,res)=>{

    //First deleting the old avatar image
    const oldAvatar=await User.findById(req.user?._id);
    const oldAvatarImage=oldAvatar.avatar;
    
    await deleteFromCloudinary(oldAvatarImage);


    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar File is missing");

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url)
        throw new ApiError(400,"Error while uploading avatar");

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url               
            }
        },
        {new :true}
        ).select("-password");

    return res.status(200)
    .json(new ApiResponse
        (200,user,"Avatar updated Successfully"));

});

const updateUserCoverImage=asyncHandler(async (req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath)
        throw new ApiError(400,"Cover Image File is missing");

    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url)
        throw new ApiError(400,"Error while uploading Cover Image");

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url               
            }
        },
        {new :true}
        ).select("-password");

        return res.status(200)
        .json(new ApiResponse
            (200,user,"Cover Image updated Successfully"));


});

const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.params;

    if(!username?.trim())
        throw new ApiError(400,"Username is missing");
    const channel=await User.aggregate([
        {
            $match:{
                userName:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                //Our model is technically named as "Subscription"
                //but in mongoDB it will be stored as "subscriptions"
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"

                //"subscribers" will be an array 
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
               channelsSubscribedToCount:{
                    $size:"$subscribedTo"
               },
               isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                
                }   
               }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
    ]);
   
    if(!channel?.length){
        throw new ApiError(404,"Channel does not exists");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel fetched successfully")
    )


});

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].WatchHistory,
            "Watch History fetched Successfully"
        )
    )
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}