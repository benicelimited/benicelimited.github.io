const cheerio = require("cheerio");
const delay = require('delay');
const atob = require('atob')
const { Webhook,MessageBuilder } = require('discord-webhook-node');
const btoa = require('btoa');
//const proxy = require("./Utilities/Proxies");
const profile = require('./Utilites/userinfo.json')
//const {keys} = require('./Utilities/shopifysitekeys');
const { jar } = require("request-promise");



class ShopifyRequest{
    constructor(url,keywords,color,size){
        this.request = require('request-promise').defaults({
            followAllRedirects: true,
            resolveWithFullResponse: true,
            //proxy: proxy.proxyIp && proxy.proxyPort && proxy.proxyUser && proxy.proxyPass ? `http://${proxy.proxyUser}:${proxy.proxyPass}@${proxy.proxyIp}:${proxy.proxyPort}` : ''
        }),
        this.cookieJar = this.request.jar()
        this.getUA = function getUA() {
            return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        }
        this.includeHeaders = function (body, response, resolveWithFullResponse) {
            return {
                headers: response.headers,
                body: body,
                status: response.statusCode,
                finalUrl: response.request.uri.href // contains final URL
            };
        };
        this.logCookies = function logCookies(jar) {
            return new Promise((res) => {
                jar._jar.store.getAllCookies(function (err, cookieArray) {
                    if (err) throw new Error("Failed to get cookies");
                    res(cookieArray.map(cookie => cookie.toString()).join(', '));
                });
            })
        }
        this.getCaptcha = async function getCaptcha(domain, sitekeylocal) {
            console.log('Captcha needs solving')
            const sendCaptcha = await this.request.post({
                headers:{
                    'User-Agent': this.getUA,
                },
                url: 'http://2captcha.com/in.php',
                key: profile.captchasolver,
                method: 'userrecaptcha',
                pageurl: domain,
                googlekey: sitekeylocal,
                jar: this.cookieJar()

                
            })
            return sendCaptcha
            //process.exit(0)
        }
        this.url = url;
        this.keywords = keywords
        this.color = color;
        this.size = size
        this.randomSize = true
        this.randomcolor = true;
        this.website = "https://"+this.url.split('/')[2]
        this.product = ""
        this.availableVariants = []
        


    }
    //Located product using early link
    async findProduct(){
        while(true){
            console.log(this.website)
            console.log('Locating Product')
            if(this.url){
                try{
                    let getitem = await this.request.get({
                        headers: {
                            'User-Agent': this.getUA(),
                            
                        },
                        withCredentials: false,
                        url: this.url + '.json'
                    })
        
                    const urlItemRes = JSON.parse(getitem.body)
                    this.productFound = urlItemRes.product
                    console.log(this.productFound)
                    try{
                        let variantList = []
                        for(let i = 0; i < this.productFound.variants.length; i++){
                            this.availableVariants = this.productFound.variants[i]
                            
                            if(this.availableVariants.title == this.size){
                                this.sizeFound = this.availableVariants
                                break
                                

                            }else if(this.availableVariants.available == true){
                                variantList.push(this.availableVariants)
                                this.firstSizeAvaiable = variantList[Math.floor(Math.random() * variantList.length)]
                            
                            }

                        }
                        
                        if(this.sizeFound != null){
                            let imageURL = this.productFound.images.length > 0 ? this.productFound.images[0].src : '';
                            this.prodInfo = {
                                image : imageURL,
                                name: this.productFound.name,
                                size: this.sizeFound.title,
                                price: `$${this.sizeFound.price}`
                            }
                            //console.log(this.prodInfo)
                            
                            return this.sizeFound.id
                        }else{
                            let imageURL = this.productFound.images.length > 0 ? this.productFound.images[0].src : '';
                            this.prodInfo = {
                                image: imageURL,
                                name: this.productFound.name,
                                size: this.firstSizeAvaiable.title,
                                price: `$${this.firstSizeAvaiable.price}`
                            }
                            //console.log(this.prodInfo)
                            return this.firstSizeAvaiable.id
                        }
                        
                
                    }catch(e){
                        console.log(e)
                    }
                    
                    

                }catch(err){
                    console.log(err)

                    
                }
                
            }
        }
    }
    //ADD TO CART FUNCTION 
    async addToCart(){
        await this.findProduct()
        .then(async res=>{
            try{
                let cartReq = await this.request.post({
                    headers: {
                        'User-Agent': this.getUA(),
                        'content-type': 'application/json; charset=UTF-8',
                        //'Poptls-Url' : this.website + "/cart/add.js"
                    },
                    transform: this.includeHeaders,
                    jar: this.cookieJar,
                    url: this.website + "/cart/add.js",
                    form: {
                        id: res,
                        quantity: "1"
                    }
                })
                this.cartRes = JSON.parse(cartReq.body)
                return cartReq

            }catch(err){
                console.log(err)
            }
        })
        
         
    }

