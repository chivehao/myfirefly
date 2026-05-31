---
title: "6GB显存的笔记本的AI编码方案实践"
description: "在RTX 4050 Laptop 6GB显存 + IntelliJ IDEA环境下，如何通过Ollama、Continue和微调后的Qwen模型，实现一个免费、私密、支持Agent模式的本地AI编程助手。"
published: 2026-05-31
image: 'api'
category: '经验总结'
author: "chivehao"
draft: false
tags: ["AI", "编码助手", "本地大模型", "Java", "Vue", "IntelliJ IDEA", "Ollama", "Continue", "MoE"]
---

# 描述

在RTX 4050 Laptop 6GB显存 + IntelliJ IDEA环境下，如何通过Ollama、Continue和微调后的Qwen模型，实现一个免费、私密、支持Agent模式的本地AI编程助手。

## 写在前面

作为一个日常写 Java 和 Vue 的开发人员，我其实很早就想引入 AI 辅助编码了。GitHub Copilot、JetBrains AI Assistant 这些确实好用，但每年大几百的订阅费，让囊中羞涩的我不免雪上加霜。

我的装备是 **RTX 4050 6GB 显存 + 32GB 内存** 的笔记本，一直用着 **IntelliJ IDEA 社区版**（有试用用试用，有开源证书用开源证书，大部分时间还是社区版）。

这篇文章，就是我折腾本地 AI 编码方案的最终总结。

目标是：**免费(高性价比) + 数据不出门 + 能在 IDEA 里顺畅使用 + 支持 Agent 模式自动读写文件**。如果你有类似的硬件和需求，可以参考一下。

## 方案的几个关键点

在尝试了好几种方案后，我总结出一个适合自己的工作流：**本地部署为主，云端调用为辅，并选择专门为工具调用微调过的模型**。

- **IDE 插件**：选 **Continue**。虽然它在 IDEA 上的体验不如 VS Code 完整，但它是目前能让我在社区版里免费、稳定连接本地模型的选择。关键在于，要找到能让它 Agent 模式正常工作的模型。
- **模型运行后端**：必须是 **Ollama**，在本地模型管理这块很方便了。
- **本地模型**：**hhao/qwen2.5-coder-tools:7b-q4_K_M**。这是整套方案的核心。原生的 Qwen2.5-Coder 7B 不支持工具调用，而这个社区微调版专门解决了这个问题，让 Agent 模式可以在 6GB 显存上跑起来。
- **云端备选**：**DeepSeek V4 Flash + Pro**。本地模型解决不了复杂 Bug 时，用它当个可靠的外援。

## 一步一步跟着做

### 第一步：优化 Ollama 环境

在启动 Ollama 前，先设置好环境变量。这对 **6GB 小显存** 非常关键，能有效防止运行大模型时内存溢出。

在 Windows PowerShell 中执行以下命令：

```powershell
$env:OLLAMA_FLASH_ATTENTION = "1"
$env:OLLAMA_KV_CACHE_TYPE = "q8_0"
$env:OLLAMA_MAX_LOADED_MODELS = "1"
$env:OLLAMA_GPU_OVERHEAD = "600"
```

然后重启 Ollama 服务：

```bash
ollama serve
```

### 第二步：拉取关键模型

直接拉取那个支持工具调用的 Qwen 模型：

```bash
ollama pull hhao/qwen2.5-coder-tools:7b-q4_K_M
```

为了支持代码库检索（@codebase 功能），最好再拉一个 embedding 模型：

```bash
ollama pull nomic-embed-text:latest
```

### 第三步：配置 Continue 插件

在 IDEA 插件市场安装 Continue。然后，打开它的配置文件（通常在 ~/.continue/config.yaml 或项目根目录下的 .continue/config.yaml），参考以下配置：

- 主力模型：Qwen-Coder-7B-Tools，使用 Ollama 提供，模型名为 hhao/qwen2.5-coder-tools:7b-q4_K_M，API 地址为 http://localhost:11434，角色包括聊天、编辑、应用和自动补全
- 辅助模型：Nomic Embed，同样使用 Ollama 提供，用于代码库检索的嵌入角色
- 实验性配置：指定默认 Agent 模型和补全模型都为主力 Qwen 模型
- 上下文长度：设置为 32768


## 效果怎么样？

配置完成后的日常使用大概是这样的：

**场景一：用 Agent 模式写代码**

在 Continue 聊天框里切换到 Agent 模式，然后像这样吩咐它：“帮我创建一个新的 Service 类，实现用户登录的逻辑。”

接下来，AI 会自动读取你当前项目的目录和代码风格，生成 Java 类文件，并尝试直接写入到项目里。整个过程你基本只需要确认和微调。

**场景二：用 Chat 模式理解项目**

当你想了解一个老项目的结构时，用 Chat 模式会更稳定。配合 @codebase 功能，可以直接提问：“@codebase 这个项目的权限校验是如何实现的？”

系统会先建立项目索引，然后基于对整个代码库的理解来回答，非常方便。

**场景三：云端兜底**

如果遇到本地模型反复尝试都无法修复的复杂 Bug，或者需要分析超长代码文件，可以临时切换模型。在 Continue 配置中加入 DeepSeek-V4-Flash 条目，记得替换你的 API Key。

## 踩过的一些坑

- **原生 Qwen 不支持工具调用**：最开始我用的 qwen2.5-coder:7b 在 Agent 模式下没法正常工作，后来换成社区微调版才解决。
- **IDEA 版的 Continue 功能有限**：它确实没有 VS Code 版那么强大，比如代码补全有时会失效。所以我的方案主要集中在利用它的 Agent 模式和聊天功能上。
- **llama3:8b 也不行**：实测 Ollama 上的原生 Llama 3 模型同样不支持工具调用，选模型时要特别注意。

## 写在最后

这套方案在我这台 6GB 显存的笔记本上运行得很稳定。它不一定适合所有人，但如果你和我一样：

- 用着 6GB-8GB 显存的显卡
- 习惯在 IntelliJ IDEA 里写代码
- 想拥有一个性价比高的、能自动读写文件的 AI 编码助手

那么，这套方案值得你花点时间试试。

最让我满意的一点是，~~整个运行都在本地，我的业务代码永远不会离开自己的电脑。这对于日常开发来说，是花钱也买不到的安全感。~~ 我的钱包表示它好受很多了。

希望这篇记录能帮到正在折腾的你。