/**
 * Footage player behind the hero.
 *
 * Each <video> sits in its own full-hero "slide" (its parent element). Two
 * slides take turns:
 *  – Looping: shortly before the active clip ends, the standby slide starts the
 *    same clip from 0 and fades in over it, so the pack reveal dissolves back
 *    into the rotating ring.
 *  – Switching product: the standby slide loads the new clip; once it can play
 *    through, it is revealed over the old one by a soft-edged circle growing
 *    from the tapped thumbnail (`origin`), and `onSwitchStart` fires in the same
 *    frame. The two scenes never mix colours; the retired slide is then reloaded
 *    with the new clip so looping continues.
 *
 * Slides carry the footage's surround colour as their background, so on phones
 * (where the video does not fill the hero) the area around it swaps together
 * with the footage.
 *
 * Playback pauses when the observed element leaves the viewport or the tab is
 * hidden, and resumes as soon as it is visible again. A watchdog restarts the
 * active clip whenever it should be playing but is not (stalls, stray pauses,
 * missed loops). Only a real autoplay refusal (NotAllowedError: Low Power Mode
 * etc.) waits for the next input. Framework-free: React wires it up in
 * HeroVideo.tsx.
 */

export type FootageSource = {
  id: string;
  src: string;
  /** background of the slide around the video */
  color: string;
};

export type RevealOrigin = { x: number; y: number };

export type HeroFootagePlayerOptions = {
  initial: FootageSource;
  /** crossfade when a clip loops, ms */
  loopFadeMs?: number;
  /** circular reveal when the product changes, ms */
  switchMs?: number;
  /** start a switch even if the new clip has not signalled canplaythrough, ms */
  readyTimeoutMs?: number;
  /** soft edge of the reveal circle, px */
  revealEdgePx?: number;
  /** element whose visibility gates playback */
  observe?: Element | null;
  onSwitchStart?: (source: FootageSource) => void;
  onSwitchEnd?: (source: FootageSource) => void;
  onFirstFrame?: () => void;
};

type Listener = () => void;

const REVEAL_EASE = "cubic-bezier(0.65, 0, 0.25, 1)";

export class HeroFootagePlayer {
  private active: HTMLVideoElement;
  private standby: HTMLVideoElement;
  private current: FootageSource;
  private readonly loopFadeMs: number;
  private readonly switchMs: number;
  private readonly readyTimeoutMs: number;
  private readonly revealEdgePx: number;
  private readonly opts: HeroFootagePlayerOptions;

  private readonly loadedSrc = new WeakMap<HTMLVideoElement, string>();
  private transitioning = false;
  private transitionId = 0;
  private switching = false;
  private switchId = 0;
  private pending: { source: FootageSource; origin?: RevealOrigin } | null = null;

  private disposed = false;
  private inView = true;
  private autoplayAllowed = true;
  private firstFrameSeen = false;
  private raf = 0;
  private lastCheck = 0;
  private io: IntersectionObserver | null = null;
  private readonly cleanups: Listener[] = [];

  constructor(a: HTMLVideoElement, b: HTMLVideoElement, opts: HeroFootagePlayerOptions) {
    this.active = a;
    this.standby = b;
    this.opts = opts;
    this.current = opts.initial;
    this.loopFadeMs = opts.loopFadeMs ?? 550;
    this.switchMs = opts.switchMs ?? 1100;
    this.readyTimeoutMs = opts.readyTimeoutMs ?? 2500;
    this.revealEdgePx = opts.revealEdgePx ?? 140;

    for (const v of [a, b]) {
      v.muted = true;
      const slide = this.slideOf(v);
      slide.style.opacity = "0";
      slide.style.backgroundColor = this.current.color;
      this.listen(v, "playing", this.onPlaying);
      this.listen(v, "ended", this.onEnded);
    }
    this.listen(document, "visibilitychange", this.onVisibility);
    this.listen(window, "pointerdown", this.onFirstInput);
    this.listen(window, "keydown", this.onFirstInput);
    this.listen(window, "touchstart", this.onFirstInput);
    this.listen(window, "focus", this.onVisibility);

    if (opts.observe && "IntersectionObserver" in window) {
      this.io = new IntersectionObserver(
        ([entry]) => {
          this.inView = entry.isIntersecting;
          if (this.inView) this.resume();
          else this.pauseAll();
        },
        { threshold: 0.05 },
      );
      this.io.observe(opts.observe);
    }

    this.load(a, this.current.src);
    this.tryPlay(a);
    // The second copy is served from cache once the first one is playing.
    const primeStandby = () => this.load(b, this.current.src);
    a.addEventListener("playing", primeStandby, { once: true });
    this.cleanups.push(() => a.removeEventListener("playing", primeStandby));

    this.raf = requestAnimationFrame(this.tick);
  }

