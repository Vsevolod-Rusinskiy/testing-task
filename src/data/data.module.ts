import {Module} from '@nestjs/common';
import {DataService} from './data.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ContactsEntity} from "./contacts.entity";
import {LeadsEntity} from "./leads.entity";
import {Tokens} from "../app.entity";
import {AppService} from "../app.service";

@Module({
    imports: [TypeOrmModule.forFeature([LeadsEntity, ContactsEntity, Tokens, ])],
    providers: [DataService, AppService],
    exports: [DataService]
})
export class DataModule {
}
