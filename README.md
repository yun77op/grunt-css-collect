# grunt-css-collect

用于css及css中引用图片的版本控制的grunt插件，可选替换html中引用的css为处理后的css路径

## 开始使用

### 安装

    npm install grunt-css-collect

### 配置

添加下面一行到你的`Gruntfile.js`：

    grunt.loadNpmTasks('grunt-css-collect');

然后为插件增加像下面这样的配置：

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

## 选项

### css_dst

处理后的css文件存放目录

### resource_map_file

路径映射文件

### base_uri

css文件引用的图片基本地址