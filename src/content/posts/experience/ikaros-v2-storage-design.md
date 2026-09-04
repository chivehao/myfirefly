---
title: Ikaros v2 存储架构设计
published: 2026-09-04
description: '从业务的角度，总结下ikaros v2的存储架构设计。'
tags: ["ikaros"]
image: 'api'
category: '经验总结'
---

# Ikaros V2 存储架构

本文整理 Ikaros V2 当前的存储架构设计，目标是明确：

* 元数据与实际文件如何分离；
* Attachment / Blob / Placement 各自负责什么；
* HOT / WARM / COLD / ARCHIVE 如何分层；
* Local Filesystem / NAS / S3 / OSS / COS 如何接入；
* Storage Provider 与 Delivery Provider 为什么要分开；
* CDN、边缘加速、缓存、归档恢复如何协同。

---

## 1. 总体架构

Ikaros V2 的核心原则是：

> PostgreSQL 管理“文件是什么、在哪里、什么状态”，Storage Provider 管理真正的文件字节。

业务层不直接依赖本地路径、Bucket、Object Key 或具体存储厂商地址。

整体结构如下：

```text
                           Ikaros
                             │
                    Resource / Media
                             │
                      attachment_id
                             ▼
                       Attachment
                   业务层的“文件身份”
                             │
                          blob_id
                             ▼
                           Blob
                  不可变内容 + Hash + Size
                             │
                       1 : N Placement
                             ▼
                   Blob Placement / Replica
                    │        │        │
                    ▼        ▼        ▼
                  HOT       COLD    ARCHIVE
                    │        │        │
                    └────────┼────────┘
                             ▼
                     Storage Provider
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          Local FS / NAS   S3兼容       云对象存储
                           OSS/COS/etc.

PostgreSQL
 ├── storage.attachment
 ├── storage.blob
 ├── storage.blob_placement
 ├── storage.storage_provider
 ├── Storage Policy
 ├── Restore / Delivery Lease
 └── 只保存元数据，不保存大文件字节
```

---

## 2. Attachment / Blob / Placement

### 2.1 Attachment

Attachment 是业务层看到的“文件”。

例如：

```text
《孤独摇滚》第 01 集
├── 正片.mkv        -> Attachment A
├── 中文字幕.ass    -> Attachment B
└── 封面.jpg        -> Attachment C
```

Attachment 可以包含：

* 文件名；
* MIME Type；
* Usage Kind；
* Source；
* 生命周期；
* 数据敏感等级；
* 所属 Resource / Media 的关系。

但 Attachment 不应该保存：

```text
/data/anime/xxx.mkv
```

或者：

```text
bucket-name/anime/xxx.mkv
```

这些都属于物理存储细节。

---

### 2.2 Blob

Blob 表示真正的、不可变的一组字节。

例如：

```text
Attachment A
     │
     ▼
Blob
sha256 = abcdef...
size   = 1.42 GB
```

Blob 主要负责：

* 内容摘要；
* 文件大小；
* 内容身份；
* 完整性校验；
* 去重。

多个 Attachment 可以引用同一个 Blob。

例如两个 Resource 实际引用的是同一份视频：

```text
Attachment A ─┐
              ├──> Blob abcdef
Attachment B ─┘
```

这样可以避免重复存储相同内容。

---

### 2.3 Blob Placement

Placement 表示：

> 某个 Blob 的一个物理副本，目前具体存放在哪里。

例如：

```text
Blob abcdef
├── Placement #1 -> NAS       / HOT
├── Placement #2 -> OSS       / COLD
└── Placement #3 -> OSS归档   / ARCHIVE
```

因此：

```text
Attachment
    ↓
Blob
    ↓
Placement
    ↓
Storage Provider
```

业务身份与实际存储位置完全解耦。

以后即使：

* NAS 换成 OSS；
* 腾讯 COS 换成阿里云 OSS；
* HOT 降级到 ARCHIVE；
* 某个 Provider 下线；

Attachment 和 Blob 的业务身份都不需要变化。

---

## 3. 持久化 Storage Tier

Ikaros V2 当前定义四类持久化存储层：

```text
HOT
WARM
COLD
ARCHIVE
```

典型用途：

| Tier    | 典型介质                 | 使用场景      |
| ------- | -------------------- | --------- |
| HOT     | SSD / NAS / OSS 标准存储 | 高频播放、近期内容 |
| WARM    | HDD / OSS 低频         | 偶尔访问      |
| COLD    | 冷存储                  | 很少访问      |
| ARCHIVE | 深度冷归档                | 长期保存      |

一个 Blob 可以同时拥有多个 Placement。

例如：

