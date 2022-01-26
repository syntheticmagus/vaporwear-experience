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
        defaultFocus.position.y = 1;
        const camera = new ShowroomCamera(scene, watch.cameraParentOverall, params);

        const testAsync = async function () {
            while (true) {
                await Tools.DelayAsync(5000);
                camera.setTrackingTransform(watch.cameraParentOverall);
                await Tools.DelayAsync(5000);
                camera.setTrackingTransform(watch.cameraParentClasp);
                await Tools.DelayAsync(5000);
                watch.setPoseDown();
                camera.setTrackingTransform(watch.cameraParentFace);
                await Tools.DelayAsync(5000);
                camera.setTrackingTransform(watch.cameraParentLevitate);
                await Tools.DelayAsync(5000);
                watch.setPoseUp();
                camera.setTrackingTransform(defaultFocus);
                camera.activate();
                await Tools.DelayAsync(20000);
                camera.deactivate();
                camera.setTrackingTransform(watch.cameraParentLevitate);
                watch.setPoseDown();
                await Tools.DelayAsync(2000);
                camera.setTrackingTransform(watch.cameraParentFace);
                await Tools.DelayAsync(2000);
                watch.setPoseUp();
                camera.setTrackingTransform(watch.cameraParentClasp);
            }
        };
        testAsync();

        return scene;
    }
}
