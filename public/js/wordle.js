class Wordle {
    constructor(length, attempts, socket) {
        this.wordLength = length;
        this.attempts = attempts;
        this.socket = socket;

        this.wordleContainer = null;
        this.activeLetter = 0;
        this.word = "";
    }

    getAttempts() {
        return this.attempts;
    }

    getWordLength() {
        return this.wordLength;
    }

    getWord() {
        return this.word;
    }

    createHTML() {
        let wordle = document.createElement('div');
        wordle.classList.add('panel');
        wordle.classList.add('wordle');

        let attempts = document.createElement('div');
        attempts.classList.add('attempts');
        for(let columns = 0; columns < this.attempts; columns++) {
            let attempt = document.createElement('div');
            attempt.setAttribute('id', 'attempt_' + columns);
            attempt.classList.add('attempt');
            for(let rows = 0; rows < this.wordLength; rows++) {
                let block = attempt.appendChild(document.createElement('div'));
                block.classList.add('letter_' + rows);
                block.classList.add('letter');
            }
            attempts.appendChild(attempt);
            attempts.appendChild(document.createElement('br'));
        }

        wordle.appendChild(attempts);

        this.wordleContainer = wordle;
        return wordle;
    }

    async write(letter) {
        console.log("Caught letter: " + letter);
        console.log(this.activeLetter + " / " + this.wordLength);
        if(this.activeLetter == this.wordLength) {
            console.log("activeLetter == wordLength");
            return;
        }

        let attempt = await this.getCurrentAttempt();

        document.querySelector("#attempt_" + attempt).querySelector(".letter_" + this.activeLetter++).innerText = letter.toUpperCase();
        this.word += letter;
        console.log(this.word);
        console.log(this.activeLetter + " / " + this.wordLength);
    }

    async backspace() {
        console.log("Backspace caught");
        console.log(this.activeLetter + " / " + this.wordLength);
        if(this.activeLetter == 0) {
            console.log("activeLetter == 0");
            return;
        }

        let attempt = await this.getCurrentAttempt();

        document.querySelector("#attempt_" + attempt).querySelector(".letter_" + --this.activeLetter).innerText = "";
        this.word = this.word.slice(0, -1);
        console.log(this.word);
        console.log(this.activeLetter + " / " + this.wordLength);
    }

    getCurrentAttempt() {
        let user = {
            id: this.socket.id,
            username: this.socket.auth.username
        };

        return new Promise(resolve => this.socket.emit('getCurrentAttempt', user, data => resolve(data.attempt)));
    }

    sendWord() {
        if(this.activeLetter != this.wordLength) {
            return;
        }
    
        let data = {
            id: this.socket.id,
            username: this.socket.auth.username,
            word: this.word
        };
    
        this.socket.emit('validateWord', data);
    }

    showWord() {
        let data = {
            id: this.socket.id,
            username: this.socket.auth.username
        };

        this.socket.emit('showWord', data);
    }

    reset() {
        this.activeLetter = 0;
        this.word = "";
    }

    clear() {
        this.activeLetter = 0;
        this.word = "";

        for(let columns = 0; columns < this.attempts; columns++) {
            for(let rows = 0; rows < this.wordLength; rows++) {
                document.querySelector("#attempt_" + columns).querySelector(".letter_" + rows).innerText = "";
                document.querySelector("#attempt_" + columns).querySelector(".letter_" + rows).style.backgroundColor = "transparent";
            }
        }

        this.generateNewWord();
    }

    generateNewWord() {
        let data = {
            id: this.socket.id,
            username: this.socket.auth.username
        };

        this.socket.emit('generateWord', data);
    }

    async colorLetters(colors) {
        let activeAttempt = await this.getCurrentAttempt();

        document.querySelector("#attempt_" + (activeAttempt-1)).querySelectorAll(".letter").forEach((node, index) => {
            node.style.backgroundColor = colors[index];
        });
    }
}