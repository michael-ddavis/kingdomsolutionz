import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  KosDrawerComponent
} from './kos-drawer.component';

@Component({
  standalone: false,
  template: `
    <app-kos-drawer
      [open]="open"
      eyebrow="Assignment travel"
      title="Travel quick view"
      (closed)="open = false">

      <a href="/app/assignments/1/travel">
        Open Travel
      </a>
    </app-kos-drawer>
  `
})
class DrawerTestHostComponent {
  open = true;
}

describe('KosDrawerComponent', () => {
  let fixture:
    ComponentFixture<DrawerTestHostComponent>;
  let host: DrawerTestHostComponent;
  let drawer: KosDrawerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        DrawerTestHostComponent,
        KosDrawerComponent
      ]
    });

    fixture = TestBed.createComponent(
      DrawerTestHostComponent
    );
    host = fixture.componentInstance;
    fixture.detectChanges();

    drawer = fixture.debugElement.children[0]
      .componentInstance as KosDrawerComponent;
  });

  it('exposes an accessible modal dialog', () => {
    const dialog =
      fixture.nativeElement.querySelector(
        '[role="dialog"]'
      ) as HTMLElement;

    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal'))
      .toBe('true');
    expect(dialog.getAttribute('aria-labelledby'))
      .toBe(drawer.titleId);
  });

  it('requests close when Escape is pressed', () => {
    drawer.onDocumentKeydown(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true
      })
    );
    fixture.detectChanges();

    expect(host.open).toBeFalse();
  });

  it('does not change body overflow when opened', () => {
    expect(
      document.body.classList.contains(
        'kos-overlay-open'
      )
    ).toBeFalse();
  });
});
