#!/bin/bash

source .env

if [ ! -z "$GIT_BRANCH" ]
then
	git checkout $GIT_BRANCH -f
	git reset HEAD --hard
	git pull
fi

npm i
node index