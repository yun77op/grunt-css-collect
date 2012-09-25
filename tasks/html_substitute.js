var Path = require('path');
var os = require('os');

module.exports = function(grunt) {
  "use strict";

  grunt.util = grunt.util || grunt.utils;

  var httpPattern = /https?:\/\//;
  var relStylesheetPattern = /rel\s*=\s*(['"]?)stylesheet\1/;
  var stylesheetHrefPattern = /href\s*=\s*(['"]?)([^>\s'"]+)\1/;

  // ==========================================================================
  // PRIVATE HELPER FUNCTIONS
  // ==========================================================================

  function isStylesheetLine(line) {
    line = line.trim();

    if (line.indexOf('<link') != 0 ||
        !line.match(relStylesheetPattern)) return false;
    
    return true;
  }

  function getFiles(files, src, type) {
    var expandFiles = grunt.file.expandFiles;
    var result;

    if (Array.isArray(files)) {
      result = files.map(function(file) {
        return expandFiles(file); 
      });
    } else {
      result = files == "*" ? ["**/*." + type] : files;
      result = result.map(function(file) {
        return Path.join(src, file);
      });
      result = expandFiles(result);
    }

    return result;
  }


  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask("html_substitute", "Substitue assets link in html", function() {
    var config = this.data;
    var options = config.options;

    var resourceMap = {};
    var resourcePathMap = options.resource_map;

    if (!Array.isArray(resourcePathMap)) {
      resourcePathMap = [resourcePathMap]; 
    }

    resourcePathMap.forEach(function(filepath) {
      filepath = grunt.template.process(filepath);
      var map = grunt.file.readJSON(filepath);
      grunt.util._.extend(resourceMap, map);
    });

    var files = getFiles(config.files, options.src, options.ext);
    files.forEach(function(file) {
      grunt.helper('html_substitute', file, resourceMap, options);
    });

    grunt.log.ok();
  });

  grunt.registerHelper('html_substitute', function(filepath, resourceMap, options) {
    var source = grunt.file.read(filepath);
    var lines = source.replace(/\r/g, '').split('\n');

    lines = lines.map(function(line) {
      if (!isStylesheetLine(line)) return line;

      return line.replace(stylesheetHrefPattern, function(full, quotes, path) {
        var value = resourceMap[path];

        if (!value && !httpPattern.test(path)) {
          grunt.fail.warn('Failed to substitue ' + path + '.');
        }

        return !value ? full : full.replace(path, value);
      });
    });

    grunt.file.write(filepath, lines.join(os.EOL));
  });

};
