// I method
const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>
            next(err))
    }
}



// II method
/* const asyncHandler=(fn)=>async (req,res,next)=>{
    try {
        await fn(req,res,next);
    } 
    catch (error) {
        res.status(error.code|| 400).json({
            success:false,
            message:error.message
        })
    }
} */


export {asyncHandler}



/* 
const asyncHandler= ()=>{}
const asyncHandler= (func)=>{ ()=>{} }
const asyncHandler= (func)=>{ async()=>{} }
const asyncHandler= (func)=> async()=>{} 




*/