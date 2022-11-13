import { IsNotEmpty, IsNumber, IsString} from 'class-validator';

export class CreateTokensDto {
    @IsNumber()
    public id: number;

    @IsString()
    @IsNotEmpty()
    public access_token: string;

    @IsString()
    @IsNotEmpty()
    public refresh_token: string;
}