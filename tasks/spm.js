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
  var exec = require('child_process').exec;
  var log = grunt.log;

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

  function getDstLocalPath(path, config) {
    var dist = config.dist;
    return Path.join(dist, path);
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

  function getUrl(path, base_uri) {
    base_uri = base_uri || grunt.config('pkg.base_uri');
    if (base_uri.slice(-1) != '/') base_uri += '/';
    return base_uri + normalizePath(path);
  }

  function processFile(path, config) {
    var filename_dst = genereateMd5Filename(path);
    var relative_path = getRelativePath(config.dist, path, filename_dst);
    var local_path = getDstLocalPath(relative_path, config);

    grunt.file.copy(path, local_path);

    return getUrl(relative_path, config.base_uri);
  }

  function generateResourceMap(config) {
    var dist = config.dist;
    var resourceMap = [];

    fs.readdirSync(dist).forEach(function(filename) {

      var filepath = Path.join(dist, filename);

      if (fs.statSync(filepath).isDirectory(filepath) ||
          filename.match(/\-debug/)) return;

      var source = grunt.file.read(filepath);
      var result, id;

      while(result = idPattern.exec(source)) {
        id = result[2];
        if (id[0] == '#') id = id.slice(1);
        resourceMap.push([id, processFile(filepath, config)]);
      }

    });

    if (util.kindOf(config.resource_map) === 'object') {
      var i, filepath;
      for (i in config.resource_map) {
        filepath = Path.join(dist, config.resource_map[i]);
        resourceMap.push([i, processFile(filepath, config)]);
      }
    }

    var defaultResourceMapFilename = 'js-resource-map.json';
    var resourceMapPath = config.resource_map_file &&
        grunt.template.process(config.resource_map_file) ||
        Path.join(dist, defaultResourceMapFilename);

    grunt.file.write(resourceMapPath, JSON.stringify(resourceMap));

    log.ok('File ' + resourceMapPath + ' created.');
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask("spm", "Build spm modules and generate resource map", function() {
    var config = grunt.config('spm');
    var options = config.options;
    var callback = this.async();

    var spmBuildParams = '';
    var pathOptions = {
      src: true,
      dist: true
    };

    var i;
    for (i in options) {
      if (pathOptions[i]) {
        options[i] = grunt.template.process(options[i]);
      }

      spmBuildParams += ' --' + i + '=' + options[i];
    }

    config.dist = Path.join(config.root, options.dist);

    exec('spm build' + spmBuildParams,  {
      cwd: Path.resolve(config.root)
    }, function(err, stdout, stderr) {
      log.writeln('');
      log.writeln(stdout);
      if (stderr) log.error(stderr);
      if (err) grunt.fail.fatal(err);

      generateResourceMap(config);
      callback();
    });
  });
};