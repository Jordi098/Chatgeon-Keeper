const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const scoreBoard = document.getElementById("score-board");
const sendButton = document.getElementById("send-button");

let quizScore = 0;
let quizTotal = 0;
let quizAnswered = 0;
let isLoading = false;

function updateScoreBoard() {
    scoreBoard.textContent = `Score: ${quizScore} / ${quizTotal}`;
}

function addMessage(content, sender, tokens = null, isHtml = false) {
    const div = document.createElement("div");

    if (sender === "user") {
        div.textContent = content;
        div.className =
            "ml-auto w-fit max-w-[80%] rounded-2xl border border-sky-400/30 " +
            "bg-gradient-to-b from-[#243b63] to-[#131c33] px-4 py-3 text-sky-100 " +
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.35)]";
    } else {
        if (content instanceof Node) {
            div.appendChild(content);
        } else if (isHtml) {
            div.innerHTML = content;
        } else {
            div.textContent = content;
        }

        if (tokens !== null) {
            const tokenInfo = document.createElement("div");
            tokenInfo.textContent = `Tokens: ${tokens}`;
            tokenInfo.className = "mt-2 text-sm text-amber-300";
            div.appendChild(tokenInfo);
        }

        div.className =
            "w-fit max-w-[80%] rounded-2xl border border-amber-500/30 " +
            "bg-gradient-to-b from-[#3b2d1c] to-[#1f1710] px-4 py-3 text-amber-100 " +
            "shadow-[inset_0_1px_0_rgba(255,220,160,0.12),0_8px_20px_rgba(0,0,0,0.35)]";
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function formatQuizResponse(response) {
    if (!response?.questions || !Array.isArray(response.questions)) {
        return null;
    }

    quizScore = 0;
    quizAnswered = 0;
    quizTotal = response.questions.length;
    updateScoreBoard();

    const wrapper = document.createElement("div");
    wrapper.className = "space-y-3";

    const title = document.createElement("h3");
    title.className = "text-lg font-bold";
    title.textContent = response.quiz_topic ?? "Quiz";
    wrapper.appendChild(title);

    const difficulty = document.createElement("p");
    difficulty.className = "text-sm opacity-80";
    difficulty.textContent = `Moeilijkheid: ${response.difficulty ?? "onbekend"}`;
    wrapper.appendChild(difficulty);

    response.questions.forEach((q) => {
        const questionBox = document.createElement("div");
        questionBox.className = "mt-3 rounded-xl border border-amber-400/20 p-3";

        const questionText = document.createElement("p");
        questionText.className = "font-semibold";
        questionText.textContent = `${q.number}. ${q.question}`;
        questionBox.appendChild(questionText);

        const optionsBox = document.createElement("div");
        optionsBox.className = "mt-2 flex flex-col gap-2";

        ["A", "B", "C", "D"].forEach((key) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `${key}. ${q.options[key]}`;
            button.className =
                "rounded-lg border border-amber-400/20 px-3 py-2 text-left hover:bg-amber-500/10 transition";

            button.addEventListener("click", () => {
                if (questionBox.dataset.answered === "true") return;

                questionBox.dataset.answered = "true";
                quizAnswered++;

                if (key === q.correct_answer) {
                    quizScore++;
                    button.classList.add("bg-green-700", "text-white");
                } else {
                    button.classList.add("bg-red-700", "text-white");

                    const correctButton = [...optionsBox.children].find((btn) =>
                        btn.textContent.startsWith(`${q.correct_answer}.`)
                    );

                    if (correctButton) {
                        correctButton.classList.add("bg-green-700", "text-white");
                    }
                }

                [...optionsBox.children].forEach((btn) => {
                    btn.disabled = true;
                    btn.classList.add("cursor-not-allowed", "opacity-90");
                });

                updateScoreBoard();

                if (quizAnswered === quizTotal) {
                    const result = document.createElement("div");
                    result.className =
                        "mt-4 rounded-xl border border-amber-400/20 p-3 font-semibold";
                    result.textContent = `Quiz klaar! Eindscore: ${quizScore} / ${quizTotal}`;
                    wrapper.appendChild(result);
                }
            });

            optionsBox.appendChild(button);
        });

        questionBox.appendChild(optionsBox);
        wrapper.appendChild(questionBox);
    });

    return wrapper;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const message = input.value.trim();
    if (!message) return;

    isLoading = true;
    input.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = "Loading...";
    sendButton.classList.add("opacity-60", "cursor-not-allowed");

    addMessage(message, "user");
    input.value = "";

    try {
        const res = await fetch("http://localhost:8000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({message}),
        });

        const data = await res.json();
        console.log("API data:", data);

        const botResponse = data.response.response;
        const tokens = data.response.tokens;
        const isJson = data.response.isJson;

        if (isJson && botResponse?.questions) {
            const quizElement = formatQuizResponse(botResponse);
            addMessage(quizElement, "bot", tokens);
        } else {
            addMessage(botResponse, "bot", tokens, true);
        }
    } catch (error) {
        addMessage("Er ging iets mis met de server.", "bot");
        console.error(error);
    } finally {
        isLoading = false;
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = "Send";
        sendButton.classList.remove("opacity-60", "cursor-not-allowed");
        input.focus();
    }
});