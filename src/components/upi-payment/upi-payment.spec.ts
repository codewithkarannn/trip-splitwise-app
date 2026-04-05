import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpiPayment } from './upi-payment';

describe('UpiPayment', () => {
  let component: UpiPayment;
  let fixture: ComponentFixture<UpiPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpiPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpiPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
