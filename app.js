  // **********REQUIRE ALL THE MODULES **********//


require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport=require("passport");
const LocalStrategy=require("passport-local").Strategy;
const passportLocalMongoose=require("passport-local-mongoose");
const flash = require('connect-flash');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const cookieParser=require("cookie-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;


  // **********INITIAL MODULE SET UP **********//
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

  // **********SESSION SETUP with COOKIE PARSER**********//
  app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// ************CONNECT TO MONGODB*************//


mongoose.connect("mongodb://localhost:27017/studentsDB",{useNewUrlParser: true,useUnifiedTopology: true});


//********* SETTING UP USER SCHEMA AND MODEL********/////
const studentsSchema = new mongoose.Schema({
  // firstname : {
  //    type:String,
  //    required:true
  // } ,
  //
  // lastname : {
  //   type:String,
  //   required:true
  // },

  username:{
    type: String,
    // required:true
  },
  // phonenumber :{
  //   type:Number,
  //   minlength:10,
  //    maxlength: 10,
  //    required:true
  // },
  password:{
    type: String,
     minlength: 3,

     trim: true,

  },
  googleId:String


});
const User = new mongoose.model("User",studentsSchema);



//******CONFIGURE PASSPORT MIDDDLEWARE********//


const customFields = {
  usernameField: 'username',
  passwordField: 'password'
};

const loginCallback = async (username, password, cb) => {



  try {
    const user = await User.findOne({
      username: username
    });
    if (!user) {
      return cb(null, false, {
        error: "This email is not registered"
      })
    }
    // checking the password is correct or not in the time of login
    bcrypt.compare(password, user.password , function(err, result) {
    // console.log(result);
    // console.log(user.password);
    if(result === true)
      return cb(null, user);
    else{
      return cb(null, false, {
        error: "Incorrect password"
    });
  }
});

  } catch (err) {
    cb(err);
  }
}
const strategy = new LocalStrategy(customFields,loginCallback);

studentsSchema.plugin(passportLocalMongoose);
studentsSchema.plugin(findOrCreate);

passport.use(strategy);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//******CREATING GOOGLE STRATEGY*****//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    information='0';//assigning 0 to the information value just not to reflect it first time after the login
   u='';
    User.findOne({ googleId: profile.id }, function (err, user) {
      if (err) {
          return cb(err);
      }
      if (!user) {
          user = new User({
              googleId : profile.id
          });
          user.save(function(err) {
              if (err) console.log(err);

              return cb(err, user);
          });
    }else {
        //found user. Return

        return cb(err, user);
    }
  });
}
));

//declaring some flobal variables

let information ='';//information from the change password section
let u='';//store the username after login to pass the cookie
let s = '';//to check the password field of the username that is sent as a cookie


//starting of the get routes
app.get("/", function(req,res){
   res.locals.title = "Tiljala High School";
   if(req.isAuthenticated()){
    res.render("home1");
  }else{
    res.render("home");
  }
});
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"]
}));
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect:" /login" }),
  function(req, res) {
    // Successful authentication, redirect to dashbopard.
    res.redirect('/dashboard');
  });


app.get("/aboutus",function(req, res){
   res.locals.title = "About Us";
  res.render("aboutus");
});

app.get("/academic",function(req, res){
   res.locals.title = "Academic";
   if(req.isAuthenticated()){
    res.render("academic");
   }else{
     console.log(err);
    req.flash('info', 'You are not logged in yet');
     res.redirect("/login",req.flash);
   }

});

app.get("/dashboard",function(req, res){
   res.locals.title = "Dashboard";
   if(req.isAuthenticated()){
     res.render("dashboard");
   }else{
       req.flash('info', 'You are not logged in yet');
     res.redirect("/login");
   }
});

app.get("/myprofile",function(req, res){
   res.locals.title = "Myprofile";
   if(req.isAuthenticated()){
     res.render("myprofile");
   }else{
       req.flash('info', 'You are not logged in yet');
     res.redirect("/login");
   }
});

app.get("/notice",function(req, res){
     res.locals.title = "Notice";
  res.render("notice");
});

app.get("/resources",function(req, res){
     res.locals.title = "Resources";
  res.render("resources");
});

// app.get("/home1",function(req, res){
//   if(req.isAuthenticated()){
//     res.render("home1");
//   }else{
//       req.flash('info', 'You are not logged in yet');
//     res.redirect("/login");
//   }
//
// });

