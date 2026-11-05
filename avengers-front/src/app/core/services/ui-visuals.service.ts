import { Injectable } from '@angular/core';

export interface VisualTheme {
  primary: string;
  secondary: string;
  accent: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
}
export const STANDARD_THEME: VisualTheme = {
  primary: '#8cff3f',
  secondary: '#171d19',
  accent: '#c8ff9e',
  surfacePrimary: '#080b09',
  surfaceSecondary: '#151b17',
  textPrimary: '#f7faf8',
  textSecondary: '#c9d4cc',
};
@Injectable({ providedIn: 'root' })
export class UiVisualsService {
  apply(theme: VisualTheme): void {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', theme.primary);
    root.style.setProperty('--team-secondary', theme.secondary);
    root.style.setProperty('--team-accent', theme.accent);
    root.style.setProperty('--surface-primary', theme.surfacePrimary);
    root.style.setProperty('--surface-secondary', theme.surfaceSecondary);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
  }
}
