import { createServerFn } from "@tanstack/react-start";

export const triggerImapFetch = createServerFn({ method: "POST" }).handler(async () => {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const fs = await import("fs");
  const path = await import("path");

  const execAsync = promisify(exec);
  try {
    const scriptDir = "c:\\Users\\Harshili\\Desktop\\New folder (2)";
    const pythonScriptPath = path.join(scriptDir, "imap_test3.py");
    
    // Execute python script specifically in its own directory
    await execAsync(`python "${pythonScriptPath}"`, { cwd: scriptDir });
    
    // The script will write emails_result.json inside scriptDir
    const generatedPath = path.join(scriptDir, "emails_result.json");
    
    // Target location for the React App
    // We use process.cwd() assuming it's the Vite project root
    const targetPath = path.join(process.cwd(), "src", "services", "emails_result.json");
    
    if (fs.existsSync(generatedPath)) {
      fs.copyFileSync(generatedPath, targetPath);
      return { success: true, message: "Emails fetched and updated successfully." };
    }
    
    return { success: false, message: `emails_result.json was not found at ${generatedPath}` };
  } catch (error: any) {
    console.error("Error triggering IMAP fetch:", error);
    return { success: false, error: error.message };
  }
});
