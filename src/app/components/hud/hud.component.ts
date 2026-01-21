import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-hud',
  standalone: true,
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.css'],
})
export class HudComponent {
  @Output() exit = new EventEmitter<void>();
}
