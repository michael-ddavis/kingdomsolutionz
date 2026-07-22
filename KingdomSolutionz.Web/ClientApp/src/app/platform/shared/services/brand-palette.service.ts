import { Injectable } from '@angular/core';

import { WorkspaceId } from '../models/workspace.model';

export interface BrandPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  sidebar: string;
  page: string;
}

const DEFAULT_PALETTE: BrandPalette = {
  id: 'academy-blue',
  name: 'Academy Blue',
  primary: '#355b9f',
  secondary: '#685478',
  accent: '#526fba',
  sidebar: '#111a29',
  page: '#f5f5f7'
};

@Injectable({ providedIn: 'root' })
export class BrandPaletteService {
  readonly presets: readonly BrandPalette[] = [
    DEFAULT_PALETTE,
    {
      id: 'royal-violet', name: 'Royal Violet', primary: '#5c4ca1',
      secondary: '#355b9f', accent: '#7967c8', sidebar: '#171528', page: '#f6f5f9'
    },
    {
      id: 'deep-navy', name: 'Deep Navy', primary: '#254d7a',
      secondary: '#4d6288', accent: '#3f72a8', sidebar: '#0b1625', page: '#f4f6f8'
    },
    {
      id: 'fresh-teal', name: 'Fresh Teal', primary: '#17736f',
      secondary: '#42658b', accent: '#26908a', sidebar: '#102222', page: '#f3f7f6'
    }
  ];

  private activeWorkspace: WorkspaceId = 'apostle-cynthia';

  activate(workspaceId: WorkspaceId): BrandPalette {
    this.activeWorkspace = workspaceId;
    const palette = this.get(workspaceId);
    this.apply(palette);
    return palette;
  }

  get(workspaceId = this.activeWorkspace): BrandPalette {
    try {
      const stored = localStorage.getItem(this.storageKey(workspaceId));
      return stored ? this.sanitize(JSON.parse(stored)) : { ...DEFAULT_PALETTE };
    } catch {
      return { ...DEFAULT_PALETTE };
    }
  }

  preview(palette: BrandPalette): void {
    this.apply(this.sanitize(palette));
  }

  save(palette: BrandPalette): BrandPalette {
    const safePalette = this.sanitize({ ...palette, id: 'custom', name: 'Custom palette' });
    localStorage.setItem(this.storageKey(this.activeWorkspace), JSON.stringify(safePalette));
    this.apply(safePalette);
    return safePalette;
  }

  savePreset(palette: BrandPalette): BrandPalette {
    const safePalette = this.sanitize(palette);
    localStorage.setItem(this.storageKey(this.activeWorkspace), JSON.stringify(safePalette));
    this.apply(safePalette);
    return safePalette;
  }

  reset(): BrandPalette {
    localStorage.removeItem(this.storageKey(this.activeWorkspace));
    const palette = { ...DEFAULT_PALETTE };
    this.apply(palette);
    return palette;
  }

  private apply(palette: BrandPalette): void {
    const root = document.documentElement.style;
    const primarySoft = this.mix(palette.primary, '#ffffff', 0.88);
    const secondarySoft = this.mix(palette.secondary, '#ffffff', 0.89);
    const primaryMid = this.mix(palette.primary, '#ffffff', 0.56);

    root.setProperty('--kos-blue-600', palette.primary);
    root.setProperty('--kos-blue-100', primarySoft);
    root.setProperty('--kos-violet-600', palette.secondary);
    root.setProperty('--kos-violet-100', secondarySoft);
    root.setProperty('--kos-page', palette.page);
    root.setProperty('--kos-obsidian-900', palette.sidebar);
    root.setProperty('--kos-navy-900', palette.sidebar);
    root.setProperty('--kos-champagne-700', palette.primary);
    root.setProperty('--kos-champagne-600', palette.accent);
    root.setProperty('--kos-champagne-500', palette.accent);
    root.setProperty('--kos-champagne-300', primaryMid);
    root.setProperty('--kos-champagne-200', this.mix(palette.primary, '#ffffff', 0.78));
    root.setProperty('--kos-champagne-100', primarySoft);
    root.setProperty('--kos-focus-color', palette.primary);
    root.setProperty('--kos-focus-ring', `0 0 0 3px ${this.withAlpha(palette.primary, 0.24)}`);
    root.setProperty('--kos-champagne-metal',
      `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 52%, ${palette.secondary} 100%)`);
    root.setProperty('--kos-luxury-rule',
      `linear-gradient(90deg, transparent, ${palette.primary} 18%, ${primaryMid} 50%, ${palette.secondary} 82%, transparent)`);
    root.setProperty('--kos-shell-gradient',
      `linear-gradient(155deg, ${this.shade(palette.sidebar, -0.16)} 0%, ${palette.sidebar} 55%, ${this.mix(palette.sidebar, palette.primary, 0.25)} 100%)`);
  }

  private sanitize(value: Partial<BrandPalette>): BrandPalette {
    return {
      id: typeof value.id === 'string' ? value.id : 'custom',
      name: typeof value.name === 'string' ? value.name : 'Custom palette',
      primary: this.ensureWhiteTextContrast(
        this.safeColor(value.primary, DEFAULT_PALETTE.primary)
      ),
      secondary: this.safeColor(value.secondary, DEFAULT_PALETTE.secondary),
      accent: this.safeColor(value.accent, DEFAULT_PALETTE.accent),
      sidebar: this.ensureWhiteTextContrast(
        this.safeColor(value.sidebar, DEFAULT_PALETTE.sidebar)
      ),
      page: this.safeColor(value.page, DEFAULT_PALETTE.page)
    };
  }

  private safeColor(value: unknown, fallback: string): string {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  private ensureWhiteTextContrast(color: string): string {
    let candidate = color;

    while (this.contrastWithWhite(candidate) < 4.5) {
      candidate = this.mix(candidate, '#000000', 0.12);
    }

    return candidate;
  }

  private contrastWithWhite(color: string): number {
    const luminance = this.rgb(color)
      .map(channel => channel / 255)
      .map(channel => channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4))
      .reduce((sum, channel, index) =>
        sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

    return 1.05 / (luminance + 0.05);
  }

  private storageKey(workspaceId: WorkspaceId): string {
    return `kingdomops.brand-palette.${workspaceId}`;
  }

  private mix(first: string, second: string, secondWeight: number): string {
    const a = this.rgb(first); const b = this.rgb(second);
    return this.hex(a.map((channel, index) =>
      Math.round(channel * (1 - secondWeight) + b[index] * secondWeight)));
  }

  private shade(color: string, amount: number): string {
    return this.hex(this.rgb(color).map(channel =>
      Math.max(0, Math.min(255, Math.round(channel * (1 + amount))))));
  }

  private withAlpha(color: string, alpha: number): string {
    return `rgb(${this.rgb(color).join(' ')} / ${alpha * 100}%)`;
  }

  private rgb(color: string): number[] {
    return [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  }

  private hex(channels: number[]): string {
    return `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
  }
}
