import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripDashboard } from './trip-dashboard';

describe('TripDashboard', () => {
  let component: TripDashboard;
  let fixture: ComponentFixture<TripDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
