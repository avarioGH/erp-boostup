import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({ 
    origin: allowedOrigin, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    credentials: true 
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,          // strip properties not in DTO
    forbidNonWhitelisted: false, // don't throw on extra props — silently strip
    transform: true,          // auto-transform types (string → number etc)
    transformOptions: { enableImplicitConversion: true }
  }));
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
