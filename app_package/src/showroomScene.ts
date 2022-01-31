import { Color3, CubeTexture, Engine, Scene, Tools, TransformNode } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { Watch, WatchState } from "./watch";
import { IShowroomCameraArcRotateState, IShowroomCameraMatchmoveState, ShowroomCamera } from "@syntheticmagus/showroom-scene";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";

export enum ShowroomSceneState {
    Overall,
    Clasp,
    Face,
    Levitate,
    Configure
}

export class ShowroomScene extends Scene {
    private _state: ShowroomSceneState;
    
    public get State(): ShowroomSceneState {
        return this._state;
    }

    public set State(state: ShowroomSceneState) {
        switch (state) {
            case ShowroomSceneState.Overall:
                break;
            case ShowroomSceneState.Clasp:
                break;
            case ShowroomSceneState.Face:
                break;
            case ShowroomSceneState.Levitate:
                break;
            case ShowroomSceneState.Configure:
                break;
        }

        this._state = state;
    }

    private constructor(engine: Engine) {
        super(engine);

        this._state = ShowroomSceneState.Overall;
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
            target: (watch.cameraParentOverall.parent! as TransformNode).absolutePosition.clone(),
            lowerRadiusLimit: 3,
            upperRadiusLimit: 15
        };

        watch.setState(WatchState.Overall);
        camera.setToMatchmoveState(overallState);

        const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("gui", true, scene);
        const rect = new Rectangle("rect");
        rect.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_TOP;
        rect.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT
        rect.widthInPixels = 10;
        rect.heightInPixels = 10;
        rect.color = "red";
        guiTexture.addControl(rect);
        scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
            while (true) {
                rect.leftInPixels = watch.hotspot1State.position.x;
                rect.topInPixels = watch.hotspot1State.position.y;
                rect.isVisible = watch.hotspot1State.isVisible;
                yield;
            }
        }());

        const testAsync = async function () {
            while (true) {
                await Tools.DelayAsync(5000);
                watch.setState(WatchState.Clasp);
                await camera.animateToMatchmoveState(claspState);
                await Tools.DelayAsync(25000);
                watch.setState(WatchState.Face);
                await camera.animateToMatchmoveState(faceState);
                await Tools.DelayAsync(5000);
                watch.setState(WatchState.Levitate);
                await camera.animateToMatchmoveState(levitateState);
                await Tools.DelayAsync(5000);
                watch.setState(WatchState.Configure);
                await camera.animateToArcRotateState(configureState);
                await Tools.DelayAsync(10000);
                watch.setState(WatchState.Levitate);
                camera.animateToMatchmoveState(levitateState);
                await Tools.DelayAsync(200);
                watch.setState(WatchState.Face);
                camera.animateToMatchmoveState(faceState);
                await Tools.DelayAsync(200);
                watch.setState(WatchState.Clasp);
                camera.animateToMatchmoveState(claspState);
                await Tools.DelayAsync(200);
                watch.setState(WatchState.Overall);
                camera.animateToMatchmoveState(overallState);
            }
        };
        testAsync();

        return scene;
    }
}
