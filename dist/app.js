"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const DbTask_1 = __importDefault(require("./DbTask"));
const dbTask = new DbTask_1.default();
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const cache = [];
const sockets = [];
const getFullList = async () => {
    let jobs = cache;
    if (!jobs.length)
        jobs = await dbTask.getAllJobs();
    if (jobs.length) {
        for await (const job of jobs) {
            const found = cache.find(f => f.id == job.id);
            if (!found)
                cache.push(job);
        }
    }
    // broadcast
    for await (const sck of sockets) {
        sck.emit(`jobs.demo`, jobs);
    }
    return jobs;
};
app.get('/', async (req, res) => {
    try {
        await getFullList();
        res.sendFile(__dirname + '/index.html');
    }
    catch (error) {
        throw error;
    }
});
app.get('/jobs', async (req, res) => {
    try {
        const jobs = await getFullList();
        res.status(200).json(jobs);
    }
    catch (error) {
        throw error;
    }
});
app.get('/deactivate/:id', async (req, res) => {
    try {
        let jobs = cache;
        if (!jobs.length)
            jobs = await dbTask.getAllJobs();
        let list = [];
        const input = req.params;
        const found = jobs.find(f => f.id == input.id);
        if (found) {
            for await (const job of jobs) {
                if (job.id == found.id) {
                    list.push({
                        id: found.id,
                        title: found.title,
                        is_active: 0
                    });
                }
                else
                    list.push(job);
            }
        }
        else
            list = jobs;
        // broadcast
        for await (const sck of sockets) {
            sck.emit(`jobs.demo`, list);
        }
        res.status(200).json(list);
    }
    catch (error) {
        throw error;
    }
});
io.on('connection', (socket) => {
    console.log(`User connected with id: ${socket.id}`);
    sockets.push(socket);
    socket.emit(`jobs.demo`, cache);
    socket.on('disconnect', () => {
        console.log(`User id: ${socket.id} disconnected.`);
    });
});
// app.listen(3000)
server.listen(3000, () => {
    console.log('listening on *:3000');
});
