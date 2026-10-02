---
title: Ikaros v2 存储架构设计
published: 2026-09-04
updated: 2026-10-03
description: '从业务场景梳理 Ikaros v2 中资源、附件、Blob 与 Placement 的层级关系，以及附件与 Blob 的多对多关联、文件元数据、去重与归档恢复的职责。'
tags: ["ikaros"]
image: 'api'
category: '经验总结'
---

# Ikaros V2 存储架构

本文整理 Ikaros V2 当前的存储架构设计，目标是明确：

* 元数据与实际文件如何分离；
* Resource / Attachment / Blob / Placement 各自负责什么；
* 业务层级关系与实际关联模型分别对应哪些场景；
* 文件元数据如何保存，附件之间的关系如何描述；
* HOT / WARM / COLD / ARCHIVE 如何分层；
* Local Filesystem / NAS / S3 / OSS / COS 如何接入；
* Storage Provider 与 Delivery Provider 为什么要分开；
* CDN、边缘加速、缓存、归档恢复如何协同。

---

## 1. 总体架构

Ikaros V2 的核心原则是：

> PostgreSQL 管理“文件是什么、在哪里、什么状态”，Storage Provider 管理真正的文件字节。

业务层不直接依赖本地路径、Bucket、Object Key 或具体存储厂商地址。

从单个资源或附件的业务视角向下看，可以按以下层级理解存储架构：

```text
Resource（资源） 1 : N Attachment（附件）
Attachment      1 : N Blob
Blob            1 : N Placement
```

每个关系都有明确的业务场景：

| 关系 | 业务场景 | 实际关联模型 |
| --- | --- | --- |
| Resource → Attachment | 同一番剧剧集的资源关联不同压制组提供的附件 | 一对多 |
| Attachment ↔ Blob | 同一附件包含不同码率的文件表示；不同附件通过 SHA-256 去重复用相同 Blob | 多对多 |
| Blob → Placement | 归档原始数据与解冻出来的临时数据同时存在 | 一对多 |

Attachment → Blob 从单个附件的业务逻辑来看是一对多；结合全局去重，一个 Blob 又可以被多个 Attachment 引用，因此实际关系应建模为多对多，通过关联表连接。

关系基数表示模型允许的关联数量，并不要求每条数据都必须有多个关联。一个资源暂时只有一个附件、一个附件只有原始 Blob，或一个 Blob 只有一个 Placement，都是合法场景；这些实例呈现一对一，不代表关系应设计为一对一。

整体结构如下：

```text
                           Ikaros
                             │
                    Resource / Media
                             │
                      1 : N Attachment
                             ▼
                       Attachment
                   业务附件的逻辑身份
                             │
                        M : N Blob
                             ▼
                           Blob
                  不可变内容 + SHA-256 + Size
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
 ├── Attachment / Blob 关联表（多对多）
 ├── 附件间的业务关系
 ├── storage.blob
 ├── storage.blob_metadata（文件元数据）
 ├── storage.blob_placement
 ├── storage.storage_provider
 ├── Storage Policy
 ├── Restore / Delivery Lease
 └── 只保存元数据，不保存大文件字节
```

---

## 2. Resource / Attachment / Blob / Placement

### 2.1 Attachment

Resource 是业务层的资源，可以绑定某个番剧剧集；Attachment 是资源关联的业务附件，表示一份具有来源和用途的内容。同一个 Resource 可以关联多个 Attachment。

例如，同一剧集可能有不同压制组提供的完全不同的附件：

```text
Resource：绑定《孤独摇滚》第 01 集
├── 压制组 A 的正片 -> Attachment A
├── 压制组 B 的正片 -> Attachment B
├── 中文字幕       -> Attachment C
└── 封面           -> Attachment D
```

Attachment 本身也可以关联多个 Blob。从业务身份上看，一份视频转成不同码率后，仍然是同一个逻辑文件，应归属于同一个附件；转码改变了文件字节和哈希，每个转码文件分别对应一个 Blob：

```text
Attachment A：压制组 A 的正片
├── 原始视频       -> Blob A1
├── 高码率转码文件 -> Blob A2
└── 低码率转码文件 -> Blob A3
```

因此，不同压制组提供的附件在 Attachment 层区分，同一附件的不同码率文件在 Blob 层区分。

转码应扩展原有 Attachment 关联的 Blob，不能仅因哈希改变，就创建多个 Attachment 来关联这些转码文件。

不同逻辑文件之间的业务关系，则通过附件之间的关系描述。例如：

```text
视频 Attachment ── 字幕关系 ──> 字幕 Attachment
歌曲 Attachment ── 歌词关系 ──> 歌词 Attachment
```

视频和字幕、歌曲和歌词分别拥有独立的 Attachment，各自关联自己的 Blob。附件间的关系描述内容如何配合使用；Attachment 与 Blob 的关联描述一个逻辑文件有哪些文件表示。

Attachment 可以包含：

* 业务名称、原始文件名；
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

