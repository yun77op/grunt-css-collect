/*
 * grunt-css-collect
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */


"use strict";

var path = require('path');
var crypto = require('crypto');
var cleanCSS = require('clean-css');

module.exports = function(grunt) {

  // Shorthands
  var file = grunt.file;

  var cssBackgroundPattern = /background.*?url\((['"]?)([^'"\)]+)\1/g;
  var httpPattern = /^https?:\/\//;
  var cache = {};


  // ==========================================================================
  // PRIVATE HELPER FUNCTIONS
  // ==========================================================================

  function md5(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  function normalizePath(aPath) {
    return path.normalize(aPath).replace(/\\/g, '/');
  }

  function hashFile(filePath) {
    if (cache[filePath]) {
      return cache[filePath];
    }

    var fileContent = file.read(filePath);
    var extName = path.extname(filePath);
    var baseName = path.basename(filePath, extName);
    var destFileName = baseName + '-' + md5(fileContent) + extName;
    cache[filePath] = destFileName;

    return destFileName;
  }

  function getDestFilePathRelativeToRoot(rootPath, filePath, destFileName) {
    var fileRelativePath = path.relative(rootPath, filePath);
    var fileRelativePathArray = fileRelativePath.split(/[\/\\]/);
    fileRelativePathArray.pop();
    fileRelativePathArray.push(destFileName);
    return fileRelativePathArray.join('/');
  }

  function parseCSSBackground(filePath, options) {
    var source = file.read(filePath);
    var rootPath = options.web_root;
    cssBackgroundPattern.lastIndex = 0;

    return source.replace(cssBackgroundPattern, function(cssRule, quote, imgFilePath) {
      if (httpPattern.test(imgFilePath)) {
        return cssRule;
      }

      if (imgFilePath[0] === '/') {
        imgFilePath = path.resolve(rootPath, imgFilePath.slice(1));
      } else {
        imgFilePath = path.resolve(path.dirname(filePath), imgFilePath);
      }

      var destImgFileName = hashFile(imgFilePath);
      var destImgFilePathRelativeToRoot = getDestFilePathRelativeToRoot(rootPath, imgFilePath, destImgFileName);
      var destImgFilePath = path.join(options.dest_dir, destImgFilePathRelativeToRoot);
      var url = options.base_url + '/' + destImgFilePathRelativeToRoot;

      file.copy(imgFilePath, destImgFilePath);

      return 'background: url("' + url + '"';
    });
  }


  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('css-collect', 'Version css and image files using MD5', function() {
    var resourceMap = {};
    var options = this.options({
      base_url: '',
      web_root: '.'
    });

    options.web_root = path.resolve(options.web_root);

    this.files.forEach(function(files) {
      files.src.filter(function(filePath) {
        if (!file.exists(filePath)) {
          grunt.log.warn('Source file "' + filePath + '" not found.');
          return false;
        }
        return true;
      }).forEach(function(filePath) {
        filePath = path.resolve(filePath);
        var source = parseCSSBackground(filePath, options);

        var destFileName = hashFile(filePath);
        var filePathRelativeToRoot = getDestFilePathRelativeToRoot(options.web_root, filePath, destFileName);
        var destFilePath = path.join(options.dest_dir, filePathRelativeToRoot);
        var min = cleanCSS.process(source);

        file.write(destFilePath, min);

        var convertToWebRootAbsolutePath = function(filePath) {
          var filePathRelativeToRoot = path.relative(options.web_root, filePath);
          return '/' + normalizePath(filePathRelativeToRoot);
        };

        resourceMap[convertToWebRootAbsolutePath(filePath)] = options.base_url + '/' + filePathRelativeToRoot;
      });
    });

    var resourceMapFile = grunt.template.process(options.resource_map_file);
    file.write(resourceMapFile, JSON.stringify(resourceMap));
 
    grunt.log.ok('File ' + resourceMapFile + ' created.');
  });
};