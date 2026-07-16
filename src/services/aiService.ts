import OpenAI from "openai";
import { Logger } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export interface AIResult {
  summary: string;
  sentiment: string;
  urgency: string;
  department: string;
}

export async function classifyEmailAI(subject: string, body: string): Promise<AIResult> {
  // If no real API key is provided, use an advanced mock
  if (!process.env.OPENAI_API_KEY) {
    Logger.warn("OPENAI_API_KEY not found. Using advanced mock AI summary.");
    return generateMockAISummary(subject, body);
  }

  try {
    const prompt = `
You are an AI Email Assistant. Read the following email and extract the key details in strict JSON format.

Email Subject: ${subject}
Email Body: ${body}

Instructions:
1. "summary": Provide a highly descriptive 1-2 sentence summary of the issue. E.g., "Customer reports invoice mismatch for March. They are requesting correction before payment."
2. "sentiment": One of "Positive", "Neutral", "Negative".
3. "urgency": One of "High", "Medium", "Low".
4. "department": One of "Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other".

Return ONLY valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }, { timeout: 15000 });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");
    
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "Summary generation failed.",
      sentiment: parsed.sentiment || "Neutral",
      urgency: parsed.urgency || "Medium",
      department: parsed.department || "Other"
    };
  } catch (error: any) {
    Logger.error("AI API Timeout or Failure", error);
    throw new Error("AI_API_FAILURE");
  }
}

function generateMockAISummary(subject: string, body: string): AIResult {
  const text = (subject + " " + body).toLowerCase();
  
  let department = "Other";
  if (text.includes("invoice") || text.includes("payment")) department = "Finance";
  else if (text.includes("hire") || text.includes("resume")) department = "HR";
  else if (text.includes("contract") || text.includes("legal")) department = "Legal";
  else if (text.includes("pricing") || text.includes("sales")) department = "Sales";
  else if (text.includes("bug") || text.includes("issue")) department = "Operations";
  else if (text.includes("help") || text.includes("support")) department = "Support";

  let sentiment = "Neutral";
  let urgency = "Medium";
  if (text.includes("urgent") || text.includes("error") || text.includes("broken")) {
    sentiment = "Negative";
    urgency = "High";
  } else if (text.includes("thanks") || text.includes("good")) {
    sentiment = "Positive";
    urgency = "Low";
  }

  // Generate a realistic-sounding mock summary
  let summary = `Sender is inquiring regarding ${subject}. They need assistance from the ${department} team.`;
  if (department === "Finance") {
    summary = `Customer reports an issue with their invoice or payment. They are requesting immediate clarification.`;
  } else if (department === "Operations" && urgency === "High") {
    summary = `Customer reports a critical system error or bug. They are requesting a hotfix immediately.`;
  }

  return { summary, sentiment, urgency, department };
}
