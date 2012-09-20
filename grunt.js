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
        css_src: "css/jy",
        css_dst: "<%= build_dir %>/css",
        base_uri: "://static.mail.com/",
        img_src: "img",
        img_dst: "<%= build_dir %>/img",
        img_prefix: "."
      },

      files: "*"
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'clean css');
};
