/*
 * grunt-spm
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */

var fs = require('fs');
var Path = require('path');
var crypto = require('crypto');

module.exports = function(grunt) {
  "use strict";

  grunt.util = grunt.util || grunt.utils;
  
  // shortcuts
  var File = grunt.file;
  var util = grunt.util;
  var log = grunt.log;
  var execFile = require('child_process').execFile;

  var idPattern = /define\s*\((['"])([^\s'"]*)\1/g;
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
    var relative_path = path_relative(path_src, path_dst);

    var tmp = relative_path.split(/[\/\\]/);
    tmp.pop();
    tmp.push(filename);

    path_dst = tmp.join('/');

    return path_dst;
  }

  function path_relative(path_from, path_to) {
    path_from = Path.resolve(path_from);
    path_to = Path.resolve(path_to);
    return Path.relative(path_from, path_to);
  }

  function path_relative_to_dist(path) {
    return normalizePath(path_relative(grunt.config('pkg.dist'), path));
  }

  function processFile(filepath, hashed_file, config) {
    var relative_path = getRelativePath(config.dist, filepath, hashed_file);
    var local_path = Path.join(config.dist, relative_path);

    File.copy(filepath, local_path);

    return relative_path;
  }

  function generateResourceMap(config) {
    var dist = config.dist;
    var spmResourceMap = [];
    var resourceMap = {};

    fs.readdirSync(dist).forEach(function(filename) {

      var filepath = normalizePath(Path.join(dist, filename));

      if (fs.statSync(filepath).isDirectory(filepath) ||
          filename.match(/\-debug/)) return;

      var source = File.read(filepath);
      var result, id;
      var hashed_file = file_hash(filepath);

      var hashed_file_full = Path.join(config.dist, hashed_file);
      resourceMap[path_relative_to_dist(filepath)] = path_relative_to_dist(hashed_file_full);

      while(result = idPattern.exec(source)) {
        id = result[2];
        if (id[0] == '#') id = id.slice(1);
        spmResourceMap.push([id + '.js', processFile(filepath, hashed_file, config)]);
      }

    });

    if (util.kindOf(config.resource_map) === 'object') {
      var i, filepath;
      for (i in config.resource_map) {
        filepath = Path.join(dist, config.resource_map[i]);
        var hashed_file = file_hash(filepath);
        spmResourceMap.push([i + '.js', processFile(filepath, hashed_file, config)]);
      }
    }

    var defaultResourceMapFilename = 'js-resource-map.json';
    var resourceMapPath = config.resource_map_file &&
        grunt.template.process(config.resource_map_file) ||
        Path.join(dist, defaultResourceMapFilename);

    File.write(resourceMapPath, JSON.stringify(spmResourceMap));
    var global_dist = grunt.config('pkg.dist');
    File.write(Path.join(global_dist, 'js-resource-map.json'), JSON.stringify(resourceMap));

    log.ok('File ' + resourceMapPath + ' created.');
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask("spm-build", "Build spm modules and generate resource map", function() {
    var config = grunt.config('spm-build');
    var callback = this.async();

    var build = require('spm').getAction('build');
    var options = {};
    options.base = Path.resolve(config.base);
    config.dist = grunt.template.process(config.dist)

    build.run(options, function() {
      generateResourceMap(config);
      callback();
    });
  });
};