app.get("/settings",function(req, res){
     res.locals.title = "Settings";
     if(req.isAuthenticated()){
       // console.log(information);
       // console.log(s);
       res.render("settings",{usercookie:s,usercookiemail:u,infor:information});
     }else{
         req.flash('info', 'You are not logged in yet');
       res.redirect("/login");
     }

});

app.get("/syllabus",function(req, res){
     res.locals.title = "Syllabus";
  res.render("syllabus");
});

app.get("/login",function(req, res){
     res.locals.title = "Login";
  res.render("login",{error:req.flash("info")});
});

app.get("/signup",function(req, res){
    res.locals.title = "Signup";
  res.render("signup",{msg:req.flash("msg")});
});

app.get("/admin",function(req, res){
  res.render("admin");
});


// post routes
app.post("/settings",function(req,res)
{
   async function changePassword ()
   {
  await  User.findOne({username:u},function(err,founduser)
  {
    if(err){
      console.log(err);
    }
    else if(founduser){
      s=founduser.password;
      console.log(s);
    }
  });
      bcrypt.compare(req.body.oldPassword, s , function(err, result) {
     // console.log(result);
     // console.log(user.password);
     if(result === true)
        {
          if(req.body.newPassword.length<3 || req.body.cnewPassword.length<3)
          {
            information="Password must be of 3 characters";

            res.redirect("/settings");
          }
          else if (req.body.newPassword===req.body.cnewPassword)
          {
             bcrypt.hash(req.body.newPassword, saltRounds, function(err, hash) {
               User.findOneAndUpdate({username:u},{password:hash},function(err){
                 if(err)
                 console.log(err);
                 else{
                   console.log("successfully updated");
                 }
               });
               information="Successfully updated the Password";
               res.redirect("/settings");
             });
          }
          else{
            information="Type the New password correctly";
            res.redirect("/settings");
          }
        }else{
        information="The Old password is incorrect";
          res.redirect("/settings");
        }
 });
   }
   changePassword();
});





app.post("/signup",function(req,res){
  let ans = 0;



  async function signupProcess(){

   try{
     await User.findOne({username:req.body.username},function(err,founduser){
       if(founduser)
       ans = 1;
     }) //Checking the email is already present or not
     // console.log(ans);
     if (ans){

         req.flash("msg","This Username is already taken");
         res.redirect("/signup");
     }else if(req.body.password.length<3||req.body.confirm.length<3){

         req.flash("msg","Password must be of 3 characters");
          res.redirect("/signup");
     }else if(req.body.password!=req.body.confirm){

     req.flash("msg","Password is not matched !Type password correctly");
       res.redirect("/signup");
   }else if(req.body.password===req.body.confirm){

     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      // Store hash in your  DB.
      console.log(hash);
      user = new User({
        username:req.body.username,
        password:hash
      });
      user.save(function(err){
        if(err)
        console.log(err);
        else
        res.redirect("/login");
      });

  });
   }
  }catch (err) {
    console.log(err);
      }

    }
    signupProcess();

});



app.post('/login', function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.error(err);
      req.flash('info', 'Error occuured please try again!');
      return res.redirect("/login");
    }

    if (!user) {
      req.flash('info', info.error);
      return res.redirect('/login');
    }

    req.logIn(user, function(err) {
      if (err) {
        req.flash('info', 'Error occuured please try again!!');
        return res.redirect("/login.ejs");
      }
      res.cookie("username", user.username);
      u=user.username;//store the username to pass the cookie
      s=(user.password);//store the password of the user for further change to new password
      information="0";//assigning 0 to the information value just not to reflect it first time after the login

      return res.redirect('dashboard');
    });

  })(req, res, next);
});


// app.post("/login",function(req,res){
//   const user = new User({
//     username:req.body.username,
//     password:req.body.password
//   });
//
//   // console.log(req.body);
//   User.findOne({username:req.body.username},function(err,founduser){
//     // console.log(founduser);
//     req.login(user,function(err){
//
//       if(!founduser)
//       {
//         // console.log(err);
//         req.flash('info', 'Username is not registered!');
//         res.redirect("/login");
//       }else{
//        User.authenticate()(req.body.username, req.body.password).then(async (data) => {
//
//         if(data.user){
//         await passport.authenticate("local")(req,res,function(){
//             console.log(data);
//             res.redirect("/dashboard");
//           });
//         }else{
//           req.flash("info","Password is incorrect");
//           res.redirect("/login");
//         }
//         });
//
//
//
//       }
//     });
//   });
//
// });



app.listen(3000, function(){
  console.log("server started on port 3000");
});
