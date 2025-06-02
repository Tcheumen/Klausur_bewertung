import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdsComponent } from './thresholds.component';

describe('ThresholdsComponent', () => {
  let component: ThresholdsComponent;
  let fixture: ComponentFixture<ThresholdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThresholdsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThresholdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
