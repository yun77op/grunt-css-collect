module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    clean: {
      dist: ["dist"]
    },

    "css-collect": {
      main: {
        options: {
          dest_dir: "dist",
          resource_map_file: "dist/css-resource-map.json",
          base_url: "http://example.com/dist",
          web_root: "."
        },
        files: {
          src: ["css/*.css"]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', ['clean', 'css-collect']);
};