---
title: Installing Docker
description: Instructions to install Docker and Docker Compose
priority: 0.3
date: 2017-02-28
---

GenomeHubs makes extensive use of [Docker](http://www.docker.com) containers 
(available from [hub.docker.com/u/genomehubs](https://hub.docker.com/u/genomehubs)),
so installing Docker is a prerequisite for setting up an [Ensembl](http://ensembl.org) site using GenomeHubs.

For more detailed instructions and troubleshooting, please see the official [Docker documentation](https://docs.docker.com).

## Install Docker on a Ubuntu host

```
sudo apt-get update
sudo apt-get -y install apt-transport-https ca-certificates
sudo apt-key adv \
               --keyserver hkp://ha.pool.sks-keyservers.net:80 \
               --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
echo "deb https://apt.dockerproject.org/repo ubuntu-xenial main" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update

sudo apt-cache policy docker-engine
sudo apt-get -y install linux-image-extra-$(uname -r) linux-image-extra-virtual

sudo apt-get -y install docker-engine
```

Running Docker commands either requires `sudo` or adding users to the `docker` group:

```
sudo groupadd docker
sudo usermod -aG docker $USER
```

Either logout and log back in or run `newgrp docker` to join the `docker` group in the current shell.

Test Docker by running a simple container:

```
docker run hello-world
```

## (optional) Install Docker Compose

For further simplification it is possible to orchestrate Docker container deployment using Docker Compose.

Full details are available at [docs.docker.com](https://docs.docker.com/compose/overview/) or follow the quick instructions below:

```
sudo curl -L "https://github.com/docker/compose/releases/download/1.11.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Test the installation:

```
docker-compose --version
```
