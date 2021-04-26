const express = require("express");
const bodyParser = require("body-parser");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req,res){
  res.render("home");
});

app.get("/aboutus",function(req, res){
  res.render("aboutus");
});

app.get("/academic",function(req, res){
  res.render("academic");
});

app.get("/dashboard",function(req, res){
  res.render("dashboard");
});

app.get("/myprofile",function(req, res){
  res.render("myprofile");
});

app.get("/notice",function(req, res){
  res.render("notice");
});

app.get("/resources",function(req, res){
  res.render("resources");
});

app.get("/settings",function(req, res){
  res.render("settings");
});

app.get("/syllabus",function(req, res){
  res.render("syllabus");
});

app.get("/login",function(req, res){
  res.render("login");
});

app.get("/signup",function(req, res){
  res.render("signup");
});

app.get("/admin",function(req, res){
  res.render("admin");
});





app.listen(3000, function(){
  console.log("server started on port 3000");
});
