---
title: 最安全的开源笔记软件Joplin
published: 2025-08-24
image: 'api'
tags: ["开源", "自部署"]
category: '经验总结'
---

## 前言

笔记软件一般是用来记录笔记、随笔、日记、私密信息等的， 
世面上的开源笔记软件很多，但就我个人体验而已，最安全的笔记软件则是——Joplin。

## Joplin

介绍：Joplin是注重隐私的笔记应用，具有 Windows、macOS、Linux、Android 和 iOS 同步功能。

官网：[https://joplinapp.org/](https://joplinapp.org/)

GitHub: [https://github.com/laurent22/joplin/](https://github.com/laurent22/joplin/) (51K+star)

## 使用体验

不愧为最安全，数据存储全是密文，只有客户登录自己的客户端app才能看到明文，

官方的同步服务端，存在云服务器上的所有数据也都是密文，即使云服务器的运维人员可以看到你服务器上的内容，也全都是密文，无法解密最大程度地保护了用户的隐私信息，

适合用来纪录一些比如银行卡号、常用的账户密码等极其私密的信息。

## 下载来源

### 官网

[https://joplinapp.org](https://joplinapp.org) [https://github.com/laurent22/joplin/releases](https://github.com/laurent22/joplin/releases)

## 使用教程

安装没啥好说的，一步一步安装就行，使用上就是普通的Markdown笔记软件，按笔记本进行文档归类，笔记本可以有子笔记本，可以把笔记本这个概念近似看成目录，笔记文档类比成文件；

其中文档的类型分为笔记和待办，笔记就是普通的Markdown笔记，而待办则是一个TODO列表，可以勾选和不勾选对应的单项，其中每个单项也可以写对应的描述，其实就是标题格式特殊的笔记。

### 配置主密码

在 工具 => 管理主密码 这里配置你的主密码，配置了主密码后，你会发现除了打开客户端app能看到明文，存在你电脑上的文档数据都是密文，同样的，如果云同步到服务器上，也全是密文，安全性很高。

### 云同步

Joplin的云同步支持多种方式，配置的路径是：工具 => 选项 => 同步 => 同步目标，选择对应的，然后输入URL, 邮箱和密码就可以了

-   Joplin云：就是Joplin官方提供的同步服务，需要去他们官网注册，价格比较贵，不太推荐，不缺钱的可以试试
    
-   Dropbox和OneDrive和Nextcloud: 这类就是用成熟的网盘去进行云同步
    
-   文件系统：用本地文件系统进行云同步，我不知道这项的意义是啥，一般需要云同步的场景都是跨设备的
    
-   S3：S3是一套标准的对象存储协议，你可以用这个协议将云同步的数据存储到任何支持S3协议的对象存储，不过大部分云服务的对象存储基本都支持S3
    
-   WebDav: 这是一直web网盘协议，目前国内支持这个协议的第三方网盘不多，就我知道的就只有坚果云，但我以前用坚果云体验过，效果不咋好，具体表现在同步的时候流量的限制，不咋推荐；另外一些开源的自部署网盘比如OpenList，Cloudreve支持WebDav协议
    
-   Joplin服务器(Beta): 这个是官方推出的可自部署的服务端镜像，推荐使用这种方式去进行云同步，你可以部署到自家的NAS上，也可以选择部署到云服务器上
    
-   Joplin 服务器(Beta, SAML): 我没用过，不清楚
    

个人在用也比较推荐的方式是通过 Joplin服务器(Beta) 方式云同步，这就需要自己部署一个joplin的服务端了

## Joplin Server

> 如果您需要购买云服务器或者对象存储，请看：[https://blog.ch.ikaros.run/archives/vps\_discounts](https://blog.ch.ikaros.run/archives/vps_discounts)

官方的docker镜像地址：[https://hub.docker.com/r/joplin/server](https://hub.docker.com/r/joplin/server)

这里给一个 docker-compose.yaml 文件供参考

    services:
        joplinserver:
            container_name: ${CONTAINER_NAME}
            environment:
                - APP_BASE_URL=${JOPLIN_EXTERNAL_URL}
                - APP_PORT=22300
                - POSTGRES_PASSWORD=${POSTGRES_PWD}
                - POSTGRES_DATABASE=${POSTGRES_DB}
                - POSTGRES_USER=${POSTGRES_USER}
                - POSTGRES_PORT=${POSTGRES_PORT}
                - POSTGRES_HOST=${POSTGRES_HOST}
                - DB_CLIENT=pg
            image: joplin/server
            ports:
                - 22300:22300
            restart: always

-   CONTAINER\_NAME: 容器名称，例如：joplin\_server
    
-   APP\_BASE\_URL: 外部访问地址，例如：https://joplins.ch.ikaros.run
    
-   APP\_PORT: 端口号，指定容器运行在内部的哪个端口上，如果这里改了，下方的 ports 那也需要改成和这里相同的端口号
    
-   POSTGRES\_PASSWORD: postgres数据库的连接密码
    
-   POSTGRES\_DATABASE: postgres数据库的哪个数据库
    
-   POSTGRES\_USER: postgres数据库的用户名
    
-   POSTGRES\_PORT: postgres数据库的端口
    
-   POSTGRES\_HOST: postgres数据库的域名或IP地址
    
-   DB\_CLIENT: 不要改动，表示选用的是postgres数据库，如果你选用的是SQLite 数据库，则这个参数和上面所有的POSTGRES\_开头的都可以删掉
    

### 额外功能

如果你配置好了Joplin Server云同步后，你可以在客户端app右键对应的文档，然后选择发布，这时您的这篇文档就被公开了，同时在服务器的文件系统里，也是明文存储，别人可以通过在浏览器访问你这篇文档的分享URL访问你这个文档的内容。