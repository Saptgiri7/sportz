import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { desc } from "drizzle-orm";
import { getMatchStatus } from "../utlis/match-status.js";
import { matches } from "../db/schema.js";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/', async(req,res)=>{
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if(!parsed.success){
        return res.status(400).json({error : "invalid query", details : parsed.error.issues})
    }

    const limit = Math.min(parsed.data.limit ?? 50,MAX_LIMIT);
    
    try {
        const data = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);

        res.status(200).json({data});

    } catch (e) {
        res.status(500).json({error : "failed to list Matches"})
    }
    // res.send('<h1>List Matches</h1>')
})


matchRouter.post('/', async(req,res)=>{
    const parsed = createMatchSchema.safeParse(req.body);

    console.log(parsed);

    if(!parsed.success){
        return res.status(400).json({error : "invalid payload", details: parsed.error.issues})
    }

    const {data : {startTime,endTime,homeScore,awayScore}} = parsed

    try {
        console.log(startTime,endTime,homeScore,awayScore);

        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime : new Date(endTime),
            homeScore : homeScore ?? 0,
            awayScore : awayScore ?? 0,
            status : getMatchStatus(startTime,endTime),
        }).returning();

        if(res.app.locals.broadCastMatchCreated){
            res.app.locals.broadCastMatchCreated(event);
        }
        
        res.status(200).json({data: event});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Failed to create match",details : error})
    }

})



// {
//     "sport" :"cricket",
//     "homeTeam" : "india",
//     "awayTeam" : "England",
//     "startTime" : "2026-02-01T12:00:00.000Z" 
//     "endTime" : "2026-02-01T13:45:00.000Z" 
// }