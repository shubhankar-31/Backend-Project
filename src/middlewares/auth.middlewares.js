import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

// This middleware will basically verify whether user is logged in or not 
/* Since we have used app.use(cookieParser()) the req object will also have access to cookies
    So, with this object we now have access to ACCESS & REFRESH Tokens
    and finally we can verify the user with his ACCESS tokens.
*/

// Somtimes we'll find that res is not being used so we can replace it
// with an underscore (_)
export const verifyJWT=asyncHandler(async (req, _,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

        if(!token)throw new ApiError(404,"Unauthorized Request");
    
        const decodedToken=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user)throw new ApiError(401,"Invalid access token");
    
        req.user=user;
        next();
    } 
    catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }
});