// @ts-ignore
import type {AstroComponentFactory} from "astro/runtime/server";
import {z} from "astro/zod";
import { loadRawConfig } from "../utils/config-utils"

export const DiaryConfigSchema = z.object({
    enable: z.boolean(),
    displayInHome: z.boolean().optional().default(false), // 是否在首页显示
    utcTimeZone: z.number().int().min(-12).max(14).optional().default(8), // 日记列表页计算时间用的时区
    comment: z.boolean().optional().default(false), // 是否开启评论
    add2Rss: z.boolean().optional().default(false), // 是否添加到rss里
    displayInStatic: z.boolean().optional().default(false), // 是否在站点统计展示
})
export type DiaryConfig = z.infer<typeof DiaryConfigSchema>;
export function loadDiaryConfig(): DiaryConfig {
    // @ts-ignore
    const rawDiaryConfig = loadRawConfig()?.diaryConfig ?? {};
    return DiaryConfigSchema.parse(rawDiaryConfig);
}

export type DiaryItem = {
    id: number | string;
    content: string | AstroComponentFactory;
    date: string;
}

// 默认的日记数据，只有在没有任何日记的时候加载。
export const diaryData: DiaryItem[] = [
    {
        id: 1,
        content:
            "这是很久以前的第一条默认数据，只有在没有任何日记的时候加载。",
        date: "2025-01-10",
    },
    {
        id: 2,
        content:
            "这是以前的第二条默认数据，只有在没有任何日记的时候加载。",
        date: "2026-01-19",
    },
];

// 获取日记统计数据
export const getDiaryStats = () => {
    const total = diaryData.length;
    return {
        total,
    };
};

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
    const sortedData = diaryData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (limit && limit > 0) {
        return sortedData.slice(0, limit);
    }

    return sortedData;
};

