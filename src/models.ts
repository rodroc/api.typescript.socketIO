export interface IJob{
    id:number,
    title:string,
    is_active:number
}

export interface IJobs extends Array<IJob>{}