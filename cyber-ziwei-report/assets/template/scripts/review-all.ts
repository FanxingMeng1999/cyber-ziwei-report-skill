import { spawn } from "node:child_process";

const tasks = ["typecheck", "audit:analysis", "audit:report", "check"];

async function runScript(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", "run", name], {
            cwd: process.cwd(),
            stdio: "inherit"
          })
        : spawn("npm", ["run", name], {
            cwd: process.cwd(),
            stdio: "inherit"
          });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm run ${name} failed with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function main(): Promise<void> {
  for (const task of tasks) {
    await runScript(task);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
