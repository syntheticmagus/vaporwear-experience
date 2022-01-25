import { AbstractMesh, Color3, CubeTexture, Engine, FreeCamera, PBRMaterial, Scene, SceneLoader, Tools, TransformNode, Vector3 } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
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

        watch.spinDown();
        watch.spinUp();
        watch.spinDown();
        watch.spinDown();
        watch.spinUp();

        /*await SceneLoader.AppendAsync("http://localhost:8181/watch.glb", undefined, scene);
        const spinUp = scene.getAnimationGroupByName("spin-up")!;
        const spinDown = scene.getAnimationGroupByName("spin-down")!;
        spinUp.stop();
        spinUp.loopAnimation = false;
        spinDown.stop();
        spinDown.loopAnimation = false;
        Tools.DelayAsync(5000).then(() => {
            spinDown.play();
            return Tools.DelayAsync(5000);
        }).then(() => {
            spinUp.play();
        });

        await SceneLoader.AppendAsync("http://localhost:8181/diamond.glb", undefined, scene);
        const diamond = scene.getMeshByName("diamond")!;
        const diamondRoot = (diamond.parent! as AbstractMesh);
        
        const fireMat = scene.getMaterialById("diamond_fire")! as PBRMaterial;
        fireMat.reflectionTexture = fireTexture;
        fireMat.refractionTexture = fireTexture;

        scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
            diamond.rotate(Vector3.RightReadOnly, 0.4);
            diamondRoot.position.y += 3.1;
            diamondRoot.scaling.scaleInPlace(0.1);

            while (true) {
                diamondRoot.rotate(Vector3.UpReadOnly, 0.01);
                yield;
            }
        }());*/

        scene.createDefaultCamera(true, true, true);
        
        /*const names = ["camera_overall", "camera_clasp", "camera_face", "camera_levitate"];
        const camera = new FreeCamera("freeCamera", Vector3.Zero(), scene, true);
        const cameraParent = scene.getTransformNodeByName(names[3])!;
        cameraParent.scaling.z *= -1;
        cameraParent.rotate(Vector3.RightReadOnly, -Math.PI / 2);
        camera.parent = cameraParent;
        camera.minZ = 0.01;
        camera.fov = 0.5;
        scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
            while (true) {
                (cameraParent.parent! as TransformNode).rotate(Vector3.UpReadOnly, 0.01);
                yield;
            }
        }());*/

        return scene;
    }
}
