import { AnimationGroup, ISceneLoaderAsyncResult, MeshBuilder, Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

enum WatchAnimationState {
    Up,
    Down,
    Animating
}

export class Watch extends TransformNode {
    private _animationSpinDown: AnimationGroup;
    private _animationSpinUp: AnimationGroup;

    private _animationState: WatchAnimationState;
    private _animationTargetState: WatchAnimationState;

    private _cameraParentOverall: TransformNode;
    private _cameraParentClasp: TransformNode;
    private _cameraParentFace: TransformNode;
    private _cameraParentLevitate: TransformNode;

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
        
        this._animationState = WatchAnimationState.Up;
        this._animationTargetState = WatchAnimationState.Up;

        this._animationSpinDown = importMeshResult.animationGroups[0];
        this._animationSpinDown.stop();
        this._animationSpinDown.loopAnimation = false;
        
        this._animationSpinUp = importMeshResult.animationGroups[1];
        this._animationSpinUp.stop();
        this._animationSpinUp.loopAnimation = false;

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
        scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
            while (true) {
                cameraParents.forEach((parent) => {
                    (parent.parent! as TransformNode).rotate(Vector3.UpReadOnly, 0.01);
                });
                yield;
            }
        }());
    }

    public static async createAsync(scene: Scene, params: IVaporwearExperienceParams): Promise<Watch> {
        const importMeshResult = await SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatch, scene);
        return new Watch(scene, importMeshResult);
    }

    private _animateIfNeeded(): void {
        if (this._animationState === WatchAnimationState.Animating || this._animationState === this._animationTargetState) {
            // Animation will continue until we're in the right state, so if we're 
            // already animating then getting to the right state will be handled.
            // Also, if we're already in the right state, obviously nothing needs 
            // to be done.
            return;
        }

        const animation = this._animationTargetState === WatchAnimationState.Up ? this._animationSpinUp : this._animationSpinDown;
        const target = this._animationTargetState;
        animation.onAnimationGroupEndObservable.addOnce(() => {
            // Note: this takes a hard dependency on the single-threaded nature of 
            // JavaScript making this callback uninterruptable. If it weren't for
            // that, it would be dangerous to switch this._animationState out of
            // WatchAnimationState.Animating.
            this._animationState = target;
            this._animateIfNeeded();
        });
        animation.play();
    }

    public setPoseDown(): void {
        this._animationTargetState = WatchAnimationState.Down;
        this._animateIfNeeded();
    }

    public setPoseUp(): void {
        this._animationTargetState = WatchAnimationState.Up;
        this._animateIfNeeded();
    }
}
