var Path = require('path');
var crypto = require('crypto');

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

    grunt.file.mkdir(options.css_dir);
    grunt.file.mkdir(options.img_dir);

    files.forEach(function(file) {
      grunt.helper('css_version', file, options);
    }); 

  });

  var cssBgReg = /background.*\((['"]?)([^'"\)]+)\1/g;
  var cssBgReplaceReg = /(background.*)\((['"]?)([^'"\)]+)\\2)'/;
  var remoteReg = /https?:/;
  var cache = {};

  function md5(filecontent) {
    crypto.createHash('md5').update(filecontent).digest("hex");
  }

  function genereateMd5Filename(path) {
    if (cache[path]) {
      return cache[path];
    }

    var dstFilename;
    var filecontent = grunt.file.read(path);
    var extname = Path.extname(path);
    var basename = Path.basename(path, extname);

    dstFilename = basename + '_' + md5(filecontent) + extname;
    cache[path] = dstFilename;

    return dstFilename;
  }

  grunt.registerHelper('css_version', function(filepath, options, callback) {
    var source = grunt.file.read(filepath);
    var imgPath, imgFullpath;
    var resourceMap = {};

    cssBgReg.lastIndex = 0;

    while (var result = cssBgReg.exec(source)) {
      imgPath = result[2];
      if (remoteReg.test(imgPath)) continue;

      cssBgReplaceReg.lastIndex = cssBgReg.lastIndex;

      if (imgPath[0] == '.') {
        imgFullpath = Path.resolve(filepath, imgPath);
      } else if (grunt.file.isPathAbsolute(imgPath)) {
        imgFullpath = Path.resolve(imgFullpath); = imgPath;
      }

      imgFullpath = Path.resolve(imgFullpath);

      var imgDirFullpath = Path.resolve(options.img_dir);
      var relativePath = imgPath.relative(imgDirFullpath, imgFullpath);
      var imgDstFilename = genereateMd5Filename(imgFullpath);
      var imgDstPath = Path.join(relativePath, imgDstFilename);
      grunt.file.copy(imgPath, Path.join(options.img_dst, imgDstPath));
      imgDstPath = (options.base_uri || '') + '/' + imgDstPath;

      source.replace(cssBgReplaceReg, function(full, bgPrefix, url) {
        return bgPrefix + '(' + imgDstPath + ')';
      });

      cssBgReg.lastIndex += imgDstFilename.length - imgPath.length;
    }

    var cssDstPath = genereateMd5Filename(filepath);
    cssDstPath = Path.join(options.img_dir, cssDstPath);
    grunt.file.copy(filepath, cssDstPath);

    resourceMap[filepath] = cssDstPath;
  });
}
