import { loadCredentials } from "@/telegram/config";
import { createClient } from "@/telegram/connection";

const ENV_PATH = `${process.cwd()}/.env`;
const SESSION_KEY = "TELEGRAM_SESSION";

const upsertEnv = async (key: string, value: string): Promise<void> => {
  const file = Bun.file(ENV_PATH);
  const current = (await file.exists()) ? await file.text() : "";
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(current) ? current.replace(pattern, () => line) : `${current}${current && !current.endsWith("\n") ? "\n" : ""}${line}\n`;
  await Bun.write(ENV_PATH, next);
};

const ask = (question: string): string => {
  const answer = prompt(question)?.trim();
  if (!answer) throw new Error(`no input for "${question}"`);
  return answer;
};

const credentials = loadCredentials();
if (!credentials) throw new Error("set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env first (my.telegram.org → API development tools)");

const client = createClient(credentials);
const self = await client.start({
  phone: () => ask("Phone >"),
  code: () => ask("Code >"),
  password: () => ask("2FA password >"),
});
const session = await client.exportSession();
await client.destroy();

await upsertEnv(SESSION_KEY, session);
console.log(`logged in as ${self.displayName} (@${self.username ?? "no username"}), ${SESSION_KEY} saved to .env`);
console.log("this is a new authorization; it shows up under Settings → Devices and does not affect other sessions");
