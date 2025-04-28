import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const scene = new THREE.Scene();

// Luces
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Cámara
const camera = new THREE.PerspectiveCamera(45, 500 / 500, 0.1, 1000); camera.position.setZ(15);

// Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(500, 500);
renderer.setClearColor(0x20232a); 
// Controles
const controls = new OrbitControls(camera, renderer.domElement);

// Simulación de resultados
const leftHemispherePercent = 0.3; 
const rightHemispherePercent = 0.7;

//colores
const colorLeft = new THREE.Color(0x25a2d9);    // Azul
const colorRight = new THREE.Color(0xff0000);   // Rojo
const colorDefault = new THREE.Color(0xffffff); // Blanco

const loader = new OBJLoader();
loader.load('/obj/freesurff.Obj', function (obj) {
    obj.traverse(function (child) {
        if (child.isMesh) {
            const geometry = child.geometry;
            const count = geometry.attributes.position.count;

            const colors = new Float32Array(count * 3);
            const colorAttribute = new THREE.BufferAttribute(colors, 3);

            // Separar vértices por hemisferio
            const leftVertices = [];
            const rightVertices = [];

            for (let i = 0; i < count; i++) {
                const x = geometry.attributes.position.getX(i);
                const y = geometry.attributes.position.getY(i);

                if (x <= 0) {
                    leftVertices.push({ index: i, y: y });
                } else {
                    rightVertices.push({ index: i, y: y });
                }
            }

            // Ordenar ambos grupos de arriba hacia abajo
            leftVertices.sort((a, b) => b.y - a.y);
            rightVertices.sort((a, b) => b.y - a.y);

            // Calcular cuántos vértices colorear en cada hemisferio
            const leftVerticesToColor = Math.floor(leftVertices.length * leftHemispherePercent);
            const rightVerticesToColor = Math.floor(rightVertices.length * rightHemispherePercent);

            // Pintar hemisferio izquierdo
            for (let i = 0; i < leftVertices.length; i++) {
                const { index } = leftVertices[i];

                if (i < leftVerticesToColor) {
                    colorLeft.toArray(colors, index * 3);
                } else {
                    colorDefault.toArray(colors, index * 3);
                }
            }

            // Pintar hemisferio derecho
            for (let i = 0; i < rightVertices.length; i++) {
                const { index } = rightVertices[i];

                if (i < rightVerticesToColor) {
                    colorRight.toArray(colors, index * 3);
                } else {
                    colorDefault.toArray(colors, index * 3);
                }
            }

            geometry.setAttribute('color', colorAttribute);
            geometry.attributes.color.needsUpdate = true;

            // Aplicar material que soporte vertex colors
            child.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                metalness: 0.3,
                roughness: 0.6,
            });
        }
    });
    scene.add(obj);
});

const fontLoader = new FontLoader();
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
    // Hemisferio izquierdo
    const textGeometryLeft = new TextGeometry((leftHemispherePercent * 100).toFixed(0) + '%', {
      font: font,
      size: 1.5,
      height: 0.1,
      curveSegments: 12,
    });
    textGeometryLeft.computeBoundingBox();
    const bboxLeft = textGeometryLeft.boundingBox;
    const centerOffsetLeft = -0.5 * (bboxLeft.max.x - bboxLeft.min.x);

    const textMeshLeft = new THREE.Mesh(textGeometryLeft, new THREE.MeshPhongMaterial({ color: colorLeft}));
    textMeshLeft.position.set(centerOffsetLeft - 1.7, 0, 0);
    textMeshLeft.scale.set(0.3, 0.3, 0.005);
    scene.add(textMeshLeft);

    // Hemisferio derecho
    const textGeometryRight = new TextGeometry((rightHemispherePercent * 100).toFixed(0) + '%', {
      font: font,
      size: 1.5,
      height: 0.1,
      curveSegments: 12,
    });
    textGeometryRight.computeBoundingBox();
    const bboxRight = textGeometryRight.boundingBox;
    const centerOffsetRight = -0.5 * (bboxRight.max.x - bboxRight.min.x);

    const textMeshRight = new THREE.Mesh(textGeometryRight, new THREE.MeshPhongMaterial({ color: colorRight}));
    textMeshRight.position.set(centerOffsetRight + 4.3, 0, 0);
    textMeshRight.scale.set(0.3, 0.3, 0.005);
    scene.add(textMeshRight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
