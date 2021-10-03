#!/usr/bin/env zx
/// <reference path="node_modules/zx/globals.d.ts" />
const { performance } = require("perf_hooks");
const tty = require("tty");

$.verbose = false;
argv._.shift();

if(argv.help) {
    // ****     ** ******** **   **   *******    ********
    // /**/**   /**/**///// /**  **   **/////**  **////// 
    // /**//**  /**/**      /** **   **     //**/**       
    // /** //** /**/******* /****   /**      /**/*********
    // /**  //**/**/**////  /**/**  /**      /**////////**
    // /**   //****/**      /**//** //**     **        /**
    // // /**    //***/********/** //** //*******   ******** 
    // //      /// //////// //   //   ///////   ////////
    console.log(`nekos
Shows images of nekos.

Usage:
    nekos neko [--loop]
    nekos wallpaper [--loop]
    nekos avatar [--loop]
    nekos waifu [--loop]
    nekos gecg [--loop]
    nekos --help

Options:
    --help Show this screen
    --loop [interval] Loops the image to be repeated in select interval (randomizes the image each time), in ms. Defaults to 2000ms.
    --gif renders all GIF frames, according to their delay(s). Looped by default. When enabled, --loop is ignored. Option ignored if url isn't GIF.
    --url Shows current image's URL before the image`);

    process.exit(0);
}
const type = argv._[0] || "neko";
const istty = tty.isatty(process.stdout.fd);
const heightOut = await $`stty size | awk '{print $1}'`;
const height = parseInt(heightOut.stdout);

var sigPreventable = false;
var sigint = false;

async function showImage(type) {
    const imgurl = `https://nekos.life/api/v2/img/` + type;
    const urlOut = await $`curl -fsSL ${imgurl} | jq -r ".url"`;
    const url = urlOut.stdout.trim();
    if(url === "null") {
        console.error("Type not found");
        process.exit(1);
    }

    const args = [
        istty && "--fill",
        argv.colors !== false && "--colors"
    ].filter(t => t);

    if(argv.url) console.log(url);
    if(!argv.gif || !url.endsWith(".gif")) {
        await $`curl -fsSL ${url} | convert - jpeg:- | jp2a --height=${height-1} ${args} -`.pipe(process.stdout);
    } else {
        const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), "nekos-"));
        await $`curl -fsSL ${url} -o ${tempdir + "/src.gif"}`;
        await $`convert -coalesce ${tempdir + "/src.gif"} ${tempdir + "/img.jpg"}`;
        const frameLens = (await $`magick identify -format "%T\n" ${tempdir + "/src.gif"}`).stdout.split("\n").map(t => 1 / parseInt(t));

        sigPreventable = true;
        var frame = 0;
        while(true) {
            if(frame >= frameLens.length - 2) frame = 0;
            if(sigint) break;
            const start = performance.now();
            try {
                await $`jp2a ${args} --height=${height-1} ${tempdir + "/img-" + frame + ".jpg"}`.pipe(process.stdout);
            } catch(e) {
                break;
            }
            const end = performance.now();
            console.log(`${frame}/${frameLens.length} ${frameLens[frame]}ms ${end-start}ms`);
            await sleep(frameLens[frame] - (end - start));
            frame++;
        }
        await fs.unlink(tempdir);
    }
}

process.on("SIGINT", (s) => {
    if(!sigPreventable) process.exit(1);
    sigint = true;
});

await showImage(type);
if(argv.loop) {
    const offset = parseInt(argv.loop);
    const delay = isNaN(offset) ? 2000 : offset;
    sigPreventable = true;
    while(true) {
        if(sigint) break;
        await sleep(delay);
        if(sigint) break;
        await showImage(type);
    }
}