FROM node:18-alpine
LABEL author="DeadDuck"
LABEL org.opencontainers.image.source https://github.com/dead0duck/duckbot_pg

RUN apk update\
	&& apk upgrade\
	&& apk add git

ARG GIT_TOKEN=$GIT_TOKEN

RUN git config --global --add safe.directory /home/container
RUN git config \
	--global \
	url."https://${GIT_TOKEN}@github.com".insteadOf \
	"https://github.com"

# Install node_modules
WORKDIR /home/container/app

EXPOSE 80
EXPOSE 443
EXPOSE 4000

CMD /bin/sh startup.sh