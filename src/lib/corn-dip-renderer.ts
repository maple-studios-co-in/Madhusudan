/**
 * Canvas renderer for the pinned corn-dip scene (BetterWay).
 *
 * One corn, one size, one continuous fall. The crisp Figma corn is the object
 * throughout; the dip clip supplies the water (surface, crown splash, bubbles)
 * and, once the corn is under the surface, its drowning.
 *
 * The clip is drawn at the corn's scale (kernel widths matched), so nothing
 * zooms. It does not reach the screen edges at that scale, so every frame has
 * feathered edges (baked into its alpha) over a backdrop continued from that
 * same frame: its own edge colours to the sides (edges.webp), its water below
 * (bottoms.webp) and the still sky above, fading into the section gradient
 * (sky.webp). No box, no seams.
 *
 * Assets (public/frames/<film>/, graded to the section's lime):
 *  - f<i>: the clip from frame 26 (every 2nd), 1280×720 with feathered alpha;
 *  - p<i>: the first frames with the clip's corn painted out above the water
 *          (the start frame also under it, before the Figma corn lands);
 *  - edges:   per frame, the left and right edge colour columns (3 px each);
 *  - bottoms: per frame, the water colour along the bottom edge (3 rows each);
 *  - sky:     the still sky along the top edge, fading out upwards.
 *
 * Scroll progress p (0…1 over the pinned track):
 *  - approach (p ≤ approachEnd): the copy leaves, the water rises into place and
 *    the Figma corn starts to fall (from rest, gathering speed);
 *  - film (p > approachEnd): the clip is scrubbed by the scroll, both ways. Its
 *    speed picks up exactly where the approach's fall left off, so the corn never
 *    stops; adjacent frames are cross-faded, so slow scrolling stays smooth. The
 *    Figma corn rides the clip corn's pose (tilting with it) above the surface;
 *    under the surface the clip shows the corn. While the corn goes under
 *    (handover frames) the clip's corn takes over. The camera eases down with it.
 */

export type DipFilm = {
  base: string;
  width: number;
  height: number;
  frames: number;
  /** painted frames (clip's corn removed above the water): the first N frames */
  painted: number;
  /** first scrubbed frame: the Figma corn's stem meets the surface here */
  start: number;
  /** water surface (film y) per frame; the Figma corn is cut here */
  surface: number[];
  /** the clip's corn per painted frame: kernel-body bottom x, y (film px) and axis (deg from vertical) */
  corn: [number, number, number][];
  /** frames over which the Figma corn hands over to the clip's corn */
  handover: [number, number];
  /** the clip corn's kernel width (film px) */
  cornKernelWidth: number;
  /** feathered edges baked into the frames' alpha (film px): sides, top, bottom */
  feather: [number, number, number];
  /** how far the sky fades out above the clip (film px) */
  skyFade: number;
};

export type DipCorn = {
  src: string;
  width: number;
  height: number;
  /** kernel-body bottom (image px), axis (deg from vertical) and kernel width (image px) */
  anchor: [number, number];
  axis: number;
  kernelWidth: number;
  /** length ratio clip ÷ Figma kernels at equal width (the Figma corn is stretched this much) */
  stretch: number;
  /** CSS rotation of the corn in the Figma layout */
  layoutRotate: number;
};

/**
 * Where the corn rests before it falls: one unit = min(W / unitWidth,
 * H / unitHeight); the image (imageWidth units wide) is centred in a box
 * boxHeight units tall, boxTop units below the top of the view, centred
 * across. On desktop this mirrors BetterWay's CSS corn (computed rather than
 * measured so the copy layer's transform never skews it).
 */
export type DipLayout = { unitWidth: number; unitHeight: number; boxTop: number; boxHeight: number; imageWidth: number };

export type DipMotion = {
  /** how far the corn falls during the approach, share of the screen height */
  approachDrop: number;
  /** where the camera settles the sinking corn, share of the screen height */
  settleY: number;
  /** film y of the corn's middle once it has sunk */
  sunkY: number;
  /** share of the film's scroll at which the last frame is reached (the rest holds it) */
  filmEnd: number;
  /** scrub speed at the last frame, relative to the average (below 1 eases out) */
  endRate: number;
};

type Pose = { x: number; y: number; phi: number; sx: number; sy: number };
type Geometry = { W: number; H: number; S: number; k: number; x0: number; y0: number; pan: number; drop: number; m0: number };

