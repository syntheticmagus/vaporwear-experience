import { Color3, CubeTexture, Engine, Scene, Tools, TransformNode } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { Watch } from "./watch";
import { IShowroomCameraArcRotateState, IShowroomCameraMatchmoveState, ShowroomCamera } from "@syntheticmagus/showroom-scene";

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
        defaultFocus.position.y = 1.5;

        const camera = new ShowroomCamera(scene);
        camera.fov = 0.5;
        camera.minZ = 0.01;
        camera.maxZ = 100;
        
        const overallState: IShowroomCameraMatchmoveState = {
            matchmoveTarget: watch.cameraParentOverall,
            focusDepth: watch.cameraParentOverall.position.length()
        };
        const claspState: IShowroomCameraMatchmoveState = {
            matchmoveTarget: watch.cameraParentClasp,
            focusDepth: watch.cameraParentClasp.position.length()
        };
        const faceState: IShowroomCameraMatchmoveState = {
            matchmoveTarget: watch.cameraParentFace,
            focusDepth: watch.cameraParentFace.position.length()
        };
        const levitateState: IShowroomCameraMatchmoveState = {
            matchmoveTarget: watch.cameraParentLevitate,
            focusDepth: watch.cameraParentLevitate.position.length()
        };
        const configureState: IShowroomCameraArcRotateState = {
            startingPosition: watch.cameraParentOverall.absolutePosition.clone(),
            target: (watch.cameraParentOverall.parent! as TransformNode).absolutePosition.clone()
        };

        camera.setToMatchmoveState(overallState);

        const testAsync = async function () {
            while (true) {
                await Tools.DelayAsync(5000);
                await camera.animateToMatchmoveState(claspState);
                await Tools.DelayAsync(5000);
                watch.setPoseDown();
                await camera.animateToMatchmoveState(faceState);
                await Tools.DelayAsync(5000);
                await camera.animateToMatchmoveState(levitateState);
                await Tools.DelayAsync(5000);
                watch.setPoseUp();
                await camera.animateToArcRotateState(configureState);
                await Tools.DelayAsync(10000);
                camera.animateToMatchmoveState(levitateState);
                watch.setPoseDown();
                await Tools.DelayAsync(2000);
                camera.animateToMatchmoveState(faceState);
                await Tools.DelayAsync(2000);
                watch.setPoseUp();
                camera.animateToMatchmoveState(claspState);
                await Tools.DelayAsync(2000);
                camera.animateToMatchmoveState(overallState);
            }
        };
        testAsync();

        return scene;
    }
}
