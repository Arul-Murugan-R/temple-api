const cloudinary = require('cloudinary').v2

cloudinary.config({ 
    cloud_name: process.env.CNAME, 
    api_key: process.env.CAPI_KEY, 
    api_secret: process.env.CAPI_SECRET
  });


module.exports = cloudinary