import "@babylonjs/loaders";
import "@babylonjs/gui";

import { Showroom, ShowroomState } from "./showroom";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { GLTFFileLoader } from "@babylonjs/loaders";
import { Engine } from "@babylonjs/core/Engines/engine";

/**
 * Data representing the screen-space state of a hotspot at a
 * particular point in time.
 */
export interface IHotspotState {
    /**
     * Screen-space horizontal position.
     */
    x: number;

    /**
     * Screen-space vertical position.
     */
    y: number;

    /**
     * Whether or not the hotspot is currently visible.
     */
    isVisible: boolean;
}

/**
 * Class encapsulating the 3D Vaporwear experience.
 */
export class VaporwearExperience {
    private _showroom: Showroom;

    private constructor(showroom: Showroom) {
        this._showroom = showroom;
    }

    /**
     * Asynchronous constructor for the 3D Vaporwear experience.
     * @param params data required for experience initialization
     * @returns a promise that resolves when the experience is ready to use
     */
    public static async CreateAsync(params: IVaporwearExperienceParams): Promise<VaporwearExperience> {
        // https://doc.babylonjs.com/divingDeeper/3D_commerce_certif#certified-viewer-version-based-on-babylonjs-engine
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

    /**
     * Sets the camera zoom percentage during arc-rotate behavior.
     * @param zoomPercent new zoom percentage for the camera during arc-rotate behavior
     */
    public setZoom(zoomPercent: number): void {
        this._showroom.setZoomPercent(zoomPercent);
    }

    /**
     * Prevents the experience from using the mouse wheel for zoom.
     */
    public disableMouseWheel(): void {
        this._showroom.disableMouseWheel();
    }

    /**
     * Sets the behavior for the experience to adopt.
     * @param behavior "overall" | "clasp" | "face" | "levitate" | "configure"
     */
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

    /**
     * Sets the material of the watch band.
     * @param materialName the name of the new material to apply to the band
     */
    public setBandMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("chassis", materialName);
    }

    /**
     * Sets the material of the glass.
     * @param materialName the name of the new material to apply to the glass
     */
    public setGlassMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("glass", materialName);
    }

    /**
     * Sets what jewelry is enabled on the watch.
     * @param jewelryName "none" | "studs"
     */
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

    /**
     * Sets the material of the gemstones.
     * @param materialName the name of the new material to apply to the gemstones
     */
    public setGemMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("diamond", materialName);
    }

    /**
     * Sets the material of the bezel settings for the gemstones.
     * @param materialName the name of the new material to apply to the bezel settings
     */
    public setSettingMaterial(materialName: string) {
        this._showroom.setMeshMaterialByName("setting", materialName);
    }

    /**
     * Creates a debug UI for controlling and testing experience features
     */
    public createDebugUI(): void {
        this._showroom.createDebugtUI();
    }

    /**
     * Listen for events fired by the VaporwearExperience.
     * @param event "hotspotUpdate" | "configurationOptionsLoaded"
     * @param callback function to be called when the requested event occurs
     */
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
