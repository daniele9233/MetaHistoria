import * as THREE from 'three';
import { atlasPoint } from './geographicMath';

export const RELIEF_SCALE = .037;
export interface ElevationRaster { pixels: Uint8Array; width: number; height: number }

/** NASA land elevations encode 0–6,400 m. Longitude and latitude stay true;
 * only vertical scale is amplified for the editorial view. */
export function elevationAt(raster: ElevationRaster, longitude: number, latitude: number) {
  const u = ((longitude + 180) / 360 % 1 + 1) % 1;
  const v = Math.max(0, Math.min(1, (90 - latitude) / 180));
  const x = u * (raster.width - 1), y = v * (raster.height - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, raster.width - 1), y1 = Math.min(y0 + 1, raster.height - 1);
  const fx = x - x0, fy = y - y0, data = raster.pixels;
  const a = data[y0 * raster.width + x0] * (1 - fx) + data[y0 * raster.width + x1] * fx;
  const b = data[y1 * raster.width + x0] * (1 - fx) + data[y1 * raster.width + x1] * fx;
  const height = (a * (1 - fy) + b * fy) / 255;
  return height < .008 ? 0 : height;
}

const axis = (min: number, max: number, base: number, detailMin: number, detailMax: number, detail: number) => {
  const values = new Set<number>();
  for (let i = 0; i <= base; i++) values.add(min + (max - min) * i / base);
  for (let i = 0; i <= detail; i++) values.add(detailMin + (detailMax - detailMin) * i / detail);
  return [...values].sort((a, b) => a - b);
};

/** Extra samples around the Mediterranean, one continuous UV grid. */
export function createReliefGeometry(raster: ElevationRaster, high: boolean) {
  const lon = axis(-180, 180, high ? 384 : 192, -20, 65, high ? 640 : 320);
  const lat = axis(-90, 90, high ? 192 : 96, 20, 66, high ? 384 : 192);
  const columns = lon.length, rows = lat.length;
  const positions = new Float32Array(columns * rows * 3), uv = new Float32Array(columns * rows * 2);
  const normals = new Float32Array(positions.length);
  const delta = high ? .12 : .24, derivativeStep = 2 * delta * Math.PI / 180;
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const index = y * columns + x;
    const longitude = lon[x], latitude = lat[y], lambda = longitude * Math.PI / 180, phi = latitude * Math.PI / 180;
    const sl = Math.sin(lambda), cl = Math.cos(lambda), sp = Math.sin(phi), cp = Math.cos(phi);
    const rx = cp * sl, ry = sp, rz = cp * cl;
    const radius = 1 + elevationAt(raster, longitude, latitude) * RELIEF_SCALE;
    positions.set([rx * radius, ry * radius, rz * radius], index * 3);
    // Shade from the geographic height field, not elongated triangles where
    // the global grid meets the denser regional grid. This avoids banding
    // when exploring places outside the Mediterranean.
    const eastSlope = Math.abs(cp) < .01 ? 0 : THREE.MathUtils.clamp((elevationAt(raster, longitude + delta, latitude) - elevationAt(raster, longitude - delta, latitude)) * RELIEF_SCALE / (derivativeStep * radius * cp), -1.6, 1.6);
    const northSlope = THREE.MathUtils.clamp((elevationAt(raster, longitude, latitude + delta) - elevationAt(raster, longitude, latitude - delta)) * RELIEF_SCALE / (derivativeStep * radius), -1.6, 1.6);
    const nx = rx - cl * eastSlope + sp * sl * northSlope;
    const ny = ry - cp * northSlope;
    const nz = rz + sl * eastSlope + sp * cl * northSlope;
    const length = Math.hypot(nx, ny, nz);
    normals.set([nx / length, ny / length, nz / length], index * 3);
    uv.set([(lon[x] + 180) / 360, (lat[y] + 90) / 180], index * 2);
  }
  const indices = new Uint32Array((columns - 1) * (rows - 1) * 6);
  let index = 0;
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < columns - 1; x++) {
    const a = y * columns + x, b = a + 1, c = a + columns, d = c + 1;
    indices.set([a, b, c, b, d, c], index); index += 6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** East / north / radial basis prevents roll when flying between places. */
export function geographicOrientation(longitude: number, latitude: number) {
  const lon = longitude * Math.PI / 180, lat = latitude * Math.PI / 180;
  const east = new THREE.Vector3(Math.cos(lon), 0, -Math.sin(lon));
  const north = new THREE.Vector3(-Math.sin(lat) * Math.sin(lon), Math.cos(lat), -Math.sin(lat) * Math.cos(lon));
  const radial = new THREE.Vector3(...atlasPoint(longitude, latitude));
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, radial)).invert();
}
