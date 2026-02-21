import {
	LinkPreset,
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../../types/config.ts";
import {diaryConfig} from "./diary.config.ts";
import {siteConfig} from "./siteConfig.ts";

// 根据页面开关动态生成导航栏配置
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: (NavBarLink | LinkPreset)[] = [
		// 主页
		LinkPreset.Home,

		// 动态/日记
		...(diaryConfig.enable ? [LinkPreset.Diaries] : []),

		// 归档
		LinkPreset.Archive,
	];

	// 关于我
	links.push({
		name: "我的",
		url: "#",
		icon: "material-symbols:person",
		children: [
			// 关于页面
			LinkPreset.About,
			// 根据配置决定是否添加留言板，在siteConfig关闭pages.guestbook时导航栏不显示留言板
			...(siteConfig.pages.guestbook ? [LinkPreset.Guestbook] : []),
			// 根据配置决定是否添加番组计划，在siteConfig关闭pages.bangumi时导航栏不显示番组计划
			...(siteConfig.pages.bangumi ? [LinkPreset.Bangumi] : []),
			LinkPreset.Projects,
		],
	});

	// 朋友们
	links.push({
		name: "朋友",
		url: "#",
		icon: "material-symbols:group",
		children: [
			// 友链
			LinkPreset.Friends,
			// 朋友圈
			LinkPreset.Moments,
		],
	});

	// 关于及其子菜单
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	links.push({
		name: "链接",
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

			// {
			// 	name: "网易云音乐",
			// 	url: "https://music.163.com/#/user?id=425506154",
			// 	external: true,
			// 	icon: "mingcute:netease-music-fill",
			// },

			// {
			// 	name: "Bilibili",
			// 	url: "https://space.bilibili.com/3546953776368460",
			// 	external: true,
			// 	icon: "fa6-brands:bilibili",
			// },

			// {
			// 	name: "Steam",
			// 	url: "https://steamcommunity.com/id/chivehao",
			// 	external: true,
			// 	icon: "fa6-brands:steam",
			// },

			// {
			// 	name: "米游社",
			// 	url: "https://www.miyoushe.com/sr/accountCenter/postList?id=159893568",
			// 	external: true,
			// 	icon: "mdi:rabbit-variant-outline",
			// },

			// {
			// 	name: "森空岛",
			// 	url: "https://www.skland.com/profile?id=3827236787499",
			// 	external: true,
			// 	icon: "mdi:rabbit-variant",
			// },
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
