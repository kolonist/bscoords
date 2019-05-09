'use strict'

const https = require('https');

// reg expression to fetch coordinates from yandex response
const RE_FETCH_YANDEX_LAT  = /\slatitude="([\d\.-]+)"/i;
const RE_FETCH_YANDEX_LON  = /\slongitude="([\d\.-]+)"/i;
const RE_FETCH_YANDEX_NLAT = /\snlatitude="([\d\.-]+)"/i;
const RE_FETCH_YANDEX_NLON = /\snlongitude="([\d\.-]+)"/i;

// error answer in yandex response
const RE_YANDEX_ERROR = /error/i;


// API keys
let API_KEY_MYLNIKOV   = '';
let API_KEY_OPENCELLID = '';
let API_KEY_MOZILLA    = 'test';

// Connection timeout, ms
let CONNECTION_TIMEOUT = 3000;

// error messages
const E_NOTFOUND = 'BTS not found';
const E_REQERROR = 'Request error';

// map services names to corresponding request functions
const SERVICES = {
    'yandex'    : null,
    'google'    : null,
    'mylnikov'  : null,
    'opencellid': null,
    'mozilla'   : null
};


/**
 * Initialize library with API keys for Mylnikov location service, Mozilla
 * Location Service and OpenCellId and connection timeout in milliseconds for
 * network requests.
 *
 * If you use only Yandex and Google you probably don't need to call this
 * function.
 *
 * @param {object} options Object with the following structure (with default
 *                         values): {
 *                             apikey_mylnikov  : '',
 *                             apikey_opencellid: '',
 *                             apikey_mozilla   : 'test',
 *                             timeout          : 3000
 *                         }
 */
const init = options => {
    API_KEY_MYLNIKOV   = options.apikey_mylnikov   || API_KEY_MYLNIKOV;
    API_KEY_OPENCELLID = options.apikey_opencellid || API_KEY_OPENCELLID;
    API_KEY_MOZILLA    = options.apikey_mozilla    || API_KEY_MOZILLA;

    CONNECTION_TIMEOUT = options.timeout || CONNECTION_TIMEOUT;
};


/**
 * Perform request to Location Service.
 *
 * @param {object} options Node.js HTTPS request options.
 * @param {*} request_body Request body for POST requests. Can be String or
 *                         Buffer. If you do not need it you can pass null or
 *                         empty string ''.
 * @param {*} response_encoding Can be 'utf8' or 'hex' (for Google response).
 * @param {*} response_parser Callback function(response) where `response` is
 *                            String with data from Location server. Callback
 *                            function should return object like
 *                            `{lat: 23.12345, lon: 50.12345}` or null if there
 *                            are no coordinates in the answer.
 */
const request = (options, request_body, response_encoding, response_parser) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            res.setEncoding(response_encoding);

            // pick data
            let buf = '';
            res.on('data', chunk => buf += chunk);

            // all data came
            res.on('end', () => {
                const coords = response_parser(buf);

                if (coords !== null) {
                    return resolve(coords);
                } else {
                    return reject(new Error(E_NOTFOUND));
                }
            });
        });

        req.on('socket', socket => {
            socket.setTimeout(CONNECTION_TIMEOUT, () => req.abort());
        });

        req.on('error', err => reject(new Error(E_REQERROR)));

        if (options.method === 'POST' && request_body !== null && request_body !== '') {
            req.write(request_body);
        }

        req.end();
    });
};


/**
 * Get BS geographical coordinates from yandex.ru.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @return {Promise} Promise resolves with coordinates object in the form of
 *                   {lat: 23.12345, lon: 54.54321}.
 */
SERVICES['yandex'] = (countrycode, operatorid, lac, cellid) => {
    // Example:
    // http://mobile.maps.yandex.net/cellid_location/?&cellid=49973&operatorid=99&countrycode=250&lac=13955
    const options = {
        hostname: 'mobile.maps.yandex.net',
        method  : 'GET',
        path    : `/cellid_location/?countrycode=${countrycode}&operatorid=${operatorid}&lac=${lac}&cellid=${cellid}`
    };

    const request_body = null;
    const response_encoding = 'utf8';

    const response_parser = buf => {
        if (RE_YANDEX_ERROR.test(buf)) {
            return null;
        }

        const coords = {
            lat: Number(RE_FETCH_YANDEX_LAT.exec(buf)[1]),
            lon: Number(RE_FETCH_YANDEX_LON.exec(buf)[1])
        };

        return coords;
    };

    return request(options, request_body, response_encoding, response_parser);
};


