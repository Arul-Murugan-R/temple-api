const express = require('express');
const path = require('path')
const mongoose= require('mongoose')
const bodyParser = require('body-parser')
const multer = require('multer');
require('dotenv').config()

const app = express();
const URI = `mongodb+srv://${process.env.NAME}:${process.env.DPASS}@cluster0.1tdiu.mongodb.net/${process.env.dbname}`
const User = require('./models/user')
const homeRoute = require('./routes/home')
const authRoute = require('./routes/auth')
const Storage = multer.diskStorage({})
const fileFilter=(req,file,cb)=>{
    if(file.mime==='image/png' || file.mime==='image/jpeg' || file.mime==='image/gif' || file.mime==='image/jpg'){
        cb(null,true)
    }
    else{
        cb(null,false)
    }
}
app.use(multer({storage:Storage}).single('photo'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    next()
})
app.use('/auth',authRoute);
app.use('/',homeRoute);
app.use((err,req,res,next)=>{
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong'
    const errors = err.cons
    console.log(errors)
    if(errors){
        let output = errors[0].msg
        if(output){
        return res.status(statusCode).json({message: message,output: output});
        }
    }
    res.status(statusCode).json({message: message});
})
app.use((req,res,next)=>{
    res.status(404).json({message:'Page Not Found'});
})

mongoose.connect(URI,()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log('listening on http://localhost:7000');
    })

})