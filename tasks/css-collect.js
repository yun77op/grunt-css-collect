/*
 * grunt-css-collect
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */
"use strict";

var Path = require('path');
var crypto = require('crypto');
var cleanCSS = require('clean-css');

module.exports = function(grunt) {

  grunt.util = grunt.util || grunt.utils;

  // shorthands
  var File = grunt.file;
  var _ = grunt.util._;

  var cssBgPattern = /background.*?url\s*\(\s*(['"]?)([^'"\)]+)\1/g;
  var cssBgReplacePattern = /(background.*?url\(\s*)(['"]?)([^'"\)]+)\2/g;
  var httpPattern = /https?:\/\//;
  var cache = {};


  // ==========================================================================
  // PRIVATE HELPER FUNCTIONS
  // ==========================================================================

  function md5(filecontent) {
    return crypto.createHash('md5').update(filecontent).digest("hex");
  }

  function normalizePath(path) {
    return Path.normalize(path).replace(/\\/g, '/');
  }

  function file_hash(path) {
    if (cache[path]) {
      return cache[path];
    }

    var filename_dst;
    var filecontent = File.read(path);
    var extname = Path.extname(path);
    var basename = Path.basename(path, extname);

    filename_dst = basename + '-' + md5(filecontent) + extname;
    cache[path] = filename_dst;

    return filename_dst;
  }

  function getRelativePath(path_src, path_dst, filename) {
    path_dst = Path.resolve(path_dst);
    path_src = Path.resolve(path_src);
    var relative_path = Path.relative(path_src, path_dst);

    var tmp = relative_path.split(/[\/\\]/);
    tmp.pop();
    tmp.push(filename);

    path_dst = tmp.join('/');

    return path_dst;
  }

  function getDstLocalPath(path, options) {
    var dist = options.dist;
    return Path.join(dist, path);
  }

  function getUrl(path, base_uri) {
    base_uri = base_uri || grunt.options('pkg.base_uri');
    if (base_uri.slice(-1) != '/') base_uri += '/';
    return base_uri + normalizePath(path);
  }

  function parseCssBackground(filepath, options) {
    var source = File.read(filepath);
    var img_path;
    var result = [];

    cssBgPattern.lastIndex = 0;

    var pattern_result;

    while (pattern_result = cssBgPattern.exec(source)) {
      img_path = pattern_result[2];

      if (httpPattern.test(img_path)) continue;

      if (img_path[0] == '/') {
        img_path = Path.resolve(img_path.slice(1));
      } else {
        img_path = Path.resolve(Path.dirname(filepath), img_path);
      }

      var img_filename_dst = file_hash(img_path);
      var relative_path = getRelativePath(options.img_src, img_path, img_filename_dst);
      var local_path = getDstLocalPath(relative_path, options);
      var url = getUrl(relative_path, options.base_uri);

      File.copy(img_path, local_path);
      result.push(url);
    }

    return result;
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask("css-collect", "Version css and img files using Md5", function() {
    var resourceMap = {};
    var files = this.files;
    var options = this.options();

    if (!Array.isArray(files)) {
      files = [files];
    }

    files = _(files).chain().map(function(file) {
      file = Path.join(options.css_src, file);
      return File.expand(file);
    }).flatten().value();

    files.forEach(function(file) {
      var map = cssCollect(file, options);
      _.extend(resourceMap, map);
    });

    var resourceMapFile = grunt.template.process(options.resource_map_file);
    File.write(resourceMapFile, JSON.stringify(resourceMap));
 
    grunt.log.ok('File ' + resourceMapFile + ' created.');
  });

  function cssCollect(filepath, options) {
    var idx = 0;
    var resourceMap = {};
    var source = File.read(filepath);
    var replaceList = parseCssBackground(filepath, options);

    source = source.replace(cssBgReplacePattern, function(full, prelude) {
      return prelude + replaceList[idx++];
    });

    var filename_dst = file_hash(filepath);
    var path_dst = Path.join(options.css_dst, filename_dst);
    var local_path = getDstLocalPath(path_dst, options);
    var min = cleanCSS.process(source);

    File.write(local_path, min);

    resourceMap[normalizePath(filepath)] = normalizePath(path_dst);

    return resourceMap;
  }
};
