import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.getElementById("hero-stage");
const canvas = document.getElementById("hero-canvas");
const letters = [];

if (stage && canvas && !hasWebGL()) {
	stage.remove();
}

if (stage && canvas && hasWebGL()) {
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
	camera.position.set(0, 0.05, 7);

	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	pmrem.dispose();

	scene.add(new THREE.AmbientLight(0xfff6e8, 0.55));
	const key = new THREE.DirectionalLight(0xfff8ee, 2.1);
	key.position.set(3, 4, 5);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0xd7dde8, 0.6);
	fill.position.set(-3, -1, 2);
	scene.add(fill);

	const group = new THREE.Group();
	scene.add(group);

	const ring = new THREE.Mesh(
		new THREE.TorusGeometry(2.35, 0.012, 16, 96),
		new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.45 })
	);
	ring.rotation.x = 1.15;
	group.add(ring);

	const shards = new THREE.Group();
	const shardList = [];
	for (let i = 0; i < 5; i += 1) {
		const shard = new THREE.Mesh(
			new THREE.OctahedronGeometry(0.07 + (i % 2) * 0.03, 0),
			new THREE.MeshBasicMaterial({ color: 0x39ff14 })
		);
		const angle = (i / 5) * Math.PI * 2;
		shard.position.set(Math.cos(angle) * 2.05, Math.sin(angle) * 0.85, Math.sin(angle) * 0.4);
		shards.add(shard);
		shardList.push(shard);
	}
	group.add(shards);

	const terminal = createTerminal();
	group.add(terminal.group);

	let running = false;
	resize();

	const loader = new FontLoader();
	loader.load(
		"assets/vendor/three/fonts/helvetiker_bold.typeface.json",
		function (font) {
			const hello = makeWord("Hello", font);
			const world = makeWord("World", font);
			hello.position.y = 0.48;
			world.position.y = -0.5;
			group.add(hello, world);
			applyForms(0);
			resize();
			if (reducedMotion) {
				group.rotation.set(0.22, 0.45, 0.04);
				showForm("sketch");
				renderer.render(scene, camera);
				return;
			}
			start();
		},
		undefined,
		function () {
			stage.remove();
		}
	);

	const pointer = { x: 0, y: 0 };
	stage.addEventListener("pointermove", function (event) {
		const rect = stage.getBoundingClientRect();
		pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.7;
		pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -0.45;
	});
	stage.addEventListener("pointerleave", function () {
		pointer.x = 0;
		pointer.y = 0;
	});

	const clock = new THREE.Clock();
	const look = { x: 0, y: 0 };
	let glitchTick = -1;

	function start() {
		running = true;
		renderer.setAnimationLoop(animate);
	}

	function animate() {
		if (!running) return;
		const t = clock.getElapsedTime();
		look.x += (pointer.x - look.x) * 0.06;
		look.y += (pointer.y - look.y) * 0.06;

		group.position.x = Math.sin(t * 0.7) * 0.32 + look.x;
		group.position.y = Math.sin(t * 1.15) * 0.14 + look.y;
		group.rotation.y = Math.sin(t * 0.55) * 0.42 + look.x * 0.35;
		group.rotation.x = Math.sin(t * 0.4) * 0.14 + look.y * 0.25;
		group.rotation.z = Math.sin(t * 0.28) * 0.05;

		const hello = group.getObjectByName("Hello");
		const world = group.getObjectByName("World");
		if (hello) {
			hello.position.y = 0.48 + Math.sin(t * 1.35) * 0.06;
			hello.rotation.y = Math.sin(t * 0.9) * 0.12;
		}
		if (world) {
			world.position.y = -0.5 + Math.cos(t * 1.05) * 0.06;
			world.rotation.y = Math.cos(t * 0.75) * 0.12;
		}

		ring.rotation.z = t * 0.25;
		shards.rotation.y = t * 0.45;
		shards.rotation.z = Math.sin(t * 0.4) * 0.2;
		applyForms(t);

		renderer.render(scene, camera);
	}

	function showForm(mode) {
		const sketch = mode !== "terminal";
		letters.forEach(function (letter) {
			letter.group.position.x = letter.baseX;
			letter.group.position.y = letter.baseY;
			letter.green.visible = false;
			letter.sketch.visible = sketch;
			letter.lines.visible = sketch;
			letter.linesSoft.visible = sketch;
		});
		terminal.group.visible = mode === "terminal";
		terminal.group.position.set(0, 0, 0.08);
		terminal.group.rotation.z = 0;
		ring.material.color.setHex(mode === "terminal" ? 0x39ff14 : 0x2a241c);
		shardList.forEach(function (shard) {
			shard.material.color.setHex(mode === "terminal" ? 0x39ff14 : 0x2a241c);
		});
	}

	function applyForms(t) {
		const cycle = 5.2;
		const phase = t % cycle;
		let mode = "terminal";
		let toSketch = true;
		let progress = 0;
		if (phase >= 1.7 && phase < 2.45) {
			mode = "glitch";
			toSketch = true;
			progress = (phase - 1.7) / 0.75;
		} else if (phase >= 2.45 && phase < 4.35) {
			mode = "sketch";
		} else if (phase >= 4.35) {
			mode = "glitch";
			toSketch = false;
			progress = (phase - 4.35) / 0.85;
		}

		if (mode !== "glitch") {
			if (glitchTick !== -1) {
				terminal.restore();
				glitchTick = -1;
			}
			showForm(mode);
			if (mode === "terminal") {
				terminal.cursor.visible = Math.floor(t * 2) % 2 === 0;
				terminal.screen.material.opacity = 0.94 + Math.sin(t * 28) * 0.04;
			}
			letters.forEach(function (letter, index) {
				if (mode !== "sketch") return;
				const wobble = Math.sin(t * 7 + index) * 0.008;
				letter.lines.position.set(wobble, -wobble * 0.6, 0);
				letter.linesSoft.position.set(-wobble, wobble, 0.01);
			});
			return;
		}

		const tick = Math.floor(t * 14);
		if (tick !== glitchTick) {
			terminal.corrupt();
			glitchTick = tick;
		}

		terminal.group.visible = true;
		terminal.cursor.visible = false;
		terminal.group.position.x = Math.sin(t * 90) * 0.16 * (1 - progress);
		terminal.group.position.y = (noise(t * 40) - 0.5) * 0.08;
		terminal.group.rotation.z = Math.sin(t * 70) * 0.05;
		terminal.screen.material.opacity = 0.35 + noise(t * 17) * 0.65;

		letters.forEach(function (letter, index) {
			const threshold = index / Math.max(letters.length - 1, 1);
			const converted = progress > threshold;
			let sketchOn = toSketch ? converted : !converted;
			if (noise(t * 23 + index * 4.7) > 0.72) sketchOn = !sketchOn;

			const tear = (noise(t * 61 + index * 3.1) - 0.5) * 0.42;
			letter.group.position.x = letter.baseX + tear;
			letter.group.position.y = letter.baseY + (noise(t * 48 + index) - 0.5) * 0.16;
			letter.green.visible = !sketchOn;
			letter.sketch.visible = sketchOn;
			letter.lines.visible = sketchOn;
			letter.linesSoft.visible = sketchOn;
			if (sketchOn) {
				letter.lines.position.set((noise(t * 80 + index) - 0.5) * 0.04, 0, 0);
			}
		});

		const ringGreen = noise(t * 30) > 0.5;
		ring.material.color.setHex(ringGreen ? 0x39ff14 : 0x2a241c);
		shardList.forEach(function (shard, index) {
			const torn = noise(t * 50 + index) > 0.45;
			shard.material.color.setHex(torn ? 0x39ff14 : 0x2a241c);
		});
	}

	function resize() {
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		if (!width || !height) return;
		camera.aspect = width / height;
		camera.position.z = width / height > 1.15 ? 6.8 : 8;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height, false);
		if (!running) renderer.render(scene, camera);
	}

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(stage);

	document.addEventListener("visibilitychange", function () {
		if (!group.getObjectByName("Hello")) return;
		if (document.hidden) {
			running = false;
			renderer.setAnimationLoop(null);
		} else if (!reducedMotion) {
			clock.getDelta();
			start();
		}
	});

	const visibility = new IntersectionObserver(function (entries) {
		if (reducedMotion || !group.getObjectByName("Hello")) return;
		if (entries[0].isIntersecting && !document.hidden) {
			if (!running) {
				clock.getDelta();
				start();
			}
		} else if (running) {
			running = false;
			renderer.setAnimationLoop(null);
		}
	});
	visibility.observe(stage);
}

