import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

// Swagger is available before the story unfolds. Runtime responses retain their full authoritative shape.
const hiddenStoryTerms =
  /doom|surfer|dormammu|doomsday|final[_ -]?attack|final[_ -]?response|reveal|allied[_ -]?with|sue[_ -]?storm[_ -]?appeal/i;
const safeSchemaName = (name: string) =>
  name
    .replace(/Doomsday/gi, 'RevealedPhase')
    .replace(/Doom/gi, 'Antagonist')
    .replace(/Surfer/gi, 'NarrativeCharacter')
    .replace(/FinalAttack/gi, 'LatePhase');

export function studentSafeOpenApi(document: OpenAPIObject): OpenAPIObject {
  const clean = (value: unknown, parentKey = ''): unknown => {
    if (typeof value === 'string') {
      if (parentKey === '$ref') {
        const prefix = '#/components/schemas/';
        return value.startsWith(prefix)
          ? `${prefix}${safeSchemaName(value.slice(prefix.length))}`
          : value;
      }
      return hiddenStoryTerms.test(value) ? 'Runtime-revealed narrative value.' : value;
    }
    if (Array.isArray(value)) {
      const values =
        parentKey === 'enum' || parentKey === 'required'
          ? value.filter((item) => typeof item !== 'string' || !hiddenStoryTerms.test(item))
          : value;
      return values.map((item) => clean(item, parentKey));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) => {
        if (key === 'example' && entry === 'avengers-doomsday') {
          return [];
        }
        if (parentKey !== 'schemas' && hiddenStoryTerms.test(key)) {
          return [];
        }
        if (
          key === 'enum' &&
          Array.isArray(entry) &&
          !entry.some((item) => typeof item !== 'string' || !hiddenStoryTerms.test(item))
        ) {
          return [];
        }
        const nextKey = parentKey === 'schemas' ? safeSchemaName(key) : key;
        return [[nextKey, clean(entry, key)]];
      }),
    );
  };
  return clean(document) as OpenAPIObject;
}

export function setupSwagger(app: INestApplication, basePath: string): void {
  const config = app.get(ConfigService);
  const title = config.get<string>('SWAGGER_APP_TITLE', 'Game API');
  const documentConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(
      config.get<string>(
        'SWAGGER_APP_DESCRIPTION',
        'Reusable Game API for the Programacion III final project',
      ),
    )
    .setVersion(config.get<string>('SWAGGER_APP_VERSION', '0.1.0'))
    .addTag('health', 'Process readiness and API identity.')
    .addTag('Teams', 'Assigned Team identity, configuration, and completed history.')
    .addTag('Heroes', 'Selectable Hero content and sparse Hero relationships.')
    .addTag('Journey', 'Journey lifecycle, simulation, competition facts, Store, and preparation.')
    .addTag('Final Stage', 'Interactive FinalStage state, choices, events, and commands.')
    .addTag('Statistics', 'Completed competition facts and official Award decisions.')
    .addTag('Reference', 'Localized game vocabulary and operational catalogs.')
    .build();

  const themeName =
    Object.values(SwaggerThemeNameEnum).find(
      (name) => name === config.get<string>('SWAGGER_THEME', 'classic'),
    ) ?? SwaggerThemeNameEnum.CLASSIC;
  const options: SwaggerCustomOptions = {
    customSiteTitle: title,
    customCss: new SwaggerTheme().getBuffer(themeName),
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
      defaultModelsExpandDepth: 2,
      tryItOutEnabled: true,
    },
  };

  const document = studentSafeOpenApi(SwaggerModule.createDocument(app, documentConfig));
  SwaggerModule.setup(`${basePath}/api`, app, document, options);
}
