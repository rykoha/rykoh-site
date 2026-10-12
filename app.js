/* ------------------------------------------------------------------
   Site content. Edit this block to change what the cube links to.
   Each fragment breaks off the cube in this order. A fragment with a
   `page` opens that page; otherwise it opens a project detail page.
   Set `url: null` for projects that aren't public.
------------------------------------------------------------------- */
var SITE = {
  core: { kind: 'About me', title: 'Hi, I\'m Rykoh', blurb: 'Who I am, what I do, and how I like to work.', page: 'about' },
  fragments: [
    {
      id: 'project-one', kind: 'Project · 2026', title: 'Project One',
      blurb: 'One or two sentences on the problem it solves and who it is for.',
      year: '2026', role: 'Design & development', stack: 'Tools or tech used', status: 'Live',
      url: 'https://example.com',
      sections: [
        ['The problem', 'What wasn\'t working, and for whom.'],
        ['What I built', 'The main features and the decisions behind them.'],
        ['Result', 'What changed once it shipped. A number helps if you have one.']
      ]
    },
    {
      id: 'project-two', kind: 'Project · 2026', title: 'Project Two',
      blurb: 'What you built, the result, and one number if you have one.',
      year: '2026', role: 'Solo build', stack: 'Tools or tech used', status: 'Live',
      url: 'https://example.com',
      sections: [
        ['The problem', 'What wasn\'t working, and for whom.'],
        ['What I built', 'The main features and the decisions behind them.'],
        ['Result', 'What changed once it shipped.']
      ]
    },
    {
      id: 'project-three', kind: 'Project · 2025', title: 'Project Three',
      blurb: 'A client job or private project. No public link, so the page says so.',
      year: '2025', role: 'Client work', stack: 'Tools or tech used', status: 'Private',
      url: null,
      sections: [
        ['The brief', 'What the client asked for.'],
        ['What I built', 'The main features and the decisions behind them.'],
        ['Result', 'What the client got out of it.']
      ]
    },
    {
      id: 'services', kind: 'Hire me', title: 'Services',
      blurb: 'What you can hire me for, with typical scope and pricing.',
      page: 'services'
    }
  ]
};

/* ------------------------------------------------------------------
   Routing: #about, #services, #contact, #<fragment id>, or home.
------------------------------------------------------------------- */
(function () {
  var views = {};
  document.querySelectorAll('[data-view]').forEach(function (el) { views[el.dataset.view] = el; });
  var byId = {};
  SITE.fragments.forEach(function (f) { if (!f.page) byId[f.id] = f; });

  function hrefFor(item) { return '#' + (item.page || item.id); }
  SITE.hrefFor = hrefFor;

  // Fallback list under the cube (keyboard and no-WebGL access).
  var jump = document.getElementById('jump-list');
  [SITE.core].concat(SITE.fragments).forEach(function (item) {
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = hrefFor(item); a.textContent = item.page === 'about' ? 'About me' : item.title;
    li.appendChild(a); jump.appendChild(li);
  });

  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }

  function fillProject(p) {
    document.getElementById('pj-kind').textContent = p.kind;
    document.getElementById('pj-title').textContent = p.title;
    document.getElementById('pj-blurb').textContent = p.blurb;
    var spec = document.getElementById('pj-spec'); spec.textContent = '';
    [['Year', p.year], ['Role', p.role], ['Stack', p.stack], ['Status', p.status]].forEach(function (r) {
      if (!r[1]) return; spec.appendChild(el('dt', r[0])); spec.appendChild(el('dd', r[1]));
    });
    var secs = document.getElementById('pj-sections'); secs.textContent = '';
    (p.sections || []).forEach(function (s) { secs.appendChild(el('h2', s[0])); secs.appendChild(el('p', s[1])); });
    var cta = document.getElementById('pj-cta'); cta.textContent = '';
    if (p.url) {
      var a = el('a', 'View the project ↗', 'btn primary'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      cta.appendChild(a);
    } else {
      cta.appendChild(el('span', 'This project isn\'t publicly available.', 'private'));
    }
    var back = el('a', 'Back to the cube', 'btn'); back.href = '#'; cta.appendChild(back);
  }

  function route() {
    var key = location.hash.replace(/^#/, '');
    var name = 'home';
    if (views[key] && key !== 'project') name = key;
    else if (byId[key]) { name = 'project'; fillProject(byId[key]); }
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    SITE.onRoute && SITE.onRoute(name);
  }
  window.addEventListener('hashchange', route);
  SITE.route = route;
})();

/* ------------------------------------------------------------------
   Contact: copy email
------------------------------------------------------------------- */
document.getElementById('copy-email').addEventListener('click', function () {
  var btn = this, node = document.getElementById('email');
  function done(msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = 'Copy email'; }, 1800); }
  function select() { var r = document.createRange(); r.selectNodeContents(node); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  try {
    navigator.clipboard.writeText(node.textContent).then(function () { done('Copied'); }, function () { select(); done('Press Ctrl+C'); });
  } catch (e) { select(); done('Press Ctrl+C'); }
});


