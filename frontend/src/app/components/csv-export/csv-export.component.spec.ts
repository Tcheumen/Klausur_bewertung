import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvExportComponent } from './csv-export.component';

describe('CsvExportComponent', () => {
  let component: CsvExportComponent;
  let fixture: ComponentFixture<CsvExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsvExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsvExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
