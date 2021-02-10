#!/usr/bin/env bash

if [[ -f ~/.bash_aliases ]]; then
	. ~/.bash_aliases
fi

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
	check_swap
}

function maybe_install_packages() {

	apt update
	for ARG in "$@"; do
		if ! command -v "$ARG" > /dev/null 2>&1; then
			log_info2 "Installing package: $ARG"
			apt install -y "$ARG"
		fi
	done
}

function check_swap() {

	log_info2 "Checking swap"
	if free | awk '/^Swap:/ {exit !$2}'; then
		:
	else
		create_swap
	fi
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

	if ! command -v wo >/dev/null 2>&1; then
		setup_wo
	fi

	if ! command -v node >/dev/null 2>&1; then
		setup_node
	fi
}

function setup_wo() {

	wget -qO wo wops.cc
	# git config --global user.email "testing@amp-comp.com"
	# git config --global user.name "amp-comp"
	echo "amp-comp
testing@amp-comp.com" > answers.txt
	bash wo < answers.txt
	rm wo answers.txt

	# Install basic nginx and mysql
	wo stack install --nginx --mysql --php73 --wpcli
	rm /etc/nginx/conf.d/stub_status.conf /etc/nginx/sites-enabled/22222

cat <<EOF > /etc/php/7.3/fpm/pool.d/www.conf
[www-php73]
user = www-data
group = www-data
listen = php73-fpm.sock
listen.owner = root
listen.group = www-data
pm = ondemand
pm.max_children = 5000
pm.start_servers = 2500
pm.min_spare_servers = 1500
pm.max_spare_servers = 3500
ping.path = /ping
pm.status_path = /status
pm.max_requests = 1500
request_terminate_timeout = 300
chdir = /
prefix = /var/run/php
listen.mode = 0660
listen.backlog = 32768
catch_workers_output = yes
EOF

	wo stack restart --php
}

function setup_node() {

	log_info2 "Configuring node"
	curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
	bash nodesource_setup.sh
	apt install -y nodejs
	rm nodesource_setup.sh

	# Install adonis cli
	npm install -g @adonisjs/cli
	npm install -g pm2
}

function add_gh_pub_key() {

	# add github's public key
	echo "|1|qPmmP7LVZ7Qbpk7AylmkfR0FApQ=|WUy1WS3F4qcr3R5Sc728778goPw= ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==" >> /root/.ssh/known_hosts
}

function setup_repo() {

	GITHUB_REPOSITORY="$1"
	repo_data=(${GITHUB_REPOSITORY//\// })
	cd "$HOME"
	if [[ ! -d "${repo_data[1]}" ]]; then
		REMOTE_REPO="git@github.com:$GITHUB_REPOSITORY.git"
		git clone "$REMOTE_REPO"
	fi
}

function setup_local_repo() {

	cd "$HOME/amp-compatibility/amp-compatibility-server"
	npm i && npm run prod
}

function move_dummy_data_repo() {

	mkdir -p /var/www/repos
	mv "$HOME/amp-compatibility/amp-wp-dummy-data-generator" /var/www/repos
}

function setup_base_data() {
	bash "$HOME/amp-compatibility/amp-compatibility-server/scripts/sites/base-site.sh"
}

function create_log_dirs() {

	mkdir -p /var/log/adonis
	mkdir -p /var/log/sites
}

function setup_newrelic_infra_agent() {

	curl -s https://download.newrelic.com/infrastructure_agent/gpg/newrelic-infra.gpg | apt-key add -
	echo "license_key: $NEWRELIC_LICENSE" > /etc/newrelic-infra.yml
	printf "deb [arch=amd64] https://download.newrelic.com/infrastructure_agent/linux/apt buster main" | tee -a /etc/apt/sources.list.d/newrelic-infra.list
	apt update
	apt install newrelic-infra -y

cat <<EOF > /etc/newrelic-infra/logging.d/amp-comp.yml
logs:
  - name: "synthetic-sites-data"
    file: /var/log/sites/*.log
  - name: "adonis-logs"
    file: /var/log/adonis/*.log
  - name: "setup-logs"
    file: /var/log/init.log
EOF
	systemctl restart newrelic-infra.service
}

function main() {

	bootstrap
	install_dependencies
	add_gh_pub_key
	setup_repo "rtCamp/amp-compatibility"
	setup_local_repo
	move_dummy_data_repo
	setup_base_data
	create_log_dirs
	setup_newrelic_infra_agent
}

main
