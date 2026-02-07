import { assert, expect, test } from 'vitest';
import {formatTimeAgoStr, parseDateFromPath, parseDateStrFromPath} from "../../src/utils/date-utils.ts";
import {i18n} from "@i18n/translation.ts";
import I18nKey from "@i18n/i18nKey.ts";
import {diaryConfig, siteConfig} from "../../src/content/config";
import {format} from "sharp";

test('parseDateStrFromPath', () => {
    expect(
        parseDateStrFromPath('src/content/diaries/2026-02-06T12-15-20.md')
    ).toBe('2026-02-06T12:15:20');
});

test('parseDateFromPath', () => {
    let actual = parseDateFromPath('/diaries/2026-02-06T12-15-20.md');
    expect(actual).toStrictEqual(new Date('2026-02-06T12:15:20'));
})

test('formatTimeAgoStr', () => {
    // 拿到当前的时间
    const now = new Date();
    const agoStr = formatTimeAgoStr("src/content/diaries/2026-02-07--14-05-52.md");
    console.debug("formatTimeAgoStr agoStr", agoStr);
})