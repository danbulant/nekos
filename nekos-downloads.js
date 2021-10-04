import "zx/globals";
import { performance } from "perf_hooks";

$.verbose = false;

async function download(type, url) {
    url = url.replace("https://", "http://");
    const file = path.basename(url); //url.substr(`https://cdn.nekos.life/`.length);
    const target = path.join(os.homedir(), "/images/nekos.life/", type, file);
    if(fs.existsSync(target)) return false;
    if(!fs.existsSync(path.join(os.homedir(), "/images/nekos.life", type)))
        await fs.mkdir(path.join(os.homedir(), "/images/nekos.life", type), { recursive: true });
    await $`curl -fsSL --output ${target} ${url}`;
    return true;
}

async function getURL(type) {
    const imgurl = `http://nekos.life/api/v2/img/` + type;
    const urlOut = await $`curl -fsSL ${imgurl} | jq -r ".url"`;
    const url = urlOut.stdout.trim();
    if(url === "null") return null;
    return url;
}

await fs.mkdir(path.join(os.homedir(), "/images/nekos.life"), { recursive: true });

var toSkip = [];

async function startDownload() {
    var last = Math.floor(Math.random() * types.length);
    while(true) {
        last++;
        if(types.length <= last) last = 0;
        var type = types[last];
        if(toSkip.length === types.length) break;
        while(toSkip.includes(type)) {
            last++;
            if(types.length <= last) last = 0;
            type = types[last];
        }

        try {
            const start = performance.now();
            const url = await getURL(type);
            if(!url) {
                toSkip.push(type);
                continue;
            }
            const res = await download(type, url);
            const end = performance.now();
            if(res) {
                console.log("Downloaded", type, "in", (end - start) + "ms");
            } else {
                console.log("Nothing downloaded for", type);
                await sleep(100);
                continue;
            }
        } catch(e) {
            console.warn(e);
            await sleep(700);
            continue;
        }
        await sleep(50 * Math.random());
    }
    console.log("Download thread finished");
}

const types = [
    "smug",
    "baka",
    "tickle",
    "slap",
    "poke",
    "pat",
    "neko",
    "nekoGif",
    "meow",
    "lizard",
    "kiss",
    "hug",
    "foxGirl",
    "feed",
    "cuddle",
    "kemonomimi",
    "holo",
    "woof",
    "wallpaper",
    "goose",
    "gecg",
    "avatar",
    "waifu",

    "randomHentaiGif",
    "pussy",
    "nekoGif",
    "lesbian",
    "kuni",
    "cumsluts",
    "classic",
    "boobs",
    "bJ",
    "anal",
    "avatar",
    "yuri",
    "trap",
    "tits",
    "girlSoloGif",
    "girlSolo",
    "pussyWankGif",
    "pussyArt",
    "kemonomimi",
    "kitsune",
    "keta",
    "holo",
    "holoEro",
    "hentai",
    "futanari",
    "femdom",
    "feetGif",
    "eroFeet",
    "feet",
    "ero",
    "eroKitsune",
    "eroKimonomimi",
    "eroNeko",
    "eroYuri",
    "cumArts",
    "blowJob",
    "spank",
    "gasm"
];

await Promise.all(new Array(6).fill(0).map(() => startDownload()));