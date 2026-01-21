import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutsideComponent } from './outside.component';

describe('OutsideComponent', () => {
  let component: OutsideComponent;
  let fixture: ComponentFixture<OutsideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutsideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutsideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
