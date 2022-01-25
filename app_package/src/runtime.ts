import "@babylonjs/loaders";
import "@babylonjs/gui";
import "@babylonjs/inspector";

import { Engine } from "@babylonjs/core";
import { CreatePlaygroundSceneAsync } from "./Playground/playground";
import { ShowroomScene } from "./showroomScene";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export function initializeVaporwearExperience(params: IVaporwearExperienceParams) {
    const canvas = params.canvas;
    const engine = new Engine(canvas);
    ShowroomScene.CreateAsync(engine, params).then((scene) => {
        engine.runRenderLoop(() => {
            scene.render();
        });
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

