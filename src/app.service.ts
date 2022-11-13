import {Injectable, Logger,} from '@nestjs/common';
import axios from "axios";
import fetch from "cross-fetch";
import {Tokens} from "./app.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {CreateTokensDto} from "./app.dto";
import {RefreshTokenAmoResponseInterface} from "./interfaces/refresh-token-amo-response.interface";


@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name)

    @InjectRepository(Tokens)
    private readonly repository: Repository<Tokens>;

    public async getTokensFromDB(): Promise<Tokens> {
        const response = await this.repository.find()
        return response[0]
    }

    public async checkTokens(): Promise<void> {

        const tokensFromDB = await this.getTokensFromDB();
        try {
             await axios.get(
                'https://nickolaisisin1.amocrm.ru/api/v4/leads?with=contacts',
                {
                    headers: {
                        'Authorization': `Bearer ${tokensFromDB.access_token}`,
                        'Content-Type': "application/json"
                    }
                },
            )
            this.logger.debug("I'm probably logged in! But no sure...111")

        } catch (error) {
            this.logger.debug('Error in checkToken(). Going to refreshToken()...')
            if (error.response.status === 401) {
                this.logger.debug(error.response.status)
                await this.refreshToken(tokensFromDB.refresh_token);
            }
        }
    }

// todo TS done
    public async refreshToken(refreshToken: string): Promise<CreateTokensDto> {

        const raw: string = JSON.stringify({
            "client_id": "4c3e0d38-c68c-42ad-8190-516605c7b957",
            "client_secret": "zCJTmGw72TgHWq7WrrfSVdXn8wzWAhL3cNuUg6hyTpFWJLNFfaDlqDjJQxeYYBf2",
            "grant_type": "refresh_token",
            "refresh_token": refreshToken,
            "redirect_uri": "https://newartspace.ru/"
        });



        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: raw,
        };



        try {
            const response = await fetch("https://nickolaisisin1.amocrm.ru/oauth2/access_token", requestOptions);
            let data: RefreshTokenAmoResponseInterface = await response.json();

            console.log('access = ', data.access_token)
            console.log('refresh = ', data.refresh_token)

            const token: CreateTokensDto = new Tokens() // instance from entity
            token.id = 1;
            token.access_token = data.access_token;
            token.refresh_token = data.refresh_token;

            await this.repository.save(token);
            return token;

        } catch (error) {
            console.log('Can not get token from AMO during refreshing tokens', error);
        }
    }
}


