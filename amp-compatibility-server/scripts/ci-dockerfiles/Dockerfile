# docker://rtcamp/synthetic-run-test is built using this Dockerfile

## Build steps:
### cd $REPO_ROOT/amp-compatibility-server/scripts/ci-dockerfiles/Dockerfile
### docker build -t rtcamp/synthetic-run-test .
### docker push rtcamp/synthetic-run-test 
FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt update && \
	apt install -y git wget curl rsync

RUN wget -qO wo wops.cc && \
	git config --global user.email "nobody@example.com" && \
	git config --global user.name "nobody" && \
	bash wo && \
	rm wo && \
	apt install -y mariadb-server && \
	wo stack install --nginx --php74 --mysql && \
	rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /*.sh

ENTRYPOINT ["/entrypoint.sh"]
