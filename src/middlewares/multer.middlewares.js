import multer from "multer";

//Obviously we will be using DiskStorage instead of MemoryStorage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
    // we could modify the file name to our own liking 
    // using file.fieldname + SomeRandomString
      cb(null, file.originalname);
    }
  });
  
  export const upload = multer({ storage: storage });