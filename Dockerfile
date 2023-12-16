FROM node:18-alpine
LABEL author="DeadDuck"
LABEL org.opencontainers.image.source https://github.com/dead0duck/duckbot

RUN apk update\
	&& apk upgrade\
	&& apk add git

ARG GIT_TOKEN=$GIT_TOKEN

RUN git config --global --add safe.directory /home/container
RUN git config \
	--global \
	url."https://${GIT_TOKEN}@github.com".insteadOf \
	"https://github.com"

EXPOSE 80 443 4000

WORKDIR /home/container/app
CMD /bin/sh startup.sh