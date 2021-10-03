import "zx/globals";

$.verbose = false;

async function download(url) {
    const file = url.substr(`https://cdn.nekos.life/`.length);
    const target = path.join("~/images/nekos.life/", file);
    if(fs.existsSync(target)) return;
    await $`curl -fsSLO ${target} ${url}`;
}