module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: {
      name: "jy",
      dist: "dist",
      base_uri: "http://static.mail.com/jy/dist"
    },

    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    },

    css_version: {
      main: {
        css_src: "./css",
        css_dst: "css",
        img_dst: "img",
        resource_map_file: "<%= pkg.dist %>/css-resource-map.json",
        files: "*.css"
      }
    },

    "spm-build": {
      root: "./js",
      resource_map_file: "<%= pkg.dist %>/js-resource-map.json",
      resource_map: {
        "bootstrap-dropdown": "ui.js"
      },
      options: {
        src: ".",
        dist: "../<%= pkg.dist %>/js"
      }
    },

    "html-replace": {
      main: {
        resource_map: ["<config:css_version.main.resource_map_file>"],
        src: "./html",
        files: "*.html"
      }
    }

  });

  //grunt.loadNpmTasks('grunt-htmlcompressor');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', 'clean css_version spm-build');
};
