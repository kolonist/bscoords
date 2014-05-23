# Description

Library to get location from cellural networks information (MCC, MNC, LAC,
CellID) using Google location services, Yandex location services, OpenCellID and
Mozilla Location Service.


# Installation

You can install it with this command:

    npm install bscoords


# Usage

First require library:

    var bscoords = require('bscoords');

If you want to use OpenCellID service or set custom socket timeout, you should
initialize library:

    bscoords.init({
        // API key to use OpenCellID
        'openCellIDApiKey': 'you should reg on OpenCellID.org to get this',

        // socket timeout in milliseconds
        'timeout': 1000
    });


Then you should define callback function to get response:

    /**
     * Function to asynchronously run when data came.
     *
     * @param object err Error if something went wrong or null if request was
     *                   successfull.
     * @param object coords Key-value object with coordinates of requested cell.
     *                      If this is not yandex then it will be like this:
     *                      {
     *                          lat: '00.000000', // latitude
     *                          lon: '00.000000'  // longitude
     *                      }
     *                      In case of yandex, answer will be a bit different:
     *                      {
     *                          cell: {
     *                              lat: '00.000000', // latitude
     *                              lon: '00.000000'  // longitude
     *                          },
     *                          bs: {
     *                              lat: '00.000000', // latitude
     *                              lon: '00.000000'  // longitude
     *                          }
     *                      }
     */
    var onResponse = function(err, coords) {
        if (err == null) {

            // yandex request
            if (typeof coords.cell != 'undefined') {
                console.log('Cell: { lat: ' + coords.cell.lat + ', lon: ' + coords.cell.lon + ' }');
                console.log( 'BTS: { lat: ' + coords.bs.lat   + ', lon: ' + coords.bs.lon   + ' }');

            // everything but not yandex
            } else {
                console.log('Resp: { lat: ' + coords.lat + ', lon: ' + coords.lon + ' }');
            }
        }
    }


And then perform request the following way:

    // perform request
    bscoords.requestYandex(     mcc, mnc, lac, cellid, onResponse);
    bscoords.requestGoogle(     mcc, mnc, lac, cellid, onResponse);
    bscoords.requestOpenCellID( mcc, mnc, lac, cellid, onResponse);
    bscoords.requestMozLocation(mcc, mnc, lac, cellid, onResponse);


For Mozilla location sevice you should also use networkType parameter:

    // netType can be one of 'gsm', 'cdma', 'umts' or 'lte'. If not set then
    // 'gsm' used.
    bscoords.requestMozLocation(mcc, mnc, lac, cellid, netType, onResponse);


You can also use one request to get coordinates from all services at once:

    bscoords.request(mcc, mnc, lac, cellid, onResponse);


or

    bscoords.request(mcc, mnc, lac, cellid, netType, onResponse);


`netType` applies only to Mozilla Location Service. If `netType` is not set then
`'gsm'` is used.

The second parameter of onResponse callback function will be object with the
following structure:

    {
        google: {
            lat: 'latitude',
            lon: 'longitude'
        },

        // BTS coordinates
        yandex_bs: {
            lat: 'latitude',
            lon: 'longitude'
        },

        // coordinates of observer with requested LAC and CID
        yandex_cell: {
            lat: 'latitude',
            lon: 'longitude'
        },

        mozlocation: {
            lat: 'latitude',
            lon: 'longitude'
        },
        opencellid: {
            lat: 'latitude',
            lon: 'longitude'
        }
    }


You can also try well commented example in CoffeeScript `test.coffee` or just
look at `lib/bscoords.coffee` where all function parameters well documented.


If this lirary is useful for you and want it always stay actual you can:
- donate (more info: http://xinit.ru/donate/)
- comment, share, spread this library
- send issues, pull requests


@license Feel free to use or modify this lib as long as my @author tag remains in code (but you can add your as well)
@version 0.0.1
@author Alexander Zubakov <developer@xinit.ru>
