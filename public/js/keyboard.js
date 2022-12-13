class Keyboard {
    constructor(width, height) {
        this.width = width + "px";
        this.height = height + "px";

        this.rowKeysCount = [10, 9, 9];
        this.upperRowKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
        this.middleRowKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
        this.lowerRowKeys = ["↵", "z", "x", "c", "v", "b", "n", "m", "⌫"];

        this.keyboardContainer = document.createElement('div');
        this.keyboardContainer.width = this.width;
        this.keyboardContainer.height = this.height;
        this.keyboardContainer.setAttribute('id', 'virtual-keyboard');
        this.keyboardContainer.classList.add('keyboard');
    }

    createHTML() {
        let upperRow = document.createElement('div');
        upperRow.setAttribute('id', 'upperRow');
        upperRow.classList.add('row');
        this.upperRow = upperRow;

        let middleRow = document.createElement('div');
        middleRow.setAttribute('id', 'middleRow');
        middleRow.classList.add('row');
        this.middleRow = middleRow;

        let lowerRow = document.createElement('div');
        lowerRow.setAttribute('id', 'lowerRow');
        lowerRow.classList.add('row');
        this.lowerRow = lowerRow;

        for(let keys = 0; keys < this.rowKeysCount[0]; keys++) {
            let key = document.createElement('button');
            key.setAttribute('id', 'key_' + this.upperRowKeys[keys]);
            key.classList.add('key');
            key.addEventListener('mousedown', keyPressed);
            key.innerText = this.upperRowKeys[keys];
            this.upperRow.appendChild(key);
        }

        for(let keys = 0; keys < this.rowKeysCount[1]; keys++) {
            let key = document.createElement('button');
            key.setAttribute('id', 'key_' + this.middleRowKeys[keys]);
            key.classList.add('key');
            key.addEventListener('mousedown', keyPressed);
            key.innerText = this.middleRowKeys[keys];
            this.middleRow.appendChild(key);
        }

        for(let keys = 0; keys < this.rowKeysCount[2]; keys++) {
            let key = document.createElement('button');
            if(keys == 0) {
                key.setAttribute('id', 'key_Enter');
            }
            else if(keys == this.rowKeysCount[2]-1) {
                key.setAttribute('id', 'key_Backspace');
            }
            else {
                key.setAttribute('id', 'key_' + this.lowerRowKeys[keys]);
            }
            key.addEventListener('mousedown', keyPressed);
            key.classList.add('key');
            key.innerText = this.lowerRowKeys[keys];
            this.lowerRow.appendChild(key);
        }

        this.keyboardContainer.appendChild(upperRow);
        this.keyboardContainer.appendChild(middleRow);
        this.keyboardContainer.appendChild(lowerRow);

        return this.keyboardContainer;
    }

    listenToPhysicalKeyboard() {
        document.addEventListener("keydown", keyPressed);
    }

    colorKeys(word, colors) {
        console.log(word);
        for(let i = 0; i < word.length; i++) {
            if(document.getElementById("key_" + word[i]).style.backgroundColor != "green") {
                document.getElementById("key_" + word[i]).style.backgroundColor = colors[i];
            }
        }
    }

    clear() {
        for(let i = 0; i < this.rowKeysCount[0]; i++) {
            document.getElementById("key_" + this.upperRowKeys[i]).style.backgroundColor = "transparent";
        }
        for(let i = 0; i < this.rowKeysCount[1]; i++) {
            document.getElementById("key_" + this.middleRowKeys[i]).style.backgroundColor = "transparent";
        }
        for(let i = 0; i < this.rowKeysCount[2]; i++) {
            if(i == 0) {
                document.getElementById("key_Enter").style.backgroundColor = "transparent";
            } else if(i == this.rowKeysCount[2]-1) {
                document.getElementById("key_Backspace").style.backgroundColor = "transparent";
            } else {
                document.getElementById("key_" + this.lowerRowKeys[i]).style.backgroundColor = "transparent";
            }
        }
    }
}

function keyPressed(key) {
    if(key == null) {
        return;
    }

    if(document.getElementById('input_chat') == document.activeElement) {
        console.log("User is typing in chat. Skipping word typing events...");
        return;
    }

    console.log("Event fired: ");
    console.log(key);

    if(key.toElement != null) {
        var keyNode = key.toElement;
        
        if(keyNode == null) {
            return;
        }

        let previousBackgroundColor = keyNode.style.backgroundColor;
        keyNode.style.backgroundColor = "#a2a2a2";
        if(keyNode.id == "key_Enter" || keyNode.id == "key_Backspace") {
            setTimeout(function() { keyNode.style.backgroundColor = "transparent" }, 100);
        } else {
            setTimeout(function() { keyNode.style.backgroundColor = previousBackgroundColor }, 100);
        }

        if(keyNode.id == "key_Enter") {
            wordle.sendWord();
            return;
        }
    } else {
        var keyNode = document.getElementById("key_" + key.key);
        if(keyNode == null) {
            return;
        }
    
        let previousBackgroundColor = keyNode.style.backgroundColor;
        keyNode.style.backgroundColor = "#a2a2a2";
        if(key.key == "Enter" || key.key == "Backspace") {
            setTimeout(function() { keyNode.style.backgroundColor = "transparent" }, 100);
        } else {
            setTimeout(function() { keyNode.style.backgroundColor = previousBackgroundColor }, 100);
        }

        if(key.key == "Enter") {
            wordle.sendWord();
            return;
        }
    }

    if(keyNode.textContent == "⌫") {
        wordle.backspace();
    } else {
        wordle.write(keyNode.textContent);
    }
}