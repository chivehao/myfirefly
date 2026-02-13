---
title: 给系统安装FastDFS
published: 2022-07-23
image: 'api'
category: '经验总结'
---
# 前言

鉴于FTP结合静态资源站点，配置时太麻烦。
而且并没有比较好的拓展性，计划用FastDFS为系统的文件储存。
为方便我自己以后再次搭建，记录下来搭建过程和一些坑。
**视频**：暂未上传

# 环境

* 操作系统：CentOS 7.X

# 参考教程

* [GitHub官方安装文档](https://github.com/judasn/Linux-Tutorial/blob/master/markdown-file/FastDFS-Install-And-Settings.md)
* [介绍文档](https://www.oschina.net/p/fastdfs)
* [docker+fastdfs+nginx 实现分布式大文件存储系统以及视频缓存播放](https://www.codetd.com/article/11137382)
* [FastDFS【三】：SpringBoot使用FastDFS](https://zhuanlan.zhihu.com/p/29165834)

# FastDFS 简介

* 具体介绍请参考[介绍文档](https://www.oschina.net/p/fastdfs)
* 官网下载 1：https://github.com/happyfish100/fastdfs/releases
* 官网下载 2：https://sourceforge.net/projects/fastdfs/files/
* 官网下载 3：http://code.google.com/p/fastdfs/downloads/list
* 主要场景：
  * 小图片
  * 音频、小视频
  * 其他类型小文件
  * 更加复杂的文件存储场景可以选择：Ceph
  * 支持对象存储、块存储和文件存储
* 高性能、高可靠性和高扩展

# 准备工作

## 端口

需要开放以下端口的TPC，可修改

* 80 nginx

* 23000  连接FastDFS的端口

* 22122 tracker

* 8888 storage

* 443 ssl
  
  ## 安装docker
  
  请参照我的文档：docker常用命令

## 下载fastdfs镜像

`docker pull season/fastdfs`

`cd /var`

`mkdir /fdfs`
所有的文件存放在/var/fdfs中 目录清晰 

## 下载nginx

`wget http://nginx.org/download/nginx-1.15.9.tar.gz`

## 安装git

直接去github上下载所需要的包也可以

```
yum install git
git clone https://github.com/happyfish100/fastdfs.git
git clone https://github.com/happyfish100/libfastcommon.git
git clone https://github.com/happyfish100/fastdfs-nginx-module.git
```

下图三个文件都需要下载


## 解压nginx

```
tar -zxvf nginx-1.15.9.tar.gz 
//新建文件夹 存放fastdfs配置文件
mkdir fdfs_conf
```

目录如下


## 准备工作结束

到这步，准备工作基本完成，接下来就是重点了，如何配置fastdfs以及整合nginx

## 开始配置

启动一个临时的tracker 拷贝storage.conf tracker.conf 至/var/fdfs/fdfs_conf

```
docker run  -d --name tracker  --net=host season/fastdfs tracker
docker ps 
//查询到容器id
docker cp 404(容器ID):/fdfs_conf/tracker.conf `pwd`（当前路径）
docker cp 404(容器ID):/fdfs_conf/storage.conf `pwd`（当前路径）
```

vim storage.conf 修改tracker_server=实际ip:22122  http.server_port=8888
启动 tracker 和 storage  实际应用应该是多个tracker 多个storage  这里只做演示用，并没有配置多个，其实一个会配置了，其余都一样的，具体集群配置方法自行百度，这里不再赘述。
还有，对于文件夹，先验证下存在此文件夹(试着cd进入目标文件夹，没有就用mkdir命令 创建)，再配置到启动参数里。

```
docker run -ti -d \
--name trakcer \
-v /var/fdfs/tracker_data:/fastdfs/tracker/data \
-v /var/fdfs/fdfs_conf/tracker.conf:/fdfs_conf/tracker.conf  \
--net=host season/fastdfs tracker

docker run -ti --name storage \
-v /var/fdfs/fdfs_conf/storage.conf:/fdfs_conf/storage.conf \
-v /var/fdfs/storage_data:/fastdfs/storage/data \
-v /var/fdfs/store_path:/fastdfs/store_path \
--net=host  season/fastdfs storage
```

`cd /var/fdfs/store_path1/data`
`ll`


## 测试

是基于SpringBoot测试Maven构建
pom.xml:

```xml
                <!-- fastdfs 依赖库-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <optional>true</optional>
            <scope>true</scope>
        </dependency>
        <dependency>
            <groupId>com.github.tobato</groupId>
            <artifactId>fastdfs-client</artifactId>
            <version>1.26.3</version>
        </dependency>
        <dependency>
            <groupId>commons-io</groupId>
            <artifactId>commons-io</artifactId>
            <version>2.6</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
```

application.properties:
记得修改自己的IP地址

```properties
server.port=8080


# 文件上传配置
spring.servlet.multipart.max-file-size=4096MB
spring.servlet.multipart.max-request-size=4096MB

# fastDFS 配置
fdfs.so-timeout=1501
fdfs.connect-timeout=601
fdfs.thumb-image.width=150
fdfs.thumb-image.height=150
fdfs.web-server-url=192.168.254.146/
fdfs.tracker-list[0]=192.168.254.146:22122
FDFS_SERVER_HOST=192.168.254.146
FDFS_SERVER_PORT=8888
```

上传的客户端简单封装：

```Java
/**上传客户端封装
 * @ClassName FastDFSClient
 * @Author tobeshrek
 * @Date 2020/4/28 13:20
 */
@Component
public class FastDFSClient {

    @Autowired
    private FastFileStorageClient storageClient;
    @Value("${FDFS_SERVER_HOST}")
    private String FDFS_SERVER_HOST;
    @Value("${FDFS_SERVER_PORT}")
    private Integer FDFS_SERVER_PORT;


    /**
     * 上传文件
     * @param file
     * @return 文件的完整RUL地址
     * @throws IOException
     */
    public String uploadFile(MultipartFile file) throws IOException {
        StorePath storePath = storageClient.uploadFile((InputStream)file.getInputStream(),file.getSize(), FilenameUtils.getExtension(file.getOriginalFilename()),null);
        return getResAccessUrl(storePath);
    }

    // 封装文件完整URL地址
    private String getResAccessUrl(StorePath storePath) {
        String fileUrl = "http://"+FDFS_SERVER_HOST+":"+FDFS_SERVER_PORT + "/" + storePath.getFullPath();
        return fileUrl;
    }

    /**
     * 删除文件
     * @param filePath
     * @return 删除是否成功
     */
    public boolean deleteFile(String filePath) {
        try {
            storageClient.deleteFile(filePath);
            return true;
        }catch (FdfsServerException e){
            e.printStackTrace();
            return false;
        }
    }
}
```

controller层

```java
    @Autowired
    private FastDFSClient dfsClient;

    // 上传文件
    @RequestMapping(value = "/upload", method = RequestMethod.POST)
    public String upload(MultipartFile file, HttpServletRequest request, HttpServletResponse response) throws Exception {
        String fileUrl= dfsClient.uploadFile(file);
        return fileUrl;
    }

    @DeleteMapping("/delete")
    public Boolean delete(String fileUrl){
        return dfsClient.deleteFile(fileUrl);
    }
```

使用POSTMAN测试：
![image.png](https://resource.tobeshrek.com/shrek/2020/4/28/553F13C2A07849258003EE91C72A96D4.png)

命令行查看文件：
` cd /var/fdfs/store_path/data/00/00`
`ll`
![image.png](https://resource.tobeshrek.com/shrek/2020/4/28/875A117A60F048C9A9FDB88F05426985.png)

上传成功了，然后就剩下通过**nginx反向代理http请求**了。

## 配置nginx反向代理http请求

安装依赖

```
yum -y install gcc zlib zlib-devel pcre-devel openssl openssl-devel
```

安装libfastcommon

```
cd /var/fdfs/libfastcommon
./make.sh
./make.sh install
```

安装fastdfs

```
cd /var/fdfs/fastdfs
./make.sh
./make.sh install
```

安装 nginx

```
cd /var/fdfs
tar -zxvf nginx-1.15.9.tar.gz
cd nginx-1.15.9

./configure \
--add-module=/var/fdfs/fastdfs-nginx-module/src \
--with-http_ssl_module

make && make install
```

一切顺利的话 你在/usr/local/ 目录下就可以看到nginx了。
![image.png](https://resource.tobeshrek.com/shrek/2020/4/28/9322EC52E8234A2B8AB9633D62B51FB6.png)

复制配置文件，没有的文件夹（比如`/etc/fdfs`）自己创建

```
cp -r /var/fdfs/fastdfs/conf/* /etc/fdfs/
cp /var/fdfs/fastdfs-nginx-module/src/mod_fastdfs.conf /etc/fdfs
```

`/etc/fdfs`目录中的所有文件是`nginx` 整合`fastdfs-nginx-module`所用到的配置文件

 修改配置

```
vi /etc/fdfs/storage.conf
# 以下是配置文件里需要修改的项，请根据自己的情况修改
base_path=/var/fdfs/store_path
store_path0=/var/fdfs/store_path
tracker_server=192.168.254.146:22122
http.server_port=8888 //需要与nginx监听的端口一致

vi /etc/fdfs/tracker.conf
# 以下是配置文件里需要修改的项，请根据自己的情况修改
base_path=/var/fdfs/tracker_data

vi /etc/fdfs/mod_fastdfs.conf
# 以下是配置文件里需要修改的项，请根据自己的情况修改
tracker_server=192.168.254.146:22122
store_path0=/var/fdfs/store_path
url_have_group_name = true //请求路径是否携带组信息 
```

## 修改nginx的配置

```
vi /usr/local/nginx/conf/nginx.conf
# 在http{}中添加个服务
server {
        listen       8888;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location ~/group([0-9])/M00 {
        # root /var/fdfs/storage_path;
            ngx_fastdfs_module;
      }
}
```

## 启动nginx

```
cd /usr/local/nginx/sbin
./nginx

//重新加载 
./nginx -s reload
//停止
./nginx -s stop
```

## 访问浏览器


## SSL 加密访问

修改文件储存容器配置文件

```
vi /var/fdfs/fdfs_conf/storage.conf

http.server_port=443
# 改好后保存
# 再重启容器
docker ps
docker stop storage
docker start storage
```

修改nginx配置文件，相应的ssl证书请上传到`/usr/local/nginx/conf`目录下，并更改成对应的名称(可自己定义，对上就行)

```
vi /usr/local/nginx/conf/nginx.conf
# 改成如下
# http里之前的server修改成这样
    server {
        listen       80;
        server_name  resource.tobeshrek.com;
        # 跳转到HTTPS
        return 301 https://$server_name$request_uri;   
    }
# 再在下方加如下
    # 静态资源站点 和 fastdfs ssl加密访问配置
    server {
        listen       443 ssl;
        server_name  resource.tobeshrek.com;
        # ssl 证书配置
        ssl_certificate      resource.pem;
        ssl_certificate_key  resource.key;
        ssl_session_cache    shared:SSL:1m;
        ssl_session_timeout  5m;
        ssl_ciphers  HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;


        #access_log  logs/host.access.log  main;

        location ~/group([0-9])/M00 {
        # root /var/fdfs/storage_path;
            ngx_fastdfs_module;
      }
   }
# 配置保存好，然后重启nginx
cd /usr/local/nginx/sbin
./nginx -s reload
```

# 

# END