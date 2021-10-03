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
    --loop [interval] -l Loops the image to be repeated in select interval (randomizes the image each time), in ms. Defaults to 2000ms.
    --gif -g renders all GIF frames, according to their delay(s). Looped by default. When enabled, --loop is ignored. Option ignored if url isn't GIF.
    --url -u Shows current image's URL before the image
    --verbose -v Shows more information when running command. Enables --url flag.`);

    process.exit(0);
}
const type = argv._[0] || "neko";
const istty = tty.isatty(process.stdout.fd);
const sizeSrc = await $`stty size`;
const sizes = sizeSrc.stdout.split(" ").map(t => parseInt(t));
const verbose = argv.verbose || argv.v;
const showUrl = verbose || argv.url || argv.u;

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

    if(showUrl) console.log(url);
    if((!argv.g && !argv.gif) || !url.endsWith(".gif")) {
        await $`curl -fsSL ${url} | convert - jpeg:- | jp2a --size=${sizes[1] + "x" + sizes[0]} ${args} -`.pipe(process.stdout);
    } else {
        const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), "nekos-"));
        await $`curl -fsSL ${url} -o ${tempdir + "/src.gif"}`;
        await $`convert -coalesce ${tempdir + "/src.gif"} ${tempdir + "/img.jpg"}`;
        const frameLens = (await $`magick identify -format "%T\n" ${tempdir + "/src.gif"}`).stdout.split("\n").map(t => (1 / parseInt(t)) * 100);

        sigPreventable = true;
        var frame = 0;
        while(true) {
            if(frame >= frameLens.length - 2) frame = 0;
            if(sigint) break;
            const start = performance.now();
            try {
                const out = await $`jp2a ${args} --size=${sizes[1] + "x" + (sizes[0] - (verbose ? 1 : 0))} ${tempdir + "/img-" + frame + ".jpg"} | sed -z '$ s/\\n$//'`;
                process.stdout.write("\n" + out.stdout);
            } catch(e) {
                if(e.exitCode === null) break;
                console.warn(e);
                break;
            }
            const end = performance.now();
            if(verbose) process.stdout.write(`\n${frame + 1}/${frameLens.length - 2} ${frameLens[frame]}ms ${end-start}ms`);
            await sleep(frameLens[frame] - (end - start));
            frame++;
        }
        await $`rm -r ${tempdir}`;
    }
}

process.on("SIGINT", (s) => {
    if(!sigPreventable) process.exit(1);
    sigint = true;
});

await showImage(type);
if(argv.loop || argv.l) {
    const offset = parseInt(argv.loop || argv.l);
    const delay = isNaN(offset) ? 2000 : offset;
    sigPreventable = true;
    while(true) {
        if(sigint) break;
        await sleep(delay);
        if(sigint) break;
        await showImage(type);
    }
}