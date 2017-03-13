---
title: Docker Containers
description: Descriptions of GenomeHubs Docker containers
priority: 0.5
date: 2017-03-03
---


GenomeHubs containers typically run as UID 1000 so are compatible with being run as the 
default user on a fresh Linux install. The exception is the mySQL container that writes to 
`/var/lib/mysql` as UID 27, as such mounting a mySQL data directory brings convenience in file 
management but may cause permissions issues so is entirely optional. There are many ways to deal 
with [Docker](http://docker.com) users and permissions that are beyond the scope of this documentation. 
Running Genomehubs with a different UID is possible but unsupported.

## mySQL

GenomeHubs uses an official [mysql/mysql-server:5.5](https://hub.docker.com/r/mysql/mysql-server/) container image.

Basic setup:

```
docker run -d \
           --name example-mysql \
           -v ~/example/mysql/data:/var/lib/mysql \
           -e MYSQL_ROOT_PASSWORD=rootuserpassword \
           -e MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0' \
           mysql/mysql-server:5.5
```

See [hub.docker.com/r/mysql/mysql-server](https://hub.docker.com/r/mysql/mysql-server/) for full 
details and more secure configuration options.

## EasyMirror

[View on Github](https://github.com/genomehubs/easy-mirror-docker)

Use the [genomehubs/easy-mirror:latest](https://hub.docker.com/r/genomehubs/easy-mirror/) with
`database.ini` file and a `setup.ini` [configuration files](http://genomehubs.org/documentation/mirror-configuration/).

This container runs three scripts:

1. `database.sh` to configure database users and download and install local copies of [Ensembl](http://ensembl.org)/[EnsemblGenomes](http://ensemblgenomes.org)
   databases
2. `update.sh` to clone, update and configure repositories ready to run an Ensembl web site
3. `reload.sh` to start, and if necessary restart, an Ensembl website

```
docker run -d \
           --name genomehubs-ensembl \
           -v ~/demo/genomehubs-mirror/ensembl/conf:/ensembl/conf \
           -v ~/demo/genomehubs-mirror/ensembl/logs:/ensembl/logs \
           --link genomehubs-mysql \
           -p 8081:8080 \
          genomehubs/easy-mirror:latest
```

## EasyImport

[View on Github](https://github.com/genomehubs/easy-import-docker)

Runs the [EasyImport](https://github.com/genomehubs/easy-import) scripts to import data into and export files from
Ensembl databases. Used both for Importing new assemblies, gene models and functional annotations into 
an Ensembl and for generating files for downloads and BLAST services as part of a
[GenomeHubs Ensembl mirror](http://genomehubs.org/documentation/mirror-setup-part-ii/).

Full documentation for EasyMirror on [readme.io](http://easy-import.readme.io) will be updated soon.

```
docker run -d \
           --name easy-import-melitaea_cinxia_core_32_85_1 \
           --link genomehubs-mysql \
           -v ~/demo/genomehubs-mirror/import/conf:/import/conf \
           -v ~/demo/genomehubs-mirror/import/data:/import/data \
           -v ~/demo/genomehubs-mirror/download/data:/import/download \
           -v ~/demo/genomehubs-mirror/blast/data:/import/blast \
           -e DATABASE=melitaea_cinxia_core_32_85_1 \
           -e FLAGS="-e -j -i" \
           easy-import
```

`FLAGS` are used to control which EasyImport scripts are run, in this example `-e` runs the
`export_sequences.pl` script to generate sequence files for downloading and BLAST, `-j` runs the
`export_json.pl` script to generate json files used by the [assembly-stats](https://github.com/rjchallis/assembly-stats)
and [codon-usage](https://github.com/rjchallis/codon-usage) visualisations on species
home pages and `-i` runs the `index_database.pl` script to provide search.

## h5ai

[View on Github](https://github.com/genomehubs/h5ai-docker)

Sets up an [h5ai](https://larsjung.de/h5ai/) downloads server with support for various 
customisations.

```
docker run -d \
           --name h5ai-download \
           -v h5ai/conf:/conf \
           -v /data/to/host:/var/www/data \
           -p 8080:8080 \
           genomehubs/h5ai:latest
```

Directories to be indexed should be mounted as subdirectories of ``/var/www``

Files in a directory mounted to /conf will be used as follows
- ``lighttpd.conf`` overwrites ``/etc/lighttpd/lighttpd.conf`` 
- ``options.json`` overwrites ``/var/www/_h5ai/private/conf/options.json``
- ``index.html`` is copied to ``/var/www/`` and will be served in place of a directory listing for the server root
- ``Masthead.html`` is added to ``/var/www/_h5ai/private/php/pages/index.php`` as a masthead on everypage
- ``img/*`` files in this directory are copied to ``/var/www/img`` 
- ``custom.css`` is copied to ``/var/www/_h5ai/public/ext/``


## SequenceServer

[View on Github](https://github.com/genomehubs/sequenceserver-docker)

Sets up an [SequenceServer](https://sequenceserver.com) BLAST server with support for various 
customisations. Uses the latest `master` branch which comes with one or two bugs (e.g. 
it may be necessary to manually refresh the results page after running a search) but a
great user interface and result visualisation.  

```
docker run -d \
           --name genomehubs-sequenceserver \
           -v ~/demo/genomehubs-mirror/blast/conf:/conf \
           -v ~/demo/genomehubs-mirror/blast/data:/dbs \
           -p 8083:4567 \
           genomehubs/sequenceserver:latest
```

Files in a directory mounted to `/conf` will be used as follows:
- ``sequenceserver.conf`` overwrites the standard SequenceServer configuration options
- ``Masthead.html`` is added as a masthead on every page
- ``custom.css`` can be applied to the Masthead or any other page element
- ``links.rb`` specifies how to parse the sequence IDs to generate links back to the Ensembl 
  site, and the base url for that site.


## RepeatMasker

[View on Github](https://github.com/genomehubs/repeatmasker-docker)

Repeatmasker docker container built from [hub.docker.com/r/robsyme/repeatmasker-onbuild](https://hub.docker.com/r/robsyme/repeatmasker-onbuild/)
with modifications to make it easier to use as a GenomeHubs container by running as UID 1000, separating input and output 
directories and renaming output files.

Clone the repository

```
git clone https://github.com/genomehubs/repeatmasker-docker.git
cd repeatmasker-docker
```

Fetch a copy of the RepBase libraries

```
wget --user your_username \
    --password 12345 \
    -O repeatmaskerlibraries.tar.gz \
    http://www.girinst.org/server/RepBase/protected/repeatmaskerlibraries/repeatmaskerlibraries-20160829.tar.gz

```

Build the docker image

```
docker build -t repeatmasker .
```

Run repeatmasker

```
mkdir repeats
docker run -d \
           --name repeatmasker \
           -v `pwd`/sequence:/in \
           -v `pwd`/repeats:/out \
           -e ASSEMBLY=scaffolds.fa.gz \
           -e NSLOTS=16 \
           -e SPECIES=arthropoda \
           repeatmasker
```

## CEGMA

[View on Github](https://github.com/genomehubs/cegma-docker)

CEGMA docker container built from [hub.docker.com/r/robsyme/cegma-docker](https://hub.docker.com/r/robsyme/cegma-docker/)
with modifications to make it easier to use as a GenomeHubs container by running as UID 1000, separating input and output 
directories and renaming output files.

```
docker run -d \
           --name cegma-test \
           -v `pwd`/sequence:/in \
           -v `pwd`/cegma:/out \
           -e ASSEMBLY=scaffolds.fa.gz \
           genomehubs/cegma:latest
```

Writes `scaffolds.fa.completeness_report.txt` and `scaffolds.fa.cegma.gff` to the directoy mounted at `/out`.

## BUSCO

[View on Github](https://github.com/genomehubs/busco-docker)

BUSCO docker container built from [hub.docker.com/r/vera/busco](https://hub.docker.com/r/vera/busco/)
with modifications to make it easier to use as a GenomeHubs container by running as UID 1000, separating input and output 
directories and renaming output files.

Clone the repository

```
git clone https://github.com/genomehubs/busco-docker.git
cd busco-docker
```

Fetch BUSCO lineages

```
wget http://busco.ezlab.org/v2/datasets/insecta_odb9.tar.gz
...
```

Build the docker image

```
docker build -t busco .
```

Run BUSCO

```
mkdir busco
docker run -d \
           --name busco-test \
           -v `pwd`/sequence:/in \
           -v `pwd`/busco:/out \
           -e INFILE=Test.fa.gz \
           busco -l insecta_odb9 -m genome -c 8 -sp fly
```

## BLASTP against UniProt

[View on Github](https://github.com/blaxterlab/ncbi-blast-docker)

Download and gunzip the latest UniProt Swiss-Prot protein fasta file:

```
wget ftp://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
gunzip uniprot_sprot.fasta.gz
```

Use the NCBI-Blast docker container to format the downloaded file as a protein BLASTDB. This will create a UniProt Swiss-Prot 
protein blast database in the current directory (change `pwd` to directories of your choice)

```
docker run --rm --name blast-test \
    --user $UID:$GROUPS \
    --volume `pwd`:/in \
    --volume `pwd`:/out \
    blaxterlab/ncbi-blast:latest \
    makeblastdb -dbtype prot -in /in/uniprot_sprot.fasta -out /out/uniprot_sprot.fasta
```

Run BLASTP of protein fasta file against the blast database:

```
docker run --rm --name blast-test \
    --user $UID:$GROUPS \
    --volume `pwd`:/query \
    --volume `pwd`:/out \
    --volume `pwd`:/db \
    blaxterlab/ncbi-blast:latest \
    blastp -query /query/species_proteins.fa -db /db/uniprot_sprot.fasta -evalue 1e-10 -num_threads 16 \
        -outfmt '6 std qlen slen stitle btop' -out /out/species_proteins.fa.blastp.uniprot_sprot.1e-10
```

Takes `species_proteins.fa` in the directory mounted at `/query` and writes species_proteins.fa.blastp.uniprot_sprot.1e-10.gz 
(automatically gzipped) to the directory mounted at `/out` (both are the current working directory in this case). Uses GNU 
Parallel underneath to speed up the blast jobs by running `-num_threads 16` parallel threads. (O. Tange (2011): GNU Parallel 
- The Command-Line Power Tool ;login: The USENIX Magazine, February 2011:42-47.)

## Interproscan

[View on Github](https://github.com/blaxterlab/interproscan-docker)

Run Interproscan on a protein fasta file using a docker container (Note: the protein fasta sequences must not have "*"s else it 
will fail):

```
docker run --rm --name ipr-test \
    -u $UID:$GROUPS \
    -v `pwd`:/dir \
    -v `pwd`:/in \
    blaxterlab/interproscan:latest \
    interproscan.sh -i /in/species_proteins.fa -d /dir -appl PFAM,SignalP_EUK -goterms -dp -pa -f TSV
```

Takes `species_proteins.fa` in the directory mounted at `/in` and writes output file `species_proteins.fa.tsv` to the 
directory mounted at `/dir` (both are the current working directory in this case). Any interproscan arguments can be used. In 
this example, `-appl` specifies which interproscan analyses to run, `-goterms` will output GO terms, `-dp` will disable 
precalculated lookups, `-pa` looks up corresponding pathway annotations, `-f TSV` outputs results in TSV format.

If you want to run this with many threads in parallel, first download a copy of `interproscan.properties`:

```
wget https://raw.githubusercontent.com/blaxterlab/interproscan-docker/master/interproscan.properties
```

Edit `interproscan.properties` and change these values to match your number of threads (eg: 16):
```
number.of.embedded.workers=1
maxnumber.of.embedded.workers=16
```

Now run the docker container with this file mounted to the right place inside the container:

```
docker run --rm --name ipr-test \
    -u $UID:$GROUPS \
    -v `pwd`:/dir \
    -v `pwd`:/in \
    -v `pwd`/interproscan.properties:/interproscan-5.22-61.0/interproscan.properties \
    blaxterlab/interproscan:latest \
    interproscan.sh -i /in/species_proteins.fa -d /dir -appl PFAM,SignalP_EUK -goterms -dp -pa -f TSV
```
