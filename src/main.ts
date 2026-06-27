import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded, static as expressStatic } from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve uploaded images statically with multiple fallback path mappings for proxy safety
  const imagesPath = path.join(process.cwd(), 'public', 'images');
  app.use('/images', expressStatic(imagesPath));
  app.use('/kiora_api/images', expressStatic(imagesPath));
  app.use('/api/images', expressStatic(imagesPath));

  // Increase payload size limit to 50mb for base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable Cross-Origin Resource Sharing (CORS) matching allowed origins
  app.enableCors({
    origin: '*', // Allow all origins for integration flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });


  const port = process.env.PORT || 8009;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running at http://localhost:${port}`);
}
bootstrap();
