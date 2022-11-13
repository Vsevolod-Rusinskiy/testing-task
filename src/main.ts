import {ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';

async function bootstrap() {
    const app: NestExpressApplication = await NestFactory.create(AppModule);
    const PORT = process.env.PORT || 5000

    app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}));

    await app.listen(PORT, () => {
        console.log('[WEB]', PORT);
    });
}

bootstrap();
