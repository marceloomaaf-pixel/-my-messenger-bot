const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "test123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log("CHECK KEYS:", { hasPage: !!PAGE_ACCESS_TOKEN, hasGroq: !!GROQ_API_KEY });

app.get('/', (req, res) => res.send('Bot is running'));

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object !== 'page') return res.sendStatus(404);
  
  for (const entry of body.entry) {
    const event = entry.messaging[0];
    const sender = event.sender.id;
    if (event.message && event.message.text) {
      const userMsg = event.message.text;
      let reply = "ثانية برك...";
      try {
        const ai = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "انت مساعد جزائري اسمه Moha، ترد بالدارجة الجزائرية باحترام." },
            { role: "user", content: userMsg }
          ]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });
        reply = ai.data.choices[0].message.content;
      } catch (err) {
        console.log("Groq error", err.message);
        reply = "سمحلي خويا، عاود بعد دقيقة 🙏";
      }
      await axios.post(`https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: sender },
        message: { text: reply }
      });
    }
  }
  res.status(200).send('EVENT_RECEIVED');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));