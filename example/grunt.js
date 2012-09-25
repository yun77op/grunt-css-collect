module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: {
      name: "jy",
      dist: "dist",
      base_uri: "http://static.mail.com/jy"
    },

    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    },

    css_version: {
      main: {
        options: {
          css_src: "./css",
          css_dst: "css",
          img_dst: "img",
          resource_map_file: "<%= pkg.dist %>/css-resource-map.json"
        },
        files: "*"
      }
    },

    html_substitute: {
      main: {
        options: {
          resource_map: ["<config:css_version.main.options.resource_map_file>"],
          css_src: "./css",
          src: "./html",
          ext: "html"
        },
        files: "*"
      }
    },

    spm: {
      root: "./js",
      resource_map_file: "<%= pkg.dist %>/css-resource-map.json"
      options: {
        src: ".",
        dist: "../<%= pkg.dist %>/js"
      }
    }

  });

  //grunt.loadNpmTasks('grunt-htmlcompressor');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', 'clean css_version html_substitute');
};
