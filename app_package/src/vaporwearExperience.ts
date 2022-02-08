import "@babylonjs/loaders";
import "@babylonjs/gui";
import "@babylonjs/inspector";

import { Engine } from "@babylonjs/core";
import { Showroom, ShowroomState } from "./showroom";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export interface IHotspotState {
    x: number;
    y: number;
    isVisible: boolean;
}

export class VaporwearExperience {
    private _showroom: Showroom;
    private _hotspot0State: IHotspotState;
    private _hotspot1State: IHotspotState;

    public get hotspot0(): IHotspotState {
        return this._hotspot0State;
    }

    public get hotspot1(): IHotspotState {
        return this._hotspot1State;
    }

    private constructor(showroom: Showroom) {
        this._showroom = showroom;

        this._hotspot0State = {
            x: 0,
            y: 0,
            isVisible: false
        };
        this._hotspot1State = {
            x: 0,
            y: 0,
            isVisible: false
        };

        this._showroom.scene.onBeforeRenderObservable.add(() => {
            this._hotspot0State.x = this._showroom.hotspot0X;
            this._hotspot0State.y = this._showroom.hotspot0Y;
            this._hotspot0State.isVisible = this._showroom.hotspot0IsVisible;
            
            this._hotspot1State.x = this._showroom.hotspot1X;
            this._hotspot1State.y = this._showroom.hotspot1Y;
            this._hotspot1State.isVisible = this._showroom.hotspot1IsVisible;
        });
    }

    public static async CreateAsync(params: IVaporwearExperienceParams): Promise<VaporwearExperience> {
        const canvas = params.canvas;
        const engine = new Engine(canvas);

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
}
