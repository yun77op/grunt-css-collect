/*
 * grunt-html-substitue
 *
 * Copyright (c) 2012 yun77op
 * Licensed under the MIT license.
 */

var Path = require('path');
var os = require('os');

module.exports = function(grunt) {
    "use strict";

    grunt.util = grunt.util || grunt.utils;

    var _ = grunt.util._;
    var File = grunt.file;


    var relStylesheetPattern = /rel\s*=\s*(['"]?)stylesheet\1/;
    var stylesheetHrefPattern = /href\s*=\s*(['"]?)([^>\s'"]+)\1/;

    var processers = {
        dom: function(source, resourceMap) {
            var cheerio = require('cheerio');
            var $ = cheerio.load(source);

            $('link[rel=stylesheet]').each(function(idx, elm) {
                var $elm = $(elm);
                var href_src = $elm.attr('href');
                var href_dst = resourceMap[href_src];

                if (!href_dst) {
                    grunt.fail.warn('Failed to substitue ' + href_src + '.');
                }

                $elm.attr('href', href_dst);
            });

            return $.html();
        },

        line: function(source, resourceMap) {
            var lines = source.replace(/\r/g, '').split('\n');

            function isStylesheetLine(line) {
                line = line.trim();

                if (line.indexOf('<link') != 0 ||
                    !line.match(relStylesheetPattern)) return false;

                return true;
            }

            lines = lines.map(function(line) {
                if (!isStylesheetLine(line)) return line;

                return line.replace(stylesheetHrefPattern, function(full, quotes, path) {
                    var value = resourceMap[path];

                    if (!value) {
                        grunt.fail.warn('Failed to substitue ' + path + '.');
                    }

                    return 'href="' + value + '"';
                });
            });

            return lines.join(os.EOL);
        }
    };

    // ==========================================================================
    // TASKS
    // ==========================================================================

    grunt.registerMultiTask("html_substitute", "Substitue assets link in html", function() {
        var config = _.defaults({}, this.data);

        var resourceMap = {};
        var resourcePathMap = config.resource_map;

        if (!Array.isArray(resourcePathMap)) {
            resourcePathMap = [resourcePathMap];
        }

        resourcePathMap.forEach(function(filepath) {
            filepath = grunt.template.process(filepath);
            var map = File.readJSON(filepath);
            _.extend(resourceMap, map);
        });

        config.resourceMap = resourceMap;

        var files = config.files;

        if (!Array.isArray(files)) {
            files = [files];
        }

        files = _(files).chain().map(function(file) {
            file = Path.join(config.src, file);
            return File.expandFiles(file);
        }).flatten().value();

        files.forEach(function(file) {
            grunt.helper('html_substitute', file, config);
        });

        grunt.log.ok();
    });

    grunt.registerHelper('html_substitute', function(filepath, config) {
        var source = String(File.read(filepath, 'utf-8'));
        var processer = processers[config.process_type || 'line'];
        var html = processer(source, config.resourceMap);

        File.write(filepath, html);
    });

};
