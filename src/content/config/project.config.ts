export type ProjectType = "opensource" | "novel";

export interface ProjectItem {
    id: string;
    type: ProjectType;
    title: string;
    description: string;
    url?: string;
    cover?: string; // 封面图片
    tags?: string[];
    status?: "active" | "paused" | "finished";
}

export const projects: ProjectItem[] = [
    {
        id: "ikaros-project",
        type: "opensource",
        title: "Ikaros Project",
        description: "这个项目整个架构很庞大，涉及的技术栈多且杂。",
        url: "https://github.com/ikaros-dev/ikaros",
        cover: "https://imgbed.ikaros.run/file/posts/1770450377943_20260207154609403.png",
        tags: ["Ikaros", "CMS", "ACG", "ACGMN"],
        status: "active",
    },
    {
        id: "se-script-mybase",
        type: "opensource",
        title: "SE MyBase Script",
        description: "太空工程基地脚本。",
        url: "https://github.com/se-scripts/mybase",
        cover: "https://imgbed.ikaros.run/file/posts/1770450716245_20260207155147960.png",
        tags: ["太空工程师", "游戏", "脚本"],
        status: "finished",
    },
    {
        id: "endfield-novel",
        type: "novel",
        title: "终末地：开拓，失忆和管理员",
        description: "明日方舟终末地的同人小说。",
        url: "https://fanqienovel.com/page/7603967738356190233",
        cover: "https://imgbed.ikaros.run/file/posts/1770587532432_20260209055207511.png",
        tags: ["长篇", "科幻", "末世", "衍生", "同人", "架空"],
        status: "active",
    },
    {
        id: "myfirst-novel",
        type: "novel",
        title: "大奉帝国",
        description: "本人的第一篇网文小说，写的太烂，腰斩完结QAQ。",
        url: "https://fanqienovel.com/page/7362830035251645502",
        cover: "https://imgbed.ikaros.run/file/posts/1770450969426_20260207155600633.png",
        tags: ["科幻", "长篇", "玄幻", "穿越", "架空"],
        status: "finished",
    },
];
