import {Injectable, Logger, OnModuleInit,} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Not, Repository, DataSource, LessThan, MoreThanOrEqual, createQueryBuilder} from "typeorm";
import {LeadsEntity} from "./leads.entity";
import {ContactsEntity} from "./contacts.entity";
import {AppService} from "../app.service";
import axios from "axios";
import {Cron, CronExpression} from "@nestjs/schedule";
import {log} from "util";
import {TypeOrmModule} from "@nestjs/typeorm";
import {time} from "cron";
import {Tokens} from "../app.entity";
import {IContact, IContactsAmoFieldObj} from "../interfaces/contact.interface";


// TODO: wrap into try catch 

@Injectable()
export class DataService {
    constructor(
        private appService: AppService,
        @InjectRepository(LeadsEntity)
        private leadsRepository: Repository<LeadsEntity>,
        @InjectRepository(ContactsEntity)
        private contactsRepository: Repository<ContactsEntity>,
    ) {
    }

    private readonly logger = new Logger(DataService.name)

    @Cron(CronExpression.EVERY_10_SECONDS)
    async syncLeadsAndContacts(): Promise<void> {
        this.logger.debug('Called every 10 seconds');

        // todo TS ???
        const latestUpdatedTimeFromDB = await this.getLatestUpdatedTimeFromDB()
        const numberLatestUpdatedTimeFromDB = latestUpdatedTimeFromDB * 1000
        const leadsFromAmo = await this.getLeadsWithContactsId();

        for (let leadFromAmo of leadsFromAmo) {
            leadFromAmo.updated_at = new Date(leadFromAmo.updated_at * 1000)
            const timeDifference = leadFromAmo.updated_at - numberLatestUpdatedTimeFromDB

            if (timeDifference > 0) {
                const contactsIdsArrayFromAmoLead = await this.getContactsIdsArrayFromAmoLead(leadFromAmo._embedded.contacts)
                const leadFromDB = await this.getleadFromDB(leadFromAmo)

                let leadFromAmoUnixTimeStemp = (leadFromAmo.updated_at / 1000).toString()

                const freshLeadFromAMO = {
                    lead_id_amo: leadFromAmo.id,
                    name: leadFromAmo.name,
                    price: leadFromAmo.price,
                    responsible_user_id_amo: leadFromAmo.responsible_user_id,
                    status_id_amo: leadFromAmo.status_id,
                    contacts_ids_amo: JSON.stringify(contactsIdsArrayFromAmoLead),
                    lead_updated_at_amo: leadFromAmoUnixTimeStemp
                }

                const saved = await this.leadsRepository.save(Object.assign(leadFromDB || {}, freshLeadFromAMO));
                await this.setManyToManyLeadsToContactsRelations(saved, contactsIdsArrayFromAmoLead)
            }
        }
    }

// todo:
    async getLatestUpdatedTimeFromDB(): Promise<number> {
        const query = this.leadsRepository.createQueryBuilder('leads_entity');
        query.select("MAX(leads_entity.lead_updated_at_amo)", "max");
        const result = await query.getRawOne();
        return result.max;
    }


    async getLeadsWithContactsId(): Promise<any[]> {
        const tokensFromDB = await this.appService.getTokensFromDB()
        try {
            let answer = await axios({
                method: 'get',
                url: 'https://nickolaisisin1.amocrm.ru/api/v4/leads?with=contacts',
                headers: {
                    'Authorization': `Bearer ${tokensFromDB.access_token}`,
                    'Content-Type': "application/json"
                },
            })
            return answer.data._embedded.leads;

        } catch (error) {
            console.log('Something went wrong...', error)
        }

    }

    async getUsers(): Promise<any[]> {
        const tokensFromDB = await this.appService.getTokensFromDB()

        try {
            const answer = await axios({
                method: 'get',
                url: 'https://nickolaisisin1.amocrm.ru/api/v4/users',
                headers: {
                    'Authorization': `Bearer ${tokensFromDB.access_token}`,
                    'Content-Type': "application/json"
                },
            });
            return answer.data._embedded.users
        } catch (error) {
            console.log('Something went wrong...', error)
        }
    }

