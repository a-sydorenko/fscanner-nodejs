
# FScanner client
FScanner is a service that scans traffic for fraud.

### Installation

```bash
$ npm install --save fscanner-client
```

### How to implement this module in the NodeJS backend

```javascript
const Client = require('fscanner-client')
const client = new Client({
    id: 111, // customer's client id
    key: 'encryption key',
    host: 'fscanner.com'
})

// for more details see client.js 'stringifyParams' function description
function prepareDataExampleFunction () {
    return {
        ifa: '',
        app: 1,
        pub_id: 555,
        inv: 'some.application.bundle',
        inv_id: 'ad37geiq3egqwe',
        pt: 'banner',
        src: 'bought through ssp1',
        ip: '192.168.1.100',
        ssp_id: '0',
        dsp_id: '12443',
        bought: 2.33,
        sold: 2.89,
        ua: 'some ua string',
        country: 'usa',
        js: 1,
        event: 1,
        ac: 0
    }
}

function someBidRequestHandler (adm, someOptions, ...otherArgs) {
    // ... 
    const data = prepareDataExampleFunction(someOptions)
    
    // append script tag (recommended)
    const { clickId, ii, tag } = client.getImpressionImageTag(data)
    
    // or append image tag (not recommended)
    // const { clickId, ii, tag } = client.getImpressionScriptTag(data)
    
    adm += tag
    
    // to get click pixel
    const clickPixel = client.getClickPixelUrl(ii, clickId)
    
    // ii (impression identifier) must be the same as for impression as for click
    // ... 
}
```
