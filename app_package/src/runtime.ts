import "@babylonjs/loaders";
import "@babylonjs/gui";
import "@babylonjs/inspector";

import { Engine } from "@babylonjs/core";
import { Showroom } from "./showroomScene";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export function initializeVaporwearExperience(params: IVaporwearExperienceParams) {
    const canvas = params.canvas;
    const engine = new Engine(canvas);
    Showroom.CreateAsync(engine, params).then((showroom) => {
        engine.runRenderLoop(() => {
            showroom.render();
        });

        showroom.configurationOptionsLoadedObservable.add(() => {
            showroom.createDebugtUI();
        });
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

