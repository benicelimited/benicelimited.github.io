import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import got from 'got';

const connection = new Connection(clusterApiUrl('mainnet-beta'))

export default async function getAccountInfo(publicKey){
    let returnValue = []
    let key = new PublicKey(publicKey)
    //const profile = await connection.getAccountInfo(key).catch(err=>console.log(err.message))
    const program = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    //const profile = await connection.getAccountInfo(key)
    try{
        const profile = await got.get(`https://public-api.solscan.io/account/${publicKey}`).then(resp=>JSON.parse(resp.body))
        profile.accountBalance = profile.lamports/LAMPORTS_PER_SOL
        profile.Tokens = []
        //console.log(profile.body)
        const {body} = await got.get(`https://public-api.solscan.io/account/tokens`,{
            searchParams:{account:publicKey}
        })
        for(let token of JSON.parse(body)){
            token.info = ''
            //console.log(token)
            const tokenData= await got.get('https://public-api.solscan.io/token/meta',{
                searchParams:{tokenAddress:token.tokenAddress},
            }).catch(err=>console.log(err.message))
            token.lamports = token.lamports / LAMPORTS_PER_SOL
            token.tokenName = JSON.parse(tokenData.body).name
            token.supply = JSON.parse(tokenData.body).supply
            token.type = JSON.parse(tokenData.body).type
            const marketData = await got.get(`https://public-api.solscan.io/market/token/${token.tokenAddress}`,{
            }).catch(err=>console.log(err.message))
            if(marketData.body != {}){
                token.marketData = marketData.body
            }
            //console.log(token)
            profile.Tokens.push(token)
        }
        return profile
    }catch(err){
        console.log(err.message)
        return err.message
    }
    //console.log(JSON.parse(body))
}

//getAccountInfo('A67DZVey7kuEh7UJz4RMM7TMrjRmgqJupwGirtVosvzE')