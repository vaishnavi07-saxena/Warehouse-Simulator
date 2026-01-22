import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { HudComponent } from '../../components/hud/hud.component';


@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [HudComponent],
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css'],
})
export class WarehouseComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;


  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  // movement
  private keys: Record<string, boolean> = {};
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private speed = 2.5;

  // mouse look
  private isDragging = false;
  private prevMouse = { x: 0, y: 0 };
  private yaw = 0;
  private pitch = 0;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
  if (!this.canvasRef) return;
  this.initScene();
  this.createWarehouse();
  this.animate();
}


  goOutside() {
    this.router.navigateByUrl('/');
  }

  private initScene() {
    const canvas = this.canvasRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e0e0e0');

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // human eye level
    this.camera.position.set(0, 1.6, 8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const wrapper = canvas.parentElement;
    const w = wrapper?.clientWidth ?? window.innerWidth;    
    const h = wrapper?.clientHeight ?? window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // Ambient light badhayi
    const spotLight = new THREE.PointLight(0xffffff, 1);
    spotLight.position.set(5, 15, 5); // Overhead warehouse light
    this.scene.add(spotLight);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 10, 5);
    this.scene.add(dir);
    this.camera.lookAt(0, 1.6, 0);

    this.scene.background = new THREE.Color('#1a1a1a');
  
  // Floor with grid for Street View feel
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: '#222222', 
    roughness: 0.8 
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  this.scene.add(floor);

  // Add Grid Helper
  const grid = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
  this.scene.add(grid);

  // Lights - Image jaisa soft look
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  this.scene.add(ambient);

  const overheadLight = new THREE.PointLight(0xffffff, 200);
  overheadLight.position.set(0, 10, 0);
  this.scene.add(overheadLight);

  this.yaw = 0; 
  this.pitch = 0;

  this.camera.rotation.order = 'YXZ';

  }

  private createWarehouse() {
  this.scene.background = new THREE.Color('#e0e0e0');

  // 1. FLOOR (Ise -0.05 niche kiya taaki grid se na takraye)
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#bcbcbc', roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05; // <--- FLICKER FIX
  this.scene.add(floor);

  // 2. GRID (Ise 0.05 upar kiya)
  const grid = new THREE.GridHelper(100, 50, 0x999999, 0xbbbbbb);
  grid.position.y = 0.05; // <--- FLICKER FIX
  this.scene.add(grid);

  // 3. BRIGHT CEILING
  const ceilingGeo = new THREE.PlaneGeometry(100, 100);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 8;
  this.scene.add(ceiling);

  // 4. WALLS (Sahi color aur boundary)
  const wallMat = new THREE.MeshStandardMaterial({ color: '#f0f0f0' });
  const longWallGeo = new THREE.BoxGeometry(40, 10, 0.5);
  
  // Back Wall
  const backWall = new THREE.Mesh(longWallGeo, wallMat);
  backWall.position.set(0, 5, -13); 
  this.scene.add(backWall);

  // Front Wall (S dabane par aap yahan rukenge)
  const frontWall = new THREE.Mesh(longWallGeo, wallMat);
  frontWall.position.set(0, 5, 13);
  this.scene.add(frontWall);

  // Side Walls
  const sideWallGeo = new THREE.BoxGeometry(0.5, 10, 26);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.position.set(-13, 5, 0);
  this.scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.position.set(13, 5, 0);
  this.scene.add(rightWall);

  // Shelves Logic (Aapka purana loop...)
  const aisleCount = 3; 
  const shelfLength = 18; 
  const shelfHeight = 3;

  for (let i = 0; i < aisleCount; i++) {
    const aisleX = (i - 1) * 8; 
    const leftShelf = this.createShelf(shelfLength, shelfHeight);
    leftShelf.position.set(aisleX - 2.5, shelfHeight / 2, 0);
    this.scene.add(leftShelf);

    const rightShelf = this.createShelf(shelfLength, shelfHeight);
    rightShelf.position.set(aisleX + 2.5, shelfHeight / 2, 0);
    this.scene.add(rightShelf);
  }
}

  private createShelf(length: number, height: number) {
  const shelfGroup = new THREE.Group();

  // Metal Material sudhara (Metallic look ke liye)
  const metalMat = new THREE.MeshStandardMaterial({ 
    color: '#555555', 
    metalness: 0.9, // Zyada metallic
    roughness: 0.1 
  }); 
  
  const pillarMat = new THREE.MeshStandardMaterial({ 
    color: '#222222',
    metalness: 0.8,
    roughness: 0.2
  });

  const beamMat = new THREE.MeshStandardMaterial({ 
    color: '#d9480f', // Bright Industrial Orange
    metalness: 0.5,
    roughness: 0.5
  });

  // 1. Vertical Pillars (Rods)
  const pillarGeo = new THREE.BoxGeometry(0.15, height, 0.15);
  const pillarPositions = [
    [-0.6, 0, -length/2], [0.6, 0, -length/2],
    [-0.6, 0, length/2], [0.6, 0, length/2]
  ];

  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat); // Ab pillarMat mil jayega
    pillar.position.set(pos[0], 0, pos[2]);
    shelfGroup.add(pillar);
  });

  // 2. Horizontal Shelves
  const plateGeo = new THREE.BoxGeometry(1.2, 0.05, length);
  for (let i = 1; i <= 3; i++) {
    const plateHeight = (i * (height / 3)) - (height / 2);
    const plate = new THREE.Mesh(plateGeo, metalMat);
    plate.position.y = plateHeight;
    shelfGroup.add(plate);

    // Front/Back Orange Beams
    const beamGeo = new THREE.BoxGeometry(1.22, 0.1, 0.05);
    const frontBeam = new THREE.Mesh(beamGeo, beamMat);
    frontBeam.position.set(0, plateHeight, length/2);
    shelfGroup.add(frontBeam);

    const backBeam = new THREE.Mesh(beamGeo, beamMat);
    backBeam.position.set(0, plateHeight, -length/2);
    shelfGroup.add(backBeam);
    
    // Boxes add karne ke liye function call
    this.addBoxesToLevel(shelfGroup, plateHeight, length);
  }

  return shelfGroup;
}

  private addBoxesToLevel(group: THREE.Group, yPos: number, length: number) {
  // Realistic Cardboard Brown Color
  const boxMat = new THREE.MeshStandardMaterial({ 
    color: '#966F33', // Thoda dark aur realistic brown
    roughness: 0.9,
    metalness: 0.0
  }); 

  // White Address Tag Material
  const tagMat = new THREE.MeshStandardMaterial({ 
    color: '#ffffff',
    roughness: 0.5,
    side: THREE.DoubleSide
  });
  
  for (let z = -length/2 + 1; z < length/2; z += 1.5) {
    if (Math.random() > 0.3) {
      const boxWidth = 0.8;
      const boxHeight = 0.4 + Math.random() * 0.4;
      const boxDepth = 1.0;
      
      const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      const box = new THREE.Mesh(boxGeo, boxMat);
      
      // --- WHITE ADDRESS TAG (Label) ---
      const tagGeo = new THREE.PlaneGeometry(0.3, 0.2); // Label ki size
      const tag = new THREE.Mesh(tagGeo, tagMat);

      // Tag ko box ke front face par thoda sa bahar chipkana
      // (boxDepth / 2) + 0.01 se ye box ke bilkul upar dikhega
      tag.position.set(0.1, 0, (boxDepth / 2) + 0.01); 
      box.add(tag); // Tag ko box ke saath group kar diya
      
      box.position.set(
        (Math.random() - 0.5) * 0.2, 
        yPos + boxHeight/2 + 0.03, 
        z
      );
      group.add(box);
    }
  }
}

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    this.updateMovement(delta);

    this.renderer.render(this.scene, this.camera);
  };

  private updateMovement(delta: number) {
  const damping = 10;
  // Velocity calculation with damping
  this.velocity.x -= this.velocity.x * damping * delta;
  this.velocity.z -= this.velocity.z * damping * delta;

  // Input direction
  this.direction.set(0, 0, 0);
  if (this.keys['w']) this.direction.z += 1;
  if (this.keys['s']) this.direction.z -= 1;
  if (this.keys['a']) this.direction.x -= 1;
  if (this.keys['d']) this.direction.x += 1;

  this.direction.normalize();

  // Camera vectors
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
  forward.y = 0;
  right.y = 0;
  forward.normalize();
  right.normalize();

  if (this.direction.length() > 0) {
    this.velocity.x += this.direction.x * this.speed * delta;
    this.velocity.z += this.direction.z * this.speed * delta;
  }

  // 1. Agli position calculate karein
  const nextPos = this.camera.position.clone();
  nextPos.addScaledVector(right, this.velocity.x);
  nextPos.addScaledVector(forward, this.velocity.z);

  // 2. SHELF COLLISION CHECK
  let isColliding = false;
  const aisleXPositions = [-8, 0, 8]; 
  
  aisleXPositions.forEach(aisleX => {
    const racksX = [aisleX - 2.5, aisleX + 2.5];
    racksX.forEach(shelfX => {
      // Agar camera shelf ke area mein hai (Shelf length -9 to 9)
      if (nextPos.z > -9.5 && nextPos.z < 9.5) {
        if (Math.abs(nextPos.x - shelfX) < 1.2) { 
          isColliding = true;
        }
      }
    });
  });

  // 3. Movement Apply Karein (Agar shelf se nahi takra rahe)
  if (!isColliding) {
    this.camera.position.copy(nextPos);
  } else {
    this.velocity.set(0, 0, 0);
  }

  // 4. STRICT WALL BOUNDARIES (Fixed for your 13-unit walls)
  // Aapki deewarein 13 par hain, isliye camera ko 12.2 par clamp karna hoga
  // Taaki aapka camera deewar ke aar-paar na jaye
  const wallLimit = 12.2; 
  this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -wallLimit, wallLimit);
  this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -wallLimit, wallLimit);
  
  // Height hamesha 1.6 (human eye level) par lock rakhein
  this.camera.position.y = 1.6;
}

  // keyboard
@HostListener('window:keydown', ['$event'])
onKeyDown(e: KeyboardEvent) {
  this.keys[e.key.toLowerCase()] = true;
}

@HostListener('window:keyup', ['$event'])
onKeyUp(e: KeyboardEvent) {
  this.keys[e.key.toLowerCase()] = false;
}

  // mouse
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.prevMouse = { x: e.clientX, y: e.clientY };
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
  if (!this.isDragging) return;
  if (!this.camera) return;

  const dx = e.clientX - this.prevMouse.x;
  const dy = e.clientY - this.prevMouse.y;

  this.prevMouse = { x: e.clientX, y: e.clientY };

  this.yaw -= dx * 0.002;
  this.pitch -= dy * 0.002;

  this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

  this.camera.rotation.order = 'YXZ';
  this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  // resize
  @HostListener('window:resize')
  onResize() {
  if (!this.canvasRef || !this.renderer || !this.camera) return;

  const canvas = this.canvasRef.nativeElement;
  const wrapper = canvas.parentElement;
  const w = wrapper?.clientWidth ?? window.innerWidth;
  const h = wrapper?.clientHeight ?? window.innerHeight;

  this.camera.aspect = w / h;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(w, h);
}

}
