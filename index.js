const session = require('express-session');
const bcrypt = require('bcrypt');
const express=require("express"); // import the express framework into the folder
const app=express(); //Calls the express() function to create an Express application instance. and app will be used to define route like app.get middle ware like app.use
const port=8080;
// const fetch=require("node-fetch"); // import fetch from api calls
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // import fetch from api calls
const path = require("path");
const connection = require('./data'); // import your database connection
app.use(session({
    secret: 'your_secret_key', // replace with a strong secret in production
    resave: false,
    saveUninitialized: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine","ejs"); //set ejs as templating engine
app.set("views",path.join(__dirname,"views")); // ensures view folder is set correctly
app.get("/register", (req, res) => {
    res.render("register"); // we will create this view
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.send("Error registering user");
                }
                res.redirect("/login");
            }
        );
    } catch (error) {
        console.error(error);
        res.send("Error during registration");
    }
});
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) {
                console.error(err);
                return res.send("Error logging in");
            }
            if (results.length === 0) {
                return res.send("No user found");
            }
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                res.redirect("/posts");
            } else {
                res.send("Incorrect password");
            }
        }
    );
});

app.get("/posts",async(req,res)=>{
    try{
       const response = await fetch('https://randomuser.me/api/?results=6');
       const data=await response.json(); // convert raw response to usable json data
       const users=data.results;
       res.render("index",{users:users});
    }catch(error){
        console.log(error);
        res.send("Error fetching user data");
    }
});
// app.get("/posts",(req,res)=>{
//     res.render("index.ejs");
//     // console.log("varun");
//     // res.send("Post route working");
// })
app.listen(port,()=>{
    console.log("listening");
});