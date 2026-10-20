const express = require('express');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "test123";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("CHECK KEYS:", { hasPage: !!PAGE_ACCESS_TOKEN, hasGroq: !!GROQ_API_KEY });
const groq = new Groq({ apiKey: GROQ_API_KEY });
app.get('/', (req, res) => res.send('Bot is running!'));
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else { res.sendStatus(403); }
});
app.post('/webhook', async (req, res) => {
  console.log("WEBHOOK RECEIVED");
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const event = entry.messaging[0];
      if (event.message && event.message.text) {
        const sender = event.sender.id;
        const text = event.message.text;
        try {
          const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: "Reply in Algerian Arabic Darija" }, { role: "user", content: text }],
            model: "llama-3.1-8b-instant",
          });
          const reply = completion.choices[0]?.message?.content || "Sorry!";
          await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: sender }, message: { text: reply }
          });
          console.log("SENT OK");
        } catch (e) { console.error("ERROR:", e.response ? JSON.stringify(e.response.data) : e.message); }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else { res.sendStatus(404); }
});
app.listen(process.env.PORT || 10000, () => console.log('Server running'));
