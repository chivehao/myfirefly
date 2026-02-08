<script type="ts">
    import {footerConfig} from "@/content/config";

    const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
</script>


<div style="display: inline-block;">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="180"
             height="30"
             viewBox="0 0 180 28"
             role="img"
             aria-label="ICP备案">
            <!-- 背景（可删） -->
            <rect id="icp-bg-rect" x="0" y="0" rx="6" ry="6" width="180" height="28" fill={isDarkMode ? '#4b5563' : '#f5f7fa'} />

            <!-- 圆润蓝色盾牌 -->
            <path
                    d="
      M14 6
      Q20 4 26 6
      V14
      C26 18 22 21 20 22
      C18 21 14 18 14 14
      Z"
                    fill="#2b7cff"/>

            <!--内部高光 -->
            <path
                    d="
      M20 7
      V20
      C22 19 24 17 24 14
      V7.5
      Q22 6.8 20 7
      Z"
                    fill="#ffffff"
                    opacity="0.25"/>

            <!-- 备案号文字 -->
            <text
                    id="icp-bg-text"
                    x="40"
                    y="19"
                    font-size="12"
                    fill={isDarkMode ? '#f5f7fa' : '#333'}
                    font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto">
                {footerConfig.enable && footerConfig.icp ? footerConfig.icp : '未配置ICP备案号'}
            </text>
        </svg>
    </a>
</div>