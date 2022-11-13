import {Controller, Get, Query, Res} from '@nestjs/common';
import {AppService} from './app.service';
import {DataService} from "./data/data.service";
import {Response} from "express";


@Controller()
export class AppController {

    constructor(
        private readonly appService: AppService,
        private readonly dataService: DataService
    ) {
    }

    @Get()
    public async mainRoute() {
        await this.appService.checkTokens()
    }
}
