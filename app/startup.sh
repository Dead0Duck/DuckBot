#!/bin/bash

source .env

pm2 stop ecosystem.config.js

if [ ! -z "$GIT_BRANCH" ]
then
	git checkout $GIT_BRANCH -f
	git reset HEAD --hard
	git pull
fi

npm i
pm2-runtime ecosystem.config.js