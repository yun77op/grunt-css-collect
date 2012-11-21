# grunt-ne

三个grunt插件的集合，打包前端资源

## 开始使用

### 安装

    npm install grunt-ne

### 配置

添加下面一行到你的`grunt.js`：

    grunt.loadNpmTasks('grunt-ne');

然后为插件增加像下面这样的配置：

    grunt.initConfig({
      ...
      pkg: {
        name: "jy",
        dist: "dist",
        base_uri: "http://static.mail.com/jy"
      },

      "css-collect": {
        main: {
          css_src: "./css",
          css_dst: "css",
          img_dst: "img",
          resource_map_file: "<%= pkg.dist %>/css-resource-map.json",
          files: "*.css"
        }
      },

      "spm-build": {
        root: "./js",
        resource_map_file: "<%= pkg.dist %>/js-resource-map.json",
        resource_map: {
          "bootstrap-dropdown": "ui.js"
        },
        options: {
          src: ".",
          dist: "../<%= pkg.dist %>/js"
        }
      },

      "html-replace": {
        main: {
          resource_map: ["<config:css-collect.main.resource_map_file>"],
          src: "./html",
          files: "*.html"
        }
      },
      ...
    });

## 命令

### css-collect

读取`css_src`中的css文件，分析css文件中的图片引用，把这些图片保持原有目录地移到`img_dst`，并把图片的md5值作为该图片文件名一部分，css文件中对该图片的引用路径也更改为图片处理后的路径；移动css文件到`css_dst`，对css文件压缩并做把css 的md5值作为该css文件名一部分，最后产出`resource_map_file`。

### spm-build

对使用 [seajs](http://seajs.org) 组织的模块使用 [spm](https://github.com/seajs/spm) 打包，最后产出`resource_map_file`，上线后比如在freemarker模板里如下使用, 就能无缝地去加载打包后的资源文件。

    seajs.config({
      ...
      map: <#include {path to resource map file}>
      ...
    });

### html-replace 

根据`resource_map`，对模版文件的资源引用的路径替换，暂时只能识别css引用。
