const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const fs = require('fs');

const User = require('./models/User');
const Message = require('./models/Message');

dotenv.config();
mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

// getUserDataFromRequest() verify cookie and parse the user data from request.
async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
      const token = req.cookies?.token;
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          resolve(userData);
        });
      } else {
        reject('no token');
      }
    });
  
  }

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

app.post('/logout', (req,res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
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

app.get('/people', async (req, res) => {
    const users = await User.find({}, {
        '_id': 1, 
        'username': 1,
    });
    res.json(users);
});

app.get('/messages/:userId', async (req,res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender:{$in:[userId,ourUserId]},
      recipient:{$in:[userId,ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
  });

const server = app.listen(4040);

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {

    // Notify every online people.
    function notifyOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({
                    userId: c.userId, 
                    username: c.username,
                })),
            }));
        });
    }

    // Set to online.
    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyOnlinePeople();
            console.log('dead');
        }, 1000);
    }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

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

    // Receiving all messages.
    connection.on('message', async (message) => {
        const {recipient, text, file} = JSON.parse(message.toString());
        let filename = null;
        if (file) {
            console.log('size', file.data.length);
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.'+ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer.alloc(file.data.length, file.data.split(',')[1], 'base64');
            fs.writeFile(path, bufferData, () => {
                console.log('file saved:' + path);
            });
        }
        if (recipient && (text || file)) {
            // Create Message object.
            const message = await Message.create({
                sender: connection.userId,
                recipient: recipient,
                text: text,
                file: file ? filename : null,
            });
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    sender: connection.userId,
                    recipient: recipient,
                    text: text, 
                    _id: message._id,
                    file: file ? filename : null,
                })));
        }
    });

    notifyOnlinePeople();
});

wss.on('close', data => {
    console.log('Disconnected.', data);
});
