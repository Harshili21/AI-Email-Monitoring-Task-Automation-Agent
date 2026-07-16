import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RawRealEmail {
  Subject: string;
  Sender: string;
  Date: string;
  Flags: string[];
  Body_Text?: string;
  Body_Html?: string;
  Recipient?: string;
}

function parseSender(senderStr: string) {
  const match = senderStr.match(/^(.*?)\s*<(.*?)>$/);
  if (match) {
    return { name: match[1].trim() || match[2].trim(), email: match[2].trim() };
  }
  return { name: senderStr.trim(), email: senderStr.trim() };
}

const cleanStr = (str: string) => str.replace(/[\r\n\t]+/g, " ").trim();

async function main() {
  console.log("Starting seed...");
  
  const emailsResultPath = path.join(__dirname, "../src/services/emails_result.json");
  if (!fs.existsSync(emailsResultPath)) {
    console.error("No emails_result.json found. Skipping email seed.");
    return;
  }
  
  const realEmailsRaw: RawRealEmail[] = JSON.parse(fs.readFileSync(emailsResultPath, "utf-8"));
  
  // Clear existing data
  await prisma.email.deleteMany();
  await prisma.mailbox.deleteMany();
  await prisma.integration.deleteMany();
  
  console.log("Seeding Mailboxes and Integrations...");
  await prisma.mailbox.createMany({
    data: [
      { email: "support@yourcompany.com", active: true },
      { email: "sales@yourcompany.com", active: true },
      { email: "billing@yourcompany.com", active: false },
    ]
  });
  
  await prisma.integration.createMany({
    data: [
      { name: "Microsoft Graph", connected: true, detail: "3 mailboxes active" },
      { name: "ClickUp", connected: true, detail: "Workspace: Acme HQ" },
      { name: "OpenAI", connected: true, detail: "gpt-4o-mini" },
      { name: "Scheduler", connected: true, detail: "Last run 2 min ago" },
      { name: "Environment", connected: true, detail: "production" },
    ]
  });

  console.log("Seeding Emails...");
  const reversed = realEmailsRaw.slice().reverse();
  
  for (let i = 0; i < reversed.length; i++) {
    const raw = reversed[i];
    const { name, email } = parseSender(raw.Sender);
    const subjectLower = raw.Subject.toLowerCase();
    
    let department = "Other";
    if (subjectLower.includes("invoice") || subjectLower.includes("payment") || subjectLower.includes("tax") || subjectLower.includes("billing") || subjectLower.includes("refund")) {
      department = "Finance";
    } else if (subjectLower.includes("hire") || subjectLower.includes("hiring") || subjectLower.includes("career") || subjectLower.includes("apply") || subjectLower.includes("job") || subjectLower.includes("resume") || subjectLower.includes("internship")) {
      department = "HR";
    } else if (subjectLower.includes("contract") || subjectLower.includes("legal") || subjectLower.includes("nda") || subjectLower.includes("agreement")) {
      department = "Legal";
    } else if (subjectLower.includes("proposal") || subjectLower.includes("pricing") || subjectLower.includes("sales") || subjectLower.includes("quote") || subjectLower.includes("demo")) {
      department = "Sales";
    } else if (subjectLower.includes("bug") || subjectLower.includes("error") || subjectLower.includes("broken") || subjectLower.includes("issue") || subjectLower.includes("fail") || subjectLower.includes("practical") || subjectLower.includes("lab")) {
      department = "Operations";
    }

    let sentiment = "Neutral";
    let urgency = "Medium";
    if (subjectLower.includes("urgent") || subjectLower.includes("alert") || subjectLower.includes("broken") || subjectLower.includes("fail") || subjectLower.includes("failed") || subjectLower.includes("error") || subjectLower.includes("security")) {
      sentiment = "Negative";
      urgency = "High";
    } else if (subjectLower.includes("welcome") || subjectLower.includes("success") || subjectLower.includes("won") || subjectLower.includes("congratulations") || subjectLower.includes("good") || subjectLower.includes("thanks") || subjectLower.includes("thank you")) {
      sentiment = "Positive";
      urgency = "Low";
    }

    let status = "Completed";
    const isRead = raw.Flags?.some(f => f.toLowerCase().includes("seen"));
    if (!isRead) {
      if (sentiment === "Negative") status = "Needs Review";
      else if (Math.random() > 0.65) status = "Pending";
      else if (Math.random() > 0.75) status = "Processing";
    }

    const cleanSubject = cleanStr(raw.Subject) || "(No Subject)";
    const cleanSender = cleanStr(name) || "Unknown Sender";
    const clientId = `client-${cleanSender.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
    const conf = 0.5 + Math.random() * 0.49;

    let receivedAt = new Date();
    try {
      const parsedDate = new Date(raw.Date);
      if (!isNaN(parsedDate.getTime())) receivedAt = parsedDate;
    } catch (err) {}

    const emailRecord = await prisma.email.create({
      data: {
        sender: cleanSender,
        senderEmail: email,
        recipient: raw.Recipient || "demo.signal.test@gmail.com",
        clientId,
        clientName: cleanSender,
        subject: cleanSubject,
        body: raw.Body_Text || cleanSubject,
        htmlBody: raw.Body_Html || `<p><b>Subject:</b> ${cleanSubject}</p><p><b>Date:</b> ${raw.Date}</p><br/><pre style="white-space: pre-wrap; font-family: inherit;">${raw.Body_Text || cleanSubject}</pre>`,
        plainBody: raw.Body_Text || `Real email received from ${cleanSender} <${email}>.\nSubject: ${cleanSubject}\nDate: ${raw.Date}`,
        department,
        status,
        receivedAt,
        conversationId: `conv-${1000 + i}`,
        messageId: raw.Subject + raw.Date,
        ai: {
          create: {
            summary: `AI classified real email from ${cleanSender} regarding "${cleanSubject}". Route to ${department} with ${sentiment} sentiment.`,
            sentiment,
            category: "Real Mail",
            urgency,
            businessImportance: "Medium",
            confidence: Math.round(conf * 100) / 100,
          }
        }
      }
    });

    if (status === "Completed") {
      await prisma.clickUpTask.create({
        data: {
          taskId: `CU-${10000 + i}`,
          folder: "Client Requests",
          emailSubject: cleanSubject,
          status: "Completed",
          emailId: emailRecord.id
        }
      });
    }
  }
  console.log("Seeding finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
