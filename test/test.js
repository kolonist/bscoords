'use strict';

const bs = require('../lib/bscoords');

let mcc    = 257;
let mnc    = 1;
let lac    = 114;
let cellid = 1384;

const services = [
      'google'
    , 'yandex'
    , 'opencellid'
    , 'mylnikov'
    , 'mozilla'
];

for (const service of services) {
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
