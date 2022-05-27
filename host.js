const newBtn = document.getElementById("new-btn");
const roomIdTag = document.getElementById("room-id");
const gameScreen = document.getElementById("game-screen");

newBtn.addEventListener("click", () => {
    newBtn.disabled = true;
    const hostSocket = new WebSocket("ws://64.225.12.53/ws");

    const userList = document.createElement("ul");
    gameScreen.appendChild(userList);

    let inLobby = true;
    const points = {};

    let intervalId = undefined;
    const timeLeft = document.createElement("p");
    gameScreen.appendChild(timeLeft);

    const question = document.createElement("p");
    gameScreen.appendChild(question);

    const choiceList = document.createElement("ul");
    gameScreen.appendChild(choiceList);

    const displayQuestion = (q) => {
        question.innerText = q.question;
        for (choice of q.choices) {
            const li = document.createElement("li");
            li.innerText = choice;
            choiceList.appendChild(li);
        }
    }

    const clearQuestion = () => {
        question.innerText = "";
        while (choiceList.firstChild) {
            choiceList.firstChild.remove();
        }
    }

    const nextBtn = document.createElement("button");
    let waiting = true;

    nextBtn.innerText = "Begin";
    nextBtn.addEventListener("click", () => {
        if (waiting) {
            console.log("Starting round");
            const data = { type: "beginRound" };
            hostSocket.send(JSON.stringify(data));
        } else {
            console.log("Force ending round");
            const data = { type: "endRound" };
            hostSocket.send(JSON.stringify(data));
        }
    });
    gameScreen.appendChild(nextBtn);

    hostSocket.addEventListener("open", () => {
        const data = {
            type: "createRoom",
            questions: [
                {
                    question: "Question?!?!",
                    choices: ["Hello", "Hi", "Howdy"],
                    answer: 1,
                    time: 30,
                },
                {
                    question: "Q Dos",
                    choices: ["A", "B", "C", "D"],
                    answer: 3,
                    time: 30,
                },
            ]
        };
        hostSocket.send(JSON.stringify(data));
        console.log("sent");
    });

    hostSocket.addEventListener("message", (message) => {
        let data = JSON.parse(message.data);

        switch (data.type) {
            case "roomCreated":
                console.log("Created room");
                roomIdTag.innerText = `Room Id: ${data.roomId}`;
                break;
            case "userJoined":
                points[data.username] = 0;

                const li = document.createElement("li");
                li.innerText = data.username;
                userList.appendChild(li);
                break;
            case "userLeft":
                delete points[data.username];

                for (let li of userList.children) {
                    if (li.innerText === data.username) {
                        li.remove();
                        break;
                    }
                }
                break;
            case "userAnswered":
                console.log(`${data.username} answered`);
                break;
            case "roundBegin":
                nextBtn.innerText = "End";
                waiting = false;
                displayQuestion(data.question);

                let time = data.question.time;
                intervalId = setInterval(() => {
                    time -= 1;
                    timeLeft.innerText = `Remaining time: ${time}`;
                }, 1000)
                break;
            case "roundEnd":
                timeLeft.innerText = "";
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = undefined;
                }

                nextBtn.innerText = "Next";
                waiting = true;
                clearQuestion();

                for (user in data.pointGains) {
                    if (user in points) {
                        points[user] += data.pointGains[user];
                    }
                }
                break;
            case "gameEnd":
                console.log("Game has ended!");
                for (let li of userList.children) {
                    li.innerText += ` (${points[li.innerText]} points)`;
                }
                nextBtn.remove();
                break;
        }
    });

    hostSocket.addEventListener("close", () => {
        console.log("Host connection closed");
    });
});