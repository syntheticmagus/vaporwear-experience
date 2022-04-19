import { ISceneLoaderAsyncResult, SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export class WatchStuds {
    private readonly _mesh: AbstractMesh;
    public get Mesh(): AbstractMesh {
        return this._mesh;
    }

    private constructor(importloadStudsResult: ISceneLoaderAsyncResult) {
        this._mesh = importloadStudsResult.meshes[0];
        this._mesh.position.y = 1;
    }

    public static async CreateAsync(scene: Scene, params: IVaporwearExperienceParams): Promise<WatchStuds> {
        const importStudsResult = await SceneLoader.ImportMeshAsync("", params.assetUrlRoot, params.assetUrlWatchStuds, scene);

        const fireTexture = CubeTexture.CreateFromPrefilteredData(params.assetUrlRoot + params.assetUrlDiamondFireTexture, scene);
        (scene.getMaterialByName("diamond_fire") as PBRMaterial).reflectionTexture = fireTexture;

        return new WatchStuds(importStudsResult);
    }
}
