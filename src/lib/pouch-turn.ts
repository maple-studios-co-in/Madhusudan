/**
 * WebGL pouch for "Freeze fast. Keep more": the IQF bag turns round on its
 * vertical axis and its back is the Madhusudan pack — as a real, pillow-shaped
 * pouch in perspective, lit as it turns. No React; loaded lazily (three.js stays
 * out of the first page load) by PouchTurn.
 *
 * Model (units = Figma px of the product box, 564.28 × 696): ONE closed pouch.
 * Its body is the visible part of the photo on show (each photo's alpha
 * bounds), easing from the bag's body to the pack's while it is edge-on; both
 * faces share that outline, so they meet at a real seam, and the body is
 * rounded between them (a filled pillow: a thick lens edge-on). Each face
 * carries its photo — the files the page's <img>s already loaded — on exactly
 * its visible area. The pouch turns about its own centre.
 *
 * Camera: world units are CSS px on the z = 0 plane, so at rest the pouch lands
 * on exactly the pixels of the laid-out <img>s (the flight into Product
 * universe starts from those).
 *
 * Light: at rest a face shows its photo untouched. While turning (gloss =
 * sin θ) it gets curvature shading, a glint that slides across the curved
 * plastic and a rim light at grazing angles; the pouch lifts, tips a little
 * toward the viewer and settles again.
 */

import {
  FrontSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";

export type PouchFace = {
  image: HTMLImageElement;
  /** the photo's rectangle in the product box: x, y, width, height (units) */
  rect: [number, number, number, number];
  /** the visible pouch inside the photo: texture u from–to, v from–to (v up) */
  body: [number, number, number, number];
};

export type PouchSpec = {
  /** the product box (units) */
  box: [number, number];
  front: PouchFace;
  back: PouchFace;
  /** how far each face bulges out at its middle (units); the pouch is twice this thick */
  bulge: number;
  /** camera distance (units): smaller = stronger perspective */
  distance: number;
  /** at mid-turn: lift (units) and forward tip (degrees) */
  lift: number;
  tilt: number;
  /** scroll progress window of the turn */
  turn: [number, number];
};

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

// premultiplied texture in, premultiplied colour out; no colour-space
// conversion anywhere, so at rest the photo's pixels pass through untouched
const FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float uGloss;
  uniform vec3 uKey;
  uniform vec3 uFill;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.004) discard;
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vView);
    float lambert = max(dot(n, uFill), 0.0);
    float shade = mix(1.0, mix(0.52, 1.1, lambert), uGloss);
    float nh = max(dot(n, normalize(uKey + v)), 0.0);
    float glint = pow(nh, 60.0) * 0.5 + pow(nh, 9.0) * 0.2;
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.3;
    float cover = smoothstep(0.02, 0.3, tex.a);
    vec3 light = vec3(glint + rim) * uGloss * cover;
    gl_FragColor = vec4(tex.rgb * shade + light, tex.a);
  }
