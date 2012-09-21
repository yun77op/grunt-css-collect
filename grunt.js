module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: {
      name: "jy",
      dist: "dist"
    },

    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    },

    css: {
      app: {
        options: {
          base_uri: "://static.mail.com/<config:pkg.dist>",
          resourcemap_dir: "<config:pkg.dist>",
          css_src: "css/jy",
          css_dst: "<config:pkg.dist>/css",
          img_src: "img",
          img_dst: "<config:pkg.dist>/img"
        },

        files: "*"
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'clean css');
};
