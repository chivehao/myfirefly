---
title: 给Astro添加朋友圈组件
published: 2026-02-04
description: '纪录下如何给Astro添加个解析友链的朋友圈组件。'
tags: ["Astro"]
image: 'https://imgbed.ikaros.run/file/posts/1770208136696_20260204202844411.png'
category: '经验总结'
---
:::note
朋友圈的RSS数据是每次构建时获取的，并不是最新的，如果需要最新的数据，你可能需要重新构建下。
:::
## 定义朋友圈文章类型
```typescript
// src/types/moment.ts
// 定义单条朋友圈动态的类型
export interface MomentPost {
    title: string;
    link: string;
    description: string;
    contentSnippet?: string;
    isoDate: string;
    authorName: string; // 来源站点名称
    sourceUrl: string;  // 来源站点链接
}
```

## 工具类
这里使用了一个rss解析库，使用如下命令添加。
```shell
pnpm add rss-parser
```
对应的工具类。
```typescript
// src/utils/get-feeds-utils.ts
import Parser from 'rss-parser';
import type {MomentPost} from "@/types/moment.ts";

const parser = new Parser();

export async function getAllPosts(feedUrls: string[]): Promise<MomentPost[]> {
    if (!feedUrls || !feedUrls.length) {
        return [];
    }
    // 使用 Promise.allSettled 防止单个 RSS 挂掉导致整个请求失败
    const feedPromises = feedUrls.map(async (url) => {
        try {
            const feed = await parser.parseURL(url);
            return feed.items.map(item => ({
                title: item.title || '无题',
                link: item.link || '#',
                description: item.description || item.contentSnippet || '',
                contentSnippet: item.contentSnippet?.slice(0, 100) + '...', // 截取摘要
                isoDate: item.isoDate || new Date().toISOString(),
                authorName: feed.title || '未知来源',
                sourceUrl: feed.link || url
            }));
        } catch (error) {
            console.error(`[RSS Error] 无法解析 ${url}:`, error);
            return [];
        }
    });

    const results = await Promise.all(feedPromises);

    // 3. 汇总、去重并按时间降序排序
    return results
        .flat()
        .sort((a, b) =>
            new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime()
        );
}

```

## 配置修改
你得有地方配置，建议直接在友情链接的类型定义里添加属性，找到你的友情链接类型定义。
```typescript
// src/types/config.ts
// 友链配置
export type FriendLink = {
    title: string; // 友链标题
    imgurl: string; // 头像图片URL
    desc: string; // 友链描述
    siteurl: string; // 友链地址
    tags?: string[]; // 标签数组
    weight: number; // 权重，数字越大排序越靠前
    enabled: boolean; // 是否启用
    subInMoments?: boolean; // 是否在朋友圈订阅
    rssUrl?: string; // rss链接地址
};
```

修改友情链接配置，加上新增的字段`subInMoments`和`rssUrl`。
```typescript
// src/content/config/friendsConfig.ts
// 友链配置
export const friendsConfig: FriendLink[] = [
    {
        title: "夏夜流萤",
        imgurl: "https://q1.qlogo.cn/g?b=qq&nk=7618557&s=640",
        desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
        siteurl: "https://blog.cuteleaf.cn",
        tags: ["博客"],
        weight: 8999, // 权重，数字越大排序越靠前
        enabled: true, // 是否启用
        subInMoments: true,
        rssUrl: "https://blog.cuteleaf.cn/rss.xml",
    },
];
```

## 页面

```text
// src/pages/moments.astro
---
import {getAllPosts} from '@utils/get-feeds-utils.ts';
import {getEnabledFriends} from "@/content/config";
import MainGridLayout from "@layouts/MainGridLayout.astro";
import MomentPanel from "@components/controls/MomentPanel.svelte";
import {i18n} from "@i18n/translation.ts";
import I18nKey from "@i18n/i18nKey.ts";
import type {MomentPost} from "@/types/moment.ts";

// 使用配置文件中的友链数据，按权重排序
const items = getEnabledFriends()
    .filter((f) => f && f.enabled && f.subInMoments && f.rssUrl);
const feedUrls = items.map(({rssUrl}) => rssUrl as string)
const posts: MomentPost[] = await getAllPosts(feedUrls);
---
<MainGridLayout title="朋友圈" description="朋友们最近的更新">
    <MomentPanel sortedPosts={posts} client:only="svelte" />
</MainGridLayout>
```

