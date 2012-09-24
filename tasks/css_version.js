var Path = require('path');
var crypto = require('crypto');
var os = require('os');
var cleanCSS = require('clean-css');

module.exports = function(grunt) {
  "use strict";

  grunt.registerMultiTask("css_version", "Version css and img files using Md5", function() {
    var config = this.data;
    var options = config.options;
    var cssFiles = getFiles(config.css_files, options.css_src, 'css');
    var resourceMap = {};

    cssFiles.forEach(function(file) {
      var map = grunt.helper('css_version', file, options);
      grunt.util._.extend(resourceMap, map);
    }); 
return;
    var tplFiles = getFiles(config.tpl_files, options.tpl_src, options.tpl_ext);
    tplFiles.forEach(function(file) {
      grunt.helper('html_substitute', file, resourceMap, options);
    });

    grunt.log.writeln('ok');
  });

  var cssBgPattern = /background.*?\(\s*(['"]?)([^'"\)]+)\1/g;
  var cssBgReplacePattern = /(background.*?\(\s*)(['"]?)([^'"\)]+)\2/g;
  var httpPattern = /https?:/;
  var relStylesheetPattern = /rel\s*=\s*(['"]?)stylesheet\1/;
  var stylesheetHrefPattern = /href\s*=\s*(['"]?)([^>\s'"]+)\1/;
  var cache = {};

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

  function getDstPath(src, path, dstFilename) {
    var fullpath = Path.resolve(path);
    var srcFullpath = Path.resolve(src);
    var dstRelativePath = Path.relative(srcFullpath, fullpath);
    var dstRelativePathList = dstRelativePath.split('/');

    dstRelativePathList.pop();
    dstRelativePathList.push(dstFilename);

    return dstRelativePathList.join('/');
  }

  function getCopyAndRefPath(path, base_uri) {
    var dist = grunt.config('pkg.dist');
    base_uri = base_uri || grunt.config('pkg.base_uri');

    if (base_uri[base_uri.length - 1] == '/') {
      base_uri = base_uri.slice(0, -1);
    }

    var refDstBase = base_uri ? base_uri : '/' + dist;

    return {
      copy: Path.join(dist, path),
      ref: refDstBase + '/' + path
    };
  }

  function parseCssBackground(filepath, options) {
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
      var imgDstPath = getDstPath(options.img_src, imgFullpath, imgDstFilename);
      var paths = getCopyAndRefPath(imgDstPath, options.base_uri); 
      grunt.file.copy(imgFullpath, paths.copy);
      
      replaceList.push(paths.ref);
    }

    return replaceList;
  }

  function isStylesheetLine(line) {
    line = line.trim();

    if (line.indexOf('<link') != 0 ||
        !line.match(relStylesheetPattern)) return false;
    
    return true;    
  }

  grunt.registerHelper('html_substitute', function(filepath, resourceMap, options) {
    var source = grunt.file.read(filepath);
    var lines = source.split(os.EOL);
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
  
  grunt.registerHelper('css_version', function(filepath, options) {
    filepath = Path.normalize(filepath);

    var index = 0;
    var resourceMap = {};
    var source = grunt.file.read(filepath);
    var replaceList = parseCssBackground(filepath, options);

    source = source.replace(cssBgReplacePattern, function(full, bgPrefix, quotes, url) {
      return bgPrefix + replaceList[index++];
    });

    var cssDstFilename = genereateMd5Filename(filepath);
    var cssDstPath = Path.join(options.css_dst, cssDstFilename);
    var paths = getCopyAndRefPath(cssDstPath, options.base_uri);
    var min = cleanCSS.process(source);

    grunt.file.write(paths.copy, min);

    resourceMap['/' + filepath] = paths.ref;

    return resourceMap;
  });
}
