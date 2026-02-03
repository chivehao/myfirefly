import type { FriendLink, FriendsPageConfig } from "../types/config";

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
		subInMoments: true,
		rssUrl: "https://www.boyouquan.com/feed.xml?sort=latest",
	},
	{
		title: "夏夜流萤",
		imgurl: "https://q1.qlogo.cn/g?b=qq&nk=7618557&s=640",
		desc: "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
		siteurl: "https://blog.cuteleaf.cn",
		tags: ["博客"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
		subInMoments: true,
		rssUrl: "https://blog.cuteleaf.cn/rss.xml",
	},
];

// 获取启用的友链并按权重排序
export const getEnabledFriends = (): FriendLink[] => {
	return friendsConfig
		.filter((friend) => friend.enabled)
		.sort((a, b) => b.weight - a.weight);
};
