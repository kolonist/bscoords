declare module "bscoords" {
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
    function init(options: InitOptions): void;

    /**
     * Options to init the library. For some services API-Keys are needed.
     * You can specify them here.
     */
    interface InitOptions {
        /**
         * API key for Mylnikov location service.
         * @default ""
         */
        apikey_mylnikov?: string;
        /**
         * API key for OpenCellId.
         * @default ""
         */
        apikey_opencellid?: string;
        /**
         * API key for Mozilla location service.
         * @default "test"
         */
        apikey_mozilla?: string;

        /**
         * Connection timeout in milliseconds for network requests.
         * @default 3000
         */
        timeout?: number;
    }

    /**
     * Location returned from a single location service call.
     */
    interface LocationData {
        /**
         * Latitude of the cell tower.
         */
        lat: number;
        /**
         * Longitude of the cell tower.
         */
        lon: number;
    }

    type LocationDataOrNull = LocationData | null;

    /**
    * Get BS geographical coordinates from yandex.ru.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function yandex(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
    * Get BS geographical coordinates from google.com.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function google(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
    * Get BS geographical coordinates from cell2gps.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function cell2gps(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
    * Get BS geographical coordinates from mylnikov.org.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function mylnikov(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
    * Get BS geographical coordinates from opencellid.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function opencellid(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
    * Get BS geographical coordinates from Mozilla Geolocation Service.
    *
    * @param {Number} countrycode First 3 digits of IMSI. 250 for Russia.
    * @param {Number} operatorid 4th and 5th digits of IMSI. 99 for Beelone, 01 for
    *                            MTS, 02 for Megafon, 20 for Tele2.
    * @param {Number} lac Location area code in decimal.
    * @param {Number} cellid Cell ID in decimal.
    * @return {Promise<LocationDataOrNull>} Promise resolves with coordinates object in the form of
    *                                      {lat: 23.12345, lon: 54.54321}  or null.
    */
    function mozilla(countrycode: number, operatorid: number, lac: number, cellid: number): Promise<LocationDataOrNull>;

    /**
     * Object with the location data from all requested services and the average with the
     * supplied weights.
     */
    interface AllLocationData {
        average: LocationDataOrNull;
        yandex?: LocationDataOrNull;
        google?: LocationDataOrNull;
        mylnikov?: LocationDataOrNull;
        opencellid?: LocationDataOrNull;
        mozilla?: LocationDataOrNull;
        cell2gps?: LocationDataOrNull;
    }

    /**
     * Object contains weight coefficients for services to calculate average point.
     */
    interface ServiceWeights {
        yandex?: number;
        google?: number;
        mylnikov?: number;
        opencellid?: number;
        mozilla?: number;
        cell2gps?: number;
    }

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
    *                         but you can list only services you need. Names of
    *                         services could be 'yandex', 'google', 'mylnikov',
    *                         'opencellid', 'mozilla', 'cell2gps'.
    * @param {Object} weights Object contains weight coefficients for services to
    *                         calculate average point. Default is {
    *                             yandex: 1,
    *                             google: 1,
    *                             mylnikov: 1,
    *                             opencellid: 1,
    *                             mozilla: 1,
    *                             cell2gps: 1
    *                         } that means that all services are equal. But in
    *                         reality you should use weights because services
    *                         accuracy widely vary.
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
    function requestAll(countrycode: number, operatorid: number, lac: number, cellid: number,
        services?: Array<string>,
        weights?: ServiceWeights
    ): Promise<AllLocationData>;

    export {
        init,
        InitOptions,
        LocationData,
        LocationDataOrNull,
        AllLocationData,
        yandex,
        google,
        cell2gps,
        mylnikov,
        opencellid,
        mozilla,
        requestAll as all
    }
}
