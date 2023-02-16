import express from 'express'
import getAccountInfo from './modules/index.js'

const app = express()
const port = process.env.PORT || 3000

app.get('/',(req,res)=>{
    res.status(200).send('Welcome To the Api')
})

app.get('/getInfo',async (req,res)=>{
    const data = req.query.key
    //console.log(data)
    if(data == ' ') return res.status(400).send('Query Error')
    let result = await getAccountInfo(data).catch((err)=>{
        res.status(301).send('Error use')
    })
    res.status(200).json(JSON.parse(JSON.stringify(result,null,2)))
})

app.listen(port,()=>{
    console.log(`Server Running on Port ${port}`)
})