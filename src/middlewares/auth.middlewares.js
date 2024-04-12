import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

// This middle ware will basically verify whether user is logged in or not 


// Somtimes we'll find that res is not being used so we can replace it
// with an underscore (_)
export const verifyJWT=asyncHandler(async (req,res,next)=>{
    try {
        const token=req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token)throw new ApiError(404,"Unauthorized Request");
    
        const decodedToken=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user)throw new ApiError(401,"Invalid access token");
    
        req.user=user;
        next();
    } 
    catch (error) {
        throw new ApiError(401,"Invalid access token");
    }
});