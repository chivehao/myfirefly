---
title: docker常用命令
published: 2022-03-10
image: 'api'
category: '学习笔记'
---
我的理解：镜像就是应用模板，容器就是应用。

# 安装 Docker

```
yum update #更新 yum 版本
yum install -y yum-utils device-mapper-persistent-data lvm2 # 安装 docker 依赖包
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo #设置 yum 源为阿里云的镜像源
yum install docker-ce #安装 docker
docker -v #查看 docker 版本
```

# 设置 utc 镜像源 docker

```
vi /etc/docker/daemon.json #编辑该文件加入下面内容
{
"registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
}
```

# Docker 命令

```
systemctl start docker
systemctl stop docker
systemctl restart docker
systemctl status docker
systemctl enable docker
docker info
docker --help
```

# 镜像相关命令

```
docker images #查看镜像
docker search 镜像名称 #搜索镜像
docker pull 镜像名称 #拉取镜像
docker rmi 镜像 ID #删除镜像
docker rmi `docker images -q` #删除所有镜像
```

> REPOSITORY：镜像名称  TAG：镜像标签  IMAGE ID：镜像 ID  CREATED：镜像的创建日期（不是获取该镜像的日期）  SIZE：镜像大小  这些镜像都是存储在 Docker 宿主机的/var/lib/docker 目录下
> 
> NAME：仓库名称  DESCRIPTION：镜像描述  STARS：用户评价，反应一个镜像的受欢迎程度，和 GitHub 上的 stars 差不多的意义  OFFICIAL：是否官方  AUTOMATED：自动构建，表示该镜像由 Docker Hub 自动构建流程创建的  **注意**：删除所有镜像命令中的单引号为键盘上 ESC 键下方的那个按键打出来的结果

# 容器相关命令

## 1.查看容器

```
docker ps #查看正在运行的容器
docker ps –a #查看所有容器
docker ps –l #查看最后一次运行的容器
docker ps -f status=exited #查看停止的容器
```

## 2.创建与启动容器

创建容器常用的参数说明：

创建容器命令：docker run

-i：表示运行的是容器

-t：表示容器启动后会进入其命令行。加入这两个参数后，容器创建就能登录进去。即分配一个伪终端。

--name :为创建的容器命名。

-v：表示目录映射关系（前者是宿主机目录，后者是映射到宿主机上的目录），可以使用多个－v 做多个目录或文件映射。注意：最好做目录映射，在宿主机上做修改，然后共享到容器上。

-d：在 run 后面加上-d 参数，则会创建一个守护式容器在后台运行（这样创建容器后不会自动登录容器，如果只加-i -t 两个参数，创建后就会自动进去容器）。

-p：表示端口映射，前者是宿主机端口，后者是容器内的映射端口。可以使用多个-p 做多个端口映射

### 交互式方式创建容器

```
docker run -it --name= 容器名称 镜像名称：标签 /bin/bash
```

/bin/bash 为加载命令  这时我们通过 ps 命令查看，发现可以看到启动的容器，状态为启动状态

退出当前容器

```
exit
```

### 守护式方式创建容器（常用）：

```
docker run -di --name= 容器名称 镜像名称：标签
```

登录守护式容器方式：

```
docker exec -it 容器名称 (或者容器 ID)  /bin/bash
```

## 3.停止与启动容器

```
docker stop 容器名称（或者容器 ID）#停止容器
docker start 容器名称（或者容器 ID）#启动容器
```

## 4.文件拷贝

```
docker cp 需要拷贝的文件或目录 容器名称：容器目录 #将文件拷贝到容器内可以使用 cp 命令
docker cp 容器名称：容器目录 需要拷贝的文件或目录 #将文件从容器内拷贝出来
```

## 5.目录挂载

我们可以在创建容器的时候，将宿主机的目录与容器内的目录进行映射，这样我们就可以通过修改宿主机某个目录的文件从而去影响容器。  创建容器 添加-v 参数 后边为 宿主机目录：容器目录

