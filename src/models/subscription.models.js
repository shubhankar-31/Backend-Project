import mongoose, { mongo } from "mongoose";

const subscriptionSchema=new mongoose.Schema(
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

export const Subscription=mongoose.model("Subscription",subscriptionSchema);

/* 
    "Subscriber"
Q. How many users have subscribed to a channel 

    Subscription.aggregate(
        [
           { 
                $match:{
                    channel:"channel_name"
                }
            },
            {
                $count:"Subscriber"
            }

        ]
    )

    "Subscribed"
Q. How many channels a particular "channel" has subscribed to?
    Subscription.aggregate(
        [
           { 
                $match:{
                    subscriber:"channel_name"
                }
            },
            {
                $count:"Subscribed"
            }

        ]
    )

*/