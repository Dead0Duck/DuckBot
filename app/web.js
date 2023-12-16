const express = require("express")
const https = require("https")
const bodyParser = require("body-parser")

var certCreds = {key: process.env.SSL_KEY, cert: process.env.SSL_CERT};

const app = express()
const PORT = 443

app.use(bodyParser.json())

app.use(bodyParser.json())
app.post("/webhooks/git_update", (req, res) => {
	console.log('hiii')
	res.status(200).end()

	var cp = require('child_process');
	cp.exec('./startup.sh', () => {})
})

var httpsServer = https.createServer(certCreds, app);
httpsServer.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`)