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
- **JDK版本**：选择对应版本（推荐 JDK 21，若依 SpringBoot3 分支需要 JDK 17+）
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

---

> 📎 **附加内容：为什么这么做**

以下解释上述部署流程中各个关键步骤背后的原理，帮助理解为什么要这样做。

## 为什么要改名 jar 包

宝塔面板通过 jar 包的文件名来识别和管理的 Java 进程。如果两个项目的 jar 包同名，宝塔的进程管理模块会混淆它们的 PID。

当你操作其中一个项目时（比如重启、停止），宝塔可能会匹配到错误的进程去操作，导致别的在正常运行的同名项目被误操作。这种问题在面板界面上很难直观发现，排查起来非常头痛。

所以改名本质上是**给宝塔的进程管理一个唯一标识**，避免误杀误操作。

## 为什么要用 Java 项目部署而不是直接 java -jar

宝塔的 Java 项目管理器做的事情本质上就是执行 `java -jar xxx.jar`，但它额外提供了：

1. **进程守护** — 项目挂了自动重启
2. **日志可视化** — 在面板里直接看日志，不用 ssh tail
3. **端口管理** — 自动关联端口并能在面板统一查看
4. **资源监控** — 能看到 Java 进程的 CPU/内存占用

如果是手动 ssh 启动，这些都得自己搞。

## 为什么前端要单独部署为 HTML 项目

若依是前后端分离架构，前端的本质就是一堆静态文件（html、js、css），不需要 Java 容器来运行。

直接用 Nginx 托管这些静态文件效率最高，也最符合常规的前端部署方式。如果强行把前端也塞到后端 jar 里一起部署（通过 SpringBoot 的静态资源），不仅维护起来麻烦，而且 Nginx 处理静态文件的性能远超内嵌 Tomcat。

## 为什么需要 /prod-api/ 反向代理

若依前端在开发时通过 `Vue\_APP\_BASE\_API` 配置 API 地址，默认值是 `/prod-api`。

浏览器有**同源策略（CORS）**，如果前端域名 `admin.example.com` 直接请求后端 `localhost:8080`，跨域会被浏览器拦截。

解决方式有两种：

1. **Nginx 反向代理（推荐）** — 前端请求发到同源的 Nginx，Nginx 再转发到后端，浏览器感觉不到跨域
2. **后端配置 CORS** — 若依默认已经配了，但多了一层网络请求，不如反向代理优雅

Nginx 代理的方式也更安全，后端端口可以不对外暴露，只让 Nginx 访问。

## 为什么要用反向代理而不是直接改后端端口暴露

代理模式的本质是**Nginx 作为守门员**：

- Nginx 负责接收外部请求，根据路径 `/prod-api/` 判断是 API 请求，转发给后端
- 后端可以只监听 `127.0.0.1:8080`，不对外网暴露，减少攻击面
- 所有的 TLS/SSL 终止在 Nginx 层处理，后端不需要关心证书

这也是一般生产环境的推荐架构：Nginx 在前，应用在后。

### 反向代理的更多优势

**1. 负载均衡**

如果你有多个后端实例，Nginx 可以用一个入口分发请求：

```nginx
upstream backend {
    server 127.0.0.1:8080 weight=3;
    server 127.0.0.1:8081 weight=2;
    server 127.0.0.1:8082;
}

location /prod-api/ {
    proxy_pass http://backend/;
}
```

**2. 统一域名 + 多服务聚合**

一个域名下可以聚合多个后端服务，通过路径区分：

```nginx
location /prod-api/     { proxy_pass http://127.0.0.1:8080/; }  # 若依后端
location /api/           { proxy_pass http://127.0.0.1:3000/; }  # 另一个 Node 服务
location /websocket/     { proxy_pass http://127.0.0.1:9000/; }  # WebSocket 服务
```

访问者只需要记一个域名，体验统一。

**3. 缓存静态资源**

Nginx 可以对不经常变化的 API 响应做缓存，减轻后端压力：

```nginx
location /prod-api/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    proxy_pass http://127.0.0.1:8080/;
}
```

**4. 请求过滤与限流**

在代理层就能拦截恶意请求，都不用走到后端：

```nginx
# 限制某个 IP 每分钟最多 60 次请求
location /prod-api/ {
    limit_req zone=mylimit burst=20 nodelay;
    proxy_pass http://127.0.0.1:8080/;
}
```

**5. 灰度发布 / 蓝绿部署**

修改 upstream 就能切换流量，后端无感：

```nginx
upstream backend {
    server 127.0.0.1:8080;   # 旧版本
    server 127.0.0.1:8081;   # 新版本，逐步引流
}
```

### 对比：不配反向代理会怎样

| 做法 | 问题 |
|------|------|
| 直接暴露后端端口 8080 | 攻击者可以直接扫端口、打接口；前端跨域需要额外处理 |
| 后端改端口为 80/443 | 和 Nginx 冲突（端口被占），而且后端性能不如 Nginx 处理静态文件 |
| 每个服务一个独立域名 | 要配多个 SSL 证书，维护成本高，用户体验割裂 |

### 实际场景举例

**场景一：同一台服务器跑若依 + 另一个 SpringBoot 应用**

```nginx
server {
    listen 443 ssl;
    server_name admin.example.com;

    location / {                    # 前端页面
        root /www/wwwroot/admin;
    }
    location /prod-api/ {           # 若依后端 API
        proxy_pass http://127.0.0.1:8080/;
    }
    location /other-api/ {          # 另一个后端 API
        proxy_pass http://127.0.0.1:9090/;
    }
}
```

用户访问 `admin.example.com/other-api/xxx` 就能调另一个服务，完全无感。

**场景二：前后端分离，域名也分离**

```nginx
server {
    listen 443 ssl;
    server_name admin.example.com;      # 前端域名

    location / {
        root /www/wwwroot/admin;
    }
}

server {
    listen 443 ssl;
    server_name api.example.com;        # API 独立域名

    location / {
        proxy_pass http://127.0.0.1:8080/;
    }
}
```

这样前后端用不同域名，API 暴露更清晰，但要多一个 SSL 证书。

**场景三：开发环境热加载**

本地开发时前端 `npm run dev` 默认走 80 端口，Nginx 代理 `localhost:8080` 可以同时代理其他后端服务，一套 Nginx 配置开发和生产通用。

## 为什么要申请 SSL 证书

如果不用 HTTPS：

1. 登录时的密码是明文传输的，网络中被截获就能看到
2. 浏览器会标记为「不安全」，影响用户体验
3. 移动端 App 访问接口时，很多框架默认拒绝非 HTTPS 请求

宝塔的 Let's Encrypt 免费证书申请是全自动的，几乎没有成本，值得每个站点都配。

## 为什么后端要用参数配置而不是改源码

在宝塔的 Java 项目配置中通过 `--server.port=8080` 这类命令行参数传入配置，好处是：

1. **不改源码** — 开发环境和生产环境的配置分离，打包出来的 jar 包可以直接从 CI 拿
2. **方便变更** — 改端口、换数据库都不需要重新打包
3. **环境隔离** — 同一份 jar 包可以用不同的参数跑不同的环境
