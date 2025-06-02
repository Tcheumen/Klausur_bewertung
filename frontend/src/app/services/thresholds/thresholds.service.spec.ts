import { TestBed } from '@angular/core/testing';

import { ThresholdsService } from './thresholds.service';

describe('ThresholdsService', () => {
  let service: ThresholdsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThresholdsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
