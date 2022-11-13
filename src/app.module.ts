import {Module} from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import {AppController} from './app.controller';
import {AppService} from './app.service';

import {TypeOrmModule} from "@nestjs/typeorm";
import {DataModule} from './data/data.module';
import {Tokens} from "./app.entity";
import {ScheduleModule} from "@nestjs/schedule";


@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
            isGlobal: true
        }),

        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            username: process.env.POSTGRES_USER,
            database: process.env.POSTGRES_DB,
            password: process.env.POSTGRES_PASSWORD,
            // entities: [Leads],
            autoLoadEntities: true,
            synchronize: true,
            logging: [ "error", "schema"]
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Tokens]),
        DataModule,
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: [AppService]
})
export class AppModule {
}
