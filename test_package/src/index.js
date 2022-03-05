import { VaporwearExperience } from "app_package";

document.body.style.width = window.innerWidth + "px";
document.body.style.height = window.innerHeight + "px";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";

const div = document.createElement("div");
div.style.width = "100%";
div.style.height = "100%";
div.style.margin = "0 auto";
document.body.appendChild(div);

const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";
canvas.style.border = "0px";
div.appendChild(canvas);

window.addEventListener("resize", () => {
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
});

let assetsHostUrl;
if (DEV_BUILD) {
    assetsHostUrl = "http://127.0.0.1:8181/";
} else {
    assetsHostUrl = "https://syntheticmagus.github.io/vaporwear-assets/";
}

VaporwearExperience.CreateAsync({
    canvas: canvas, 
    assetUrlRoot: assetsHostUrl,
    assetUrlWatch: "watch.glb",
    assetUrlWatchStuds: "watch_studs.glb",
    assetUrlWatchMaterials: "watch_materials.glb",
    assetUrlEnvironmentTexture: "studio.env",
    assetUrlDiamondFireTexture: "diamond_fire.env",
}).then((experience) => {
    experience.createDebugUI();
});