```
docker run -di -v /usr/local/myhtml:/usr/local/myhtml --name=mycentos3 centos:7
```

如果你共享的是多级的目录，可能会出现权限不足的提示。  这是因为 CentOS7 中的安全模块 selinux 把权限禁掉了，我们需要添加参数 --privileged=true 来解决挂载的目录没有权限的问题

## 6.查看容器 IP 地址

```
docker inspect 容器名称（容器 ID） #查看容器运行的各种数据
#执行下面的命令直接输出 IP 地址
docker inspect --format='{{.NetworkSettings.IPAddress}}' 容器名称（容器 ID）
```

## 7.删除容器

```
docker rm 容器名称（容器 ID）
```

# 应用部署

这里只举个 MySQL 的栗子

## 1.拉取 MySQL 镜像

```
docker pull centos/mysql-57-centos7
```

## 2.创建容器

```
docker run -di --name=tensquare_mysql -p 33306:3306 -e MYSQL_ROOT_PASSWORD=123456 MySQL
```

-p 代表端口映射，格式为 宿主机映射端口：容器运行端口

-e 代表添加环境变量 MYSQL_ROOT_PASSWORD 是 root 用户的登陆密码

## 3.远程登录 MySQL

连接宿主机的 IP ,指定端口为 33306

#迁移与备份

## 容器保存为镜像

我们可以通过以下命令将容器保存为镜像

```
docker commit mynginx mynginx_i
```

## 镜像备份

我们可以通过以下命令将镜像保存为 tar 文件

```
docker  save -o mynginx.tar mynginx_i
```

## 镜像恢复与迁移

首先我们先删除掉 mynginx_img 镜像 然后执行此命令进行恢复

```
docker load -i mynginx.tar
```

-i 输入的文件

执行后再次查看镜像，可以看到镜像已经恢复

# Dockerfile

Dockerfile 是由一系列命令和参数构成的脚本，这些命令应用于基础镜像并最终创建一个新的镜像

| 命令                                 | 作用                                 |
| ---------------------------------- | ---------------------------------- |
| FROM image_name:tag                | 定义了使用哪个基础镜像启动构建流程                  |
| MAINTAINER user_name               | 声明镜像的创建者                           |
| ENV key value                      | 设置环境变量 (可以写多条)                     |
| RUN command                        | 是 Dockerfile 的核心部分(可以写多条)          |
| ADD source_dir/file dest_dir/file  | 将宿主机的文件复制到容器内，如果是一个压缩文件，将会在复制后自动解压 |
| COPY source_dir/file dest_dir/file | 和 ADD 相似，但是如果有压缩文件并不能解压            |
| WORKDIR path_dir                   | 设置工作目录                             |

## 使用脚本创建镜像

步骤：

1.创建目录

```
mkdir –p /usr/local/dockerjdk8
```

2.下载 jdk-8u171-linux-x64.tar.gz 并上传到服务器（虚拟机）中的/usr/local/dockerjdk8 目录

3.创建文件 Dockerfile `vi Dockerfile`

```
#依赖镜像名称和 ID
FROM centos:7
#指定镜像创建者信息
MAINTAINER ITCAST
#切换工作目录
WORKDIR /usr
RUN mkdir  /usr/local/java
#ADD 是相对路径 jar,把 Java 添加到容器中
ADD jdk-8u171-linux-x64.tar.gz /usr/local/java/

#配置 Java 环境变量
ENV JAVA_HOME /usr/local/java/jdk1.8.0_171
ENV JRE_HOME $JAVA_HOME/jre  
ENV CLASSPATH $JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib:$CLASSPATH  
ENV PATH $JAVA_HOME/bin:$PATH
```

4.执行命令构建镜像

```
docker build -t='jdk1.8' .
```

注意后边的空格和点，不要省略

5.查看镜像是否建立完成

```
docker images
```