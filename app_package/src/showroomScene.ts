import { AbstractMesh, ArcRotateCamera, Color3, CubeTexture, Engine, FreeCamera, PBRMaterial, Scene, SceneLoader, Tools, TransformNode, Vector3 } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { ShowroomCamera } from "./showroomCamera";
import { Watch } from "./watch";

export enum ShowroomSceneStates {
    Overall,
    Clasp,
    Face,
    Levitate,
    Configure
}

export class ShowroomScene extends Scene {
    private _state: ShowroomSceneStates;

    private constructor(engine: Engine) {
        super(engine);

        this._state = ShowroomSceneStates.Overall;
    }

    public static async CreateAsync(engine: Engine, params: IVaporwearExperienceParams): Promise<ShowroomScene> {
        const scene = new ShowroomScene(engine);
        scene.clearColor = Color3.White().toColor4();
        scene.skipFrustumClipping = true;

        const environmentTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlEnvironmentTexture, scene);
        const fireTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlDiamondFireTexture, scene);
        scene.environmentTexture = environmentTexture;

        const watch = await Watch.createAsync(scene, params);

        const defaultFocus = new TransformNode("defaultFocus", scene);
        defaultFocus.position.y = 2;
        const camera = new ShowroomCamera(scene, defaultFocus, params);

        Tools.DelayAsync(3000).then(() => {
            camera.activate();
            return Tools.DelayAsync(5000);
        }).then(() => {
            watch.setPoseDown();
            camera.deactivate();
            camera.setTrackingTransform(watch.cameraParentOverall);
            return Tools.DelayAsync(5000);
        }).then(() => {
            watch.setPoseUp();
            camera.activate();
            camera.setTrackingTransform(defaultFocus);
        });

        return scene;
    }
}
