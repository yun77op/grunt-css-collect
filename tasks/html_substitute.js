/*
 * grunt-html-substitue
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */

var Path = require('path');
var os = require('os');
var cheerio = require('cheerio');

module.exports = function(grunt) {
  "use strict";

  grunt.util = grunt.util || grunt.utils;

  var _ = grunt.util._;
  var File = grunt.file;

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask("html_substitute", "Substitue assets link in html", function() {
    var config = _.defaults({}, this.data);

    var resourceMap = {};
    var resourcePathMap = config.resource_map;

    if (!Array.isArray(resourcePathMap)) {
      resourcePathMap = [resourcePathMap]; 
    }

    resourcePathMap.forEach(function(filepath) {
      filepath = grunt.template.process(filepath);
      var map = File.readJSON(filepath);
      _.extend(resourceMap, map);
    });

    var files = config.files;

    if (!Array.isArray(files)) {
      files = [files];
    }

    files = files.chain().map(function(file) {
      file = Path.join(config.src, file);
      return File.expandFiles(file);
    }).flatten().value();

    files.forEach(function(file) {
      grunt.helper('html_substitute', file, resourceMap);
    });

    grunt.log.ok();
  });

  grunt.registerHelper('html_substitute', function(filepath, resourceMap) {
    var source = File.read(filepath);
    var $ = cheerio.load(source);

    $('link[rel="stylesheet"]').each(function(idx, elm) {
      var href_src = elm.href;
      var href_dst = resourceMap[href_src];

      if (!href_dst) {
        grunt.fail.warn('Failed to substitue ' + href_src + '.');
      }

      elm.href = href_dst;
    });

    File.write(filepath, $.html());
  });

};
