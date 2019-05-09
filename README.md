# Description

Library to get location from mobile networks information (MCC, MNC, LAC,
Cell ID) using Google, Yandex, OpenCellId, Mylnikov and Mozilla Location
Services.

In this new version library was completely rewritten in pure JavaScript with
Promises and no external dependencies.

All services now work fine, but for some of them you need API keys.


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
    apikey_opencellid: 'you should sign up on https://opencellid.org/ to get this',
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


Or you can explicitly choose services to get coordinates from:

```JavaScript
bs
    .all(mcc, mnc, lac, cellid, ['yandex', 'google', 'mylnikov', 'opencellid', 'mozilla'])
    .then(coords => {
        console.log(`All:`);
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => {
        console.log(`All ERROR:`);
        console.log(err);
    });
```

You can also specify weight of every service to calculate average coordinates
with respect of services accuracy.

In this example **Yandex** and **Google** are the most significant services in
average coordinates calculation, **Mylnikov.org** is the least significant and
**Mozilla Location Service** doesn't affects average coordinates at all:

```JavaScript
bs
    .all(mcc, mnc, lac, cellid,
            ['yandex', 'google', 'mylnikov', 'opencellid', 'mozilla'],
            {yandex: 1, google: 1, mylnikov: 0.2, opencellid: 0.5, mozilla: 0})
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
    // average coordinates from all services
    "average": {
        "lat": 54.54321,
        "lon": 23.12345
    },
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
    }
}
```


@license MIT \
@version 2.0.9 \
@author Alexander Russkiy <developer@xinit.ru>
