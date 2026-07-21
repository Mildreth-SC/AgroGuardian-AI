export function diseaseImage(slug: string, image?: string) {
  return image ?? `/samples/${slug}.svg`;
}
