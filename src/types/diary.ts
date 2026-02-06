// @ts-ignore
import type {AstroComponentFactory} from "astro/runtime/server";

export type DiaryConfig = {
    enable: boolean;
    displayInHome?: boolean; // 是否在首页显示
    utcTimeZone: number;
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

