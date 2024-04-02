import { asyncHandler } from "../utils/asyncHandlers.js";


const registerUser=asyncHandler(async (req,res)=>{
    res.status(201).json({
        message:"ok"
    });
});

 

export {
    registerUser,

}