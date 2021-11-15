  // **********REQUIRE ALL THE MODULES **********//


  require("dotenv").config();
  const express = require("express");
  const bodyParser = require("body-parser");
  const ejs = require("ejs");
  const mongoose = require("mongoose");
  const session = require("express-session");
  const passport = require("passport");
  const LocalStrategy = require("passport-local").Strategy;
  const passportLocalMongoose = require("passport-local-mongoose");
  const flash = require('connect-flash');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const findOrCreate = require('mongoose-findorcreate');
  const cookieParser = require("cookie-parser");
  const bcrypt = require("bcrypt");
  const saltRounds = 10;


  // **********INITIAL MODULE SET UP **********//
  const app = express();
  app.set('view engine', 'ejs');

  app.use(bodyParser.urlencoded({
    extended: true
  }));
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


  mongoose.connect("mongodb+srv://admin-sagarpapai:Test-123@cluster0.a8ctg.mongodb.net/studentsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // }).then(r => {console.log(r);}).catch(err =>{
    // console.log(err);
  });


  //********* SETTING UP USER SCHEMA AND MODEL********/////
  const noticeSchema = new mongoose.Schema({
    noticeHeading: String,
    noticeBody: String
  });
  const Notice = mongoose.model("Notice", noticeSchema);

  const fatherSchema = new mongoose.Schema({
    fathername: {
      type: String,
    },
    occupation: String,
    mobileno: {
      type: Number,
    },
    email: {
      type: String,
    },
  });

  const Father = mongoose.model("Father", fatherSchema);

  const motherSchema = new mongoose.Schema({
    mothername: {
      type: String,
    },
    occupation: String,
    motherMobileno: {
      type: Number,
    },
    motherEmail: {
      type: String,
    },
  });

  const Mother = mongoose.model("Mother", motherSchema);

  const studentSchema = new mongoose.Schema({
    name: {
      type: String,
    },
    class: {
      type: Number,
    },
    roll: {
      type: Number,
    },
    section: {
      type: String,
    },
    bloodgroup: String,
    studentAddress: {
      type: String,
    },
    fatherDetails: fatherSchema,
    motherDetails: motherSchema
  });

  const Student = new mongoose.model("Student", studentSchema);



  const studentsSchema = new mongoose.Schema({


    username: {
      type: String,
      // required:true
    },

    password: {
      type: String,
      minlength: 3,

      trim: true,

    },
    googleId: String,


    studentDetails: studentSchema


  });
  const User = new mongoose.model("User", studentsSchema);

  const adminsSchema = new mongoose.Schema({

    username: String,
    password: {
      type: String,
      minlength: 3,

      trim: true,

    },
  });
  const Admin = new mongoose.model("Admin", adminsSchema);
  // username= "hironmoychowdhury7@gmail.com",
  // password="this@690",
  //
  //     bcrypt.hash(password, saltRounds, function(err, hash) {
  //       // Store hash in your  DB.
  //
  //       const admin  = new Admin({
  //         username: username,
  //         password: hash
  //       });
  //       admin.save(function(err) {
  //         if (err)
  //           console.log(err);
  //         else
  //         console.log("updated");
  //       });
  //
  //     });



  //******CONFIGURE PASSPORT MIDDDLEWARE********//


  const customFields = {
    usernameField: 'username',
    passwordField: 'password'
  };
  const admincustomFields = {
    usernameField: 'adminname',
    passwordField: 'adminpassword'
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
      bcrypt.compare(password, user.password, function(err, result) {
        // console.log(result);
        // console.log(user.password);
        if (result === true)
          return cb(null, user);
        else {
          return cb(null, false, {
            error: "Incorrect password"
          });
        }
      });

    } catch (err) {
      cb(err);
    }
  }

  const adminloginCallback = async (adminname, adminpassword, cb) => {



    try {
      const admin = await Admin.findOne({
        username: adminname
      });
      if (!admin) {
        return cb(null, false, {
          error: "This email is not registered for admin"
        })
      }
      // checking the password is correct or not in the time of login
      bcrypt.compare(adminpassword, admin.password, function(err, result) {
        // console.log(result);
        // console.log(user.password);
        if (result === true)
          return cb(null, admin);
        else {
          return cb(null, false, {
            error: "Incorrect password"
          });
        }
      });

    } catch (err) {
      cb(err);
    }
  }




  const strategy = new LocalStrategy(customFields, loginCallback);
  const adminstrategy = new LocalStrategy(admincustomFields, adminloginCallback);


  studentsSchema.plugin(passportLocalMongoose);
  studentsSchema.plugin(findOrCreate);

  passport.use(strategy);
  passport.use('admin', adminstrategy);


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, cb) {
    User.findById(id, function(err, user) {
      if (err) {
        return cb(err);
      }
      if (user) {
        cb(null, user);
      } else {
        Admin.findById(id, function(err, user) {
          if (err) {
            return cb(err);
          }
          cb(null, user);
        });
      }
    }).then(result => {
      // console.log("deserialized");
      // mongoose.connection.close();
    }).catch(err => {
      console.log(err);
    });
  });
  //******CREATING GOOGLE STRATEGY*****//
  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(req, accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      information = '0'; //assigning 0 to the information value just not to reflect it first time after the login
      u = '';
      User.findOne({
        googleId: profile.id
      }, function(err, user) {
        if (err) {
          return cb(err, null);
        }
        if (!user) {
          user = new User({
            googleId: profile.id

          });
          user.save(function(err) {
            if (err) console.log(err);
            // res.cookie("username", user.googleId);
            // console.log(req);
            return cb(err, user);
          });
        } else {
          //found user. Return

          // console.log(accessToken);
          // console.log(refreshToken);
          // console.log(req);
          return cb(err, user);
        }
      });
    }
  ));

  //declaring some global variables

  let information = ''; //information from the change password section
  let u = ''; //store the username after login to pass the cookie
  let s = ''; //to check the password field of the username that is sent as a cookie


  //starting of the get routes
  app.get("/", function(req, res) {
    res.locals.title = "Tiljala High School";
    res.render("home")
    // if (req.isAuthenticated()) {
    //   res.render("home1");
    // } else {
    //   res.render("home");
    // }
  });
  app.get("/pdfs/syllabus", function(req, res) {
    res.sendFile(__dirname + '/pdfs/syllabus.pdf');
  });
  app.get("/auth/google",
    passport.authenticate('google', {
      scope: ["profile"]
    }));
  app.get("/auth/google/secrets", function(req, res, next) {
    passport.authenticate('google', function(err, user) {
      if (err) {
        req.flash("info", "error");
        return res.redirect("/login")
      }
      if (!user) {
        req.flash("info", "YOu Are not logged in yet")
        return res.redirect('/login')

      }
      if (req.cookies.username) {
        res.clearCookie('username');
        req.logout();
      }
      req.login(user, function(err) {
        if (err) {
          req.flash("info", "error");
          return res.redirect("/login")
        }
        res.cookie("id", user.googleId);
        res.redirect('/dashboard');



      })




    })(req, res, next);





  });


  app.get("/aboutus", function(req, res) {
    res.locals.title = "About Us";
    res.render("aboutus");
  });


  app.get("/academic", function(req, res) {
    res.locals.title = "Academic";
    if (req.isAuthenticated()) {
      res.render("academic");
    } else {
      console.log(err);
      req.flash('info', 'You are not logged in yet');
      res.redirect("/login", req.flash);
    }

  });

  app.get("/dashboard", function(req, res) {
    res.locals.title = "Dashboard";
    // console.log(req.flash('info'));
    if (req.isAuthenticated()) {
      async function dataFetch() {
        if (req.cookies.username) {
          await User.findOne({
            username: req.cookies.username
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("dashboard", {
                studentData: founduser.studentDetails
              });
            }
          })
        } else {
          await User.findOne({
            googleId: req.cookies.id
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("dashboard", {
                studentData: founduser.studentDetails
              });
            }
          })
        }
      }

      dataFetch();
    } else {
      req.flash('info', 'You are not logged in yet');
      res.redirect("/login");
    }
  });

  app.get("/myprofile", function(req, res) {
    res.locals.title = "Myprofile";
    if (req.isAuthenticated()) {
      async function dataFetch() {
        if (req.cookies.username) {
          await User.findOne({
            username: req.cookies.username
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("myprofile", {
                studentData: founduser.studentDetails
              });
            }
          })
        } else {
          await User.findOne({
            googleId: req.cookies.id
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("myprofile", {
                studentData: founduser.studentDetails
              });
            }
          })
        }

      }
      dataFetch();
    } else {
      req.flash('info', 'You are not logged in yet');
      res.redirect("/login");
    }
  });

  app.get("/notice", function(req, res) {
    res.locals.title = "Notice";
    Notice.find({}, function(err, foundNotice) {
      if (err) {
        console.log(err)
      } else {
        res.render("notice", {
          foundNotice: foundNotice
        });
      }
    })
  });
  app.get("/resources", function(req, res) {
    res.locals.title = "Resources";
    res.render("resources");
  });



  app.get("/settings", function(req, res) {
    res.locals.title = "Settings";
    if (req.isAuthenticated()) {
      async function dataFetch() {
        if (req.cookies.username) {
          await User.findOne({
            username: req.cookies.username
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("settings", {
                usercookiemail: req.cookies.username,
                infor: information,
                studentData: founduser.studentDetails
              });
            }
          })
        } else {
          await User.findOne({
            googleId: req.cookies.id
          }, function(err, founduser) {
            if (err) {
              console.log(err);
            } else if (founduser) {

              res.render("settings", {
                usercookiemail: null,
                infor: information,
                studentData: founduser.studentDetails
              });
            }
          })
        }

      }
      dataFetch();

    } else {
      req.flash('info', 'You are not logged in yet');
      res.redirect("/login");
    }

  });

  app.get("/syllabus", function(req, res) {
    res.locals.title = "Syllabus";
    res.render("syllabus");
  });

  app.get("/login", function(req, res) {

    res.locals.title = "Login";
    res.render("login", {
      error: req.flash("info")
    });


  });



  app.get("/signup", function(req, res) {
    res.locals.title = "Signup";
    res.render("signup", {
      msg: req.flash("msg")
    });
  });

  app.get("/logout", function(req, res) {
    if (req.isAuthenticated()) {
      if (req.cookies.id)
        res.clearCookie('id');
      else
        res.clearCookie('username')
      req.logout();
      res.redirect("/");

    } else {
      req.flash('info', 'You are not logged in yet!');
      res.redirect("/login");
    }
  });



  app.get("/admin/logout", function(req, res) {
    if (req.isAuthenticated()) {
      res.clearCookie('adminusername')
      req.logout();
      res.redirect("/");
    } else {
      req.flash('inf', 'You are not logged in yet!');
      res.redirect("/admin_signin");
    }
  });


  app.get("/admin", function(req, res) {


    if (req.cookies.adminusername) {
      res.render("admin");
    } else {
      req.flash('inf', 'You are not logged in yet');
      res.redirect("/admin_signin");
    }


  });



  app.get("/admin_signin", function(req, res) {
    // res.locals.title = "About Us";

    res.render("admin_signin", {
      error: req.flash("inf")
    });
  });


  app.get("/Deletenotice", function(req, res) {
    if (req.cookies.adminusername) {
      Notice.find({}, function(err, deleteNotice) {
        if (err) {
          console.log(err)
        } else {
          res.render("Deletenotice", {
            deleteNotice: deleteNotice
          });
        }
      });
    } else {
      req.flash('inf', 'You are Not Logged In Yet');
      res.redirect("/admin_signin");
    }

  });

  app.post("/myprofile", function(req, res) {

    const father = new Father({
      fathername: req.body.fatherName,
      occupation: req.body.fatherOccupation,
      mobileno: req.body.fatherMobile,
      email: req.body.fatherEmail
    });

    const mother = new Mother({
      mothername: req.body.motherName,
      occupation: req.body.motherOccupation,
      motherMobileno: req.body.motherMobile,
      motherEmail: req.body.motherEmail,
    });
    //  if (req.body.fatherMobile.length === 10 && req.body.fatherEmail.includes('@') && req.body.motherEmail.includes('@') && req.body.motherMobileno.length === 10) {
    const studentAll = new Student({
      name: req.body.name,
      class: req.body.class,
      roll: req.body.rollno,
      section: req.body.section,
      bloodgroup: req.body.blood,
      studentAddress: req.body.address,
      fatherDetails: father,
      motherDetails: mother
    });


    if (req.cookies.username) {
      User.updateOne({
        username: req.cookies.username
      }, {
        studentDetails: studentAll
      }, function(err) {
        if (err) {
          console.log(err);
        } else {
          // console.log("Updated details");
        }
      });

    } else {
      User.updateOne({
        googleId: req.cookies.id
      }, {
        studentDetails: studentAll
      }, function(err) {
        if (err) {
          console.log(err);
        } else {
          // console.log("Updated details");
        }
      });
    }



    res.render("myprofile", {
      studentData: studentAll
    });
    // } else {
    //   res.render("dashboard", {
    //     studentData: null
    //   });
    // }



  });

  app.post("/notice", function(req, res) {

    const noticeHeading = req.body.noticeHeading;
    const noticeBody = req.body.noticeBody;
    // console.log(noticeHeading, noticeBody);
    const notice = new Notice({
      noticeHeading: noticeHeading,
      noticeBody: noticeBody
    });
    notice.save();
    if (req.cookies.adminusername)
      res.redirect("/Deletenotice");
    else
      res.redirect("/admin_signin");

  });

  app.post("/admin_signin", async function(req, res, next) {

    passport.authenticate('admin', function(err, admin, info) {
      if (err) {
        console.error(err);
        req.flash('inf', 'Error occuured please try again!');
        return res.redirect("/admin_signin");
      }

      if (!admin) {
        req.flash('inf', info.error);
        console.log("no");
        return res.redirect('/admin_signin');
      }

      req.logIn(admin, function(err) {
        if (err) {
          req.flash('inf', 'Error occuured please try again!!');
          return res.redirect("/admin_signin");
        }


        res.cookie("adminusername", admin.username);
        // u=user.username;//store the username to pass the cookie
        // s=(user.password);//store the password of the user for further change to new password
        // information = "0"; //assigning 0 to the information value just not to reflect it first time after the login

        res.render('admin');
      });

    })(req, res, next);


  });

  app.post("/admin", function(req, res) {
    res.locals.title = "Notice";
    res.render("Deletenotice");
  });

  app.post("/Deletenotice", function(req, res) {
    const delnotid = req.body.noticeid;
    Notice.deleteOne({
      _id: delnotid
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        return res.redirect("/Deletenotice");
      }
    })
  })

  // post routes
  app.post("/settings", function(req, res) {
    async function changePassword() {
      await User.findOne({
        username: req.cookies.username
      }, function(err, founduser) {
        if (err) {
          console.log(err);
        } else if (founduser) {
          bcrypt.compare(req.body.oldPassword, founduser.password, function(err, result) {
            // console.log(result);
            // console.log(user.password);
            if (result === true) {
              if (req.body.newPassword.length < 3 || req.body.cnewPassword.length < 3) {
                information = "Password must be of 3 characters";

                res.redirect("/settings");
              } else if (req.body.newPassword === req.body.cnewPassword) {
                bcrypt.hash(req.body.newPassword, saltRounds, function(err, hash) {
                  User.findOneAndUpdate({
                    username: req.cookies.username
                  }, {
                    password: hash
                  }, function(err) {
                    if (err)
                      console.log(err);
                    else {
                      console.log("successfully updated");
                    }
                  });
                  information = "Successfully updated the Password";
                  res.redirect("/settings");
                });
              } else {
                information = "Type the New password correctly";
                res.redirect("/settings");
              }
            } else {
              information = "The Old password is incorrect";
              res.redirect("/settings");
            }
          });
        }
      });

    }
    changePassword();
  });


  app.post("/editprofile", function(req, res) {
    async function editProfile() {
      if (req.cookies.username) {
        const user = await User.findOne({
          username: req.cookies.username
        }, function(err, founduser) {
          if (err) {
            console.log(err);
          } else if (founduser) {
            let fatherEmail = '';
            let motherMobile = '';
            let fatherMobile = '';
            let motherEmail = '';
            if (req.body.fatherMobile.length === 10) {
              fatherMobile = req.body.fatherMobile;
            }

            if (req.body.motherMobile.length === 10) {
              motherMobile = req.body.motherMobile;
            }

            if (req.body.fatherEmail.length >= 3) {
              fatherEmail = req.body.fatherEmail;
            }

            if (req.body.motherEmail.length >= 2) {
              motherEmail = req.body.motherEmail;
            }

            User.replaceOne({
              username: req.cookies.username
            }, {
              _id: founduser._id,
              username: founduser.username,
              password: founduser.password,
              studentDetails: {

                _id: founduser.studentDetails._id,
                name: founduser.studentDetails.name,
                class: founduser.studentDetails.class,
                roll: founduser.studentDetails.roll,
                section: founduser.studentDetails.section,
                bloodgroup: founduser.studentDetails.bloodgroup,
                studentAddress: founduser.studentDetails.studentAddress,
                fatherDetails: {
                  _id: founduser.studentDetails.fatherDetails._id,
                  fathername: founduser.studentDetails.fatherDetails.fathername,
                  occupation: founduser.studentDetails.fatherDetails.occupation,
                  mobileno: (fatherMobile.length > 0) ? fatherMobile : founduser.studentDetails.fatherDetails.mobileno,
                  email: (fatherEmail.length > 0) ? fatherEmail : founduser.studentDetails.fatherDetails.email
                },
                motherDetails: {
                  _id: founduser.studentDetails.motherDetails._id,
                  mothername: founduser.studentDetails.motherDetails.mothername,
                  occupation: founduser.studentDetails.motherDetails.occupation,
                  motherMobileno: (motherMobile.length > 0) ? motherMobile : founduser.studentDetails.motherDetails.motherMobileno,
                  motherEmail: (motherEmail.length > 0) ? motherEmail : founduser.studentDetails.motherDetails.motherEmail
                },
              }
            }, function(err) {
              if (err) {
                console.log(err);
              } else {

              }
            })
            information = "Successfully Updated Your Details"
            res.render("settings", {
              usercookiemail: req.cookies.username,
              infor: information,
              studentData: founduser.studentDetails
            })




          }
        })
      } else if (req.cookies.id) {
        const user = await User.findOne({
          googleId: req.cookies.id
        }, function(err, founduser) {
          if (err) {
            console.log(err);
          } else if (founduser) {
            let fatherEmail = '';
            let motherMobile = '';
            let fatherMobile = '';
            let motherEmail = '';
            if (req.body.fatherMobile.length === 10) {
              fatherMobile = req.body.fatherMobile;
            }

            if (req.body.motherMobile.length === 10) {
              motherMobile = req.body.motherMobile;
            }

            if (req.body.fatherEmail.length >= 3) {
              fatherEmail = req.body.fatherEmail;
            }

            if (req.body.motherEmail.length >= 2) {
              motherEmail = req.body.motherEmail;
            }

            User.replaceOne({
              googleId: req.cookies.id
            }, {
              _id: founduser._id,
              googleId: founduser.googleId,
              studentDetails: {

                _id: founduser.studentDetails._id,
                name: founduser.studentDetails.name,
                class: founduser.studentDetails.class,
                roll: founduser.studentDetails.roll,
                section: founduser.studentDetails.section,
                bloodgroup: founduser.studentDetails.bloodgroup,
                studentAddress: founduser.studentDetails.studentAddress,
                fatherDetails: {
                  _id: founduser.studentDetails.fatherDetails._id,
                  fathername: founduser.studentDetails.fatherDetails.fathername,
                  occupation: founduser.studentDetails.fatherDetails.occupation,
                  mobileno: (fatherMobile.length > 0) ? fatherMobile : founduser.studentDetails.fatherDetails.mobileno,
                  email: (fatherEmail.length > 0) ? fatherEmail : founduser.studentDetails.fatherDetails.email
                },
                motherDetails: {
                  _id: founduser.studentDetails.motherDetails._id,
                  mothername: founduser.studentDetails.motherDetails.mothername,
                  occupation: founduser.studentDetails.motherDetails.occupation,
                  motherMobileno: (motherMobile.length > 0) ? motherMobile : founduser.studentDetails.motherDetails.motherMobileno,
                  motherEmail: (motherEmail.length > 0) ? motherEmail : founduser.studentDetails.motherDetails.motherEmail
                },
              }
            }, function(err) {
              if (err) {
                console.log(err);
              } else {

              }
            })
            information = "Successfully Updated Your Details"
            res.render("settings", {
              usercookiemail: null,
              infor: information,
              studentData: founduser.studentDetails
            })




          }
        })
      }
    }
    editProfile();
  })


  app.post("/studentlist", function(req, res) {


    const key = Number(req.body.btn);
    console.log(key);
    const s = [];

    // console.log(key);
    async function k() {
      await User.find({}, function(err, students) {
        if (err) {
          console.log(err);
        } else {
          function compare(a, b) {

            if (a.studentDetails.roll < b.studentDetails.roll ) {
              return -1;
            }
            if (a.studentDetails.roll > b.studentDetails.roll ) {
              return 1;
            }

          }



          students.forEach(function(student) {
            if (student.studentDetails) {
              if (student.studentDetails.class === key)
                s.push(student);
            }


          });
          s.sort(compare);
          // console.log(s);
        }
      });

      res.render("studentlist", {
        students: s
      });
    }

    k();
  });


  app.post("/signup", function(req, res) {
    let ans = 0;


    // else
    // {
    //   signupProcess();
    // }




    async function signupProcess() {

      try {

        await User.findOne({
          username: req.body.username
        }, function(err, founduser) {
          if (founduser)
            ans = 1;
        }) //Checking the email is already present or not
        // console.log(ans);
        if (ans) {

          req.flash("msg", "This Username is already taken");
          res.redirect("/signup");
        } else if (req.body.password.length < 3 || req.body.confirm.length < 3) {

          req.flash("msg", "Password must be of 3 characters");
          res.redirect("/signup");
        } else if (req.body.password != req.body.confirm) {

          req.flash("msg", "Password is not matched !Type password correctly");
          res.redirect("/signup");
        } else if (req.body.password === req.body.confirm) {
          var g = req.body.checked;
          // console.log(g);
          if (g != 'on') {
            req.flash("msg", "Please Confirm The Privacy and policy section");
            return res.redirect("/signup");
          }

          bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            // Store hash in your  DB.

            user = new User({
              username: req.body.username,
              password: hash
            });
            user.save(function(err) {
              if (err)
                console.log(err);
              else
                res.redirect("/login");
            });

          });
        }
      } catch (err) {
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
      if (req.cookies.id) {
        res.clearCookie('id');
        req.logout();
      }




      req.logIn(user, function(err) {
        if (err) {
          req.flash('info', 'Error occuured please try again!!');
          return res.redirect("/login.ejs");
        }

        res.cookie("username", user.username);
        // u=user.username;//store the username to pass the cookie
        // s=(user.password);//store the password of the user for further change to new password
        information = "0"; //assigning 0 to the information value just not to reflect it first time after the login
        if (user.studentDetails == null) {

          return res.redirect('dashboard');
        } else {

          res.render('dashboard', {
            studentData: user.studentDetails
          });
        }

      });

    })(req, res, next);
  });




  app.listen(3000, function() {
    console.log("server started on port 3000");
  });
