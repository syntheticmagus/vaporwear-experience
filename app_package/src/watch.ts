import { AbstractMesh, AnimationGroup, ISceneLoaderAsyncResult, MeshBuilder, Quaternion, Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export enum WatchState {
    Overall,
    Clasp,
    Face,
    Levitate,
    Configure
}

class WatchStateHelpers {
    public static IsUpState(state: WatchState): boolean {
        switch (state) {
            case WatchState.Overall:
            case WatchState.Clasp:
            case WatchState.Configure:
                return true;
            default:
                return false;
        }
    }
}

export class Watch extends TransformNode {
    private _animationWatchSpinUp: AnimationGroup;
    private _animationWatchSpinDown: AnimationGroup;
    private _animationOrbitOverall: AnimationGroup;
    private _animationOrbitClasp: AnimationGroup;
    private _animationOrbitFace: AnimationGroup;
    private _animationOrbitLevitate: AnimationGroup;

    private _cameraParentOverall: TransformNode;
    private _cameraParentClasp: TransformNode;
    private _cameraParentFace: TransformNode;
    private _cameraParentLevitate: TransformNode;

    private _hotspot0: TransformNode;
    private _hotspot1: TransformNode;

    private _viewbox0: AbstractMesh;
    private _viewbox1: AbstractMesh;

    private _state: WatchState;

    public get cameraParentOverall(): TransformNode {
        return this._cameraParentOverall;
    }

    public get cameraParentClasp(): TransformNode {
        return this._cameraParentClasp;
    }

    public get cameraParentFace(): TransformNode {
        return this._cameraParentFace;
    }

    public get cameraParentLevitate(): TransformNode {
        return this._cameraParentLevitate;
    }

    private constructor (scene: Scene, importMeshResult: ISceneLoaderAsyncResult) {
        super("watchRoot", scene);

        importMeshResult.meshes[0].parent = this;
        
        const animations: Map<string, AnimationGroup> = new Map();
        importMeshResult.animationGroups.forEach((animationGroup) => {
            animations.set(animationGroup.name, animationGroup);
        });
        this._animationWatchSpinUp = animations.get("watch_spin-up")!;
        this._animationWatchSpinDown = animations.get("watch_spin-down")!;
        this._animationOrbitOverall = animations.get("orbit_overall")!;
        this._animationOrbitClasp = animations.get("orbit_clasp")!;
        this._animationOrbitFace = animations.get("orbit_face")!;
        this._animationOrbitLevitate = animations.get("orbit_levitate")!;
        
        this._animationWatchSpinDown.stop();
        this._animationWatchSpinUp.stop();

        this._animationOrbitOverall.play(true);
        this._animationOrbitClasp.stop();
        this._animationOrbitFace.stop();
        this._animationOrbitLevitate.stop();

        // Note: this convenience approach takes a hard dependency on there only being one watch in the scene.
        this._cameraParentOverall = scene.getTransformNodeByName("camera_overall")!;
        this._cameraParentClasp = scene.getTransformNodeByName("camera_clasp")!;
        this._cameraParentFace = scene.getTransformNodeByName("camera_face")!;
        this._cameraParentLevitate = scene.getTransformNodeByName("camera_levitate")!;
        const cameraParents = [
            this._cameraParentOverall,
            this._cameraParentClasp,
            this._cameraParentFace,
            this._cameraParentLevitate
        ];
        cameraParents.forEach((parent) => {
            parent.scaling.z *= -1;
            parent.rotate(Vector3.RightReadOnly, -Math.PI / 2);
        });

        this._hotspot0 = scene.getTransformNodeByName("hotspot_0")!;
        this._hotspot1 = scene.getTransformNodeByName("hotspot_1")!;

        this._viewbox0 = scene.getMeshByName("viewbox_0")!;
        this._viewbox0.isVisible = false;
        this._viewbox1 = scene.getMeshByName("viewbox_1")!;
        this._viewbox1.isVisible = false;

        this._state = WatchState.Overall;
    }

    public static async createAsync(scene: Scene, params: IVaporwearExperienceParams): Promise<Watch> {
        const importMeshResult = await SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatch, scene);
        return new Watch(scene, importMeshResult);
    }

    public setState(newState: WatchState): void {
        if (newState === this._state) {
            return;
        }

        if (WatchStateHelpers.IsUpState(this._state) && !WatchStateHelpers.IsUpState(newState)) {
            this._animationWatchSpinUp.stop();
            this._animationWatchSpinDown.play(false);
        } else if (!WatchStateHelpers.IsUpState(this._state) && WatchStateHelpers.IsUpState(newState)) {
            this._animationWatchSpinDown.stop();
            this._animationWatchSpinUp.play(false);
        }

        switch (this._state) {
            case WatchState.Overall:
                this._animationOrbitOverall.stop();
                break;
            case WatchState.Clasp:
                this._animationOrbitClasp.stop();
                break;
            case WatchState.Face:
                this._animationOrbitFace.stop();
                break;
            case WatchState.Levitate:
                this._animationOrbitLevitate.stop();
                break;
        }

        switch (newState) {
            case WatchState.Overall:
                this._animationOrbitOverall.play(true);
                break;
            case WatchState.Clasp:
                this._animationOrbitClasp.play(true);
                break;
            case WatchState.Face:
                this._animationOrbitFace.play(true);
                break;
            case WatchState.Levitate:
                this._animationOrbitLevitate.play(true);
                break;
        }

        this._state = newState;
        return;
    }
}
