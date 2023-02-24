const route = require('express').Router();
const jwt = require('jsonwebtoken')

const {body,validationResult} = require('express-validator/check')
const bcrypt = require('bcrypt')

const User = require('../models/user')

route.post('/login',
[
    body('email').not().isEmpty().withMessage('Requires Email').custom((val,{req})=>{
        return User.findOne({email:val})
        .then((result)=>{
            if(!result){
                return Promise.reject('User Does Not Exist')
            }
        })
    }),
    body('password').not().isEmpty().withMessage('Password is Empty'),
],
(req, res,next)=>{
    console.log(req.body)
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        const error = new Error('Validation Error')
        error.cons = errors.array()
        error.statusCode = 422
        throw error
    }
    User.findOne({email:req.body.email})
    .then((result)=>{
        bcrypt.compare(req.body.password, result.password)
        .then((bool)=>{
            if(!bool){
                const error = new Error('Incorrect Password')
                error.statusCode = 401
                throw error
            }
            const token = jwt.sign({
                email:result.email,
                userId:result._id.toString(),
            },process.env.SECRET,{expiresIn:'7d'})
            res.status(200).json({message:'Logined Successfully',token:token,userId:result._id.toString(),name:result.name})

        })
        .catch(err=>{
            console.log(err)
            if(!err.statusCode){
                err.statusCode = 500
            }
            next(err)
        })
    })
    .catch(err=>{
        console.log(err)
        if(!err.statusCode){
            err.statusCode = 422
        }
        next(err)
    })
})

route.use('/login',(req, res,next)=>{
    res.status(200).json({message:'Working Good'})
})

route.post('/signup',
[
    body('name').not().isEmpty().withMessage('Requires Name').custom((val,{req})=>{
        return User.findOne({name:val})
        .then((result)=>{
            console.log(result)
            if(result){
                return Promise.reject('Please Enter Unique User Name')
            }
        })
    }),
    body('email').not().isEmpty().withMessage('Requires Email').custom((val,{req})=>{
        return User.findOne({email:val})
        .then((result)=>{
            console.log(result)
            if(result){
                return Promise.reject('User Already Exist')
            }
        })
    }),
    body('password').not().isEmpty().withMessage('Password is Empty'),
    body('cpassword').not().isEmpty().withMessage('Confirm Password is Empty')
    
],
(req, res,next)=>{
    console.log(req.body)
    const errors = validationResult(req)
    
    if(!errors.isEmpty()){
        const error = new Error('Validation Error')
        error.cons = errors.array()
        error.statusCode = 422
        throw error
    }
    // User.findOne({name:req.body.name})
    // .then((result)=>{
    //     console.log(result)
    //     if(result){
    //         const error = new Error('User Already Exist')
    //         error.statusCode = 442;
    //         throw error
    //     }
        if(req.body.password != req.body.cpassword){
            const error = new Error('Both Password Should Be Same')
            error.statusCode = 401
            throw error
        }
        bcrypt.hash(req.body.password,12)
        .then((hash)=>{
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password:hash
            })
        user.save()
        // })
        .then((result)=>{
            res.status(201).json({message:'User Signed Up Successfully',userId:result._id})
        })
    })
    .catch(err=>{
        console.log(err)
        if(!err.statusCode){
            err.statusCode = 422
        }
        next(err)
    })
    
})


module.exports = route