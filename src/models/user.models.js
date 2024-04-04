import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            // optimised way to search a field 
            index:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
           
        },
        fullName:{
            type:String,
            required:true,                      
            trim:true,
            index:true
           
        },
        avatar:{
            type:String, // cloudinary url
            required:true
                     
        },
        coverImage:{
            type:String // cloudinary url         
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }
    },
    {timestamps:true}
);


/* HOOKS */
//don't use => function because we need "this"
// and =>function does not have access to "this"

// we also have to ensure password encryption occurs only when
// 1. user changes Password or,
// 2. new user being registered 
userSchema.pre("save", async function (next){
    if(this.isModified("password")==false)
        return next();


    this.password= await bcrypt.hash(this.password,10);
    next();
});
/* Custom Methods */
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.userName,
        fullname:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    );
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    );
}

export const User = mongoose.model("User",userSchema);