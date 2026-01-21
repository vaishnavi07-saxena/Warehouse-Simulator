import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-outside',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './outside.component.html',
  styleUrls: ['./outside.component.css'],
})
export class OutsideComponent {}
