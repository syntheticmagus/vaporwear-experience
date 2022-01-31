import { Color3, CubeTexture, Engine, Scene, TransformNode } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { Watch, WatchState } from "./watch";
import { IShowroomCameraArcRotateState, IShowroomCameraMatchmoveState, ShowroomCamera } from "@syntheticmagus/showroom-scene";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";

export enum ShowroomState {
    Overall,
    Clasp,
    Face,
    Levitate,
    Configure
}

export class Showroom {
    private _scene: Scene;
    private _state: ShowroomState;

    private _watch: Watch;

    private _camera: ShowroomCamera;

    private _overallState: IShowroomCameraMatchmoveState;
    private _claspState: IShowroomCameraMatchmoveState;
    private _faceState: IShowroomCameraMatchmoveState;
    private _levitateState: IShowroomCameraMatchmoveState;
    private _configureState: IShowroomCameraArcRotateState;
    
    public get State(): ShowroomState {
        return this._state;
    }

    public set State(state: ShowroomState) {
        if (this._state === state) {
            return;
        }

        this._state = state;
        switch (this._state) {
            case ShowroomState.Overall:
                this._watch.setState(WatchState.Overall);
                this._camera.animateToMatchmoveState(this._overallState);
                console.log("Hello?");
                break;
            case ShowroomState.Clasp:
                this._watch.setState(WatchState.Clasp);
                this._camera.animateToMatchmoveState(this._claspState);
                break;
            case ShowroomState.Face:
                this._watch.setState(WatchState.Face);
                this._camera.animateToMatchmoveState(this._faceState);
                break;
            case ShowroomState.Levitate:
                this._watch.setState(WatchState.Levitate);
                this._camera.animateToMatchmoveState(this._levitateState);
                break;
            case ShowroomState.Configure:
                this._watch.setState(WatchState.Configure);
                this._camera.animateToArcRotateState(this._configureState);
                break;
        }
    }

    private constructor(scene: Scene, watch: Watch) {
        this._scene = scene;
        this._state = ShowroomState.Overall;

        this._watch = watch;

        this._camera = new ShowroomCamera(this._scene);
        this._camera.fov = 0.5;
        this._camera.minZ = 0.01;
        this._camera.maxZ = 100;
        
        this._overallState = {
            matchmoveTarget: this._watch.cameraParentOverall,
            focusDepth: this._watch.cameraParentOverall.position.length()
        };
        this._claspState = {
            matchmoveTarget: this._watch.cameraParentClasp,
            focusDepth: this._watch.cameraParentClasp.position.length()
        };
        this._faceState = {
            matchmoveTarget: this._watch.cameraParentFace,
            focusDepth: this._watch.cameraParentFace.position.length()
        };
        this._levitateState = {
            matchmoveTarget: this._watch.cameraParentLevitate,
            focusDepth: this._watch.cameraParentLevitate.position.length()
        };
        this._configureState = {
            startingPosition: this._watch.cameraParentOverall.absolutePosition.clone(),
            target: (this._watch.cameraParentOverall.parent! as TransformNode).absolutePosition.clone(),
            lowerRadiusLimit: 3,
            upperRadiusLimit: 15
        };

        this._watch.setState(WatchState.Overall);
        this._camera.setToMatchmoveState(this._overallState);
        this._state = ShowroomState.Overall;

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
    }

    public static async CreateAsync(engine: Engine, params: IVaporwearExperienceParams): Promise<Showroom> {
        const scene = new Scene(engine);
        scene.clearColor = Color3.White().toColor4();
        scene.skipFrustumClipping = true;

        const environmentTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlEnvironmentTexture, scene);
        const fireTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlDiamondFireTexture, scene);
        scene.environmentTexture = environmentTexture;

        const watch = await Watch.createAsync(scene, params);

        return new Showroom(scene, watch);
    }

    public render(): void {
        this._scene.render();
    }
}