function createTerminal() {
	const width = 1024;
	const height = 512;
	const base = document.createElement("canvas");
	const view = document.createElement("canvas");
	base.width = view.width = width;
	base.height = view.height = height;
	drawTerminal(base.getContext("2d"), width, height, false);
	view.getContext("2d").drawImage(base, 0, 0);

	const texture = new THREE.CanvasTexture(view);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;

	const screen = new THREE.Mesh(
		new THREE.PlaneGeometry(3.45, 1.78),
		new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.96 })
	);
	screen.position.z = 0.04;

	const bezel = new THREE.Mesh(
		new THREE.PlaneGeometry(3.68, 2.02),
		new THREE.MeshBasicMaterial({ color: 0x04140a })
	);
	bezel.position.z = -0.02;

	const cursor = new THREE.Mesh(
		new THREE.PlaneGeometry(0.11, 0.16),
		new THREE.MeshBasicMaterial({ color: 0x39ff14 })
	);
	cursor.position.set(1.22, -0.42, 0.06);

	const terminalGroup = new THREE.Group();
	terminalGroup.add(bezel, screen, cursor);

	return {
		group: terminalGroup,
		screen: screen,
		cursor: cursor,
		restore: function () {
			const ctx = view.getContext("2d");
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(base, 0, 0);
			texture.needsUpdate = true;
		},
		corrupt: function () {
			const ctx = view.getContext("2d");
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(base, 0, 0);
			const slices = 4 + Math.floor(Math.random() * 4);
			for (let i = 0; i < slices; i += 1) {
				const y = Math.random() * height;
				const slice = 6 + Math.random() * 36;
				const dx = (Math.random() - 0.5) * 90;
				ctx.drawImage(base, 0, y, width, slice, dx, y, width, slice);
			}
			if (Math.random() > 0.45) {
				ctx.fillStyle = "rgba(57, 255, 20, 0.18)";
				ctx.fillRect(0, Math.random() * height, width, 3 + Math.random() * 8);
			}
			texture.needsUpdate = true;
		}
	};
}

