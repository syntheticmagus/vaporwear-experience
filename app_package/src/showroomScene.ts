import { Color3, CubeTexture, Engine, Observable, PBRMaterial, Scene, SceneLoader, TransformNode } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { Watch, WatchState } from "./watch";
import { IShowroomCameraArcRotateState, IShowroomCameraMatchmoveState, ShowroomCamera } from "@syntheticmagus/showroom-scene";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui";
import { WatchStuds } from "./watchStuds";

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
    private _studs?: WatchStuds;

    private _camera: ShowroomCamera;

    private _overallState: IShowroomCameraMatchmoveState;
    private _claspState: IShowroomCameraMatchmoveState;
    private _faceState: IShowroomCameraMatchmoveState;
    private _levitateState: IShowroomCameraMatchmoveState;
    private _configureState: IShowroomCameraArcRotateState;
    
    public get state(): ShowroomState {
        return this._state;
    }

    public set state(state: ShowroomState) {
        if (this._state === state) {
            return;
        }

        this._state = state;
        switch (this._state) {
            case ShowroomState.Overall:
                this._watch.setState(WatchState.Overall);
                this._camera.animateToMatchmoveState(this._overallState);
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

    public set showStuds(visibility: boolean) {
        this._studs?.Mesh?.setEnabled(visibility);
    }

    private _configurationOptionsLoaded: boolean;
    public get configurationOptionsLoaded(): boolean {
        return this._configurationOptionsLoaded;
    }
    public configurationOptionsLoadedObservable: Observable<Showroom>;

    private constructor(scene: Scene, watch: Watch, studsPromise: Promise<WatchStuds>, materialsPromise: Promise<void>) {
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

        studsPromise.then((studs) => {
            studs.Mesh.setEnabled(false);
            this._studs = studs;
            watch.attachToBodyBone(studs.Mesh);
        });

        this._configurationOptionsLoaded = false;
        this.configurationOptionsLoadedObservable = new Observable<Showroom>();
        Promise.all([studsPromise, materialsPromise]).then(() => {
            this._configurationOptionsLoaded = true;
            this.configurationOptionsLoadedObservable.notifyObservers(this);
        })
    }

    public static async CreateAsync(engine: Engine, params: IVaporwearExperienceParams): Promise<Showroom> {
        const scene = new Scene(engine);
        scene.clearColor = Color3.White().toColor4();
        scene.skipFrustumClipping = true;

        const environmentTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlEnvironmentTexture, scene);
        scene.environmentTexture = environmentTexture;

        const watch = await Watch.createAsync(scene, params);
        const studsPromise = WatchStuds.CreateAsync(scene, params);
        
        const materialsPromise = SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatchMaterials, scene).then((result) => {
            result.meshes[0].setEnabled(false);
        });

        return new Showroom(scene, watch, studsPromise, materialsPromise);
    }

    public render(): void {
        this._scene.render();
    }

    public setMeshMaterialByName(meshName: string, materialName: string): boolean {
        const mesh = this._scene.getMeshByName(meshName);
        const material = this._scene.getMaterialByName(materialName);
        if (mesh && material) {
            mesh.material = material;
            return true;
        }
        return false;
    }
}
