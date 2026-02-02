import Parser from 'rss-parser';

const parser = new Parser();
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
