import axios from 'axios'
import {config} from 'dotenv'
config()

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const Server_ID = "1037043213892075600"
const ROLE_ID = "1037131595896868884"
const sleep = async (t:number)=> new Promise((res:any)=> setTimeout(()=>res(),t))


export async function getAccessToken(code:string){
    const data = {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      try{
            const tokenRes = await axios.post(`https://discord.com/api/v10/oauth2/token`,data,config);
            if(tokenRes.data?.errors){
              console.log(tokenRes.data.errors)
            }
            const { access_token, refresh_token } = tokenRes.data;
            
            console.log(tokenRes.data)
            /*
            const user = await axios.get(`https://discord.com/api/v10/users/@me`, {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            console.log(user.data)
            const { id, username, discriminator, email } = user.data;
            */
            return access_token
            
            
            // Do something with the user data...
        }catch(err:any){
            console.log(err.message)
        }
}
export async function ValidateRole(accessToken:string){
    try{
        console.log(accessToken)
        let config = {headers: {
            'Authorization': `Bearer ${accessToken}`
        }}
        let response = await axios.get(`https://discord.com/api/v10/users/@me/guilds/${Server_ID}/member`,config)
        //console.log(response.data)
        const member = response.data;
        if(member.roles.includes(ROLE_ID)){
            console.log('User is Authorized')
            return true
        }else{
            return false
        }
            
        
    }catch(error:any){
        console.error(`Error retrieving member information for guild ${Server_ID}: ${error.message}`);
        return false
    };
        
    
}