```text
Blob: VCB-S 1080p Source

ARCHIVE
└── 阿里云深度冷归档
    └── 永久基础副本

WARM
└── 阿里云低频 / NAS
    └── 最近恢复出来的工作集
```

---

## 4. Cache 不是 Storage Tier

需要特别区分：

```text
HOT Storage
≠
Server Cache
```

Cache 是可淘汰、可重建的临时数据。

例如：

```text
Blob
├── Persistent Placement
│   └── OSS / ARCHIVE
│
├── Server Cache
│   └── 服务器 SSD
│
└── Client Cache
    └── 手机 / PC 本地缓存
```

Server Cache 删除后不能导致数据永久丢失。

因此：

```text
HOT / WARM / COLD / ARCHIVE
```

属于持久化 Storage Tier。

而：

```text
Server Cache
Client Cache
Download Cache
```

属于访问加速层。

---

## 5. Storage Provider

Storage Provider 负责：

> 真正保存 Blob 字节。

设计上可以支持：

```text
Storage Provider
├── Local Filesystem
├── NAS
├── S3
├── S3 Compatible
├── 阿里云 OSS
├── 腾讯云 COS
├── MinIO
├── Cloudflare R2
└── 其他对象存储
```

业务层不需要知道具体 Provider 类型。

可以统一抽象成：

```text
Storage Port
     │
     ├── LocalFilesystemAdapter
     ├── NASAdapter
     ├── S3Adapter
     ├── OSSAdapter
     └── COSAdapter
```

---

## 6. Storage Provider 与 Delivery Provider 分离

Ikaros V2 中，存储与内容分发是两个不同问题。

### Storage Provider

回答：

> 文件存在哪里？

例如：

```text
Aliyun OSS
Tencent COS
NAS
Local Filesystem
```

---

### Delivery Provider

回答：

> 文件怎么交付给客户端？

例如：

```text
DIRECT
CDN
SERVER_PROXY
```

整体结构：

```text
Storage Provider
       │
       │ 持久化 Blob
       ▼
      Blob
       │
       │ Availability Resolution
       ▼
Delivery Provider
       │
       ├── DIRECT
       ├── CDN
       └── SERVER_PROXY
       │
       ▼
      Client
```

---

## 7. DIRECT / CDN / SERVER_PROXY

### DIRECT

Ikaros 完成鉴权后，签发一个短期访问 URL。

例如：

```text
App
 │
 ▼
Ikaros
 │
 │ Auth / Permission
 ▼
Signed URL
 │
 ▼
OSS / COS
```

媒体流量不会经过 Ikaros Server。

适合：

* OSS；
* COS；
* S3；
* R2；
* 支持 Presigned URL 的对象存储。

---

### CDN

例如：

```text
App
 │
 ▼
Ikaros
 │
 │ 鉴权
 ▼
Delivery Grant
 │
 ▼
CDN / 边缘加速
 │
 ▼
OSS
```

这样可以把：

```text
Storage
```

和：

```text
Distribution
```

完全解耦。

例如：

```text
Storage Provider
=
阿里云 OSS

Delivery Provider
=
阿里云边缘加速 / CDN
```

---

### SERVER_PROXY

兼容部分无法直接访问底层 Storage 的场景：

```text
Client
  │
  ▼
Ikaros Server
  │
  ▼
Storage Provider
```

但对于大规模视频媒体库，不应该默认依赖这种模式，否则 Ikaros Server 的公网带宽会成为瓶颈。

---

## 8. Archive Restore

Archive 不应该简单理解为：

```text
归档
↓
恢复
↓
删除归档
```

Ikaros V2 更适合使用：

```text
             Archive Base
                  │
                  ▼
               ARCHIVE
                  │
            Restore Request
                  │
                  ▼
            临时恢复可读
                  │
          ┌───────┴───────┐
          ▼               ▼
       直接读取          Promotion
                           │
                           ▼
                    HOT/WARM/COLD
```

需要区分两个动作：

### Restore

Restore 表示：

> 请求已有 Archive Placement 临时恢复为可读取状态。

Restore 不一定创建新的 Ikaros Placement。

---

### Promotion

Promotion 表示：

> 把恢复出来的数据正式复制到 HOT / WARM / COLD。

例如：

```text
ARCHIVE
  │
  │ Restore
  ▼
临时可读
  │
  │ 用户持续播放
  ▼
Promotion
  │
  ▼
WARM
```

Promotion 完成后：

```text
ARCHIVE Base
```

仍然继续保留。

---

## 9. 一个适合大型媒体库的实际部署

例如一个约 50 TB 的动漫媒体库，可以设计为：

