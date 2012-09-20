module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ['dist']
    },

    css: {
      options: {
        src: "css/jy",
        dst: "css",
        base_uri: "://static.mail.com/"
      },

      files: {
        "*": "*"
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'clean css');
};