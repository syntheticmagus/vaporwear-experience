import { Color3, CubeTexture, Engine, Observable, PBRMaterial, Scene, SceneLoader, TransformNode } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";
import { Watch, WatchState } from "./watch";
import { IShowroomCameraArcRotateState, IShowroomCameraMatchmoveState, ShowroomCamera } from "@syntheticmagus/showroom-camera";
import { AdvancedDynamicTexture, CheckboxGroup, RadioGroup, Rectangle, SelectionPanel } from "@babylonjs/gui";
import { WatchStuds } from "./watchStuds";
import { GLTFFileLoader } from "@babylonjs/loaders";

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
                this._camera.animateToMatchmoveState(this._overallState, 0.7);
                break;
            case ShowroomState.Clasp:
                this._watch.setState(WatchState.Clasp);
                this._camera.animateToMatchmoveState(this._claspState, 0.7);
                break;
            case ShowroomState.Face:
                this._watch.setState(WatchState.Face);
                this._camera.animateToMatchmoveState(this._faceState, 0.7);
                break;
            case ShowroomState.Levitate:
                this._watch.setState(WatchState.Levitate);
                this._camera.animateToMatchmoveState(this._levitateState, 0.7);
                break;
            case ShowroomState.Configure:
                this._watch.setState(WatchState.Configure);
                this._camera.animateToArcRotateState(this._configureState, 0.7);
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
        SceneLoader.OnPluginActivatedObservable.addOnce((plugin) => {
            const loader = plugin as GLTFFileLoader;
            if (!loader) {
                return;
            }

            var specularOverAlpha = false;
            var radianceOverAlpha = false;

            loader.transparencyAsCoverage = true;
            loader.onMaterialLoaded = (material) => {
                specularOverAlpha = specularOverAlpha || (material as PBRMaterial).useSpecularOverAlpha;
                radianceOverAlpha = radianceOverAlpha || (material as PBRMaterial).useRadianceOverAlpha;
            };
        });

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

    public createDebugtUI(): void {
        const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("guiTexture", true, this._scene);
        guiTexture.idealHeight = 700;
        guiTexture.idealWidth = guiTexture.idealHeight * 16 / 9;

        const hotspot0 = new Rectangle("hotspot0");
        hotspot0.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_TOP;
        hotspot0.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT;
        hotspot0.color = "red";
        hotspot0.widthInPixels = 10;
        hotspot0.heightInPixels = 10;
        guiTexture.addControl(hotspot0);

        const hotspot1 = new Rectangle("hotspot1");
        hotspot1.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_TOP;
        hotspot1.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT;
        hotspot1.color = "blue";
        hotspot1.widthInPixels = 10;
        hotspot1.heightInPixels = 10;
        guiTexture.addControl(hotspot1);

        let showHotspots = false;
        this._scene.onBeforeRenderObservable.add(() => {
            hotspot0.isVisible = showHotspots && this._watch.hotspot0State.isVisible;
            hotspot0.leftInPixels = this._watch.hotspot0State.position.x;
            hotspot0.topInPixels = this._watch.hotspot0State.position.y;

            hotspot1.isVisible = showHotspots && this._watch.hotspot1State.isVisible;
            hotspot1.leftInPixels = this._watch.hotspot1State.position.x;
            hotspot1.topInPixels = this._watch.hotspot1State.position.y;
        });

        const stateGroup = new RadioGroup("State");
        stateGroup.addRadio("Overall", () => { this.state = ShowroomState.Overall; }, true);
        stateGroup.addRadio("Clasp", () => { this.state = ShowroomState.Clasp; }, false);
        stateGroup.addRadio("Face", () => { this.state = ShowroomState.Face; }, false);
        stateGroup.addRadio("Levitate", () => { this.state = ShowroomState.Levitate; }, false);
        stateGroup.addRadio("Configure", () => { this.state = ShowroomState.Configure; }, false);

        const additionsGroup = new CheckboxGroup("Additions");
        additionsGroup.addCheckbox("Studs", (checked) => { this._studs?.Mesh?.setEnabled(checked); }, false);

        const bandsGroup = new RadioGroup("Bands");
        bandsGroup.addRadio("band_0", () => { this.setMeshMaterialByName("chassis", "band_0"); }, true);
        bandsGroup.addRadio("band_1", () => { this.setMeshMaterialByName("chassis", "band_1"); }, false);
        bandsGroup.addRadio("band_2", () => { this.setMeshMaterialByName("chassis", "band_2"); }, false);
        bandsGroup.addRadio("band_3", () => { this.setMeshMaterialByName("chassis", "band_3"); }, false);
        bandsGroup.addRadio("band_4", () => { this.setMeshMaterialByName("chassis", "band_4"); }, false);
        
        const hotspotsGroup = new CheckboxGroup("Hotspots");
        hotspotsGroup.addCheckbox("Clasp", (checked) => { showHotspots = checked; }, false);

        const leftSelectionPanel = new SelectionPanel("leftSelectionPanel", [stateGroup, additionsGroup, bandsGroup, hotspotsGroup]);
        leftSelectionPanel.verticalAlignment = SelectionPanel.VERTICAL_ALIGNMENT_TOP;
        leftSelectionPanel.horizontalAlignment = SelectionPanel.HORIZONTAL_ALIGNMENT_LEFT;
        leftSelectionPanel.widthInPixels = 200;
        leftSelectionPanel.color = "#000000AA";
        leftSelectionPanel.background = "#DDDDDDAA";
        leftSelectionPanel.barColor = "#000000AA";
        
        guiTexture.addControl(leftSelectionPanel);

        const glassGroup = new RadioGroup("Glass");
        glassGroup.addRadio("glass_0", () => { this.setMeshMaterialByName("glass", "glass_0"); }, true);
        glassGroup.addRadio("glass_1", () => { this.setMeshMaterialByName("glass", "glass_1"); }, false);
        glassGroup.addRadio("glass_2", () => { this.setMeshMaterialByName("glass", "glass_2"); }, false);
        glassGroup.addRadio("glass_3", () => { this.setMeshMaterialByName("glass", "glass_3"); }, false);
        glassGroup.addRadio("glass_4", () => { this.setMeshMaterialByName("glass", "glass_4"); }, false);

        const gemGroup = new RadioGroup("Gem");
        gemGroup.addRadio("diamond_face", () => { this.setMeshMaterialByName("diamond", "diamond_face"); }, true);
        gemGroup.addRadio("sapphire_face", () => { this.setMeshMaterialByName("diamond", "sapphire_face"); }, false);
        gemGroup.addRadio("ruby_face", () => { this.setMeshMaterialByName("diamond", "ruby_face"); }, false);
        gemGroup.addRadio("emerald_face", () => { this.setMeshMaterialByName("diamond", "emerald_face"); }, false);

        const settingGroup = new RadioGroup("Setting");
        settingGroup.addRadio("setting_gold", () => { this.setMeshMaterialByName("setting", "setting_gold"); }, true);
        settingGroup.addRadio("setting_silver", () => { this.setMeshMaterialByName("setting", "setting_silver"); }, false);
        settingGroup.addRadio("setting_copper", () => { this.setMeshMaterialByName("setting", "setting_copper"); }, false);
        settingGroup.addRadio("setting_iron", () => { this.setMeshMaterialByName("setting", "setting_iron"); }, false);

        const rightSelectionPanel = new SelectionPanel("rightSelectionPanel", [glassGroup, gemGroup, settingGroup]);
        rightSelectionPanel.verticalAlignment = SelectionPanel.VERTICAL_ALIGNMENT_TOP;
        rightSelectionPanel.horizontalAlignment = SelectionPanel.HORIZONTAL_ALIGNMENT_RIGHT;
        rightSelectionPanel.widthInPixels = 200;
        rightSelectionPanel.color = "#000000AA";
        rightSelectionPanel.background = "#DDDDDDAA";
        rightSelectionPanel.barColor = "#000000AA";

        guiTexture.addControl(rightSelectionPanel);
    }
}
