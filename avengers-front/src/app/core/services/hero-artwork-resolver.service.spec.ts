import { HeroArtworkResolverService } from './hero-artwork-resolver.service';

describe('HeroArtworkResolverService', () => {
  it('builds a stable local asset path from a public Hero ID', () => {
    const resolver = new HeroArtworkResolverService();
    expect(resolver.resolve('spider-man')).toBe('assets/portraits/spider-man-portrait.webp');
    expect(resolver.cardPath('spider-man')).toBe('assets/cards/spider-man-card.webp');
    expect(resolver.fallbackPath).toBe('assets/artwork/default_card.webp');
  });

  it('switches a missing specific image to the single fallback once', () => {
    const resolver = new HeroArtworkResolverService();
    const image = document.createElement('img');
    const event = new Event('error');
    Object.defineProperty(event, 'target', { value: image });

    resolver.useFallback(event);
    resolver.useFallback(event);

    expect(image.src).toContain('assets/artwork/default_card.webp');
    expect(image.dataset['fallbackApplied']).toBe('true');
  });
});
