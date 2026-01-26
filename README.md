# 🏭 Warehouse Simulator (Angular + Three.js)

A **3D Warehouse Simulator** built using **Angular Standalone Components** and **Three.js**, where the user can enter a warehouse, explore racks, and move around using **WASD controls** with mouse-based camera look.

This project includes a clean **Landing Page (Outside View)** and a fully interactive **Warehouse Scene** with shelves, boxes, lighting, and basic collision + boundary movement.

---

## ✨ Features

✅ **Landing Page UI (OutsideComponent)**  
- Glassmorphism design  
- Instructions for movement & navigation  
- "Enter Warehouse" button with routing

✅ **3D Warehouse Scene (WarehouseComponent)**  
- Three.js scene setup with camera + renderer  
- Warehouse floor + grid helper
- Realistic shelves and cardboard boxes  
- Ceiling + walls for warehouse environment  

✅ **HUD Overlay (HudComponent)**  
- Glass-style exit button  
- WASD movement overlay with arrows  
- Click `Exit Warehouse` to return back to landing page

✅ **Movement + Mouse Look**  
- Move with **WASD**  
- Rotate view by **click + hold + drag mouse**

✅ **Collision + Boundary System**  
- Prevents going through racks  
- Keeps camera inside warehouse walls  
- Locks camera height at human eye level (1.6)

---

## 🕹️ Controls

| Action | Control |
|------|---------|
| Move Forward | `W` |
| Move Backward | `S` |
| Move Left | `A` |
| Move Right | `D` |
| Look Around | Hold Mouse Click + Drag |
| Exit Warehouse | `Exit Warehouse` Button |

---

## 🧰 Tech Stack

- **Angular 19 (Standalone Components)**
- **Three.js**
- TypeScript
- HTML + CSS (Glass UI Theme)
