import mongoose, { mongo } from "mongoose";

const likeSchema=mongoose.Schema(
    {
        video:{
            type:mongoose.Schema.ObjectId,
            ref:"Video"
        },
        comment:{
            type:mongoose.Schema.ObjectId,
            ref:"Comment"
        },
        tweet:{
            type:mongoose.Schema.ObjectId,
            ref:"Tweet"
        },
        likedBy:{
            type:mongoose.Schema.ObjectId,
            ref:"User"
        }
    },
    {timestamps:true}
)


export const Like=mongoose.model("Like",likeSchema);