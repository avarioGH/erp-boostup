import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. HTTP Security Headers (Anti XSS, Clickjacking, MIME-sniffing)
  app.use(helmet());

  // 2. Strict Rate Limiting on Login (Anti Brute-Force & Credential Stuffing)
  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 5 * 60 * 1000, // 5 menit
      max: 10, // Maksimal 10x percobaan login gagal per IP dalam 5 menit
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Terlalu banyak percobaan login gagal dari perangkat/IP ini. Demi keamanan akun Anda, silakan coba lagi setelah 5 menit.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 3. Global Rate Limiting (Anti DDoS & API Scraping)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Terlalu banyak request, silakan coba lagi setelah beberapa menit.',
      },
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
