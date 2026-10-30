/** Equirectangular geographic coordinates, +y north, longitude zero at +z. */
export const atlasPoint = (longitude: number, latitude: number, radius = 1): [number, number, number] => {
  const lon = longitude * Math.PI / 180, lat = latitude * Math.PI / 180;
  return [radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon)];
};
