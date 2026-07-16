import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { StartProjectComponent } from './start-project.component';

describe('StartProjectComponent', () => {
  let component: StartProjectComponent;
  let fixture: ComponentFixture<StartProjectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        StartProjectComponent
      ]
    });
    fixture = TestBed.createComponent(StartProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
