# grunt-css-collect

用于css及css中引用图片的版本控制的grunt插件

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
          dest_dir: "dist",
          resource_map_file: "dist/css-resource-map.json",
          base_url: "http://example.com/dist/",
          web_root: "."
        },
        files: {
          src: ["css/*.css"]
        }
      }
    }

## 选项

### dest_dir

处理后的cs录s文件存放目

### resource_map_file

路径映射文件

### base_url

css文件引用的图片基本地址

### web_root

Web服务器根目录