    async getContacts(): Promise<any[]> {
        const tokensFromDB = await this.appService.getTokensFromDB()

        try {
            const answer = await axios({
                method: 'get',
                url: 'https://nickolaisisin1.amocrm.ru/api/v4/contacts',
                headers: {
                    'Authorization': `Bearer ${tokensFromDB.access_token}`,
                    'Content-Type': "application/json"
                },
            });
            const contacts = await answer.data._embedded.contacts;
            return answer.data._embedded.contacts;
        } catch (error) {
            console.log('Something went wrong...', error)
        }
    }

    async saveContactsToBD(contacts: any[]) {
        const savedIds: number[] = []

        for (const contact of contacts) {
            const contactFromDB = await this.contactsRepository.findOne({
                where: {
                    contact_id_amo: contact.id
                }
            })


            const freshContactFromAMO: IContact = {
                contact_id_amo: contact.id,
                name: contact.name,
                responsible_user_id_amo: contact.responsible_user_id,
                contact_updated_at_amo: contact.updated_at
            }

            const saved = await this.contactsRepository.save(Object.assign(contactFromDB || {}, freshContactFromAMO));
            savedIds.push(saved.id)
        }

        await this.contactsRepository.delete({
            id: Not(In(savedIds))
        })
    }

    async getContactsIdsArrayFromAmoLead(contactsAmoFieldObj): Promise<number[]> {
        let contactsIdsFromAmoLead = []
        for (const elem of contactsAmoFieldObj) {
            contactsIdsFromAmoLead.push({id: elem.id})
        }
        return contactsIdsFromAmoLead
    }

    async getleadFromDB(lead) {
        return await this.leadsRepository.findOne({
            where: {
                lead_id_amo: lead.id
            }
        })
    }

    async setManyToManyLeadsToContactsRelations(lead, contactsIdsArray) {
        const contactsArryaForRelationsWithLeads = []
        for (let elem of contactsIdsArray) {
            const contact = await this.contactsRepository.findOne({
                where: {
                    contact_id_amo: elem.id
                }
            })
            contactsArryaForRelationsWithLeads.push(contact)
        }
        lead.contactsEntityIMNAP = contactsArryaForRelationsWithLeads // ( [], [], [] )
        await this.leadsRepository.save(lead)
    }

    async saveLeadsToBD(leads: any[]) {
        const savedIds: number[] = []

        for (const lead of leads) {

            const leadFromDB = await this.getleadFromDB(lead)

            const contactsIdsArrayFromAmoLead = await this.getContactsIdsArrayFromAmoLead(lead._embedded.contacts)

            //  renew leadFromDB из freshLeadFromAMO
            const freshLeadFromAMO = {
                lead_id_amo: lead.id,
                name: lead.name,
                price: lead.price,
                responsible_user_id_amo: lead.responsible_user_id,
                status_id_amo: lead.status_id,
                contacts_ids_amo: JSON.stringify(contactsIdsArrayFromAmoLead),
                lead_updated_at_amo: lead.updated_at
            }

            // put freshLeadFromAMO into emty obj – that is, create new leads with changes and save it to DB
            const saved = await this.leadsRepository.save(Object.assign(leadFromDB || {}, freshLeadFromAMO));

            // set Many-To-Many relation ( Lead-To-Contacts )
            if (contactsIdsArrayFromAmoLead[0] !== undefined) {
                await this.setManyToManyLeadsToContactsRelations(saved, contactsIdsArrayFromAmoLead)
            }
            savedIds.push(saved.id)
        }
        await this.leadsRepository.delete({
            id: Not(In(savedIds))
        })
    }


    //  todo: INIT MODULE

    async onModuleInit() {
        this.logger.debug('onModuleInit resolved')
        await this.appService.checkTokens()
        const contacts: any[] = await this.getContacts()
        const leads: any[] = await this.getLeadsWithContactsId();
        const users: any[] = await this.getUsers();
        await this.saveContactsToBD(contacts)
        await this.saveLeadsToBD(leads)
    }
}

//-----
// async searchTestManyToMany() {
//     const a = await this.leadsRepository.findOne({
//         where: {
//             id: 1
//         }, relations: ['contactsEntityIMNAP']
//     })
//     return a.contactsEntityIMNAP[0].contact_id_amo
// }
//-----


