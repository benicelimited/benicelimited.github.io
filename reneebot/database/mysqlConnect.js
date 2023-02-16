import myslq from 'mysql'



const db = myslq.createConnection({
    host:'87.241.69.76',
    user:"mihype",
    password: "mihype189hgw1bgoi1hgw7o8wefamwneg",
    database: "mihype_db",
    

})
db.connect(async (err)=>{
    if(err){
        console.log(err)
    }
    console.log(`Connect as ${db.threadId}`)
    
})
const wait = (t) => new Promise(res=>setInterval(()=>res(),t))
const queryDB = async  (key) =>{
    //'SELECT * from sold_items'
    let _data = [];
    let errorMsg;
    db.query(key,(err,results,fields)=>{
        if(err)console.log(err)
        console.log(results.length)

        if(results.length > 0){
            _data.push(...results)
            
        }
    })
    console.log(_data.length)
    if(_data.length > 0){
        return _data
    }else{

        return _data
    }
}
const inventory = await queryDB('SELECT * from inventory')
const cashoutRates = await queryDB('SELECT * from cashout_rates')
export const getBySku = async (sku,ask) =>{
    console.log(sku)
    let prodName = []
    let sizes =[]
    let addedSize = []
    let msg ={
        name :''
    } 
    let _prodInfo
    let prevAsin = []
    for(let item of inventory){ 
        //console.log(item.wholesale_item_number.replace('-','').toLowerCase())
        if(item.wholesale_item_number.replace('-','').toLowerCase() == sku.toLowerCase()){
            prodName.push(item?.item_description)
            if(ask){
                if(!prevAsin.includes(item.asin)){
                    let askPrice = cashoutRates.filter(v=>v.asin == item.asin)[0].stockx_ask
                    console.log(askPrice)
                    _prodInfo = {
                        size:item.size, 
                        qty:item?.units_received||'N/A', 
                        price: askPrice + ask
                    }

                    prevAsin.push(item.asin)
                    sizes.push(_prodInfo)
                }

            }else{
                if(!prevAsin.includes(item.asin)){
                    let askPrice = cashoutRates.filter(v=>v.asin == item.asin)[0].stockx_ask
                    console.log(askPrice)
                    _prodInfo = {
                        size:item.size, 
                        qty:item?.units_received||'N/A', 
                        price: askPrice || 0 
                    }

                    prevAsin.push(item.asin)
                    sizes.push(_prodInfo)
                }
            }
            
            
        }
        
    }
    msg.name = prodName[0]
    msg.sizes = [...new Set(sizes.map(v=>v))].sort()
   //console.log(msg)
   if(msg.name !== undefined && msg.sizes.length != 0){
        return msg
   }else{
     return null
   }

}
export const getByType = async (shoeType) =>{
    let availableTypes = []
    for(let item of inventory){
        if(item.shoe_type == shoeType.value){
            let msg = {
                "name":item?.item_description,
                "Sku":item.wholesale_item_number,
                "Size":item.size,
                "Price":item?.cost || 'N/A',
                "Qty":item?.current_stock || 'N/A',
                "StockxAsk":item?.stockx_ask || 'N/A'
            }
            availableTypes.push(msg)
        }
    }
    return availableTypes
}
export const priceCompare = async (sku,price)=>{
    console.log(sku)
    let availableItems = []
    let sizes = []
    let msg ={} 
    for(let item of inventory){
        if(item.wholesale_item_number.replace('-','').toLowerCase() == sku){
            msg.name = item?.item_description
            sizes.push(`size:${item.size} x qty:${item?.current_stock || 'N/A'} -${item.stockx_ask + price}`)
            
        }
    }
    msg.sizes = sizes.map(v=>v) 
    console.log(msg)
    return JSON.stringify(msg,null,1)
}
export const getBySize = async (size) =>{
    let availableSizes = []
    for(let item of inventory){
        //console.log(item.size)
        if(item.size == size.value){
            let msg = {
                "name":item?.item_description,
                "Sku":item.wholesale_item_number,
                "Size":item.size,
                "Price":item?.cost || 'N/A',
                "Qty":item?.current_stock || 'N/A',
                "StockxAsk":item?.stockx_ask || 'N/A'
            }
            availableSizes.push(msg)
        }
    }
    //console.log(availableItems.length)
    return availableSizes
}

