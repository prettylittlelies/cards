import type { TelegramClient } from "@mtcute/bun";
import { renderUnicodeCompact } from "uqr";
import { loadCredentials } from "@/telegram/config";
import { createClient, DEVICE } from "@/telegram/connection";

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

const describeSessions = async (tg: TelegramClient): Promise<void> => {
  const { authorizations } = await tg.call({ _: "account.getAuthorizations" });
  const current = authorizations.find((entry) => entry.current);
  console.log(`\n${authorizations.length} active sessions on this account`);
  if (current) {
    console.log(`this one: ${current.deviceModel} · ${current.appName} ${current.appVersion} · ${current.platform} ${current.systemVersion} · hash ${current.hash.toString()}`);
  }
  const twins = authorizations.filter((entry) => !entry.current && entry.deviceModel === DEVICE.deviceModel);
  if (twins.length > 0) console.log(`note: ${twins.length} older ${DEVICE.deviceModel} session(s) still active; end them in Settings → Devices if unused`);
};

const credentials = loadCredentials();
if (!credentials) throw new Error("set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env first");

const client = createClient(credentials);
const self = process.argv.includes("--phone")
  ? await client.start({ phone: () => ask("Phone >"), code: () => ask("Code >"), password: () => ask("2FA password >") })
  : await client.signInQr({
      onUrlUpdated: (url, expires) => {
        console.clear();
        console.log(renderUnicodeCompact(url));
        console.log(`scan in Telegram → Settings → Devices → Link Desktop Device (expires ${expires.toLocaleTimeString()})`);
      },
      onQrScanned: () => console.log("scanned, finishing…"),
      password: () => ask("2FA password >"),
    });

const session = await client.exportSession();
await describeSessions(client);
await client.destroy();

await upsertEnv(SESSION_KEY, session);
console.log(`\nlogged in as ${self.displayName} (@${self.username ?? "no username"}), ${SESSION_KEY} saved to .env`);
