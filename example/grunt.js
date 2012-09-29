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
        css_src: "./css",
        css_dst: "css",
        img_dst: "img",
        resource_map_file: "<%= pkg.dist %>/css-resource-map.json",
        files: "*"
      }
    },

    spm: {
      root: "./js",
      resource_map_file: "<%= pkg.dist %>/js-resource-map.json",
      options: {
        src: ".",
        dist: "../<%= pkg.dist %>/js"
      }
    },

    html_substitute: {
      main: {
        resource_map: ["<config:css_version.main.resource_map_file>"],
        src: "./html",
        ext: "html",
        files: "*"
      }
    }

  });

  //grunt.loadNpmTasks('grunt-htmlcompressor');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', 'clean css_version spm html_substitute');
};
