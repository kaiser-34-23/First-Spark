const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
- Make stage3 detailed and useful.
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "prompt_transform_response",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              stage1: { type: "string" },
              stage2: { type: "string" },
              stage3: { type: "string" },
              score: {
                type: "object",
                additionalProperties: false,
                properties: {
                  total: { type: "number" },
                  clarity: { type: "number" },
                  specificity: { type: "number" },
                  context: { type: "number" },
                  systemThinking: { type: "number" },
                  label: { type: "string" }
                },
                required: [
                  "total",
                  "clarity",
                  "specificity",
                  "context",
                  "systemThinking",
                  "label"
                ]
              }
            },
            required: ["stage1", "stage2", "stage3", "score"]
          }
        }
      }
    });

    const output = response.output_text;
    const parsed = JSON.parse(output);

    res.json(parsed);
  } catch (error) {
    console.error("OpenAI transform error:", error);

    res.status(500).json({
      error: "Failed to transform prompt.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});