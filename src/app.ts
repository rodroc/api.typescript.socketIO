import express,{Request,Response} from 'express'
import http from 'http'
import cors from 'cors'
import { Server,Socket } from 'socket.io'

import DbTask from './DbTask'
import {IJobs,IJob} from './models'

const dbTask:DbTask = new DbTask()

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(cors())
const server = http.createServer(app)
const io:Server = new Server(server)

const cache:IJobs=[]
const sockets:Array<Socket>=[]

const getFullList = async () => {
    let jobs:IJobs = cache
    if( !jobs.length ) jobs = await dbTask.getAllJobs()
    if( jobs.length ) {
        for await(const job of jobs){
            const found = cache.find(f=>f.id==job.id )
            if( !found ) cache.push(job)
        }
    }
    // broadcast
    for await(const sck of sockets){
        sck.emit(`jobs.demo`,jobs)
    }
    return jobs
}

app.get('/',async (req:Request,res:Response)=>{
    try{
        await getFullList()
        res.sendFile(__dirname + '/index.html');
    }catch(error){throw error}
})

app.get('/jobs',async (req:Request,res:Response)=>{
    try{
        const jobs:IJobs = await getFullList()
        res.status(200).json(jobs)       
    }catch(error){throw error}
})

app.get('/deactivate/:id',async (req:Request,res:Response)=>{
    try{
        let jobs:IJobs = cache
        if( !jobs.length ) jobs = await dbTask.getAllJobs()
        let list:IJobs = []
        const input:any = req.params
        const found:IJob|undefined = jobs.find(f=>f.id==input.id)
        if( found ){
            for await(const job of jobs){
                if( job.id==found.id ){
                    list.push({
                        id:found.id,
                        title:found.title,
                        is_active:0
                    })
                }else list.push(job)
            }
        }else list = jobs
        // broadcast
        for await(const sck of sockets){
            sck.emit(`jobs.demo`,list)
        }
        res.status(200).json(list)
    }catch(error){throw error}
})

io.on('connection', (socket) => {
    console.log(`User connected with id: ${socket.id}`);
    sockets.push(socket)
    socket.emit(`jobs.demo`,cache)
    socket.on('disconnect', () => {
        console.log(`User id: ${socket.id} disconnected.`);
    });
}) 

// app.listen(3000)
server.listen(3000, () => {
    console.log('listening on *:3000');
});
