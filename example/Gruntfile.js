module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    },

    "css-collect": {
      main: {
        css_src: "./css",
        css_dst: "css",
        img_dst: "img",
        resource_map_file: "<%= pkg.dist %>/css-resource-map.json",
        files: "*.css"
      }
    },

    "spm-build": {
      base: "./js",
      dist: "<%= pkg.dist %>/js",
      resource_map_file: "<%= pkg.dist %>/js-resource-map.json",
      resource_map: {
        "bootstrap-dropdown": "ui.js"
      }
    },

    "html-replace": {
      main: {
        resource_map: ["<config:css-collect.main.resource_map_file>"],
        src: "./html",
        files: "*.html"
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', ['clean', 'css-collect', 'spm-build']);
};
