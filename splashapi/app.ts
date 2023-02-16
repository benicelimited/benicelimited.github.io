import express, { Request, Response } from 'express';
import {config} from 'dotenv'
import http from 'http'
import fs from 'fs'
import {getAccessToken,ValidateRole} from './auth'

const app = express();
config()
/*
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};
*/




const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const DISCORD_API_BASE = 'https://discord.com/api/v10';



app.get('/',(req:Request , res:Response)=>{
  res.send('Welcome')
})
app.get('/login', (req: Request, res: Response) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=email%20identify%20guilds.members.read`;
  res.redirect(url);
});

app.get('/callback', async (req: Request, res: Response) => {
  try{
    const authorizationCode = req.query.code as string;
    //console.log(authorizationCode)
    const access_token:any = await getAccessToken(authorizationCode)
    let access = await ValidateRole(access_token)
    if(access != false){
      res.send("User Has Access")
    }else{
      res.send('Access Denied')
    }

  }catch(err){
    res.redirect('/login');
  }
  
    
});

http.createServer(app).listen(3000, () => {
  console.log('Server listening on port 3000');
});
