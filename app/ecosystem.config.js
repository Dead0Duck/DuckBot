module.exports = {
	apps: [{
		name: "bot",
		script: "index.js",
		watch: true,
		watch_options: {
			usePolling: true
		},
		watch_delay: 1000,
		ignore_watch : ["node_modules", "\\.git", "*.log", "Dockerfile"],
	}]
}