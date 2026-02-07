import {siteConfig} from "../content/config";
import {i18n} from "@i18n/translation.ts";
import I18nKey from "@i18n/i18nKey.ts";
import {loadDiaryConfig} from "@/types/diary.ts";

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().substring(0, 10);
}

// 国际化日期格式化函数
export function formatDateI18n(
    dateInput: Date | string,
    includeTime?: boolean,
): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const lang = siteConfig.lang || "en";

    // 根据语言设置不同的日期格式
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
        options.second = "2-digit";
    }

    // 如果配置了时区，则将其用于格式化（IANA 时区字符串）
    if (siteConfig.timezone) {
        (options as Intl.DateTimeFormatOptions).timeZone = siteConfig.timezone;
    }

    // 语言代码映射
    const localeMap: Record<string, string> = {
        zh_CN: "zh-CN",
        zh_TW: "zh-TW",
        en: "en-US",
        ja: "ja-JP",
        ko: "ko-KR",
        es: "es-ES",
        th: "th-TH",
        vi: "vi-VN",
        tr: "tr-TR",
        id: "id-ID",
        fr: "fr-FR",
        de: "de-DE",
        ru: "ru-RU",
        ar: "ar-SA",
    };

    const locale = localeMap[lang] || "en-US";
    return includeTime
        ? date.toLocaleString(locale, options)
        : date.toLocaleDateString(locale, options);
}

// 国际化日期时间格式化函数（带时分秒）
export function formatDateI18nWithTime(dateInput: Date | string): string {
    return formatDateI18n(dateInput, true);
}

export function parseFileNameFromPath(path: string): string {
    if (!path || path === ""
        || path.indexOf("/") < 0
        || path.lastIndexOf("/") < 1
        || path.lastIndexOf(".") < 0) {
        return path;
    }
    return path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
}

export function displayDate(path:string): string {
    const fileName = parseFileNameFromPath(path);
    return fileName ? fileName : path;
}

/**
 * 从路径解析文件名
 *
 * 文件名格式：YYYY-MM-DD-HH-mm-ss
 *
 * 例如: src/content/diaries/2026-02-07--14-05-52.md => 2026-02-07T14:05:52
 */
export function parseDateStrFromPath(path: string): string {
    if (!path || path === "" || path.indexOf("--") < 0) {
        return path;
    }
    const name = parseFileNameFromPath(path);
    // 2026-02-07T12-00-00
    const base = name.replace(/\.\w+$/, "")
    return base.replace(
        /--(\d{2})-(\d{2})-(\d{2})/,
        "T$1:$2:$3"
    )
}

/**
 * 接收字符串格式的日期，转化程对应的日期对象。
 *
 * 格式：YYYY-MM-DD-HH-mm-ss
 */
export function parseDateFromPath(path: string): Date {
    const dateStr = parseDateStrFromPath(path);
    return new Date(dateStr);
}

/**
 * 时间格式化函数，返回距离现在多久的字符串。
  */
export function formatTimeAgoStr(dateString: string): string {
    // 获取日期
    const date = parseDateFromPath(dateString);

    var TG = 8;
    const diaryConfig = loadDiaryConfig();
    if (diaryConfig.utcTimeZone >= -12 && diaryConfig.utcTimeZone <= 12)
        TG = diaryConfig.utcTimeZone;
    const timeGap = TG;

    const now = new Date();
    let diffInMinutes = 0;
    if (import.meta.env.PROD) {
        diffInMinutes = Math.floor(
            (now.getTime() + timeGap * 60 * 60 * 1000  - date.getTime()) / (1000 * 60),
        );
    } else {
        diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60),
        );
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes}${i18n(I18nKey.diaryMinutesAgo)}`;
    }
    if (diffInMinutes < 1440) {
        // 24小时
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}${i18n(I18nKey.diaryHoursAgo)}`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}${i18n(I18nKey.diaryDaysAgo)}`;
}
