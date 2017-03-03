---
title: Mirror Setup Part I
description: Set up a basic Ensembl Mirror site using Docker
priority: 0.7
date: 2017-02-28
---

This is the simplest setup to mirror [Ensembl](http://ensembl.org)/[EnsemblGenomes](http://ensemblgenomes.org)
species. To also set up a [SequenceServer](http://sequenceserver.com) BLAST server
and [h5ai](https://larsjung.de/h5ai/) downloads server and use the GenomeHubs Ensembl plugin, follow
[GenomeHubs Mirror Setup Part II](http://genomehubs.org/documentation/mirror-setup-part-ii/).

## Setup directories

GenomeHubs Docker containers are designed to be stateless so that individual containers
can be destroyed without any loss of data and the service may be simply restarted in a
new container. We achieve this by mounting data and configuration directories as volumes
within the relevant containers, which also allows us to keep all of the data and configuration
in an easily backed up and versioned directory structure.  For this simple example we need only
create a mySQL data directory, an Ensembl configuration directory and an additional Ensembl
directory for log files, which can be useful for debugging:

```
ubuntu@hostname:~$ mkdir -p ~/example/mysql/data
ubuntu@hostname:~$ mkdir -p ~/example/ensembl/conf
ubuntu@hostname:~$ mkdir -p ~/example/ensembl/logs
```

## Edit configuration files

Only two configuration files are required: `database.ini` to specify database user passwords
and names and locations of remote databases to mirror; and `setup.ini` to configure the
database connection settings, Ensembl plugins to use and databases to host in the GenomeHubs
Ensembl mirror site. Example files are available in the `basic-mirror` folder of the
[github.com/genomehubs/demo](https://github.com/genomehubs/demo) repository and [described here](http://dev.genomehubs.org/documentation/mirror-configuration/).

```
ubuntu@hostname:~$ wget -O ~/example/ensembl/conf/database.ini https://raw.githubusercontent.com/genomehubs/demo/master/basic-mirror/database.ini
ubuntu@hostname:~$ wget -O ~/example/ensembl/conf/setup.ini    https://raw.githubusercontent.com/genomehubs/demo/master/basic-mirror/setup.ini
```

## Docker containers

All GenomeHubs Docker containers are available from [hub.docker.com/u/genomehubs](https://hub.docker.com/u/genomehubs).
For this demo we will use the `genomehubs/easy-mirror:latest` Docker image and an official
mySQL image `mysql/mysql-server::5.5`.

### mySQL container
Full details of mySQL container configuration are available on the [mySQL Docker hub](https://hub.docker.com/_/mysql).
For the simplest possible setup in this example we set the root password in the
`docker run` command, if you change this password, be sure to update the corresponding
`DB_ROOT_PASSWORD` value in `setup.ini`.

```
docker run -d \
           --name example-mysql \
           -v ~/example/mysql/data:/var/lib/mysql \
           -e MYSQL_ROOT_PASSWORD=rootuserpassword \
           -e MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0' \
           mysql/mysql-server:5.5
```
Briefly, this command starts up a container based on the `mysql/mysql-server:5.5` image,
runs the process in the background `-d`, names the container `example-mysql` so it is easier
to refer to in subsequent commands, mounts the empty `example/mysql/data` directory
at `/var/lib/mysql` in the container and sets two environment variables `-e`. In this example
`MYSQL_ROOT_HOST` is set to allow the root user to connect from any container in the default
docker network. If restricting this, bear in mind that the `easy-mirror` container needs to
be able to connect as the mysql root user to set up database users for the mirror site.

To check that the container has started successfully, check the Docker log files using:

```
docker logs example-mysql
```

If the mysql user within the container cannot write to the `data` directory you may see a
permissions error that you will need to fix before proceeding.

### EasyMirror container

Start the `genomehubs/easy-mirror:latest` container with a similar command:

```
docker run -d \
           --name example-ensembl \
           -v ~/example/ensembl/conf:/ensembl/conf \
           -v ~/example/ensembl/logs:/ensembl/logs \
           --link example-mysql:mysql/mysql-server \
           -p 8090:8080 \
          genomehubs/easy-mirror:latest
```

Two new features in this command are the `--link` to the `example-mysql` container
and the `-p` flag to map port `8080` in the container to port `8090` on the host.

On startup, the EasyMirror container runs a set of scripts to prepare and host an Ensembl
mirror site. Each of these scripts writes a log file to `example/ensembl/logs` which can be
a useful source of information for debugging. If the Mirror site has started up successfully
then after a few minutes the content of the `logs` directory will look something like this:

```
ubuntu@hostname:~$ ls -thor ~/example/ensembl/logs/
total 56K
-rw-r--r-- 1 ubuntu  15K Feb 22 12:15 database.log
-rw-r--r-- 1 ubuntu 4.7K Feb 22 12:16 update.log
-rw-r--r-- 1 ubuntu  10K Feb 22 12:16 reload.log
-rw-r--r-- 1 ubuntu 1.6K Feb 22 12:17 preload-errors.log
-rw-r--r-- 1 ubuntu    5 Feb 22 12:17 e4144a267430.httpd.pid
-rw-r--r-- 1 ubuntu 6.6K Feb 22 12:17 e4144a267430.error_log
-rw-r--r-- 1 ubuntu  293 Feb 22 12:17 e4144a267430.access_log
```

with the `error_log` or `access_log` the most recently modified file in the logs directory and
`reload.log` no longer updating.

## Visit site

The Ensembl mirror should be available at `http://127.0.0.1:8090`. If you only have command
line access, you can also use `wget http://127.0.0.1:8090` and see if the downloaded `index.html`
contains a link to `Rhodnius_prolixus` which is the example species in `setup.ini`.

## Troubleshooting

#### How do I stop a docker container?

Refer to the docker container by the name you gave it in `docker run`:
```
docker stop example-mysql && docker rm example-mysql
```

When restarting, the `data` directory will not be empty so the environment variables can be
omitted from the `docker run` command. 

#### How do I change the mySQL password?

Even if a new password is given when restarting the mySQL container it will be ignored so
to change the password remove the container then either delete the contents of the `data` 
directory or log in to thecontainer directly using:

```
docker exec -it example-mysql bash
```

and connect to mysql using the old password to update the password.

#### Only the `database.log` file is written
This is the first log file to be written and contains details of the progress of downloading
and creating local copies of the databases to be mirrored. Initially this will be the only file
present in the `logs` directory but provided it exits (with success or failure) the remaining log
files will be written. Many of the Ensembl database dumps are very large so it may simply be a
matter of waiting for the download to complete (use `tail -f example/ensembl/logs/database.log`
to check on progress). If the problem persists, check you are able to access the Ensembl ftp
servers from the Docker host and from containers on the Docker host.

#### `http://127.0.0.1:8090` has no content

Once the log files are no longer being updated, if no content is visible at `http://127.0.0.1:8090`,
check the log files. If `update.log` is unable to connect one or more databases, check the database
connection settings. Other errors are likely to be found in `reload.log`.  Occasionally starting up
the Ensembl webcode will require more than 5 attempts so it can be worthwile to try simply removing
the container and trying again.