/**
 * Get BS geographical coordinates from google.com.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @return {Promise} Promise resolves with coordinates object in the form of
 *                   {lat: 23.12345, lon: 54.54321}.
 */
SERVICES['google'] = (countrycode, operatorid, lac, cellid) => {
    // Example:
    // http://www.google.com/glm/mmap
    const options = {
        hostname: 'www.google.com',
        method  : 'POST',
        path    : '/glm/mmap'
    };

    const request_body = Buffer.from(
        '000e00000000000000000000000000001b0000000000000000000000030000' +
        ('00000000' + Number(cellid     ).toString(16)).substr(-8) +
        ('00000000' + Number(lac        ).toString(16)).substr(-8) +
        ('00000000' + Number(operatorid ).toString(16)).substr(-8) +
        ('00000000' + Number(countrycode).toString(16)).substr(-8) +
        'ffffffff00000000',
        'hex'
    );

    const response_encoding = 'hex';


    /**
     * Convert 32-bit hex string into signed integer.
     * @param {String} hex Hex string like 'fab1c2d3'.
     */
    const hex2int = hex => {
        let int = parseInt(hex, 16);

        // negative number
        if ((int & 0x80000000) !== 0) {
            int = int - 0x100000000;
        }

        return int;
    };


    const response_parser = buf => {
        try {
            if (buf.length < 30) {
                return null;
            }

            const coords = {
                lat: hex2int(buf.slice(14, 22)) / 1000000,
                lon: hex2int(buf.slice(22, 30)) / 1000000
            };

            if (coords.lat === 0 && coords.lon === 0) {
                return null;
            }

            return coords;
        } catch(err) {
            return null;
        }
    };

    return request(options, request_body, response_encoding, response_parser);
};


/**
 * Get BS geographical coordinates from mylnikov.org.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @return {Promise} Promise resolves with coordinates object in the form of
 *                   {lat: 23.12345, lon: 54.54321}.
 */
SERVICES['mylnikov'] = (countrycode, operatorid, lac, cellid) => {
    // Example:
    // https://api.mylnikov.org/geolocation/cell?v=1.1&data=open&key=apikey&mcc=250&mnc=2&lac=7840&cellid=200719106
    const options = {
        hostname: 'api.mylnikov.org',
        method  : 'GET',
        path    : `/geolocation/cell?v=1.1&data=open&key=${API_KEY_MYLNIKOV}&cellid=${cellid}&mnc=${operatorid}&mcc=${countrycode}&lac=${lac}`
    };

    const request_body = null;
    const response_encoding = 'utf8';

    const response_parser = buf => {
        try {
            const response = JSON.parse(buf);
            if (response.result && response.result == 200) {
                const coords = {
                    lat: response.data.lat,
                    lon: response.data.lon
                };

                return coords;
            } else {
                return null;
            }
        } catch(err) {
            return null;
        }
    };

    return request(options, request_body, response_encoding, response_parser);
};


/**
 * Get BS geographical coordinates from mylnikov.org.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @return {Promise} Promise resolves with coordinates object in the form of
 *                   {lat: 23.12345, lon: 54.54321}.
 */
SERVICES['opencellid'] = (countrycode, operatorid, lac, cellid) => {
    // Example:
    // http://opencellid.org/cell/get?key=apikey&mnc=99&mcc=250&lac=13952&cellid=49983
    const options = {
        hostname: 'us1.unwiredlabs.com',
        method  : 'POST',
        path    : '/v2/process.php'
    };


    const request_body = JSON.stringify({
        token: API_KEY_OPENCELLID,
        mcc: countrycode,
        mnc: operatorid,
        cells: [{
            lac: lac,
            cid: cellid
        }]
    });
    const response_encoding = 'utf8';

    const response_parser = buf => {
        try {
            const answer = JSON.parse(buf);

            if (answer.status === 'error') {
                return null;
            }

            const coords = {
                lat: answer.lat,
                lon: answer.lon
            };

            return coords;
        } catch(err) {
            return null;
        }
    };

    return request(options, request_body, response_encoding, response_parser);
};