function drawTerminal(ctx, width, height) {
	ctx.fillStyle = "#031407";
	ctx.fillRect(0, 0, width, height);
	for (let y = 0; y < height; y += 4) {
		ctx.fillStyle = y % 8 === 0 ? "rgba(0, 0, 0, 0.38)" : "rgba(180, 255, 190, 0.035)";
		ctx.fillRect(0, y, width, 2);
	}
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = "600 132px Consolas, 'Courier New', monospace";
	ctx.fillStyle = "#143d1c";
	ctx.fillText("Hello", width / 2 + 3, height * 0.36 + 3);
	ctx.fillText("World", width / 2 + 3, height * 0.64 + 3);
	ctx.shadowColor = "#39ff14";
	ctx.shadowBlur = 22;
	ctx.fillStyle = "#6dff78";
	ctx.fillText("Hello", width / 2, height * 0.36);
	ctx.fillText("World", width / 2, height * 0.64);
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#d8ffd2";
	ctx.font = "600 132px Consolas, 'Courier New', monospace";
	ctx.fillText("Hello", width / 2, height * 0.36);
	ctx.fillText("World", width / 2, height * 0.64);
}

function makeWord(label, font) {
	const word = new THREE.Group();
	word.name = label;
	const gap = 0.05;
	let cursor = 0;
	const ink = new THREE.LineBasicMaterial({ color: 0x1c1712 });
	const inkSoft = new THREE.LineBasicMaterial({ color: 0x1c1712, transparent: true, opacity: 0.45 });

	Array.from(label).forEach(function (char) {
		const geometry = new TextGeometry(char, {
			font: font,
			size: 0.58,
			depth: 0.2,
			curveSegments: 5,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.018,
			bevelOffset: 0,
			bevelSegments: 1
		});
		geometry.computeBoundingBox();
		const box = geometry.boundingBox;
		const width = box.max.x - box.min.x;
		geometry.translate(
			-(box.max.x + box.min.x) / 2,
			-(box.max.y + box.min.y) / 2,
			-(box.max.z + box.min.z) / 2
		);

		const sketchGeo = jitterGeometry(geometry);
		const green = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({ color: 0x39ff14 })
		);
		const sketch = new THREE.Mesh(
			sketchGeo,
			new THREE.MeshBasicMaterial({ color: 0xf6f1e6 })
		);
		const lines = new THREE.LineSegments(new THREE.EdgesGeometry(sketchGeo, 46), ink);
		const linesSoft = new THREE.LineSegments(new THREE.EdgesGeometry(sketchGeo, 46), inkSoft);
		linesSoft.position.set(0.02, -0.014, 0.01);

		const letter = new THREE.Group();
		letter.position.x = cursor;
		letter.add(green, sketch, lines, linesSoft);
		word.add(letter);
		letters.push({
			group: letter,
			green: green,
			sketch: sketch,
			lines: lines,
			linesSoft: linesSoft,
			baseX: 0,
			baseY: 0
		});
		cursor += width + gap;
	});

	const total = Math.max(cursor - gap, 0);
	word.children.forEach(function (child) {
		child.position.x -= total / 2;
	});
	letters.forEach(function (letter) {
		if (letter.group.parent !== word) return;
		letter.baseX = letter.group.position.x;
		letter.baseY = letter.group.position.y;
	});
	return word;
}

function jitterGeometry(geometry) {
	const geo = geometry.clone();
	const pos = geo.attributes.position;
	for (let i = 0; i < pos.count; i += 1) {
		pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.018);
		pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.018);
		pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.028);
	}
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	return geo;
}

function noise(seed) {
	const value = Math.sin(seed * 12.9898) * 43758.5453;
	return value - Math.floor(value);
}

function hasWebGL() {
	try {
		const probe = document.createElement("canvas");
		return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
	} catch (error) {
		return false;
	}
}
