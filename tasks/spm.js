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
  var util = grunt.util;
  var exec = require('child_process').exec;
  var log = grunt.log;

  var idPattern = /define\s*\((['"])([^\s'"]*)\1/g;

  // ==========================================================================
  // PRIVATE HELPER FUNCTIONS
  // ==========================================================================

  function normalizeUri(uri) {
    return uri.replace(/\\/g, '/').replace(/(https?:)\//, function(full, prefix) {
      return prefix + '//';
    });
  }

  function md5File(filepath, config) {
    var source = grunt.file.read(filepath);
    var extname = Path.extname(filepath);
    var filename = Path.basename(filepath, extname) + '_' + md5(source) + extname; 

    var dstFilepathList = filepath.split(/[\/\\]/);
    dstFilepathList.pop();
    dstFilepathList.push(filename);
    var dstFilepath = dstFilepathList.join('/');

    // Prefix
    var base_uri = config.base_uri || grunt.config('pkg.base_uri');
    var prefix = base_uri || '/' + dist;

    var dstRelativeFilepath = dstFilepath.substr(grunt.config('pkg.dist').length);

    var result = normalizeUri(Path.join(prefix + dstRelativeFilepath));

    grunt.file.copy(filepath, dstFilepath);

    return result;
  }

  function generateResourceMap(config) {
    var dist = config.dist;
    var resourceMap = [];

    fs.readdirSync(dist).forEach(function(filename, i) {

      var filepath = Path.join(dist, filename);

      if (fs.statSync(filepath).isDirectory(filepath) ||
          filename.match(/\-debug/)) return;

      var source = grunt.file.read(filepath);
      var result, id;

      while(result = idPattern.exec(source)) {
        id = result[2];
        if (id[0] == '#') id = id.slice(1);
        resourceMap.push([id, md5File(filepath, config)]);
      }

      if (util.kindOf(config.resourceMap) === 'object') {
        for (var i in config.resourceMap) {
          resourceMap.push([i, md5File(config.resourceMap[i], config)]);
        }
      }

    });

    var resourceMapFilename = 'js-resource-map.json';
    var resourceMapPath = config.resource_map_file &&
        grunt.template.process(config.resource_map_file) ||
        Path.join(dist, resourceMapFilename);

    grunt.file.write(resourceMapPath, JSON.stringify(resourceMap));

    log.ok('File ' + resourceMapPath + ' created.');
  }

  function md5(filecontent) {
    return crypto.createHash('md5').update(filecontent).digest("hex");
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

    for (var i in options) {
      if (pathOptions[i]) {
        options[i] = grunt.template.process(options[i]);
        spmBuildParams += ' --' + i + '=' + options[i];
      }
    }

    config.dist = Path.join(config.root, options.dist);

    exec('spm build' + spmBuildParams,  {
      cwd: Path.resolve(config.root)
    }, function(err, stdout, stderr) {
      log.writeln('')
      log.writeln(stdout);
      if (stderr) log.error(stderr);
      if (err) grunt.fail.fatal(err);

      generateResourceMap(config);
      callback();
    });
  });
};
