//This syntax is fine but we can write a more improved version
//require("dotenv").config({path:"./env"});
import dotenv from "dotenv";
dotenv.config({path:"./env"});



import {app} from "./app.js";


// Second Approach to connect a DB
import connectDB from "./db/db.js";

//technically connectDB returns a promise
connectDB()
.then(()=>{
    // this is just a event handler 
    app.on("error",(error)=>{
        console.error("ERROR",error);
        throw error;
    });
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App running at ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("Mongo DB connection failed", err);
});





// First Approach to connect to a DB using IIFE

// sometimes dev's start an IIFE with a semi colon like 
//;(async () => {})();
// but we don't need it here 


/* import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";

(
    async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.error("ERROR",error);
            throw error;
        });
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    } 
    catch (error){
        console.error("ERROR",error);
        throw error;
    } 
}
)(); */