`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A filled pouch over its body (0…1 each way): round across — close to an
 * ellipse, so edge-on the whole half-face turns toward the viewer as a lens —
 * fuller along its length, closing at the sealed ends. 0 on the outline, where
 * the two faces meet.
 */
function pillow(u: number, v: number) {
  if (u <= 0 || u >= 1 || v <= 0 || v >= 1) return 0;
  const across = Math.pow(1 - (2 * u - 1) ** 2, 0.42);
  const down = Math.pow(1 - Math.abs(2 * v - 1) ** 4, 0.5);
  return across * down;
}

/** a unit face (1 × 1, bulging 1) carrying the photo's visible part */
function faceGeometry(body: PouchFace["body"]) {
  const [u0, u1, v0, v1] = body;
  const geo = new PlaneGeometry(1, 1, 72, 88);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5;
    const v = pos.getY(i) + 0.5;
    pos.setZ(i, pillow(u, v));
    uv.setXY(i, u0 + u * (u1 - u0), v0 + v * (v1 - v0));
  }
  geo.computeVertexNormals();
  return geo;
}

type Box = { x: number; y: number; w: number; h: number };

/** the visible pouch of a face, in product-box units (y down) */
function bodyBox(face: PouchFace): Box {
  const [x, y, w, h] = face.rect;
  const [u0, u1, v0, v1] = face.body;
  return { x: x + u0 * w, y: y + (1 - v1) * h, w: (u1 - u0) * w, h: (v1 - v0) * h };
}

export class PouchTurnRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(20, 1, 1, 100000);
  private readonly tip = new Group();
  private readonly spin = new Group();
  private readonly front: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly back: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly textures: Texture[] = [];
  private readonly bodies: [Box, Box];
  private theta = -1;
  private unit = 1;
  private raf = 0;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    /** the laid-out product box (its width sets the unit) */
    private readonly box: HTMLElement,
    private readonly spec: PouchSpec,
  ) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
    this.renderer.setClearColor(0x000000, 0);
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const make = (face: PouchFace, isBack: boolean) => {
      const tex = new Texture(face.image);
      tex.colorSpace = NoColorSpace;
      tex.premultiplyAlpha = true;
      tex.anisotropy = maxAniso;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.magFilter = LinearFilter;
      tex.needsUpdate = true;
      this.textures.push(tex);
      const material = new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          map: { value: tex },
          uGloss: { value: 0 },
          // a softbox to the upper left: its reflection sweeps across the curved plastic
          uKey: { value: new Vector3(-0.75, 0.3, 0.6).normalize() },
          uFill: { value: new Vector3(-0.3, 0.35, 1).normalize() },
        },
        transparent: true,
        premultipliedAlpha: true,
        side: FrontSide,
      });
      const mesh = new Mesh(faceGeometry(face.body), material);
      // the back faces the other way; the turn brings it round the right way up
      if (isBack) mesh.rotation.y = Math.PI;
      this.spin.add(mesh);
      return mesh;
    };
    this.bodies = [bodyBox(spec.front), bodyBox(spec.back)];
    this.front = make(spec.front, false);
    this.back = make(spec.back, true);
    this.tip.add(this.spin);
    this.scene.add(this.tip);
    this.resize();
  }

  /** scroll progress of the pinned track (0…1) */
  setProgress(p: number): void {
    const [a, b] = this.spec.turn;
    const t = clamp01((p - a) / (b - a));
    const theta = Math.PI * t * t * (3 - 2 * t);
    if (Math.abs(theta - this.theta) < 1e-5) return;
    this.theta = theta;
    this.schedule();
  }

  resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const unit = this.box.clientWidth / this.spec.box[0];
    if (!w || !h || !unit) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    const d = this.spec.distance * unit;
    this.camera.aspect = w / h;
    this.camera.fov = (2 * Math.atan(h / 2 / d) * 180) / Math.PI;
    this.camera.position.set(0, 0, d);
    this.camera.near = d / 10;
    this.camera.far = d * 10;
    this.camera.updateProjectionMatrix();
    this.tip.scale.setScalar(unit);
    this.unit = unit;
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const mesh of [this.front, this.back]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    for (const tex of this.textures) tex.dispose();
    this.renderer.dispose();
  }

  private schedule() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.draw);
  }

  private draw = () => {
    this.raf = 0;
    if (this.disposed) return;
    const theta = Math.max(0, this.theta);
    const s = Math.sin(theta);
    const { lift, tilt } = this.spec;
    // one outline for both faces: the bag's body, easing into the pack's while
    // the pouch is edge-on; it turns about the body's centre
    const [from, to] = this.bodies;
    const k = Math.min(1, Math.max(0, (theta / Math.PI - 0.3) / 0.4));
    const m = k * k * (3 - 2 * k);
    const w = from.w + (to.w - from.w) * m;
    const h = from.h + (to.h - from.h) * m;
    const cx = from.x + from.w / 2 + (to.x + to.w / 2 - (from.x + from.w / 2)) * m;
    const cy = from.y + from.h / 2 + (to.y + to.h / 2 - (from.y + from.h / 2)) * m;
    const [bw, bh] = this.spec.box;
    this.spin.position.set(cx - bw / 2, -(cy - bh / 2), 0);
    this.front.scale.set(w, h, this.spec.bulge);
    this.back.scale.set(w, h, this.spec.bulge);
    this.spin.rotation.y = theta;
    this.tip.rotation.x = (-tilt * Math.PI * s) / 180;
    this.tip.position.y = lift * s * this.unit;
    const gloss = s;
    this.front.material.uniforms.uGloss.value = gloss;
    this.back.material.uniforms.uGloss.value = gloss;
    // the face turned toward the camera draws last, over the one turning away
    // (single-sided: edge-on, each face shows only the flank that faces us)
    const frontFacing = Math.cos(theta) >= 0;
    this.front.renderOrder = frontFacing ? 1 : 0;
    this.back.renderOrder = frontFacing ? 0 : 1;
    this.renderer.render(this.scene, this.camera);
  };
}
