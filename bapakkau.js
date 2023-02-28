// Menambahkan Dependencies
const {
  default: makeWASocket,
  DisconnectReason,
  useSingleFileAuthState,
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const { state, saveState } = useSingleFileAuthState("./login.json");

//Bagian coding ChatGPT
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

//Fungsi Open AI chatGPT untuk mendapatkan respon
async function generateResponse(text) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0.3,
    max_tokens: 2000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });
  return response.data.choices[0].text;
}

// Fungsi Utama Bapakkau WA Bot
async function connectToWhatsApp() {
  //Buat sebuah koneksi baru ke Whatsapp
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  });

  //Listen for Connection Update
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect.error = Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "Koneksi Terputus karena",
        lastDisconnect.error,
        ", Hubungkan Kembali!",
        shouldReconnect
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("Koneksi Tersambung!");
    }
  });
  sock.ev.on("creds.update", saveState);

  // Fungsi untuk Mantau pesan masuk
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log("Tipe Pesan: ", type);
    console.log(messages);
    if (type === "notify" && !messages[0].key.fromMe) {
      try {
        //dapatkan nomor pengirim
        const senderNumber = messages[0].key.remoteJid;
        let incomingMessages = messages[0].message.conversation;
        if (incomingMessages === "") {
          incomingMessages = messages[0].message.extendedTextMessage.text;
        }
        incomingMessages = incomingMessages.toLowerCase();

        // Dapatkan Info pesan dari Gruop atau bukan
        // Dan menyebut bot atau tidak
        const isMessageFromGroup = senderNumber.includes("@g.us");
        const isMessageMentionBot = incomingMessages.includes("@6281775149427");

        //Tampilkan status pesan dari group atau bukan
        //Tampilkan status pesan menyebut bot atau tidak
        console.log("Apakah pesan dari Group?", isMessageFromGroup);
        console.log("Apakah pesan dari Bot?", isMessageMentionBot);

        // Tampilkan nomor pengiri dan isi pesan
        console.log("Nomor Pengirim:", senderNumber);
        console.log("Isi Pesan:", incomingMessages);

        //Kalo misalkan nanya langsung ke Bot / JAPRI
        if (!isMessageFromGroup) {
          //Jika ada yang mengirim pesan mengandung kata 'siapa'
          if (
            incomingMessages.includes("siapa") &&
            incomingMessages.includes("kamu")
          ) {
            await sock.sendMessage(
              senderNumber,
              { text: "Saya Bot!" },
              { quoted: messages[0] },
              2000
            );
          } else {
            async function main() {
              const result = await generateResponse(incomingMessages);
              console.log(result);
              await sock.sendMessage(
                senderNumber,
                { text: result + "\n\n" },
                { quoted: messages[0] },
                2000
              );
            }
            main();
          }
        }

        //Kalo misalkan nanya via Group
        if (isMessageFromGroup && isMessageMentionBot) {
          //Jika ada yang mengirim pesan mengandung kata 'siapa'
          if (
            incomingMessages.includes("siapa") &&
            incomingMessages.includes("kamu")
          ) {
            await sock.sendMessage(
              senderNumber,
              { text: "Saya Adalah Bot!" },
              { quoted: messages[0] },
              2000
            );
          } else {
            async function main() {
              const result = await generateResponse(incomingMessages);
              console.log(result);
              await sock.sendMessage(
                senderNumber,
                { text: result + "\n\n" },
                { quoted: messages[0] },
                2000
              );
            }
            main();
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
}

connectToWhatsApp().catch((err) => {
  console.log("Ada Error" + err);
});
