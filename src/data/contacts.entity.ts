import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    ManyToMany,
} from 'typeorm';
import {LeadsEntity} from "./leads.entity";



@Entity()
export class ContactsEntity {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public contact_id_amo: number;

    @Column({nullable: true})
    public name: string;

    @Column({nullable: true})
    public responsible_user_id_amo: number;

    @Column({nullable: true})
    public contact_updated_at_amo: number;

    @CreateDateColumn({type: 'timestamp'})
    public createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    public updatedAt!: Date;


    @ManyToMany(() => LeadsEntity, (leadsEntity) => leadsEntity.contactsEntityIMNAP)
    // @JoinTable({name: "leads_contacts_many_to_many"})
    // @JoinTable({
    //
    //     name: "leads_contacts_contact_entity", // table name for the junction table of this relation
    //     joinColumn: {
    //         name: "leadsId",
    //         referencedColumnName: "id"
    //     },
    //     inverseJoinColumn: {
    //         name: "contactsId",
    //         referencedColumnName: "id"
    //     }
    // })
    leadsEntityIMNAP: LeadsEntity[]
}
