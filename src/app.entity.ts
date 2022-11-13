import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn} from 'typeorm';

@Entity()
export class Tokens {
    @PrimaryColumn()
    public id!: number;

    @Column()
    // public ACCESS_TOKEN: string;
    public access_token: string;

    @Column()
    // public REFRESH_TOKEN: string;
    public refresh_token: string;


    /*
     * Create and Update Date Columns
     */

    @CreateDateColumn({type: 'timestamp'})
    public createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    public updatedAt!: Date;
}

