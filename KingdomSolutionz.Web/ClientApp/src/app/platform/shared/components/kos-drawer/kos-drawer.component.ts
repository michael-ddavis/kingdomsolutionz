import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

export type KosDrawerWidth =
  'sm' | 'md' | 'lg';

@Component({
  standalone: false,
  selector: 'app-kos-drawer',
  templateUrl: './kos-drawer.component.html',
  styleUrls: ['./kos-drawer.component.scss']
})
export class KosDrawerComponent
  implements OnChanges, OnDestroy {
  private static nextId = 0;

  @Input() open = false;
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() width: KosDrawerWidth = 'md';

  @Output() closed =
    new EventEmitter<void>();

  @ViewChild('closeButton')
  closeButton?: ElementRef<HTMLButtonElement>;

  @ViewChild('drawerPanel')
  drawerPanel?: ElementRef<HTMLElement>;

  readonly titleId =
    `kos-drawer-title-${++KosDrawerComponent.nextId}`;

  private previouslyFocusedElement:
    HTMLElement | null = null;

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    const openChange =
      changes['open'];

    if (!openChange) {
      return;
    }

    if (openChange.currentValue === true) {
      this.previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      document.body.classList.add(
        'kos-overlay-open'
      );

      window.setTimeout(() => {
        this.closeButton
          ?.nativeElement
          .focus();
      });
    }

    if (
      openChange.previousValue === true &&
      openChange.currentValue === false
    ) {
      document.body.classList.remove(
        'kos-overlay-open'
      );

      window.setTimeout(() => {
        this.previouslyFocusedElement
          ?.focus();
      });
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove(
      'kos-overlay-open'
    );

    if (this.open) {
      this.previouslyFocusedElement
        ?.focus();
    }
  }

  requestClose(): void {
    if (!this.open) {
      return;
    }

    this.closed.emit();
  }

  @HostListener(
    'document:keydown',
    ['$event']
  )
  onDocumentKeydown(
    event: KeyboardEvent
  ): void {
    if (!this.open) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(
    event: KeyboardEvent
  ): void {
    const focusableElements =
      this.getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      this.drawerPanel
        ?.nativeElement
        .focus();
      return;
    }

    const firstElement =
      focusableElements[0];

    const lastElement =
      focusableElements[
        focusableElements.length - 1
      ];

    const activeElement =
      document.activeElement;

    if (
      event.shiftKey &&
      activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private getFocusableElements():
    HTMLElement[] {
    if (!this.drawerPanel) {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(
      this.drawerPanel.nativeElement
        .querySelectorAll<HTMLElement>(selector)
    ).filter(element =>
      element.getAttribute('aria-hidden') !== 'true'
    );
  }
}
