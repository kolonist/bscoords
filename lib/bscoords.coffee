'use strict'
http   = require 'http'
https  = require 'https'
events = require 'events'


# reg expression to fetch coordinates from yandex.response
reFetchYandexLat  = /\slatitude="([+\-\d\.]+)"/i
reFetchYandexLon  = /\slongitude="([+\-\d\.]+)"/i
reFetchYandexNlat = /\snlatitude="([+\-\d\.]+)"/i
reFetchYandexNlon = /\snlongitude="([+\-\d\.]+)"/i

# error answer
reYandexError = /error/i

# reg expression to fetch coordinates from OpenCellId
reFetchOpenCidLat  = /\slat="([+\-\d\.]+)"/i
reFetchOpenCidLon  = /\slon="([+\-\d\.]+)"/i

# error answer
reOpenCidError = /err\s+info="[^"]+"\s+code="/i


# Connection timeout, ms
connTimeout = 3000


# OpenCellID API key
openCellIDApiKey = null

# Mozilla Location API key, random string
mozLocationApiKey = (Math.random().toString(36)[2..] for i in [0..2]).join('')[0..31]


# Error messages
E_NOTFOUND = 'Not found'
E_REQERROR = 'Request error'


# Initialization. You need it only if you plan to use OpenCellID. In future it
# can be necessary to use it also with Mozilla Location Service, but not now.
#
# @param object conf Object with the following keys:
#                    {
#                        openCellIDApiKey : '',  // required
#                        mozLocationApiKey: '',  // optional, default is random string
#                        timeout          : 3000 // connection timeout in milliseconds, default is 3000
#                    }
#
init = (conf) ->
    openCellIDApiKey  = conf.openCellIDApiKey  ? openCellIDApiKey
    mozLocationApiKey = conf.mozLocationApiKey ? mozLocationApiKey
    connTimeout       = conf.timeout ? connTimeout


# Get BS geographical coordinates from yandex.ru.
#
# @param Number countrycode First 3 digits of IMSI. 250 for Russia.
# @param Number operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
#                          MTS, 02 for Megafon, 20 for Tele2.
# @param Number lac Location area code in decimal.
# @param Number cellid Cell ID in decimal.
# @param callback onComplete Function(err, coords) with coords parameter -
#                            object like this:
#                            {
#                                cell: {
#                                    lat: '',
#                                    lon: ''
#                                },
#                                bs: {
#                                    lat: '',
#                                    lon: ''
#                                }
#                            }
#
requestYandex = (countrycode, operatorid, lac, cellid, onComplete) ->
    #Example:
    #http://mobile.maps.yandex.net/cellid_location/?&cellid=49973&operatorid=99&countrycode=250&lac=13955
    options =
        hostname: "mobile.maps.yandex.net"
        port    : 80
        method  : "GET"
        path    : "/cellid_location/?&cellid=#{cellid}&operatorid=#{operatorid}&countrycode=#{countrycode}&lac=#{lac}"

    req = http.request options, (res) ->
        res.setEncoding 'utf8'

        #pick data
        response = ''
        res.on 'data', (chunk) ->
            response += chunk

        #all data came
        res.on 'end', () ->
            try
                if reYandexError.test(response)
                    onComplete new Error(E_NOTFOUND), null
                else
                    onComplete null, {
                        cell:
                            lat: Number(reFetchYandexLat.exec(response)[1])
                            lon: Number(reFetchYandexLon.exec(response)[1])
                        bs:
                            lat: Number(reFetchYandexNlat.exec(response)[1])
                            lon: Number(reFetchYandexNlon.exec(response)[1])
                    }
            catch err
                onComplete new Error(E_REQERROR), null

    req.on 'socket', (socket) ->
        socket.setTimeout connTimeout, -> req.abort()

    req.on 'error', (err) ->
        onComplete new Error(E_REQERROR), null

    req.end()


