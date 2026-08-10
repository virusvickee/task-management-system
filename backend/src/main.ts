import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === 'production';

  // In production, CORS_ORIGIN must be set — no silent localhost fallback.
  // In development, localhost ports are allowed for convenience.
  const allowedOrigins: string[] = [
    ...(isProd ? [] : ['http://localhost:3000', 'http://localhost:3001']),
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ];

  if (isProd && allowedOrigins.length === 0) {
    console.warn('WARNING: CORS_ORIGIN is not set. All cross-origin requests will be blocked.');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin (no Origin header) and server-to-server calls
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Dev-only: allow any localhost port
      if (!isProd && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port}`);
}
bootstrap();
