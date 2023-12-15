FROM node:18-alpine
LABEL author="DeadDuck"

RUN apk update\
	&& apk upgrade\
	&& apk add git
RUN npm install pm2 -g

WORKDIR /home/container/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
COPY ../git .

EXPOSE 4000

ENV NODE_ENV=production
CMD git pull && pm2-runtime ecosystem.config.js