## 组件
```text
// src/components/controls/MomentPanel.svelte
<script lang="ts">
    import {onMount} from "svelte";

    import I18nKey from "@/i18n/i18nKey";
    import {i18n} from "@/i18n/translation";
    import Icon from "@iconify/svelte";
    import type {MomentPost} from "@/types/moment.ts";

    export let sortedPosts: MomentPost[] = [];

    interface Group {
        year: number;
        moments: MomentPost[];
    }

    let groups: Group[] = [];


    function formatDate(date: Date) {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${month}-${day}`;
    }

    function formatTag(tagList: string[]) {
        return tagList.map((t) => `#${t}`).join(" ");
    }

    async function reloadGroupFromSortedPosts() {
        let filteredPosts: MomentPost[] = sortedPosts;

        // 按发布时间倒序排序，确保不受置顶影响
        filteredPosts = filteredPosts
            .slice()
            .sort((a, b) => Date.parse(b.isoDate) - Date.parse(a.isoDate));

        const grouped = filteredPosts.reduce(
            (acc, post) => {
                const year = new Date(Date.parse(post.isoDate)).getFullYear();
                if (!acc[year]) {
                    acc[year] = [];
                }
                acc[year].push(post);
                return acc;
            },
            {} as Record<number, MomentPost[]>,
        );

        const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
            year: Number.parseInt(yearStr, 10),
            moments: grouped[Number.parseInt(yearStr, 10)],
        }));

        groupedPostsArray.sort((a, b) => b.year - a.year);

        groups = groupedPostsArray;
    }

    onMount(reloadGroupFromSortedPosts);
</script>

<div class="card-base px-8 py-6">
    <!-- 页面标题和描述 -->
    <div class="mb-4">
        <div class="flex items-center gap-3 mb-3">
            <div
                    class="h-8 w-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white dark:text-black/70"
            >
                <Icon icon="material-symbols:group" class="text-[1.5rem]"/>
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                朋友圈
            </h1>
        </div>
        朋友们最近的更新
    </div>

    {#each groups as group}
        <div>
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.year}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
              -outline-offset-[2px] z-50 outline-3"
                    ></div>
                </div>
                <div
                        class="hidden md:block md:w-[10%] text-left text-sm transition
                        whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                >
                    <div class="text-left">
                        <strong>博文作者</strong>
                    </div>

                </div>
                <div class="w-[60%] md:w-[70%] transition text-left text-50">
                    {group.moments.length} {i18n(group.moments.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                </div>
            </div>

            {#each group.moments as moment}
                <a
                        href={moment.link}
                        aria-label={moment.isoDate}
                        target="_blank"
                        class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDate(new Date(Date.parse(moment.isoDate)))}
                        </div>

                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                    class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                   bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                   outline outline-4 z-50
                   outline-[var(--card-bg)]
                   group-hover:outline-[var(--btn-plain-bg-hover)]
                   group-active:outline-[var(--btn-plain-bg-active)]"
                            ></div>
                        </div>

                        <!-- post author -->
                        <div
                                class="hidden md:block md:w-[10%] text-left text-sm transition
                        whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            [{moment.authorName}]
                        </div>

                        <!-- post title -->
                        <div
                                class="w-[70%] md:max-w-[60%] md:w-[50%] text-left font-bold
                 group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                 text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                        >
                            {moment.title}
                        </div>

                        <!-- post Desc -->
                        <div
                                class="hidden md:block md:w-[10%] text-left text-sm transition
                 whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            {moment.description}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
    
</div>
```
## 本地测试
```shell
pnpm dev
```
进入路径`/moments/`访问你的朋友圈，如果正常应该是如图所示，具体文章和作者可能不同，根据你配置的友情链接来。
![](https://imgbed.ikaros.run/file/posts/1770208136696_20260204202844411.png)
点击你感兴趣的朋友们的文章，能跳转到对应的文章链接。
