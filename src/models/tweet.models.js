import mongoose, { Schema, mongo } from "mongoose";


const tweetSchema=Schema(
    {
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User" 
        },
        content:{
            type:String, 
            required:true
        }
    },
    {timestamps:true}
)

export const Tweet=mongoose.model("Tweet",tweetSchema);