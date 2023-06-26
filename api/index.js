const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');

const User = require('./models/User');
const Message = require('./models/Message');

dotenv.config();
mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData);
        });
    } else {
        res.status(401).json('no token');
    }
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username});
    if (user && bcrypt.compareSync(password, user.password)) {
        jwt.sign({userId: user._id, username: user.username}, jwtSecret, {}, (err, token) => {
            res.cookie('token', token, {sameSite:'none', secure:true}).json({
                id: user._id,
                username: user.username,
            });
        });
    }
});

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const user = await User.create({
            username: username, 
            password: hashedPassword,
        });
        jwt.sign({userId:user._id, username: username}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: user._id,
                username: username,
            });
        });
    } catch (err) {
        if (err) throw err;
    }
});

const server = app.listen(4040);

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {
    // Read username and id from cookie of this connection.
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenStr = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenStr) {
            token = tokenStr.split('=')[1];
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) throw err;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const {recipient, text} = JSON.parse(message.toString());
        console.log(recipient, text);
        if (recipient && text) {
            // Create Message object.
            const message = await Message.create({
                sender: connection.userId,
                recipient: recipient,
                text: text,
            });
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    sender: connection.userId,
                    recipient: recipient,
                    text: text, 
                    _id: message._id,
                })));
        }
    });


    // Notify every online user when someone goes online.
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({
                userId: c.userId, 
                username: c.username,
            })),
        }));
    });

});