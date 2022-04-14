/**
 * The parameters required to create a VaporwearExperience.
 */
export interface IVaporwearExperienceParams {
    /**
     * The canvas using which the experience will be rendered.
     */
    canvas: HTMLCanvasElement;

    /**
     * Root URL to be prepended to asset URLs.
     */
    assetUrlRoot: string;

    /**
     * Suffix URL which, appended to the assetUrlRoot, specifies the location of the watch glTF.
     */
    assetUrlWatch: string;

    /**
     * Suffix URL which, appended to the assetUrlRoot, specifies the location of the watch studs glTF.
     */
    assetUrlWatchStuds: string;

    /**
     * Suffix URL which, appended to the assetUrlRoot, specifies the location of the additional assets glTF.
     */
    assetUrlWatchMaterials: string;

    /**
     * Suffix URL which, appended to the assetUrlRoot, specifies the location of the scene IBL.
     */
    assetUrlEnvironmentTexture: string;

    /**
     * Suffix URL which, appended to the assetUrlRoot, specifies the location of the diamond fire IBL.
     */
    assetUrlDiamondFireTexture: string;
}
