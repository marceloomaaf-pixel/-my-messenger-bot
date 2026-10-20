const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "test123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
app.get('/', (req, res) => res.send('Bot OK'));
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else res.sendStatus(403);
});
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object !== 'page') return res.sendStatus(404);
  for (const entry of body.entry) {
    const ev = entry.messaging[0];
    const sender = ev.sender.id;
    if (ev.message && ev.message.text) {
      let reply = "ثانية...";
      try {
        const r = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "انت بوت اسمه Moha ترد بالدارجة الجزائرية." },
            { role: "user", content: ev.message.text }
          ]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });
        reply = r.data.choices[0].message.content;
      } catch (e) {
        console.log(e.message);
        reply = "عاود بعد دقيقة 🙏";
      }
      await axios.post(`https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: sender },
        message: { text: reply }
      });
    }
  }
  res.send('EVENT_RECEIVED');
});
app.listen(process.env.PORT || 10000, () => console.log('Live'));