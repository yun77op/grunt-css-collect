module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    test: {
      files: ["test/**/*.js"]
    },

    clean: {
      dist: ["<config:pkg.dist>"]
    },

    "css-collect": {
      main: {
        options: {
          css_dst: "dist/css",
          resource_map_file: "dist/css-resource-map.json",
          base_uri: "http://example.com/"
        },
        files: "css/*.css"
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('../tasks');

  grunt.registerTask('default', ['clean', 'css-collect']);
};
