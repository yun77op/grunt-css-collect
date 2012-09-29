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

      css_version: {
        main: {
          options: {
            css_src: "./css",
            css_dst: "css",
            img_dst: "img",
            resource_map_file: "<%= pkg.dist %>/css-resource-map.json"
          },
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
          options: {
            resource_map: ["<config:css_version.main.options.resource_map_file>"],
            src: "./html",
            ext: "html"
          },
          files: "*"
        }
      },
      ...
    });

## 命令

### css_version

读取`css_src`中的css文件，分析css文件中的图片引用，把这些图片保持原有目录地移到`img_dst`，并把对图片做md5处理后的值作为该图片文件名一部分，css文件中对该图片的引用路径也更改为图片处理后的路径；移动css文件到`css_dst`，对css文件压缩并做把md5处理后的值作为该css文件名一部分，最后产出`resource_map_file`。

### spm

对使用 [seajs](http://seajs.org) 组织的模块使用 [spm](https://github.com/seajs/spm) 打包，最后产出`resource_map_file`，上线后调用`seajs.map(%resource_map%);`，`resource_map_file`的内容替换%resource_map%，就能无缝地去加载打包后的资源文件。

### html_substitute

根据`resource_map`，对模版文件的资源引用的路径替换，暂时只能识别css引用。