```text
                    Ikaros
                       │
                       ▼
                  PostgreSQL
              元数据 / Blob / Placement
                       │
                       ▼
                Storage Policy
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
       ARCHIVE                     WARM
          │                         │
          ▼                         ▼
阿里云 OSS 深度冷归档        OSS 标准 / 低频
   50 TB 原始库              当前活跃工作集
          │                         │
          └────────────┬────────────┘
                       ▼
                Delivery Provider
                       │
                       ▼
                 CDN / 边缘加速
                       │
                       ▼
                     App
```

可以进一步增加本地 SSD：

```text
Server SSD
   │
   ▼
Server Cache
```

最终变成：

```text
               +-------------------+
               |      Client       |
               +---------+---------+
                         |
                         v
                  Delivery Provider
                  CDN / Edge / Direct
                         |
                         v
+--------------------------------------------------+
|                Storage Providers                 |
|                                                  |
| HOT / WARM              COLD / ARCHIVE           |
| OSS / NAS               Deep Archive             |
+----------------------+---------------------------+
                       |
                       v
                    Blob
                       |
                       v
                  Attachment
                       |
                       v
                    Resource
```

---

## 10. 推荐的大容量媒体存储策略

对于 VCB、BDRip、原盘等不可重建或重建成本极高的源文件：

```text
Original Source
    ↓
ARCHIVE
```

例如：

```text
VCB Source MKV
    ↓
阿里云深度冷归档
```

作为长期 Base。

而经常播放的内容：

```text
Frequently Played 1080p
    ↓
HOT / WARM
```

例如：

```text
OSS 标准存储
OSS 低频
NAS
```

缩略图、字幕、Manifest 等小文件：

```text
HOT
```

因为这类文件容量很小，但请求频率高。

最终可以形成：

```text
Archive Base
    │
    │ Restore
    ▼
Working Set
    │
    │ 热度下降
    ▼
Evict
```

也就是说：

> 大媒体库不需要 50 TB 全部保持在线，只需要让最近活跃的几百 GB / 几 TB 保持可直接访问。

---

## 11. 当前实现状态

需要区分：

### 已确定的 V2 架构

已经明确包含：

* Attachment；
* Blob；
* Blob Placement；
* Storage Provider；
* HOT / WARM / COLD / ARCHIVE；
* Storage Policy；
* Restore；
* Promotion；
* Delivery Provider；
* CDN；
* Direct Delivery；
* Server Proxy；
* Server Cache；
* Blob GC；
* 多副本与迁移。

---

### 当前代码实现

目前主仓库已经可以看到 Local Filesystem 相关实现，例如：

```text
LocalStorageContentReader
LocalStorageContentDeleter
LocalStorageRestoreExecutor
```

因此当前可以认为：

```text
Architecture
    已基本确定

Local Filesystem Provider
    已开始实现

S3 / OSS / COS Provider
    Provider Contract 已预留
    Adapter 仍需要继续实现

CDN / Edge Delivery
    架构与契约已设计
    后续继续实现
```

---

## 12. 一个比较推荐的云端方案

对于个人或小型自托管 Ikaros 实例，可以考虑：

```text
Storage Provider
    ↓
阿里云 OSS / 腾讯 COS

ARCHIVE
    ↓
深度冷归档

HOT / WARM
    ↓
标准 / 低频对象存储

Delivery Provider
    ↓
边缘加速 / CDN

Traffic
    ↓
流量包
```

即：

```text
OSS / COS
负责“存”

CDN / 边缘加速
负责“传”

Ikaros
负责“管”
```

Ikaros Server 本身只承担：

* 用户鉴权；
* Permission；
* Blob Availability；
* Storage Policy；
* Delivery Grant；
* Restore；
* Promotion；
* Placement 管理；
* 元数据管理。

尽量避免承担大规模媒体流量转发。

---

## 13. 核心原则总结

Ikaros V2 存储架构可以总结成：

```text
Resource
   ↓
Attachment
   ↓
Blob
   ↓
Placement
   ↓
Storage Provider
```

同时：

```text
Storage Provider
负责持久化

Delivery Provider
负责分发

Cache
负责加速

Archive
负责低成本长期保存

PostgreSQL
负责管理全部元数据和状态
```

最终目标是：

> 业务层永远只依赖逻辑身份，不依赖物理存储位置。

这样未来无论是：

```text
Local FS
→ NAS
→ MinIO
→ 阿里云 OSS
→ 腾讯 COS
→ R2
```

还是：

```text
HOT
→ WARM
→ COLD
→ ARCHIVE
```

都可以在不影响 Resource / Attachment 业务模型的前提下完成迁移、分层和扩展。
