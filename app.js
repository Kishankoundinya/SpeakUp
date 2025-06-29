const express = require("express");
const app = express();
const env = require('dotenv').config();
const path = require("path");
const mongoose = require('mongoose');
const userModel = require("./models/user.js");
const postModel = require("./models/post.js");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const ejs = require("ejs");
const jwt = require('jsonwebtoken');
const { emit } = require("process");
const methodOverride = require('method-override')

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));


const PORT=process.env.PORT;
app.listen(PORT, () => {
    console.log("listining on port 3000");
})


////////////////////////REGISTER//HOME PAGE///////////////////////

app.get("/", (req, res) => {
    res.render("Register.ejs");
});
app.post("/", async (req, res) => {

    let { Username, Name, Email, Password } = req.body;
    let user = await userModel.findOne({ Email });
    if (user) return res.send("user already registered");

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(Password, salt, async function (err, hash) {

            let newUser = await userModel.create({
                Name,
                Email,
                Username,
                Password: hash
            });

            let token = jwt.sign({ Email: Email, userId: newUser._id },process.env.secretCode );
            res.cookie("token", token);
            let posts = await postModel.find();
        
        res.render("dashboard.ejs", {
            user: user,
            posts: posts
        });
        });

    });

});
////////////////////////Login///////////////////////

app.get("/login", (req, res) => {
    res.render("login.ejs");
})
app.post("/login", async (req, res) => {

    let { Email, Password } = req.body;
    let user = await userModel.findOne({ Email });
    if (!user) return res.send("user id or password doesn't match");
    let hash = user.Password;



    bcrypt.compare(Password, hash, function (err, result) {
        if (result == true) {
            let token = jwt.sign({ Email: Email, userId: user._id }, process.env.secretCode);
            res.cookie("token", token);
            res.redirect("/dashboard")
        }
        else res.send("wrong username or password try again");
    });




});
////////////////////////Logout///////////////////////

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})
////////////////////middleware for protected routes/////////////

function isLogedIn(req, res, next) {
    if (req.cookies.token === "") return res.redirect("/login");
    else {
        let data = jwt.verify(req.cookies.token, process.env.secretCode);
        req.user = data;

    }
    next();
}
/////////////////////////Profile//SHOW/////////////////////

app.get("/profile", isLogedIn, async (req, res) => {
    let user = await userModel.findOne({ Email: req.user.Email });
    let id=user._id;
    let posts = await postModel.find({user:id});
    res.render("profile.ejs",{posts:posts,user:user});  
});

////////////////////////Dashboard//SHOW//////////////////////

app.get("/dashboard", isLogedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ Email: req.user.Email });
        let posts = await postModel.find();
        
        res.render("dashboard.ejs", {
            user: user,
            posts: posts
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//////////////////////////NEW/////////////////////////////

app.get("/new", (req, res) => {
    res.render("new.ejs");
})

app.post("/new", isLogedIn, async (req, res) => {
    let user = await userModel.findOne({ Email: req.user.Email });
    if (!user) return res.redirect("/login");
    let { content } = req.body;
    if (!content) return res.status(400).send("Content is required");
    await postModel.create({
        content,
        user: user._id,
        username: user.Username,
    });
    res.redirect("/profile");

});
///////////////////////////Post in Details////////////////////////////
app.get("/post/:id",async(req,res)=>{
    let { id } = req.params;
    let post=await postModel.findById(id);
    res.render("show.ejs",{post});
});
/////////////////////////edit posts///////////////////////////////////
app.get("/post/:id/edit",async(req,res)=>{
    let { id } = req.params;
    let post=await postModel.findById(id);
    res.render("edit.ejs",{post});

})
app.patch("/post/:id/edit",async(req,res)=>{
  let { id } = req.params;
  let newContent = req.body.content;
  await postModel.findByIdAndUpdate(
    id,
    { content: newContent },
  );
  res.redirect("/profile");
});
///////////////////////// DELETE POST //////////////////////////
app.delete("/post/:id", async(req, res) => {
    const { id } = req.params;
    await postModel.findByIdAndDelete(id);
    res.redirect("/profile");

});




