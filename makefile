prepare:
	@if [ ! -f ./app/.env ]; then cp ./app/.env.default ./app/.env; fi
	@docker volume create duck-node_modules

run:
	@make stop
	@make prepare
	@docker compose up -d
	@docker attach duckbot

build:
	@docker build --no-cache --pull -t dead0duck/duckbot_pg:latest ./app

stop:
	@docker compose down

cleanup:
	@make stop
	@docker image rm dead0duck/duckbot_pg

attach:
	@docker logs -n 100 duckbot
	@docker attach duckbot
