import {expect, test} from "vitest";
import {loadDiaryConfig} from "../../src/types/diary";

test('loadDiaryConfig', () => {
    expect(
        loadDiaryConfig().utcTimeZone
    ).toBe(8);
});
