import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { LoggerService } from './common/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the logger service from DI container
  const logger = app.get(LoggerService);

  // Set up global exception filter with dependency injection
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // অতিরিক্ত property remove করবে
      forbidNonWhitelisted: true, // unknown property দিলে error দিবে
      transform: true, // plain object কে DTO class এ convert করবে
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
    'Bootstrap',
  );
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
