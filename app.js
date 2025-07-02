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
const methodOverride = require('method-override');

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
})

////////////////////////REGISTER//HOME PAGE///////////////////////

app.get("/", (req, res) => {
    res.render("Register.ejs");
});

app.post("/", async (req, res) => {
    const { Username, Name, Email, Password } = req.body;
    const existingUser = await userModel.findOne({ Email });
    if (existingUser) return res.send("user already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(Password, salt, async (err, hash) => {
            if (err) return res.status(500).send("Error while hashing password");

            const newUser = await userModel.create({
                Name,
                Email,
                Username,
                Password: hash
            });

            const token = jwt.sign({ Email, userId: newUser._id }, process.env.secretCode);
            res.cookie("token", token);

            let posts = await postModel.find().sort({ date: -1 });

            res.render("dashboard.ejs", { user: newUser, posts });
        });
    });
});

////////////////////////Login///////////////////////

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.post("/login", async (req, res) => {
    const { Email, Password } = req.body;
    const user = await userModel.findOne({ Email });
    if (!user) return res.send("user id or password doesn't match");

    bcrypt.compare(Password, user.Password, (err, result) => {
        if (result) {
            const token = jwt.sign({ Email, userId: user._id }, process.env.secretCode);
            res.cookie("token", token);
            res.redirect("/dashboard");
        } else {
            res.send("wrong username or password try again");
        }
    });
});

////////////////////////Logout///////////////////////

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

////////////////////middleware for protected routes/////////////

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) return res.redirect("/login");
    try {
        const data = jwt.verify(req.cookies.token, process.env.secretCode);
        req.user = data;
        next();
    } catch {
        res.redirect("/login");
    }
}

/////////////////////////Profile//SHOW/////////////////////

app.get("/profile", isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ Email: req.user.Email });
    const posts = await postModel.find({ user: user._id }).sort({ date: -1 });
    res.render("profile.ejs", { posts, user });
});

////////////////////////Dashboard//SHOW//////////////////////

app.get("/dashboard", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ Email: req.user.Email });
        const posts = await postModel.find().sort({ date: -1 });
        res.render("dashboard.ejs", { user, posts });
    } catch {
        res.status(500).send("Internal Server Error");
    }
});

//////////////////////////NEW/////////////////////////////

app.get("/new", (req, res) => {
    res.render("new.ejs");
});

app.post("/new", isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ Email: req.user.Email });
    if (!user) return res.redirect("/login");

    const { content } = req.body;
    if (!content) return res.status(400).send("Content is required");

    await postModel.create({ content, user: user._id, username: user.Username });
    res.redirect("/profile");
});

///////////////////////////Post in Details////////////////////////////

app.get("/post/:id", async (req, res) => {
    const post = await postModel.findById(req.params.id);
    res.render("show.ejs", { post });
});

/////////////////////////edit posts///////////////////////////////////

app.get("/post/:id/edit", async (req, res) => {
    const post = await postModel.findById(req.params.id);
    res.render("edit.ejs", { post });
});

app.patch("/post/:id/edit", async (req, res) => {
    await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.redirect("/profile");
});

///////////////////////// DELETE POST //////////////////////////

app.delete("/post/:id", async (req, res) => {
    await postModel.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
});
