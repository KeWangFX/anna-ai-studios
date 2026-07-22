import * as THREE from "./assets/vendor/three.module.min.js";

const canvas = document.querySelector("[data-circuit-canvas]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas instanceof HTMLCanvasElement && !reduceMotion) {
  const section = canvas.closest("[data-journey]");
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance"
    });
  } catch {
    section?.classList.add("is-webgl-unavailable");
  }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      iTime: { value: 0 },
      iProgress: { value: 0 },
      iResolution: { value: new THREE.Vector2(1, 1) }
    };

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float iTime;
        uniform float iProgress;
        uniform vec2 iResolution;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float lineGlow(float distanceToLine, float width) {
          return width / max(distanceToLine, 0.0008);
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
          vec2 gridUv = uv * 7.0;
          vec2 cell = abs(fract(gridUv) - 0.5);

          float gridLines = smoothstep(0.495, 0.46, max(cell.x, cell.y));
          float circuitA = lineGlow(abs(uv.y - 0.18 * sin(uv.x * 4.0 + iProgress * 4.0)), 0.0022);
          float circuitB = lineGlow(abs(uv.x + 0.42 - 0.08 * sin(uv.y * 8.0)), 0.0015);
          float copperMask = min(1.0, circuitA * 0.19 + circuitB * 0.12 + gridLines * 0.035);

          float photonX = mix(-1.25, 1.25, iProgress);
          float photonY = 0.18 * sin(photonX * 4.0 + iProgress * 4.0);
          float photonDistance = length(uv - vec2(photonX, photonY));
          float photon = 0.012 / max(photonDistance, 0.005);
          photon *= smoothstep(1.0, 0.1, abs(uv.x - photonX));

          float dust = step(0.994, hash(floor(uv * 260.0))) * (0.45 + 0.55 * sin(iTime * 1.7 + uv.x * 90.0));
          float edgeFade = smoothstep(1.2, 0.35, length(uv * vec2(0.74, 1.0)));

          vec3 copper = vec3(0.94, 0.45, 0.16) * copperMask;
          vec3 cyan = vec3(0.22, 1.0, 0.79) * min(photon, 2.0);
          vec3 color = (copper + cyan + dust * vec3(0.42, 0.95, 0.82)) * edgeFade;
          float alpha = clamp(max(max(copperMask * 0.65, photon * 0.38), dust * 0.25) * edgeFade, 0.0, 0.72);

          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    scene.add(new THREE.Mesh(geometry, material));

    let frameId = 0;
    let active = true;
    let lastTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      uniforms.iResolution.value.set(rect.width * pixelRatio, rect.height * pixelRatio);
    };

    const render = (now) => {
      if (!active || document.hidden) {
        frameId = 0;
        return;
      }
      // Delta time is capped so returning from a background tab never produces a visual jump.
      uniforms.iTime.value += Math.min(32, now - lastTime) / 1000;
      lastTime = now;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (frameId || !active || document.hidden) return;
      lastTime = performance.now();
      frameId = window.requestAnimationFrame(render);
    };

    window.addEventListener("anna:journey-progress", (event) => {
      uniforms.iProgress.value = Number(event.detail?.progress || 0);
    });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);

    if (section && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          active = entry.isIntersecting;
          if (active) start();
        },
        { rootMargin: "100px" }
      );
      observer.observe(section);
    }

    resize();
    start();

    window.addEventListener(
      "pagehide",
      () => {
        if (frameId) window.cancelAnimationFrame(frameId);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
      { once: true }
    );
  }
}
