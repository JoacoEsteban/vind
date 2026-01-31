export function getOverlayBuildLabel(
  buildLabel: string,
  isProd: boolean,
): string | null {
  return isProd ? null : buildLabel
}

export function getPopupTitle(buildLabel: string | null): string {
  return buildLabel ?? 'Vind'
}
