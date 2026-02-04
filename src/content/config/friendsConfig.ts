import type { FriendLink, FriendsPageConfig } from "../../types/config.ts";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 显示列数：2列或3列
	columns: 2,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "Ikaros Docs",
		imgurl: "https://docs.ikaros.run/img/favicon.ico",
		desc: "专注于ACGMN的内容管理系统(CMS)",
		siteurl: "https://docs.ikaros.run",
		tags: ["项目"],
		weight: 9999, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "博友圈",
		imgurl: "https://www.boyouquan.com/assets/images/sites/logo/logo-small.svg",
		desc: "博客人的朋友圈，将一个个散落在各处的孤岛连接成一片广袤无垠的新大陆！",
		siteurl: "https://www.boyouquan.com/home",
		tags: ["项目"],
		weight: 9998, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
		subInMoments: false, // 朋友圈禁用，rss格式问题，rss-parser组件无法解析他们的rss
		rssUrl: "https://www.boyouquan.com/feed.xml?sort=latest",
	},
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
	{
		title: "小游网",
		imgurl: "https://xiaoyou66.com/medias/avatar.jpg",
		desc: "关于, 小游网,二次元博客,个人网站,萌萌的网站",
		siteurl: "https://xiaoyou66.com",
		tags: ["博客"],
		weight: 8998, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
		subInMoments: true,
		rssUrl: "https://xiaoyou66.com/atom.xml",
	},
	{
		title: "拾三月",
		imgurl: "https://img.nw177.cn/blog/100.assets/avatar.webp",
		desc: "终不似，少年游！",
		siteurl: "https://blog.nw177.cn",
		tags: ["博客"],
		weight: 8997, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
		subInMoments: false,
		rssUrl: "https://blog.nw177.cn/feed.rss",
	},
	{
		title: "YuQi",
		imgurl: "https://yqamm.pages.dev/_astro/avatar.CAdfbZR8_w6po1.webp",
		desc: "欲买桂花同载酒，终不似少年游。",
		siteurl: "https://yqamm.pages.dev/",
		tags: ["博客"],
		weight: 8996, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
		subInMoments: true,
		rssUrl: "https://yqamm.pages.dev/rss.xml",
	},
];

// 获取启用的友链并按权重排序
export const getEnabledFriends = (): FriendLink[] => {
	return friendsConfig
		.filter((friend) => friend.enabled)
		.sort((a, b) => b.weight - a.weight);
};
