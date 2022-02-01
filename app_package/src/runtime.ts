import "@babylonjs/loaders";
import "@babylonjs/gui";
import "@babylonjs/inspector";

import { Engine, Tools } from "@babylonjs/core";
import { Showroom, ShowroomState } from "./showroomScene";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export function initializeVaporwearExperience(params: IVaporwearExperienceParams) {
    const canvas = params.canvas;
    const engine = new Engine(canvas);
    Showroom.CreateAsync(engine, params).then((showroom) => {
        engine.runRenderLoop(() => {
            showroom.render();
        });

        const testAsync = async () => {
            while (true) {
                await Tools.DelayAsync(5000);
                showroom.state = ShowroomState.Clasp;
                await Tools.DelayAsync(5000);
                showroom.state = ShowroomState.Face;
                await Tools.DelayAsync(5000);
                showroom.state = ShowroomState.Levitate;
                await Tools.DelayAsync(5000);
                showroom.state = ShowroomState.Configure;
                await Tools.DelayAsync(10000);
                showroom.state = ShowroomState.Levitate;
                await Tools.DelayAsync(2000);
                showroom.state = ShowroomState.Face;
                await Tools.DelayAsync(2000);
                showroom.state = ShowroomState.Clasp;
                await Tools.DelayAsync(2000);
                showroom.state = ShowroomState.Overall;
                await Tools.DelayAsync(2000);
                showroom.showStuds = true;
                showroom.setMeshMaterialByName("chassis", "band_3");
                showroom.setMeshMaterialByName("setting", "setting_silver");
            }
        };
        testAsync();
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

