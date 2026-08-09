export function getOptimizedImageUrl(src: string | null | undefined, width = 540) {
  if (!src) return '';

  // Match BuyMesho's image strategy: only transform Cloudinary URLs.
  if (!src.includes('res.cloudinary.com') || !src.includes('/upload/')) {
    return src;
  }

  const transformation = `f_auto,q_auto,w_${width},c_limit`;
  return src.replace('/upload/', `/upload/${transformation}/`);
}

export function getValidatorEventImageUrl(
  source: Record<string, unknown> | null | undefined,
  width = 540,
) {
  if (!source) return '';

  const rawImage =
    source.poster_image_url ??
    source.poster_url ??
    source.poster ??
    null;

  return typeof rawImage === 'string' && rawImage.trim()
    ? getOptimizedImageUrl(rawImage.trim(), width)
    : '';
}
