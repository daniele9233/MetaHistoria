import { PAGES, findPage, type ManifestPage } from '../content/content';
import { SECTIONS } from '../content/sections';
import legacy from '../../globe-source/src/data.json';
import { atlasPoint } from './geographicMath';
export { atlasPoint } from './geographicMath';

export type AtlasMode = 'topics' | 'places';
export interface AtlasNode {
  id: string; page: ManifestPage; label: string; group: string; color: string;
  position: [number, number, number]; parentPath: string | null;
  related: ManifestPage[];
}
const colors = ['#c6ab7d', '#9cb6ad', '#b5a0b6', '#c5aa91', '#b9957d', '#d7cbb3', '#9eafbb', '#c2bba5'];
// Duplicate legacy paths are intentional aliases of the same document, not extra nodes.
const pages = Array.from(new Map(PAGES.filter(p => p.category !== 'home').map(p => [p.path, p])).values());
const categories = Array.from(new Set(pages.map(p => p.category)));
export const categoryLabel = (category: string) => SECTIONS.find(s => s.id === category)?.title || pages.find(p => p.path === `/${category}`)?.title || category.replace(/-/g, ' ');

/** Theme placement encodes the actual editorial taxonomy, never geographic claims.
 * A cluster's central document and its descendants share a spherical neighbourhood. */
const topics: AtlasNode[] = pages.map(page => {
  const groupIndex = categories.indexOf(page.category);
  const members = pages.filter(p => p.category === page.category);
  const index = members.indexOf(page);
  const hubLon = -145 + groupIndex * (360 / categories.length);
  const hubLat = groupIndex % 2 ? -27 : 30;
  const angle = index * 2.399963229728653;
  const radius = index === 0 ? 0 : 6 + 24 * Math.sqrt(index / Math.max(1, members.length - 1));
  return { id: page.id, page, label: page.title, group: page.category, color: colors[groupIndex % colors.length],
    position: atlasPoint(hubLon + Math.cos(angle) * radius, hubLat + Math.sin(angle) * radius),
    parentPath: page.parentPath, related: [] };
});

/** Geographic anchors are inherited from the existing, explicit editorial mapping.
 * Titles, IDs, links and preview text always resolve through the live archive. */
const places: AtlasNode[] = legacy.nodes.flatMap(place => {
  const page = findPage(place.path);
  if (!page) return [];
  const other = findPage('animaPath' in place ? String(place.animaPath) : '');
  return [{ id: page.id, page, label: place.name, group: 'Luoghi dei dossier', color: '#d0b17d',
    position: atlasPoint(place.coords[0], place.coords[1]), parentPath: null,
    related: other ? [other] : [] }];
});
export const ATLAS = { topics, places };
export const ATLAS_COUNTS = { articles: topics.length, places: places.length, categories: categories.length };