  /** Reveal another clip. Calls while a switch is in flight are queued (last wins). */
  switchTo(source: FootageSource, origin?: RevealOrigin): void {
    if (this.disposed || source.id === this.current.id) return;
    if (this.switching || this.transitioning) {
      this.pending = { source, origin };
      return;
    }
    this.switching = true;
    const id = ++this.switchId;
    this.current = source;

    const standby = this.standby;
    standby.pause();
    this.slideOf(standby).style.backgroundColor = source.color;
    this.load(standby, source.src);

    let started = false;
    let timer = 0;
    const detach = () => {
      standby.removeEventListener("canplaythrough", go);
      standby.removeEventListener("error", fail);
      window.clearTimeout(timer);
    };
    const go = () => {
      if (started) return;
      started = true;
      detach();
      if (this.disposed || id !== this.switchId) return;
      standby.currentTime = 0;
      this.tryPlay(standby);
      this.opts.onSwitchStart?.(source);
      const tid = this.revealStandby(origin);
      window.setTimeout(() => this.finishTransition(tid), this.switchMs + 80);
    };
    const fail = () => {
      if (started) return;
      started = true;
      detach();
      if (this.disposed || id !== this.switchId) return;
      this.switching = false;
      this.opts.onSwitchEnd?.(source);
    };

    if (standby.readyState >= 4) {
      go();
    } else {
      standby.addEventListener("canplaythrough", go);
      standby.addEventListener("error", fail);
      timer = window.setTimeout(go, this.readyTimeoutMs);
    }
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    for (const undo of this.cleanups) undo();
    for (const v of [this.active, this.standby]) {
      v.pause();
      v.removeAttribute("src");
      v.load();
      const slide = this.slideOf(v);
      slide.style.opacity = "0";
      delete slide.dataset.reveal;
    }
  }

  // ---------------------------------------------------------------- internals

  private slideOf(v: HTMLVideoElement): HTMLElement {
    return (v.parentElement as HTMLElement) ?? v;
  }

  private listen(target: EventTarget, type: string, handler: (e: Event) => void) {
    target.addEventListener(type, handler);
    this.cleanups.push(() => target.removeEventListener(type, handler));
  }

  private load(v: HTMLVideoElement, src: string) {
    if (this.loadedSrc.get(v) === src) return;
    this.loadedSrc.set(v, src);
    v.src = src;
  }

