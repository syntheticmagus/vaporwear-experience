import { ArcFollowCamera, ArcRotateCamera, Camera, FreeCamera, Matrix, Quaternion, Scene, TransformNode, Vector3, Vector4 } from "@babylonjs/core";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export class ShowroomCamera extends TransformNode {
    private _configCamera: ArcRotateCamera;
    private _showCamera: FreeCamera;

    private _trackingTransform: TransformNode;
    private _trackingFormerPosition: Vector3;
    private _trackingFormerUp: Vector3;
    private _trackingFormerFocus: Vector3;
    private _trackingTransformReset: boolean;

    public constructor(scene: Scene, trackingTransform: TransformNode, params: IVaporwearExperienceParams) {
        super("configCameraRoot", scene);
        this.rotationQuaternion = Quaternion.Identity();

        this._configCamera = new ArcRotateCamera("configCamera", -Math.PI / 2, Math.PI / 2, 0, Vector3.Zero(), scene, false);
        this._configCamera.rotationQuaternion = Quaternion.Identity();
        this._configCamera.upperBetaLimit = Math.PI - 0.2;
        this._configCamera.lowerBetaLimit = 0.2;
        this._configCamera.minZ = 0.01;
        this._configCamera.maxZ = 100;
        this._configCamera.fov = 0.6;
        
        this._showCamera = new FreeCamera("showCamera", Vector3.Zero(), scene, true);
        this._showCamera.minZ = 0.01;
        this._showCamera.maxZ = 100;
        this._showCamera.fov = 0.6;
        this._showCamera.parent = this;

        this._trackingTransform = trackingTransform;
        this._trackingFormerFocus = new Vector3();
        this._trackingFormerPosition = new Vector3();
        this._trackingFormerUp = new Vector3();
        this._trackingTransformReset = false;

        scene.onBeforeRenderObservable.runCoroutineAsync(this._trackingCoroutine());
    }

    public activate(): void {
        const target = new Vector3();
        this.getFocusToRef(this._trackingTransform, target);

        this._configCamera.radius = 0;
        this._configCamera.alpha = -Math.PI / 2;
        this._configCamera.beta = Math.PI / 2;
        this._configCamera.position.copyFrom(this.position);
        this._configCamera.setTarget(target);
        
        this._scene.setActiveCameraByName("configCamera");
        this._trackingTransform = this;
        this._configCamera.attachControl();
    }

    public deactivate(): void {
        const cameraWorldMatrix = this._configCamera.getWorldMatrix();
        this.position.copyFromFloats(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);
        const forward = new Vector3(
            cameraWorldMatrix.m[8],
            cameraWorldMatrix.m[9],
            cameraWorldMatrix.m[10]);
        const up = new Vector3(
            cameraWorldMatrix.m[4],
            cameraWorldMatrix.m[5],
            cameraWorldMatrix.m[6]);
        Quaternion.FromLookDirectionRHToRef(forward, up, this.rotationQuaternion!);
        this._scene.setActiveCameraByName("showCamera");
        this._trackingTransform = this;
        this._configCamera.detachControl();
    }

    public setTrackingTransform(trackingTransform: TransformNode): void {
        if (this._trackingTransform !== trackingTransform) {
            this._trackingFormerPosition.copyFrom(this.position);
            this.getFocusToRef(this._trackingTransform, this._trackingFormerFocus);
            this._trackingFormerUp.copyFrom(this.up);

            this._trackingTransform = trackingTransform;
            this._trackingTransformReset = true;
        }
    }

    private *_trackingCoroutine() {
        while (true) {
            if (this._trackingTransformReset) {
                this._trackingTransformReset = false;

                const trackingFocus = new Vector3();
                const interpolatedFocus = new Vector3();
                const interpolatedUp = new Vector3();
                const forward = new Vector3();
                const right = new Vector3();
                const up = new Vector3();
                let t;
                const MAX_FRAME = 60;
                for (let frame = 0; frame <= MAX_FRAME && !this._trackingTransformReset; ++frame) {
                    t = frame / MAX_FRAME;

                    Vector3.LerpToRef(this._trackingFormerPosition, this._trackingTransform.absolutePosition, t, this.position);

                    // Get interpolated values for focus and up.
                    this.getFocusToRef(this._trackingTransform, trackingFocus);
                    Vector3.LerpToRef(this._trackingFormerFocus, trackingFocus, t, interpolatedFocus);
                    Vector3.SlerpToRef(this._trackingFormerUp, this._trackingTransform.up, t, interpolatedUp);

                    // Solve for forward and up.
                    interpolatedFocus.subtractToRef(this.position, forward);
                    forward.normalize();
                    up.copyFrom(interpolatedUp);
                    up.normalize();
                    Vector3.CrossToRef(forward, up, right);
                    right.normalize();
                    Vector3.CrossToRef(right, forward, up);
                    
                    Quaternion.FromLookDirectionRHToRef(forward, up, this.rotationQuaternion!);
                    
                    yield;
                }
            }

            while (!this._trackingTransformReset) {
                if (this._trackingTransform) {
                    this.position.copyFrom(this._trackingTransform.absolutePosition);
                    this.rotationQuaternion!.copyFrom(this._trackingTransform.absoluteRotationQuaternion);
                }
                yield;
            }
        }
    }

    private getFocusToRef(transformNode: TransformNode, focus: Vector3)
    {
        focus.copyFrom(transformNode.absolutePosition);
        transformNode.forward.scaleAndAddToRef(transformNode.position.length(), focus);
    }
}