# Get BS geographical coordinates from google.com.
#
# @param Number countrycode First 3 digits of IMSI. 250 for Russia.
# @param Number operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
#                          MTS, 02 for Megafon, 20 for Tele2.
# @param Number lac Location area code in decimal.
# @param Number cellid Cell ID in decimal.
# @param callback onComplete Function(err, coords) with coords parameter -
#                            object with lat and lon fields.
#
requestGoogle = (countrycode, operatorid, lac, cellid, onComplete) ->
    # create POST request to http://www.google.com/glm/mmap
    options =
        hostname: "www.google.com"
        port    : 80
        method  : "POST"
        path    : "/glm/mmap"

    req = http.request options, (res) ->
        res.setEncoding 'hex'

        # pick data
        response = ''
        res.on 'data', (chunk) ->
            response += chunk

        # all data came
        res.on 'end', () ->
            try
                if response.length < 30
                    onComplete new Error(E_NOTFOUND), null
                else
                    onComplete null, {
                        lat: (~~parseInt(response[14...22], 16)) / 1000000
                        lon: (~~parseInt(response[22...30], 16)) / 1000000
                    }
            catch err
                onComplete new Error(E_REQERROR), null

    # create binary request to google.com
    request = '000e00000000000000000000000000001b0000000000000000000000030000'
    request += ('00000000' + Number(cellid).toString(16)     ).substr(-8)
    request += ('00000000' + Number(lac).toString(16)        ).substr(-8)
    request += ('00000000' + Number(operatorid).toString(16) ).substr(-8)
    request += ('00000000' + Number(countrycode).toString(16)).substr(-8)
    request += 'ffffffff00000000'

    req.on 'socket', (socket) ->
        socket.setTimeout connTimeout, -> req.abort()

    req.on 'error', (err) ->
        onComplete new Error(E_REQERROR), null

    # req.end request, 'hex'
    req.end new Buffer(request, 'hex')


# Get BS geographical coordinates from opencellid.org
#
# @param Number countrycode First 3 digits of IMSI. 250 for Russia.
# @param Number operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
#                          MTS, 02 for Megafon, 20 for Tele2.
# @param Number lac Location area code in decimal.
# @param Number cellid Cell ID in decimal.
# @param callback onComplete Function(err, coords) with coords parameter -
#                            object with lat and lon fields.
#
requestOpenCellID = (countrycode, operatorid, lac, cellid, onComplete) ->
    if openCellIDApiKey?
        # Example:
        # http://opencellid.org/cell/get?key=#{openCellIDApiKey}&mnc=99&mcc=250&lac=13952&cellid=49983
        options =
            hostname: 'opencellid.org'
            port    : 80
            method  : 'GET'
            path    : "/cell/get?key=#{openCellIDApiKey}&mnc=#{operatorid}&mcc=#{countrycode}&lac=#{lac}&cellid=#{cellid}"

        req = http.request options, (res) ->
            res.setEncoding 'utf8'

            # pick data
            response = ''
            res.on 'data', (chunk) ->
                response += chunk

            # all data came
            res.on 'end', () ->
                try
                    if reOpenCidError.test(response)
                        onComplete new Error(E_NOTFOUND), null
                    else
                        onComplete null, {
                            lat: Number(reFetchOpenCidLat.exec(response)[1])
                            lon: Number(reFetchOpenCidLon.exec(response)[1])
                        }
                catch err
                    onComplete new Error(E_REQERROR), null

        req.on 'socket', (socket) ->
            socket.setTimeout connTimeout, -> req.abort()

        req.on 'error', (err) ->
            onComplete new Error(E_REQERROR), null

        req.end()
    else
        onComplete new Error(), null


