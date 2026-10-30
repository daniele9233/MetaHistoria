import * as THREE from 'three';
import { toCanvas, getFontEmbedCSS } from 'html-to-image';
import { paperPoint } from './paperGeometry';
import { createWebGLRenderer } from './webglRenderer';

let fontCSS: Promise<string> | undefined;
// Copy the properties this editorial renderer uses, rather than hundreds of
// unrelated browser defaults for every word, link and image in a page clone.
const paperStyles = (`box-sizing display position top right bottom left float clear
  width height min-width max-width min-height max-height overflow overflow-x overflow-y
  margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left
  border-top-width border-right-width border-bottom-width border-left-width
  border-top-style border-right-style border-bottom-style border-left-style
  border-top-color border-right-color border-bottom-color border-left-color border-radius
  border-collapse border-spacing table-layout vertical-align
  color background-color background-image background-size background-position background-repeat
  opacity box-shadow text-shadow filter mix-blend-mode isolation z-index
  font-family font-size font-weight font-style font-variant font-feature-settings font-kerning
  font-synthesis-weight font-synthesis-style text-wrap-mode text-wrap-style
  line-height letter-spacing text-align text-transform text-indent text-decoration-line text-decoration-color
  text-decoration-thickness text-underline-offset white-space overflow-wrap word-break hyphens
  list-style-type list-style-position content
  flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self align-content
  justify-content justify-items justify-self gap row-gap column-gap
  grid-template-columns grid-template-rows grid-column grid-row order
  object-fit object-position transform transform-origin visibility`).trim().split(/\s+/);
export async function capturePaper(node: HTMLElement) {
  await document.fonts.ready;
  fontCSS ??= getFontEmbedCSS(node, { preferredFontFormat: 'woff2' }).catch(() => '');
  return toCanvas(node, {
    pixelRatio: Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.75, 1600 / Math.max(1, node.clientWidth)),
    fontEmbedCSS: await fontCSS, skipAutoScale: false,
    includeStyleProperties: paperStyles,
    backgroundColor: '#eee6d6',
    style: { margin: '0', transform: 'none', position: 'relative', left: '0', top: '0', opacity: '1' },
  });
}

/** One on-demand WebGL layer; HTML remains the authoritative resting surface. */
export class PaperRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private geometry = new THREE.PlaneGeometry(1, 1, 56, 14);
  private front = new THREE.MeshStandardMaterial({ roughness: .94, metalness: 0, side: THREE.FrontSide });
  private back = new THREE.MeshStandardMaterial({ roughness: .94, metalness: 0, side: THREE.BackSide });
  private sheet = new THREE.Group();
  private receiver: THREE.Mesh;
  private direction = 1;
  private width: number;
  private height: number;
  private spread: number;
  private textures: THREE.Texture[] = [];
  private light: THREE.DirectionalLight;
  private disposed = false;
  constructor(canvas: HTMLCanvasElement, width: number, height: number, spread: number) {
    this.width = width; this.height = height; this.spread = spread;
    this.renderer = createWebGLRenderer(canvas);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    this.renderer.setSize(width * 2, height, false);
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.OrthographicCamera(-width, width, height / 2, -height / 2, 1, width * 8);
    this.camera.position.z = width * 4;
    this.scene.add(new THREE.AmbientLight(0xfff8e9, 2.2));
    const light = new THREE.DirectionalLight(0xfff3dc, 1.7);
    this.light = light;
    light.position.set(-width * .45, height * .7, width * 2);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, { left: -width, right: width, top: height, bottom: -height, near: 1, far: width * 8 });
    light.shadow.bias = -.00015; light.shadow.normalBias = .4;
    light.shadow.radius = 5;
    this.scene.add(light);
    this.scene.add(light.target);
    (this.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const front = new THREE.Mesh(this.geometry, this.front), back = new THREE.Mesh(this.geometry, this.back);
    front.castShadow = true; back.castShadow = true;
    front.frustumCulled = back.frustumCulled = false;
    this.sheet.add(front, back); this.scene.add(this.sheet);
    this.receiver = new THREE.Mesh(new THREE.PlaneGeometry(width * 2, height), new THREE.ShadowMaterial({ opacity: .18 }));
    this.receiver.position.z = -1.5; this.receiver.receiveShadow = true;
    this.scene.add(this.receiver);
  }
  async warmup() {
    const blank = document.createElement('canvas'); blank.width = blank.height = 2;
    blank.getContext('2d')!.fillRect(0, 0, 2, 2);
    this.setPages(blank, blank, 1);
    // Compile mapped materials and allocate the shadow target while HTML is
    // visible. The first grab should not pay for a new GPU program.
    await this.renderer.compileAsync(this.scene, this.camera);
    if (!this.disposed) this.draw(0);
  }
  setPages(front: HTMLCanvasElement, back: HTMLCanvasElement, direction: number) {
    this.textures.forEach(t => t.dispose());
    this.direction = direction;
    const make = (image: HTMLCanvasElement, mirrored: boolean) => {
      const texture = new THREE.CanvasTexture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      if (mirrored) { texture.repeat.x = -1; texture.offset.x = 1; }
      return texture;
    };
    this.textures = [make(front, direction < 0), make(back, direction > 0)];
    this.front.map = this.textures[0]; this.back.map = this.textures[1];
    // Negative x scale reverses winding; swap the sides for backward turns.
    this.front.side = direction > 0 ? THREE.FrontSide : THREE.BackSide;
    this.back.side = direction > 0 ? THREE.BackSide : THREE.FrontSide;
    this.front.needsUpdate = this.back.needsUpdate = true;
  }
  draw(progress: number, grabY = .5) {
    const width = this.width / this.spread;
    const positions = this.geometry.attributes.position;
    const uv = this.geometry.attributes.uv;
    // The expanded canvas is centred on the spread. Single pages bind at its left.
    const spine = this.spread === 2 ? 0 : -this.width / 2;
    const origin = this.spread === 1 && this.direction < 0 ? this.width / 2 : spine;
    for (let i = 0; i < positions.count; i++) {
      const point = paperPoint(uv.getX(i), uv.getY(i), progress, grabY);
      positions.setXYZ(i, origin + point.x * width * this.direction, point.y * this.height, point.z * width + .5);
    }
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.renderer.render(this.scene, this.camera);
  }
  info() { return { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, textures: this.renderer.info.memory.textures, geometries: this.renderer.info.memory.geometries, programs: this.renderer.info.programs?.length }; }
  dispose() {
    this.disposed = true;
    this.textures.forEach(t => t.dispose());
    this.geometry.dispose(); this.front.dispose(); this.back.dispose();
    this.receiver.geometry.dispose(); (this.receiver.material as THREE.Material).dispose();
    this.light.shadow.dispose();
    // The canvas survives responsive re-layouts; losing its context would make
    // the replacement renderer fail before Chrome restores that same context.
    this.renderer.dispose();
  }
}