/**
 * Get BS geographical coordinates from Mozilla Geolocation Service.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @return {Promise} Promise resolves with coordinates object in the form of
 *                   {lat: 23.12345, lon: 54.54321}.
 */
SERVICES['mozilla'] = (countrycode, operatorid, lac, cellid) => {
    // Example:
    // https://location.services.mozilla.com/v1/geolocate
    const options = {
        hostname: 'location.services.mozilla.com',
        method  : 'POST',
        path    : `/v1/geolocate?key=${API_KEY_MOZILLA}`,
        headers : {
            'Content-Type': 'application/json'
        }
    };

    const request_body = JSON.stringify({
        cellTowers: [
            {
                mobileCountryCode: countrycode,
                mobileNetworkCode: operatorid,
                locationAreaCode : lac,
                cellId           : cellid
            }
        ]
    });

    const response_encoding = 'utf8';

    const response_parser = buf => {
        try {
            const response = JSON.parse(buf);

            if (response.error) {
                return null;
            }

            const coords = {
                lat: response.location.lat,
                lon: response.location.lng
            };

            return coords;
        } catch(err) {
            return null;
        }
    };

    return request(options, request_body, response_encoding, response_parser);
};


/**
 * Get BS geographical coordinates from all accessible Geolocation Services in
 * one function.
 *
 * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
 * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
 *                            MTS, 02 for Megafon, 20 for Tele2.
 * @param {Number} lac Location area code in decimal.
 * @param {Number} cellid Cell ID in decimal.
 * @param {Array} services Array of strings with names of services to request.
 *                         By default all possible services will be requested
 *                         but you can list only serveces you need. Names of
 *                         services could be 'yandex', 'google', 'mylnikov',
 *                         'opencellid', 'mozilla'.
 * @param {Object} weights Object contains weight coefficients for services to
 *                         calculate average point. Default is {
 *                             yandex: 1,
 *                             google: 1,
 *                             mylnikov: 1,
 *                             opencellid: 1,
 *                             mozilla: 1
 *                         } that means that all services are equal. But in
 *                       reality you should use weights because services
 *                       accuracy widely vary.
 * @return {Promise} Promise resolves in object with coordinates in the form of
 *                   {
 *                       average   : {lat: 23.12345, lon: 54.54321},
 *                       yandex    : {lat: 23.12345, lon: 54.54321},
 *                       google    : {lat: 23.12345, lon: 54.54321},
 *                       mylnikov  : {lat: 23.12345, lon: 54.54321},
 *                       opencellid: {lat: 23.12345, lon: 54.54321},
 *                       mozilla   : {lat: 23.12345, lon: 54.54321}
 *                   }.
 */
const requestAll = (countrycode, operatorid, lac, cellid,
                    services = [
                        'yandex', 'google', 'mylnikov', 'opencellid', 'mozilla'
                    ],
                    weights = {
                        yandex: 1, google: 1, mylnikov: 1, opencellid: 1, mozilla: 1
                    }) => {
    return new Promise((resolve, reject) => {
        const requests = services.map(service => {
            if (SERVICES[service]) {
                return SERVICES[service](countrycode, operatorid, lac, cellid)
                    .then(res => res)
                    .catch(err => null);
            } else {
                return Promise.resolve(null);
            }
        });

        Promise
            .all(requests)
            .then(res => {
                // calculate center of all that points
                let count = 0;
                let av_lat   = 0;
                let av_lon   = 0;

                for (let i = 0; i < res.length; i++) {
                    if (res[i] !== null) {
                        count += weights[services[i]];
                        av_lat += res[i].lat * weights[services[i]];
                        av_lon += res[i].lon * weights[services[i]];
                    }
                }

                let average = null;
                if (count !== 0) {
                    av_lat = av_lat / count;
                    av_lon = av_lon / count;

                    average = { lat: av_lat, lon: av_lon };
                }

                // form result object
                const result = {
                    'average': average
                };

                res.forEach((coords, index) => {
                    result[services[index]] = coords;
                });

                return resolve(result);
            });
    });
};


exports.init = init;

exports.yandex     = SERVICES['yandex'];
exports.google     = SERVICES['google'];
exports.mylnikov   = SERVICES['mylnikov'];
exports.opencellid = SERVICES['opencellid'];
exports.mozilla    = SERVICES['mozilla'];
exports.all        = requestAll;
