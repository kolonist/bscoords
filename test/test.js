'use strict';

const bs = require('../lib/bscoords');

const test_vector = [
    {
        mcc   : 257,
        mnc   : 1,
        lac   : 114,
        cellid: 1384
    },
    {
        mcc   : 372,
        mnc   : 1,
        lac   : 2300,
        cellid: 33250
    },
];

const services = [
      'google'
    , 'yandex'
    , 'opencellid'
    , 'mylnikov'
    , 'mozilla'
];

for (const service of services) {
    for (const {mcc, mnc, lac, cellid} of test_vector) {
        bs[service](mcc, mnc, lac, cellid)
            .then(coords => {
                console.log(`${service}:`);
                console.log(JSON.stringify(coords, null, 4));
            })
            .catch(err => {
                console.log(`${service} ERROR:`);
                console.log(err);
            });
    }
}

/*
bs
    .all(mcc, mnc, lac, cellid, ['yandex', 'mylnikov', 'google', 'opencellid', 'mozilla'])
    .then(coords => {
        console.log(`All:`);
        console.log(JSON.stringify(coords, null, 4));
    })
    .catch(err => {
        console.log(`All ERROR:`);
        console.log(err);
    });
*/
