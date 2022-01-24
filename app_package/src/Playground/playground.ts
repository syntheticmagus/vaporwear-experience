import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
        var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

        const outdoorTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("http://localhost:8181/outdoor.env", scene);
        const fireTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("http://localhost:8181/diamond_fire.env", scene);
        scene.environmentTexture = outdoorTexture;

        const mat = new BABYLON.PBRMaterial("", scene);
        mat.metallic = 1;
        mat.roughness = 1;
        mat.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.4);
        sphere.material = mat;
        ground.material = mat;

        BABYLON.SceneLoader.AppendAsync("http://localhost:8181/diamond.glb", undefined, scene).then(() => {
            const diamond = scene.getMeshByName("diamond")!;
            const diamondRoot = (diamond.parent! as BABYLON.AbstractMesh);
            const diamondMat = diamond.material as BABYLON.PBRMaterial;
            //diamondMat.albedoColor = new BABYLON.Color3(1, 1, 0);
            
            const fireMat = scene.getMeshByName("fire")!.material as BABYLON.PBRMaterial;
            fireMat.reflectionTexture = fireTexture;
            fireMat.refractionTexture = fireTexture;

            scene.onBeforeRenderObservable.runCoroutineAsync(function* () {
                diamond.rotate(BABYLON.Vector3.RightReadOnly, 0.4);
                diamondRoot.position.y += 2.1;
                diamondRoot.scaling.scaleInPlace(0.1);
                while (true) {
                    diamondRoot.rotate(BABYLON.Vector3.UpReadOnly, 0.01);
                    yield;
                }
            }());
        });

        scene.createDefaultCamera(true, true, true);
        
        const bloom = new BABYLON.BloomEffect(scene, 100, 100, 10);
        bloom.threshold = 0.1;

        return scene;
    }
}

export function CreatePlaygroundScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    return Playground.CreateScene(engine, canvas);
}
