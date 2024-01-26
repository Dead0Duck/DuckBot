prepare:
	@if [ ! -f ./app/.env ]; then cp ./app/.env.default ./app/.env; fi
	@docker volume create duck-node_modules

run:
	@make prepare
	@docker compose up -d
	@docker attach duckbot

restart:
	@make stop
	@make run

push:
	@docker push ghcr.io/dead0duck/duckbot:latest

build:
	@docker-compose build --no-cache

stop:
	@docker compose down

cleanup:
	@make stop
	@docker image rm dead0duck/duckbot

attach:
	@docker logs -n 100 duckbot
	@docker attach duckbot