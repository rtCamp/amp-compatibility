#!/usr/bin/env bash

set -ex
export CI=true

function start_services() {

	echo "Starting services"
	git config --global user.email "nobody@example.com"
	git config --global user.name "nobody"
	rm /etc/nginx/conf.d/stub_status.conf /etc/nginx/sites-available/22222 /etc/nginx/sites-enabled/22222
	rm -rf /var/www/22222
	wo stack start --nginx --mysql --php74
	wo stack status --nginx --mysql --php74
}

function update_mysql_user() {

	user="admin"
	pass=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 20; echo '')
	mysql --execute="CREATE USER 'admin'@'localhost' IDENTIFIED BY '$pass';"
	mysql --execute="GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;"
	cat <<EOF > /etc/mysql/conf.d/my.cnf
[client]
user = $user
password = $pass
EOF
	wo stack restart --mysql
}

function get_diff_files() {

	cd "$GITHUB_WORKSPACE"
	if [[ "$GITHUB_BASE_REF" ]]; then
		# Pull Request
		git fetch origin "$GITHUB_BASE_REF" --depth=1
		export DIFF=$( git diff --name-only "origin/$GITHUB_BASE_REF" "$GITHUB_SHA" )
	else
		# Push event.
		# This script should not trigger in push event.
		exit 0
	fi
}

function setup_repo() {

	if [[ "$CI" == "true" ]]; then
		rsync -az "$GITHUB_WORKSPACE/" "$HOME/amp-compatibility"
		ls -alh $HOME/amp-compatibility
	else
		GITHUB_REPOSITORY="$1"
		repo_data=("${GITHUB_REPOSITORY//\// }")
		cd "$HOME"
		if [[ ! -d "${repo_data[1]}" ]]; then
			REMOTE_REPO="git@github.com:$GITHUB_REPOSITORY.git"
			git clone "$REMOTE_REPO"
		fi
	fi
}

function move_dummy_data_repo() {

	mkdir -p /var/www/repos
	rsync -az "$GITHUB_WORKSPACE/amp-wp-dummy-data-generator" /var/www/repos
}

function setup_base_data() {

	bash "$HOME/amp-compatibility/amp-compatibility-server/scripts/sites/base-site.sh"
}

function run_synthetic_data_test() {

	plugins=()
	themes=()
	for path in $DIFF; do
		if [[ "$path" == "amp-wp-dummy-data-generator/data/"* ]]; then
			strip_prefix=${path#"amp-wp-dummy-data-generator/data/"}
			IFS='/' read -r -a data <<< "$strip_prefix"
			if [[ "${data[1]}" == "plugins" ]]; then
				plugins+=( "${data[2]}" )
			else
				themes+=( "${data[2]}" )
			fi
		fi
	done

	sorted_unique_plugins=($(echo "${plugins[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))
	sorted_unique_themes=($(echo "${themes[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

	cd "$HOME/amp-compatibility"

	for plugin in "${sorted_unique_plugins[@]}"; do
		echo "Running test for $plugin"
		bash ./amp-compatibility-server/scripts/sites/wp-site-run-test.sh --plugins="$plugin" --domain="plugin-$plugin" --preserve-site
	done

	for theme in "${sorted_unique_themes[@]}"; do
		echo "Running test for $theme"
		bash ./amp-compatibility-server/scripts/sites/wp-site-run-test.sh --theme="$theme" --domain="theme-$theme" --preserve-site
	done
}


function main() {

	get_diff_files
	start_services
	update_mysql_user
	setup_repo
	move_dummy_data_repo
	setup_base_data
	run_synthetic_data_test
}

main
