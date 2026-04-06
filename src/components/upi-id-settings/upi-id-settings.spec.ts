import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpiIdSettings } from './upi-id-settings';

describe('UpiIdSettings', () => {
  let component: UpiIdSettings;
  let fixture: ComponentFixture<UpiIdSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpiIdSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpiIdSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
