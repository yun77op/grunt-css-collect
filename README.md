# grunt-css-collect

> 使用MD5版本控制CSS及CSS中引用的图片文件

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

处理后的css及图片文件存放目录

### resource_map_file

资源映射文件路径

### base_url

type: `String`
Default: '/'

CSS文件引用的图片的基准地址

### web_root

type: `String`
Default: '.'

Web服务器根目录