# Get BS geographical coordinates from location.services.mozilla.com
#
# @param Number countrycode First 3 digits of IMSI. 250 for Russia.
# @param Number operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
#                          MTS, 02 for Megafon, 20 for Tele2.
# @param Number lac Location area code in decimal.
# @param Number cellid Cell ID in decimal.
# @param string networkType If present then should be one of 'gsm', 'cdma',
#                           'umts', 'lte'. Default is 'gsm'.
# @param callback onComplete Function(err, coords) with coords parameter -
#                            object with lat and lon fields.
#
requestMozLocation = (countrycode, operatorid, lac, cellid, networkType, onComplete) ->
    if not onComplete?
        onComplete = networkType
        networkType = 'gsm'

    if ['gsm', 'cdma', 'umts', 'lte'].indexOf(networkType) is -1
        networkType = 'gsm'

    # Example:
    # https://location.services.mozilla.com/v1/search?key=#{mozLocationApiKey}
    options =
        hostname: 'location.services.mozilla.com'
        port    : 443
        method  : 'POST'
        path    : "/v1/search?key=#{mozLocationApiKey}"
        headers :
            'Content-Type': 'application/json'

    requestBody = JSON.stringify
        'cell': [
            'radio': networkType
            'cid'  : cellid
            'lac'  : lac
            'mcc'  : countrycode
            'mnc'  : operatorid
        ]

    req = https.request options, (res) ->
        res.setEncoding 'utf8'

        # pick data
        response = ''
        res.on 'data', (chunk) ->
            response += chunk

        # all data came
        res.on 'end', () ->
            try
                response = JSON.parse response
                if response.status? and response.status is 'ok'
                    onComplete null, {
                        lat: response.lat
                        lon: response.lon
                    }
                else
                    onComplete new Error(E_NOTFOUND), null
            catch err
                onComplete new Error(E_REQERROR), null

    req.on 'socket', (socket) ->
        socket.setTimeout connTimeout, -> req.abort()

    req.on 'error', (err) ->
        onComplete new Error(E_REQERROR), null

    req.write requestBody
    req.end()


# Get BS geographical coordinates from Google, Yandex, Mozilla Location Service
# and OpenCellID in one function.
#
# @param Number countrycode First 3 digits of IMSI. 250 for Russia.
# @param Number operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
#                          MTS, 02 for Megafon, 20 for Tele2.
# @param Number lac Location area code in decimal.
# @param Number cellid Cell ID in decimal.
# @param string networkType If present then should be one of 'gsm', 'cdma',
#                           'umts', 'lte'. Default is 'gsm'.
# @param callback onComplete Function(err, coords) with coords parameter -
#                            object with the following fields: {
#                                google: {
#                                    lat: 'latitude',
#                                    lon: 'longitude'
#                                },
#                                yandex_bs: {
#                                    lat: 'latitude',
#                                    lon: 'longitude'
#                                },
#                                yandex_cell: {
#                                    lat: 'latitude',
#                                    lon: 'longitude'
#                                },
#                                mozlocation: {
#                                    lat: 'latitude',
#                                    lon: 'longitude'
#                                },
#                                opencellid: {
#                                    lat: 'latitude',
#                                    lon: 'longitude'
#                                }
#                            }
#
request = (countrycode, operatorid, lac, cellid, networkType, onComplete) ->
    if not onComplete?
        onComplete = networkType
        networkType = 'gsm'

    if ['gsm', 'cdma', 'umts', 'lte'].indexOf(networkType) is -1
        networkType = 'gsm'

    # need this to execute requests in parallel mode
    emitter = new events.EventEmitter()

    # show that data came from OpenCellID, Google and Yandex
    dataCame = 0

    # full coordinates
    fullCoords = {}

    # error
    fullErr = null


    # get coords from Google
    requestGoogle countrycode, operatorid, lac, cellid, (err, coords) ->
        if err?
            fullErr ?= {}
            fullErr.google = err

        fullCoords.google = coords
        dataCame++
        emitter.emit 'coords'

    # get coords from Yandex
    requestYandex countrycode, operatorid, lac, cellid, (err, coords) ->
        if err?
            fullErr ?= {}
            fullErr.yandex = err

        fullCoords.yandex_bs   = coords?.bs   or null
        fullCoords.yandex_cell = coords?.cell or null
        dataCame++
        emitter.emit 'coords'

    # get coords from OpenCellID
    requestOpenCellID countrycode, operatorid, lac, cellid, (err, coords) ->
        if err?
            fullErr ?= {}
            fullErr.opencellid = err

        fullCoords.opencellid = coords
        dataCame++
        emitter.emit 'coords'

    # get coords from Mozilla Location Service
    requestMozLocation countrycode, operatorid, lac, cellid, networkType, (err, coords) ->
        if err?
            fullErr ?= {}
            fullErr.mozlocation = err

        fullCoords.mozlocation = coords
        dataCame++
        emitter.emit 'coords'

    # when we get coords from each system we emit 'coords' event
    emitter.on 'coords', ->
        if dataCame >= 4 then onComplete(fullErr, fullCoords)


exports.init               = init
exports.requestYandex      = requestYandex
exports.requestGoogle      = requestGoogle
exports.requestOpenCellID  = requestOpenCellID
exports.requestMozLocation = requestMozLocation
exports.request            = request
