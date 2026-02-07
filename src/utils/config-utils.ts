import fs from "fs";
import YAML from "yaml";

let cachedConfig: unknown | null = null;

export function loadRawConfig(): unknown {
    if (import.meta.env.PROD && cachedConfig) {
        return cachedConfig;
    }

    const file = fs.readFileSync(
        new URL("../content/config.yaml", import.meta.url),
        "utf-8"
    );

    cachedConfig = YAML.parse(file);
    return cachedConfig;
}
