import mongoose, { mongo } from "mongoose";


const playlistSchema=mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:false
        },
        videos:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video" 
            }
        ],
        creator:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User" 
        }
    },
    {timestamps:true}
)

export const Playlist=mongoose.model("Playlist",playlistSchema)