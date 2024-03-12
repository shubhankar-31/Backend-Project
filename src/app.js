import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app= express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
//best practice for security. so that we don't get unlimited json 
app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));

app.use(cookieParser());






export { app };