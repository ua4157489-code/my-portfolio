const _v = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _col = new THREE.Color();

export default function HackerLock({ sc }: { sc: Shared }) {
  const group = useRef<THREE.Group>(null!);
  const wire = useRef<THREE.MeshBasicMaterial>(null!);
  const fill = useRef<THREE.MeshBasicMaterial>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);
  const ringMatA = useRef<THREE.MeshBasicMaterial>(null!);
  const ringMatB = useRef<THREE.MeshBasicMaterial>(null!);
  const scan = useRef<THREE.Mesh>(null!);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null!);
  const amount = useRef(0);
  const dim = useRef(0);

  const lock = useMemo(() => buildLock(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // how broken it is: a slow, smooth follow of the scroll position
    const target = THREE.MathUtils.smoothstep(sc.current.s, 0.03, 0.85);
    amount.current = THREE.MathUtils.damp(amount.current, target, 1.2, delta);
    const a = amount.current;

    // calm down while the About portrait is on screen
    const el = document.getElementById("about");
    let aw = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      const far =
        Math.abs(r.top + r.height / 2 - window.innerHeight / 2) /
        (r.height / 2 + window.innerHeight * 0.25);
      aw = THREE.MathUtils.smoothstep(1 - far, 0.1, 0.5);
    }
    dim.current = THREE.MathUtils.damp(dim.current, aw, 3, delta);
    const m = 1 - 0.85 * dim.current;

    // move every shard
    const { geo, orig, centers, dirs, axes, speeds, spins, delays, faces } = lock;
    const arr = geo.attributes.position.array as Float32Array;
    for (let f = 0; f < faces; f++) {
      const k = THREE.MathUtils.clamp((a - delays[f]) / 0.6, 0, 1);
      const e = k * k * (3 - 2 * k); // smooth ease in and out
      const cx = centers[f * 3];
      const cy = centers[f * 3 + 1];
      const cz = centers[f * 3 + 2];
      _axis.set(axes[f * 3], axes[f * 3 + 1], axes[f * 3 + 2]);
      _q.setFromAxisAngle(_axis, e * spins[f]);
      const travel = e * speeds[f] * 6;
      const dx = dirs[f * 3] * travel;
      const dy = dirs[f * 3 + 1] * travel - e * e * 1.2; // slow fall
      const dz = dirs[f * 3 + 2] * travel;
      for (let v = 0; v < 3; v++) {
        const i = f * 9 + v * 3;
        _v.set(orig[i] - cx, orig[i + 1] - cy, orig[i + 2] - cz).applyQuaternion(_q);
        arr[i] = cx + _v.x + dx;
        arr[i + 1] = cy + _v.y + dy;
        arr[i + 2] = cz + _v.z + dz;
      }
    }
    geo.attributes.position.needsUpdate = true;

    // placement: right side of the screen, scaled down on narrow screens
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, -2.2]);
    const g = group.current;
    g.position.set(vp.width * 0.2, 0.1, -2.2);
    g.scale.setScalar(Math.min(1, vp.width / 12));
    g.rotation.y = Math.sin(t * 0.4) * 0.4 + state.pointer.x * 0.3 + a * 0.8;
    g.rotation.x = -state.pointer.y * 0.15 + a * 0.2;

    // green while locked, hot pink-red once breached
    wire.current.color.copy(_col.copy(GREEN).lerp(RED, a));
    wire.current.opacity = (0.55 - 0.3 * a) * m;
    fill.current.opacity = 0.06 * m;

    // the "firewall" rings spin, then expand and fade as it breaks
    ringA.current.rotation.z = t * 0.4;
    ringB.current.rotation.z = -t * 0.3;
    ringA.current.scale.setScalar(1 + a * 0.5);
    ringB.current.scale.setScalar(1 + a * 0.5);
    ringMatA.current.opacity = 0.6 * (1 - a) * m;
    ringMatB.current.opacity = 0.4 * (1 - a) * m;

    // scan line sweeping up and down
    scan.current.position.y = Math.sin(t * 0.9) * 1.4;
    scanMat.current.opacity = 0.5 * (1 - a) * m;
  });

  return (
    <group ref={group}>
      <mesh geometry={lock.geo} frustumCulled={false}>
        <meshBasicMaterial ref={wire} color="#00ff9c" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh geometry={lock.geo} frustumCulled={false}>
        <meshBasicMaterial
          ref={fill}
          color="#00c8ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ringA}>
        <torusGeometry args={[2.5, 0.014, 6, 100, 4.4]} />
        <meshBasicMaterial
          ref={ringMatA}
          color="#00c8ff"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[2.85, 0.01, 6, 100, 3.2]} />
        <meshBasicMaterial
          ref={ringMatB}
          color="#00ff9c"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={scan}>
        <planeGeometry args={[3.4, 0.03]} />
        <meshBasicMaterial
          ref={scanMat}
          color="#00ff9c"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
