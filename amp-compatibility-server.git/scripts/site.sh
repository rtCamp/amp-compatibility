#!/usr/bin/env bash

function create_n_sites() {

	N=${1:-20}

	for (( i=1; i<=$N; i++ )); do
		wo site create "$i.local" --wp
	done
}


function main() {

	create_n_sites $1
}

main $1
