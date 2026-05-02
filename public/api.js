const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");

let isLoading = false;

function addMessage(content, sender, tokens = null) {
    const div = document.createElement("div");

    if (sender === "user") {
        div.textContent = content;

        div.className =
            "whitespace-pre-wrap ml-auto w-fit max-w-[80%] rounded-2xl border border-sky-400/30 " +
            "bg-gradient-to-b from-[#243b63] to-[#131c33] px-4 py-3 text-sky-100 " +
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.35)]";
    } else {
        div.innerHTML = content;

        div.className =
            "prose prose-invert prose-a:text-amber-300 prose-a:underline " +
            "w-fit max-w-[80%] rounded-2xl border border-amber-500/30 " +
            "bg-gradient-to-b from-[#3b2d1c] to-[#1f1710] px-4 py-3 text-amber-100 " +
            "shadow-[inset_0_1px_0_rgba(255,220,160,0.12),0_8px_20px_rgba(0,0,0,0.35)]";

        if (tokens !== null) {
            const tokenInfo = document.createElement("div");
            tokenInfo.textContent = `Tokens: ${tokens}`;
            tokenInfo.className = "mt-2 text-sm text-amber-300";
            div.appendChild(tokenInfo);
        }
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
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

        addMessage(data.response, "bot", data.tokens);
    } catch (error) {
        console.error(error);
        addMessage("Er ging iets mis met de server.", "bot");
    } finally {
        isLoading = false;
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = "Send";
        sendButton.classList.remove("opacity-60", "cursor-not-allowed");
        input.focus();
    }
});