import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";

const generateAccessAndRefreshTokens= async(userID)=>{
    try {
        const user=await User.findById(userID);
        const userRefreshToken=user.generateRefreshToken();
        const userAccessToken=Tokenuser.generateAccessToken();

        user.refreshToken=userRefreshToken;
        await user.save({validateBeforeSave:false});

        return {userAccessToken,userRefreshToken}

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

    const{email,username,password}=req.body;
    if(username && email)
        throw ApiError(400,"Username or Email is required");

    const user=await User.findOne({
        $or:[{username},{email}]
    });

    if(!user)throw ApiError(404,"User does not exist");

    const passwordValid=await user.isPasswordCorrect(password);
    if(!passwordValid)throw ApiError(401,"Invalid user Password");

    const {AccessToken,RefreshToken}=await generateAccessAndRefreshTokens(user._id);
     
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

        /* Inside the json response, we don't necesserily have to send AccessToke and
        RefreshToken again because we have already done that with cookie.
        However with this we are dealing cases like->
        1. If user wants to store/save these token in local storage,
        2. we can't set cookies in mobile development 
        
        */

});
 
const logoutUser= asyncHandler(async (req,res)=>{
    //To logout an user usually cookies are removed 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new:true
        }
    )

    // Clearing cookies
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"User Logged out")); 
});



export {
    registerUser,
    loginUser,
    logoutUser
}