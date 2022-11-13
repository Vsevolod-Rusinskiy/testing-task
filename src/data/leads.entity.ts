import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    ManyToMany, JoinTable
} from 'typeorm';
import {ContactsEntity} from "./contacts.entity";

@Entity()
export class LeadsEntity {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public lead_id_amo: number;

    @Column({nullable: true})
    public name: string;

    @Column({nullable: true})
    public price: number;

    @Column({nullable: true})
    public status_id_amo: number;

    @Column({nullable: true})
    public contacts_ids_amo: string;

    @Column({nullable: true})
    public lead_updated_at_amo: string;

    @Column({nullable: true})
    public responsible_user_id_amo: number;

    @CreateDateColumn({type: 'timestamp'})
    public createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    public updatedAt!: Date;

    @ManyToMany(() => ContactsEntity, (contactsEntity) => contactsEntity.leadsEntityIMNAP,
        {
            cascade: ['update', 'remove'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    )
    @JoinTable({name: "leads_contacts_many_to_many"})

    contactsEntityIMNAP: ContactsEntity[]
}

