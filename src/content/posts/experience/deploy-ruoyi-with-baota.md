---
title: 宝塔如何部署若依开发的项目
published: 2026-07-23
pinned: false
description: '详细记录如何通过宝塔面板部署若依（RuoYi）前后端分离项目的全流程，包含后端jar部署、前端nginx配置、反向代理、SSL证书配置等。'
tags: ['若依', 'RuoYi', '宝塔', '部署', 'SpringBoot']
category: '经验总结'
draft: false
---

# 前言

若依（RuoYi）是目前国内使用非常广泛的 Java 后台管理系统框架，基于 SpringBoot + Vue 的前后端分离架构。

本文将详细介绍如何通过宝塔面板来部署若依开发的项目，全程使用宝塔的可视化操作，降低部署门槛。

# 准备工作

在开始之前，需要准备以下内容：

1. **已经编译好的后端 jar 包** — 通过 `mvn clean package -DskipTests` 打包，在 `ruoyi-admin/target/` 下找到 `ruoyi-admin.jar`（若配置了多模块）
2. **已经编译好的前端 dist 文件夹** — 进入 `ruoyi-ui` 目录执行 `npm run build:prod`，打包后在 `ruoyi-ui/dist/` 下
3. **宝塔面板已安装** — Nginx、MySQL、Redis 环境已就绪
4. **一个二级域名** — 比如 `admin.example.com`

# 第一步：部署后端（Java 项目）

## 1.1 上传 jar 包

进入宝塔面板 → **网站** → **Java项目** → **添加Java项目**

在项目管理页面点击 **添加项目**，选择 **SpringBoot 项目**。

上传你的 jar 包到服务器，宝塔会自动识别。

> **⚠️ 重要坑点（必看）：**
>
> 上传后记得**把 jar 包名称修改为你的项目名称**，比如将 `ruoyi-admin.jar` 改名为 `my-admin.jar`。
>
> 实测宝塔很坑的一点是：如果存在**同名 jar 包**，启动后进程 pid 会识别错误，导致错误地操作了别的在正常运行的同名 jar 包项目。比如你有两个项目都用 `ruoyi-admin.jar`，宝塔可能会误关掉正在运行的那个，很坑人。

## 1.2 配置运行参数

在添加项目的弹窗中配置以下内容：

- **项目名称**：自定义，如 `ruoyi-admin`
- **项目路径**：选择 jar 包所在目录
- **JDK版本**：选择对应版本（若依推荐 JDK 1.8）
- **项目端口**：填写你项目规定的端口，若依默认是 `8080`

![](https://imgbed.ikaros.run/file/file/bt-java-project.png)

在 **项目配置** 或 **项目参数** 中填入运行参数：

```
--server.port=8080
--spring.datasource.url=jdbc:mysql://localhost:3306/ry-vue?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=GMT%2B8
--spring.datasource.username=数据库用户
--spring.datasource.password=数据库密码
--spring.redis.host=localhost
--spring.redis.port=6379
```

也可以直接在 jar 包同目录下创建 `application.yml` 或 `application-druid.yml` 进行配置。

## 1.3 启动项目

点击 **保存** 并 **启动**，等待项目跑起来。

检查端口是否被占用（这里会占用你设置的端口，具体端口看项目规定），可以在宝塔的安全页面放行该端口。

查看项目日志确认启动成功，若依启动成功后会有经典 banner 输出：

```
(♥◠‿◠)ﾉﾞ 若依启动成功 ლ(´ڡ`ლ)ﾞ
```

# 第二步：部署前端（HTML 项目）

## 2.1 创建网站

在宝塔面板 → **网站** → **HTML项目** → **添加站点**

填入你的二级域名，根目录选择一个目录来存放前端文件，比如 `/www/wwwroot/admin.example.com`

点击提交创建站点。

## 2.2 上传前端文件

将编译好的 `dist/` 文件夹里的所有内容上传到刚创建的网站根目录。

上传完成后可通过域名或 IP 访问验证（此时可能只能看到白屏或静态页，因为 API 还没代理好）。

## 2.3 配置 Nginx

进入该网站的**设置** → **配置文件**，修改 Nginx 配置。

参考若依官方 nginx 配置文档：[若依部署文档 - Nginx配置](https://doc.ruoyi.vip/ruoyi-vue/document/hjbs.html#nginx%E9%85%8D%E7%BD%AE)

核心配置如下：

```nginx
server {
    listen 80;
    server_name admin.example.com;  # 改成你的域名
    charset utf-8;

    location / {
        root /www/wwwroot/admin.example.com;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
    }

    # 后端反向代理，这里是关键
    location /prod-api/ {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header REMOTE-HOST $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://localhost:8080/;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root html;
    }
}
```

> **关键点：** `location /prod-api/` 这个路径要与若依前端的 `.env.production` 中配置的 `VUE_APP_BASE_API` 保持一致，默认就是 `/prod-api`。

## 2.4 配置 SSL 证书（免费）

在宝塔网站设置 → **SSL** → **Let's Encrypt**（或其他免费证书服务）：

1. 选择你需要的域名
2. 勾选 **自动续签**
3. 点击申请，等待自动完成

申请成功后宝塔会自动为你的网站配置 HTTPS，同时会在 Nginx 配置中自动添加 SSL 相关配置段。

# 验证部署

访问 `https://admin.example.com`，应该能看到若依的登录页面。

使用默认账号密码 `admin / admin123` 登录，验证菜单、页面是否正常显示，接口是否正常返回数据。

# 常见问题

## 502 Bad Gateway

**原因：** Nginx 无法转发到后端端口。

**排查：** 检查后端 Java 项目是否启动成功，端口是否正确，`proxy_pass` 配置的地址和端口是否一致。

## 404 页面

**原因：** 前端路由找不到对应的 API。

**排查：** 检查 `location /prod-api/` 配置的 `proxy_pass` 是否正确，以及 `.env.production` 中的 `VUE_APP_BASE_API` 是否与之匹配。

## 跨域问题

若依后端默认配置了 CORS，如果在部署时遇到跨域问题，检查 `application.yml` 中的跨域配置是否允许了你前端的域名。

或者直接在 Nginx 端处理跨域，在 `location /` 中添加：

```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
```

# 总结

整体流程总结：

1. 打包后端为 jar 包并上传（记得改名！）
2. 在宝塔 Java 项目管理中添加项目，配置数据库等参数，启动
3. 打包前端为 dist 文件上传到网站根目录
4. 配置 Nginx，关键要加上 `location /prod-api/` 的反向代理
5. 申请 SSL 证书给域名套上 HTTPS

宝塔面板的可视化操作大大降低了部署门槛，但对于一些细节问题（如同名 jar 包的 PID 识别错误）还是需要留意和手动处理。
