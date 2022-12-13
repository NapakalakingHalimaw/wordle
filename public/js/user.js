function connect(socket, username) {
    if(username.length >= 25) {
        alert('Your username is too long! Choose a shorter one please!');
        document.getElementById('username').value = "";
        return;
    }

    socket.auth = { username };
    socket.connect();
}

function gameSetup(json) {
    console.log(json);

    if(json.status != 200) {
        alert(`Error ${json.status}! Message: ${json.errorMessage}`);
        return;
    }

    json.users.forEach((user) => {
        user.self = user.userID === socket.id;
        if(user.self) {
            socket.auth.username = user.username;
            socket.username = user.username;
            socket.attempt = user.attempt;
        }
    });

    let usersPanel = document.createElement('div');
    usersPanel.setAttribute('id', 'usersPanel');
    usersPanel.classList.add('panel');
    usersPanel.classList.add('users')
    json.users.forEach((user) => {
        let userDiv = document.createElement('div');
        userDiv.setAttribute('id', user.username);
        userDiv.classList.add('user');
        userDiv.style.backgroundColor = "white";
        userDiv.style.color = "black";
        userDiv.style.padding = "10px";

        if(user.self) {
            userDiv.style.fontWeight = "bold";
        }

        userDiv.textContent = user.username;

        let userStatus = document.createElement('span');
        userStatus.setAttribute('id', 'userStatus_' + user.username);
        userStatus.style.float = "right";
        userStatus.innerHTML = `<font id='correctLetters_${user.username}' style='color:green'>0</font> - <font id='attempt_${user.username}'>${user.attempt+1}</font>`;
        
        userDiv.appendChild(userStatus);
        usersPanel.appendChild(userDiv);
    });

    wordle = new Wordle(json.wordLength, json.attempts, socket);
    let wordleContainer = wordle.createHTML();
    // console.log(wordle);

    let chatPanel = document.createElement('div');
    chatPanel.classList.add('panel');
    chatPanel.classList.add('chat');

    let textBox = document.createElement("textarea");
    textBox.setAttribute('disabled', 'true');
    textBox.setAttribute('id', 'chat');

    let inputBox = document.createElement("input");
    inputBox.setAttribute('id', 'input_chat');
    inputBox.setAttribute('required', 'true');
    inputBox.addEventListener("keyup", function(e) {
        if(e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('send_message_btn').click();
        }
    });

    let submitBtn = document.createElement("input");
    submitBtn.setAttribute('type', 'button');
    submitBtn.setAttribute('value', 'enter');
    submitBtn.setAttribute('id', 'send_message_btn');
    submitBtn.setAttribute('value', 'Send');
    submitBtn.addEventListener("click", sendMessage, false);

    chatPanel.appendChild(textBox);
    chatPanel.appendChild(inputBox);
    chatPanel.appendChild(submitBtn);

    document.querySelector('#game').appendChild(usersPanel);
    document.querySelector('#game').appendChild(wordleContainer);
    document.querySelector('#game').appendChild(chatPanel);

    virtualKeyboard = new Keyboard(500, 250);
    // console.log(virtualKeyboard);
    document.body.appendChild(virtualKeyboard.createHTML());
    virtualKeyboard.listenToPhysicalKeyboard();

    document.getElementById('game').style.display = "flex";

    document.getElementById('intermission').remove();

}

function sendMessage() {
    if(document.getElementById('input_chat').value === "") {
        return;
    }

    let data = {
        id: socket.id,
        username: socket.auth.username,
        message: document.getElementById('input_chat').value
    }

    document.getElementById('input_chat').value = "";

    socket.emit('message', data);
    document.getElementById('chat').append(data.username + ": " + data.message + "\r\n");
}