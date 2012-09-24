var fs = require('fs');
var Path = require('path');
var crypto = require('crypto');

var exec = require('child_process').exec;

module.exports = function(grunt) {
  "use strict";

  grunt.registerTask("spm", "Build spm modules and generate resource map", function() {
    var map = {};
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
      }
      spmBuildParams += ' --' + i + '=' + options[i];
    }

    exec('spm build' + spmBuildParams,  {
      cwd: Path.resolve(config.root)
    }, function(err, stdout, stderr) {
      if (stderr) grunt.log.error(stderr);
      if (err) grunt.fail.fatal(err);

      generateResourceMap(config);
      callback();
    });
  });
  
  var idPattern = /define\s*\((['"])([^\/'"]*)\1/g;

  function generateResourceMap(config) {
    var options = config.options;
    var dist = options.dist;
    var resourceMap = {};

    function md5File(dist, path, base_uri) {
      var source = fs.readFileSync(filepath);
      var filename = md5(source);
      base_uri = base_uri || grunt.config('pkg.base_uri');

      return Path.join(pathPrefix); 
    }

    fs.readdirSync(dist).forEach(function(filename, i) {

      var filepath = Path.join(dist, filename);

      if (fs.statSync(filepath).isDirectory(filepath) ||
          filename.match(/\-debug/)) return;

      var source = fs.readFileSync(filepath);
      var result, id;

      while(result = idPattern.exec(source)) {
        id = result[2];
        if (id[0] == '#') id = id.slice(1);
        resourceMap[id] = md5File(path);
      }
    
    });

    if (config.resourceMap) {
      grunt.util._.extend(resourceMap, config.resourceMap);
    }


    for (var i in resourceMap) {
      var filename = resourceMap[i];
      var fullpath = path.join(dist, filename);
      var filecontent = fs.readFileSync(fullpath);
      var basename = md5(filecontent);
      excodedFilename = basename + path.extname(filename);
      excodedMap[i] = 'dist/' + excodedFilename;
      grunt.file.write(path.join(project.distDirectory, excodedFilename), filecontent);
    }

    var resourceMapFilename = 'resource-map.json';
    fs.writeFileSync(path.join(dist, resourceMapFilename), JSON.stringify(resourceMap));

    grunt.log.writeln('File ' + resourceMapFilename + ' created.');
  }

  function md5(filecontent) {
    return crypto.createHash('md5').update(filecontent).digest("hex");
  }
};
