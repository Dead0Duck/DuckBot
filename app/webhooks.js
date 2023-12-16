const express = require("express")
const bodyParser = require("body-parser")

const app = express()
const PORT = 3000

app.use(bodyParser.json())

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

app.use(bodyParser.json())
app.post("/webhooks/git_update", (req, res) => {
	console.log('hiii')
	res.status(200).end()

	var cp = require('child_process');
	cp.exec('./startup.sh', () => {})
})