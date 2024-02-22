const fs = require('fs'),
    csv = require('csv-parser'),
    { finished } = require('stream/promises'),
    sqlite3 = require('sqlite3'),
    { open } = require('sqlite'),
    { Sequelize,DataTypes } = require('sequelize')

const initDb = async() => {
    sqlite3.verbose()
    const db = await open({ filename: './data/jobs.db3',driver: sqlite3.Database
        })
    db.on('trace', data => {
        console.log({data})
    })
    await db.exec(`CREATE TABLE IF NOT EXISTS jobs(
        id integer primary key autoincrement, 
        title text,
        is_active integer default '1'
      );`)
}

const parseCSV = async () =>{
    try{
        const results = []
        const stream = fs.createReadStream('./data/jobs.csv').pipe(csv())
        stream.on('data',data=>results.push(data))
        await finished(stream)
        if( !results.length ){
            console.log(`No data to import. Process aborted.`)
            return results
        }
        return results
    }catch(error){throw error}
}

const importData = async list =>{
    try {
        if( !list) return []
        if( !Array.isArray(list) ) return []
        if( !list.length ) return []
        const sequelize = new Sequelize({
            dialect: 'sqlite', storage: './data/jobs.db3'
        })
        await sequelize.authenticate();
        const jobModel = sequelize.define('jobs',{
            id: { type: DataTypes.INTEGER, primaryKey: true},
            title: { type: DataTypes.STRING, defaultValue: null },
            is_active: { type: DataTypes.INTEGER, defaultValue: 1}
        },{ timestamps: false, jobs: 'jobs'})
        await saveBulk(jobModel,list.slice().reverse())
    } catch (error) {
        throw error
    }
}

const saveBulk = async (model,entries=[]) => {
    try{
        if( !entries.length ) return 0
        const listCount = entries.length
        let batch = []
        while(entries.length>0){
            let u = entries.pop()
            batch.push(u)
            if( batch.length>=50 ){
                await model.bulkCreate(batch)
                batch=[] // reset
            }
        }
        if( batch.length>0 ) await model.bulkCreate(batch)
        return listCount
    }catch(error){
        throw error
    }
}

(async()=>{
    console.log(`Starting...`)
    await initDb()
    const csvData = await parseCSV()
    // console.log({csvData})
    await importData(csvData)
    console.log(`End of script.`)
})()
