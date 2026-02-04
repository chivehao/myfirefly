import type {MomentPost} from "@/types/moment.ts";

export async function parseRssWithUrls(feedUrls: string[]): Promise<MomentPost[]> {
    if (!feedUrls || !feedUrls.length) {
        return [];
    }
    let momentPosts: MomentPost[] = [];
    for (const url of feedUrls) {
        const feed = await parseRssWithUrl(url);
        momentPosts.push(...feed);
        console.debug('feed', feed, 'url', url);
    }
    return momentPosts;
}

export async function parseRssWithUrl(url: string): Promise<MomentPost[]> {
    // 先 fetch
    const res = await fetch(url);
    if (!res.ok) throw new Error("RSS 获取失败");
    const xmlText = await res.text(); // 转为字符串
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const items = Array.from(doc.querySelectorAll("item"));

    return items.map(item => {
        const title = item.querySelector("title")?.textContent?.trim() ?? "";
        const link = item.querySelector("link")?.textContent?.trim() ?? "";
        const description = item.querySelector("description")?.textContent?.trim() ?? "";
        const contentSnippet = item.querySelector("content\\:encoded")?.textContent?.trim();
        const pubDate = item.querySelector("pubDate")?.textContent?.trim() ?? new Date().toISOString();

        // 尝试将 pubDate 转为 ISO 格式
        let isoDate = new Date(pubDate).toISOString();

        return {
            title,
            link,
            description,
            contentSnippet,
            isoDate,
            authorName: title || '未知来源',
            sourceUrl: link || url
        } as MomentPost;
    });
}