const RAD = Math.PI / 180;
const SKY_FADE_ROWS = 32; // sky.webp: rows 0…31 fade in, 32…33 opaque
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** 0→1 with slope m0 at the start and m1 at the end (monotonic for 0 ≤ m ≤ 3) */
const hermite = (x: number, m0: number, m1: number) => {
  const x2 = x * x;
  const x3 = x2 * x;
  return m0 * (x3 - 2 * x2 + x) + (3 * x2 - 2 * x3) + m1 * (x3 - x2);
};
/** the water's rise during the approach: page speed at first, settling into place */
const rise = (a: number) => hermite(a, 1.05, 0);

export class CornDipRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly frames: (HTMLImageElement | null)[];
  private readonly paintedFrames: (HTMLImageElement | null)[];
  private corn: HTMLImageElement | null = null;
  private sky: HTMLImageElement | null = null;
  private edges: HTMLImageElement | null = null;
  private bottoms: HTMLImageElement | null = null;
  private geo: Geometry = { W: 0, H: 0, S: 1, k: 1, x0: 0, y0: 0, pan: 0, drop: 0, m0: 1 };
  private startPose: Pose = { x: 0, y: 0, phi: 0, sx: 1, sy: 1 };
  private dpr = 1;
  private p = 0;
  private raf = 0;
  private started = false;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    /** gets --a / --w and data-ready */
    private readonly stage: HTMLElement,
    /** the box the canvas fills (the pinned screen) */
    private readonly view: HTMLElement,
    private readonly layout: DipLayout,
    private readonly film: DipFilm,
    private readonly cornSpec: DipCorn,
    private readonly motion: DipMotion,
    private readonly approachEnd: number,
  ) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.frames = new Array(film.frames).fill(null);
    this.paintedFrames = new Array(film.painted).fill(null);
    this.resize();
  }

  /** Start fetching (idempotent): corn and backdrop first, then the frames in playing order. */
  load(): void {
    if (this.started) return;
    this.started = true;
    const { base } = this.film;
    const one = (src: string, set: (img: HTMLImageElement) => void) =>
      void this.fetch(src).then((img) => {
        if (!img || this.disposed) return;
        set(img);
        this.schedule();
      });
    one(this.cornSpec.src, (img) => {
      this.corn = img;
      this.stage.dataset.ready = "true";
    });
    one(`${base}/sky.webp`, (img) => (this.sky = img));
    one(`${base}/edges.webp`, (img) => (this.edges = img));
    one(`${base}/bottoms.webp`, (img) => (this.bottoms = img));

    const queue: [(HTMLImageElement | null)[], number, string][] = [];
    for (let i = this.film.start; i < this.film.frames; i++) {
      if (i < this.film.painted) queue.push([this.paintedFrames, i, `${base}/p${String(i).padStart(3, "0")}.webp`]);
      queue.push([this.frames, i, `${base}/f${String(i).padStart(3, "0")}.webp`]);
    }
    let next = 0;
    const worker = async () => {
      while (!this.disposed && next < queue.length) {
        const [list, i, src] = queue[next++];
        const img = await this.fetch(src);
        if (img && !this.disposed) {
          list[i] = img;
          this.schedule();
        }
      }
    };
    for (let n = 0; n < 4; n++) void worker();
  }

  setProgress(p: number): void {
    this.p = p;
    const a = clamp01(p / this.approachEnd);
    this.stage.style.setProperty("--a", a.toFixed(4));
    this.stage.style.setProperty("--w", rise(a).toFixed(4));
    this.schedule();
  }

  resize(): void {
    const W = this.view.clientWidth;
    const H = this.view.clientHeight;
    if (!W || !H) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);

    const L = this.layout;
    const c = this.cornSpec;
    const f = this.film;
    const m = this.motion;
    const u = Math.min(W / L.unitWidth, H / L.unitHeight);
    const k = (L.imageWidth * u) / c.width; // Figma image px → screen px
    const S = (c.kernelWidth * k) / f.cornKernelWidth; // film px → screen px (kernels match)
    this.geo = { ...this.geo, W, H, S, k };
    this.startPose = this.layoutPose();

    // place the clip so its corn (frame `start`) sits `drop` below the Figma corn
    const [bx, by] = f.corn[f.start];
    const drop = m.approachDrop * H;
    const x0 = this.startPose.x - bx * S;
    const y0 = this.startPose.y + drop - by * S;
    const pan = Math.max(0, y0 + m.sunkY * S - m.settleY * H);

    // the approach falls from rest (drop · a²) and ends at 2·drop per unit a; the
    // film starts scrubbing at the rate that keeps that speed (no stop and go)
    const span = f.frames - 1 - f.start;
    const step = (f.corn[f.start + 1][1] - f.corn[f.start - 1][1]) / 2; // film px per frame
    const speed = (2 * drop) / this.approachEnd; // screen px per unit p
    const rate = (speed * (1 - this.approachEnd)) / (S * step); // frames per unit b
    const m0 = Math.min(2.5, Math.max(0.03, (rate * m.filmEnd) / span));
    this.geo = { W, H, S, k, x0, y0, pan, drop, m0 };
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    delete this.stage.dataset.ready;
  }

  // ------------------------------------------------------------------ poses

  /** The corn as laid out by CSS (image centred in its box, rotated `layoutRotate`). */
  private layoutPose(): Pose {
    const c = this.cornSpec;
    const L = this.layout;
    const { W, k } = this.geo;
    const u = (k * c.width) / L.imageWidth;
    const cx = W / 2;
    const cy = (L.boxTop + L.boxHeight / 2) * u;
    const rot = c.layoutRotate * RAD;
    const dx = (c.anchor[0] - c.width / 2) * k;
    const dy = (c.anchor[1] - c.height / 2) * k;
    return {
      x: cx + dx * Math.cos(rot) - dy * Math.sin(rot),
      y: cy + dx * Math.sin(rot) + dy * Math.cos(rot),
      phi: c.layoutRotate - c.axis,
      sx: k,
      sy: k,
    };
  }

  /** The clip's corn at (fractional) frame i, with the clip's top at `top`. */
  private filmPose(i: number, top: number): Pose {
    const { S, x0, k } = this.geo;
    const poses = this.film.corn;
    const last = poses.length - 1;
    const j = Math.min(Math.max(i, 0), last);
    const j0 = Math.min(Math.floor(j), last - 1);
    const t = j - j0;
    const [ax, ay, aa] = poses[j0];
    const [bx, by, ba] = poses[j0 + 1];
    return {
      x: x0 + lerp(ax, bx, t) * S,
      y: top + lerp(ay, by, t) * S,
      phi: -lerp(aa, ba, t),
      sx: k,
      sy: k * this.cornSpec.stretch,
    };
  }

  private surfaceAt(i: number): number {
    const s = this.film.surface;
    const i0 = Math.min(Math.floor(i), s.length - 2);
    return lerp(s[i0], s[i0 + 1], i - i0);
  }

  // ------------------------------------------------------------------ drawing

  private fetch(src: string): Promise<HTMLImageElement | null> {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    return img.decode().then(
      () => img,
      () => null,
    );
  }

  private schedule() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.draw);
  }

  private nearest(list: (HTMLImageElement | null)[], i: number, from = 0): HTMLImageElement | null {
    if (list[i]) return list[i];
    for (let d = 1; d < list.length; d++) {
      const lo = i - d >= from ? list[i - d] : null;
      if (lo) return lo;
      const hi = list[i + d];
      if (hi) return hi;
    }
    return null;
  }

  /** The still sky above the clip (fading into the section gradient), full width. */
  private drawSky(top: number) {
    const { ctx, sky } = this;
    if (!sky) return;
    const { W, S, x0 } = this.geo;
    const f = this.film;
    const fw = f.width * S;
    const xr = x0 + fw;
    const strips: [number, number, number, number][] = [
      [0, SKY_FADE_ROWS, top - f.skyFade * S, f.skyFade * S],
      [SKY_FADE_ROWS, 2, top - 0.5, f.feather[1] * S + 0.5],
    ];
    for (const [sy, sh, dy, dh] of strips) {
      ctx.drawImage(sky, 0, sy, f.width, sh, x0, dy, fw, dh);
      if (x0 > 0) ctx.drawImage(sky, 0, sy, 1, sh, 0, dy, x0 + 0.5, dh);
      if (xr < W) ctx.drawImage(sky, f.width - 1, sy, 1, sh, xr - 0.5, dy, W - xr + 0.5, dh);
    }
  }

  /** Frame i's own colours beyond its sides and below it, under its feathered edges. */
  private drawEdges(i: number, top: number, alpha: number) {
    const { ctx, edges, bottoms } = this;
    const { W, H, S, x0 } = this.geo;
    const f = this.film;
    const fw = f.width * S;
    const fh = f.height * S;
    const xl = x0 + f.feather[0] * S;
    const xr = x0 + fw - f.feather[0] * S;
    ctx.globalAlpha = alpha;
    if (edges) {
      if (xl > 0) ctx.drawImage(edges, i * 6 + 1, 0, 1, f.height, 0, top, xl, fh);
      if (xr < W) ctx.drawImage(edges, i * 6 + 4, 0, 1, f.height, xr, top, W - xr, fh);
    }
    const yb = top + (f.height - f.feather[2]) * S;
    if (bottoms && yb < H) {
      const bh = H - yb + 0.5;
      const row = i * 3 + 1;
      ctx.drawImage(bottoms, 0, row, f.width, 1, x0, yb, fw, bh);
      if (x0 > 0) ctx.drawImage(bottoms, 0, row, 1, 1, 0, yb, x0 + 0.5, bh);
      if (x0 + fw < W) ctx.drawImage(bottoms, f.width - 1, row, 1, 1, x0 + fw - 0.5, yb, W - x0 - fw + 0.5, bh);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * The clip at fractional frame i: the two nearest frames cross-faded and,
   * over the handover, the painted frames (no clip corn above the water)
   * cross-faded into the originals. Weighted average by successive alpha.
   */
  private drawFilm(i: number, top: number, hand: number) {
    const { ctx } = this;
    const { S, x0 } = this.geo;
    const f = this.film;
    const i0 = Math.floor(i);
    const t = i - i0;
    const i1 = Math.min(i0 + 1, f.frames - 1);
    const parts: [HTMLImageElement | null, number][] = [];
    const add = (n: number, w: number) => {
      if (w <= 0.001) return;
      const original = this.nearest(this.frames, n, f.start);
      if (n < f.painted && hand < 1) {
        parts.push([this.nearest(this.paintedFrames, n, f.start), w * (1 - hand)]);
        parts.push([original, w * hand]);
      } else parts.push([original, w]);
    };
    add(i0, 1 - t);
    if (i1 !== i0) add(i1, t);

    this.drawEdges(i0, top, 1);
    if (i1 !== i0 && t > 0.001) this.drawEdges(i1, top, t);
    let sum = 0;
    for (const [img, w] of parts) {
      if (!img || w <= 0.001) continue;
      sum += w;
      ctx.globalAlpha = w / sum;
      ctx.drawImage(img, x0, top, f.width * S, f.height * S);
    }
    ctx.globalAlpha = 1;
  }

  private drawCorn(pose: Pose, clipY?: number, alpha = 1) {
    const { ctx } = this;
    const c = this.cornSpec;
    if (!this.corn || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (clipY !== undefined) {
      ctx.beginPath();
      ctx.rect(0, 0, this.geo.W, clipY);
      ctx.clip();
    }
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.phi * RAD);
    ctx.scale(pose.sx, pose.sy);
    ctx.rotate(c.axis * RAD);
    ctx.drawImage(this.corn, -c.anchor[0], -c.anchor[1], c.width, c.height);
    ctx.restore();
  }

  private draw = () => {
    this.raf = 0;
    if (this.disposed) return;
    const { ctx, dpr } = this;
    const { W, H, y0, pan, drop, m0 } = this.geo;
    const f = this.film;
    const m = this.motion;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingQuality = "high";

    const a = clamp01(this.p / this.approachEnd);
    const b = clamp01((this.p - this.approachEnd) / (1 - this.approachEnd));

    if (b <= 0) {
      // approach: the water rises into place, the corn starts to fall
      const top = y0 + (1 - rise(a)) * H;
      this.drawSky(top);
      this.drawFilm(f.start, top, 0);
      const from = this.startPose;
      const to = this.filmPose(f.start, y0);
      const e = smooth(0.15, 1, a);
      this.drawCorn({
        x: lerp(from.x, to.x, e),
        y: from.y + drop * a * a,
        phi: lerp(from.phi, to.phi, e),
        sx: lerp(from.sx, to.sx, e),
        sy: lerp(from.sy, to.sy, e),
      });
      return;
    }

    // film: scrubbed from `start`, picking up the approach's speed; the camera
    // eases down with the sinking corn
    const span = f.frames - 1 - f.start;
    const i = f.start + span * clamp01(hermite(clamp01(b / m.filmEnd), m0, m.endRate));
    const top = y0 - pan * smooth(0.03, 0.75, (i - f.start) / span);
    const hand = smooth(f.handover[0], f.handover[1], i);
    this.drawSky(top);
    this.drawFilm(i, top, hand);
    if (hand < 1 && i < f.painted) this.drawCorn(this.filmPose(i, top), top + this.surfaceAt(i) * this.geo.S, 1 - hand);
  };
}
