const https = require('https');
https.get('https://html.duckduckgo.com/html/?q=Hilton+Paris+Opera+contact+email', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const emails = data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    console.log(emails);
  });
});