/* ------------------------------------------------------------------
   The cube: a 10 × 10 × 10 voxel block on a white studio void.
   Four irregular voxel chunks break off, one per click, and expose a
   glowing purple core cube in the middle.
------------------------------------------------------------------- */
(function () {
  var stage = document.getElementById('stage');
  var hint = document.getElementById('hint');
  var resetBtn = document.getElementById('reset');
  var preview = document.getElementById('preview');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    if (!window.THREE) throw new Error('three missing');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    document.body.classList.add('no-webgl');
    hint.textContent = 'Use the links below to explore.';
    SITE.route();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.9, 9);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x7c7e84, 0.55));
  var keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(-3, 6, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -2.2; keyLight.shadow.camera.right = 2.2;
  keyLight.shadow.camera.top = 2.2; keyLight.shadow.camera.bottom = -2.2;
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 16;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);
  var fillLight = new THREE.DirectionalLight(0xffffff, 0.25); fillLight.position.set(5, 1, 3); scene.add(fillLight);

  // Seeded random so the chunks have the same shape on every visit.
  var seed = 7;
  function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  var N = 10, VS = 0.2, H = (N - 1) / 2;           // voxels per side, voxel size, half index span
  var CORE_LO = 3, CORE_HI = 6;                     // core occupies indices 3..6 (4 × 4 × 4)
  function idx(x, y, z) { return x + N * (y + N * z); }
  function inCore(x, y, z) { return x >= CORE_LO && x <= CORE_HI && y >= CORE_LO && y <= CORE_HI && z >= CORE_LO && z <= CORE_HI; }

  // Split everything around the core into four wedges, one per vertical cube edge, so that
  // once all four are gone the core stands alone. Each break line steps in 2-voxel blocks,
  // so the chunks look snapped off rather than sliced.
  var owner = new Int8Array(N * N * N).fill(-1);    // -2 = core space, 0..3 = chunk
  var jitter = {};
  function stepJitter(key) { if (!(key in jitter)) jitter[key] = (rand() - 0.5) * 0.75; return jitter[key]; }
  var QUARTER = Math.PI / 2;
  for (var z = 0; z < N; z++) for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
    var k = idx(x, y, z);
    if (inCore(x, y, z)) { owner[k] = -2; continue; }
    var px = x - H, pz = z - H;
    var ang = Math.atan2(pz, px);
    var edge = ((Math.round(ang / QUARTER) % 4) + 4) % 4;
    var ring = Math.floor(Math.max(Math.abs(px), Math.abs(pz)) / 2);
    ang += stepJitter(edge + ':' + Math.floor(y / 2) + ':' + ring);
    owner[k] = ((Math.floor((ang + Math.PI) / QUARTER) % 4) + 4) % 4;
  }
  // Tidy up: any voxel cut off from the rest of its chunk joins the neighbouring chunk it touches.
  var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function neighbours(k, fn) {
    var cx = k % N, cy = Math.floor(k / N) % N, cz = Math.floor(k / (N * N));
    DIRS.forEach(function (d) {
      var X = cx + d[0], Y = cy + d[1], Z = cz + d[2];
      if (X < 0 || Y < 0 || Z < 0 || X >= N || Y >= N || Z >= N) return;
      fn(idx(X, Y, Z));
    });
  }
  for (var pass = 0; pass < 4; pass++) {
    var moved = 0;
    for (var ci = 0; ci < 4; ci++) {
      var seen = new Uint8Array(N * N * N), comps = [];
      for (k = 0; k < owner.length; k++) {
        if (owner[k] !== ci || seen[k]) continue;
        var comp = [], q = [k]; seen[k] = 1;
        while (q.length) {
          var cur = q.pop(); comp.push(cur);
          neighbours(cur, function (n) { if (owner[n] === ci && !seen[n]) { seen[n] = 1; q.push(n); } });
        }
        comps.push(comp);
      }
      comps.sort(function (a, b) { return b.length - a.length; });
      comps.slice(1).forEach(function (comp) {
        comp.forEach(function (n) {
          var votes = {};
          neighbours(n, function (m) { if (owner[m] >= 0 && owner[m] !== ci) votes[owner[m]] = (votes[owner[m]] || 0) + 1; });
          var bestOwner = -1, bestVotes = 0;
          Object.keys(votes).forEach(function (o) { if (votes[o] > bestVotes) { bestVotes = votes[o]; bestOwner = +o; } });
          if (bestOwner >= 0) { owner[n] = bestOwner; moved++; }
        });
      });
    }
    if (!moved) break;
  }

  // Build one instanced mesh per chunk, plus one for the base cube.
  var voxelGeo = new THREE.BoxGeometry(VS * 0.965, VS * 0.965, VS * 0.965);
  function voxelMaterial() { return new THREE.MeshStandardMaterial({ color: 0x8e9095, roughness: 0.82, metalness: 0.04 }); }
  var cube = new THREE.Group();
  cube.rotation.y = 0.65;
  scene.add(cube);
  var m4 = new THREE.Matrix4();

  function buildMesh(list, centre) {
    var mesh = new THREE.InstancedMesh(voxelGeo, voxelMaterial(), list.length);
    mesh.castShadow = true; mesh.receiveShadow = true;
    list.forEach(function (k, n) {
      var x = k % N, y = Math.floor(k / N) % N, z = Math.floor(k / (N * N));
      m4.makeTranslation((x - H) * VS - centre.x, (y - H) * VS - centre.y, (z - H) * VS - centre.z);
      mesh.setMatrixAt(n, m4);
    });
    if (mesh.setColorAt) {
      var col = new THREE.Color();
      list.forEach(function (k, n) { var v = 0.95 + rand() * 0.08; mesh.setColorAt(n, col.setRGB(v, v, v)); });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  var baseList = [], chunkLists = [[], [], [], []];
  for (k = 0; k < owner.length; k++) {
    if (owner[k] >= 0) chunkLists[owner[k]].push(k);
  }
  var frags = [], pickables = [];
  chunkLists.forEach(function (list, i) {
    if (!SITE.fragments[i]) { list.forEach(function (k) { baseList.push(k); }); return; }
    var centre = new THREE.Vector3();
    list.forEach(function (k) { centre.x += (k % N - H) * VS; centre.y += (Math.floor(k / N) % N - H) * VS; centre.z += (Math.floor(k / (N * N)) - H) * VS; });
    centre.divideScalar(list.length);
    var group = new THREE.Group();
    group.position.copy(centre);
    var mesh = buildMesh(list, centre);
    group.add(mesh);
    cube.add(group);
    var f = {
      index: i, group: group, mesh: mesh, data: SITE.fragments[i], mode: 'home', t: 0,
      homePos: centre.clone(), homeQuat: new THREE.Quaternion(),
      fromPos: new THREE.Vector3(), fromQuat: new THREE.Quaternion(), fromScale: 1,
      toPos: new THREE.Vector3(), toQuat: new THREE.Quaternion(), toScale: 1,
      spin: 0, label: null, slot: i, out: new THREE.Vector3(), cross: false
    };
    mesh.userData.frag = f;
    frags.push(f);
    pickables.push(mesh);
  });
  // Only used if there are fewer than four fragments in SITE.
  if (baseList.length) { var baseMesh = buildMesh(baseList, new THREE.Vector3()); cube.add(baseMesh); pickables.push(baseMesh); }

  // The glowing purple core cube with a black trim along its edges and a silver line down the middle of the trim.
  var CORE_SIZE = (CORE_HI - CORE_LO + 1) * VS * 0.96;
  function coreTexture() {
    var c = document.createElement('canvas'), S = 256;
    c.width = c.height = S;
    var g = c.getContext('2d');
    var bg = g.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.75);
    bg.addColorStop(0, '#7b2ff0'); bg.addColorStop(1, '#4a10b0');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }
  var coreTex = coreTexture();
  var coreMats = [0, 1, 2, 3, 4, 5].map(function () {
    var tex = coreTex;
    return new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.75, roughness: 0.4, metalness: 0 });
  });
  var core = new THREE.Mesh(new THREE.BoxGeometry(CORE_SIZE, CORE_SIZE, CORE_SIZE), coreMats);
  cube.add(core);
  pickables.push(core);
  // Black trim along each of the 12 edges, with a thin silver line painted down the middle of each
  // long face. Painting it into the texture (rather than layering a second shape) keeps it from shimmering.
  function stripeTexture(vertical) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#0b0b10'; g.fillRect(0, 0, 64, 64);
    var grad = vertical ? g.createLinearGradient(25, 0, 39, 0) : g.createLinearGradient(0, 25, 0, 39);
    grad.addColorStop(0, '#0b0b10'); grad.addColorStop(0.3, '#c9ced6'); grad.addColorStop(0.5, '#eef1f5'); grad.addColorStop(0.7, '#c9ced6'); grad.addColorStop(1, '#0b0b10');
    g.fillStyle = grad;
    if (vertical) g.fillRect(25, 0, 14, 64); else g.fillRect(0, 25, 64, 14);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    return t;
  }
  var capMat = new THREE.MeshBasicMaterial({ color: 0x0b0b10 });
  var hStripe = new THREE.MeshBasicMaterial({ map: stripeTexture(false) });
  var vStripe = new THREE.MeshBasicMaterial({ map: stripeTexture(true) });
  // Box face order is +x, -x, +y, -y, +z, -z; pick the stripe direction that runs along each bar.
  var trimFaces = {
    x: [capMat, capMat, hStripe, hStripe, hStripe, hStripe],
    y: [vStripe, vStripe, capMat, capMat, vStripe, vStripe],
    z: [hStripe, hStripe, vStripe, vStripe, capMat, capMat]
  };
  var TRIM = 0.027, half = CORE_SIZE / 2, len = CORE_SIZE + TRIM;
  function trimBar(sx, sy, sz, x, y, z, axis) {
    core.add(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), trimFaces[axis]).translateX(x).translateY(y).translateZ(z));
  }
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (sg) {
    trimBar(len, TRIM, TRIM, 0, sg[0] * half, sg[1] * half, 'x');
    trimBar(TRIM, len, TRIM, sg[0] * half, 0, sg[1] * half, 'y');
    trimBar(TRIM, TRIM, len, sg[0] * half, sg[1] * half, 0, 'z');
  });
  var coreLight = new THREE.PointLight(0x7a35ff, 1.2, 2.4, 2);
  cube.add(coreLight);

  // Grey digital particles, all behind the cube and its chunks: dense in the middle, thinning toward the edges.
  var PCOUNT = 1200, VOID_GREY = 0.94;
  var pPos = new Float32Array(PCOUNT * 3), pCol = new Float32Array(PCOUNT * 3);
  var pBase = new Float32Array(PCOUNT), pVel = new Float32Array(PCOUNT * 2), pAge = new Float32Array(PCOUNT), pLife = new Float32Array(PCOUNT);
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function spawn(i, age) {
    // Centre each particle on the camera's line of sight through the cube at its depth, and scale the
    // spread with depth, so on screen the field is densest right behind the cube and thins out radially.
    var z = -6 - Math.random() * 7;
    var t = (camera.position.z - z) / camera.position.z;
    var cy = camera.position.y + ((lookY || 0) - camera.position.y) * t;
    var spread = 1.25 * t;
    pPos[i * 3] = gauss() * spread * 1.15; pPos[i * 3 + 1] = cy + gauss() * spread; pPos[i * 3 + 2] = z;
    var dir = Math.random() * Math.PI * 2, speed = 0.02 + Math.random() * 0.06;
    pVel[i * 2] = Math.cos(dir) * speed; pVel[i * 2 + 1] = Math.sin(dir) * speed;
    pBase[i] = 0.3 + Math.random() * 0.4;
    pLife[i] = 4 + Math.random() * 7; pAge[i] = age;
  }
  for (var i = 0; i < PCOUNT; i++) spawn(i, Math.random() * 8);
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, sizeAttenuation: true, depthWrite: false }));
  particles.renderOrder = -1;
  scene.add(particles);
  function updateParticles(dt) {
    for (var i = 0; i < PCOUNT; i++) {
      pAge[i] += dt;
      if (pAge[i] > pLife[i]) spawn(i, 0);
      pPos[i * 3] += pVel[i * 2] * dt; pPos[i * 3 + 1] += pVel[i * 2 + 1] * dt;
      // Fade in and out over a second, and flicker now and then like static.
      var fade = Math.min(1, pAge[i], pLife[i] - pAge[i]);
      var tone = Math.random() < 0.01 ? VOID_GREY : pBase[i];
      var c = VOID_GREY + (tone - VOID_GREY) * fade;
      pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = c;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }
  updateParticles(0);

  // Floating labels for parked chunks and the core.
  function makeLabel(text, cls) {
    var d = document.createElement('div'); d.className = 'frag-label' + (cls ? ' ' + cls : ''); d.textContent = text;
    stage.appendChild(d); return d;
  }
  frags.forEach(function (f) { f.label = makeLabel(f.data.title); });
  var coreLabel = makeLabel('About me', 'core');

  // Layout: slots sit beside the cube on wide screens, above and below on tall ones.
  var slots = [], parkScale = 0.7, lookY = 0;
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (camera.aspect >= 1.15) {
      slots = [[-2.9, 0.75], [2.9, 0.75], [-2.9, -1.15], [2.9, -1.15]];
      camera.position.z = Math.max(3.8 / (tan * camera.aspect), 2.3 / tan);
      parkScale = 0.5;
    } else {
      slots = [[-1.0, 2.25], [1.0, 2.25], [-1.0, -2.2], [1.0, -2.2]];
      camera.position.z = Math.max(3.75 / tan, 2.0 / (tan * camera.aspect));
      parkScale = 0.42;
    }
    // Look slightly down on the cube, like the reference render. On tall screens shift the scene down, clear of the title.
    camera.position.y = camera.position.z * 0.22;
    lookY = camera.aspect >= 1.15 ? 0 : 0.55;
    camera.position.y += lookY;
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
    for (var pi = 0; pi < PCOUNT; pi++) spawn(pi, Math.random() * pLife[pi]);
    frags.forEach(function (f) {
      if (f.mode === 'parked' || f.mode === 'flying') { f.toPos.set(slots[f.slot][0], slots[f.slot][1], 0); f.toScale = parkScale; }
    });
  }
  new ResizeObserver(layout).observe(stage);
  layout();

  var detached = 0;
  function updateHint() {
    var left = frags.length - detached;
    if (detached === 0) hint.textContent = 'Click the cube to break off a piece.';
    else if (left > 0) hint.innerHTML = 'Hover a piece to preview it. <b>' + left + (left === 1 ? ' piece' : ' pieces') + '</b> left on the cube.';
    else hint.innerHTML = 'The core is exposed. Click the <b>purple core</b> to read about me.';
    resetBtn.hidden = detached === 0;
  }

  var nudge = 0;
  // Break off the chunk that was clicked, or the one nearest the viewer if the click landed elsewhere.
  function detachNext(clicked) {
    var f = clicked && clicked.mode === 'home' ? clicked : null;
    if (!f) {
      var best = Infinity, wp = new THREE.Vector3();
      frags.forEach(function (x) {
        if (x.mode !== 'home') return;
        var d = x.group.getWorldPosition(wp).distanceTo(camera.position);
        if (d < best) { best = d; f = x; }
      });
    }
    if (!f) { nudge = 1; return; }
    scene.attach(f.group);
    f.fromPos.copy(f.group.position); f.fromQuat.copy(f.group.quaternion); f.fromScale = 1;
    // Push the chunk straight out from the cube first, then send it to the free slot on its own side,
    // so chunks never pass through the cube or each other on the way out.
    f.out.copy(f.fromPos).setY(f.fromPos.y * 0.5).normalize();
    var exitPoint = f.fromPos.clone().addScaledVector(f.out, 1.6);
    var taken = frags.filter(function (x) { return x !== f && x.mode !== 'home' && x.mode !== 'returning'; }).map(function (x) { return x.slot; });
    var bestSlot = -1, bestD = Infinity;
    slots.forEach(function (sl, si) {
      if (taken.indexOf(si) >= 0) return;
      var d = Math.hypot(sl[0] - exitPoint.x, sl[1] - exitPoint.y);
      if (d < bestD) { bestD = d; bestSlot = si; }
    });
    f.slot = bestSlot;
    f.toPos.set(slots[f.slot][0], slots[f.slot][1], 0);
    // If the slot is on the far side, swing round in front of the core instead of through it.
    f.cross = Math.sign(slots[f.slot][0]) !== Math.sign(exitPoint.x) || exitPoint.z < -0.5;
    f.toQuat.setFromEuler(new THREE.Euler(0.35 + f.index * 0.4, -0.6 + f.index * 0.9, 0.2));
    f.toScale = parkScale;
    f.mode = 'flying'; f.t = 0; f.spin = 0;
    detached++; updateHint();
  }

  function reassemble() {
    hidePreview();
    frags.forEach(function (f) {
      if (f.mode === 'home') return;
      cube.attach(f.group);
      f.fromPos.copy(f.group.position); f.fromQuat.copy(f.group.quaternion); f.fromScale = f.group.scale.x;
      f.toPos.copy(f.homePos); f.toQuat.copy(f.homeQuat); f.toScale = 1;
      f.out.copy(f.homePos).setY(f.homePos.y * 0.5).normalize();
      f.mode = 'returning'; f.t = 0;
      f.label.classList.remove('on');
    });
    detached = 0; updateHint();
  }
  resetBtn.addEventListener('click', reassemble);

  // Picking
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    var r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // Ignore chunks that are mid-flight, so a quick second click still reaches the cube behind them.
    var hit = ray.intersectObjects(pickables, false).find(function (h) {
      var hf = h.object.userData.frag;
      return !(hf && (hf.mode === 'flying' || hf.mode === 'returning'));
    });
    if (!hit) return null;
    // The core becomes a link once every piece is out; before that, clicking it keeps breaking the cube.
    if (hit.object === core) return detached < frags.length ? { type: 'cube' } : { type: 'core', item: SITE.core };
    var f = hit.object.userData.frag;
    if (f && f.mode === 'parked') return { type: 'frag', item: f.data, frag: f };
    if (f && (f.mode === 'flying' || f.mode === 'returning')) return null;
    return { type: 'cube', frag: f };
  }

  var hovered = null, pinned = null;
  function setHighlight(target) {
    frags.forEach(function (f) { f.mesh.material.emissive.setHex(0x000000); });
    coreMats.forEach(function (m) { m.emissiveIntensity = 0.75; });
    if (!target) return;
    if (target.type === 'frag') target.frag.mesh.material.emissive.setHex(0x3a2470);
    if (target.type === 'core') coreMats.forEach(function (m) { m.emissiveIntensity = 1.05; });
  }
  function fillPreview(item, isCore) {
    document.getElementById('pv-kind').textContent = item.kind;
    document.getElementById('pv-title').textContent = item.title;
    document.getElementById('pv-blurb').textContent = item.blurb;
    document.getElementById('pv-thumb').textContent = isCore ? '' : 'Preview image';
    document.getElementById('pv-open').href = SITE.hrefFor(item);
    preview.classList.toggle('is-core', !!isCore);
  }
  function placePreview(ev) {
    var r = stage.getBoundingClientRect();
    var x = ev.clientX - r.left + 18, y = ev.clientY - r.top + 18;
    var pw = preview.offsetWidth, ph = preview.offsetHeight;
    if (x + pw > r.width - 8) x = ev.clientX - r.left - pw - 18;
    if (y + ph > r.height - 8) y = r.height - ph - 8;
    preview.style.left = Math.max(8, x) + 'px'; preview.style.top = Math.max(8, y) + 'px';
  }
  function hidePreview() { preview.hidden = true; preview.classList.remove('pinned'); pinned = null; hovered = null; setHighlight(null); stage.classList.remove('is-hovering'); }

  var canvas = renderer.domElement;
  canvas.addEventListener('pointermove', function (ev) {
    if (ev.pointerType !== 'mouse' || pinned) return;
    var p = pick(ev);
    var linkish = p && (p.type === 'frag' || p.type === 'core');
    stage.classList.toggle('is-hovering', !!p && (linkish || detached < frags.length));
    hovered = linkish ? p : null;
    setHighlight(hovered);
    if (hovered) {
      fillPreview(hovered.item, hovered.type === 'core');
      preview.hidden = false; placePreview(ev);
    } else preview.hidden = true;
  });
  canvas.addEventListener('pointerleave', function () { if (!pinned) { preview.hidden = true; hovered = null; setHighlight(null); stage.classList.remove('is-hovering'); } });

  canvas.addEventListener('click', function (ev) {
    var p = pick(ev);
    var touch = ev.pointerType && ev.pointerType !== 'mouse';
    if (!p) { hidePreview(); return; }
    if (p.type === 'cube') { hidePreview(); detachNext(p.frag); return; }
    // Chunk or core: mouse opens straight away; touch shows the preview first.
    if (touch || (ev.pointerType === undefined && matchMedia('(hover: none)').matches)) {
      if (pinned && pinned.item === p.item) { location.hash = SITE.hrefFor(p.item); return; }
      pinned = p; setHighlight(p);
      fillPreview(p.item, p.type === 'core');
      preview.hidden = false; preview.classList.add('pinned');
      return;
    }
    location.hash = SITE.hrefFor(p.item);
  });

  // Animation
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var clock = new THREE.Clock(), elapsed = 0, running = true;
  var coreOpen = 0;
  var c1 = new THREE.Vector3(), c2 = new THREE.Vector3();
  function bezier(out, p0, p1, p2, p3, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    out.set(a * p0.x + b * p1.x + c * p2.x + d * p3.x, a * p0.y + b * p1.y + c * p2.y + d * p3.y, a * p0.z + b * p1.z + c * p2.z + d * p3.z);
  }
  var flyTime = reduced ? 0.01 : 1.6;
  var tmpV = new THREE.Vector3();

  function positionLabel(el, worldPos, dy, show) {
    if (!show) { el.classList.remove('on'); return; }
    tmpV.copy(worldPos); tmpV.y += dy; tmpV.project(camera);
    el.style.left = (tmpV.x * 0.5 + 0.5) * stage.clientWidth + 'px';
    el.style.top = (-tmpV.y * 0.5 + 0.5) * stage.clientHeight + 'px';
    el.classList.add('on');
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    cube.rotation.y += dt * (reduced ? 0.03 : 0.18);
    cube.rotation.x = reduced ? 0 : Math.sin(elapsed * 0.25) * 0.06;
    var s = 1;
    if (nudge > 0) { nudge = Math.max(0, nudge - dt * 3); s = 1 + Math.sin(nudge * Math.PI) * 0.035; }
    cube.scale.setScalar(s);

    // Core pulse.
    var pulse = reduced ? 0 : Math.sin(elapsed * 2.2) * 0.15;
    // The core only lights the cube's insides once chunks have come away, so it doesn't bleed through the gaps.
    coreOpen += ((detached / frags.length) - coreOpen) * Math.min(1, dt * 2);
    coreLight.intensity = (1.2 + pulse * 1.5) * coreOpen;

    frags.forEach(function (f) {
      var g = f.group;
      if (f.mode === 'flying' || f.mode === 'returning') {
        f.t = Math.min(1, f.t + dt / flyTime);
        var k = ease(f.t);
        if (f.mode === 'flying') {
          c1.copy(f.fromPos).addScaledVector(f.out, 1.6);
          c2.copy(f.toPos); c2.z += f.cross ? 2.6 : 0.9;
        } else {
          // Coming home: approach from outside along the chunk's own direction, then slot in.
          c1.copy(f.fromPos); c1.z += 0.8;
          c2.copy(f.toPos).addScaledVector(f.out, 1.8);
        }
        bezier(g.position, f.fromPos, c1, c2, f.toPos, k);
        g.quaternion.copy(f.fromQuat).slerp(f.toQuat, k);
        g.scale.setScalar(f.fromScale + (f.toScale - f.fromScale) * k);
        if (f.t >= 1) f.mode = f.mode === 'flying' ? 'parked' : 'home';
      } else if (f.mode === 'parked') {
        f.spin += dt * (reduced ? 0 : 0.3);
        g.position.set(f.toPos.x, f.toPos.y + (reduced ? 0 : Math.sin(elapsed * 1.1 + f.index) * 0.06), 0);
        g.scale.setScalar(f.toScale);
        g.quaternion.copy(f.toQuat);
        g.rotateY(f.spin);
      }
      positionLabel(f.label, g.position, -0.72, f.mode === 'parked');
    });
    positionLabel(coreLabel, cube.position, -0.8, detached === frags.length);

    if (!reduced) updateParticles(dt);

    renderer.render(scene, camera);
  }

  SITE.onRoute = function (name) {
    var shouldRun = name === 'home';
    if (shouldRun && !running) { running = true; clock.getDelta(); layout(); requestAnimationFrame(frame); }
    if (!shouldRun) { running = false; hidePreview(); }
  };

  updateHint();
  SITE.route();
  requestAnimationFrame(frame);
})();
