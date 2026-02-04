import {
	LinkPreset,
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../../types/config.ts";
import { siteConfig } from "./siteConfig.ts";

// 根据页面开关动态生成导航栏配置
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: (NavBarLink | LinkPreset)[] = [
		// 主页
		LinkPreset.Home,

		// 归档
		LinkPreset.Archive,
	];

	// 自定义导航栏链接,并且支持多级菜单
	// links.push({
	// 	name: "链接",
	// 	url: "/links/",
	// 	icon: "material-symbols:link",
	//
	// 	// 子菜单
	// 	children: [
	// 		{
	// 			name: "GitHub",
	// 			url: "https://github.com/chivehao",
	// 			external: true,
	// 			icon: "fa6-brands:github",
	// 		},
	// 		{
	// 			name: "Bilibili",
	// 			url: "https://space.bilibili.com/3546953776368460",
	// 			external: true,
	// 			icon: "fa6-brands:bilibili",
	// 		},
	// 	],
	// });

	// 友链
	links.push(LinkPreset.Friends);

	// 朋友圈
	links.push(LinkPreset.Moments);

	// 根据配置决定是否添加留言板，在siteConfig关闭pages.guestbook时导航栏不显示留言板
	if (siteConfig.pages.guestbook) {
		links.push(LinkPreset.Guestbook);
	}

	// 关于页面
	links.push(LinkPreset.About);

	// 根据配置决定是否添加番组计划，在siteConfig关闭pages.bangumi时导航栏不显示番组计划
	links.push(...(siteConfig.pages.bangumi ? [LinkPreset.Bangumi] : []));

	// 关于及其子菜单
	links.push({
		name: "关联链接",
		url: "#",
		icon: "material-symbols:info",
		children: [
			{
				name: "GitHub",
				url: "https://github.com/chivehao",
				external: true,
				icon: "fa6-brands:github",
			},

			{
				name: "番组计划",
				url: "https://bgm.tv/user/liguohaocn",
				external: true,
				icon: "streamline-logos:bilibili-logo-solid",
			},

			{
				name: "Bilibili",
				url: "https://space.bilibili.com/3546953776368460",
				external: true,
				icon: "fa6-brands:bilibili",
			},

			{
				name: "Steam",
				url: "https://steamcommunity.com/id/chivehao",
				external: true,
				icon: "fa6-brands:steam",
			},

			{
				name: "米游社",
				url: "https://www.miyoushe.com/sr/accountCenter/postList?id=159893568",
				external: true,
				icon: "mdi:rabbit-variant-outline",
			},

			{
				name: "森空岛",
				url: "https://www.skland.com/profile?id=3827236787499",
				external: true,
				icon: "mdi:rabbit-variant",
			},
		],
	});

	// 仅返回链接，其它导航搜索相关配置在模块顶层常量中独立导出
	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