    async checkout(){
        try{
            await this.addToCart()
            .then(async () =>{ 
                let urlReq = await this.request.post({
                    headers: {
                        'User-Agent': this.getUA(),
                        'content-type': 'application/json; charset=UTF-8',
                        //'Poptls-Url' : this.website + "/cart"
                    },
                    url: this.website + "/cart",
                    transform: this.includeHeaders,
                    jar: this.cookieJar,
                    form: {
                        "updates[]": 1,
                        "attributes[checkout_clicked]": true,
                        "checkout": ""
                    }
                })
                let checkoutres = urlReq
                //console.log(checkoutres)
                return checkoutres
            })
            .then(async resolve =>{
                //console.log(resolve)
                //const c = cheerio.load(resolve)
                console.log('Add to cart success')
                this.finalUrl = resolve.finalUrl
                this.authToken = (()=>{
                    if(this.finalUrl.includes('authenticity_token')) {
                        let authToken = this.finalUrl.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                        return authToken
                    }
                })
                this.siteKeyLocal = (()=>{
                    if (this.finalUrl.includes('sitekey: "')) {
                        let siteKeyLocal = this.finalUrl.split('sitekey: "')[1].split('"')[0]
                        return siteKeyLocal
                    }
                })
            
                if (this.finalUrl.includes('account/login')) {
                    // login to account if necessary
                    console.log('logging in')
                    const checkout_url = decodeURIComponent(this.finalUrl.split('checkout_url=')[1].split('&')[0])
                    const loginReq = await this.request.post({
                        url: `${this.website}/account/login`,
                        //url: this.tlserver,
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded',
                            'User-Agent': this.getUA(),
                            //'Poptls-Url': `${this.website}/account/login`
                        },
                        jar: this.cookieJar,
                        transform: this.includeHeaders,
                        form: {
                            form_type: "customer_login",
                            "customer[email]": profile.shopifyEmail,
                            "customer[password]": profile.shopifyPassword,
                            "checkout_url": encodeURI(checkout_url)
                        }

                    })
                    
                        
                    this.loginresolve = loginReq
                    //console.log(this.loginresolve)
                    let logfinalUrl = this.loginresolve.finalUrl
                    let authToken = ''
                    if (this.loginresolve.body.includes('authenticity_token')) {
                        authToken = this.loginresolve.body.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                    }
                    let challengeToken = {}
                    if (logfinalUrl.includes('/challenge')) {
                        challengeToken = await this.getCaptcha(logfinalUrl, this.loginresolve.body.split('sitekey: "')[1].split('"')[0])
                        let challengeReq = await this.request.post({
                            url: `${this.website}/account/login`,
                            //url: this.tlserver,
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded',
                                'User-Agent': this.getUA(),
                                //'Poptls-Url': `${this.website}/account/login`
                            },
                            jar: this.cookieJar,
                            transform: this.includeHeaders,
                            form: {
                            utf8: "✓",
                                "authenticity_token": authToken,
                                "g-recaptcha-response": challengeToken
                            }
                        })
                        let churlRes = challengeReq.body
                        let chfinalUrl = challengeReq.finalUrl
                        if (churlRes.includes('authenticity_token')) {
                            this.authToken = churlRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                        }
                        if (chfinalUrl.includes('sitekey: "')) {
                            this.siteKeyLocal = churlRes.split('sitekey: "')[1].split('"')[0]
                        }
                    }
                    
                        
                }
                if (this.finalUrl.includes('/checkpoint')) {
                    //CHECKS IF IT IS A CHECKPOINT THAT NEEDS SOLVING
                    //console.log(domain + sitekeylocal)
                    let captchaToken = await this.getCaptcha(this.finalUrl, resolve.split('sitekey: "')[1].split('"')[0])
                    captchaToken = captchaToken.value
                    console.log('checking out')
                    urlReq = await this.request.post({
                        headers: {
                            'User-Agent': this.getUA(),
                            'content-type': 'application/x-www-form-urlencoded',
                            //'Poptls-Url': this.finalUrl
                        },
                        transform: this.includeHeaders,
                        url: this.finalUrl,
                        jar: this.cookieJar,
                        body: encodeURI(`authenticity_token=${this.authToken}&g-recaptcha-response=${captchaToken}&data_via=cookie&commit=`)
                    })

                    chkurlRes = urlReq.body;
                    chkfinalUrl = urlReq.finalUrl;

                    if (chkurlRes.includes('authenticity_token')) {
                        this.authToken = chkurlRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                    }
                }
                function t(e) {
                    return decodeURIComponent(atob(e.replace(/_/g, "/").replace(/-/g, "+")).split("").map(function (e) {
                        return "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2)
                    }).join(""))
                }
                //CHECKS FOR QUEUE
                if (this.finalUrl.includes('/throttle/queue')) {
                    try {
                        const cookiePre = await logCookies(this.cookieJar)
                        if (cookiePre.includes('_checkout_queue_token')) {
                            let typeName = 'PollContinue';
                            let timeStamp = new Date().getTime()
                            let token = cookiePre.split('_checkout_queue_token')[1].split(';')[0]
                            // POLLING
                            while (typeName === 'PollContinue') {
                                if (new Date().getTime() - timeStamp >= 0) {
                                    const pollReq = await this.request.post({
                                        transform: this.includeHeaders,
                                        jar: this.cookieJar,
                                        url: `${this.website}/queue/poll`,
                                        headers: {
                                            'User-Agent': this.getUA(),
                                            'content-type': 'application/json',
                                            //'Poptls-Url': `${this.website}/queue/poll`
                                        },
                                        body: JSON.stringify({
                                            "query": "\n      {\n        poll(token: $token) {\n          token\n          pollAfter\n        }\n      }\n    ",
                                            "variables": {
                                                "token": token
                                            }
                                        })
                                    })
                                    const pollRes = JSON.parse(pollReq.body)
                                    typeName = pollRes.data.poll.__typename;
                                    timeStamp = new Date(pollRes.data.poll.pollAfter).getTime();
                                    token = pollRes.data.poll.token
                                    //console.log(typeName)
                                } else {
                                    await delay(timeStamp - new Date().getTime())
                                }
                            }
                            // COMPLETE QUEUE AND GET CHECKOUT URL
                            this.cookieJar.setCookie(`_checkout_queue_token=${token};path=/;max-age=3600;secure`, this.website)
                            function t(e) {
                                return decodeURIComponent(atob(e.replace(/_/g, "/").replace(/-/g, "+")).split("").map(function (e) {
                                    return "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2)
                                }).join(""))
                            }

                            const cookieAft = await logCookies(this.cookieJar)
                            const replayObject = JSON.parse(t(decodeURIComponent(cookieAft.split('_queue_replay_data=')[1].split(';')[0])))

                            if (replayObject.method === 'GET') {
                                this.urlReq = await this.request.get({
                                    url: replayObject.url,
                                    headers: {
                                        'User-Agent': this.getUA(),
                                        //'Poptls-Url': replayObject.url
                                    },
                                    transform: this.includeHeaders,
                                    jar: this.cookieJar
                                });
                                this.urlRes = this.urlReq.body;
                                this.finalUrl = this.urlReq.finalUrl;

                                if (this.urlRes.includes('authenticity_token')) {
                                    this.authToken = this.urlRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                                }
                            } else if (['PUT', 'PATCH', 'POST'].includes(replayObject.method)) {
                                let A = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
                                    return typeof e
                                } : function (e) {
                                    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
                                };

                                function w(r, e) {
                                    var o = 1 < arguments.length && e !== undefined ? arguments[1] : "";
                                    return Object.keys(r).reduce(function (e, t) {
                                        var n = "" + (o.length ? o + "[" : "") + t + (o.length ? "]" : "");
                                        return "object" !== A(r[t]) || Array.isArray(r[t]) ? e[n] = r[t] : Object.assign(e, w(r[t], n)), e
                                    }, {})
                                }
                                let k = function () {
                                    function n(e, t) {
                                        var n = [],
                                            r = true,
                                            o = false,
                                            a = undefined;
                                        try {
                                            for (var i, u = e[Symbol.iterator](); !(r = (i = u.next()).done) && (n.push(i.value), !t || n.length !== t); r = !0);
                                        } catch (l) {
                                            o = !0, a = l
                                        } finally {
                                            try {
                                                !r && u["return"] && u["return"]()
                                            } finally {
                                                if (o) throw a
                                            }
                                        }
                                        return n
                                    }
                                    return function (e, t) {
                                        if (Array.isArray(e)) return e;
                                        if (Symbol.iterator in Object(e)) return n(e, t);
                                        throw new TypeError("Invalid attempt to destructure non-iterable instance")
                                    }
                                }()
    
                                this.urlRes = urlReq.body;
                                this.finalUrl = urlReq.finalUrl;

                                if (this.urlRes.includes('authenticity_token')) {
                                    this.authToken = this.urlRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                                }

                                
                            }else {

                                urlReq = await this.request.get({
                                    url: `${this.website}/checkout`,
                                    headers: {
                                        'User-Agent': this.getUA(),
                                        //'Poptls-Url': `${this.website}/checkout`
                                    },
                                    transform: this.includeHeaders,
                                    jar: this.cookieJar
                                });
                                let urlResolve = urlReq.body;
                                this.finalUrlresolved = urlReq.finalUrl;

                                if (urlResolve.includes('authenticity_token')) {
                                    this.authToken = urlResolve.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                                }
                            }
                            

                        }else {
                            const queueURL = this.finalUrlresolved
                            let retryAfter = 0;
                            let status = 202;
                            let poll = 0
                            while (parseInt(status) !== 200) {
                                console.log(`Polling ${poll}`)
                                await delay(retryAfter)
                                let pollReq = await this.request.get({
                                    headers: {
                                        'User-Agent': this.getUA(),
                                        referer: queueURL,
                                        //'Poptls-Url': `${this.website}/checkout/poll?js_poll=1`
                                    },
                                    jar: this.cookieJar,
                                    transform: this.includeHeaders,
                                    url: `${this.website}/checkout/poll?js_poll=1`,
                                })
                                status = pollReq.status;
                                retryAfter = pollReq.headers['retry-after'] ? parseInt(pollReq.headers['retry-after']) * 1000 : 5000;
                                poll++
                            }

                            this.thisthing = await this.request.get({
                                headers: {
                                    'User-Agent': this.getUA(),
                                    referer: queueURL,
                                    //'Poptls-Url': queueURL
                                },
                                jar: this.cookieJar,
                                transform: this.includeHeaders,
                                url: queueURL,
                            })
                            //console.log(thisthing.finalUrl)
                            //console.log(thisthing.headers['retry-after'])
                            if (this.thisthing.headers['retry-after']) {
                                await delay(parseInt(thisthing.headers['retry-after']) * 1000)
                            }
                            if (this.thisthing.finalUrl.includes('throttle/queue')) {
                                this.ur = `${this.website}/checkout`
                                if (queueURL.split('?')[1]) {
                                    this.ur += `?${queueURL.split('?')[1]}`
                                }

                                this.getdata = await this.request.get({
                                    headers: {
                                        'User-Agent': this.getUA(),
                                        referer: this.finalUrl,
                                        connection: '',
                                        //'Poptls-Url':this.ur
                                    },
                                    transform: this.includeHeaders,
                                    url: this.ur,
                                    jar: this.cookieJar
                                })
                            }
                            this.res = this.getdata
                            this.checkouturl = this.getdata.finalUrl
                            if (this.res.includes('authenticity_token')) {
                                this.authToken = this.res.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                            }
                            this.firstStepCaptcha = false
                            this.siteKeyLocal = ''
                            if (res.includes('sitekey: "')) {
                                siteKeyLocal = this.res.split('sitekey: "')[1].split('"')[0]
                                this.firstStepCaptcha = true;
                            }
        
                        }
                    }catch(err){
                        console.log(err,'queue error')
                    }
                }


                try{
                    let getCheckoutInfo = await this.request.post({
                        headers: {
                            'User-Agent': this.getUA(),
                            'content-type': 'application/json; charset=UTF-8',
                            //'Poptls-Url': this.website + "/checkout.json"
                        },
                        url: this.website + "/checkout.json",
                        transform: this.includeHeaders,
                        jar: this.cookieJar,
                    })

                    let getApiToken = getCheckoutInfo.body
                    const $ = cheerio.load(getApiToken)
                    const apiToken = $("meta[name='shopify-checkout-api-token']").attr("content");
                    let Token = ''

                    if (getApiToken.includes('Shopify.Checkout.token')) {
                        Token = getApiToken.split('Shopify.Checkout.token')[1].split('"')[1].split('"')[0]
                    }
                    setTimeout(async () => {
                        let addressBody = `_method=patch&authenticity_token=${this.authToken}&previous_step=contact_information&`
                        addressBody += `step=shipping_method&checkout[email_or_phone]=${profile.email}&checkout[buyer_accepts_marketing]=0&checkout[shipping_address][first_name]=${profile.firstName}&checkout[shipping_address][last_name]=${profile.lastName}&checkout[shipping_address][address1]=${profile.address}&`
                        addressBody += `checkout[shipping_address][address2]=${profile.apt ? profile.apt : ''}&checkout[shipping_address][city]=${profile.city}&checkout[shipping_address][country]=${profile.country}&checkout[shipping_address][zip]=${profile.zipCode}&checkout[client_details][browser_width]=805&`
                        addressBody += `checkout[client_details][browser_height]=671&checkout[client_details][javascript_enabled]=1&checkout[client_details][color_depth]=30&checkout[client_details][java_enabled]=false&checkout[client_details][browser_tz]=0&checkout[email]=${profile.email}&checkout[shipping_address][phone]=${profile.phoneNumber}&checkout[remember_me]=0`;
                        /*if (this.firstStepCaptcha) {
                            console.log('firstStepCaptcha')
                            //DO CAPTCHA (siteKeyLocal HAS ALL THE STUFF YOU NEED)
                            //console.log(domain, siteKeyLocal)
                            const captchaToken = await this.getCaptcha(this.website, keys)
                            addressBody += `&g-recaptcha-response=${captchaToken}`
                        }*/
                        if (profile.state) {
                            addressBody += `&checkout[shipping_address][province]=${profile.state}`
                        }

                        console.log('Submitting Address')
                        try{
                            let addressReq = await this.request.patch({
                                headers: {
                                    authorization: "Basic  " + btoa(apiToken),
                                    'User-Agent': this.getUA(),
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    //'Poptls-Url': this.website + "/wallets/checkouts/" + Token + ".json"
                                },
                                transform: this.includeHeaders,
                                url: this.website + "/wallets/checkouts/" + Token + ".json",
                                jar: this.cookieJar,
                                followAllRedirects: true,
                                body: encodeURI(addressBody)
                            })
                            let addressRes = JSON.parse(addressReq.body)
                            this.lastURL = addressReq.finalUrl
                            this.lastHTML = addressRes

                        }catch(err){
                            console.log(err)
                        }

                        // console.log(addressRes)
                        // console.log(addressRes)
                        // if (addressRes.includes('There are no shipping methods available for your cart or address')) {
                        //     endRun('There are no shipping methods available for your cart or address')
                        // }
                        // console.log(addressReq.finalUrl)
                        
                        // authToken = ''
                        // if (addressRes.includes('authenticity_token')) {
                        //     authToken = addressRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                        // }
                        
                        let lastTotal = this.cartRes['discounted_price']
                        let validShipping = false;
                        let noNeed = false;
                        let shippingOptions = [];

                        console.log('Getting Shipping Info...')
                        
                        setTimeout(async () => {
                            while (!validShipping) {
                                await delay(250)
                                try {
                                    //GETS SHIPPING RATE 
                                    let shippingRequest = await this.request.get({
                                        headers: {
                                            authorization: "Basic  " + btoa(apiToken),
                                            'User-Agent': this.getUA(),
                                            //'Poptls-Url': `${this.website}/api/2020-10/checkouts/` + Token + "/shipping_rates.json"
                                        },
                                        transform: this.includeHeaders,
                                        jar: this.cookieJar,
                                        // url: `${domain}/cart/shipping_rates.json?shipping_address[zip]=${item.profile.zipCode}&shipping_address[country]=${item.profile.country}&shipping_address[province]=${item.profile.state}`
                                        url: `${this.website}/api/2020-10/checkouts/` + Token + "/shipping_rates.json",
                                    })
                                    // console.log(`${domain}/cart/shipping_rates.json?shipping_address[zip]=${item.profile.zipCode}&shipping_address[country]=${item.profile.country}&shipping_address[province]=${item.profile.state}`)

                                    const shippingResponse = JSON.parse(shippingRequest.body);
                                    // console.log(shippingResponse)
                                    if (shippingResponse['shipping_rates']) {
                                        validShipping = shippingResponse['shipping_rates'].length > 0
                                        shippingOptions = shippingResponse['shipping_rates'][0].id;
                                        // console.log(shippingOp)
                                    }

                                    lastMs = new Date().getTime()
                                } catch (err) {
                                    //CHECK IF SHIPPING IS REQUIRED
                                    if (err.message.includes("error")) {
                                        validShipping = true;
                                        noNeed = true;
                                    }
                                }
                            }
                            let bestShipping = {};
                            if (!noNeed) {
                                // bestShipping = shippingOptions.sort((a, b) => parseFloat(a.price) - [parseFloat(b.price)])[0]
                                // lastTotal = parseFloat(lastTotal) + parseFloat(bestShipping.price) * 100;
                                // const shippingId = ((bestShipping.source ? bestShipping.source + '-' : '') + bestShipping.code + "-" + bestShipping.price).split(' ').join('%20')
                                console.log('Submitting Shipping...')

                                let shipReq = await this.request.put({
                                    headers: {
                                        authorization: "Basic  " + btoa(apiToken),
                                        'User-Agent': this.getUA(),
                                        'Content-Type': 'application/json',
                                        //'Poptls-Url': this.website + "/api/2020-10/checkouts/" + Token + ".json"
                                        
                                    },
                                    transform: this.includeHeaders,
                                    url: this.website + "/api/2020-10/checkouts/" + Token + ".json",
                                    jar: this.cookieJar,
                                    followAllRedirects: true,
                                    form: {
                                        "checkout": {
                                            "token": Token,
                                            "shipping_line": {
                                                "handle": shippingOptions,
                                            }
                                        }
                                    }
                                })
                                let shipRes = shipReq.body;
                                // console.log(shipRes)

                                while (!shipRes.includes('data-gateway-name="credit_card"')) {
                                    await delay(500)
                                    shipReq = await this.request.get({
                                        url: `${this.finalUrl}?previous_step=shipping_method&step=payment_method`,
                                        transform: this.includeHeaders,
                                        headers: {
                                            'User-Agent': this.getUA(),
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                            //'Poptls-Url': `${this.finalUrl}?previous_step=shipping_method&step=payment_method`
                                        },
                                        jar: this.cookieJar
                                    })
                                    shipRes = shipReq.body
                                    if (!shipRes.includes('data-gateway-name="credit_card"') && shipRes.includes('data-select-gateway=')) {
                                        endRun('Paypal Only')
                                        return
                                    }
                                }
                                this.authToken = shipRes.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                                this.lastURL = shipReq.finalUrl
                                this.lastHTML = shipRes;
                            }
                            //VALUTS CARD
                            console.log('Vaulting Card Info...')
                            let vaultReq = await this.request.post({
                                headers: {
                                    'User-Agent': this.getUA(),
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    //'Poptls-Url': "https://deposit.us.shopifycs.com/sessions"
                                },
                                url: "https://deposit.us.shopifycs.com/sessions",
                                transform: this.includeHeaders,
                                form: {
                                    'credit_card': {
                                        month: parseInt(profile.expirationMonth),
                                        name: profile.nameOnCard,
                                        number: profile.cardNumber,
                                        verification_value: profile.cvv,
                                        year: parseInt("20" + `${profile.expirationYear}`)
                                    }
                                },
                                withCredentials: false
                            })
                            const vaultRes = JSON.parse(vaultReq.body)
                        
                            let authToken = this.lastHTML.split('authenticity_token')[1].split('value="')[1].split('"')[0]
                            // console.log(lastHTML.split('data-gateway-name="credit_card"')[1].split('data-select-gateway="')[1].split('"')[0])
                            if (parseInt(profile.delay) > 0) {
                                console.log('delay')
                            }
                            lastTotal = this.lastHTML.split('data-checkout-payment-due-target="')[1].split('"')[0]
                            setTimeout(async () => {
                                console.log('Processing Checkout...')
                                let paymentReq = await this.request.post({
                                    headers: {
                                        authorization: "Basic  " + btoa(apiToken),
                                        'User-Agent': this.getUA(),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        //'Poptls-Url': this.lastURL
                                    },
                                    transform: this.includeHeaders,
                                    url: this.lastURL,
                                    jar: this.cookieJar,
                                    // body: encodeURI(`_method=patch&authenticity_token=${authToken}&previous_step=payment_method&step=&s=${vaultRes.id}&checkout[payment_gateway]=${lastHTML.split('data-gateway-name="credit_card"')[1].split('data-select-gateway="')[1].split('"')[0]}&checkout[credit_card][vault]=false&checkout[different_billing_address]=false&checkout[remember_me]=0&checkout[total_price]=${lastTotal}&complete=1&checkout[client_details][browser_width]=1920&checkout[client_details][browser_height]=941&checkout[client_details][javascript_enabled]=1&checkout[client_details][color_depth]=24&checkout[client_details][java_enabled]=false&checkout[client_details][browser_tz]=-60`)
                                    form: {
                                        _method: "patch",
                                        authenticity_token: this.authToken,
                                        previous_step: "payment_method",
                                        step: "",
                                        s: vaultRes.id,
                                        "checkout[payment_gateway]": this.lastHTML.split('data-gateway-name="credit_card"')[1].split('data-select-gateway="')[1].split('"')[0],
                                        "checkout[credit_card][vault]": false,
                                        "checkout[different_billing_address]": false,
                                        "checkout[remember_me]": false,
                                        "checkout[remember_me]": false,
                                        complete: 1,
                                        "checkout[client_details][browser_width]": 943,
                                        "checkout[client_details][browser_height]": 969,
                                        "checkout[client_details][javascript_enabled]": 1,
                                        "checkout[client_details][color_depth]": 24,
                                        "checkout[client_details][java_enabled]": 0,
                                        "checkout[client_details][browser_tz]": 240
                                    }
                                })
                                //console.log(paymentReq.finalUrl)
                                let loops = 0;
                                while (loops < 10) {
                                    await delay(1000)
                                    console.log(`polling ${loops.toString()}`)
                                    let processReq = await this.request.get({
                                        headers: {
                                            'User-Agent': this.getUA(),
                                            //'Poptls-Url': this.lastURL.split('?')[0] + '/processing'
                                        },
                                        transform: this.includeHeaders,
                                        jar: this.cookieJar,
                                        //url: this.tlserver,
                                        url: this.lastURL.split('?')[0] + '/processing'
                                    })
                                    //console.log(processReq.finalUrl)
                                    if (processReq.finalUrl.includes('thank_you') || processReq.finalUrl.includes('orders')) {
                                        console.log('Success')
                                        /*
                                        if(this.sizeFound !=null){

                                            const hook = new Webhook(profile.hook);
                                            const embed = new MessageBuilder()
                                            .setTitle('Venom AIO Success')
                                            .addField('Product', this.sizeFound.name, true)
                                            .addField('Size', this.size.title)
                                            //.addField('Color', item.color)
                                            .setColor('#f49200')
                                            //.setThumbnail(imageURL)
                                            //setFooter('Venom AIO', 'https://cdn.discordapp.com/icons/815405941633056768/b4bb27e27d4b5d409fd6d75ea74c9597.png?size=256')
                                            .setTimestamp();
                                            
                                            hook.send(embed);
                                            return

                                        }else if(this.firstSizeAvaiable != null){
                                            const hook = new Webhook(profile.hook);
                                            const embed = new MessageBuilder()
                                            .setTitle('Venom AIO Success')
                                            .addField('Product', this.firstSizeAvaiable.name, true)
                                            .addField('Size', this.firstSizeAvaiable.title)
                                            //.addField('Color', item.color)
                                            .setColor('#f49200')
                                            //.setThumbnail(imageURL)
                                            //setFooter('Venom AIO', 'https://cdn.discordapp.com/icons/815405941633056768/b4bb27e27d4b5d409fd6d75ea74c9597.png?size=256')
                                            .setTimestamp();
                                            
                                            hook.send(embed);
                                            return
                                        }
                                        */
                                        
                                    }else {
                                            console.timeEnd();
                                            const htmlCont = processReq.body;
                                            if (htmlCont.includes('<p class="notice__text">')) {
                                                this.errormess = `${htmlCont.split('<p class="notice__text">')[1].split('</p>')[0]}`
                                                console.log(this.errormess)
                                                /*
                                                if(this.sizeFound !=null){

                                                    const hook = new Webhook(profile.hook);
                                                    const embed = new MessageBuilder()
                                                    .setTitle('Venom AIO Checkout Error')
                                                    .addField('Error', 'Card Declined!!!!')
                                                    .addField('Product', this.sizeFound.name, true)
                                                    .addField('Size', this.size.title)
                                                    //.addField('Color', item.color)
                                                    .setColor('#f49200')
                                                    .setThumbnail(this.prodInfo.image)
                                                    //setFooter('Venom AIO', 'https://cdn.discordapp.com/icons/815405941633056768/b4bb27e27d4b5d409fd6d75ea74c9597.png?size=256')
                                                    .setTimestamp();
                                                    
                                                    hook.send(embed);
                                                    return
        
                                                }else if(this.firstSizeAvaiable != null){
                                                    const hook = new Webhook(profile.hook);
                                                    const embed = new MessageBuilder()
                                                    .setTitle('Venom AIO Checkout Error')
                                                    .addField('Website', this.website)
                                                    .addField('Error', 'Card Declined!!!')
                                                    .addField('Product', this.firstSizeAvaiable.name, true)
                                                    .addField('Size', this.firstSizeAvaiable.title)
                                                    //.addField('Color', item.color)
                                                    .setColor('#f49200')
                                                    .setThumbnail(this.prodInfo.image)
                                                    //setFooter('Venom AIO', 'https://cdn.discordapp.com/icons/815405941633056768/b4bb27e27d4b5d409fd6d75ea74c9597.png?size=256')
                                                    .setTimestamp();
                                                    
                                                    hook.send(embed);
                                                    return
                                                }
                                                */
                                                        
                                            }
                                        }
                                    
                                    
                                    loops++
                                }
                            },profile.delay ? parseInt(profile.delay): 0);
                        },profile.delay ? parseInt(profile.delay): 0);
                    }, profile.delay ? parseInt(profile.delay): 0);
                    
                }catch(err){
                    console.log(err)
                }
            
            })

        }catch(error){
            console.log(error)
        }
    }
}   
let task1 = new ShopifyRequest('https://sneakerpolitics.com/collections/best-selling-new/products/air-jordan-1-retro-high-og-gorge-green-metallic-silver-white',"nike","yellow",'10')
//let task2 = new ShopifyRequest('https://kith.com/collections/mens-footwear/products/nkcw2288-001',"nike","yellow",'')
//let task3 = new ShopifyRequest('https://cncpts.com/collections/mens-sneakers/products/nike-waffle-one-da7995-600-active-fuchsia-university-gold-black',"nike","yellow",'')
//let task4 = new ShopifyRequest('https://www.a-ma-maniere.com/collections/new-sneakers/products/air-jordan-5-concord',"nike","yellow",'')
//let task5 = new ShopifyRequest('https://www.deadstock.ca/products/jordan-1-low-black-arctic-orange-1',"nike","yellow",'')
//let task6 = new ShopifyRequest('https://www.deadstock.ca/products/jordan-1-low-black-arctic-orange-1',"nike","yellow",'')
//let task7 = new ShopifyRequest('https://www.deadstock.ca/products/jordan-1-low-black-arctic-orange-1',"nike","yellow",'')
//task.checkout()
task1.checkout()