const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/transform", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const systemPrompt = `
You are an AI prompt transformation engine for a web app called "From Prompt User to System Architect".

The user will give you ONE raw prompt.

Your job:
Transform it into 4 outputs:

1. stage1
- The original user prompt exactly as written.

2. stage2
- A "Prompt Engineer" version.
- Rewrite the prompt to be clearer, more structured, more specific, and more useful.
- Add:
  - clearer task framing
  - context assumptions if needed
  - desired output format
  - constraints
  - audience/skill level if relevant

3. stage3
- A "System Architect" version.
- Turn the user request into a full AI instruction system.
- Include:
  - System Role
  - User Request
  - Objectives
  - Workflow / process steps
  - Constraints / guardrails
  - Output format
  - Quality control checklist
- Make it feel like a real system prompt / AI workflow blueprint.

4. score
Give a scoring object with:
- total (0–100)
- clarity (0–30)
- specificity (0–25)
- context (0–25)
- systemThinking (0–20)
- label (short string)

Return ONLY valid JSON in this exact shape:

{
  "stage1": "string",
  "stage2": "string",
  "stage3": "string",
  "score": {
    "total": 0,
    "clarity": 0,
    "specificity": 0,
    "context": 0,
    "systemThinking": 0,
    "label": "string"
  }
}

Important rules:
- Return only raw JSON.
- Do not wrap in markdown.
- Do not add commentary before or after the JSON.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Prompt to Architect"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const raw = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", raw);
      return res.status(response.status).json({
        error: raw?.error?.message || "OpenRouter request failed."
      });
    }

    const text = raw?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        error: "No response text returned from OpenRouter."
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse model JSON:", text);
      return res.status(500).json({
        error: "Model returned invalid JSON.",
        rawOutput: text
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Failed to transform prompt.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});