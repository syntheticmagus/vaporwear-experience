import { initializeVaporwearExperience } from "app_package";

document.body.style.width = "100%";
document.body.style.height = "100%";
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

let assetsHostUrl;
if (DEV_BUILD) {
    assetsHostUrl = "http://127.0.0.1:8181/";
} else {
    assetsHostUrl = "https://nonlocal-assets-host-url/";
}
initializeVaporwearExperience({ 
    canvas: canvas, 
    assetUrlRoot: assetsHostUrl,
    assetUrlWatch: "watch.glb",
    assetUrlWatchStuds: "watch_studs.glb",
    assetUrlWatchMaterials: "watch_materials.glb",
    assetUrlEnvironmentTexture: "outdoor.env",
    assetUrlDiamondFireTexture: "diamond_fire.env",
});
