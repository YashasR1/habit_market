// WebInfoOverlay.native.tsx
// This file explicitly returns null on Native Android/iOS builds.
// This ensures that the heavy Modal UI required for the Web Simulation is completely stripped from the final APK/IPA bundle.

export const WebInfoOverlay = (props: any) => null;
