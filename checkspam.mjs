import fetch from 'node-fetch';
import fs from 'fs';
import { promisify } from 'util';

const vanity = "url";
const server_id = "sw id";
const webhook_url = "webhook";
const banli = true; // url banlıysa true değilse false yap kitabını sikeriz

const readFileAsync = promisify(fs.readFile);

async function find() {
    const proxies = await readFileAsync("proxies.txt", "utf8");
    const tokens = (await readFileAsync("token.txt", "utf8")).trim().split("\n");

    let currentTokenIndex = 1;

    while (true) {
        await delay(1);
        const proxyList = proxies.trim().split("\n");
        const proxy = proxyList.length > 0 ? { 'http': 'http://' + proxyList[Math.floor(Math.random() * proxyList.length)] } : {};
        const token = tokens[currentTokenIndex];

        try {
            const response = await fetch("https://discord.com/api/v9/invites/" + vanity, { headers: { 'Authorization': token }, proxy });

            if (response.status === 404) {
                await keep(token);
                const checkResponse = await fetch("https://discord.com/api/v9/invites/" + vanity, { headers: { 'Authorization': token } });

                if (checkResponse.status === 200) {
                    console.log("Vanity Url Başarılı Şekilde Çekildi");
                    await sendWebhook({ content: "||@everyone|| Url Başarılı Şekilde Alındı - Made by nighthawk :" + vanity });
                    return;
                }
            } else if (response.status === 429) {
                console.log("Rate Limiti Yendi, Bir Sonraki Token İle Denenecek Api Response : 429");
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            }
        } catch (error) {
            console.error("Hata Oluştu :", error);
        }

        currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
    }
}

async function checkToken() {
    const tokens = (await readFileAsync("token.txt", "utf8")).trim().split("\n");

    while (true) {
        for (const token of tokens) {
            try {
                const response = await fetch("https://discord.com/api/v9/users/@me", { headers: { 'Content-Type': 'application/json', 'Authorization': token } });

                if (response.status !== 200) {
                    console.log("Deneniyor :", vanity);
                }
            } catch (error) {
                console.error("Hata Oluştu :", error);
            }
        }
    }
}

async function keep(token) {
    const payload = { code: vanity };
    const url = "https://discord.com/api/v9/guilds/" + server_id + "/vanity-url";

    try {
        const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(payload) });
        console.log(await response.text());
    } catch (error) {
        console.error("Hata Oluştu :", error);
    }
}

async function sendWebhook(data) {
    try {
        await fetch(webhook_url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Webhook Gönderirken Hata Oluştu:", error);
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

find();
checkToken();
