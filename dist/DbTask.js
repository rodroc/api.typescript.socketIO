"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class DbTask {
    constructor() {
        this.sequelize = new sequelize_1.Sequelize({
            dialect: 'sqlite', storage: './data/jobs.db3'
        });
    }
    async initDb() {
        if (this.sequelize)
            await this.sequelize.authenticate();
    }
    async getAllJobs() {
        if (!this.sequelize)
            throw Error(`Db must be initialized.`);
        return this.sequelize.query(`SELECT * FROM jobs`, { type: sequelize_1.QueryTypes.SELECT });
    }
}
exports.default = DbTask;
