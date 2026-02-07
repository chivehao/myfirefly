// @ts-ignore
import type {AstroComponentFactory} from "astro/runtime/server";
import {z} from "astro/zod";
import { loadRawConfig } from "../utils/config-utils";

export const DiaryConfigSchema = z.object({
    enable: z.boolean(),
    displayInHome: z.boolean().optional().default(false), // 是否在首页显示
    utcTimeZone: z.number().int().min(-12).max(14).optional().default(8), // 日记列表页计算时间用的时区
    comment: z.boolean().optional().default(false), // 是否开启评论
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
