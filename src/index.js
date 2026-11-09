import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("👑 WISE PRINCE ✝️ CONNECTED");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("🔴 WISE PRINCE disconnected");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 WISE PRINCE ✝️\n🏓 Pong!\n⚡ Bot aktif."
      });
    }

    if (text.toLowerCase() === ".alive") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👑 WISE PRINCE ✝️\n🟢 Mwen aktif 24/7."
      });
    }

    if (text.toLowerCase() === ".menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `╭━━〔 👑 WISE PRINCE ✝️ 〕━━╮
┃ 🤖 WhatsApp Bot
┃ ⚡ Prefix : .
┃ 🟢 Status : Online
╰━━━━━━━━━━━━━━━━━━━━━━╯

『 MAIN 』
┋ ⬡ ping
┋ ⬡ alive
┋ ⬡ menu

『 GROUP 』
┋ ⬡ tagall

© WISE PRINCE ✝️`
      });
    }
  });
}

startBot().catch(console.error);
