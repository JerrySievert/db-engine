module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [ 'lib/*.js' ],
      options: {
        node: true,
        loopfunc: true
      }
    },

    complexity: {
      generic: {
        src: [ 'lib/*.js' ],
        options: {
          jsLintXML: 'complexity.xml', // create XML JSLint-like report
          errorsOnly: false, // show only maintainability errors
          cyclomatic: 6,
          halstead: 30,
          maintainability: 85
        }
      }
    },

    jsdoc : {
      dist : {
        src: [ 'lib/*.js' ],
        options: {
          destination: 'doc',
          configure: __dirname + '/jsdoc.conf.json',
          template: __dirname + '/node_modules/ink-docstrap/template'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('build', [ 'jshint', 'jsdoc', 'complexity' ]);
  grunt.registerTask('default', [ 'build' ]);
};
