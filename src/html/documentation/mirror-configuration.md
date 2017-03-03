---
title: Mirror Configuration
description: Configuration file description for EasyMirror
priority: 0.66
date: 2017-03-03
---


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

