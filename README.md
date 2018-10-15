# Description

Library to get location from cellural networks information (MCC, MNC, LAC,
Cell ID) using Google location services, Yandex location services, OpenCellID,
Mylnikov Geo and Mozilla Location Service.


# Installation

You can install it with this command:

    npm install bscoords


# Usage

First require library:

```JavaScript
const bscoords = require('bscoords');
```

If you want to use OpenCellId, Mozilla Location Service or set custom socket
timeout, you should initialize library before using:

```JavaScript
bscoords.init({
    // API keys
    apikey_mylnikov  : '', // nicely works even without API key
    apikey_opencellid: 'you should reg on https://opencellid.org/ to get this',
    apikey_mozilla   : 'you should request it at Mozilla',

    // socket timeout in milliseconds (default is 3000)
    'timeout': 3000
});
```


Then perform requests the following way:

```JavaScript
bs
    .yandex(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => console.log(err));

bs
    .google(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => console.log(err));

bs
    .opencellid(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => console.log(err));

bs
    .mylnikov(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => console.log(err));

bs
    .mozilla(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => console.log(err));

// result of every call will be like this:
// {
//     "lat": 54.54321,
//     "lon": 23.12345
// }
```


You can also use one request to get coordinates from all services at once:

```JavaScript
bs
    .all(mcc, mnc, lac, cellid)
    .then(coords => {
        console.log(`All:`);
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => {
        console.log(`All ERROR:`);
        console.log(err);
    });
```


Result will be object with the following structure:

```JavaScript
{
    "yandex": {
        "lat": 54.54321,
        "lon": 23.12345
    },
    "google": {
        "lat": 54.54321,
        "lon": 23.12345
    },
    "mylnikov": {
        "lat": 54.54321,
        "lon": 23.12345
    },
    "opencellid": null, // no coordinates got from this service
    "mozilla": {
        "lat": 54.54321,
        "lon": 23.12345
    },

    // average coordinates from all services
    "average": {
        "lat": 54.54321,
        "lon": 23.12345
    }
}
```


@license MIT
@version 2.0.1
@author Alexander Zubakov <developer@xinit.ru>
