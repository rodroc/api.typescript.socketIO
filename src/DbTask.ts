import { Sequelize,QueryTypes } from "sequelize"

class DbTask{
    private sequelize:Sequelize|null|undefined
 
    constructor(){
        this.sequelize = new Sequelize({
            dialect: 'sqlite', storage: './data/jobs.db3'
        })
    }
    
    async initDb(){
        if( this.sequelize ) await this.sequelize.authenticate()   
    }

    async getAllJobs():Promise<any>{
        if( !this.sequelize ) throw Error(`Db must be initialized.`)
        return this.sequelize.query(`SELECT * FROM jobs`,{type:QueryTypes.SELECT})
    }

}

export default DbTask