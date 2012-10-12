/*
 * grunt-css-version
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */

var Path = require('path');
var crypto = require('crypto');
var cleanCSS = require('clean-css');
var fs = require('fs');

module.exports = function(grunt) {
  "use strict";

  grunt.util = grunt.util || grunt.utils;

  // shorthands
  var File = grunt.file;
  var _ = grunt.util._;

  var cssBgPattern = /background.*?url\s*\(\s*(['"]?)([^'"\)]+)\1/g;
  var cssBgReplacePattern = /(background.*?url\(\s*)(['"]?)([^'"\)]+)\2/g;
  var httpPattern = /https?:\/\//;
  var cache = {};


  // =========================================  =================================
  // PRIVATE HELPER FUNCTIONS
  // ==========================================================================

  function md5(filecontent) {
    return crypto.createHash('md5').update(filecontent).digest("hex");
  }

  function genereateMd5Filename(path) {
    if (cache[path]) {
      return cache[path];
    }

    var filename_dst;
    var filecontent = File.read(path);
    var extname = Path.extname(path);
    var basename = Path.basename(path, extname);

    filename_dst = basename + '_' + md5(filecontent) + extname;
    cache[path] = filename_dst;

    return filename_dst;
  }

  function normalizeUri(uri) {
    return uri.replace(/\\/g, '/').replace(/(https?:)\//, function(full, prelude) {
      return prelude + '//';
    });
  }

  function getDstPath(path_src, path_dst, filename_dst) {
    path_dst = Path.resolve(path_dst);
    path_src = Path.resolve(path_src);
    var relative_path = Path.relative(path_src, path_dst);

    var tmp = relative_path.split(/[\/\\]/);
    tmp.pop();
    tmp.push(filename_dst);

    var path_dst = tmp.join('/');

    return path_dst;
  }

  function getCopyAndRefPath(path, base_uri) {
    var dist = grunt.config('pkg.dist');
    base_uri = base_uri || grunt.config('pkg.base_uri');

    var refDstBase = base_uri ? base_uri : '/' + dist;

    return {
      copy: Path.join(dist, path),
      ref: normalizeUri(Path.join(refDstBase, path))
    };
  }

  function parseCssBackground(filepath, config) {
    var source = File.read(filepath);
    var img_path;
    var result = [];

    cssBgPattern.lastIndex = 0;

    var pattern_result;

    while (pattern_result = cssBgPattern.exec(source)) {
      img_path = pattern_result[2];

      if (httpPattern.test(img_path)) continue;

      if (img_path[0] == '.') {
        img_path = Path.resolve(Path.dirname(filepath), img_path);
      } else if (img_path[0] == '/') {
        img_path = Path.resolve(img_path.slice(1));
      }

      var img_filename_dst = genereateMd5Filename(img_path);
      var img_path_dst = getDstPath(config.img_src, img_path, img_filename_dst);
      var paths = getCopyAndRefPath(img_path_dst, config.base_uri);

      File.copy(img_path, paths.copy);

      result.push(paths.ref);
    }

    return result;
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask("css_version", "Version css and img files using Md5", function() {
    var config = _.defaults({}, this.data);
    var resourceMap = {};
    var files = config.files;

    if (!Array.isArray(files)) {
      files = [files];
    }

    files = files.chain().map(function(file) {
      file = Path.join(config.src, file);
      return File.expandFiles(file);
    }).flatten().value();

    files.forEach(function(file) {
      var map = grunt.helper('css_version', file, config);
      _.extend(resourceMap, map);
    }); 

    var resourceMapFile = grunt.template.process(config.resource_map_file);
    fs.writeFileSync(resourceMapFile, JSON.stringify(resourceMap));
  
    grunt.log.ok('File ' + resourceMapFile + ' created.');
  });

  grunt.registerHelper('css_version', function(filepath, config) {
    filepath = Path.normalize(filepath);

    var idx = 0;
    var resourceMap = {};
    var source = File.read(filepath);
    var replaceList = parseCssBackground(filepath, config);

    source = source.replace(cssBgReplacePattern, function(full, prelude) {
      return prelude + replaceList[idx++];
    });

    var filename_dst = genereateMd5Filename(filepath);
    var path_dst = Path.join(config.css_dst, filename_dst);
    var paths = getCopyAndRefPath(path_dst, config.base_uri);
    var min = cleanCSS.process(source);

    File.write(paths.copy, min);

    resourceMap['/' + normalizeUri(filepath)] = paths.ref;

    return resourceMap;
  });
}
