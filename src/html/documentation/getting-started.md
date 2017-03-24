---
title: Getting started
description: Getting ready to set up an Ensembl using GenomeHubs
priority: 0.9
date: 2017-03-06
---

## Prerequisites

GenomeHubs uses [Docker](http://docker.com) containers so to set up an [Ensembl](http://ensembl.org)
using GenomeHubs you will need a server, laptop, virtual machine or cloud instance running Docker.
If you don't already have Docker installed then follow our basic
[instructions](http://genomehubs.org/documentation/installing-docker/) to install Docker on
Ubuntu 16.04.

While it simplifies many aspects of running a complex set of interconnected services, using
Docker does have its own complications, particularly regarding user namespaces. All GenomeHubs
containers are designed to run as a user with UID 1000 (i.e. the UID of the default "ubuntu"
user on a fresh install) so to avoid complexity all examples assume you will be running docker
as this user.

## Quick start

Once you have Docker installed, the quickest way to set up an [Ensembl](http://ensembl.org) using
GenomeHubs is to `git clone` our [demo repository](https://github.com/genomehubs/demo) and run `demo.sh`
to set up a mirror of the core database for the Glanville fritillary, *Melitaea cinxia*, or
`import.sh` to import the genome of the winter moth, *Operophtera brumata*, from FASTA and GFF.

```
cd
git clone https://github.com/genomehubs/demo
# mirror example:
demo/demo.sh
# import example:
demo/import.sh
```

Each of these examples will create an Ensembl site at http://127.0.0.1:8081 with downloads
and BLAST sites at ports `8082` and `8083`, respectively. If you are not running Docker on
a local machine try [these suggestions](http://genomehubs.org/documentation/mirror-setup-part-ii/#visit-site)
to access the site.