同一附件下的不同码率视频虽然表达同一段内容，但文件字节不同，因此对应不同 Blob。反过来，把同一个文件复制到另一个存储位置，字节没有改变，就仍然属于同一个 Blob。

例如：

```text
Attachment A
├── Blob A1：原始视频
│   sha256 = abcdef...
│   size   = 1.42 GB
│   blob_metadata：原始视频的时长、分辨率、码率、编码格式等
└── Blob A2：低码率转码文件
    sha256 = 123456...
    size   = 420 MB
    blob_metadata：该转码文件的时长、分辨率、码率、编码格式等
```

Blob 主要负责：

* 用于全局去重的 SHA-256 内容摘要；
* 文件大小；
* 内容身份；
* 完整性校验；
* 去重。

文件元数据归属于具体 Blob，可以独立存入 `blob_metadata` 表，通过 `blob_id` 关联对应 Blob。`blob` 表保存 SHA-256、文件大小等内容身份与去重所需的信息，`blob_metadata` 表承载文件描述信息，例如：

* MIME Type 等通用文件元数据；
* 视频的时长、分辨率、码率、编码格式等视频元数据；
* 音频的时长、采样率、声道、编码格式等音频元数据。

不同转码文件的码率、大小等信息可能不同，不应作为整个 Attachment 唯一的一份文件元数据。Placement 也不需要为同一 Blob 的每份副本重复保存这些信息。

一个 Attachment 可以关联多个 Blob；全局去重时，多个 Attachment 也可以复用同一个 Blob。因此，Attachment 与 Blob 实际上是多对多关系。

例如，Attachment A 有原始视频和低码率转码文件，而另一个资源的 Attachment B 引用了与原始视频字节完全相同的文件：

```text
Attachment A ──┬──> Blob abcdef（原始视频）<── Attachment B
               └──> Blob 123456（低码率转码文件）
```

通过 SHA-256 去重后，A 与 B 复用 Blob abcdef，同时 A 还关联自己的转码 Blob。数据库应使用 Attachment / Blob 关联表表达这些关系，不能只在一侧保存单个外键，也不能让一个 Blob 只能归属一个 Attachment。

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

一对多也可以发生在同一个对象存储中。例如，一份归档数据解冻后，原始数据和临时数据同时存在，临时数据作为一个单独的 Placement 管理：

```text
Blob abcdef：SHA-256 与文件元数据不变
├── Placement #1 -> 对象存储中的归档原始数据
└── Placement #2 -> 对象存储中解冻出来的临时数据
```

这两份数据的 SHA-256 和文件元数据完全相同，属于同一个 Blob，但存储副本、可读状态和生命周期不同，因此对应两个 Placement。Placement 记录位置和副本状态，文件内容摘要与媒体元数据仍由 Blob 统一管理。

因此：

```text
Attachment
    ↕ M : N
Blob
    ↓ 1 : N
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
            临时 Placement 可读
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

> 请求解冻归档数据，并将解冻出来的临时数据作为独立的 Placement 管理。

在当前模型中，归档原始数据与解冻出来的临时数据是同一个 Blob 的两个 Placement。解冻不会改变文件字节、SHA-256 或文件元数据，因此不需要新建 Blob。

归档 Placement 继续保留，临时 Placement 记录恢复后的可读状态和有效期。临时数据到期后，应同步更新对应 Placement 的状态，不影响归档基础副本。

---

### Promotion

Promotion 表示：

> 把恢复出来的数据正式复制到 HOT / WARM / COLD，形成可长期保留的 Placement。

Restore 产生临时 Placement，Promotion 形成持久化 Placement，两者都属于原来的 Blob。是否长期保留副本，由存储策略决定。

例如：

```text
ARCHIVE
  │
  │ Restore
  ▼
临时 Placement 可读
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
* 附件间的业务关系；
* Attachment / Blob 多对多关联；
* Blob；
* Blob Metadata（可独立存入 `blob_metadata` 表）；
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
   ↓ 1 : N：不同压制组等业务附件
Attachment
   ↕ M : N：不同文件表示，并允许全局去重复用
Blob
   ↓ 1 : N：归档、解冻临时数据等存储副本
Placement
   ↓
Storage Provider
```

这三个层级关系都对应实际需求：Resource 聚合业务附件，Attachment 聚合同一逻辑文件的不同文件表示，Blob 保存具体字节的内容身份，Placement 管理该文件的不同存储副本。

Attachment 与 Blob 在单个附件的业务视角下是一对多，结合 SHA-256 全局去重后，实际模型是多对多。转码产生新的 Blob，仍关联原来的 Attachment；字节相同的文件则复用已有 Blob。

具体文件的元数据可以由 `blob_metadata` 表保存，并关联到 Blob。视频与字幕、歌曲与歌词等不同逻辑文件之间的关系，由附件之间的业务关系描述。

当前只关联一个对象的实例可以按一对一使用；需要不同压制组、不同码率、去重复用或解冻副本时，模型也能容纳相应关联，而不必改变各层的职责。

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
