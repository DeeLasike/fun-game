// Enhanced Three.js Christmas mini-game
let scene, camera, renderer, clock;
let player, snowflakes = [], gifts = [], effects = [];
let score = 0;
let running = false;

// Audio (WebAudio API) for simple feedback
let audioCtx;

init();
animate();

function init() {
    const container = document.getElementById('game-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00111a);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfff6e5, 0.9);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Ground (snow)
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Player (simple person: head, body, arms, legs)
    player = new THREE.Group();
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.7, 16), bodyMat);
    body.position.y = 0.7;
    player.add(body);
    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0b0 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), headMat);
    head.position.y = 1.18;
    player.add(head);
    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 12), armMat);
    armL.position.set(-0.32, 0.92, 0);
    armL.rotation.z = Math.PI / 7;
    player.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.32;
    armR.rotation.z = -Math.PI / 7;
    player.add(armR);
    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222288 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12), legMat);
    legL.position.set(-0.13, 0.25, 0);
    player.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.13;
    player.add(legR);
    // Set initial position
    player.position.set(0, 0, 0);
    scene.add(player);

    // Tree
    const tree = new THREE.Group();
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x0a5a0a });
    for (let i = 0; i < 4; i++) {
        const coneGeo = new THREE.ConeGeometry(1.8 - i * 0.35, 1.5, 16);
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.8 + i * 0.6;
        tree.add(cone);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b3b12 }));
    trunk.position.y = 0.3;
    tree.add(trunk);
    tree.position.set(-3, 0, -3);
    scene.add(tree);

    // Gifts - collectibles (initial spawn)
    spawnGifts(10);

    // Snow particles
    const snowGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < 120; i++) {
        const s = new THREE.Mesh(snowGeo, snowMat);
        s.position.set((Math.random() - 0.5) * 40, Math.random() * 10 + 1, (Math.random() - 0.5) * 40);
        snowflakes.push(s);
        scene.add(s);
    }

    // Controls
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    // HUD & Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('left-btn').addEventListener('touchstart', () => movePlayer(-1));
    document.getElementById('right-btn').addEventListener('touchstart', () => movePlayer(1));
    document.getElementById('left-btn').addEventListener('mousedown', () => movePlayer(-1));
    document.getElementById('right-btn').addEventListener('mousedown', () => movePlayer(1));

    clock = new THREE.Clock();

    // prepare audio context lazily on first interaction
    window.addEventListener('pointerdown', () => { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }, { once: true });
}

function spawnGifts(n) {
    const giftGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const giftMat1 = new THREE.MeshStandardMaterial({ color: 0xff0044 });
    const giftMat2 = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    for (let i = 0; i < n; i++) {
        const g = new THREE.Mesh(giftGeo, (i % 2 === 0) ? giftMat1 : giftMat2);
        g.position.set((Math.random() - 0.5) * 12, 0.2, -Math.random() * 20 - 2);
        g.userData = { collected: false };
        gifts.push(g);
        scene.add(g);
    }
    updateScoreHUD();
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // snow (always animate)
    for (let s of snowflakes) {
        s.position.y -= dt * 1.5;
        if (s.position.y < -1) s.position.y = Math.random() * 8 + 6;
    }

    if (running) {
        // forward movement
        player.position.z -= dt * 1.5;

        // collect gifts if close
        for (let i = gifts.length - 1; i >= 0; i--) {
            const g = gifts[i];
            if (g.userData.collected) continue;
            const dist = player.position.distanceTo(g.position);
            if (dist < 0.9) {
                collectGift(g, i);
            }
        }
    }

    // update effects (collect animations)
    for (let i = effects.length - 1; i >= 0; i--) {
        const ef = effects[i];
        ef.time += dt;
        const t = ef.time / ef.duration;
        ef.mesh.scale.setScalar(1 + t * 2);
        ef.mesh.material.opacity = 1 - t;
        if (ef.time >= ef.duration) {
            scene.remove(ef.mesh);
            effects.splice(i, 1);
        }
    }

    // camera follow (smooth)
    const desired = player.position.clone().add(new THREE.Vector3(0, 4, 8));
    camera.position.lerp(desired, 0.08);
    camera.lookAt(player.position.x, player.position.y, player.position.z);

    renderer.render(scene, camera);
}

function collectGift(g, index) {
    g.userData.collected = true;
    scene.remove(g);
    gifts.splice(index, 1);

    // add small pop effect
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 1 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), glowMat);
    glow.position.copy(g.position);
    scene.add(glow);
    effects.push({ mesh: glow, time: 0, duration: 0.6 });

    playCollectSound();

    score += 1;
    updateScoreHUD();

    if (gifts.length === 0) {
        // win
        running = false;
        showOverlay('You Win!', `Gifts collected: ${score}`);
    }
}

function updateScoreHUD() {
    const el = document.getElementById('score');
    el.textContent = `Gifts: ${score}`;
}

function playCollectSound() {
    if (!audioCtx) return; // not initialized yet
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + 0.3);
}

function startGame() {
    // reset positions and state
    score = 0;
    updateScoreHUD();
    player.position.set(0, 0.5, 0);

    // remove existing gifts & effects
    for (const g of gifts) scene.remove(g);
    gifts = [];
    for (const ef of effects) scene.remove(ef.mesh);
    effects = [];

    // spawn gifts further ahead
    spawnGifts(10);

    running = true;
    hideOverlay();
}

function showOverlay(title, subtitle) {
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-sub').textContent = subtitle || '';
    document.getElementById('overlay').style.display = 'flex';
}

function hideOverlay() {
    document.getElementById('overlay').style.display = 'none';
}

function movePlayer(dir) {
    // dir = -1 or 1
    const step = 0.6;
    player.position.x += dir * step;
}

function onKeyDown(e) {
    if (e.key === 'ArrowLeft') movePlayer(-1);
    if (e.key === 'ArrowRight') movePlayer(1);
    if (e.key === ' ' || e.key === 'Enter') {
        if (!running) startGame();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
