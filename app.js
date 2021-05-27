require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const flash = require('connect-flash');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// databaseapp.use


mongoose.connect("mongodb://localhost:27017/studentsDB",{useNewUrlParser: true,useUnifiedTopology: true});

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
     maxlength: 16,
     trim: true,

  },
  googleId:String


});
studentsSchema.plugin(passportLocalMongoose);
studentsSchema.plugin(findOrCreate);
const User = new mongoose.model("User",studentsSchema);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
   res.locals.title = "Tiljala High School";
  res.render("home");
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

app.get("/home1",function(req, res){
  if(req.isAuthenticated()){
    res.render("home1");
  }else{
      req.flash('info', 'You are not logged in yet');
    res.redirect("/login");
  }

});

app.get("/settings",function(req, res){
     res.locals.title = "Settings";
     if(req.isAuthenticated()){
      res.render("settings");
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

app.post("/signup",function(req,res){

User.findOne({username:req.body.username},function(err,founduser){
  if(founduser){
    // console.log(founduser);
    req.flash("msg","This Username is already taken");
    res.redirect("/signup");
  }
  else if(req.body.password===req.body.confirm){
    User.register({username: req.body.username }, req.body.password ,function(err , founduser){
      if(err){
        console.log(err);
        res.redirect("/signup");
      }

      else {
        passport.authenticate("local")(req,res,function(){
          res.redirect("/dashboard");
        });
      }

    });
  }
  else{
    req.flash("msg","Password is not matched !Type password correctly");
    res.redirect("/signup")
  }




});

});
app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  // console.log(req.body);
  User.findOne({username:req.body.username},function(err,founduser){
    // console.log(founduser);
    req.login(user,function(err){

      if(!founduser)
      {
        // console.log(err);
        req.flash('info', 'Username is not registered!');
        res.redirect("/login");
      }else{
        User.authenticate()(req.body.username, req.body.password).then((data) => {
          // console.log(data);
        if(data.user){
          passport.authenticate("local")(req,res,function(){
            res.redirect("/dashboard");
          });
        }else{
          req.flash("info","Password is incorrect");
          res.redirect("/login");
        }
        });



      }
    });
  });

});



app.listen(3000, function(){
  console.log("server started on port 3000");
});
