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
  }

  requestClose(): void {
    if (!this.open) {
      return;
    }

    this.closed.emit();
  }

  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {
    this.requestClose();
  }
}
