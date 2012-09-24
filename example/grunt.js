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
      app: {
        options: {
          css_src: "./css",
          css_dst: "css",
          img_dst: "img",
          tpl_src: "./html",
          tpl_ext: "html"
        },

        css_files: "*",
        tpl_files: "*"
      }
    },

    spm: {
      root: "./js",
      resourcemap_dir: "<%= pkg.dist %>",
      options: {
        src: ".",
        dist: "../<%= pkg.dist %>/js"
      }
    }

  });

  //grunt.loadNpmTasks('grunt-htmlcompressor');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', 'clean css_version spm');
};
