import mongoose, { mongo } from "mongoose";

const subsciptionSchema=new mongoose.Schema(
    {
        subscriber:{
            type:mongoose.Schema.Types.ObjectId,//One who is subscibing
            ref:"User"
        },
        channel:{
            type:mongoose.Schema.Types.ObjectId,//One to whom subscriber is subscibing
            ref:"User"
        }
    },
    {timestamps:true}
);

export const Subscription=mongoose.model("Subscription",subsciptionSchema);

