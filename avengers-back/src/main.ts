import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './basic/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>('APP_BASE_PATH', 'gameCore'));
  const allowedOrigins = config
    .get<string>('CORS_ALLOWED_ORIGIN', 'http://localhost:3102')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Avengers: Multiversal War BFF')
      .setDescription('BFF for the Avengers: Multiversal War application')
      .setVersion('0.1.0')
      .build(),
  );
  SwaggerModule.setup('gameCore/api', app, document, {
    jsonDocumentUrl: 'gameCore/api-json',
    swaggerOptions: { docExpansion: 'none', tryItOutEnabled: true },
  });
  const renderPort = config.get<string>('PORT');
  const port = Number(renderPort ?? config.get<string>('APP_PORT', '4102'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT or APP_PORT must be a valid TCP port.');
  }
  const host = renderPort ? '0.0.0.0' : config.get<string>('APP_HOST', 'localhost');
  await app.listen(port, host);
}
void bootstrap();
