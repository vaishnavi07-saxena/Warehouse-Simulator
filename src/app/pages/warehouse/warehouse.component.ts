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
    this.scene.background = new THREE.Color('#151515');

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // human eye level
    this.camera.position.set(0, 1.6, 8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
    const wrapper = canvas.parentElement;
    const w = wrapper?.clientWidth ?? window.innerWidth;    
    const h = wrapper?.clientHeight ?? window.innerHeight;
    this.renderer.setSize(w, h);


    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // lights
    // this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // Soft light
    const spotLight = new THREE.PointLight(0xffffff, 1);
    spotLight.position.set(0, 5, 0); // Overhead warehouse light
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

  const overheadLight = new THREE.PointLight(0xffffff, 150);
  overheadLight.position.set(0, 10, 0);
  this.scene.add(overheadLight);

  this.yaw = 0; 
  this.pitch = 0;

  this.camera.rotation.order = 'YXZ';

  }

  private createWarehouse() {
  // 1. Floor (Jamin) - Bada floor taaki boundary cover rahe
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: '#1a1a1a', 
    roughness: 0.8 
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  this.scene.add(floor);

  // Grid Helper
  const grid = new THREE.GridHelper(60, 30, 0x444444, 0x222222);
  this.scene.add(grid);

  // 2. ENCLOSED WALLS (Charo taraf ki deewarein)
  // Material jo thoda dark ho taaki industrial feel aaye
  const wallMat = new THREE.MeshStandardMaterial({ color: '#111111' });
  
  // Back Wall
  const longWallGeo = new THREE.BoxGeometry(40, 10, 1);
  const backWall = new THREE.Mesh(longWallGeo, wallMat);
  backWall.position.set(0, 5, -20); // Shelves -9 se 9 tak hain, toh ye kaafi peeche hai
  this.scene.add(backWall);

  // Front Wall
  const frontWall = new THREE.Mesh(longWallGeo, wallMat);
  frontWall.position.set(0, 5, 20);
  this.scene.add(frontWall);

  // Side Walls (Left & Right)
  const sideWallGeo = new THREE.BoxGeometry(1, 10, 40);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.position.set(-20, 5, 0);
  this.scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.position.set(20, 5, 0);
  this.scene.add(rightWall);

  // 3. SHELVES CONFIGURATION
  const aisleCount = 3; 
  const shelfLength = 18; // Length 18 hai, matlab ye -9 se +9 tak jayegi
  const shelfHeight = 3;

  for (let i = 0; i < aisleCount; i++) {
    // Aisles ke beech ka gap
    const aisleX = (i - 1) * 8; 

    // Left Rack of the aisle
    const leftShelf = this.createShelf(shelfLength, shelfHeight);
    leftShelf.position.set(aisleX - 2.5, shelfHeight / 2, 0); 
    this.scene.add(leftShelf);

    // Right Rack of the aisle
    const rightShelf = this.createShelf(shelfLength, shelfHeight);
    rightShelf.position.set(aisleX + 2.5, shelfHeight / 2, 0);
    this.scene.add(rightShelf);
  }

  // 4. Center Reference (Optional Red Cube)
  // const testCube = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 1, 1),
  //   new THREE.MeshStandardMaterial({ color: 'red' })
  // );
  // testCube.position.set(0, 0.5, 0); // Ground level par
  // this.scene.add(testCube);
}

  private createShelf(length: number, height: number) {
  const shelfGroup = new THREE.Group();

  // Materials define karein
  const metalMat = new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.8, roughness: 0.2 }); 
  const pillarMat = new THREE.MeshStandardMaterial({ color: '#333333' }); // Pillar ke liye missing material
  const beamMat = new THREE.MeshStandardMaterial({ color: '#c2410c' }); // Orange beams

  // 1. Vertical Pillars (Rods)
  const pillarGeo = new THREE.BoxGeometry(0.1, height, 0.1);
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
  // Cardboard Brown color
  const boxMat = new THREE.MeshStandardMaterial({ 
    color: '#a0785a',
    roughness: 1 
  }); 
  
  // Har shelf pe random boxes rakhne ke liye loop
  for (let z = -length/2 + 1; z < length/2; z += 1.5) {
    if (Math.random() > 0.3) { // 70% jagah pe boxes honge
      const boxHeight = 0.4 + Math.random() * 0.4;
      const boxGeo = new THREE.BoxGeometry(0.8, boxHeight, 1.0);
      const box = new THREE.Mesh(boxGeo, boxMat);
      
      // Box ko shelf ke upar thoda random position pe set karein
      box.position.set(
        (Math.random() - 0.5) * 0.2, 
        yPos + boxHeight/2 + 0.03, // Plate ke thoda upar
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
  this.velocity.x -= this.velocity.x * damping * delta;
  this.velocity.z -= this.velocity.z * damping * delta;

  this.direction.set(0, 0, 0);
  if (this.keys['w']) this.direction.z += 1;
  if (this.keys['s']) this.direction.z -= 1;
  if (this.keys['a']) this.direction.x -= 1;
  if (this.keys['d']) this.direction.x += 1;

  this.direction.normalize();

  if (this.direction.length() > 0) {
    this.velocity.x += this.direction.x * this.speed * delta;
    this.velocity.z += this.direction.z * this.speed * delta;
  }

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
  forward.y = 0;
  right.y = 0;
  forward.normalize();
  right.normalize();

  // 1. Agli position calculate karein bina apply kiye
  const nextPos = this.camera.position.clone();
  nextPos.addScaledVector(right, this.velocity.x);
  nextPos.addScaledVector(forward, this.velocity.z);

  // 2. COLLISION CHECK: Kya hum kisi shelf ke andar hain?
  let isColliding = false;

  // Aapke shelf ki layout ke hisab se X positions
  // i=0 -> -8, i=1 -> 0, i=2 -> 8
  const aisleXPositions = [-8, 0, 8]; 
  
  aisleXPositions.forEach(aisleX => {
    // Check Left Rack (aisleX - 2.5) aur Right Rack (aisleX + 2.5)
    const racksX = [aisleX - 2.5, aisleX + 2.5];
    
    racksX.forEach(shelfX => {
      // Agar camera shelf ki Z-range (-9 to 9) mein hai
      if (nextPos.z > -9.5 && nextPos.z < 9.5) {
        // Aur agar camera shelf ki X-range ke bahut paas hai (Width check)
        if (Math.abs(nextPos.x - shelfX) < 1.2) { 
          isColliding = true;
        }
      }
    });
  });

  // 3. Agar collision nahi hai, tabhi move karein
  if (!isColliding) {
    this.camera.position.copy(nextPos);
  } else {
    // Collision hone par velocity zero kar dein taaki jhatka na lage
    this.velocity.set(0, 0, 0);
  }

  // 4. STRICT WALL BOUNDARIES
  this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -18, 18);
  this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -18, 18);
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
