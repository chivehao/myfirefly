---
title: OpenWRT泛域名劫持
published: 2025-08-25
image: 'api'
category: '经验总结'
---


适用场景：需要将局域网的指定域名解析到对应的局域网服务器上，而不是走路由器通过公网查询DNS。

使用的是dnsmasq

修改配置文件：vim /etc/dnsmasq.conf

末尾加上下面这行：

    address=/ch.ikaros.run/192.168.9.153

按 ECS 键，输入 :wq 并回车保存

重启dnsmasq或者reboot

这行的意思是劫持所有到达openwrt的dns请求，

域名范围为 \*.ch.ikaros.run ，

将其指向局域网IP为 192.168.9.153 的服务器