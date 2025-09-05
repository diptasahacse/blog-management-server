import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // অতিরিক্ত property remove করবে
      forbidNonWhitelisted: true, // unknown property দিলে error দিবে
      transform: true, // plain object কে DTO class এ convert করবে
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
