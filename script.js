const promptInput = document.getElementById("userPrompt");
const transformBtn = document.getElementById("transformBtn");
const sampleBtn = document.getElementById("sampleBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

const stage1 = document.getElementById("stage1");
const stage2 = document.getElementById("stage2");
const stage3 = document.getElementById("stage3");

const scoreNumber = document.getElementById("scoreNumber");
const scoreFill = document.getElementById("scoreFill");
const scoreLabel = document.getElementById("scoreLabel");
const clarityScore = document.getElementById("clarityScore");
const specificityScore = document.getElementById("specificityScore");
const contextScore = document.getElementById("contextScore");
const systemScore = document.getElementById("systemScore");

const templateCards = document.querySelectorAll(".template-card");
const copyButtons = document.querySelectorAll(".copy-btn");

if (transformBtn) {
  transformBtn.addEventListener("click", transformPromptWithAI);
  sampleBtn.addEventListener("click", fillSample);
  clearBtn.addEventListener("click", clearAll);
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", downloadSystemPrompt);
}

templateCards.forEach((card) => {
  card.addEventListener("click", () => {
    const template = card.dataset.template;
    promptInput.value = template;
    transformPromptWithAI();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

copyButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const targetId = btn.dataset.target;
    const text = document.getElementById(targetId).textContent;
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = original;
      }, 1200);
    } catch (err) {
      console.error("Copy failed", err);
    }
  });
});

function fillSample() {
  promptInput.value = "Help me learn JavaScript for my exam";
  transformPromptWithAI();
}

function clearAll() {
  if (promptInput) promptInput.value = "";
  stage1.textContent = "Your basic prompt will appear here.";
  stage2.textContent = "Your improved prompt will appear here.";
  stage3.textContent = "Your full system prompt / workflow will appear here.";
  updateScoreUI(0, 0, 0, 0, 0, "Waiting for prompt...");
}

function setLoadingState(isLoading) {
  if (!transformBtn) return;

  transformBtn.disabled = isLoading;
  transformBtn.textContent = isLoading ? "Transforming..." : "Transform Prompt";

  if (isLoading) {
    stage1.textContent = "Generating Prompt User version...";
    stage2.textContent = "Generating Prompt Engineer version...";
    stage3.textContent = "Generating System Architect version...";
    updateScoreUI(0, 0, 0, 0, 0, "AI is analyzing your prompt...");
  }
}

async function transformPromptWithAI() {
  const userPrompt = promptInput.value.trim();

  if (!userPrompt) {
    stage1.textContent = "Please enter a prompt first.";
    stage2.textContent = "Please enter a prompt first.";
    stage3.textContent = "Please enter a prompt first.";
    updateScoreUI(0, 0, 0, 0, 0, "Please enter a prompt first.");
    return;
  }

  try {
    setLoadingState(true);

    const response = await fetch("/api/transform", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: userPrompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    stage1.textContent = data.stage1;
    stage2.textContent = data.stage2;
    stage3.textContent = data.stage3;

    updateScoreUI(
      data.score.total,
      data.score.clarity,
      data.score.specificity,
      data.score.context,
      data.score.systemThinking,
      data.score.label
    );
  } catch (error) {
    console.error(error);
    stage1.textContent = "Error generating prompt transformation.";
    stage2.textContent = "Please check your backend/server/API key.";
    stage3.textContent = error.message || "Unknown error.";
    updateScoreUI(0, 0, 0, 0, 0, "AI request failed.");
  } finally {
    setLoadingState(false);
  }
}

function updateScoreUI(total, clarity, specificity, context, system, label) {
  if (!scoreNumber) return;

  scoreNumber.textContent = total;
  scoreFill.style.width = `${total}%`;
  scoreLabel.textContent = label;

  clarityScore.textContent = clarity;
  specificityScore.textContent = specificity;
  contextScore.textContent = context;
  systemScore.textContent = system;
}

function downloadSystemPrompt() {
  if (!stage3) return;

  const text = stage3.textContent.trim();
  if (!text || text === "Your full system prompt / workflow will appear here.") return;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "system-architect-prompt.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}