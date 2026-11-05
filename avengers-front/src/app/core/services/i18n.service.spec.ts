import { AppContextService } from './app-context.service';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('returns static copy for the active language', () => {
    const context = { current: { language: 'es' } } as AppContextService;
    const service = new I18nService(context);
    expect(service.t('save')).toBe('Guardar');
    expect(service.forLanguage('en', 'save')).toBe('Save');
  });
});
