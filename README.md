# genomehubs-dot-org 

The [GenomeHubs](http://genomehubs.org), created using the Node.js Metalsmith static site generator.

## Installation

```
cd ~
mkdir genomehubs
cd genomehubs
git clone https://github.com/genomehubs/genomehubs-dot-org 
```

To build the development version:

```
docker run -d -v ~/genomehubs/genomehubs-dot-org:/usr/src/app -p 8079:8080 --name genomehubs-dot-org-dev genomehubs/metalsmith:latest
```

This will generate static files in the `genomehubs-dot-org/build` directory and any code changes will be instantly updated on the site code (useful but buggy).

To stop the development version:

```
docker stop genomehubs-dot-org-dev && docker rm genomehubs-dot-org-dev
```

To host the production version:

```
mv genomehubs/genomehubs-dot-org/build genomehubs/site
docker run -d -v ~/genomehubs/site:/var/www:ro -p 8080:8080 --name genomehubs-dot-org genomehubs/lighttpd:latest
```
