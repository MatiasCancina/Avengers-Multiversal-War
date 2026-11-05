import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeroArtworkResolverService {
  readonly fallbackPath = 'assets/artwork/default_card.webp';

  portraitPath(heroId: string): string {
    return `assets/portraits/${encodeURIComponent(heroId)}-portrait.webp`;
  }

  cardPath(heroId: string): string {
    return `assets/cards/${encodeURIComponent(heroId)}-card.webp`;
  }

  specificPath(heroId: string): string {
    return this.portraitPath(heroId);
  }

  resolve(heroId: string): string {
    return this.portraitPath(heroId);
  }

  useFallback(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }
    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackPath;
  }
}