  private tryPlay(v: HTMLVideoElement) {
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch((err: unknown) => {
        // Only a real autoplay refusal blocks playback until the next input. An
        // AbortError just means our own pause()/src change interrupted the call —
        // treating it as a refusal is what used to leave the hero frozen.
        if (err instanceof DOMException && err.name === "NotAllowedError") this.autoplayAllowed = false;
      });
    }
  }

  private shouldRun() {
    return this.inView && !document.hidden && this.autoplayAllowed;
  }

  private raise(incoming: HTMLElement, outgoing: HTMLElement) {
    incoming.style.zIndex = "2";
    outgoing.style.zIndex = "1";
  }

  /** Same clip, next loop: plain dissolve. */
  private fadeInStandby(): number {
    this.transitioning = true;
    const id = ++this.transitionId;
    const incoming = this.slideOf(this.standby);
    this.raise(incoming, this.slideOf(this.active));
    incoming.style.transition = `opacity ${this.loopFadeMs}ms linear`;
    incoming.style.opacity = "1";
    return id;
  }

  /** New product: soft-edged circle from `origin` (falls back to the centre). */
  private revealStandby(origin?: RevealOrigin): number {
    this.transitioning = true;
    const id = ++this.transitionId;
    const incoming = this.slideOf(this.standby);
    this.raise(incoming, this.slideOf(this.active));

    const w = incoming.clientWidth;
    const h = incoming.clientHeight;
    const x = origin?.x ?? w / 2;
    const y = origin?.y ?? h / 2;
    const radius =
      Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) +
      this.revealEdgePx;

    incoming.style.transition = "none";
    incoming.style.setProperty("--rx", `${x}px`);
    incoming.style.setProperty("--ry", `${y}px`);
    incoming.style.setProperty("--reveal-edge", `${this.revealEdgePx}px`);
    incoming.style.setProperty("--reveal", "0px");
    incoming.dataset.reveal = "true";
    incoming.style.opacity = "1";
    void incoming.offsetWidth; // commit the closed circle before animating
    incoming.style.transition = `--reveal ${this.switchMs}ms ${REVEAL_EASE}`;
    incoming.style.setProperty("--reveal", `${radius}px`);
    return id;
  }

  /** The standby slide fully covers the hero: retire the old one and swap roles. */
  private finishTransition(id: number) {
    if (this.disposed || !this.transitioning || id !== this.transitionId) return;
    const incoming = this.slideOf(this.standby);
    const outgoing = this.slideOf(this.active);
    delete incoming.dataset.reveal;
    incoming.style.transition = "";
    incoming.style.removeProperty("--reveal");
    outgoing.style.transition = "none";
    outgoing.style.opacity = "0";
    this.active.pause();
    [this.active, this.standby] = [this.standby, this.active];
    this.transitioning = false;

    // Prepare the new standby for the next loop of the current clip.
    this.slideOf(this.standby).style.backgroundColor = this.current.color;
    if (this.loadedSrc.get(this.standby) !== this.current.src) this.load(this.standby, this.current.src);
    else this.standby.currentTime = 0;

    if (this.switching) {
      this.switching = false;
      this.opts.onSwitchEnd?.(this.current);
    }
    if (this.pending) {
      const next = this.pending;
      this.pending = null;
      this.switchTo(next.source, next.origin);
    }
  }

  private tick = (now: number) => {
    if (this.disposed) return;
    const v = this.active;
    const d = v.duration;
    if (
      !this.transitioning &&
      !this.switching &&
      d > 0 &&
      !v.paused &&
      v.currentTime >= d - this.loopFadeMs / 1000
    ) {
      this.standby.currentTime = 0;
      this.tryPlay(this.standby);
      const id = this.fadeInStandby();
      window.setTimeout(() => this.finishTransition(id), this.loopFadeMs + 60);
    }
    // Watchdog: whenever the hero should be moving but the active clip is not
    // (a decoder stall, a pause we did not ask for, a missed loop), restart it.
    if (now - this.lastCheck > 700) {
      this.lastCheck = now;
      if (this.shouldRun() && !this.transitioning && !this.switching) {
        if (v.ended) this.loopNow();
        else if (v.paused && v.readyState >= 2) this.tryPlay(v);
      }
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  /** Cut to the next loop straight away (no dissolve). */
  private loopNow() {
    this.standby.currentTime = 0;
    this.tryPlay(this.standby);
    const id = this.fadeInStandby();
    this.finishTransition(id);
  }

  private pauseAll() {
    this.active.pause();
    this.standby.pause();
  }

  private resume() {
    if (!this.shouldRun()) return;
    this.tryPlay(this.active);
    if (this.transitioning) this.tryPlay(this.standby);
  }

  private onPlaying = (e: Event) => {
    const v = e.currentTarget as HTMLVideoElement;
    if (v === this.active && !this.transitioning) {
      const slide = this.slideOf(v);
      slide.style.zIndex = "2";
      slide.style.transition = `opacity ${this.loopFadeMs}ms linear`;
      slide.style.opacity = "1";
    }
    if (!this.firstFrameSeen) {
      this.firstFrameSeen = true;
      this.opts.onFirstFrame?.();
    }
  };

  private onEnded = (e: Event) => {
    const v = e.currentTarget as HTMLVideoElement;
    if (this.disposed || v !== this.active) return;
    if (this.switching) {
      // The next product is still loading: keep this one moving meanwhile.
      v.currentTime = 0;
      this.tryPlay(v);
      return;
    }
    if (this.transitioning) {
      this.finishTransition(this.transitionId);
      return;
    }
    // Hidden tab (rAF paused): no dissolve was started, cut to the next loop.
    this.loopNow();
  };

  private onVisibility = () => {
    if (document.hidden) this.pauseAll();
    else this.resume();
  };

  private onFirstInput = () => {
    if (!this.autoplayAllowed) {
      this.autoplayAllowed = true;
      this.resume();
    }
  };
}
