---
title: 阿里云 ESA 使用总结：OSS 回源与 HOST 配置
published: 2026-10-02
description: '记录使用阿里云 ESA 加速 OSS 文件时，DNS 记录、回源 HOST 和临时 URL 域名之间的配置关系。'
image: 'api'
category: '经验总结'
tags: ["阿里云", "ESA", "OSS", "CDN", "Cloudreve"]
draft: false
---

记录一下使用阿里云 ESA 加速 OSS 文件时的配置经验，主要是 DNS 记录和回源 HOST 的选择。

## DNS 记录怎么选

如果文件存储在 OSS 上，并且由应用程序签发临时 URL 供用户访问，在 ESA 创建 DNS 记录时，我使用的是这组配置：

| 配置项 | 选择 |
| --- | --- |
| 记录类型 | CNAME |
| 记录值 / 源站类型 | OSS |
| 回源类型 | 公共访问 |
| 源站地址 | OSS Bucket 的外网域名，例如 `examplebucket.oss-cn-hangzhou.aliyuncs.com` |

源站地址要包含 Bucket 名称，不要只填地域 Endpoint，例如 `oss-cn-hangzhou.aliyuncs.com`，也不要填 OSS 内网域名。ESA 的相关选项可参考[添加不同类型的 DNS 记录](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/introduction-of-dns-related-parameters/)。

这里的“公共访问”指 ESA 的回源类型，不代表要把 OSS Bucket 改成公共读。本文讨论的是应用程序提供 OSS 签名 URL 的场景；如果需要由 ESA 自行签名访问私有 Bucket，则应按[私有 Bucket 回源配置](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/use-esa-to-accelerate-oss-resource-access)设置。

## 回源 HOST 怎么选

回源 HOST 是 ESA 向 OSS 请求文件时携带的 `Host` 请求头。我的选择依据是：**应用程序签发临时 URL 时，使用的是哪个域名。**

| 应用程序签发临时 URL 时使用的域名 | ESA 回源 HOST | OSS 侧配置 |
| --- | --- | --- |
| OSS 原始 Bucket 域名 | 跟随源站域名 | 使用对应的 OSS Bucket 外网域名回源 |
| 对应的 CDN 加速域名 | 跟随请求 HOST | 在 OSS Bucket 中绑定这个 CDN 域名 |

### 使用 OSS 原始域名签发，再替换为 CDN 域名

如果应用程序使用 OSS 原始域名签发临时 URL，然后把下载地址的域名替换成 CDN 域名，回源 HOST 应选择 **跟随源站域名**。

例如，源站为 `examplebucket.oss-cn-hangzhou.aliyuncs.com`，用户通过 `cdn.example.com` 下载，ESA 回源时携带的 HOST 仍然是 `examplebucket.oss-cn-hangzhou.aliyuncs.com`。

Cloudreve 的“下载 CDN”配置就是这里需要关注的例子：[官方文档](https://docs.cloudreve.org/zh/usage/storage/oss#使用自定义域名-endpoint)说明，配置后会替换文件下载 URL 中的域名和路径，上传和管理请求仍使用 OSS 官方 Endpoint。因此，不能只看浏览器里最终显示的 CDN 域名，还要看应用程序生成签名 URL 的方式。

### 直接使用 CDN 域名签发

如果应用程序在签发临时 URL 时使用的就是 CDN 域名，例如 `cdn.example.com`，回源 HOST 应选择 **跟随请求 HOST**，并在 OSS 对应 Bucket 的域名管理中绑定、验证 `cdn.example.com`。

此时用户请求的是 `cdn.example.com`，ESA 回源时也携带 `Host: cdn.example.com`，OSS 通过绑定关系识别对应的 Bucket。绑定方法可参考[通过自定义域名访问 OSS](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names)。

## 配置后仍然无法访问时

先检查应用程序的签发域名、ESA 实际回源的 HOST，以及 OSS 的域名绑定是否对应。不同签名版本和 SDK 对 HOST 的处理可能不同；如果签名包含 HOST，回源时必须保持一致，可参考[OSS URL V4 签名说明](https://help.aliyun.com/zh/oss/developer-reference/add-signatures-to-urls)。

另外，如果 ESA 中还配置了回源规则，要检查规则是否覆盖了 DNS 记录里的回源 HOST。按[自定义回源 Host 文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/origin-fetch-host)，回源规则中的配置优先级更高。
