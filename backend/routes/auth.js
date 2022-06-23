const express = require('express'); //import express
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = 'Raviubj#12';

//Route1: Create a User using: POST "/api/auth/createuser". no login reuired

router.post('/createuser',[
    body('name','Enter valid name').isLength({ min: 4 }),
    body('email','Enter valid email').isEmail(),
    body('password','Valid must be 5 characters').isLength({ min: 5 }),
],async (req,res)=>{
    //If there are error return bad request and error
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }

    try{

    
    //Check wheter user with this email exist
    let user = await User.findOne({email:req.body.email});
    if(user){
        return res.status(400).json({success, error:"Sorry a user with this email already exist"})
    }
    const salt = await bcrypt.genSalt(10)
    const secPass = await bcrypt.hash(req.body.password,salt);
   
        user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      })
      const data = {
        user:{
            id: user.id
        }
      }
      const authtoken = jwt.sign(data,JWT_SECRET);
      success = true;
      res.json({success, authtoken})
    // res.json(user)
    }catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server occured");
    }
})
//Route2: Authentication a User using: POST "/api/auth/login". no login reuired
router.post('/login',[
    body('email','Enter valid email').isEmail(),
    body('password','Password cannot be blank').exists(),
],async (req,res)=>{
    let success = false;
    //If there are error return bad request and error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {email,password} = req.body;
    try{
        let user = await User.findOne({email});
        if(!user){
            success = false;
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            success = false;
            return res.status(400).json({success, error:"Please try to login with correct credentials"});
        }

        const data = {
            user:{
                id: user.id
            }
          }
          const authtoken = jwt.sign(data,JWT_SECRET);
          success = true;
          res.json({success, authtoken})
    }catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server occured");
    }
});

//Route3: Get loggedin User Details using: POST "/api/auth/getuser".Login Required
router.post('/getuser', fetchuser, async (req,res)=>{

try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password")
    res.send(user)
} catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server occured");
}
})
module.exports = router



