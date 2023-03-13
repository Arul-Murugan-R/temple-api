const express = require('express');
const mongodb = require('mongodb')
const {body,validationResult} = require('express-validator/check')
const fs = require('fs')
const path = require('path')
const status = require('../middleware/status')
const cloudinary = require('../middleware/cloudinary')

const route = express.Router();
let totalSearch=0,productCount=0
const Product = require('../models/product')
    Product.find()
    .then((product)=>{
        for(let pro of product){
            totalSearch+=pro.search
            productCount+=1
        }
    })
    .catch((err)=>{
        console.log(err)
    })


route.get('/home',(req,res,next) => {
    Product.find()
    .then((result)=>{
        // console.log((totalSearch/(productCount/2)));
        const recom=result.filter(p=>{return p['search']>=(totalSearch/(productCount/2))})
        // console.log(recom)
        res.status(200).json({message:'Product Rendered Successfully',products:result})
    })
    .catch((err)=>{
        console.log(err)
    })
})
route.use('/search',(req,res,next)=>{
    const search = req.query.search;
    const filter = req.query.filter || 'location'
    // console.log(search)
    Product.find()
    .then((products)=>{
        // console.log(products[0][filter])
        let some=products.filter(p=>{
            if(p[filter].toLowerCase().includes(search.toLowerCase())){
                // console.log('search of '+p['name']+' = '+p['search'])
                p['search']+=1
                p.save()
            }
            return p[filter].toLowerCase().includes(search.toLowerCase())})
        return some
    })
    .catch((err)=>{
        console.log(err)
    })
    .then(pro=>{
        // console.log(pro)
        if(pro===[]){
            return res.status(404).json({message:'No Product Found'})
        }
        res.status(200).json({message:'Searching Done Successfully',products:pro})
    })
    .catch((err)=>{
        console.log(err)
    })
})
route.get('/product',status,(req,res,next)=>{
    Product.find({user:new mongodb.ObjectId(req.userId)})
    .then((product)=>{
        res.status(200).json({message:'Product List Found Successfully',products:product,i:1})
    })
    .catch((err)=>{
        console.log(err)
        res.send(401).json({message:err});
    })
})


////////////////////////////// POST REQUESTS //////////////////////////////
route.post('/add-yours',status,
[
    body('name').not().isEmpty().withMessage('Required Name').isLength({max:25}).withMessage('Check For the size of name'),
    body('location').not().isEmpty().withMessage('Required Location').isLength({max:20}).withMessage('Check the size'),
    body('desc').not().isEmpty().withMessage('Fill with Description'),
],
async (req,res,next) => {
    console.log(req.body)
    let photo,cloImgData
    const errors = validationResult(req) 
    // console.log(errors.array())
    // console.log(errors.array()[0].msg)
    if(!errors.isEmpty()){
        return res.status(422).json({message:errors.array()[0].msg,errors:errors.array()})
    }
    // console.log(req.file)
    if(!req.file){
        return res.status(422).json({message:'Image is not set'})
    }
    photo=req.file.path.replace('\\','/');
    cloImgData = await cloudinary.uploader.upload(photo,{
        width:500,
        height:280,
        crop:'fill'
    })
    // console.log(photo)
    // console.log(req.user)
    const product = new Product({
        name:req.body.name,
        place:req.body.place,
        photo:cloImgData.url,
        no:req.body.no,
        mark:req.body.mark,
        city:req.body.city,
        state:req.body.state,
        zip:req.body.zip,
        email:req.body.email,
        desc:req.body.desc,
        location:req.body.location,
        user:req.userId
    })
    product.save(()=>{
        res.status(201).json({message:'Product Added Successfully'})
    })
})
route.use('/view-page/:proId',(req,res,next) => {
    // console.log(req.params.proId)
    Product.findOne({_id:new mongodb.ObjectId(req.params.proId) })
    .then((result) => {
        // console.log(result)
        res.status(200).json({message:'Single Product Rendered Successfully',product:result})
    })
    .catch((err)=>console.log(err))
})

////////////////////////////// PUT REQUESTS //////////////////////////////
route.post('/edit',status,
[
    body('name').not().isEmpty().withMessage('Requires Name').isLength({max:25}).withMessage('Check For the size of name'),
    body('location').not().isEmpty().withMessage('Requires Location').isLength({max:20}).withMessage('Check the size'),
    body('desc').not().isEmpty().withMessage('Fill with Description'),
],
(req,res,next)=>{
    const errors = validationResult(req) 
    let photo,cloImgData
    if(!errors.isEmpty()){
        return res.status(422).json({message:errors.array()[0].msg,errors:errors.array(),edit:true,product:req.body})
    }
    let _id=req.body._id;
    // console.log(req.body)
    if(req.file){
        photo=req.file.path.replace('\\','/');
       Product.findOne({_id:new mongodb.ObjectId(_id)})
        .then(async (result)=>{
            await unLink(result.photo)
        })
        .catch((err)=>{
            console.log(err)
        })
    }
    Product.findOne({_id:new mongodb.ObjectId(_id)})
    .then(async (pro)=>{
        pro.name=req.body.name;
        pro.place=req.body.place;
        if(photo){
            cloImgData = await cloudinary.uploader.upload(photo,{
                width:500,
                height:280,
                crop:'fill'
            })
            pro.photo=cloImgData.url;
        }
        pro.no=req.body.no;
        pro.mark=req.body.mark;
        pro.city=req.body.city;
        pro.state=req.body.state;
        pro.zip=req.body.zip;
        pro.email=req.body.email;
        pro.desc=req.body.desc;
        pro.location=req.body.location;
        pro.user=req.user._id
        pro.save(()=>{
            res.status(201).json({message:'Product Updated Successfully'})
        })
    })
    .catch((err)=>{
        console.log(err)
    })
})
route.use('/edit/:proId',status,(req,res,next) => {
    let _id = req.params.proId;
    console.log(_id)
    Product.findOne({user:new mongodb.ObjectId(req.user._id),_id:new mongodb.ObjectId(_id)})
    .then((product) => {
        if(!product){
            return res.status(404).json({message:'Product Not Found'})
        }
        // console.log(product)
        res.status(200).json({message:'Single Product for Editing',product:product,error:[],input:[],edit:true})
    })
    .catch((err)=>{
        console.log(err)
    })
})

route.post('/delete/:proId',status,(req,res,next)=>{
    Product.findOne({user:new mongodb.ObjectId(req.userId),_id:new mongodb.ObjectId(req.params.proId)})
    .then((product)=>{
        if(!product){
            return res.status(422).json({message:'Product Does Not Exist or Its Product belong to different User'})
        }
        Product.findByIdAndRemove(req.params.proId)
        .then(async (result)=>{
            await unLink(result.photo)
            // console.log(result)
            res.status(201).json({message:'Product Deleted Successfully'})
        })
    })
    .catch((err)=>{
        console.log(err)
    })
})

const unLink= async (imgPath)=>{
    // console.log(path.join(__dirname,'..',imgPath))
    let splitPath = imgPath.split('/')
    let imageName = splitPath[splitPath.length - 1].split('.')[0]
    let resp = await cloudinary.uploader.destroy(imageName)
}

module.exports=route;
