module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'clean test');
};
