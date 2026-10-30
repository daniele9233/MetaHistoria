import * as THREE from 'three';
import { ATLAS } from './editorialAtlas';
import { createWebGLRenderer } from './webglRenderer';
import { createReliefGeometry, elevationAt, geographicOrientation, RELIEF_SCALE, type ElevationRaster } from './reliefGeometry';

export type AtlasView = 'global' | 'italy' | 'explore';
export interface AtlasProjection { x: number; y: number; visible: boolean; id: string }
const ITALY = { longitude: 12.45, latitude: 41.9 };
const geographic = (point: [number, number, number]) => ({ longitude: Math.atan2(point[0], point[2]) * 180 / Math.PI, latitude: Math.asin(point[1]) * 180 / Math.PI });

/** Geographic relief with local NASA textures. Rendering stops at rest. */
export class AtlasRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, .002, 20);
  private earth = new THREE.Group();
  private nodes!: THREE.InstancedMesh;
  private hitNodes!: THREE.InstancedMesh;
  private textures: THREE.Texture[] = [];
  private raster!: ElevationRaster;
  private frame = 0;
  private last = 0;
  private frames = 0;
  private reveal = 0;
  private visible = true;
  private disposed = false;
  private ready = false;
  private view: AtlasView = 'italy';
  private targetOrientation = geographicOrientation(ITALY.longitude, ITALY.latitude);
  private orientation = this.targetOrientation.clone();
  private cameraPose = new THREE.Vector3(0, -.34, 1.36);
  private lookPose = new THREE.Vector3(0, .055, .93);
  private requestedCamera = this.cameraPose.clone();
  private requestedLook = this.lookPose.clone();
  private selected = ATLAS.places[0]?.id || '';
  private paused = true;
  private zoomFactor = 1;
  private reliefStrength = { value: 1 };
  private width = 1;
  private height = 1;
  private pointer: { id: number; x: number; y: number; moved: boolean } | null = null;
  private raycaster = new THREE.Raycaster();
  private coords = new THREE.Vector2();
  private scratch = new THREE.Object3D();
  private tempPoint = new THREE.Vector3();
  private tempCamera = new THREE.Vector3();
  private tempLook = new THREE.Vector3();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private high = innerWidth >= 960 && (navigator.hardwareConcurrency || 4) >= 8;
  private observer: ResizeObserver;
  private callbacks: Array<[string, EventListener, AddEventListenerOptions | undefined]> = [];
  private onVisibility = () => this.wake();

  static async create(canvas: HTMLCanvasElement, onSelect: (id: string) => void, onProject: (point: AtlasProjection) => void) {
    const engine = new AtlasRenderer(canvas, onSelect, onProject);
    try { await engine.prepare(); return engine; }
    catch (error) { engine.dispose(); throw error; }
  }
  private constructor(private canvas: HTMLCanvasElement, private onSelect: (id: string) => void, private onProject: (point: AtlasProjection) => void) {
    this.renderer = createWebGLRenderer(canvas);
    this.high = this.high && this.renderer.capabilities.maxTextureSize >= 8192;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.high ? 1.5 : 1.2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.scene.add(this.earth);
    this.scene.add(new THREE.AmbientLight('#d6e4ef', 1.15));
    const sun = new THREE.DirectionalLight('#fff0d5', 3.2);
    sun.position.set(-3, 4, 5); this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#91b4ce', .28); fill.position.set(3, -2, 1); this.scene.add(fill);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);
    const listen = (name: string, callback: EventListener, options?: AddEventListenerOptions) => {
      canvas.addEventListener(name, callback, options); this.callbacks.push([name, callback, options]);
    };
    listen('pointerdown', ((event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    }) as EventListener);
    listen('pointermove', ((event: PointerEvent) => {
      const p = this.pointer;
      if (!p) {
        if (this.ready && event.pointerType === 'mouse') {
          const hit = this.hitAt(event.clientX, event.clientY);
          canvas.style.cursor = hit !== undefined ? 'pointer' : 'grab';
          canvas.title = hit !== undefined ? `${ATLAS.places[hit].label} · ${ATLAS.places[hit].page.title}` : 'Trascina per ruotare · Alt + rotella per avvicinare';
        }
        return;
      }
      if (p.id !== event.pointerId) return;
      const dx = event.clientX - p.x, dy = event.clientY - p.y;
      if (!p.moved && event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dy) > 8) { this.pointer = null; return; }
      if (!p.moved && Math.hypot(dx, dy) < 5) return;
      if (!p.moved) canvas.setPointerCapture(event.pointerId);
      p.moved = true; this.paused = true;
      const speed = this.view === 'global' ? .0045 : .0018;
      this.targetOrientation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * speed));
      this.targetOrientation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * speed));
      p.x = event.clientX; p.y = event.clientY; this.wake();
    }) as EventListener);
    const cancel = () => {
      const id = this.pointer?.id; this.pointer = null;
      if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    };
    listen('pointerup', ((event: PointerEvent) => { if (this.pointer && !this.pointer.moved) this.pick(event); cancel(); }) as EventListener);
    listen('pointercancel', cancel); listen('lostpointercapture', cancel);
    listen('wheel', ((event: WheelEvent) => {
      if (!event.altKey) return;
      event.preventDefault(); this.zoom(event.deltaY < 0 ? 1 : -1);
    }) as EventListener, { passive: false });
    listen('dblclick', (() => this.zoom(1)) as EventListener);
  }

  private async prepare() {
    const loader = new THREE.TextureLoader(), resolution = this.high ? '8k' : '4k';
    const [day, region, heightMap] = await Promise.all([
      loader.loadAsync(`/media/earth-relief/earth-day-${resolution}.webp`),
      loader.loadAsync(`/media/earth-relief/europe-day-${this.high ? '4k' : '2k'}.webp`),
      loader.loadAsync(`/media/earth-relief/earth-height-${resolution}.jpg`),
    ]);
    this.textures.push(day, region);
    for (const texture of [day, region]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    }
    const heightCanvas = document.createElement('canvas');
    heightCanvas.width = heightMap.image.width; heightCanvas.height = heightMap.image.height;
    const context = heightCanvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(heightMap.image, 0, 0);
    const rgba = context.getImageData(0, 0, heightCanvas.width, heightCanvas.height).data;
    const pixels = new Uint8Array(heightCanvas.width * heightCanvas.height);
    for (let i = 0; i < pixels.length; i++) pixels[i] = rgba[i * 4];
    this.raster = { pixels, width: heightCanvas.width, height: heightCanvas.height };
    // Linear, single-channel elevation data. Flip rows explicitly for a typed
    // array texture; CPU sampling retains north-first image coordinates.
    const gpuPixels = new Uint8Array(pixels.length);
    for (let y = 0; y < this.raster.height; y++) gpuPixels.set(pixels.subarray(y * this.raster.width, (y + 1) * this.raster.width), (this.raster.height - 1 - y) * this.raster.width);
    const dataTexture = new THREE.DataTexture(gpuPixels, this.raster.width, this.raster.height, THREE.RedFormat);
    dataTexture.wrapS = THREE.RepeatWrapping;
    dataTexture.minFilter = dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.needsUpdate = true; this.textures.push(dataTexture); heightMap.dispose();
    const material = new THREE.MeshPhysicalMaterial({ map: day, roughness: .92, metalness: 0, specularIntensity: .2 });
    material.onBeforeCompile = shader => {
      shader.uniforms.regionMap = { value: region }; shader.uniforms.heightSampler = { value: dataTexture };
      shader.uniforms.reliefStrength = this.reliefStrength;
      const geographicVaryings = 'varying vec3 vReliefRadial;\nvarying vec3 vReliefEast;\nvarying vec3 vReliefNorth;\n';
      shader.vertexShader = 'uniform float reliefStrength;\n' + geographicVaryings + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(mix(normalize(position), objectNormal, reliefStrength));');
      shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
        vec3 reliefRadial = normalize(position);
        vec3 reliefEast = normalize(vec3(reliefRadial.z, 0.0, -reliefRadial.x));
        vReliefRadial = normalMatrix * reliefRadial;
        vReliefEast = normalMatrix * reliefEast;
        vReliefNorth = normalMatrix * cross(reliefRadial, reliefEast);
      `);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = normalize(position) * (1.0 + (length(position) - 1.0) * reliefStrength);');
      shader.fragmentShader = 'uniform sampler2D regionMap;\nuniform sampler2D heightSampler;\nuniform float reliefStrength;\n' + geographicVaryings + shader.fragmentShader;
      // Derive lighting per pixel from the same geographic height field. Vertex
      // interpolation across the adaptive grid otherwise creates striped hills.
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        float reliefDelta = .18;
        vec2 du = vec2(reliefDelta / 360.0, 0.0);
        vec2 dv = vec2(0.0, reliefDelta / 180.0);
        float cosLatitude = max(.05, cos((vMapUv.y - .5) * PI));
        float slopeFactor = ${RELIEF_SCALE} * reliefStrength / (2.0 * reliefDelta * PI / 180.0);
        float slopeEast = clamp((texture2D(heightSampler, vMapUv + du).r - texture2D(heightSampler, vMapUv - du).r) * slopeFactor / cosLatitude, -1.6, 1.6);
        float slopeNorth = clamp((texture2D(heightSampler, vMapUv + dv).r - texture2D(heightSampler, vMapUv - dv).r) * slopeFactor, -1.6, 1.6);
        normal = normalize(normalize(vReliefRadial) - normalize(vReliefEast) * slopeEast - normalize(vReliefNorth) * slopeNorth);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec2 regionalUv = (vMapUv - vec2(160.0 / 360.0, 110.0 / 180.0)) / vec2(85.0 / 360.0, 46.0 / 180.0);
          vec4 sampledDiffuseColor = texture2D(map, vMapUv);
          if (regionalUv.x > 0.0 && regionalUv.x < 1.0 && regionalUv.y > 0.0 && regionalUv.y < 1.0) {
            float edge = min(min(regionalUv.x, 1.0 - regionalUv.x), min(regionalUv.y, 1.0 - regionalUv.y));
            sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(regionMap, regionalUv), smoothstep(0.0, .025, edge));
          }
          diffuseColor *= sampledDiffuseColor;
        #endif
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
        float terrainHeight = texture2D(heightSampler, vMapUv).r;
        float roughnessFactor = mix(.52, .94, smoothstep(.002, .012, terrainHeight));
      `);
    };
    material.customProgramCacheKey = () => 'metahistoria-relief-r186-v2';
    this.earth.add(new THREE.Mesh(createReliefGeometry(this.raster, this.high), material));
    this.earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.009, 80, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vP=p.xyz; gl_Position=projectionMatrix*p; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vP; void main(){ float rim=pow(1.0-abs(dot(normalize(vN),normalize(-vP))),4.2); gl_FragColor=vec4(.20,.43,.64,rim*.24); }`,
    })));
    this.nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#edce8d' }), ATLAS.places.length);
    this.hitNodes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), ATLAS.places.length);
    this.nodes.frustumCulled = this.hitNodes.frustumCulled = false;
    this.earth.add(this.nodes, this.hitNodes);
    this.updateNodes(); this.ready = true;
    await this.renderer.compileAsync(this.scene, this.camera);
    this.draw(performance.now());
  }
  private nodePosition(index: number, target: THREE.Vector3) {
    const node = ATLAS.places[index], geo = geographic(node.position);
    return target.set(...node.position).multiplyScalar(1 + elevationAt(this.raster, geo.longitude, geo.latitude) * RELIEF_SCALE * this.reliefStrength.value + .0035);
  }
  private updateNodes() {
    if (!this.nodes) return;
    ATLAS.places.forEach((node, i) => {
      this.nodePosition(i, this.scratch.position);
      this.scratch.scale.setScalar(node.id === this.selected ? .0046 : .0026);
      this.scratch.updateMatrix(); this.nodes.setMatrixAt(i, this.scratch.matrix);
      this.scratch.scale.setScalar(this.high ? .012 : .019);
      this.scratch.updateMatrix(); this.hitNodes.setMatrixAt(i, this.scratch.matrix);
    });
    this.nodes.instanceMatrix.needsUpdate = this.hitNodes.instanceMatrix.needsUpdate = true;
  }
  private pick(event: PointerEvent) {
    if (!this.ready) return;
    const hit = this.hitAt(event.clientX, event.clientY);
    if (hit !== undefined) this.onSelect(ATLAS.places[hit].id);
  }
  private hitAt(x: number, y: number) {
    const b = this.canvas.getBoundingClientRect();
    this.coords.set(2 * (x - b.left) / b.width - 1, 1 - 2 * (y - b.top) / b.height);
    this.earth.updateWorldMatrix(true, true); this.raycaster.setFromCamera(this.coords, this.camera);
    const hit = this.raycaster.intersectObject(this.hitNodes).find(item => item.instanceId !== undefined && this.isNodeVisible(item.instanceId));
    return hit?.instanceId;
  }
  private isNodeVisible(index: number) {
    this.nodePosition(index, this.tempPoint).applyMatrix4(this.earth.matrixWorld);
    return this.tempPoint.dot(this.tempCamera.copy(this.camera.position).sub(this.tempPoint)) > .008;
  }
  focus(id: string | null) {
    this.selected = id || ''; if (this.ready) this.updateNodes();
    const node = ATLAS.places.find(n => n.id === id);
    if (node) { const geo = geographic(node.position); this.targetOrientation.copy(geographicOrientation(geo.longitude, geo.latitude)); }
    this.wake();
  }
  setView(view: AtlasView) {
    this.view = view; this.zoomFactor = 1;
    if (view === 'italy') this.targetOrientation.copy(geographicOrientation(ITALY.longitude, ITALY.latitude));
    if (view === 'global') this.targetOrientation.copy(geographicOrientation(18, 25));
    this.updatePose(); this.wake();
  }
  private updatePose() {
    const mobile = this.width < 760;
    if (this.view === 'global') { this.requestedCamera.set(0, 0, mobile ? 4.7 : 3.65); this.requestedLook.set(0, 0, 0); }
    else if (this.view === 'italy') { this.requestedCamera.set(0, mobile ? -.35 : -.34, mobile ? 1.95 : 1.36); this.requestedLook.set(0, mobile ? .10 : .055, .93); }
    else { this.requestedCamera.set(0, mobile ? -.24 : -.30, mobile ? 2.25 : 1.95); this.requestedLook.set(0, .035, .80); }
    this.requestedCamera.sub(this.requestedLook).multiplyScalar(this.zoomFactor).add(this.requestedLook);
  }
  zoom(direction: number) { this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor * (direction > 0 ? .88 : 1.14), .64, 1.8); this.updatePose(); this.wake(); }
  setReveal(value: number) { this.reveal = THREE.MathUtils.clamp(value, 0, 1); this.wake(); }
  setPaused(value: boolean) { this.paused = value; this.wake(); }
  setVisible(value: boolean) { this.visible = value; if (value) this.wake(); }
  private resize() {
    this.width = this.canvas.clientWidth; this.height = this.canvas.clientHeight;
    if (!this.width || !this.height) return;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height; this.camera.fov = this.width < 760 ? 50 : 42;
    this.updatePose(); this.camera.updateProjectionMatrix(); this.wake();
  }
  private wake() { if (!this.frame && !this.disposed && this.visible) this.frame = requestAnimationFrame(this.draw); }
  private draw = (now: number) => {
    this.frame = 0;
    if (this.disposed || !this.visible || !this.ready) return;
    const dt = Math.min(.04, (now - this.last) / 1000 || .016); this.last = now;
    const rate = this.reduced ? 1 : 1 - Math.exp(-(this.pointer ? 30 : 4.8) * dt);
    if (!this.paused && this.view === 'global' && !this.reduced) this.targetOrientation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dt * .025));
    this.orientation.slerp(this.targetOrientation, rate); this.earth.quaternion.copy(this.orientation);
    this.cameraPose.lerp(this.requestedCamera, rate); this.lookPose.lerp(this.requestedLook, rate);
    const reliefTarget = this.view === 'global' ? .25 : 1;
    if (Math.abs(this.reliefStrength.value - reliefTarget) > .00005) {
      this.reliefStrength.value = THREE.MathUtils.lerp(this.reliefStrength.value, reliefTarget, rate); this.updateNodes();
    }
    const p = this.reveal, eased = p * p * (3 - 2 * p);
    this.camera.position.set(0, 0, 4.8).lerp(this.cameraPose, eased);
    this.tempLook.set(0, 0, 0).lerp(this.lookPose, eased); this.camera.lookAt(this.tempLook);
    const offset = this.width < 760 ? 0 : -.075 - .065 * (1 - eased);
    this.camera.setViewOffset(this.width, this.height, this.width * offset, 0, this.width, this.height);
    this.camera.updateMatrixWorld(); this.earth.updateWorldMatrix(true, true);
    this.renderer.render(this.scene, this.camera);
    const index = ATLAS.places.findIndex(n => n.id === this.selected);
    if (index >= 0) {
      const visible = this.isNodeVisible(index);
      this.nodePosition(index, this.tempPoint).applyMatrix4(this.earth.matrixWorld).project(this.camera);
      const x = (this.tempPoint.x + 1) * this.width / 2, y = (1 - this.tempPoint.y) * this.height / 2;
      const project = { x, y, visible: visible && this.tempPoint.z < 1 && x > 12 && x < this.width - 12 && y > 70 && y < this.height - 60, id: this.selected };
      this.onProject(project); this.canvas.dataset.selectedPoint = JSON.stringify(project);
    } else this.onProject({ x: 0, y: 0, visible: false, id: '' });
    this.canvas.dataset.renderInfo = JSON.stringify({ calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, programs: this.renderer.info.programs?.length, quality: this.high ? 'high' : 'adaptive', view: this.view, zoom: this.zoomFactor, frames: ++this.frames });
    const moving = this.orientation.angleTo(this.targetOrientation) > .00005 || this.cameraPose.distanceTo(this.requestedCamera) > .00005 || this.lookPose.distanceTo(this.requestedLook) > .00005 || Math.abs(this.reliefStrength.value - reliefTarget) > .00005 || (!this.paused && this.view === 'global' && !this.reduced);
    if (moving && !document.hidden) this.wake();
  };
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame); this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.callbacks.forEach(([name, callback, options]) => this.canvas.removeEventListener(name, callback, options));
    this.textures.forEach(texture => texture.dispose());
    this.scene.traverse(object => {
      const mesh = object as THREE.Mesh; mesh.geometry?.dispose();
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => material.dispose());
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    this.renderer.dispose();
  }
}
