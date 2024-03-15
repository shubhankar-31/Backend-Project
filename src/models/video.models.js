import mongoose, { mongo } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            type:String, // url
            required:[true, "Video file is necessary"]
        },
        thumbnail:{
            type:String, // url
            required:true
        },
        title:{
            type:String, 
            required:true
        },
        description:{
            type:String, 
            required:true
        },
        duration:{
            type:Number, 
            required:true
        },
        views :{
            type:Number,
            defautl:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        uploader:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamps:true}
);


videoSchema.plugin(mongooseAggregatePaginate)
export const Video =mongoose.model("Video",videoSchema);