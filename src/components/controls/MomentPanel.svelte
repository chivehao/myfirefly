<script lang="ts">
    import {onMount} from "svelte";

    import I18nKey from "@/i18n/i18nKey";
    import {i18n} from "@/i18n/translation";
    import type {MomentPost} from "@utils/get-feeds-utils.ts";
    import Icon from "@iconify/svelte";

    export let sortedPosts: MomentPost[] = [];

    const params = new URLSearchParams(window.location.search);
    const uncategorized = params.get("uncategorized");


    interface Group {
        year: number;
        moments: MomentPost[];
    }

    let groups: Group[] = [];


    function formatDate(date: Date) {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${month}-${day}`;
    }

    function formatTag(tagList: string[]) {
        return tagList.map((t) => `#${t}`).join(" ");
    }

    onMount(async () => {
        let filteredPosts: MomentPost[] = sortedPosts;

        // 按发布时间倒序排序，确保不受置顶影响
        filteredPosts = filteredPosts
            .slice()
            .sort((a, b) => Date.parse(b.isoDate) - Date.parse(a.isoDate));

        const grouped = filteredPosts.reduce(
            (acc, post) => {
                const year = new Date(Date.parse(post.isoDate)).getFullYear();
                if (!acc[year]) {
                    acc[year] = [];
                }
                acc[year].push(post);
                return acc;
            },
            {} as Record<number, MomentPost[]>,
        );

        const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
            year: Number.parseInt(yearStr, 10),
            moments: grouped[Number.parseInt(yearStr, 10)],
        }));

        groupedPostsArray.sort((a, b) => b.year - a.year);

        groups = groupedPostsArray;
    });
</script>

<div class="card-base px-8 py-6">
    <!-- 页面标题和描述 -->
    <div class="mb-4">
        <div class="flex items-center gap-3 mb-3">
            <div
                    class="h-8 w-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white dark:text-black/70"
            >
                <Icon icon="material-symbols:group" class="text-[1.5rem]" />
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                朋友圈
            </h1>
        </div>
        朋友们的最近更新
    </div>

    {#each groups as group}
        <div>
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.year}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                  -outline-offset-[2px] z-50 outline-3"
                    ></div>
                </div>
                <div
                        class="hidden md:block md:w-[10%] text-left text-sm transition
                            whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                >
                    <div class="text-left">
                        <strong>博文作者</strong>
                    </div>

                </div>
                <div class="w-[60%] md:w-[70%] transition text-left text-50">
                    {group.moments.length} {i18n(group.moments.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                </div>
            </div>

            {#each group.moments as moment}
                <a
                        href={moment.link}
                        aria-label={moment.isoDate}
                        target="_blank"
                        class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDate(new Date(Date.parse(moment.isoDate)))}
                        </div>

                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                    class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                       bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                       outline outline-4 z-50
                       outline-[var(--card-bg)]
                       group-hover:outline-[var(--btn-plain-bg-hover)]
                       group-active:outline-[var(--btn-plain-bg-active)]"
                            ></div>
                        </div>

                        <!-- post author -->
                        <div
                                class="hidden md:block md:w-[10%] text-left text-sm transition
                            whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            [{moment.authorName}]
                        </div>

                        <!-- post title -->
                        <div
                                class="w-[70%] md:max-w-[60%] md:w-[50%] text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                     text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                        >
                            {moment.title}
                        </div>

                        <!-- post Desc -->
                        <div
                                class="hidden md:block md:w-[10%] text-left text-sm transition
                     whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            {moment.description}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>