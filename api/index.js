const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require("./models/User");
const cors = require("cors");

dotenv.config();
mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const user = await User.create({username, password});
        jwt.sign({userId:user._id}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).status(201).json('ok');
        });
    } catch (err) {
        if (err) throw err;
    }
});

app.listen(4040);
