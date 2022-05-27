const usernameLabel = document.getElementById("username");
const roomId = document.getElementById("room-id");
const joinBtn = document.getElementById("join-btn");

const choices = document.getElementById("choices");
const roundResult = document.getElementById("round-result");

const setChoices = (count, onChoice) => {
    for (let i = 0; i < count; i++) {
        const btn = document.createElement("button");
        btn.textContent = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(i);
        btn.addEventListener("click", () => onChoice(i));

        choices.appendChild(btn);
    }
}

const removeChoices = () => {
    while (choices.firstChild) {
        choices.firstChild.remove();
    }
}

joinBtn.addEventListener("click", () => {
    const parsedId = parseInt(roomId.value);
    if (isNaN(parsedId)) {
        return;
    }

    joinBtn.remove();
    const socket = new WebSocket("ws://64.225.12.53/ws");

    socket.onopen = () => {
        const data = {
            type: "joinRoom",
            roomId: parsedId,
            username: usernameLabel.value,
        }
        roomId.value = "";
        username.value = "";

        joinBtn.disbled = true;

        socket.send(JSON.stringify(data));

        usernameLabel.remove();
        roomId.remove();
    }

    socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        switch (data.type) {
            case "roundBegin":
                roundResult.innerText = "";

                const onChoice = (n) => {
                    removeChoices();

                    console.log("Sending answer...");
                    const data = {
                        type: "answer",
                        choice: n,
                    };
                    socket.send(JSON.stringify(data));
                }

                setChoices(data.choiceCount, onChoice);
                break;
            case "roundEnd":
                removeChoices();

                if (data.pointGain) {
                    roundResult.innerText = `Correct (+${data.pointGain})`;
                } else {
                    roundResult.innerText = "Wrong";
                }
                break;
            case "gameEnd":
                break;
        }
    }

    socket.onclose = () => {
        console.log("Connection closed...");
    }
});