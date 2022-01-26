import { ArcRotateCamera, Quaternion, Scene, TransformNode, Vector3, Vector4 } from "@babylonjs/core";
import { ThinSprite } from "@babylonjs/core/Sprites/thinSprite";
import { IVaporwearExperienceParams } from "./iVaporwearExperienceParams";

export class ShowroomCamera extends TransformNode {
    private _camera: ArcRotateCamera;

    private _trackingTransform: TransformNode;
    private _trackingFormerPosition: Vector3;
    private _trackingFormerUp: Vector3;
    private _trackingFormerFocus: Vector3;
    private _trackingTransformReset: boolean;

    public constructor(scene: Scene, trackingTransform: TransformNode, params: IVaporwearExperienceParams) {
        super("showroomCameraRoot", scene);
        this.rotationQuaternion = Quaternion.Identity();

        this._camera = new ArcRotateCamera("showroomCamera", -Math.PI / 2, Math.PI / 2, 0, Vector3.Zero(), scene, true);
        this._camera.upperBetaLimit = Math.PI - 0.2;
        this._camera.lowerBetaLimit = 0.2;
        this._camera.minZ = 0.01;
        this._camera.maxZ = 100;
        this._camera.parent = this;

        this._trackingTransform = trackingTransform;
        this._trackingFormerFocus = new Vector3();
        this._trackingFormerPosition = new Vector3();
        this._trackingFormerUp = new Vector3();
        this._trackingTransformReset = false;

        scene.onBeforeRenderObservable.runCoroutineAsync(this._trackingCoroutine());
    }

    public activate(): void {
        this._activateAsync();
    }

    public deactivate(): void {
        this._deactivateAsync();
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

    private *_animateCameraCoroutine(alpha0: number, alpha1: number, beta0: number, beta1: number, radius0: number, radius1: number) {
        let t: number;
        const FRAMES_COUNT = 60;
        for (let idx = 0; idx <= FRAMES_COUNT; ++idx) {
            t = idx / FRAMES_COUNT;
            this._camera.alpha = (1 - t) * alpha0 + t * alpha1;
            this._camera.beta = (1 - t) * beta0 + t * beta1;
            this._camera.radius = (1 - t) * radius0 + t * radius1;
            yield;
        }
    }

    private _truncateAlphaAndBeta(): void {
        const alphaSign = Math.sign(this._camera.alpha);
        const betaSign = Math.sign(this._camera.beta);

        this._camera.alpha *= alphaSign;
        this._camera.beta *= betaSign;

        const FULL_CIRCLE = Math.PI * 2;
        this._camera.alpha = (this._camera.alpha + FULL_CIRCLE) % FULL_CIRCLE;
        this._camera.beta = (this._camera.beta + FULL_CIRCLE) % FULL_CIRCLE;

        if (this._camera.alpha > Math.PI) {
            this._camera.alpha -= FULL_CIRCLE;
        }
        if (this._camera.beta > Math.PI) {
            this._camera.beta -= FULL_CIRCLE;
        }
        
        this._camera.alpha *= alphaSign;
        this._camera.beta *= betaSign;
    }

    private async _activateAsync(): Promise<void> {
        this._truncateAlphaAndBeta();
        const alpha0 = this._camera.alpha;
        const beta0 = this._camera.beta;
        const radius0 = this._camera.radius;

        const alpha1 = -Math.PI / 2;
        const beta1 = 1;
        const radius1 = 7;

        const animateCoroutine = this._animateCameraCoroutine(alpha0, alpha1, beta0, beta1, radius0, radius1);
        await this._scene.onBeforeRenderObservable.runCoroutineAsync(animateCoroutine);
        
        this._camera.lowerRadiusLimit = 2;
        this._camera.attachControl();
    }

    private async _deactivateAsync(): Promise<void> {
        this._truncateAlphaAndBeta();
        const alpha0 = this._camera.alpha;
        const beta0 = this._camera.beta;
        const radius0 = this._camera.radius;

        const alpha1 = -Math.PI / 2;
        const beta1 = Math.PI / 2;
        const radius1 = 0;

        this._camera.lowerRadiusLimit = 0;
        this._camera.detachControl();

        const animateCoroutine = this._animateCameraCoroutine(alpha0, alpha1, beta0, beta1, radius0, radius1);
        await this._scene.onBeforeRenderObservable.runCoroutineAsync(animateCoroutine);
    }

    private getFocusToRef(transformNode: TransformNode, focus: Vector3)
    {
        focus.copyFrom(transformNode.absolutePosition);
        transformNode.forward.scaleAndAddToRef(transformNode.position.length(), focus);
    }
}