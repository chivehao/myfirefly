// 配置索引文件 - 统一导出所有配置
// 这样组件可以一次性导入多个相关配置，减少重复的导入语句

// 类型导出
export type {
	AnnouncementConfig,
	BackgroundWallpaperConfig,
	CommentConfig,
	CoverImageConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	ProfileConfig,
	SakuraConfig,
	SidebarLayoutConfig,
	SiteConfig,
	SponsorConfig,
	SponsorItem,
	SponsorMethod,
	WidgetComponentConfig,
	WidgetComponentType,
} from "../../types/config.ts";
// 类型导出
export type {
    DiaryConfig,
} from "../../types/diary.ts";
export { adConfig1, adConfig2 } from "./adConfig.ts"; // 广告配置
export { announcementConfig } from "./announcementConfig.ts"; // 公告配置
// 样式配置
export { backgroundWallpaper } from "./backgroundWallpaper.ts"; // 背景壁纸配置
// 功能配置
export { commentConfig } from "./commentConfig.ts"; // 评论系统配置
export { coverImageConfig } from "./coverImageConfig.ts"; // 封面图配置
export { expressiveCodeConfig } from "./expressiveCodeConfig.ts"; // 代码高亮配置
export { fontConfig } from "./fontConfig.ts"; // 字体配置
export { footerConfig } from "./footerConfig.ts"; // 页脚配置
export { friendsPageConfig, getEnabledFriends } from "./friendsConfig.ts"; // 友链配置
export { licenseConfig } from "./licenseConfig.ts"; // 许可证配置
// 组件配置
export { musicPlayerConfig } from "./musicConfig.ts"; // 音乐播放器配置
export { navBarConfig, navBarSearchConfig } from "./navBarConfig.ts"; // 导航栏配置与搜索配置
export { live2dModelConfig, spineModelConfig } from "./pioConfig.ts"; // 看板娘配置
export { profileConfig } from "./profileConfig.ts"; // 用户资料配置
export { sakuraConfig } from "./sakuraConfig.ts"; // 樱花特效配置
// 布局配置
export { sidebarLayoutConfig } from "./sidebarConfig.ts"; // 侧边栏布局配置
// 核心配置
export { siteConfig } from "./siteConfig.ts"; // 站点基础配置
export { sponsorConfig } from "./sponsorConfig.ts"; // 赞助配置
export { diaryConfig } from "./diary.config.ts"; // 日记配置