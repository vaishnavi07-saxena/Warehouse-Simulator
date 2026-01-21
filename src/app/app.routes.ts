import { Routes } from '@angular/router';
import { OutsideComponent } from './pages/outside/outside.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';

export const routes: Routes = [
  { path: '', component: OutsideComponent },
  { path: 'warehouse', component: WarehouseComponent },
  { path: '**', redirectTo: '' },
];
