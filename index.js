const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
const VERIFY_TOKEN = "test123";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else { res.sendStatus(403); }
});
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text;
        let aiReply = "ثانية...";
        try {
          const aiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "انت مساعد جزائري ترد بالدارجة الجزائرية باحترام. اسمك بوت Moha." },
              { role: "user", content: userMessage }
            ]
          }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` } });
          aiReply = aiRes.data.choices[0].message.content;
        } catch (e) {