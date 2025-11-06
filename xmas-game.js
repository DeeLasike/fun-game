// Brand new Three.js Christmas Game: "Santa's Sleigh Ride"
// Goal: Collect as many presents as possible while flying over a snowy landscape

let scene, camera, renderer, sleigh, presents = [], snowflakes = [], clock, score = 0, running = false;

init();
animate();

function init() {
    const container = document.getElementById('game-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a3b4c);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x2a3b4c);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const dir = new THREE.DirectionalLight(0xfff6e5, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Ground (snowy)
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Sleigh (player)
    sleigh = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xff2222 }));
    base.position.y = 0.5;
    sleigh.add(base);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0x880000 }));
    seat.position.set(0, 0.7, 0);
    sleigh.add(seat);
    // Runners
    const runnerMat = new THREE.MeshStandardMaterial({ color: 0xffcc66 });
    for (let s = -1; s <= 1; s += 2) {
        const runner = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16, Math.PI), runnerMat);
        runner.position.set(s * 0.45, 0.35, 0.22);
        runner.rotation.z = Math.PI / 2;
        sleigh.add(runner);
    }
    sleigh.position.set(0, 1, 0);
    scene.add(sleigh);

    // Presents
    spawnPresents(10);

    // Snow
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < 120; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), snowMat);
        s.position.set((Math.random() - 0.5) * 40, Math.random() * 10 + 1, (Math.random() - 0.5) * 40);
        snowflakes.push(s);
        scene.add(s);
    }

    // Controls
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);
    clock = new THREE.Clock();
}

function spawnPresents(n) {
    const giftGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const giftMat1 = new THREE.MeshStandardMaterial({ color: 0x00ccff });
    const giftMat2 = new THREE.MeshStandardMaterial({ color: 0xff0044 });
    for (let i = 0; i < n; i++) {
        const g = new THREE.Mesh(giftGeo, (i % 2 === 0) ? giftMat1 : giftMat2);
        g.position.set((Math.random() - 0.5) * 12, 1, -Math.random() * 20 - 2);
        presents.push(g);
        scene.add(g);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // Snow
    for (let s of snowflakes) {
        s.position.y -= dt * 1.5;
        if (s.position.y < -1) s.position.y = Math.random() * 8 + 6;
    }

    // Sleigh movement (if running)
    if (running) {
        sleigh.position.z -= dt * 2.2;
        // Collect presents
        for (let i = presents.length - 1; i >= 0; i--) {
            const g = presents[i];
            if (sleigh.position.distanceTo(g.position) < 0.8) {
                scene.remove(g);
                presents.splice(i, 1);
                score++;
            }
        }
    }

    // Update score HUD
    const hud = document.getElementById('score-hud');
    if (hud) hud.textContent = `Score: ${score}`;

    // Camera follow
    camera.position.lerp(sleigh.position.clone().add(new THREE.Vector3(0, 4, 10)), 0.08);
    camera.lookAt(sleigh.position.x, sleigh.position.y, sleigh.position.z);

    renderer.render(scene, camera);
}

function onKeyDown(e) {
    const step = 0.6;
    if (e.key === 'ArrowLeft') sleigh.position.x -= step;
    if (e.key === 'ArrowRight') sleigh.position.x += step;
    if (e.key === 'ArrowUp') sleigh.position.z -= step;
    if (e.key === 'ArrowDown') sleigh.position.z += step;
    if (e.key === ' ' || e.key === 'Enter') running = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
