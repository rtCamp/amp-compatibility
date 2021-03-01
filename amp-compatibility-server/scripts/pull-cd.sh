#!/usr/bin/env bash

# Cron based CD as deploying to GCE is not possible due to firewall restrictions.

REPO_ROOT="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )/../../" >/dev/null 2>&1 && pwd )"
lock="/tmp/update.lock"

function maybe_create_lock() {

	if [[ -f "$lock" ]]; then
		echo "Cron already running, exiting..."
	else
		touch "$lock"
	fi
}

function release_lock() {

	[[ -f "$lock" ]] && rm "$lock"
}

function clean_repo() {

	# Check for dirty git root and reset it.
	if [[ $(git -C "$REPO_ROOT" diff --stat) != '' ]]; then
		git -C "$REPO_ROOT" reset --hard
	fi
}

function maybe_update_repo() {

	git -C "$REPO_ROOT" remote update &> /dev/null
	if [[ $(git -C "$REPO_ROOT" rev-parse HEAD) != $(git -C "$REPO_ROOT" rev-parse "@{u}") ]]; then
		echo "-------------- Updating repo ---------------"
		clean_repo
		git -C "$REPO_ROOT" pull
		post_update_runs
		echo "--------------------------------------------"
	fi
}

function post_update_runs() {

	cd "$REPO_ROOT/amp-compatibility-server"
	npm i
	npm run prod
	pm2 restart ecosystem.config.js
	bash "$REPO_ROOT/amp-compatibility-server/scripts/add-cron.sh"
}


function main() {

	cd "$REPO_ROOT"
	maybe_create_lock
	maybe_update_repo
	release_lock
}

main
