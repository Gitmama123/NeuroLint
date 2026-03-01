const https = require("https");

const data = JSON.stringify({
  model: "deepseek-ai/DeepSeek-R1-0528",
  messages: [
    { role: "user", content: "Say hello." }
  ]
});

const options = {
  hostname: "api.tokenfactory.nebius.com",
  path: "/v1/chat/completions",
  method: "POST",
  headers: {
    "Authorization": "Bearer v1.CmQKHHN0YXRpY2tleS1lMDBqbmVuMWc1OHloYWowaHMSIXNlcnZpY2VhY2NvdW50LWUwMGNtZDNhZHp0N2o0OHdwcDIMCIfjsswGEPKjsdUCOgwIiObKlwcQgM-ShANAAloDZTAw.AAAAAAAAAAFRhGRtd5wFhcWnV5ZnCcjodqmFiRpfSgrr5kU0gp87VCR3mgCPSFaeuala-3qjq5g9iTSoysFf5U6OZpw-BeoD",
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", body);
  });
});

req.on("error", err => {
  console.error("ERROR:", err);
});

req.write(data);
req.end();
