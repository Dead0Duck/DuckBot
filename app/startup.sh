#!/bin/bash

source .env

if [ ! -z "$GIT_BRANCH" ]
then
	git checkout $GIT_BRANCH -f
	git reset HEAD --hard
	git pull && pm2-runtime ecosystem.config.js
fi

pm2-runtime ecosystem.config.js