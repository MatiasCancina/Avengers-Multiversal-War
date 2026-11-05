import 'reflect-metadata';
import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './basic/all-exceptions.filter';
import { setupSwagger } from './config/swagger';

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  const selectedLevel = config.get<LogLevel>('APP_LOG_LEVEL', 'log');
  app.useLogger(levels.slice(0, levels.indexOf(selectedLevel) + 1));
  app.setGlobalPrefix(config.get<string>('APP_BASE_PATH', 'game'));
  app.enableCors({
    origin: config.get<string>('CORS_ALLOWED_ORIGIN', 'http://localhost:3101'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  setupSwagger(app, config.get<string>('APP_BASE_PATH', 'game'));
  return app;
}
