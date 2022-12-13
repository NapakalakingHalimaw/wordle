const express = require('express');
const app = express();
const port = 4200;

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require("fs");

app.use(express.static('public'));
server.listen(port, () => {
    console.log(`Server listening on port ${port} in ${app.settings.env} mode`);
});

// ---------- Global variables ----------

const settings = {
    "wordLength": 5,
    "attempts": 7
}

var userCount = 1;
var activeUserList = [];

// ---------- Socket.io events ----------

// Middleware called when a user tries to connect to the socket
io.use((socket, next) => {
    let username = socket.handshake.auth.username;
    if(username >= 25) {
        const err = new Error('Your username is too long!');
        next(err);
    }

    if(username === "") {
        username = "Player" + userCount;
        userCount++;
    }

    socket.username = username;
    socket.attempt = 0;
    next();
});

io.on('connection', async (socket) => {
    console.log(`a user ${socket.username} (${socket.id}) connected`);

    const users = [];
    for(let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
            attempt: socket.attempt
        });
    }
    activeUserList = users;

    socket.emit('setup', await setupNewUser(socket, users));
    socket.broadcast.emit('newUser', {
        userID: socket.id,
        username: socket.username,
        attempt: socket.attempt
    });

    socket.on('message', (message) => {
        if(message.message !== "") {
            socket.broadcast.emit('userMessage', message);
        }
    });

    socket.on('getCurrentAttempt', (data, callback) => {
        callback({ attempt: socket.attempt });
    });

    socket.on('validateWord', async (data) => {
        console.log(data);
        if(data.word.length == settings.wordLength) {
            try {
                let isValid = await validateWord(data.word);
                console.log(isValid);
                if(isValid) {
                    let colors = [];
                    let greens = 0;
                    socket.attempt++;

                    let response = {
                        status: 200,
                        errorMessage: "",
                        attempt: socket.attempt,
                        correct: false
                    };

                    if(data.word.toLowerCase() == socket.selectedWord.toLowerCase()) {
                        for(let i = 0; i < data.word.length; i++) {
                            colors[i] = "green";
                            greens++;
                        }
                        response.correct = true;
                    }
                    else {
                        for(let i = 0; i < data.word.length; i++) {
                            if(data.word[i] == socket.selectedWord[i]) {
                                colors[i] = "green";
                                greens++;
                            }
                            else if(socket.selectedWord.indexOf(data.word[i]) > -1) {
                                colors[i] = "orange";
                                // if((socket.selectedWord.split(data.word[i]).length - 1) > 1) {
                                //     colors[i] = "orange";
                                // } else {
                                //     colors[i] = "grey";
                                // }
                            }
                            else {
                                colors[i] = "grey";
                            }
                        }
                    }
        
                    response.greens = greens;
                    response.colors = colors;
                    console.log(response);
        
                    let updateUser = {
                        type: "validateWord",
                        username: socket.username,
                        greens: greens,
                        attempt: socket.attempt,
                        correct: response.correct
                    };

                    if(response.correct || socket.attempt >= settings.attempts) {
                        response.word = socket.selectedWord;
                        updateUser.word = socket.selectedWord;
                    }

                    socket.emit('validateWord', response);
                    socket.broadcast.emit('updateUser', updateUser);
                } else {
                    socket.emit('validateWord', { status: 404, errorMessage: "Specified word was not found in english dictionary!", attempt: socket.attempt })
                }
            } catch(message) {
                socket.emit('validateWord', { status: 408, errorMessage: message });
            }
        }
    });

    socket.on('showWord', (data) => {
        if(socket.attempt == settings.attempts) {
            socket.emit('showWord', { status: 200, errorMessage: "", word: socket.selectedWord });
        } else {
            socket.emit('showWord', { status: 403, errorMessage: "You still have " + (settings.attempts - socket.attempt) + " attempt(s) left!" });
        }
    });

    socket.on('generateWord', async (data) => {
        let selectedWord = "undefined";
        try {
            selectedWord = await getRandomWord();
        } catch(message) {
            socket.emit('generateWord', { status: 408, errorMessage: message });
        }
        socket.selectedWord = selectedWord[0];
        socket.attempt = 0;

        socket.emit('generateWord', { status: 200, errorMessage: "" });
        socket.broadcast.emit('updateUser', { type: "generateWord", username: socket.username });
    });

    // Disconnect event
    socket.on('disconnect', () => {
        socket.broadcast.emit('userDisconnected', socket.username);
        console.log(`a user ${socket.username} ${socket.id} disconnected`);
    });
});

async function setupNewUser(socket, users) {
    let selectedWord = "undefined";
    try {
        selectedWord = await getRandomWord();
        // socket.selectedWord = getRandomLine('wordlist.txt').slice(0, -1);
    } catch(message) {
        return { status: 408, errorMessage: message };
    }
    socket.selectedWord = selectedWord[0];
    
    return { status: 200, errorMessage: "", wordLength: socket.selectedWord.length, attempts: settings.attempts, users: users, usersCount: io.of('/').sockets.size };
}

async function getRandomWord() {
    try {
        const response = await fetchWithTimeout('https://random-word-api.herokuapp.com/word?length=' + settings.wordLength, { 
            timeout: 10000 
        });
        const word = await response.json();
        console.log("Generated word: " + word);

        return word;
    } catch(error) {
        throw "Failed to fetch word!";
    }
}

async function validateWord(word) {
    try {
        const response = await fetchWithTimeout('https://api.datamuse.com/words?sp=' + word, {
            timeout: 10000
        });

        const isValid = await response.json();
        console.log(isValid);
        if(isValid.length === 0) {
            return false;
        }

        return isValid[0].word == word;
    } catch(error) {
        throw "Failed to validate word!";
    }
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
    });
    clearTimeout(id);

    return response;
}

function getRandomLine(filename) {
    let lines = fs.readFileSync(filename).toString().split("\n");
    let line = lines[Math.floor(Math.random()*lines.length)];
    return line;
}

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// app.post('/', (req, res) => {
//     res.send('Got a POST request');
// });

// app.put('/user', (req, res) => {
//     res.send('Got a PUT request at /user');
// });

// app.delete('/user', (req, res) => {
//     res.send('Got a DELETE request at /user');
// });