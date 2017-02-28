---
title: Mirror Setup Part I
description: Set up a basic Ensembl Mirror site using Docker
priority: 0.7
date: 2017-02-28
---

This is the simplest setup to mirror [Ensembl](http://ensembl.org)/[EnsemblGenomes](http://ensemblgenomes.org)
species. To also set up a [SequenceServer](http://sequenceserver.com) BLAST server
and [h5ai](https://larsjung.de/h5ai/) downloads server and use the GenomeHubs Ensembl plugin, follow
GenomeHubs Mirror Setup Part II (coming soon).

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
[github.com/genomehubs/demo](https://github.com/genomehubs/demo) repository and annotated
versions are shown below.

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



## database.ini


#### `[DATABASE]`
Sets up four users:

- `DB_USER` has only select permissions, using a password for this user is untested
- `DB_SESSION_USER` has read/write access to the `DB_SESSION_NAME` database, this is the only
  database that must be hosted locally for the site to work
- `DB_IMPORT_USER` is not required for a simple mirror site but it is convenient to set up this user now
- `DB_ROOT_USER` must match the password set in the mySQL Docker container

`DB_HOST` must match the name you give the mySQL Docker container

```
[DATABASE]
  DB_USER = anonymous
  DB_PASS =

  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = sessionuserpassword
  DB_SESSION_NAME = ensembl_accounts

  DB_IMPORT_USER = importuser
  DB_IMPORT_PASS = importuserpassword

  DB_ROOT_USER = root
  DB_ROOT_PASSWORD = rootuserpassword
  DB_PORT = 3306
  DB_HOST = example-mysql
```

#### `[WEBSITE]`

Set `ENSEMBL_WEBSITE_HOST` to allow access to the database from any container on a standard Docker network

```
[WEBSITE]
  ENSEMBL_WEBSITE_HOST = 172.17.0.0/255.255.0.0
```

#### `[DATA_SOURCE]`

At least one core database needs to be hosted locally if you want to import new data as it is used as a
source for analysis names, etc when creating a new core database. The link between the key names in this
section and the urls they are associated with is relatively arbitrary.

- `*_DB_URL` must be an ftp url under which directories containing database dumps can be found
- `*_DB_REPLACE` is a flag controlling behaviour if databases with the same name already exist, set to 1 to overwrite
- `*_DBs` should be a space-separated list of databases to download from this source
- `SPECIES_DB_AUTO_EXPAND` is a space separated list of other database types to attempt to fetch for each core
  database listed in `SPECIES_DBS`, e.g. [ variation funcgen ]
- Due to a bug yet to be followes up, the site works with older versions of the `ensembl_accounts` database
  but not the corresponding `release-85` version

```
[DATA_SOURCE]
  ENSEMBL_DB_URL = ftp://ftp.ensembl.org/pub/release-85/mysql/
  ENSEMBL_DB_REPLACE =
  ENSEMBL_DBS =

  EG_DB_URL = ftp://ftp.ensemblgenomes.org/pub/release-32/pan_ensembl/mysql/
  EG_DB_REPLACE =
  EG_DBS =

  SPECIES_DB_URL = ftp://ftp.ensemblgenomes.org/pub/release-32/metazoa/mysql/
  SPECIES_DB_REPLACE =
  SPECIES_DB_AUTO_EXPAND =
  SPECIES_DBS = [ acyrthosiphon_pisum_core_32_85_2 rhodnius_prolixus_core_32_85_1 ]

  MISC_DB_URL = ftp://ftp.ensembl.org/pub/release-79/mysql/
  MISC_DB_REPLACE =
  MISC_DBS = [ ensembl_accounts ]
```

## setup.ini

#### `[DATABASE]`

With the exception of the session/ensembl_accounts database, EasyMirror will attempt to find
each database listed in `[DATA_SOURCE]` at `DB_HOST`, if it cannot connect it will try
`DB_FALLBACK_HOST`, then `DB_FALLBACK2_HOST` so databases used in the final site can be hosted
in multiple locations.

`DB_SESSION_HOST` should match the mySQL Docker container name, other hosts can be set to any
accessible mysql hostname.

```
[DATABASE]
  DB_HOST = example-mysql
  DB_PORT = 3306
  DB_USER = anonymous
  DB_PASS =

  DB_SESSION_HOST = example-mysql
  DB_SESSION_PORT = 3306
  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = sessionuserpassword

  DB_FALLBACK_HOST = mysql-eg-publicsql.ebi.ac.uk
  DB_FALLBACK_PORT = 4157
  DB_FALLBACK_USER = anonymous
  DB_FALLBACK_PASS =

  DB_FALLBACK2_HOST = ensembldb.ensembl.org
  DB_FALLBACK2_PORT = 3306
  DB_FALLBACK2_USER = anonymous
  DB_FALLBACK2_PASS =
```

#### `[REPOSITORIES]`

A list of plugins to use, `ENSEMBL_*` (which fetches a number of repositories) and `BIOPERL_*`
are essential, the others are optional. Branches should match the release versions of the
databases (currently 85/32 for Ensembl/EnsemblGenomes).

To customise the site, create and add your own plugin repository, after `BIOPERL`, repositories higher
up the list will be loaded after those below so can overwrite specific settings.

```
[REPOSITORIES]
  ENSEMBL_URL = https://github.com/Ensembl
  ENSEMBL_BRANCH = release/85

  BIOPERL_URL = https://github.com/bioperl
  BIOPERL_BRANCH = master

  EG_METAZOA_PLUGIN_URL = https://github.com/EnsemblGenomes/eg-web-metazoa
  EG_METAZOA_PLUGIN_BRANCH = release/eg/32
  EG_METAZOA_PLUGIN_PACKAGE = EG::Metazoa

  API_PLUGIN_URL = https://github.com/EnsemblGenomes/ensemblgenomes-api
  API_PLUGIN_BRANCH = release/eg/32
  API_PLUGIN_PACKAGE = EG::API

  EG_COMMON_PLUGIN_URL = https://github.com/EnsemblGenomes/eg-web-common
  EG_COMMON_PLUGIN_BRANCH = release/eg/32
  EG_COMMON_PLUGIN_PACKAGE = EG::Common

  PUBLIC_PLUGINS = [ ]
```

#### `[WEBSITE]`

There should be no need to change these values

```
[WEBSITE]
  HTTP_PORT = 8080
  SERVER_ROOT = /ensembl
```

#### `[DATA_SOURCE]`

All databases listed here should be available on at least one of the database hosts listed under `[DATABASE]`.

- `SPECIES_DBS` a space separated list of core databases to include in the site. After importing
  new assemblies, add the database name to this list before reloading
- `SPECIES_DB_AUTO_EXPAND` to also include variation, etc. databases for one or more core databases,
  list the types to attempt to load here
- `MULTI_DBS` databases that are needed for an EnsemblGenomes site
- `COMPARA_DBS` compara databases should be listed separately

```
[DATA_SOURCE]
  SPECIES_DBS = [
	acyrthosiphon_pisum_core_32_85_2
	rhodnius_prolixus_core_32_85_1
	]
  SPECIES_DB_AUTO_EXPAND [ ]
  MULTI_DBS = [ ensemblgenomes_ontology_32_85 ensemblgenomes_info_32 ensembl_archive_85 ensembl_website_85 ]
  COMPARA_DBS = [ ensembl_compara_metazoa_32_85 ensembl_compara_pan_homology_32_85 ]
```

