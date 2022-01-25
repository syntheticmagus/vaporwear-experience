import { AnimationGroup, ISceneLoaderAsyncResult, Scene, SceneLoader, TransformNode } from "@babylonjs/core";
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
    private _animationPromiseChain: Promise<void>;

    private constructor (scene: Scene, importMeshResult: ISceneLoaderAsyncResult) {
        super("watchRoot", scene);

        importMeshResult.meshes[0].parent = this;
        
        this._animationState = WatchAnimationState.Up;
        this._animationPromiseChain = Promise.resolve();

        this._animationSpinDown = importMeshResult.animationGroups[0];
        this._animationSpinDown.stop();
        this._animationSpinDown.loopAnimation = false;
        
        this._animationSpinUp = importMeshResult.animationGroups[1];
        this._animationSpinUp.stop();
        this._animationSpinUp.loopAnimation = false;
    }

    public static async createAsync(scene: Scene, params: IVaporwearExperienceParams): Promise<Watch> {
        const importMeshResult = await SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatch, scene);
        return new Watch(scene, importMeshResult);
    }

    public spinDown(): void {
        this._animationPromiseChain = this._animationPromiseChain.then(() => {
            return new Promise((resolve) => {
                if (this._animationState === WatchAnimationState.Up) {
                    this._animationSpinDown.onAnimationGroupEndObservable.addOnce(() => {
                        this._animationState = WatchAnimationState.Down;
                        resolve();
                    });
                    this._animationState = WatchAnimationState.Animating;
                    this._animationSpinDown.play();
                }
                else {
                    resolve();
                }
            });
        });
    }

    public spinUp(): void {
        this._animationPromiseChain = this._animationPromiseChain.then(() => {
            return new Promise((resolve) => {
                if (this._animationState === WatchAnimationState.Down) {
                    this._animationSpinUp.onAnimationGroupEndObservable.addOnce(() => {
                        this._animationState = WatchAnimationState.Up;
                        resolve();
                    });
                    this._animationState = WatchAnimationState.Animating;
                    this._animationSpinUp.play();
                }
                else {
                    resolve();
                }
            });
        });
    }
}