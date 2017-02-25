#!/usr/bin/env node

/*
Metalsmith build file
Build site with `node ./build.js` or `npm start`
Build production site with `npm run production`
*/

'use strict';

var
// defaults
  consoleLog = false, // set true for metalsmith file and meta content logging
  devBuild = ((process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'),
  pkg = require('./package.json'),

  // main directories
  dir = {
    base: __dirname + '/',
    lib: __dirname + '/lib/',
    source: './src/',
    dest: './build/'
  },

  // modules
  metalsmith = require('metalsmith'),
  markdown = require('metalsmith-markdown'),
  publish = require('metalsmith-publish'),
  wordcount = require("metalsmith-word-count"),
  collections = require('metalsmith-collections'),
  permalinks = require('metalsmith-permalinks'),
//  inplace = require('metalsmith-in-place'),
  layouts = require('metalsmith-layouts'),
  sitemap = require('metalsmith-mapsite'),
  rssfeed = require('metalsmith-feed'),
  assets = require('metalsmith-assets'),
  htmlmin = devBuild ? null : require('metalsmith-html-minifier'),
  browsersync = devBuild ? require('metalsmith-browser-sync') : null,

  // custom plugins
  setdate = require(dir.lib + 'metalsmith-setdate'),
  moremeta = require(dir.lib + 'metalsmith-moremeta'),
  debug = consoleLog ? require(dir.lib + 'metalsmith-debug') : null,

  siteMeta = {
    devBuild: devBuild,
    version: pkg.version,
    name: 'genomehubs.org',
    desc: 'Research community-oriented taxonomic databases',
    author: 'the Blaxter Lab',
    twitter: 'https://twitter.com/blaxterlab',
    email: 'contact@lepbase.org',
    copy_name: 'the University of Edinburgh',
    copy_url: 'http://www.ed.ac.uk',
    domain: devBuild ? 'http://127.0.0.1' : 'https://github.com', // set domain
    rootpath: devBuild ? null : '/genomehubs/metalsmith-site/master/build/' // set absolute path (null for relative)
  },

  templateConfig = {
    engine: 'handlebars',
    directory: dir.source + 'template/',
    partials: dir.source + 'partials/',
    default: 'page.html'
  };

console.log((devBuild ? 'Development' : 'Production'), 'build, version', pkg.version);

var ms = metalsmith(dir.base)
  .clean(!devBuild) // clean folder before a production build
  .source(dir.source + 'html/') // source folder (src/html/)
  .destination(dir.dest) // build folder (build/)
  .metadata(siteMeta) // add meta data to every page
  .use(publish()) // draft, private, future-dated
  .use(setdate()) // set date on every page if not set in front-matter
  .use(collections({ // determine page collection/taxonomy
    page: {
      pattern: '**/index.*',
      sortBy: 'priority',
      reverse: true,
      refer: false
    },
    documentation: {
      pattern: 'documentation/**/*',
      sortBy: 'priority',
      reverse: true,
      refer: true,
      metadata: {
        layout: 'article.html'
      }
    },
    about: {
      pattern: 'about/**/*',
      sortBy: 'priority',
      reverse: true,
      refer: true,
      metadata: {
        layout: 'article.html'
      }
    },
    article: {
      pattern: 'article/**/*',
      sortBy: 'date',
      reverse: true,
      refer: true,
      limit: 50,
      metadata: {
        layout: 'article.html'
      }
    }
  }))
  .use(markdown()) // convert markdown
  .use(permalinks({ // generate permalinks
    pattern: ':mainCollection/:title'
  }))
  .use(wordcount({
    raw: true
  })) // word count
  .use(moremeta()) // determine root paths and navigation
//  .use(inplace(templateConfig)) // in-page templating
  .use(layouts(templateConfig)); // layout templating

if (htmlmin) ms.use(htmlmin()); // minify production HTML

if (debug) ms.use(debug()); // output page debugging information

if (browsersync) ms.use(browsersync({ // start test server
  server: dir.dest,
  port: 8080,
  ui: {
    port: 8081
  },
  open: false,
  files: [dir.source + '**/*']
}));

ms
  .use(sitemap({ // generate sitemap.xml
    hostname: siteMeta.domain + (siteMeta.rootpath || ''),
    omitIndex: true
  }))
  .use(rssfeed({ // generate RSS feed for articles
    collection: 'article',
    site_url: siteMeta.domain + (siteMeta.rootpath || ''),
    title: siteMeta.name,
    description: siteMeta.desc
  }))
  .use(assets({ // copy assets: CSS, images etc.
    source: dir.source + 'assets/',
    destination: './'
  }))
  .build(function(err) { // build
    if (err) throw err;
  });
