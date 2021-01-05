#!/usr/bin/env bash

log_info1() {

	declare desc="log info1 formatter"
	echo "-----> $*"
}

log_info2() {

	declare desc="log info2 formatter"
	echo "=====> $*"
}

function bootstrap() {

	# Exit if root user is not running this script.
	if [[ "$EUID" -ne 0 ]]; then
		log_info1 "Please run as root."
		exit 1
	fi

	maybe_install_packages curl wget git tmux
	create_swap
}

function maybe_install_packages() {

	apt update
	for ARG in "$@"; do
		if [ ! command -v "$ARG" > /dev/null 2>&1 ]; then
			log_info2 "Installing package: $ARG"
			apt install -y "$ARG"
		fi
	done
}

function create_swap() {

	log_info2 "Enabling 2GiB swap"
	SWAP_FILE="/swapfile"
	fallocate -l 2G $SWAP_FILE
	chmod 600 $SWAP_FILE
	chown root:root $SWAP_FILE
	mkswap $SWAP_FILE
	swapon $SWAP_FILE
	echo "$SWAP_FILE none swap sw 0 0" | tee -a /etc/fstab
	sysctl vm.swappiness=10
	echo 'vm.swappiness=10' >> /etc/sysctl.conf
	sysctl vm.vfs_cache_pressure=50
	echo 'vm.vfs_cache_pressure = 50' >> /etc/sysctl.conf
}

function install_dependencies() {
	setup_wo
	setup_node
}

function setup_wo() {

	wget -qO wo wops.cc
	git config --global user.email "testing@amp-comp.com"
	git config --global user.name "amp-comp"
	echo "amp-comp
testing@amp-comp.com" > answers.txt
	bash wo < answers.txt
	rm wo answers.txt

	# Install basic nginx and mysql
	wo stack install --nginx --mysql

}

function setup_node() {

	log_info2 "Configuring node"
	curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
	bash nodesource_setup.sh
	apt install -y nodejs
	rm nodesource_setup.sh

	# Install adonis cli
	npm install -g @adonisjs/cli
}

function add_gh_pub_key() {

	# add github's public key
	echo "|1|qPmmP7LVZ7Qbpk7AylmkfR0FApQ=|WUy1WS3F4qcr3R5Sc728778goPw= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==" >> /root/.ssh/known_hosts
}

function setup_repo() {

	cd "$HOME"
	GITHUB_REPOSITORY="$1"
	REMOTE_REPO="https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/$GITHUB_REPOSITORY.git"
	git clone "$REMOTE_REPO"
}

function setup_local_repo() {

	cd "$HOME/$1"
	npm i
}

function main() {

	bootstrap
	install_dependencies
	add_gh_pub_key
	setup_repo "rtCamp/amp-compatibility-server"
	setup_repo "rtCamp/amp-wp-dummy-data-generator"
	setup_local_repo "amp-compatibility-server"
}

main
