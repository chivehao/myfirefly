<script lang="ts">
    import {siteConfig} from "@/content/config";

    function getDomain(): string {
        return siteConfig.site_url.replace("http://", "").replace("https://", "")
    }

    const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
</script>
<div style="display: inline;">
    <a href={'https://www.boyouquan.com/certificates/' + getDomain()} target="_blank" rel="nofollow"
       class="badge boyouquan">
        <img src={ isDarkMode
        ? 'https://www.boyouquan.com/images/logo/performance-dark.svg?domainName='
        : 'https://www.boyouquan.com/images/logo/performance.svg?domainName='
        + getDomain()}
             alt="博友圈"
             style="display:block;height:28px;">
    </a>
</div>