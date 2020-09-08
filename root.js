const express = require('express');
const routes = require('express').Router();
var bodyparser=require('body-parser');
const bcrypt=require('bcryptjs'); // its is use to encode use passord while er store it into dbs
const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');
const flash =require('connect-flash');
const userModel=require('./moddels');
const mongoose = require('mongoose');



routes.use(bodyparser.urlencoded({extended:true}));
routes.use(bodyparser.json());

mongoose.connect(
  'mongodb://localhost:27017/todolist'
  , {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  });

routes.use(cookieParser('secret'));//secret is akey value  and main thing is we need to innitialize before passport initialize
routes.use(session({
  secret:'secret', // its key that contain all info that we going to encrypt all of the information for us
  maxAge:3600000, //cokkies persistan till given time so user can loggin untill time finished
  resave:true,
  saveUninitialized:true,

}));
routes.use(passport.initialize());
routes.use(passport.session());

routes.use(flash());
//global variable
routes.use((req,res,next)=>{//it is a middleware
  res.locals.success_message=req.flash('success_message');//lest side is a attribute and right side is value so both are same
  res.locals.error_message=req.flash('error_message');
  res.locals.error=req.flash('error');
  next();
});
//ensure authentication
const checkAuthenticated=function(req,res,next){
    if(req.isAuthenticated()){
      res.set('Cache-Control','no-cache,private,no-store,must-revalidate,post-check=0,pre-check=0');
      return next();
    }else{
      res.redirect('/login');
    }

}


routes.get('/', (req, res) => {
    res.render('signup',{ err:'' , fname:'',email :''}); 	
});

routes.post('/signup',(req,res)=>{
    var {fname,email,password,c_password}=req.body;// its all the value that we given as name in our form //this is call object destruing

    if(!email || !fname || !password || !c_password){
      err="please fill all the fields";
      res.render('signup',{'err':err,name:'',email:''} ); //left sidde err is a attribter and right sidei s a value
    }
    if(password.length<8){
      err="write atleast 8 character password";
      res.render('signup',{'err':err,'fname':'','email':''});// if password does not match so automatically all fields remove to display other field we need to use it
    }

    if(password != c_password){
      err="passwprd don't match";
      res.render('signup',{'err':err,'fname':fname,'email':email});// if password does not match so automatically all fields remove to display other field we need to use it
    }
    
    if( typeof err == 'undefined'){  //use it by password
      userModel.findOne({email:email},(err,data)=>{
        console.log(data);
        if (err) throw err;
        if(data){ //it just check user exixt or not

        console.log("user exist");
        err="user already exist with this email..";
        res.render('signup',{'err':err,'fname':'','email':''});
        }
        else{ //it run when there is no user available so we need to add it into dbs..
            bcrypt.genSalt(10,(err,salt)=>{ //it is use to encode password
              if (err) throw err;
              bcrypt.hash(password ,salt ,(err,hash)=>{
                console.log(hash);
                if(err) throw err;
                password=hash;

                //model object
                var userdetail=new userModel({
                  firstName:fname,
                  email :email,
                  password :password,
                });
                userdetail.save((err,data)=>{
                  console.log(data);
                  if(err) throw err;
                  // if(data){
                  // res.render('home');
                  // }
                  if(data){
                    req.flash('success_message','regester sussesfully login to continue');
                    res.redirect('/login'  );
                   }

                });
              });
            });
        }

      });
    }
});
// login process start from here
//authentication stratery
const localstrategy=require('passport-local').Strategy;
passport.use(new localstrategy( {usernameField:'email'},(email,password,done)=>{
//match user
 
  userModel.findOne({email:email},(err,user)=>{//username tHAT WE GIVEN IN LABLE FOR="USERNAME"
  console.log(user);
    if(err) throw err;
    if(!user){  //if we cant not find such data from dbs
      return done(null,false,{message:"user doesnt exist"});
    }

    
    //match passowrd
    bcrypt.compare(password,user.password,(err,match)=>{
      if (err) {
        return done(null,false);
      }
      if(!match){
        return done(null,false,{message:"password doesnt match"});
      }
      if(match){
        return done(null,user); //we find user by it
      }
    });
  });  
})); 


//serializing user
passport.serializeUser(( user,ser)=>{  //add user in the session
  ser(null, user.id);   //ser is a verified callback
  console.log(user.id);
});
passport.deserializeUser((id,ser)=>{ //remove the user from session
   userModel.findById(id,(err, user)=>{
    ser(err, user);
  });
});

//end of authentication strategy



routes.post('/login',(req,res,next)=>{
  passport.authenticate('local',{  //locsl shows local stratergyes //second arg is a callback
    failureRedirect : '/login', //this are the properties
    successRedirect:'/home',
    failureFlash:true
  })(req,res,next);   //it behave like middleware
});

//add message
routes.post('/newtodo',checkAuthenticated,(req,res)=>{
  userModel.findOneAndUpdate(
    {
      email:req.user.email,
    },
    {
      $push:{ //$push is used to push elements in array
        todolist:req.body.item,
        
      }
    },(err,suc)=>{
      if(err) throw err;
      if(suc) console.log("added succesfully");
    }
  
  );
  res.redirect('/home');
});



routes.get('/login',(req,res)=>{
  res.render('login');
});
routes.get('/home',checkAuthenticated,(req,res)=>{
  res.render('home',{'user':req.user});
 
});
routes.get('/logout',(req,res)=>{
  req.logOut();
  res.redirect('/login');
});  

routes.get('/:id',(req,res)=>{
  userModel.findById(req.parama.id,(err,doc)=>{
    if (err) throw err;
    res.render("home",{
        details:doc
    });

  });
});

routes.get('/delete/:id',(req,res)=>{
        res.send(req.params.id);
  // userModel.findIdAndRemove(req.params.id,(err,doc)=>{
  //     if(!err){z
  //       res.redirect('home');
  //     }
  //     else{
  //       console.log("error find"+err)
  //     }
  });
 

//export module
module.exports=routes;