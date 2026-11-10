import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

const BOT_NAME = "WISE PRINCE ✝️";
const PREFIX = ".";

const START_TIME = Date.now();

function runtime() {
  const seconds = Math.floor((Date.now() - START_TIME) / 1000);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function getText(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ""
  );
}

function menu() {
  return `
╭━━━〔 👑 ${BOT_NAME} 〕━━━╮
┃
┃ 🤖 Status : Online
┃ ⚡ Prefix : ${PREFIX}
┃ 📦 Version : V1.0.0
┃ ⏱️ Runtime : ${runtime()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

『 MAIN 』
┋ ⬡ alive
┋ ⬡ menu
┋ ⬡ owner
┋ ⬡ ping
┋ ⬡ runtime
┋ ⬡ stats
┋ ⬡ version

『 GROUP 』
┋ ⬡ add
┋ ⬡ kick
┋ ⬡ kickall
┋ ⬡ promote
┋ ⬡ demote
┋ ⬡ tagall
┋ ⬡ hidetag
┋ ⬡ link
┋ ⬡ rules
┋ ⬡ welcome

『 PROTECTION 』
┋ ⬡ antilink
┋ ⬡ antispam
┋ ⬡ anticall
┋ ⬡ antidelete

『 MEDIA 』
┋ ⬡ sticker
┋ ⬡ take

『 FUN & SOCIAL 』
┋ ⬡ joke
┋ ⬡ quote
┋ ⬡ love
┋ ⬡ dare
┋ ⬡ truth

『 AUTOMATION 』
┋ ⬡ autoread
┋ ⬡ autoreact

╰━━━━━━━━━━━━━━━━━━━━━━╯
        👑 WISE PRINCE ✝️
        Ti moun li, granmoun konprann.
`;
}

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["WISE PRINCE", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log(`
╔════════════════════════════╗
║     WISE PRINCE ✝️         ║
║      BOT CONNECTED         ║
╚════════════════════════════╝
`);
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      console.log("🔴 Bot disconnected.");

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        setTimeout(startBot, 3000);
      } else {
        console.log("⚠️ WhatsApp session logged out.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];

      if (!msg?.message || msg.key.fromMe) return;

      const text = getText(msg).trim();

      if (!text.startsWith(PREFIX)) return;

      const command =
        text.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();

      const chat = msg.key.remoteJid;

      if (!chat) return;

      switch (command) {

        case "ping":
          await sock.sendMessage(chat, {
            text: `🏓 Pong!\n\n👑 ${BOT_NAME}\n🟢 Bot aktif.`
          });
          break;

        case "alive":
          await sock.sendMessage(chat, {
            text: `🟢 ${BOT_NAME}\n\nBot la aktif e ap mache.\n⏱️ Runtime: ${runtime()}`
          });
          break;

        case "runtime":
          await sock.sendMessage(chat, {
            text: `⏱️ WISE PRINCE Runtime\n\n${runtime()}`
          });
          break;

        case "version":
          await sock.sendMessage(chat, {
            text: `👑 ${BOT_NAME}\n📦 Version: V1.0.0`
          });
          break;

        case "owner":
          await sock.sendMessage(chat, {
            text: `👑 Owner\n\nWISE PRINCE ✝️\n\nOwner number la ap konfigire nan VPS la.`
          });
          break;

        case "stats":
          await sock.sendMessage(chat, {
            text: `📊 WISE PRINCE STATS\n\n🟢 Status: Online\n⚡ Prefix: ${PREFIX}\n📦 Version: V1.0.0\n⏱️ Runtime: ${runtime()}`
          });
          break;

        case "menu":
          await sock.sendMessage(chat, {
            text: menu()
          });
          break;

        // ==============================
        // KICKALL
        // ==============================

        case "kickall": {

          // Verifye si se yon gwoup
          if (!chat.endsWith("@g.us")) {
            await sock.sendMessage(chat, {
              text: "❌ Kòmand sa a fèt sèlman nan gwoup."
            });
            break;
          }

          // Verifye admin ki voye kòmand lan
          const groupMetadata =
            await sock.groupMetadata(chat);

          const sender =
            msg.key.participant || msg.key.remoteJid;

          const senderInfo =
            groupMetadata.participants.find(
              (p) => p.id === sender
            );

          const isAdmin =
            senderInfo?.admin === "admin" ||
            senderInfo?.admin === "superadmin";

          if (!isAdmin) {
            await sock.sendMessage(chat, {
              text: "❌ Se sèlman admin ki ka itilize .kickall."
            });
            break;
          }

          // Chèche tout moun ki pa admin
          const membersToRemove =
            groupMetadata.participants
              .filter(
                (p) =>
                  !p.admin &&
                  p.id !== sock.user.id
              )
              .map((p) => p.id);

          if (membersToRemove.length === 0) {
            await sock.sendMessage(chat, {
              text: "ℹ️ Pa gen okenn manm nòmal pou retire."
            });
            break;
          }

          await sock.sendMessage(chat, {
            text:
              `⚠️ KICKALL aktive.\n\n` +
              `👥 Manm pou retire: ${membersToRemove.length}\n` +
              `🛡️ Admin yo ap rete nan gwoup la.`
          });

          // Retire manm yo
          await sock.groupParticipantsUpdate(
            chat,
            membersToRemove,
            "remove"
          );

          await sock.sendMessage(chat, {
            text:
              `✅ KICKALL fini.\n\n` +
              `👢 ${membersToRemove.length} manm retire.\n` +
              `👑 Admin yo rete nan gwoup la.`
          });

          break;
        }

        default:
          await sock.sendMessage(chat, {
            text:
              `❌ Kòmand *.${command}* pa egziste.\n\n` +
              `Ekri *.menu* pou wè kòmand disponib yo.`
          });
      }

    } catch (error) {
      console.error("Command error:", error);
    }
  });
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

startBot().catch((error) => {
  console.error("❌ Failed to start WISE PRINCE:", error);
});
