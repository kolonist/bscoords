'use strict'

# additional modules
assert = require 'assert'

# require tested module
bscoords = require './lib/bscoords'


# test data
vectors = [
    {
        req: { mcc: '257', mnc: '01', lac: '114', cid: '1384', net: 'gsm' }
        res:
            google     : { success: yes }
            yandex_bs  : { success: yes }
            yandex_cell: { success: yes }
            opencellid : { success: yes }
            mozlocation: { success: yes }
    }

    {
        req: { mcc: '250', mnc: '99', lac: '13954', cid: '49373', net: 'gsm' }
        res:
            google     : { success: yes }
            yandex_bs  : { success: yes }
            yandex_cell: { success: yes }
            opencellid : { success: no  }
            mozlocation: { success: no  }
    }

    {
        req: { mcc: '250', mnc: '02', lac: '3901', cid: '12518', net: 'gsm' }
        res:
            google     : { success: yes }
            yandex_bs  : { success: no  }
            yandex_cell: { success: no  }
            opencellid : { success: no  }
            mozlocation: { success: no  }
    }

    {
        req: { mcc: '250', mnc: '01', lac: '3971', cid: '41254', net: 'gsm' }
        res:
            google     : { success: no }
            yandex_bs  : { success: no }
            yandex_cell: { success: no }
            opencellid : { success: no }
            mozlocation: { success: no }
    }
]


# init (need to use OpenCellID)
bscoords.init
    openCellIDApiKey: 'insert your own'

    # socket timeout
    timeout: 5000


# run test vectors every 3 seconds
i = 0
t = setInterval(
    ->
        ii = i++

        # perform request
        bscoords.request(
            vectors[ii].req.mcc,
            vectors[ii].req.mnc,
            vectors[ii].req.lac,
            vectors[ii].req.cid,
            vectors[ii].req.net,

            # response
            (err, coords) ->
                console.log """
                    Test vector ##{ii}

                    Request:
                        MCC: #{vectors[ii].req.mcc}
                        MNC: #{vectors[ii].req.mnc}
                        LAC: #{vectors[ii].req.lac}
                        CID: #{vectors[ii].req.cid}
                        Net: #{vectors[ii].req.net}

                    Response:
                        Google     : (#{coords.google?.lat     }, #{coords.google?.lon     }); Error: #{err?.google?.message     }
                        Yandex BS  : (#{coords.yandex_bs?.lat  }, #{coords.yandex_bs?.lon  }); Error: #{err?.yandex?.message     }
                        Yandex Cell: (#{coords.yandex_cell?.lat}, #{coords.yandex_cell?.lon}); Error: #{err?.yandex?.message     }
                        OpenCellID : (#{coords.opencellid?.lat }, #{coords.opencellid?.lon }); Error: #{err?.opencellid?.message }
                        mozLocation: (#{coords.mozlocation?.lat}, #{coords.mozlocation?.lon}); Error: #{err?.mozlocation?.message}

                    --------------------------------------------------

                """

                for prov, testResult of vectors[ii].res
                    if testResult.success
                        assert.equal err?[prov], undefined, """
                            No error expected requesting {
                                MCC: `#{vectors[ii].req.mcc}`
                                MNC: `#{vectors[ii].req.mnc}`
                                LAC: `#{vectors[ii].req.lac}`
                                CID: `#{vectors[ii].req.cid}`
                                Net: `#{vectors[ii].req.net}`
                            } in `#{prov}`
                        """
        )
        clearInterval(t) if i >= vectors.length
    ,
    3000
)
