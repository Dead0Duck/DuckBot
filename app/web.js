const crypto = require('crypto')
const express = require("express")
const https = require("https")
const bodyParser = require("body-parser")

var certCreds = {key: process.env.SSL_KEY, cert: process.env.SSL_CERT};

const sigHeaderName = 'X-Hub-Signature-256'
const sigHashAlg = 'sha256'

const app = express()
const PORT = 443

app.use(bodyParser.json({
	verify: (req, res, buf, encoding) => {
		if (buf && buf.length) {
			req.rawBody = buf.toString(encoding || 'utf8');
		}
	},
}))

function verifyPostData(req, res, next) {
	if (!req.rawBody) {
		return next('Request body empty')
	}

	const sig = Buffer.from(req.get(sigHeaderName) || '', 'utf8')
	const hmac = crypto.createHmac(sigHashAlg, process.env.GIT_SECRET)
	const digest = Buffer.from(sigHashAlg + '=' + hmac.update(req.rawBody).digest('hex'), 'utf8')
	if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${sig})`)
	}

	return next()
}

app.use(bodyParser.json())
app.post("/webhooks/git_update", verifyPostData, (req, res) => {
	res.status(200).end()

	//TODO: Выключать бота только при изменениях в ветке авто-апдейта.

	console.info("Git updated, restarting")
	process.exit(0);
})

var httpsServer = https.createServer(certCreds, app);
httpsServer.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`)