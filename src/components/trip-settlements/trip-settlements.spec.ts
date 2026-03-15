import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripSettlements } from './trip-settlements';

describe('TripSettlements', () => {
  let component: TripSettlements;
  let fixture: ComponentFixture<TripSettlements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripSettlements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripSettlements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
