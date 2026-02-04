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