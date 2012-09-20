var Path = require('path');

module.exports = function(grunt) {
  "use strict";

  grunt.registerMultiTask("css_version", "Version css files using Md5", function() {
    var config = this.data;
    var options = config.options;
    var expandFiles = grunt.file.expandFiles;

    if (Array.isArray(config.files)) {
      files = config.files.map(function(file) {
        return expandFiles(file); 
      });
    } else {
      files = config.files == "*" ? ("**/*.css") : files;
      files = expandFiles(files);
    }

    files.forEach(function(file) {
      grunt.helper('css_version', file, options);
    }); 

  }); 

  var cssBgReg = /background.*\((['"]?)([^'"\)]+)\1/g;
  var remoteReg = /https?:/;

  function isAbsolute(path) {
    return typeof path == "string" && ;
  }

  function imgMd5(path, refPath) {
    var fullpath;

    if (path[0] == '.') {
      fullpath = Path.resolve(refPath, path);
    } else if (path[0] == "/") {

    } 

    fullpath = ;
  }

  grunt.registerHelper('css_version', function(file, options, callback) {
    var source = grunt.file.read(file);
    var result, path;

    while(result = cssBgReg.exec(source)) {
      path = result[2]; 
      if (remoteReg.test(path)) continue;
      var imgMd5 = imgMd5(path);
      
    } 
  });
}
