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

  var cssBgPattern = /background.*?url\s*\(\s*(['"]?)([^'"\)]+)\1/g;
  var cssBgReplacePattern = /(background.*?url\(\s*)(['"]?)([^'"\)]+)\2/g;
  var httpPattern = /https?:\/\//;;
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

    var dstFilename;
    var filecontent = grunt.file.read(path);
    var extname = Path.extname(path);
    var basename = Path.basename(path, extname);

    dstFilename = basename + '_' + md5(filecontent) + extname;
    cache[path] = dstFilename;

    return dstFilename;
  }

  function normalizeUri(uri) {
    return uri.replace(/\\/g, '/').replace(/(https?:)\//, function(full, prelude) {
      return prelude + '//';
    });
  }

  function getDstPath(src, path, dstFilename) {
    var fullpath = Path.resolve(path);
    var srcFullpath = Path.resolve(src);
    var dstRelativePath = Path.relative(srcFullpath, fullpath);
    var dstRelativePathList = dstRelativePath.split(/[\/\\]/);

    dstRelativePathList.pop();
    dstRelativePathList.push(dstFilename);

    return dstRelativePathList.join('/');
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
    var source = grunt.file.read(filepath);
    var result;
    var imgPath, imgFullpath;
    var replaceList = [];

    cssBgPattern.lastIndex = 0;

    while (result = cssBgPattern.exec(source)) {
      imgPath = result[2];

      if (httpPattern.test(imgPath)) continue;

      if (imgPath[0] == '.') {
        imgFullpath = Path.resolve(Path.dirname(filepath), imgPath);
      } else if (imgPath[0] == '/') {
        imgPath = imgPath.slice(1);
        imgFullpath = Path.resolve(imgPath);
      }

      var imgDstFilename = genereateMd5Filename(imgFullpath);
      var imgDstPath = getDstPath(config.img_src, imgFullpath, imgDstFilename);
      var paths = getCopyAndRefPath(imgDstPath, config.base_uri);

      grunt.file.copy(imgFullpath, paths.copy);
      
      replaceList.push(paths.ref);
    }

    return replaceList;
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
      grunt.util._.extend(resourceMap, map);
    }); 

    var resourceMapFile = grunt.template.process(config.resource_map_file);
    fs.writeFileSync(resourceMapFile, JSON.stringify(resourceMap));
  
    grunt.log.ok('File ' + resourceMapFile + ' created.');
  });

  grunt.registerHelper('css_version', function(filepath, config) {
    filepath = Path.normalize(filepath);

    var idx = 0;
    var resourceMap = {};
    var source = grunt.file.read(filepath);
    var replaceList = parseCssBackground(filepath, config);

    source = source.replace(cssBgReplacePattern, function(full, prelude, quotes, url) {
      return prelude + replaceList[idx++];
    });

    var cssDstFilename = genereateMd5Filename(filepath);
    var cssDstPath = Path.join(config.css_dst, cssDstFilename);
    var paths = getCopyAndRefPath(cssDstPath, config.base_uri);
    var min = cleanCSS.process(source);

    grunt.file.write(paths.copy, min);

    resourceMap['/' + normalizeUri(filepath)] = paths.ref;

    return resourceMap;
  });
}
