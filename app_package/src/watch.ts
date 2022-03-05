import { AbstractMesh, AnimationGroup, Bone, ISceneLoaderAsyncResult, Matrix, Observable, PBRMaterial, Scene, SceneLoader, Texture, TmpVectors, Tools, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
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

export class HotspotState {
    constructor () {
        this.position = new Vector2();
        this.isVisible = false;
    }

    position: Vector2;
    isVisible: boolean;
}

export class Watch extends TransformNode {
    private _animationWatchSpinUp: AnimationGroup;
    private _animationWatchSpinDown: AnimationGroup;
    private _animationOrbitOverall: AnimationGroup;
    private _animationOrbitClasp: AnimationGroup;
    private _animationOrbitFace: AnimationGroup;
    private _animationOrbitLevitate: AnimationGroup;
    private _animationHotspot0Visibility: AnimationGroup;
    private _animationHotspot1Visibility: AnimationGroup;

    private _bodyBone: Bone;
    private _rootMesh: AbstractMesh;

    private _cameraParentOverall: TransformNode;
    private _cameraParentClasp: TransformNode;
    private _cameraParentFace: TransformNode;
    private _cameraParentLevitate: TransformNode;

    private _hotspot0: TransformNode;
    private _hotspot1: TransformNode;
    private _hotspot2: TransformNode;
    private _hotspot0Visibility: TransformNode;
    private _hotspot1Visibility: TransformNode;
    private _hotspot2Visibility: TransformNode;

    public hotspot0State: HotspotState;
    public hotspot1State: HotspotState;
    public hotspot2State: HotspotState;
    public onHotspotsUpdatedObservable: Observable<void>;

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

    private constructor (scene: Scene, importWatchResult: ISceneLoaderAsyncResult) {
        super("watchRoot", scene);

        importWatchResult.meshes[0].parent = this;
        
        const animations: Map<string, AnimationGroup> = new Map();
        importWatchResult.animationGroups.forEach((animationGroup) => {
            animations.set(animationGroup.name, animationGroup);
        });
        this._animationWatchSpinUp = animations.get("watch_spin-up")!;
        this._animationWatchSpinDown = animations.get("watch_spin-down")!;
        this._animationOrbitOverall = animations.get("orbit_overall")!;
        this._animationOrbitClasp = animations.get("orbit_clasp")!;
        this._animationOrbitFace = animations.get("orbit_face")!;
        this._animationOrbitLevitate = animations.get("orbit_levitate")!;
        this._animationHotspot0Visibility = animations.get("hotspot_0_visibility")!;
        this._animationHotspot1Visibility = animations.get("hotspot_1_visibility")!;

        this._animationWatchSpinUp.speedRatio = 0.7;
        this._animationWatchSpinDown.speedRatio = 0.7;

        this._animationWatchSpinDown.stop();
        this._animationWatchSpinUp.stop();

        this._animationOrbitOverall.play(true);
        this._animationOrbitClasp.play(true);
        this._animationOrbitFace.play(true);
        this._animationHotspot0Visibility.play(true);
        this._animationHotspot1Visibility.play(true);
        this._animationOrbitLevitate.stop();

        this._rootMesh = importWatchResult.meshes[0];

        const skeleton = importWatchResult.skeletons[0];
        this._bodyBone = skeleton.bones[skeleton.getBoneIndexByName("Bone")];

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

        const screen = scene.getMeshByName("screen")!;
        const screenTexture = AdvancedDynamicTexture.CreateForMeshTexture(screen);
        screenTexture.vScale = -1;
        screenTexture.wrapV = Texture.WRAP_ADDRESSMODE;
        (screen.material as PBRMaterial)!.emissiveTexture = screenTexture;

        const hoursMinutes = new TextBlock("hoursMinutes", "00:00");
        hoursMinutes.color = "white";
        hoursMinutes.fontSizeInPixels = 160;
        hoursMinutes.widthInPixels = 500;
        hoursMinutes.leftInPixels = -100;
        hoursMinutes.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
        const seconds = new TextBlock("seconds", ":0");
        seconds.color = "white";
        seconds.fontSizeInPixels = 60;
        seconds.leftInPixels = 200;
        seconds.topInPixels = 35;
        seconds.widthInPixels = 100;
        seconds.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
            while (true) {
                const date = new Date();
                let hours = date.getHours() % 12;
                hoursMinutes.text = (hours === 0 ? 12 : hours) + ":" + ("00" + date.getMinutes().toString()).slice(-2);
                seconds.text = ":" + ("00" + date.getSeconds()).slice(-2);
                yield Tools.DelayAsync(1000);
            }
        }());
        screenTexture.addControl(hoursMinutes);
        screenTexture.addControl(seconds);

        this._hotspot0 = scene.getTransformNodeByName("hotspot_0")!;
        this._hotspot1 = scene.getTransformNodeByName("hotspot_1")!;
        this._hotspot2 = scene.getTransformNodeByName("hotspot_2")!;
        this._hotspot0Visibility = this._hotspot0.getChildTransformNodes()[0];
        this._hotspot1Visibility = this._hotspot1.getChildTransformNodes()[0];
        this._hotspot2Visibility = this._hotspot2.getChildTransformNodes()[0];

        this.hotspot0State = new HotspotState();
        this.hotspot1State = new HotspotState();
        this.hotspot2State = new HotspotState();
        this.onHotspotsUpdatedObservable = new Observable();

        this._state = WatchState.Overall;
    }

    public static async createAsync(scene: Scene, params: IVaporwearExperienceParams): Promise<Watch> {
        const importWatchResult = await SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatch, scene);
        return new Watch(scene, importWatchResult);
    }

    public setState(newState: WatchState): void {
        if (newState === this._state) {
            return;
        }

        let frame = 0;
        if (WatchStateHelpers.IsUpState(this._state) && !WatchStateHelpers.IsUpState(newState)) {
            if (this._animationWatchSpinUp.isPlaying) {
                frame = this._animationWatchSpinUp.animatables[0].masterFrame;
                this._animationWatchSpinUp.stop();
            } else {
                frame = this._animationWatchSpinDown.to;
            }
            this._animationWatchSpinDown.play(false);
            this._animationWatchSpinDown.goToFrame(this._animationWatchSpinDown.to - frame);
        } else if (!WatchStateHelpers.IsUpState(this._state) && WatchStateHelpers.IsUpState(newState)) {
            if (this._animationWatchSpinDown.isPlaying) {
                frame = this._animationWatchSpinDown.animatables[0].masterFrame;
                this._animationWatchSpinDown.stop();
            } else {
                frame = this._animationWatchSpinUp.to;
            }
            this._animationWatchSpinUp.play(false);
            this._animationWatchSpinUp.goToFrame(this._animationWatchSpinUp.to - frame);
        }

        switch (newState) {
            case WatchState.Overall:
                this._animationOrbitOverall.play(true);
                this._animationOrbitClasp.play(true);
                this._animationOrbitFace.play(true);
                this._animationOrbitLevitate.stop();
                this._animationHotspot0Visibility.play(true);
                this._animationHotspot1Visibility.play(true);
                break;
            case WatchState.Clasp:
                this._animationOrbitOverall.play(true);
                this._animationOrbitClasp.play(true);
                this._animationOrbitFace.play(true);
                this._animationOrbitLevitate.stop();
                this._animationHotspot0Visibility.play(true);
                this._animationHotspot1Visibility.play(true);
                this.getScene().onBeforeRenderObservable.runCoroutineAsync(this._updateClaspHotspotVisibilityCoroutine());
                break;
            case WatchState.Face:
                this._animationOrbitOverall.play(true);
                this._animationOrbitClasp.play(true);
                this._animationOrbitFace.play(true);
                this._animationOrbitLevitate.stop();
                this._animationHotspot0Visibility.play(true);
                this._animationHotspot1Visibility.play(true);
                break;
            case WatchState.Levitate:
                this._animationOrbitOverall.stop();
                this._animationOrbitClasp.stop();
                this._animationOrbitFace.stop();
                this._animationOrbitLevitate.play(true);
                this._animationHotspot0Visibility.stop();
                this._animationHotspot1Visibility.stop();
                break;
            case WatchState.Configure:
                this._animationOrbitOverall.stop();
                this._animationOrbitClasp.stop();
                this._animationOrbitFace.stop();
                this._animationOrbitLevitate.stop();
                this._animationHotspot0Visibility.stop();
                this._animationHotspot1Visibility.stop();
                this.getScene().onBeforeRenderObservable.runCoroutineAsync(this._updateConfigureHotspotVisibilityCoroutine());
                break;
        }

        this._state = newState;
        return;
    }

    private *_updateClaspHotspotVisibilityCoroutine() {
        const scene = this.getScene();
        const engine = scene.getEngine();
        let renderWidth = -1;
        let renderHeight = -1;
        while (this._state === WatchState.Clasp) {
            const camera = scene.activeCamera!;
            const cameraViewProjMat = camera.getTransformationMatrix();
            renderWidth = engine.getRenderWidth();
            renderHeight = engine.getRenderHeight();

            const vec = TmpVectors.Vector3[1];

            this.hotspot0State.isVisible = this._hotspot0Visibility.position.x > 0.01;
            Vector3.ProjectToRef(this._hotspot0.absolutePosition, Matrix.IdentityReadOnly, cameraViewProjMat, camera.viewport, vec);
            this.hotspot0State.position.copyFromFloats(vec.x * renderWidth, vec.y * renderHeight);
            
            this.hotspot1State.isVisible = this._hotspot1Visibility.position.x > 0.01;
            Vector3.ProjectToRef(this._hotspot1.absolutePosition, Matrix.IdentityReadOnly, cameraViewProjMat, camera.viewport, vec);
            this.hotspot1State.position.copyFromFloats(vec.x * renderWidth, vec.y * renderHeight);

            this.onHotspotsUpdatedObservable.notifyObservers();

            yield;
        }

        this.hotspot0State.isVisible = false;
        this.hotspot1State.isVisible = false;
    }

    private *_updateConfigureHotspotVisibilityCoroutine() {
        const scene = this.getScene();
        const engine = scene.getEngine();
        let renderWidth = -1;
        let renderHeight = -1;
        while (this._state === WatchState.Configure) {
            const camera = scene.activeCamera!;
            const cameraWorldMat = camera.getWorldMatrix();
            const cameraViewProjMat = camera.getTransformationMatrix();
            const cameraPos = TmpVectors.Vector3[0];
            renderWidth = engine.getRenderWidth();
            renderHeight = engine.getRenderHeight();
            cameraPos.copyFromFloats(cameraWorldMat.m[12], cameraWorldMat.m[13], cameraWorldMat.m[14]);

            const vec = TmpVectors.Vector3[1];

            cameraPos.subtractToRef(this._hotspot2.absolutePosition, vec);
            vec.normalize();
            this.hotspot2State.isVisible = Vector3.Dot(vec, this._hotspot2.right) > this._hotspot2Visibility.position.x;
            Vector3.ProjectToRef(this._hotspot2.absolutePosition, Matrix.IdentityReadOnly, cameraViewProjMat, camera.viewport, vec);
            this.hotspot2State.position.copyFromFloats(vec.x * renderWidth, vec.y * renderHeight);

            this.onHotspotsUpdatedObservable.notifyObservers();

            yield;
        }

        this.hotspot2State.isVisible = false;
    }

    public attachToBodyBone(mesh: AbstractMesh): void {
        mesh.attachToBone(this._bodyBone, this._rootMesh);
    }
}
