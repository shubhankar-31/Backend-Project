import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import { ApiError } from './ApiError';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary=async (filePath)=>{
    try {
        if (filePath==false) {
            return null;
            //or we could return an error saying "couldn't find the path"
        }
        const response = await cloudinary.uploader.upload(filePath,{
            resource_type:"auto"
        });
        fs.unlinkSync(filePath);
        return response;
    } 
    catch (error) {
        fs.unlinkSync(filePath);
        // removing the locally saved temporary file as the upload operation failed. 
        return null;
    }
}


const deleteFromCloudinary=async(filePath)=>{
    try {
        if(!filePath)
            throw new ApiError(400,"File path does not lead to any file on Cloudinary ");    
    
        await cloudinary.uploader.destroy(
        filePath.split("/").pop().split(".")[0],
        (error) => {
            if (error) {
            throw new ApiError(404, error, "Image not found");
            }
        }
        );
    
    
    
    } catch (error) {
        throw new ApiError(500,"Deletion operation failed on Cloudinary");
    }
}
export {uploadOnCloudinary,deleteFromCloudinary}
