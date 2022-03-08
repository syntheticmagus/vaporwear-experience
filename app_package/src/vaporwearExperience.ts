import "@babylonjs/loaders";
import "@babylonjs/gui";

import { Engine, SceneLoader } from "@babylonjs/core";
import { Showroom, ShowroomState } from "./showroom";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { GLTFFileLoader } from "@babylonjs/loaders";

export interface IHotspotState {
    x: number;
    y: number;
    isVisible: boolean;
}

export class VaporwearExperience {
    private _showroom: Showroom;

    private constructor(showroom: Showroom) {
        this._showroom = showroom;
    }

    public static async CreateAsync(params: IVaporwearExperienceParams): Promise<VaporwearExperience> {
        SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;
                loader.transparencyAsCoverage = true;
            }
        });

        const canvas = params.canvas;
        const engine = new Engine(canvas, undefined, {
            forceSRGBBufferSupportState: true
        });

        window.addEventListener("resize", () => {
            engine.resize();
        });

        const showroom = await Showroom.CreateAsync(engine, params);

        engine.runRenderLoop(() => {
            showroom.render();
        });

        return new VaporwearExperience(showroom);
    }

    public setZoom(zoomPercent: number): void {
        this._showroom.setZoomPercent(zoomPercent);
    }

    public disableMouseWheel(): void {
        this._showroom.disableMouseWheel();
    }

    public setCameraBehavior(behavior: string) {
        switch (behavior) {
            case "overall":
                this._showroom.state = ShowroomState.Overall;
                break;
            case "clasp":
                this._showroom.state = ShowroomState.Clasp;
                break;
            case "face":
                this._showroom.state = ShowroomState.Face;
                break;
            case "levitate":
                this._showroom.state = ShowroomState.Levitate;
                break;
            case "configure":
                this._showroom.state = ShowroomState.Configure;
                break;
        }
    }

    public setBandMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("chassis", materialName);
    }

    public setGlassMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("glass", materialName);
    }

    public setJewelry(jewelryName: string) {
        switch (jewelryName) {
            case "none":
                this._showroom.showStuds = false;
                break;
            case "studs":
                this._showroom.showStuds = true;
                break;
        }
    }

    public setGemMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("diamond", materialName);
    }

    public setSettingMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("setting", materialName);
    }

    public createDebugUI(): void {
        this._showroom.createDebugtUI();
    }

    public addEventListener(event: string, callback: any): void {
        switch (event) {
            case "hotspotUpdate":
                this._showroom.onHotspotUpdatedObservable.add((hotspotUpdate) => {
                    callback(hotspotUpdate);
                });
                break;
            case "configurationOptionsLoaded":
                if (this._showroom.configurationOptionsLoaded) {
                    callback();
                } else {
                    this._showroom.configurationOptionsLoadedObservable.addOnce(() => {
                        callback();
                    });
                }
        }
    }
}
