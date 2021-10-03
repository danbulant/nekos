#!/usr/bin/env zx
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
    --loop [interval] Loops the image to be repeated in select interval`);

    process.exit(0);
}
const type = argv._[0] || "neko";
const istty = tty.isatty(process.stdout.fd);
const heightOut = await $`stty size | awk '{print $1}'`;
const height = parseInt(heightOut.stdout);

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
    await $`curl -fsSL ${url} | jp2a --height=${height} ${args} -`.pipe(process.stdout);
}

await showImage(type);
if(argv.loop) {
    const offset = parseInt(argv.loop);
    const delay = isNaN(offset) ? 2000 : offset;
    while(true) {
        await sleep(delay);
        await showImage(type);
    }
}