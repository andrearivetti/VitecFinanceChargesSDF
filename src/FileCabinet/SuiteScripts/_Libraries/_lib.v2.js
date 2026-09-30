/**
 * _lib.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/runtime', 'N/url', 'N/currency', 'N/format', 'N/https', 'N/file', 'N/query', 'N/redirect', 'N/ui/serverWidget', 'N/ui/message', 'N/render'],

    function (record, search, runtime, url, currency, format, https, file, query, redirect, ui, message, render) {
        /**
         * @param {record} record
         * @param {search} search
         * @param {runtime} runtime
         * @param {url} url
         * @param {currency} currency
         * @param {format} format
         * @param {https} https
         * @param {file} file
         * @param {query} query
         * @param {redirect} redirect
         * @param {ui} ui
         * @param {message} message
         */

        // MDIMKOV 23.06.2022: this function is used in several other functions to add an indent level in logging, such as '... ... xxxx'
        function addIndents(indentLevel) {
            let indent = '';
            if (indentLevel) {
                for (let i = 0; i < indentLevel; i++) {
                    indent += '... '
                }
            }
            return indent;
        }


        /* =============== LOAD ITEM IRRESPECTIVE OF ITEM TYPE =============== */

        /*
     * MDIMKOV 28.03.2020: this function loads an item record, irrespective of each type, as otherwise the type needs to be known and set respectively
     *
     * RETURNS: item record instance
     *
     * USAGE:
     *
     * var recItem = loadItemRec(itemId);
     *
     * */

        function loadItemRec(theId) {

            var itemTypes = [record.Type.SERVICE_ITEM,
                record.Type.INVENTORY_ITEM, record.Type.NON_INVENTORY_ITEM, record.Type.OTHER_CHARGE_ITEM, record.Type.ASSEMBLY_ITEM,
                record.Type.DESCRIPTION_ITEM, record.Type.DISCOUNT_ITEM, record.Type.DOWNLOAD_ITEM, record.Type.GIFT_CERTIFICATE_ITEM,
                record.Type.KIT_ITEM, record.Type.LOT_NUMBERED_ASSEMBLY_ITEM, record.Type.LOT_NUMBERED_INVENTORY_ITEM, record.Type.MARKUP_ITEM,
                record.Type.PAYMENT_ITEM, record.Type.PAYROLL_ITEM, record.Type.REALLOCATE_ITEM, record.Type.SALES_TAX_ITEM,
                record.Type.SERIALIZED_ASSEMBLY_ITEM, record.Type.SERIALIZED_INVENTORY_ITEM, record.Type.SHIP_ITEM, record.Type.SUBTOTAL_ITEM];

            for (var n = 0; n < itemTypes.length; n++) {

                try {

                    var recItem = record.load({
                        type: itemTypes[n],
                        id: theId
                    });

                    return recItem;

                } catch (e) {
                }

            }

        }


        /* =============== GET POSTING PERIOD FOR A GIVEN DATE =============== */

        /*
     * MDIMKOV 02.01.2018: this function gets the posting period for a given date (e.g. 'Mar 2020')
     *
     * RETURNS: string containing the posting period, such as 'Mar 2020'
     *
     * USAGE:
     *
     * var postPeriod = getPostingPeriod(new Date);
     *
     * to set the posting peiod on a transaction, use the following:
     * var today = new Date;
     * recJE.setText('postingperiod', getPostingPeriod(today))
     *
     * */


        function getPostingPeriod(dateObj) {
            if (!(dateObj instanceof Date)) {
                throw new Error('Invalid input: Expected a Date object');
            }

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const monthName = months[dateObj.getMonth()];
            const year = dateObj.getFullYear();

            return `${monthName} ${year}`;
        }


        /* =============== CHECK IF AN ARRAY CONTAINS A GIVEN OBJECT =============== */

        /*
     * MDIMKOV 01.12.2018: this function checks if an element (obj) is included in an array (arr)
     *
     * RETURNS: boolean
     *
     * USAGE:
     *
     * var myArray = ['a', 'b', 'c'];
     *
     * var isInArray = arrayContains(myArray 'b');
     *
     * */


        function arrayContains(arr, obj) {
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == obj) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }


        /* =============== LOG A VERY LONG STRING, SUCH AS A JSON / REQUEST BODY ETC. =============== */

        /*
     * MDIMKOV 13.06.2020: this function logs very long strings
     *
     * RETURNS: void
     *
     * USAGE:
     *
     * longLog('audit', 'myTitle', varToLog);
     *
     * */


        function longLog(sType, sTitle, varToLog) {

            var logSteps = varToLog.length / 4000;

            if (sType == 'audit') {

                for (var i = 0; i < logSteps; i++) {

                    switch (sType) {

                        case 'debug':
                            log.debug(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                        case 'audit':
                            log.audit(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                        case 'error':
                            log.error(sTitle + '-' + parseInt(i + 1), varToLog.substr(i * 3999, (i + 1) * 3999));
                            break;

                    }

                }

            }

        }


        /* =============== Get the ID and the code of a country by looking for its name/text =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the id and code of a country by looking for its name/tex
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryByText('United Kingdom');	// expected result: [{text:"United Kingdom",code:"GB",id:"77"}]
     *
     * */


        function countryByText(inputVar) {

            // OBSOLETTE - use [getCountryCodeTextId] instead

            /* var returnObject = [];

             var returnObject = [];

             var country_list =
                 [
                     {"text": "Afghanistan", "code": "AF", "id": "3"},
                     {"text": "Aland Islands", "code": "AX", "id": "247"},
                     {"text": "Albania", "code": "AL", "id": "6"},
                     {"text": "Algeria", "code": "DZ", "id": "62"},
                     {"text": "American Samoa", "code": "AS", "id": "12"},
                     {"text": "Andorra", "code": "AD", "id": "1"},
                     {"text": "Angola", "code": "AO", "id": "9"},
                     {"text": "Anguilla", "code": "AI", "id": "5"},
                     {"text": "Antarctica", "code": "AQ", "id": "10"},
                     {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                     {"text": "Argentina", "code": "AR", "id": "11"},
                     {"text": "Armenia", "code": "AM", "id": "7"},
                     {"text": "Aruba", "code": "AW", "id": "15"},
                     {"text": "Australia", "code": "AU", "id": "14"},
                     {"text": "Austria", "code": "AT", "id": "13"},
                     {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                     {"text": "Bahamas", "code": "BS", "id": "31"},
                     {"text": "Bahrain", "code": "BH", "id": "23"},
                     {"text": "Bangladesh", "code": "BD", "id": "19"},
                     {"text": "Barbados", "code": "BB", "id": "18"},
                     {"text": "Belarus", "code": "BY", "id": "35"},
                     {"text": "Belgium", "code": "BE", "id": "20"},
                     {"text": "Belize", "code": "BZ", "id": "36"},
                     {"text": "Benin", "code": "BJ", "id": "25"},
                     {"text": "Bermuda", "code": "BM", "id": "27"},
                     {"text": "Bhutan", "code": "BT", "id": "32"},
                     {"text": "Bolivia", "code": "BO", "id": "29"},
                     {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                     {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                     {"text": "Botswana", "code": "BW", "id": "34"},
                     {"text": "Bouvet Island", "code": "BV", "id": "33"},
                     {"text": "Brazil", "code": "BR", "id": "30"},
                     {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                     {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                     {"text": "Bulgaria", "code": "BG", "id": "22"},
                     {"text": "Burkina Faso", "code": "BF", "id": "21"},
                     {"text": "Burundi", "code": "BI", "id": "24"},
                     {"text": "Cambodia", "code": "KH", "id": "117"},
                     {"text": "Cameroon", "code": "CM", "id": "46"},
                     {"text": "Canada", "code": "CA", "id": "37"},
                     {"text": "Canary Islands", "code": "IC", "id": "249"},
                     {"text": "Cape Verde", "code": "CV", "id": "53"},
                     {"text": "Cayman Islands", "code": "KY", "id": "124"},
                     {"text": "Central African Republic", "code": "CF", "id": "40"},
                     {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                     {"text": "Chad", "code": "TD", "id": "212"},
                     {"text": "Chile", "code": "CL", "id": "45"},
                     {"text": "China", "code": "CN", "id": "47"},
                     {"text": "Christmas Island", "code": "CX", "id": "54"},
                     {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                     {"text": "Colombia", "code": "CO", "id": "48"},
                     {"text": "Comoros", "code": "KM", "id": "119"},
                     {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                     {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                     {"text": "Cook Islands", "code": "CK", "id": "44"},
                     {"text": "Costa Rica", "code": "CR", "id": "49"},
                     {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                     {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                     {"text": "Cuba", "code": "CU", "id": "52"},
                     {"text": "Curaçao", "code": "CW", "id": "251"},
                     {"text": "Cyprus", "code": "CY", "id": "55"},
                     {"text": "Czech Republic", "code": "CZ", "id": "56"},
                     {"text": "Denmark", "code": "DK", "id": "59"},
                     {"text": "Djibouti", "code": "DJ", "id": "58"},
                     {"text": "Dominica", "code": "DM", "id": "60"},
                     {"text": "Dominican Republic", "code": "DO", "id": "61"},
                     {"text": "East Timor", "code": "TL", "id": "221"},
                     {"text": "Ecuador", "code": "EC", "id": "63"},
                     {"text": "Egypt", "code": "EG", "id": "65"},
                     {"text": "El Salvador", "code": "SV", "id": "208"},
                     {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                     {"text": "Eritrea", "code": "ER", "id": "67"},
                     {"text": "Estonia", "code": "EE", "id": "64"},
                     {"text": "Ethiopia", "code": "ET", "id": "69"},
                     {"text": "Falkland Islands", "code": "FK", "id": "72"},
                     {"text": "Faroe Islands", "code": "FO", "id": "74"},
                     {"text": "Fiji", "code": "FJ", "id": "71"},
                     {"text": "Finland", "code": "FI", "id": "70"},
                     {"text": "France", "code": "FR", "id": "75"},
                     {"text": "French Guiana", "code": "GF", "id": "80"},
                     {"text": "French Polynesia", "code": "PF", "id": "175"},
                     {"text": "French Southern Territories", "code": "TF", "id": "213"},
                     {"text": "Gabon", "code": "GA", "id": "76"},
                     {"text": "Gambia", "code": "GM", "id": "85"},
                     {"text": "Georgia", "code": "GE", "id": "79"},
                     {"text": "Germany", "code": "DE", "id": "57"},
                     {"text": "Ghana", "code": "GH", "id": "82"},
                     {"text": "Gibraltar", "code": "GI", "id": "83"},
                     {"text": "Greece", "code": "GR", "id": "89"},
                     {"text": "Greenland", "code": "GL", "id": "84"},
                     {"text": "Grenada", "code": "GD", "id": "78"},
                     {"text": "Guadeloupe", "code": "GP", "id": "87"},
                     {"text": "Guam", "code": "GU", "id": "92"},
                     {"text": "Guatemala", "code": "GT", "id": "91"},
                     {"text": "Guernsey", "code": "GG", "id": "81"},
                     {"text": "Guinea", "code": "GN", "id": "86"},
                     {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                     {"text": "Guyana", "code": "GY", "id": "94"},
                     {"text": "Haiti", "code": "HT", "id": "99"},
                     {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                     {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                     {"text": "Honduras", "code": "HN", "id": "97"},
                     {"text": "Hong Kong", "code": "HK", "id": "95"},
                     {"text": "Hungary", "code": "HU", "id": "100"},
                     {"text": "Iceland", "code": "IS", "id": "109"},
                     {"text": "India", "code": "IN", "id": "105"},
                     {"text": "Indonesia", "code": "ID", "id": "101"},
                     {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                     {"text": "Iraq", "code": "IQ", "id": "107"},
                     {"text": "Ireland", "code": "IE", "id": "102"},
                     {"text": "Isle of Man", "code": "IM", "id": "104"},
                     {"text": "Israel", "code": "IL", "id": "103"},
                     {"text": "Italy", "code": "IT", "id": "110"},
                     {"text": "Jamaica", "code": "JM", "id": "112"},
                     {"text": "Japan", "code": "JP", "id": "114"},
                     {"text": "Jersey", "code": "JE", "id": "111"},
                     {"text": "Jordan", "code": "JO", "id": "113"},
                     {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                     {"text": "Kenya", "code": "KE", "id": "115"},
                     {"text": "Kiribati", "code": "KI", "id": "118"},
                     {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                     {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                     {"text": "Kosovo", "code": "XK", "id": "254"},
                     {"text": "Kuwait", "code": "KW", "id": "123"},
                     {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                     {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                     {"text": "Latvia", "code": "LV", "id": "135"},
                     {"text": "Lebanon", "code": "LB", "id": "127"},
                     {"text": "Lesotho", "code": "LS", "id": "132"},
                     {"text": "Liberia", "code": "LR", "id": "131"},
                     {"text": "Libya", "code": "LY", "id": "136"},
                     {"text": "Liechtenstein", "code": "LI", "id": "129"},
                     {"text": "Lithuania", "code": "LT", "id": "133"},
                     {"text": "Luxembourg", "code": "LU", "id": "134"},
                     {"text": "Macau", "code": "MO", "id": "148"},
                     {"text": "Macedonia", "code": "MK", "id": "144"},
                     {"text": "Madagascar", "code": "MG", "id": "142"},
                     {"text": "Malawi", "code": "MW", "id": "156"},
                     {"text": "Malaysia", "code": "MY", "id": "158"},
                     {"text": "Maldives", "code": "MV", "id": "155"},
                     {"text": "Mali", "code": "ML", "id": "145"},
                     {"text": "Malta", "code": "MT", "id": "153"},
                     {"text": "Marshall Islands", "code": "MH", "id": "143"},
                     {"text": "Martinique", "code": "MQ", "id": "150"},
                     {"text": "Mauritania", "code": "MR", "id": "151"},
                     {"text": "Mauritius", "code": "MU", "id": "154"},
                     {"text": "Mayotte", "code": "YT", "id": "243"},
                     {"text": "Mexico", "code": "MX", "id": "157"},
                     {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                     {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                     {"text": "Monaco", "code": "MC", "id": "138"},
                     {"text": "Mongolia", "code": "MN", "id": "147"},
                     {"text": "Montenegro", "code": "ME", "id": "140"},
                     {"text": "Montserrat", "code": "MS", "id": "152"},
                     {"text": "Morocco", "code": "MA", "id": "137"},
                     {"text": "Mozambique", "code": "MZ", "id": "159"},
                     {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                     {"text": "Namibia", "code": "NA", "id": "160"},
                     {"text": "Nauru", "code": "NR", "id": "169"},
                     {"text": "Nepal", "code": "NP", "id": "168"},
                     {"text": "Netherlands", "code": "NL", "id": "166"},
                     {"text": "New Caledonia", "code": "NC", "id": "161"},
                     {"text": "New Zealand", "code": "NZ", "id": "171"},
                     {"text": "Nicaragua", "code": "NI", "id": "165"},
                     {"text": "Niger", "code": "NE", "id": "162"},
                     {"text": "Nigeria", "code": "NG", "id": "164"},
                     {"text": "Niue", "code": "NU", "id": "170"},
                     {"text": "Norfolk Island", "code": "NF", "id": "163"},
                     {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                     {"text": "Norway", "code": "NO", "id": "167"},
                     {"text": "Oman", "code": "OM", "id": "172"},
                     {"text": "Pakistan", "code": "PK", "id": "178"},
                     {"text": "Palau", "code": "PW", "id": "185"},
                     {"text": "Panama", "code": "PA", "id": "173"},
                     {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                     {"text": "Paraguay", "code": "PY", "id": "186"},
                     {"text": "Peru", "code": "PE", "id": "174"},
                     {"text": "Philippines", "code": "PH", "id": "177"},
                     {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                     {"text": "Poland", "code": "PL", "id": "179"},
                     {"text": "Portugal", "code": "PT", "id": "184"},
                     {"text": "Puerto Rico", "code": "PR", "id": "182"},
                     {"text": "Qatar", "code": "QA", "id": "187"},
                     {"text": "Reunion Island", "code": "RE", "id": "188"},
                     {"text": "Romania", "code": "RO", "id": "189"},
                     {"text": "Russian Federation", "code": "RU", "id": "190"},
                     {"text": "Rwanda", "code": "RW", "id": "191"},
                     {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                     {"text": "Saint Helena", "code": "SH", "id": "198"},
                     {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                     {"text": "Saint Lucia", "code": "LC", "id": "128"},
                     {"text": "Saint Martin", "code": "MF", "id": "141"},
                     {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                     {"text": "Samoa", "code": "WS", "id": "241"},
                     {"text": "San Marino", "code": "SM", "id": "203"},
                     {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                     {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                     {"text": "Senegal", "code": "SN", "id": "204"},
                     {"text": "Serbia", "code": "RS", "id": "50"},
                     {"text": "Seychelles", "code": "SC", "id": "194"},
                     {"text": "Sierra Leone", "code": "SL", "id": "202"},
                     {"text": "Singapore", "code": "SG", "id": "197"},
                     {"text": "Sint Maarten", "code": "SX", "id": "252"},
                     {"text": "Slovak Republic", "code": "SK", "id": "201"},
                     {"text": "Slovenia", "code": "SI", "id": "199"},
                     {"text": "Solomon Islands", "code": "SB", "id": "193"},
                     {"text": "Somalia", "code": "SO", "id": "205"},
                     {"text": "South Africa", "code": "ZA", "id": "244"},
                     {"text": "South Georgia", "code": "GS", "id": "90"},
                     {"text": "South Sudan", "code": "SS", "id": "253"},
                     {"text": "Spain", "code": "ES", "id": "68"},
                     {"text": "Sri Lanka", "code": "LK", "id": "130"},
                     {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                     {"text": "State of Palestine", "code": "PS", "id": "183"},
                     {"text": "Sudan", "code": "SD", "id": "195"},
                     {"text": "Suriname", "code": "SR", "id": "206"},
                     {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                     {"text": "Swaziland", "code": "SZ", "id": "210"},
                     {"text": "Sweden", "code": "SE", "id": "196"},
                     {"text": "Switzerland", "code": "CH", "id": "42"},
                     {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                     {"text": "Taiwan", "code": "TW", "id": "225"},
                     {"text": "Tajikistan", "code": "TJ", "id": "216"},
                     {"text": "Tanzania", "code": "TZ", "id": "226"},
                     {"text": "Thailand", "code": "TH", "id": "215"},
                     {"text": "Togo", "code": "TG", "id": "214"},
                     {"text": "Tokelau", "code": "TK", "id": "217"},
                     {"text": "Tonga", "code": "TO", "id": "220"},
                     {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                     {"text": "Tunisia", "code": "TN", "id": "219"},
                     {"text": "Turkey", "code": "TR", "id": "222"},
                     {"text": "Turkmenistan", "code": "TM", "id": "218"},
                     {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                     {"text": "Tuvalu", "code": "TV", "id": "224"},
                     {"text": "Uganda", "code": "UG", "id": "228"},
                     {"text": "Ukraine", "code": "UA", "id": "227"},
                     {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                     {"text": "United Kingdom", "code": "GB", "id": "77"},
                     {"text": "United States", "code": "US", "id": "230"},
                     {"text": "Uruguay", "code": "UY", "id": "231"},
                     {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                     {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                     {"text": "Vanuatu", "code": "VU", "id": "239"},
                     {"text": "Venezuela", "code": "VE", "id": "235"},
                     {"text": "Vietnam", "code": "VN", "id": "238"},
                     {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                     {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                     {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                     {"text": "Western Sahara", "code": "EH", "id": "66"},
                     {"text": "Yemen", "code": "YE", "id": "242"},
                     {"text": "Zambia", "code": "ZM", "id": "245"},
                     {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                 ];

             returnObject = country_list.filter(function (x) {
                 return x.text == inputVar;
             });

             return returnObject;
 */
        }


        /* =============== Get the name/text and the code of a country by looking for its ID =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the name/text and the code of a country by looking for its ID
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryById('77');	// expected result: [{text:"United Kingdom",code:"GB",id:"77"}]
     *
     * */


        function countryById(inputVar) {

            // OBSOLETTE - use [getCountryCodeTextId] instead
            /*
                        var returnObject = [];

                        var country_list =
                            [
                                {"text": "Afghanistan", "code": "AF", "id": "3"},
                                {"text": "Aland Islands", "code": "AX", "id": "247"},
                                {"text": "Albania", "code": "AL", "id": "6"},
                                {"text": "Algeria", "code": "DZ", "id": "62"},
                                {"text": "American Samoa", "code": "AS", "id": "12"},
                                {"text": "Andorra", "code": "AD", "id": "1"},
                                {"text": "Angola", "code": "AO", "id": "9"},
                                {"text": "Anguilla", "code": "AI", "id": "5"},
                                {"text": "Antarctica", "code": "AQ", "id": "10"},
                                {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                                {"text": "Argentina", "code": "AR", "id": "11"},
                                {"text": "Armenia", "code": "AM", "id": "7"},
                                {"text": "Aruba", "code": "AW", "id": "15"},
                                {"text": "Australia", "code": "AU", "id": "14"},
                                {"text": "Austria", "code": "AT", "id": "13"},
                                {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                                {"text": "Bahamas", "code": "BS", "id": "31"},
                                {"text": "Bahrain", "code": "BH", "id": "23"},
                                {"text": "Bangladesh", "code": "BD", "id": "19"},
                                {"text": "Barbados", "code": "BB", "id": "18"},
                                {"text": "Belarus", "code": "BY", "id": "35"},
                                {"text": "Belgium", "code": "BE", "id": "20"},
                                {"text": "Belize", "code": "BZ", "id": "36"},
                                {"text": "Benin", "code": "BJ", "id": "25"},
                                {"text": "Bermuda", "code": "BM", "id": "27"},
                                {"text": "Bhutan", "code": "BT", "id": "32"},
                                {"text": "Bolivia", "code": "BO", "id": "29"},
                                {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                                {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                                {"text": "Botswana", "code": "BW", "id": "34"},
                                {"text": "Bouvet Island", "code": "BV", "id": "33"},
                                {"text": "Brazil", "code": "BR", "id": "30"},
                                {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                                {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                                {"text": "Bulgaria", "code": "BG", "id": "22"},
                                {"text": "Burkina Faso", "code": "BF", "id": "21"},
                                {"text": "Burundi", "code": "BI", "id": "24"},
                                {"text": "Cambodia", "code": "KH", "id": "117"},
                                {"text": "Cameroon", "code": "CM", "id": "46"},
                                {"text": "Canada", "code": "CA", "id": "37"},
                                {"text": "Canary Islands", "code": "IC", "id": "249"},
                                {"text": "Cape Verde", "code": "CV", "id": "53"},
                                {"text": "Cayman Islands", "code": "KY", "id": "124"},
                                {"text": "Central African Republic", "code": "CF", "id": "40"},
                                {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                                {"text": "Chad", "code": "TD", "id": "212"},
                                {"text": "Chile", "code": "CL", "id": "45"},
                                {"text": "China", "code": "CN", "id": "47"},
                                {"text": "Christmas Island", "code": "CX", "id": "54"},
                                {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                                {"text": "Colombia", "code": "CO", "id": "48"},
                                {"text": "Comoros", "code": "KM", "id": "119"},
                                {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                                {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                                {"text": "Cook Islands", "code": "CK", "id": "44"},
                                {"text": "Costa Rica", "code": "CR", "id": "49"},
                                {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                                {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                                {"text": "Cuba", "code": "CU", "id": "52"},
                                {"text": "Curaçao", "code": "CW", "id": "251"},
                                {"text": "Cyprus", "code": "CY", "id": "55"},
                                {"text": "Czech Republic", "code": "CZ", "id": "56"},
                                {"text": "Denmark", "code": "DK", "id": "59"},
                                {"text": "Djibouti", "code": "DJ", "id": "58"},
                                {"text": "Dominica", "code": "DM", "id": "60"},
                                {"text": "Dominican Republic", "code": "DO", "id": "61"},
                                {"text": "East Timor", "code": "TL", "id": "221"},
                                {"text": "Ecuador", "code": "EC", "id": "63"},
                                {"text": "Egypt", "code": "EG", "id": "65"},
                                {"text": "El Salvador", "code": "SV", "id": "208"},
                                {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                                {"text": "Eritrea", "code": "ER", "id": "67"},
                                {"text": "Estonia", "code": "EE", "id": "64"},
                                {"text": "Ethiopia", "code": "ET", "id": "69"},
                                {"text": "Falkland Islands", "code": "FK", "id": "72"},
                                {"text": "Faroe Islands", "code": "FO", "id": "74"},
                                {"text": "Fiji", "code": "FJ", "id": "71"},
                                {"text": "Finland", "code": "FI", "id": "70"},
                                {"text": "France", "code": "FR", "id": "75"},
                                {"text": "French Guiana", "code": "GF", "id": "80"},
                                {"text": "French Polynesia", "code": "PF", "id": "175"},
                                {"text": "French Southern Territories", "code": "TF", "id": "213"},
                                {"text": "Gabon", "code": "GA", "id": "76"},
                                {"text": "Gambia", "code": "GM", "id": "85"},
                                {"text": "Georgia", "code": "GE", "id": "79"},
                                {"text": "Germany", "code": "DE", "id": "57"},
                                {"text": "Ghana", "code": "GH", "id": "82"},
                                {"text": "Gibraltar", "code": "GI", "id": "83"},
                                {"text": "Greece", "code": "GR", "id": "89"},
                                {"text": "Greenland", "code": "GL", "id": "84"},
                                {"text": "Grenada", "code": "GD", "id": "78"},
                                {"text": "Guadeloupe", "code": "GP", "id": "87"},
                                {"text": "Guam", "code": "GU", "id": "92"},
                                {"text": "Guatemala", "code": "GT", "id": "91"},
                                {"text": "Guernsey", "code": "GG", "id": "81"},
                                {"text": "Guinea", "code": "GN", "id": "86"},
                                {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                                {"text": "Guyana", "code": "GY", "id": "94"},
                                {"text": "Haiti", "code": "HT", "id": "99"},
                                {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                                {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                                {"text": "Honduras", "code": "HN", "id": "97"},
                                {"text": "Hong Kong", "code": "HK", "id": "95"},
                                {"text": "Hungary", "code": "HU", "id": "100"},
                                {"text": "Iceland", "code": "IS", "id": "109"},
                                {"text": "India", "code": "IN", "id": "105"},
                                {"text": "Indonesia", "code": "ID", "id": "101"},
                                {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                                {"text": "Iraq", "code": "IQ", "id": "107"},
                                {"text": "Ireland", "code": "IE", "id": "102"},
                                {"text": "Isle of Man", "code": "IM", "id": "104"},
                                {"text": "Israel", "code": "IL", "id": "103"},
                                {"text": "Italy", "code": "IT", "id": "110"},
                                {"text": "Jamaica", "code": "JM", "id": "112"},
                                {"text": "Japan", "code": "JP", "id": "114"},
                                {"text": "Jersey", "code": "JE", "id": "111"},
                                {"text": "Jordan", "code": "JO", "id": "113"},
                                {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                                {"text": "Kenya", "code": "KE", "id": "115"},
                                {"text": "Kiribati", "code": "KI", "id": "118"},
                                {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                                {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                                {"text": "Kosovo", "code": "XK", "id": "254"},
                                {"text": "Kuwait", "code": "KW", "id": "123"},
                                {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                                {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                                {"text": "Latvia", "code": "LV", "id": "135"},
                                {"text": "Lebanon", "code": "LB", "id": "127"},
                                {"text": "Lesotho", "code": "LS", "id": "132"},
                                {"text": "Liberia", "code": "LR", "id": "131"},
                                {"text": "Libya", "code": "LY", "id": "136"},
                                {"text": "Liechtenstein", "code": "LI", "id": "129"},
                                {"text": "Lithuania", "code": "LT", "id": "133"},
                                {"text": "Luxembourg", "code": "LU", "id": "134"},
                                {"text": "Macau", "code": "MO", "id": "148"},
                                {"text": "Macedonia", "code": "MK", "id": "144"},
                                {"text": "Madagascar", "code": "MG", "id": "142"},
                                {"text": "Malawi", "code": "MW", "id": "156"},
                                {"text": "Malaysia", "code": "MY", "id": "158"},
                                {"text": "Maldives", "code": "MV", "id": "155"},
                                {"text": "Mali", "code": "ML", "id": "145"},
                                {"text": "Malta", "code": "MT", "id": "153"},
                                {"text": "Marshall Islands", "code": "MH", "id": "143"},
                                {"text": "Martinique", "code": "MQ", "id": "150"},
                                {"text": "Mauritania", "code": "MR", "id": "151"},
                                {"text": "Mauritius", "code": "MU", "id": "154"},
                                {"text": "Mayotte", "code": "YT", "id": "243"},
                                {"text": "Mexico", "code": "MX", "id": "157"},
                                {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                                {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                                {"text": "Monaco", "code": "MC", "id": "138"},
                                {"text": "Mongolia", "code": "MN", "id": "147"},
                                {"text": "Montenegro", "code": "ME", "id": "140"},
                                {"text": "Montserrat", "code": "MS", "id": "152"},
                                {"text": "Morocco", "code": "MA", "id": "137"},
                                {"text": "Mozambique", "code": "MZ", "id": "159"},
                                {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                                {"text": "Namibia", "code": "NA", "id": "160"},
                                {"text": "Nauru", "code": "NR", "id": "169"},
                                {"text": "Nepal", "code": "NP", "id": "168"},
                                {"text": "Netherlands", "code": "NL", "id": "166"},
                                {"text": "New Caledonia", "code": "NC", "id": "161"},
                                {"text": "New Zealand", "code": "NZ", "id": "171"},
                                {"text": "Nicaragua", "code": "NI", "id": "165"},
                                {"text": "Niger", "code": "NE", "id": "162"},
                                {"text": "Nigeria", "code": "NG", "id": "164"},
                                {"text": "Niue", "code": "NU", "id": "170"},
                                {"text": "Norfolk Island", "code": "NF", "id": "163"},
                                {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                                {"text": "Norway", "code": "NO", "id": "167"},
                                {"text": "Oman", "code": "OM", "id": "172"},
                                {"text": "Pakistan", "code": "PK", "id": "178"},
                                {"text": "Palau", "code": "PW", "id": "185"},
                                {"text": "Panama", "code": "PA", "id": "173"},
                                {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                                {"text": "Paraguay", "code": "PY", "id": "186"},
                                {"text": "Peru", "code": "PE", "id": "174"},
                                {"text": "Philippines", "code": "PH", "id": "177"},
                                {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                                {"text": "Poland", "code": "PL", "id": "179"},
                                {"text": "Portugal", "code": "PT", "id": "184"},
                                {"text": "Puerto Rico", "code": "PR", "id": "182"},
                                {"text": "Qatar", "code": "QA", "id": "187"},
                                {"text": "Reunion Island", "code": "RE", "id": "188"},
                                {"text": "Romania", "code": "RO", "id": "189"},
                                {"text": "Russian Federation", "code": "RU", "id": "190"},
                                {"text": "Rwanda", "code": "RW", "id": "191"},
                                {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                                {"text": "Saint Helena", "code": "SH", "id": "198"},
                                {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                                {"text": "Saint Lucia", "code": "LC", "id": "128"},
                                {"text": "Saint Martin", "code": "MF", "id": "141"},
                                {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                                {"text": "Samoa", "code": "WS", "id": "241"},
                                {"text": "San Marino", "code": "SM", "id": "203"},
                                {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                                {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                                {"text": "Senegal", "code": "SN", "id": "204"},
                                {"text": "Serbia", "code": "RS", "id": "50"},
                                {"text": "Seychelles", "code": "SC", "id": "194"},
                                {"text": "Sierra Leone", "code": "SL", "id": "202"},
                                {"text": "Singapore", "code": "SG", "id": "197"},
                                {"text": "Sint Maarten", "code": "SX", "id": "252"},
                                {"text": "Slovak Republic", "code": "SK", "id": "201"},
                                {"text": "Slovenia", "code": "SI", "id": "199"},
                                {"text": "Solomon Islands", "code": "SB", "id": "193"},
                                {"text": "Somalia", "code": "SO", "id": "205"},
                                {"text": "South Africa", "code": "ZA", "id": "244"},
                                {"text": "South Georgia", "code": "GS", "id": "90"},
                                {"text": "South Sudan", "code": "SS", "id": "253"},
                                {"text": "Spain", "code": "ES", "id": "68"},
                                {"text": "Sri Lanka", "code": "LK", "id": "130"},
                                {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                                {"text": "State of Palestine", "code": "PS", "id": "183"},
                                {"text": "Sudan", "code": "SD", "id": "195"},
                                {"text": "Suriname", "code": "SR", "id": "206"},
                                {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                                {"text": "Swaziland", "code": "SZ", "id": "210"},
                                {"text": "Sweden", "code": "SE", "id": "196"},
                                {"text": "Switzerland", "code": "CH", "id": "42"},
                                {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                                {"text": "Taiwan", "code": "TW", "id": "225"},
                                {"text": "Tajikistan", "code": "TJ", "id": "216"},
                                {"text": "Tanzania", "code": "TZ", "id": "226"},
                                {"text": "Thailand", "code": "TH", "id": "215"},
                                {"text": "Togo", "code": "TG", "id": "214"},
                                {"text": "Tokelau", "code": "TK", "id": "217"},
                                {"text": "Tonga", "code": "TO", "id": "220"},
                                {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                                {"text": "Tunisia", "code": "TN", "id": "219"},
                                {"text": "Turkey", "code": "TR", "id": "222"},
                                {"text": "Turkmenistan", "code": "TM", "id": "218"},
                                {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                                {"text": "Tuvalu", "code": "TV", "id": "224"},
                                {"text": "Uganda", "code": "UG", "id": "228"},
                                {"text": "Ukraine", "code": "UA", "id": "227"},
                                {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                                {"text": "United Kingdom", "code": "GB", "id": "77"},
                                {"text": "United States", "code": "US", "id": "230"},
                                {"text": "Uruguay", "code": "UY", "id": "231"},
                                {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                                {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                                {"text": "Vanuatu", "code": "VU", "id": "239"},
                                {"text": "Venezuela", "code": "VE", "id": "235"},
                                {"text": "Vietnam", "code": "VN", "id": "238"},
                                {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                                {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                                {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                                {"text": "Western Sahara", "code": "EH", "id": "66"},
                                {"text": "Yemen", "code": "YE", "id": "242"},
                                {"text": "Zambia", "code": "ZM", "id": "245"},
                                {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                            ];

                        returnObject = country_list.filter(function (x) {
                            return x.id == inputVar;
                        });

                        return returnObject;*/

        }


        /* =============== Get the ID and the name(text) of a country by looking for its code =============== */

        /*
     * MDIMKOV 13.06.2021: this function finds the ID and the name(text) of a country by looking for its code
     *
     * RETURNS: array
     *
     * USAGE:
     *
     * countryByCode('GB');	//-> [{text:"United Kingdom",code:"GB",id:"77"}]
     * const countryId = countryByCode('GB')[0].id //-> 77
     *
     * */


        function countryByCode(inputVar) {

            // OBSOLETTE - use [getCountryCodeTextId] instead
            /*

                        var returnObject = [];

                        var country_list =
                            [
                                {"text": "Afghanistan", "code": "AF", "id": "3"},
                                {"text": "Aland Islands", "code": "AX", "id": "247"},
                                {"text": "Albania", "code": "AL", "id": "6"},
                                {"text": "Algeria", "code": "DZ", "id": "62"},
                                {"text": "American Samoa", "code": "AS", "id": "12"},
                                {"text": "Andorra", "code": "AD", "id": "1"},
                                {"text": "Angola", "code": "AO", "id": "9"},
                                {"text": "Anguilla", "code": "AI", "id": "5"},
                                {"text": "Antarctica", "code": "AQ", "id": "10"},
                                {"text": "Antigua and Barbuda", "code": "AG", "id": "4"},
                                {"text": "Argentina", "code": "AR", "id": "11"},
                                {"text": "Armenia", "code": "AM", "id": "7"},
                                {"text": "Aruba", "code": "AW", "id": "15"},
                                {"text": "Australia", "code": "AU", "id": "14"},
                                {"text": "Austria", "code": "AT", "id": "13"},
                                {"text": "Azerbaijan", "code": "AZ", "id": "16"},
                                {"text": "Bahamas", "code": "BS", "id": "31"},
                                {"text": "Bahrain", "code": "BH", "id": "23"},
                                {"text": "Bangladesh", "code": "BD", "id": "19"},
                                {"text": "Barbados", "code": "BB", "id": "18"},
                                {"text": "Belarus", "code": "BY", "id": "35"},
                                {"text": "Belgium", "code": "BE", "id": "20"},
                                {"text": "Belize", "code": "BZ", "id": "36"},
                                {"text": "Benin", "code": "BJ", "id": "25"},
                                {"text": "Bermuda", "code": "BM", "id": "27"},
                                {"text": "Bhutan", "code": "BT", "id": "32"},
                                {"text": "Bolivia", "code": "BO", "id": "29"},
                                {"text": "Bonaire, Saint Eustatius and Saba", "code": "BQ", "id": "250"},
                                {"text": "Bosnia and Herzegovina", "code": "BA", "id": "17"},
                                {"text": "Botswana", "code": "BW", "id": "34"},
                                {"text": "Bouvet Island", "code": "BV", "id": "33"},
                                {"text": "Brazil", "code": "BR", "id": "30"},
                                {"text": "British Indian Ocean Territory", "code": "IO", "id": "106"},
                                {"text": "Brunei Darussalam", "code": "BN", "id": "28"},
                                {"text": "Bulgaria", "code": "BG", "id": "22"},
                                {"text": "Burkina Faso", "code": "BF", "id": "21"},
                                {"text": "Burundi", "code": "BI", "id": "24"},
                                {"text": "Cambodia", "code": "KH", "id": "117"},
                                {"text": "Cameroon", "code": "CM", "id": "46"},
                                {"text": "Canada", "code": "CA", "id": "37"},
                                {"text": "Canary Islands", "code": "IC", "id": "249"},
                                {"text": "Cape Verde", "code": "CV", "id": "53"},
                                {"text": "Cayman Islands", "code": "KY", "id": "124"},
                                {"text": "Central African Republic", "code": "CF", "id": "40"},
                                {"text": "Ceuta and Melilla", "code": "EA", "id": "248"},
                                {"text": "Chad", "code": "TD", "id": "212"},
                                {"text": "Chile", "code": "CL", "id": "45"},
                                {"text": "China", "code": "CN", "id": "47"},
                                {"text": "Christmas Island", "code": "CX", "id": "54"},
                                {"text": "Cocos (Keeling) Islands", "code": "CC", "id": "38"},
                                {"text": "Colombia", "code": "CO", "id": "48"},
                                {"text": "Comoros", "code": "KM", "id": "119"},
                                {"text": "Congo, Democratic Republic of", "code": "CD", "id": "39"},
                                {"text": "Congo, Republic of", "code": "CG", "id": "41"},
                                {"text": "Cook Islands", "code": "CK", "id": "44"},
                                {"text": "Costa Rica", "code": "CR", "id": "49"},
                                {"text": "Cote d\u0027Ivoire", "code": "CI", "id": "43"},
                                {"text": "Croatia/Hrvatska", "code": "HR", "id": "98"},
                                {"text": "Cuba", "code": "CU", "id": "52"},
                                {"text": "Curaçao", "code": "CW", "id": "251"},
                                {"text": "Cyprus", "code": "CY", "id": "55"},
                                {"text": "Czech Republic", "code": "CZ", "id": "56"},
                                {"text": "Denmark", "code": "DK", "id": "59"},
                                {"text": "Djibouti", "code": "DJ", "id": "58"},
                                {"text": "Dominica", "code": "DM", "id": "60"},
                                {"text": "Dominican Republic", "code": "DO", "id": "61"},
                                {"text": "East Timor", "code": "TL", "id": "221"},
                                {"text": "Ecuador", "code": "EC", "id": "63"},
                                {"text": "Egypt", "code": "EG", "id": "65"},
                                {"text": "El Salvador", "code": "SV", "id": "208"},
                                {"text": "Equatorial Guinea", "code": "GQ", "id": "88"},
                                {"text": "Eritrea", "code": "ER", "id": "67"},
                                {"text": "Estonia", "code": "EE", "id": "64"},
                                {"text": "Ethiopia", "code": "ET", "id": "69"},
                                {"text": "Falkland Islands", "code": "FK", "id": "72"},
                                {"text": "Faroe Islands", "code": "FO", "id": "74"},
                                {"text": "Fiji", "code": "FJ", "id": "71"},
                                {"text": "Finland", "code": "FI", "id": "70"},
                                {"text": "France", "code": "FR", "id": "75"},
                                {"text": "French Guiana", "code": "GF", "id": "80"},
                                {"text": "French Polynesia", "code": "PF", "id": "175"},
                                {"text": "French Southern Territories", "code": "TF", "id": "213"},
                                {"text": "Gabon", "code": "GA", "id": "76"},
                                {"text": "Gambia", "code": "GM", "id": "85"},
                                {"text": "Georgia", "code": "GE", "id": "79"},
                                {"text": "Germany", "code": "DE", "id": "57"},
                                {"text": "Ghana", "code": "GH", "id": "82"},
                                {"text": "Gibraltar", "code": "GI", "id": "83"},
                                {"text": "Greece", "code": "GR", "id": "89"},
                                {"text": "Greenland", "code": "GL", "id": "84"},
                                {"text": "Grenada", "code": "GD", "id": "78"},
                                {"text": "Guadeloupe", "code": "GP", "id": "87"},
                                {"text": "Guam", "code": "GU", "id": "92"},
                                {"text": "Guatemala", "code": "GT", "id": "91"},
                                {"text": "Guernsey", "code": "GG", "id": "81"},
                                {"text": "Guinea", "code": "GN", "id": "86"},
                                {"text": "Guinea-Bissau", "code": "GW", "id": "93"},
                                {"text": "Guyana", "code": "GY", "id": "94"},
                                {"text": "Haiti", "code": "HT", "id": "99"},
                                {"text": "Heard and McDonald Islands", "code": "HM", "id": "96"},
                                {"text": "Holy See (City Vatican State)", "code": "VA", "id": "233"},
                                {"text": "Honduras", "code": "HN", "id": "97"},
                                {"text": "Hong Kong", "code": "HK", "id": "95"},
                                {"text": "Hungary", "code": "HU", "id": "100"},
                                {"text": "Iceland", "code": "IS", "id": "109"},
                                {"text": "India", "code": "IN", "id": "105"},
                                {"text": "Indonesia", "code": "ID", "id": "101"},
                                {"text": "Iran (Islamic Republic of)", "code": "IR", "id": "108"},
                                {"text": "Iraq", "code": "IQ", "id": "107"},
                                {"text": "Ireland", "code": "IE", "id": "102"},
                                {"text": "Isle of Man", "code": "IM", "id": "104"},
                                {"text": "Israel", "code": "IL", "id": "103"},
                                {"text": "Italy", "code": "IT", "id": "110"},
                                {"text": "Jamaica", "code": "JM", "id": "112"},
                                {"text": "Japan", "code": "JP", "id": "114"},
                                {"text": "Jersey", "code": "JE", "id": "111"},
                                {"text": "Jordan", "code": "JO", "id": "113"},
                                {"text": "Kazakhstan", "code": "KZ", "id": "125"},
                                {"text": "Kenya", "code": "KE", "id": "115"},
                                {"text": "Kiribati", "code": "KI", "id": "118"},
                                {"text": "Korea, Democratic People\u0027s Republic", "code": "KP", "id": "121"},
                                {"text": "Korea, Republic of", "code": "KR", "id": "122"},
                                {"text": "Kosovo", "code": "XK", "id": "254"},
                                {"text": "Kuwait", "code": "KW", "id": "123"},
                                {"text": "Kyrgyzstan", "code": "KG", "id": "116"},
                                {"text": "Lao People\u0027s Democratic Republic", "code": "LA", "id": "126"},
                                {"text": "Latvia", "code": "LV", "id": "135"},
                                {"text": "Lebanon", "code": "LB", "id": "127"},
                                {"text": "Lesotho", "code": "LS", "id": "132"},
                                {"text": "Liberia", "code": "LR", "id": "131"},
                                {"text": "Libya", "code": "LY", "id": "136"},
                                {"text": "Liechtenstein", "code": "LI", "id": "129"},
                                {"text": "Lithuania", "code": "LT", "id": "133"},
                                {"text": "Luxembourg", "code": "LU", "id": "134"},
                                {"text": "Macau", "code": "MO", "id": "148"},
                                {"text": "Macedonia", "code": "MK", "id": "144"},
                                {"text": "Madagascar", "code": "MG", "id": "142"},
                                {"text": "Malawi", "code": "MW", "id": "156"},
                                {"text": "Malaysia", "code": "MY", "id": "158"},
                                {"text": "Maldives", "code": "MV", "id": "155"},
                                {"text": "Mali", "code": "ML", "id": "145"},
                                {"text": "Malta", "code": "MT", "id": "153"},
                                {"text": "Marshall Islands", "code": "MH", "id": "143"},
                                {"text": "Martinique", "code": "MQ", "id": "150"},
                                {"text": "Mauritania", "code": "MR", "id": "151"},
                                {"text": "Mauritius", "code": "MU", "id": "154"},
                                {"text": "Mayotte", "code": "YT", "id": "243"},
                                {"text": "Mexico", "code": "MX", "id": "157"},
                                {"text": "Micronesia, Federal State of", "code": "FM", "id": "73"},
                                {"text": "Moldova, Republic of", "code": "MD", "id": "139"},
                                {"text": "Monaco", "code": "MC", "id": "138"},
                                {"text": "Mongolia", "code": "MN", "id": "147"},
                                {"text": "Montenegro", "code": "ME", "id": "140"},
                                {"text": "Montserrat", "code": "MS", "id": "152"},
                                {"text": "Morocco", "code": "MA", "id": "137"},
                                {"text": "Mozambique", "code": "MZ", "id": "159"},
                                {"text": "Myanmar (Burma)", "code": "MM", "id": "146"},
                                {"text": "Namibia", "code": "NA", "id": "160"},
                                {"text": "Nauru", "code": "NR", "id": "169"},
                                {"text": "Nepal", "code": "NP", "id": "168"},
                                {"text": "Netherlands", "code": "NL", "id": "166"},
                                {"text": "New Caledonia", "code": "NC", "id": "161"},
                                {"text": "New Zealand", "code": "NZ", "id": "171"},
                                {"text": "Nicaragua", "code": "NI", "id": "165"},
                                {"text": "Niger", "code": "NE", "id": "162"},
                                {"text": "Nigeria", "code": "NG", "id": "164"},
                                {"text": "Niue", "code": "NU", "id": "170"},
                                {"text": "Norfolk Island", "code": "NF", "id": "163"},
                                {"text": "Northern Mariana Islands", "code": "MP", "id": "149"},
                                {"text": "Norway", "code": "NO", "id": "167"},
                                {"text": "Oman", "code": "OM", "id": "172"},
                                {"text": "Pakistan", "code": "PK", "id": "178"},
                                {"text": "Palau", "code": "PW", "id": "185"},
                                {"text": "Panama", "code": "PA", "id": "173"},
                                {"text": "Papua New Guinea", "code": "PG", "id": "176"},
                                {"text": "Paraguay", "code": "PY", "id": "186"},
                                {"text": "Peru", "code": "PE", "id": "174"},
                                {"text": "Philippines", "code": "PH", "id": "177"},
                                {"text": "Pitcairn Island", "code": "PN", "id": "181"},
                                {"text": "Poland", "code": "PL", "id": "179"},
                                {"text": "Portugal", "code": "PT", "id": "184"},
                                {"text": "Puerto Rico", "code": "PR", "id": "182"},
                                {"text": "Qatar", "code": "QA", "id": "187"},
                                {"text": "Reunion Island", "code": "RE", "id": "188"},
                                {"text": "Romania", "code": "RO", "id": "189"},
                                {"text": "Russian Federation", "code": "RU", "id": "190"},
                                {"text": "Rwanda", "code": "RW", "id": "191"},
                                {"text": "Saint Barthélemy", "code": "BL", "id": "26"},
                                {"text": "Saint Helena", "code": "SH", "id": "198"},
                                {"text": "Saint Kitts and Nevis", "code": "KN", "id": "120"},
                                {"text": "Saint Lucia", "code": "LC", "id": "128"},
                                {"text": "Saint Martin", "code": "MF", "id": "141"},
                                {"text": "Saint Vincent and the Grenadines", "code": "VC", "id": "234"},
                                {"text": "Samoa", "code": "WS", "id": "241"},
                                {"text": "San Marino", "code": "SM", "id": "203"},
                                {"text": "Sao Tome and Principe", "code": "ST", "id": "207"},
                                {"text": "Saudi Arabia", "code": "SA", "id": "192"},
                                {"text": "Senegal", "code": "SN", "id": "204"},
                                {"text": "Serbia", "code": "RS", "id": "50"},
                                {"text": "Seychelles", "code": "SC", "id": "194"},
                                {"text": "Sierra Leone", "code": "SL", "id": "202"},
                                {"text": "Singapore", "code": "SG", "id": "197"},
                                {"text": "Sint Maarten", "code": "SX", "id": "252"},
                                {"text": "Slovak Republic", "code": "SK", "id": "201"},
                                {"text": "Slovenia", "code": "SI", "id": "199"},
                                {"text": "Solomon Islands", "code": "SB", "id": "193"},
                                {"text": "Somalia", "code": "SO", "id": "205"},
                                {"text": "South Africa", "code": "ZA", "id": "244"},
                                {"text": "South Georgia", "code": "GS", "id": "90"},
                                {"text": "South Sudan", "code": "SS", "id": "253"},
                                {"text": "Spain", "code": "ES", "id": "68"},
                                {"text": "Sri Lanka", "code": "LK", "id": "130"},
                                {"text": "St. Pierre and Miquelon", "code": "PM", "id": "180"},
                                {"text": "State of Palestine", "code": "PS", "id": "183"},
                                {"text": "Sudan", "code": "SD", "id": "195"},
                                {"text": "Suriname", "code": "SR", "id": "206"},
                                {"text": "Svalbard and Jan Mayen Islands", "code": "SJ", "id": "200"},
                                {"text": "Swaziland", "code": "SZ", "id": "210"},
                                {"text": "Sweden", "code": "SE", "id": "196"},
                                {"text": "Switzerland", "code": "CH", "id": "42"},
                                {"text": "Syrian Arab Republic", "code": "SY", "id": "209"},
                                {"text": "Taiwan", "code": "TW", "id": "225"},
                                {"text": "Tajikistan", "code": "TJ", "id": "216"},
                                {"text": "Tanzania", "code": "TZ", "id": "226"},
                                {"text": "Thailand", "code": "TH", "id": "215"},
                                {"text": "Togo", "code": "TG", "id": "214"},
                                {"text": "Tokelau", "code": "TK", "id": "217"},
                                {"text": "Tonga", "code": "TO", "id": "220"},
                                {"text": "Trinidad and Tobago", "code": "TT", "id": "223"},
                                {"text": "Tunisia", "code": "TN", "id": "219"},
                                {"text": "Turkey", "code": "TR", "id": "222"},
                                {"text": "Turkmenistan", "code": "TM", "id": "218"},
                                {"text": "Turks and Caicos Islands", "code": "TC", "id": "211"},
                                {"text": "Tuvalu", "code": "TV", "id": "224"},
                                {"text": "Uganda", "code": "UG", "id": "228"},
                                {"text": "Ukraine", "code": "UA", "id": "227"},
                                {"text": "United Arab Emirates", "code": "AE", "id": "2"},
                                {"text": "United Kingdom", "code": "GB", "id": "77"},
                                {"text": "United States", "code": "US", "id": "230"},
                                {"text": "Uruguay", "code": "UY", "id": "231"},
                                {"text": "US Minor Outlying Islands", "code": "UM", "id": "229"},
                                {"text": "Uzbekistan", "code": "UZ", "id": "232"},
                                {"text": "Vanuatu", "code": "VU", "id": "239"},
                                {"text": "Venezuela", "code": "VE", "id": "235"},
                                {"text": "Vietnam", "code": "VN", "id": "238"},
                                {"text": "Virgin Islands (British)", "code": "VG", "id": "236"},
                                {"text": "Virgin Islands (USA)", "code": "VI", "id": "237"},
                                {"text": "Wallis and Futuna", "code": "WF", "id": "240"},
                                {"text": "Western Sahara", "code": "EH", "id": "66"},
                                {"text": "Yemen", "code": "YE", "id": "242"},
                                {"text": "Zambia", "code": "ZM", "id": "245"},
                                {"text": "Zimbabwe", "code": "ZW", "id": "246"}
                            ];

                        returnObject = country_list.filter(function (x) {
                            return x.code == inputVar;
                        });

                        return returnObject;
            */

        }


        /* =============== Find account ID by a given account number =============== */

        /*
     * MDIMKOV 15.06.2021: this function finds the account ID of a given G/L account by looking for its account number
     *
     * RETURNS: integer (the G/L account ID)
     *
     * USAGE: var recItem = findAccountByNumber(acctNum);
     *
     * */

        function findAccountByNumber(acctNum) {

            var returnId = 0;

            var accountSearchObj = search.create({
                type: 'account',
                filters:
                    [
                        ['number', 'is', acctNum]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'internalid',
                            sort: search.Sort.ASC
                        })
                    ]
            });

            var accountSearchResults = accountSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            try {
                if (accountSearchResults) {
                    returnId = accountSearchResults[0].getValue(accountSearchResults[0].columns[0]);
                }
            } catch (е) {
            }

            return returnId;

        }


        /* =============== Find list value (Id) by passing the text value and create a new list member, if it doesn't exist =============== */

        /*
     * MDIMKOV 20.06.2021:  this function accepts a text value that potentially exists in a List/Record;
     * 						if the text value if found, the id is returned (usefull in integrations)
     * 						if the text value is not found, the List/Record is being extended to include the new text value
     *
     * NOTE: this function works no matter of the drop-down is based on a custom list, a custom record or a custom segment
     *       if custom record is used, it needs to be one with INCLUDE NAME FIELD and the value need to be stored in the NAME field
     *
     * RETURNS: integer (the respective ID)
     *
     * INPUT: the text value to search for and the List/Record id (e.g. customlist_abc or customrecord_abc)
     *
     * USAGE: recCustomer.setValue('custentity_oro_21_book_brand', findListValue('IN PROGRESS', 'customlist_oro_21_saletype'));
     *
     * */

        function findListValue(value, listRecType) {

            var returnId = 0;

            var brandSearchObj = search.create({
                type: listRecType,
                filters:
                    [
                        ['name', 'is', value]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'internalid',
                            sort: search.Sort.ASC
                        })
                    ]
            });

            var brandSearchResults = brandSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            // MDIMKOV 20.06.2021: if result found, directly return it; otherwise, it needs to be created
            if (brandSearchResults[0]) {
                returnId = brandSearchResults[0].getValue(brandSearchResults[0].columns[0]);
            } else {
                var newListRec = record.create({
                    type: listRecType
                });

                newListRec.setValue('name', value);
                returnId = newListRec.save();
            }

            return returnId;

        }


        /* =============== Find list value (Id) by passing the text value and create a new list member, if it doesn't exist using Cache module =============== */

        /*
     * MDIMKOV 20.06.2021:  this function gets a text value that potentially exists in a List/Record;
     * 						if the text value if found, the id is returned (usefull in integrations)
     * 						if the text value is not found, the List/Record is being extended to include the new text value
     *                      the function makes use of the N/Cache module to save governance usage points
     *                      if the cache doesn't exist, it's being created (it has the same name as the listRecType value
     *                      the cache is being dropped every hour (ttl=60*60), to account for major list changes (record removed etc.)
     *                      if the text value is not found, it is also being added to the cache
     *                      if the [createIfMissing] is set to TRUE, the function will:
     *                          * add a new value to the record type
     *                          * get it's newly-created internal ID, add it to the Cache and pass it
     *
     * NOTE: this funcion works no matter of the drop-down is based on a custom list, a custom record or a custom segment
     *       if custom record is used, it needs to be one with INCLUDE NAME FIELD and the value need to be stored in the NAME field
     *
     * RETURNS: integer (the respective ID); 0 if no value was found in case you decide to not add it (createIfMissing=false)
     *
     * INPUT: the text value to search for and the List/Record id (e.g. customlist_abc or customrecord_abc); createIfMissing -- true/false
     *
     * USAGE: recCustomer.setValue('custentity_oro_21_book_brand', tvz.findListValue('IN PROGRESS', 'customlist_oro_21_saletype', true));
     *
     * */

        function findListValueCached(value, listRecType, createIfMissing) {

            var returnId = 0;

            // MDIMKOV 07.07.2021: initiate a CACHE with the name of the record/list/segment to be searched (prefixed with CACHE_)
            var listRecCache = cache.getCache({
                name: 'CACHE_' + listRecType.toUpperCase(),
                scope: cache.Scope.PUBLIC
            });

            log.debug('MDIMKOV', 'Cache loaded.');

            // MDIMKOV 08.07.2021: search for the value in question (e.g. 'Pending') -- note that the value is actually the key to search on
            returnId = listRecCache.get({
                key: value.toUpperCase() + '_KEY'
            }) || 0;

            log.debug('returnId-1', returnId);

            // MDIMKOV 08.07.2021: there is no entry in the Cache for this value -- we need to search the record for it
            if (!returnId) {


                log.debug('MDIMKOV', 'no entry found in cache');

                var recSearchObj = search.create({
                    type: listRecType,
                    filters:
                        [
                            ['name', 'is', value]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: 'internalid',
                                sort: search.Sort.ASC
                            })
                        ]
                });

                var recSearchResults = recSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });

                log.audit('recSearchResults[0]', recSearchResults[0]);

                // MDIMKOV 20.06.2021: if result found, add it to the Cache and directly return it
                if (recSearchResults[0]) {

                    log.debug('MDIMKOV', 'Search result found...');

                    returnId = recSearchResults[0].getValue(recSearchResults[0].columns[0]) || 0;

                    log.debug('returnId-2', returnId);

                    if (returnId) {
                        listRecCache.put({
                            key: value.toUpperCase() + '_KEY',
                            value: returnId,
                            ttl: 60 * 60 // one hour
                        });
                    }
                } else if (createIfMissing) { // otherwise, it needs to be created in the record and the Cache to be updated

                    log.debug('MDIMKOV', 'Add the value to the record and to the cache');

                    var newListRec = record.create({
                        type: listRecType
                    });

                    newListRec.setValue('name', value);
                    returnId = newListRec.save() || 0;

                    if (returnId) {
                        listRecCache.put({
                            key: value.toUpperCase() + '_KEY',
                            value: returnId,
                            ttl: 60 * 60 // one hour
                        });
                    }
                }

            }

            return returnId;

        }


        /* =============== Find the internal ID of a record by searching for its external ID =============== */

        /*
     * MDIMKOV 20.06.2021:  this function resolves a NetSuite internal ID from an external ID; in case record is not found, internalId=0 is being returned
     *
     * RETURNS: integer (the respective internal ID; 0 if not found)
     *
     * INPUT: the record type and the external ID
     *
     * USAGE: getRecIdbyExtId('customer', 123);
     *
     * */

        function getRecIdbyExtId(recordType, externalId) {

            var internalId = 0;

            var recordSearchObj = search.create({
                type: recordType,
                filters:
                    [
                        ['externalid', 'anyof', externalId]
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }


        /* =============== Find the currency internal ID by passing the currency ISO code =============== */

        /*
     * MDIMKOV 20.06.2021:  this function resolves the currency internal ID by passing the currency ISO code
     *
     * RETURNS: integer (the respective internal ID; 0 if not found)
     *
     * INPUT: the currency ISO code such as 'EUR' or 'USD'
     *
     * USAGE: currencyISOtoID('USD');
     *
     * */

        function currencyISOtoID(isoCode) {

            var theID = 0; //the internal ID that will be returned
            var mySearch = search.create({
                type: search.Type.CURRENCY,
                filters: [
                    search.createFilter({
                        name: 'symbol',
                        operator: search.Operator.IS,
                        values: isoCode
                    })
                ],
                columns: [
                    search.createColumn({name: 'name'})
                ]
            });

            var searchResults = mySearch.run().getRange({
                start: 0,
                end: 1
            });

            for (var i = 0; i < searchResults.length; i++) {
                theID = searchResults[i].id;
            }

            return theID;

        }


        /* =============== Convert a CSV file into a JSON content, so it can be used in a map/reduce script =============== */

        /*
     * MDIMKOV 20.06.2021:  this function converts a CSV file into a JSON content, so it can be used in a map/reduce script
     *
     * RETURNS: JSON object, uses the values in the first line (header values) as object keys! (e.g. myHeaderName : "123")
     *
     * INPUT: the file object with getContents()
     *
     * USAGE: var jsonCsv = csvFileToJSON(downloadedFile.getContents());
     *
     * */
        function csvFileToJSON(csv) {

            RegExp.escape = function (s) {
                return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            };


            function toArrays(csv) {
                var options = {};
                var config = {};
                config.separator = ',';
                config.delimiter = '"';

                var data = [];
                var options = {
                    delimiter: config.delimiter,
                    separator: config.separator,
                    start: options.start,
                    end: options.end,
                    state: {rowNum: 1, colNum: 1}
                };

                data = parse(csv, options);

                return data;

            }


            function parse(csv, options) {
                var separator = options.separator;
                var delimiter = options.delimiter;

                if (!options.state.rowNum) {
                    options.state.rowNum = 1;
                }
                if (!options.state.colNum) {
                    options.state.colNum = 1;
                }

                var data = [];
                var entry = [];
                var state = 0;
                var value = '';
                var exit = false;

                function endOfEntry() {
                    // reset the state
                    state = 0;
                    value = '';

                    // if 'start' hasn't been met, don't output
                    if (options.start && options.state.rowNum < options.start) {
                        // update global state
                        entry = [];
                        options.state.rowNum++;
                        options.state.colNum = 1;
                        return;
                    }


                    data.push(entry);

                    //console.log('entry:' + entry);

                    // cleanup
                    entry = [];

                    // if 'end' is met, stop parsing
                    if (options.end && options.state.rowNum >= options.end) {
                        exit = true;
                    }

                    // update global state
                    options.state.rowNum++;
                    options.state.colNum = 1;
                }

                function endOfValue() {

                    entry.push(value);

                    //console.log('value:' + value);
                    // reset the state
                    value = '';
                    state = 0;
                    // update global state
                    options.state.colNum++;
                }

                // escape regex-specific control chars
                var escSeparator = RegExp.escape(separator);
                var escDelimiter = RegExp.escape(delimiter);

                // compile the regEx str using the custom delimiter/separator
                var match = /(D|S|\n|\r|[^DS\r\n]+)/;
                var matchSrc = match.source;
                matchSrc = matchSrc.replace(/S/g, escSeparator);
                matchSrc = matchSrc.replace(/D/g, escDelimiter);
                match = RegExp(matchSrc, 'gm');

                // put on your fancy pants...
                // process control chars individually, use look-ahead on non-control chars
                csv.replace(match, function (m0) {
                    if (exit) {
                        return;
                    }
                    switch (state) {
                        // the start of a value
                        case 0:
                            // null last value
                            if (m0 === separator) {
                                value += '';
                                endOfValue();
                                break;
                            }
                            // opening delimiter
                            if (m0 === delimiter) {
                                state = 1;
                                break;
                            }
                            // null last value
                            if (m0 === '\n') {
                                endOfValue();
                                endOfEntry();
                                break;
                            }
                            // phantom carriage return
                            if (/^\r$/.test(m0)) {
                                break;
                            }
                            // un-delimited value
                            value += m0;
                            state = 3;
                            break;

                        // delimited input
                        case 1:
                            // second delimiter? check further
                            if (m0 === delimiter) {
                                state = 2;
                                break;
                            }
                            // delimited data
                            value += m0;
                            state = 1;
                            break;

                        // delimiter found in delimited input
                        case 2:
                            // escaped delimiter?
                            if (m0 === delimiter) {
                                value += m0;
                                state = 1;
                                break;
                            }
                            // null value
                            if (m0 === separator) {
                                endOfValue();
                                break;
                            }
                            // end of entry
                            if (m0 === '\n') {
                                endOfValue();
                                endOfEntry();
                                break;
                            }
                            // phantom carriage return
                            if (/^\r$/.test(m0)) {
                                break;
                            }
                            // broken paser?
                            throw new Error('CSVDataError: Illegal State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');

                        // un-delimited input
                        case 3:
                            // null last value
                            if (m0 === separator) {
                                endOfValue();
                                break;
                            }
                            // end of entry
                            if (m0 === '\n') {
                                endOfValue();
                                endOfEntry();
                                break;
                            }
                            // phantom carriage return
                            if (/^\r$/.test(m0)) {
                                break;
                            }
                            if (m0 === delimiter) {
                                // non-compliant data
                                throw new Error('CSVDataError: Illegal Quote [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                            }
                            // broken parser?
                            throw new Error('CSVDataError: Illegal Data [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                        default:
                            // shenanigans
                            throw new Error('CSVDataError: Unknown State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                    }
                    //console.log('val:' + m0 + ' state:' + state);
                });

                // submit the last entry
                // ignore null last line
                if (entry.length !== 0) {
                    endOfValue();
                    endOfEntry();
                }

                return data;
            }

            var lines = [];
            var linesArray = csv.split('\r\n');
            if (linesArray.length === 1) { // if it couldn't split with the \r\n ending, so it's still 1 line, so it's probably the \r ending only
                linesArray = csv.split('\r');
            }
            if (linesArray.length === 1) { // if it couldn't split with the \r ending, so it's still 1 line, so it's probably the \n ending only
                linesArray = csv.split('\n');
            }

            // fix broken cells: some lines were broken although they were part of a cell (were within double quotes) -- glue them back together
            var linesArrayFinal = [];
            var finalLine = '';
            for (var t = 0; t < linesArray.length; t++) {
                finalLine += linesArray[t];
                var quoteCount = (finalLine.match(/"/g) || []).length; // check how many double quotes exist in the current line
                if (quoteCount % 2 === 0) { // even number of quotes => line is OK => push it
                    linesArrayFinal.push(finalLine);
                    finalLine = '';
                } else { // odd number of quotes, do not push the line but concatenate it with the next one and add a new line between them
                    finalLine += '\n';
                }
            }

            // for trimming and deleting extra space
            for (var m = 0; m < linesArrayFinal.length; m++) {
                var row = linesArrayFinal[m].replace(/[\s]+[,]+|[,]+[\s]+/g, ',').trim();
                if (row) { // prevents adding an empty / blank line
                    lines.push(row);
                }
            }

            log.debug('linesArrayFinal', linesArrayFinal);
            log.debug('lines', lines);

            var result = [];
            var headers = toArrays(lines[0])[0];

            for (var i = 1; i < lines.length; i++) {

                var obj = {};
                var currentline = toArrays(lines[i])[0];
                log.debug('currentline', currentline);

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }

            log.audit('result', result);
            return result;
        }


        /* =============== Find the document number (tranid) for a transaction by passing its internal id =============== */

        /*
     * MDIMKOV 20.07.2021: this function returns the document number (tranid) on a transaction by passing the transaction internal id to it
     *
     * RETURNS: string (such as 'ORD55839')
     *
     * INPUT: the transaction internal ID
     *
     * USAGE: transInternalIdToDocumentNum(23564);
     *
     * */

        function transInternalIdToDocumentNum(internalId) {

            var docNum = '';

            if (internalId) {

                var lookUpTransaction = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: internalId,
                    columns: ['tranid']
                });

            }

            if (lookUpTransaction) {
                docNum = lookUpTransaction.tranid;
            }

            return docNum;

        }


        /* =============== Find the transaction internal ID by passing the document number (tranid) =============== */

        /*
     * MDIMKOV 16.06.2024: this function returns the transaction internal ID by passing the document number (tranid)
     *
     * RETURNS: internal ID (e.g. 694839)
     *
     * INPUT: the transaction document number (e.g., VENDBILL11970)
     *
     * USAGE: transDocumentNumToInternlId('VENDBILL11970');
     *
     * */

        function transDocumentNumToInternlId(docNum) {
            return singleRecordSearch('transaction',
                [["numbertext", "is", docNum],
                    "AND",
                    ["mainline", "is", "T"]],
                'internalid');
        }


        /* =============== Find the transaction NetSuite ID based on a given document number =============== */

        /*
     * MDIMKOV 18.09.2023: this function returns the internal id on a transaction by passing the document number (tranid)
     *
     * RETURNS: integer (the NetSuite internal ID)
     *
     * INPUT: string (the transaction tranid)
     *
     * USAGE: docNumToTransIntId(SO843292); //=> 23564
     *
     * */

        function docNumToTransIntId(docNumber) {

            return singleRecordSearch('transaction', [['numbertext', 'is', docNumber], 'AND', ['mainline', 'is', 'T']], 'internalid');

        }


        /* =============== Find the unit of measure ID by passing item ID and unit of measure code =============== */

        /*
     * MDIMKOV 04.08.2021: this function returns the unit of measure ID by passing item ID and unit of measure code
     *                     the item ID needed, as unit codes may not be unique among base unit types
     *
     * RETURNS: the unit of measure ID, integer, such as 3365
     *
     * INPUT: the item ID and the unit of measure code
     *
     * USAGE: getUnitIdByItemIdAndCode(5594, 'pack');
     *
     * */

        function getUnitIdByItemIdAndCode(itemId, unitCode) {

            var returnId = 0;

            if (itemId && unitCode) {

                // MDIMKOV 04.08.2021: get the primary units type
                var lookUpItem = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemId,
                    columns: ['unitstype']
                });

            }

            if (lookUpItem) {

                var primaryUnitTypeId = 0;

                try {
                    primaryUnitTypeId = lookUpItem.unitstype[0].value;
                } catch (e) {
                }

                if (primaryUnitTypeId) {
                    // MDIMKOV 04.08.2021: load the primary unit type with its unit types and search for the matching code
                    var recUOM = record.load({
                        type: record.Type.UNITS_TYPE,
                        id: primaryUnitTypeId,
                        isDynamic: true
                    });

                    var iLineCount = recUOM.getLineCount({sublistId: 'uom'});

                    for (var i = 0; i < iLineCount; i++) {

                        recUOM.selectLine({
                            sublistId: 'uom',
                            line: i
                        });

                        var uomAbbreviation = recUOM.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'abbreviation',
                            line: i
                        });

                        if (uomAbbreviation === unitCode) {

                            var uomId = recUOM.getSublistValue({
                                sublistId: 'uom',
                                fieldId: 'internalid',
                                line: i
                            });

                            if (uomId) {
                                returnId = uomId;
                            }

                            break;

                        }
                    }
                }
            }

            return returnId;

        }


        /* =============== Find the document number (tranid) for a transaction by passing its internal id =============== */

        /*
     * MDIMKOV 09.08.2021: this function returns a string with the date and time stamp -- to be used as a suffix for file names
     *
     * RETURNS: string such as '2021-08-07-13:43:34' (to be used as file name suffix)
     *
     * INPUT: none
     *
     * USAGE: var fileName = 'SO_' + dateTimeStampForFileName() + '.csv';
     *
     * */

        function dateTimeStampForFileName() {

            function formatTimes() {

                var today = new Date()
                var now = new Date(today.getTime() + (today.getTimezoneOffset() * 60 * 1000));

                var day = now.getDate();
                if (day < 10) day = '0' + day;

                var month = now.getMonth() + 1;
                if (month < 10) month = '0' + month;

                year = now.getFullYear();

                var hours = now.getHours();
                if (hours < 10) hours = '0' + hours;

                var minutes = now.getMinutes();
                if (minutes < 10) minutes = '0' + minutes;

                var seconds = now.getSeconds();
                if (seconds < 10) seconds = '0' + seconds;

                return {
                    'year': year,
                    'month': month,
                    'day': day,
                    'hours': hours,
                    'minutes': minutes,
                    'seconds': seconds
                };
            }

            var dateAndTimeData = formatTimes();
            return `${dateAndTimeData.year}_${dateAndTimeData.month}_${dateAndTimeData.day}_${dateAndTimeData.hours}_${dateAndTimeData.minutes}_${dateAndTimeData.seconds}`;

        }


        /* =============== Find the shipping method id by passing its full name =============== */

        /*
     * MDIMKOV 17.08.2021:  this function resolves a NetSuite internal ID from an external ID for a shipping method; zero is returned if not found
     *
     * RETURNS: integer (the respective internal ID; 0 if not found)
     *
     * INPUT: the shipping method name (string)
     *
     * USAGE: findShippingMethodId('truck');
     *
     * */

        function findShippingMethodId(shipMethodName) {

            var internalId = 0;

            var recordSearchObj = search.create({
                type: 'shipitem',
                filters:
                    [
                        ['itemid', 'is', shipMethodName]
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }


        /* =============== Return the names (e.g. John Smith) of the currently logged-in user =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns the names of the currently logged-in user (e.g. John Smith)
     *
     * RETURNS: string
     *
     * INPUT: none
     *
     * USAGE: getCurrentUserNames();
     *
     * */

        function getCurrentUserNames() {
            var userObj = runtime.getCurrentUser();
            return userObj.name;
        }


        /* =============== Return the id (e.g. 113) of the currently logged-in user =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns the id of the currently logged-in user (e.g. 113)
     *
     * RETURNS: integer
     *
     * INPUT: none
     *
     * USAGE: getCurrentUserId();
     *
     * */

        function getCurrentUserId() {
            var userObj = runtime.getCurrentUser();
            return userObj.id;
        }


        /* =============== Return the role name (e.g. administrator) of the currently logged-in user =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns the role name of the currently logged-in user (e.g. administrator)
     *
     * RETURNS: string
     *
     * INPUT: none
     *
     * USAGE: getCurrentUserRole(); // -> administrator
     *
     * */

        function getCurrentUserRole() {
            var userObj = runtime.getCurrentUser();
            return userObj.roleId;
        }


        /* =============== Return the role id (e.g. 3) of the currently logged-in user =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns the role id of the currently logged-in user (e.g. 3)
     *
     * RETURNS: integer
     *
     * INPUT: none
     *
     * USAGE: getCurrentUserRoleId(); // -> 3
     *
     * */

        function getCurrentUserRoleId() {
            var userObj = runtime.getCurrentUser();
            return userObj.role;
        }


        /* =============== Return the email address of the currently logged-in user =============== */

        /*
     * MDIMKOV 27.06.2024:  this function returns the email address of the currently logged-in user (e.g. mdimkov@hotmail.com)
     *
     * RETURNS: string
     *
     * INPUT: none
     *
     * USAGE: getCurrentUserEmailAddress(); // -> 'mdimkov@hotmail.com'
     *
     * */

        function getCurrentUserEmailAddress() {
            var userObj = runtime.getCurrentUser();
            return userObj.email;
        }


        /* =============== For SuiteTax transactions: go through the transaction lines and re-calculate net amounts from gross amounts =============== */

        /*
     * MDIMKOV 22.10.2021: since SuiteTax cannot calculate net amounts from gross amounts, this function iterates through trans lines and does that
     *  what this function does is the following:
     *   - expects the gross amount to be entered into the transaction's net amount field
     *   - once the transaction is saved, the amount is being used in combination with the already assigned tax percentage to reverse-calculate the net amount
     *   - =1= the gross amount that was initially saved in the net amount field is being replaced with the calculated net amount
     *   - =2= the rate field is being adjusted respectively, when the [adjustRate] parameter is being set to true
     *   - =3= the shipping surcharge is also being re-calculated with the respective net amount on the Shipping tab if the [adjustShippingValue] is set to true
     *   - =4= the cart discount on the transaction (the main discount) is implemented as follows: the native cart discount will be removed and it will be split through the lines by adding line discounts; also, this is fully based on the [additionalAmountFieldId] and the [originalAmountFieldId], as the discount amount added to each line will be the difference between the respectie line amount and the amount in the [additionalAmountFieldId]; note that cart discount cannot be used in conjunction with line discounts; if a line discount is detected, the cart discount functionality will not be triggered
     *   - =5= for line discounts: just make sure the [CALCULATE TAX BEFORE DISCOUNT IS APPLIED] is ticked in NetSuite; the line discount itself is always gross amount
     *   - =6= since sometimes the resulting gross amount has 0.01 cent difference, compare it to either the original gross amount or to the additional gross amount (custom columns) and fix rounding through tax details override
     *   - =7- since sometimes despite line roundings the total transaction gross amount has a rounding difference, compare the transaction gross total to a given (from outside) total and fix overall rounding by adjusting the tax base for the first tax detail line
     *   - =8= call the main function a second time in case cart discount is being used (as it creates new discount lines that need to be re-iterated)
     *
     * RETURNS: void
     *
     * INPUT: the record context; this function needs to be executed in a UE afterSubmit event
     *
     * USAGE: lib.suiteTaxGrossToNetAmounts(...) // for more information see the parameters descriptions below
     *
     * */

        function suiteTaxGrossToNetAmounts(
            context,                            // this is the context that is passed in the afterSubmit of the UE script
            sublistId,                          // the sublist id, for which the adjustments will be performed, normally 'item'
            processedLineFieldId,               // line checkbox field id, marking the line as already processed, so it doesn't reiterate next time; normally 'custcol_st_processed'
            processedShippingFieldId,           // body checkbox field id, marking the shipping amount as already processed, so it doesn't reiterate, normally 'custbody_st_processedship'
            adjustRate,                         // true / false -- defining if the rate on the line needs to be adjusted as well, as otherwise the amount on the line will not be quantity * rate (normally set to true)
            adjustShippingValue,                // true / false -- defining if shipping value will be subject to GTNA
            adjustCartDiscount,                 // true / false -- defining if cart discount will be processed; if yes, the native cart discount will be removed and it will be split through the lines by adding line discounts; also, this is fully based on the [additionalAmountFieldId], as the discount amount added to each line will be the difference between the respective line amount in the [originalAmountFieldId] and the amount in the [additionalAmountFieldId]; note that cart discount cannot be used in conjunction with line discounts; if a line discount is detected, the cart discount functionality will not be triggered
            adjustLineDiscounts,                // true / false -- defining if line discounts will be subject to GTNA
            applyRoundingWithTaxDetailOverride, // true / false -- defining if roundings will be adjusted; in this case, the [Tax Details Override] will be auto-enabled, if needed; this also works in conjunction with the next 2 fields
            originalAmountFieldId,              // line field id -- used mainly for rounding; this field will hold the initial amount entered (the initial gross amount that the whole calculation is based to), so that the resulting gross amount can be compared with this one, normally 'custcol_st_originalamount'
            additionalAmountFieldId,            // line field id -- used mainly for rounding, to works around issues with line discounts; if the third-party system can provide the gross amount after discount, make it enter it in this column; this way a comparison for line-discounted items can be achieved, which is impossible with the previous field, normally 'custcol_st_additionalamount'
            applyGlobalRounding,                // true / false -- for final, global transaction rounding, defines if the transaction total should be checked agaist the amount in the [globalAmountFieldId] and, if any slight difference exists, it will be applied to the first line of the tax details, to offset the final full amount, so everything matches perfectly
            globalAmountFieldId                 // body field id -- used to stamp the final gross total from the third-party system; if the [applyGlobalRounding] is set to true, the amount stamped here is being compared to the final gross transaction total and, if any slight difference exists, it will be applied to the first line of the tax details, to offset the final full amount; normally 'custbody_st_totalgrossamt'
        ) {

            // MDIMKOV 22.04.2022: this is the very main function that does the main line processing and adjust the shipping; it's fractored in an own function, as it also needs to be called a second time in case cart discount is being used (as it creates new discount lines that need to be re-iterated)
            function mainLineProcessingAndShippingAdjustment(context, adjustLineDiscounts, sublistId, processedLineFieldId, originalAmountFieldId, adjustShippingValue, processedShippingFieldId) {

                const newRec = context.newRecord;
                const transId = newRec.id;

                if (transId && sublistId && processedLineFieldId) {

                    // MDIMKOV 22.10.2021: go through the transaction lines and set the net amounts based on the amount already there and the tax code
                    var recTrans = record.load({
                        type: newRec.type,
                        id: transId,
                        isDynamic: false
                    });
                    const tranNum = recTrans.getValue('otherrefnum') ? recTrans.getValue('otherrefnum') : recTrans.getValue('tranid');
                    log.audit('MDIMKOV', 'processing transaction: ' + tranNum);

                    // MDIMKOV 31.12.2021: iterate through lines, check if the record was already processed or not and find the tax details reference
                    const iLineCount = recTrans.getLineCount({sublistId: sublistId});
                    var previousTdRef = ''; // used later for discount lines
                    for (let i = 0; i < iLineCount; i++) {
                        let isProcessed = recTrans.getSublistValue({
                            sublistId: sublistId,
                            fieldId: processedLineFieldId,
                            line: i
                        });
                        log.debug('isProcessed', 'line is processed: ' + isProcessed + ' (line #' + i + ') -------------------');
                        let tdRef = recTrans.getSublistValue({ // get the tax details reference from the line
                            sublistId: sublistId,
                            fieldId: 'taxdetailsreference',
                            line: i
                        });
                        if (!isProcessed) {
                            log.debug('tdRef', 'tdRef is: ' + tdRef);
                        }

                        // MDIMKOV 31.12.2021: find the line type, as general lines and discount lines are handled in a different way
                        const lineType = recTrans.getSublistValue({ // get the tax details reference from the line
                            sublistId: sublistId,
                            fieldId: 'itemtype',
                            line: i
                        });

                        // MDIMKOV 31.12.2021: in case the current line is a discount line, the tdRef (tax reference id) needs to be set to the tdRef from previous line
                        if (lineType == 'Discount') {
                            tdRef = previousTdRef;
                            lineDiscountExists = true; // used later in cart discounts; if a line discount exists, cart discounts are not processed
                            if (!isProcessed) {
                                log.debug('tdRef', 'this is a discount line, so the tdRef is now set to the previous line tdRef: ' + tdRef);
                            }

                            // MDIMKOV 31.12.2021: in case the line discounts should not be processed at all (adjustLineDiscounts=false), fully skip this line
                            if (!adjustLineDiscounts) {
                                continue;
                            }
                        }

                        // MDIMKOV 18.12.2021: only process transaction lines that were not processed so far
                        if (!isProcessed) {
                            log.audit('MDIMKOV', '... proceed with general-line calculations (line #' + i + ')');
                            let initialNetAmount = recTrans.getSublistValue({ // get the tax details reference from the line
                                sublistId: sublistId,
                                fieldId: 'amount',
                                line: i
                            });

                            // MDIMKOV 17.03.2022: stamp the original amount in the resp. custom field; will be potentially used later for fixing rounding discrepancies
                            if (originalAmountFieldId && initialNetAmount) {
                                recTrans.setSublistValue({
                                    sublistId: sublistId,
                                    fieldId: originalAmountFieldId,
                                    line: i,
                                    value: initialNetAmount
                                });
                            }

                            // MDIMKOV 22.10.2021: now that the tax details reference is known, get the tax rate from the tax details subtab
                            let taxRate = 0; // the tax rate that will be accumulated while iterating through tax details for the respective item line
                            const tdLineCount = recTrans.getLineCount({sublistId: 'taxdetails'});
                            for (var j = 0; j < tdLineCount; j++) {
                                let targetTdRef = recTrans.getSublistValue({
                                    sublistId: 'taxdetails',
                                    fieldId: 'taxdetailsreference',
                                    line: j
                                });
                                // MDIMKOV 01.04.2022: iterate through tax details and find all references, keeping in mind more than one tax detail line may exist for each item line => tax rate will have to be accumulated
                                if (targetTdRef === tdRef) {
                                    log.debug('targetTdRef', 'targetTdRef found (line #' + i + ')');
                                    let taxPartialRate = recTrans.getSublistValue({
                                        sublistId: 'taxdetails',
                                        fieldId: 'taxrate',
                                        line: j
                                    });
                                    log.debug('taxPartialRate', 'taxPartialRate: ' + taxPartialRate + ' (line #' + i + ')');

                                    taxRate = taxRate + parseFloat(taxPartialRate);
                                    log.audit('taxRate', 'taxRate accumulated so far: ' + taxRate + ' (line #' + i + ')');
                                }
                            } // end of looping through tax detail lines

                            // MDIMKOV 01.04.2022: now that the total tax rate needed was accumulated through the Tax Details lines, proceed with adjusting the item amounts
                            if (taxRate && initialNetAmount) { // the initial net amount is actually the gross amount

                                // MDIMKOV 22.10.2021: =1= re-calculate the net amount, set it and set the record as processed
                                log.debug('MDIMKOV', 'Proceed with case =1= (line #' + i + ')');
                                let grossAmount = initialNetAmount;
                                log.debug('grossAmount', grossAmount);

                                let netAmount = 100 * grossAmount / (100 + taxRate);
                                log.debug('netAmount', 'netAmount' + netAmount);

                                // MDIMKOV 25.11.2021: adjust the net amount by replacing the gross value with the net value (for discount lines this needs to be the rate, not the amount)
                                if (lineType != 'Discount') {
                                    recTrans.setSublistValue({
                                        sublistId: sublistId,
                                        fieldId: 'amount',
                                        line: i,
                                        value: netAmount
                                    });
                                } else {
                                    recTrans.setSublistValue({
                                        sublistId: sublistId,
                                        fieldId: 'rate',
                                        line: i,
                                        value: netAmount
                                    });
                                }

                                // MDIMKOV 25.11.2021: =2= if requested, adjust the rate amount by dividing the net amount by the quantity (ignore discount lines)
                                if (adjustRate && lineType != 'Discount') {
                                    let quantity = recTrans.getSublistValue({
                                        sublistId: sublistId,
                                        fieldId: 'quantity',
                                        line: i
                                    });
                                    if (quantity) {
                                        recTrans.setSublistValue({
                                            sublistId: sublistId,
                                            fieldId: 'rate',
                                            line: i,
                                            value: netAmount / quantity
                                        });
                                    }
                                }

                                // MDIMKOV 25.11.2021: set the line as processed
                                recTrans.setSublistValue({
                                    sublistId: sublistId,
                                    fieldId: processedLineFieldId,
                                    line: i,
                                    value: true
                                });

                            } else if (taxRate === 0 && initialNetAmount) {

                                // MDIMKOV 23.12.2021: in some cases we have a valid tax of 0%
                                log.debug('MDIMKOV', 'tax rate is 0%, so just set the line as processed (line #' + i + ')');
                                recTrans.setSublistValue({
                                    sublistId: sublistId,
                                    fieldId: processedLineFieldId,
                                    line: i,
                                    value: true
                                });
                            }
                        }
                        // MDIMKOV 31.12.2021: before navigating to the next line, save the tax details reference; will be used if next line is a discount line
                        previousTdRef = tdRef;
                    }

                    // MDIMKOV 25.11.2021: =3= if the [adjustShippingValue] is set to true, proceed with adjusting the shipping rate (replace gross with net)
                    if (adjustShippingValue && processedShippingFieldId && recTrans) {
                        let isShippingProcessed = recTrans.getValue(processedShippingFieldId);
                        if (!isShippingProcessed) {
                            log.audit('MDIMKOV', '');
                            log.audit('MDIMKOV', '=3= Proceed with shipping value adjustment...');

                            // MDIMKOV 22.10.2021: get the shipping tax rate from the tax details subtabng rate, which will be used in subsequent cases (not directly here)
                            let shippingTaxRate = '';
                            let taxLineCount = recTrans.getLineCount({sublistId: 'taxdetails'});
                            for (var k = 0; k < taxLineCount; k++) {

                                // MDIMKOV 25.11.2021: if the line type is [Shipping], this is the shipping rate; note it for later (used in next cases, not here)
                                var lineType = recTrans.getSublistValue({
                                    sublistId: 'taxdetails',
                                    fieldId: 'linetype',
                                    line: k
                                });
                                if (lineType == 'Shipping') {
                                    shippingTaxRate = recTrans.getSublistValue({
                                        sublistId: 'taxdetails',
                                        fieldId: 'taxrate',
                                        line: k
                                    });
                                }
                            }
                            log.debug('shippingTaxRate', shippingTaxRate);

                            // MDIMKOV 25.11.2021: get the currently stamped shipping tax rate and calculate the net amount of it by using the shipping rate just found
                            let shippingGrossRate = recTrans.getValue('shippingcost');
                            let shippingNetRate = 0;
                            if (shippingGrossRate) {
                                shippingNetRate = 100 * shippingGrossRate / (100 + shippingTaxRate);
                            }

                            // MDIMKOV 25.11.2021: if the net shipping rate was calculated, replace the current value with the newly-calculated one
                            if (shippingNetRate) {
                                recTrans.setValue('shippingcost', shippingNetRate);
                            }

                            // MDIMKOV 25.11.2021: declare the shipping conversion as done (tick the checkbox)
                            recTrans.setValue(processedShippingFieldId, true);
                        }
                    }
                }

                // MDIMKOV 19.12.2021: finally, save the transaction
                recTrans.save();
            }

            // MDIMKOV 19.12.2021: this is executed afterSubmit => do not execute if the user event type is DELETE
            if (context.type === context.UserEventType.DELETE) {
                return;
            }

            const newRec = context.newRecord;
            const transId = newRec.id;
            let lineDiscountExists = false;


            // MDIMKOV 22.04.2022: proceed with main line processing and, potentially, shipping rate adjustment:
            log.audit('MDIMKOV', '');
            log.audit('MDIMKOV', '=1= Proceed with script');
            mainLineProcessingAndShippingAdjustment(context, adjustLineDiscounts, sublistId, processedLineFieldId, originalAmountFieldId, adjustShippingValue, processedShippingFieldId);


            // MDIMKOV 17.03.2022: if fixing rounding differences is enabled, check the lines again and apply the differences
            // this is done by enabling [Tax Details Override] on the [Tax Details] subtab and adding tax rates for each tax reference line
            if (applyRoundingWithTaxDetailOverride && (originalAmountFieldId || additionalAmountFieldId)) {
                log.audit('MDIMKOV', '');
                log.audit('MDIMKOV', '=6= Proceed with fixing line roundings / tax details override');

                // MDIMKOV 17.03.2022: check if rounding needed on any of the lines; if not, leave the function
                let isTaxDetailsOverrideEnabled = false;
                const recRoundTrans = record.load({
                    type: newRec.type,
                    id: transId,
                    isDynamic: true
                });

                const iLineCount = recRoundTrans.getLineCount({sublistId: sublistId});

                for (let k = 0; k < iLineCount; k++) {
                    const originalGrossAmount = recRoundTrans.getSublistValue({
                        sublistId: sublistId,
                        fieldId: originalAmountFieldId ? additionalAmountFieldId : originalAmountFieldId,
                        line: k
                    });

                    // MDIMKOV 31.12.2021: find the line type, as discount lines need to be ignored here
                    const lineType = recRoundTrans.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'itemtype',
                        line: k
                    });

                    if (lineType != 'Discount') {

                        // MDIMKOV 17.03.2022: get the tax details reference from the line
                        let tdRef = recRoundTrans.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'taxdetailsreference',
                            line: k
                        });

                        // MDIMKOV 17.03.2022: iterate through tax details lines until you find the respective one and adjust the tax amount by the rounding difference
                        const tdLineCount = recRoundTrans.getLineCount({sublistId: 'taxdetails'});
                        for (let m = 0; m < tdLineCount; m++) {

                            recRoundTrans.selectLine({
                                sublistId: 'taxdetails',
                                line: m
                            });

                            const targetTdRef = recRoundTrans.getCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxdetailsreference'
                            });

                            if (targetTdRef === tdRef) { // iterate tax details until reference found

                                // MDIMKOV 17.03.2022: get the original tax amount that used to be set by SuiteTax (in the next step it will be adjusted by the rounding difference)
                                const taxAmount = recRoundTrans.getCurrentSublistValue({
                                    sublistId: 'taxdetails',
                                    fieldId: 'taxamount'
                                });

                                const taxBasis = recRoundTrans.getCurrentSublistValue({
                                    sublistId: 'taxdetails',
                                    fieldId: 'taxbasis'
                                });

                                const calculatedGrossAmount = taxBasis + taxAmount;

                                const lineRoundingDifference = originalGrossAmount - calculatedGrossAmount;
                                log.audit('MDIMKOV', ' ... lineRoundingDifference: ' + lineRoundingDifference);

                                if (lineRoundingDifference > -0.05 && lineRoundingDifference < 0.05 && lineRoundingDifference != 0) { // check for discrepancies of up to +/- 5 cents

                                    // MDIMKOV 17.03.2022: enable the [Tax Details Override] field on [Tax Details] subtab, if not already enabled
                                    if (!isTaxDetailsOverrideEnabled) {
                                        log.audit('MDIMKOV', ' ... enable tax details override');
                                        recRoundTrans.setValue('taxdetailsoverride', true);
                                        isTaxDetailsOverrideEnabled = true;
                                    }

                                    // MDIMKOV 17.03.2022: adjust the tax amount by the rounding difference
                                    recRoundTrans.setCurrentSublistValue({
                                        sublistId: 'taxdetails',
                                        fieldId: 'taxamount',
                                        value: taxAmount + lineRoundingDifference
                                    });

                                }

                                recRoundTrans.commitLine({
                                    sublistId: 'taxdetails'
                                });
                            }
                        }
                    }
                }
                recRoundTrans.save();
            }


            // MDIMKOV 21.04.2022: =4= if the [adjustCartDiscount] is set to true, the native cart discount will be removed and it will be split through the lines by adding line discounts; also, this is fully based on the [additionalAmountFieldId], as the discount amount added to each line will be the difference between the respectie line amount and the amount in the [additionalAmountFieldId]
            if (adjustCartDiscount && !lineDiscountExists && originalAmountFieldId && additionalAmountFieldId) { // only proceed if no line discount exists so far; also prevents from re-triggering
                log.audit('MDIMKOV', '');
                log.audit('MDIMKOV', '=4= Proceed with applying the cart discount');

                // MDIMKOV 21.04.2022: load the transaction again, remove the cart disount and save it again (as we need to start off with a non-cart-discounted transaction)
                log.audit('MDIMKOV', ' ... remove the cart discount fully');
                const recRemoveCartDiscountTrans = record.load({
                    type: newRec.type,
                    id: transId,
                    isDynamic: true
                });

                if (recRemoveCartDiscountTrans.getValue('discountrate')) { // only proceed if there's a discount rate set

                    recRemoveCartDiscountTrans.setValue('discountitem', '');
                    recRemoveCartDiscountTrans.setValue('discountrate', '');
                    recRemoveCartDiscountTrans.save();


                    // MDIMKOV 21.04.2022: add line discount items accounting for the difference between actual amount and discounted amount in the [additionalAmountFieldId] field
                    log.audit('MDIMKOV', ' ... proceed with adding discount lines for each line item');
                    const recCartDiscountTrans = record.load({
                        type: newRec.type,
                        id: transId,
                        isDynamic: true
                    });

                    const iLineCount = recCartDiscountTrans.getLineCount({sublistId: sublistId});
                    for (let i = iLineCount; i >= 1; i--) {
                        log.audit('MDIMKOV', ' ... ... check if discount needs to be inserted for line ' + i);

                        // MDIMKOV 22.04.2022: make sure that the [original amount] and [additional amount] fields were populated, as the discount amount will be the difference between them
                        const originalAmount = recCartDiscountTrans.getSublistValue({
                            sublistId: sublistId,
                            fieldId: originalAmountFieldId,
                            line: i - 1 // checks the line before the the discount line, i.e. the real item line
                        });

                        const additionalAmount = recCartDiscountTrans.getSublistValue({
                            sublistId: sublistId,
                            fieldId: additionalAmountFieldId,
                            line: i - 1 // checks the line before the the discount line, i.e. the real item line
                        });

                        // MDIMKOV 22.04.2022: ignore the iteration (do not insert a discount line) if there is no proper difference to add
                        if (additionalAmount - originalAmount == 0) {
                            log.audit('MDIMKOV', ' ... ... ... no, continue iteration');
                            continue;
                        }
                        log.audit('MDIMKOV', ' ... ... ... yes, proceed with inserting discount line for line ' + i);

                        // MDIMKOV 07.06.2022: the next block checks the amount to be added on the discount line. It also works around a scenario where the gross amount to be discounted is more than the net original price
                        // for example: item line has gross amount of EUR 1.00, which was earlier calculated to 0.93 (9% tax); trying to fully discount it with 1 EUR (stamping 1 EUR on the discount line before it is converted to net amount
                        // will lead to a negative total amount, should this be the only item line on the transaction; as such, the following trick is implemented:
                        // 1) calculate the amount to be discounted 2) calculate the absolute value of it (as if it's a mark-up, instead of a discount) 3) add the discount line (with the positive amount) 4) finally, all discounts need to be set as negative
                        const amountToDiscount = Math.abs(additionalAmount - originalAmount);

                        recCartDiscountTrans.insertLine({
                            sublistId: sublistId,
                            line: i,
                        });

                        recCartDiscountTrans.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'item',
                            value: getItemIdByName('Discount')
                        });
                        recCartDiscountTrans.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'rate',
                            value: amountToDiscount
                        });

                        recCartDiscountTrans.commitLine({
                            sublistId: sublistId
                        });
                    }
                    recCartDiscountTrans.save();


                    // MDIMKOV 22.04.2022: proceed with main line processing again, as the newly-added discount lines need to be re-iterated for GTNA processing
                    log.audit('MDIMKOV', '');
                    log.audit('MDIMKOV', '=8= Proceed with script re-iterating the lines, so that newly-created Discount lines can be adjusted');
                    mainLineProcessingAndShippingAdjustment(context, adjustLineDiscounts, sublistId, processedLineFieldId, originalAmountFieldId, adjustShippingValue, processedShippingFieldId);


                    // MDIMKOV 07.06.2022: iterate once again through discount lines and set them as negative (see comment [4)] from [07.06.2022] above
                    log.audit('MDIMKOV', '');
                    log.audit('MDIMKOV', '=9= Proceed with script re-iterating the disount lines, to make them negative');
                    const recDisountToNegative = record.load({
                        type: newRec.type,
                        id: transId,
                        isDynamic: true
                    });

                    const iLineDiscToNegativeCount = recDisountToNegative.getLineCount({sublistId: sublistId});
                    for (let i = 0; i < iLineDiscToNegativeCount; i++) {
                        log.audit('MDIMKOV', ' ... check if line is a discount for line ' + i);

                        recDisountToNegative.selectLine({
                            sublistId: sublistId,
                            line: i
                        });

                        const newLineType = recDisountToNegative.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'itemtype'
                        });

                        if (newLineType == 'Discount') {
                            log.audit('MDIMKOV', ' ... ... yes, proceed with setting negative value ');
                            let discAmtToSet = recDisountToNegative.getCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'amount'
                            });
                            discAmtToSet = -Math.abs(discAmtToSet); // make sure it's negative -- this will be the ultimate negative net amount to discount
                            log.audit('MDIMKOV', ' ... ... final negative net discount amount to set will be ' + discAmtToSet);
                            recDisountToNegative.setCurrentSublistValue({ // set custom price level
                                sublistId: sublistId,
                                fieldId: 'price',
                                value: -1
                            });
                            recDisountToNegative.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'amount',
                                value: discAmtToSet
                            });

                            recDisountToNegative.commitLine({
                                sublistId: sublistId
                            });
                        } else {
                            log.audit('MDIMKOV', ' ... ... no, continue iteration ');
                        }
                    }
                    recDisountToNegative.save();
                }
            }


            // MDIMKOV 27.03.2022: apply total gross rounding adjustment (global difference applied to the first tax details line)
            if (applyGlobalRounding && globalAmountFieldId) {
                log.audit('MDIMKOV', '');
                log.audit('MDIMKOV', '=7= Proceed with fixing global rounding / tax details override');

                // MDIMKOV 27.03.2022: load the record again and check the total so far
                let isTaxDetailsOverrideEnabled = false;
                const recGlobalRoundTrans = record.load({
                    type: newRec.type,
                    id: transId,
                    isDynamic: true
                });

                const transTotal = recGlobalRoundTrans.getValue('total') ? recGlobalRoundTrans.getValue('total') : 0;
                const transGivenTotal = recGlobalRoundTrans.getValue(globalAmountFieldId) ? recGlobalRoundTrans.getValue(globalAmountFieldId) : 0;
                const globalRoundingDifference = transGivenTotal - transTotal;

                if (transTotal && transGivenTotal) { // make sure these are some meaningful values
                    log.audit('MDIMKOV', ' ... globalRoundingDifference: ' + globalRoundingDifference);

                    if (globalRoundingDifference > -0.05 && globalRoundingDifference < 0.05 && globalRoundingDifference != 0) {

                        // MDIMKOV 17.03.2022: enable the [Tax Details Override] field on [Tax Details] subtab, if not already enabled
                        if (!isTaxDetailsOverrideEnabled) {
                            log.audit('MDIMKOV', ' ... enable tax details override');
                            recGlobalRoundTrans.setValue('taxdetailsoverride', true);
                        }

                        recGlobalRoundTrans.selectLine({
                            sublistId: 'taxdetails',
                            line: 0
                        });

                        // MDIMKOV 27.03.2022: apply the difference to the [Tax Amount] field on the first [Tax Details] line
                        const firstLineTaxAmount = recGlobalRoundTrans.getCurrentSublistValue({
                            sublistId: 'taxdetails',
                            fieldId: 'taxamount'
                        });

                        recGlobalRoundTrans.setCurrentSublistValue({
                            sublistId: 'taxdetails',
                            fieldId: 'taxamount',
                            value: firstLineTaxAmount + globalRoundingDifference
                        });

                        recGlobalRoundTrans.commitLine({
                            sublistId: 'taxdetails'
                        });
                    }
                }
                recGlobalRoundTrans.save();
            }
        }


        /* =============== Return a new URL based on the old URL and added parameters =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns a URL by passing a URL and additional parameters; it updates the ones existing and adds new ones; also accounts for existin ? sign
     *
     * RETURNS: string
     *
     * INPUT: old URL, parameter name, parameter value
     *
     * USAGE: var newUrl = replaceUrlParam("https://www.google.com", "clientId", "123"); //=> https://www.google.com?clientId=123
     *
     * */

        function replaceUrlParam(url, paramName, paramValue) {
            if (paramValue == null) {
                paramValue = '';
            }
            var pattern = new RegExp('\\b(' + paramName + '=).*?(&|#|$)');
            if (url.search(pattern) >= 0) {
                return url.replace(pattern, '$1' + paramValue + '$2');
            }
            url = url.replace(/[?#]$/, '');
            return url + (url.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue;
        }


        /* =============== Return a date in any chosen date format by passing a date object and a mask =============== */

        /*
     * MDIMKOV 31.10.2021:  this function returns date string of any date format, based on input date object and a mask that defines the format
     *
     * NOTES: you can use a variety of masks, short and long day/month names or numbers, month numbers with(out) leading zero etc.
     *          scroll down 40-50 lines to see what the abbreviations are used for, e.g. d, D, m, y, H etc.
     *          for more information, visit: https://blog.stevenlevithan.com/archives/date-time-format
     *
     * RETURNS: string
     *
     * INPUT: date object and mask (as string)
     *
     * USAGE: var myDate = convertDateToFormat(date, 'dddd, mmmm dS, yyyy, h:MM:ss TT');
     *        var myDate = convertDateToFormat(date, '');
     *
     * */

        var convertDateToFormat = function () {
            var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
                timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
                timezoneClip = /[^-+\dA-Z]/g,
                pad = function (val, len) {
                    val = String(val);
                    len = len || 2;
                    while (val.length < len) val = "0" + val;
                    return val;
                };

            // Regexes and supporting functions are cached through closure
            return function (date, mask, utc) {
                var dF = convertDateToFormat;

                // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
                if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                    mask = date;
                    date = undefined;
                }

                // Passing date through Date applies Date.parse, if necessary
                date = date ? new Date(date) : new Date;
                if (isNaN(date)) throw SyntaxError("invalid date");

                mask = String(dF.masks[mask] || mask || dF.masks["default"]);

                // Allow setting the utc argument via the mask
                if (mask.slice(0, 4) == "UTC:") {
                    mask = mask.slice(4);
                    utc = true;
                }

                var _ = utc ? "getUTC" : "get",
                    d = date[_ + "Date"](),
                    D = date[_ + "Day"](),
                    m = date[_ + "Month"](),
                    y = date[_ + "FullYear"](),
                    H = date[_ + "Hours"](),
                    M = date[_ + "Minutes"](),
                    s = date[_ + "Seconds"](),
                    L = date[_ + "Milliseconds"](),
                    o = utc ? 0 : date.getTimezoneOffset(),
                    flags = {
                        d: d,
                        dd: pad(d),
                        ddd: dF.i18n.dayNames[D],
                        dddd: dF.i18n.dayNames[D + 7],
                        m: m + 1,
                        mm: pad(m + 1),
                        mmm: dF.i18n.monthNames[m],
                        mmmm: dF.i18n.monthNames[m + 12],
                        yy: String(y).slice(2),
                        yyyy: y,
                        h: H % 12 || 12,
                        hh: pad(H % 12 || 12),
                        H: H,
                        HH: pad(H),
                        M: M,
                        MM: pad(M),
                        s: s,
                        ss: pad(s),
                        l: pad(L, 3),
                        L: pad(L > 99 ? Math.round(L / 10) : L),
                        t: H < 12 ? "a" : "p",
                        tt: H < 12 ? "am" : "pm",
                        T: H < 12 ? "A" : "P",
                        TT: H < 12 ? "AM" : "PM",
                        Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                        o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                        S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                    };

                return mask.replace(token, function ($0) {
                    return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
                });
            };
        }();

        // Some common format strings
        convertDateToFormat.masks = {
            "default": "ddd mmm dd yyyy HH:MM:ss",
            shortDate: "m/d/yy",
            mediumDate: "mmm d, yyyy",
            longDate: "mmmm d, yyyy",
            fullDate: "dddd, mmmm d, yyyy",
            shortTime: "h:MM TT",
            mediumTime: "h:MM:ss TT",
            longTime: "h:MM:ss TT Z",
            isoDate: "yyyy-mm-dd",
            isoTime: "HH:MM:ss",
            isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
            isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
        };

        // Internationalization strings
        convertDateToFormat.i18n = {
            dayNames: [
                "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
            ],
            monthNames: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
            ]
        };

        // For convenience...
        Date.prototype.format = function (mask, utc) {
            return dateFormat(this, mask, utc);
        };


        /* =============== Remove duplicate members in an array and return a new array without duplicates =============== */

        /*
     * MDIMKOV 01.11.2021: this function takes an input array, removes its duplicate members and returns the array without duplicates
     *
     * RETURNS: array
     *
     * INPUT: array
     *
     * USAGE: const newArray = arrayRemoveDuplicateMembers(myArray)
     *
     * */

        function arrayRemoveDuplicateMembers(array) {
            return Array.from(new Set(array));
        }


        /* =============== MD5 hash an input string and returned the MD5-hashed string =============== */

        /*
     * MDIMKOV 28.09.2021:  this function returns the MD5-hashed string based on an input string (useful in integrations)
     *
     * RETURNS: string (the hashed string)
     *
     * INPUT: string (the string to be hashed)
     *
     * USAGE: md5hash('helloworld');
     *
     * */

        function md5hash(inputString) {
            const md5factory = function ($) {
                'use strict'

                /**
                 * Add integers, wrapping at 2^32.
                 * This uses 16-bit operations internally to work around bugs in interpreters.
                 *
                 * @param {number} x First integer
                 * @param {number} y Second integer
                 * @returns {number} Sum
                 */
                function safeAdd(x, y) {
                    var lsw = (x & 0xffff) + (y & 0xffff)
                    var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
                    return (msw << 16) | (lsw & 0xffff)
                }

                /**
                 * Bitwise rotate a 32-bit number to the left.
                 *
                 * @param {number} num 32-bit number
                 * @param {number} cnt Rotation count
                 * @returns {number} Rotated number
                 */
                function bitRotateLeft(num, cnt) {
                    return (num << cnt) | (num >>> (32 - cnt))
                }

                /**
                 * Basic operation the algorithm uses.
                 *
                 * @param {number} q q
                 * @param {number} a a
                 * @param {number} b b
                 * @param {number} x x
                 * @param {number} s s
                 * @param {number} t t
                 * @returns {number} Result
                 */
                function md5cmn(q, a, b, x, s, t) {
                    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
                }

                /**
                 * Basic operation the algorithm uses.
                 *
                 * @param {number} a a
                 * @param {number} b b
                 * @param {number} c c
                 * @param {number} d d
                 * @param {number} x x
                 * @param {number} s s
                 * @param {number} t t
                 * @returns {number} Result
                 */
                function md5ff(a, b, c, d, x, s, t) {
                    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
                }

                /**
                 * Basic operation the algorithm uses.
                 *
                 * @param {number} a a
                 * @param {number} b b
                 * @param {number} c c
                 * @param {number} d d
                 * @param {number} x x
                 * @param {number} s s
                 * @param {number} t t
                 * @returns {number} Result
                 */
                function md5gg(a, b, c, d, x, s, t) {
                    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
                }

                /**
                 * Basic operation the algorithm uses.
                 *
                 * @param {number} a a
                 * @param {number} b b
                 * @param {number} c c
                 * @param {number} d d
                 * @param {number} x x
                 * @param {number} s s
                 * @param {number} t t
                 * @returns {number} Result
                 */
                function md5hh(a, b, c, d, x, s, t) {
                    return md5cmn(b ^ c ^ d, a, b, x, s, t)
                }

                /**
                 * Basic operation the algorithm uses.
                 *
                 * @param {number} a a
                 * @param {number} b b
                 * @param {number} c c
                 * @param {number} d d
                 * @param {number} x x
                 * @param {number} s s
                 * @param {number} t t
                 * @returns {number} Result
                 */
                function md5ii(a, b, c, d, x, s, t) {
                    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
                }

                /**
                 * Calculate the MD5 of an array of little-endian words, and a bit length.
                 *
                 * @param {Array} x Array of little-endian words
                 * @param {number} len Bit length
                 * @returns {Array<number>} MD5 Array
                 */
                function binlMD5(x, len) {
                    /* append padding */
                    x[len >> 5] |= 0x80 << len % 32
                    x[(((len + 64) >>> 9) << 4) + 14] = len

                    var i
                    var olda
                    var oldb
                    var oldc
                    var oldd
                    var a = 1732584193
                    var b = -271733879
                    var c = -1732584194
                    var d = 271733878

                    for (i = 0; i < x.length; i += 16) {
                        olda = a
                        oldb = b
                        oldc = c
                        oldd = d

                        a = md5ff(a, b, c, d, x[i], 7, -680876936)
                        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
                        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
                        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
                        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
                        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
                        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
                        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
                        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
                        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
                        c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
                        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
                        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
                        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
                        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
                        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

                        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
                        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
                        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
                        b = md5gg(b, c, d, a, x[i], 20, -373897302)
                        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
                        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
                        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
                        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
                        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
                        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
                        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
                        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
                        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
                        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
                        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
                        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

                        a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
                        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
                        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
                        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
                        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
                        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
                        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
                        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
                        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
                        d = md5hh(d, a, b, c, x[i], 11, -358537222)
                        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
                        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
                        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
                        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
                        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
                        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

                        a = md5ii(a, b, c, d, x[i], 6, -198630844)
                        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
                        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
                        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
                        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
                        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
                        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
                        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
                        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
                        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
                        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
                        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
                        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
                        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
                        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
                        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

                        a = safeAdd(a, olda)
                        b = safeAdd(b, oldb)
                        c = safeAdd(c, oldc)
                        d = safeAdd(d, oldd)
                    }
                    return [a, b, c, d]
                }

                /**
                 * Convert an array of little-endian words to a string
                 *
                 * @param {Array<number>} input MD5 Array
                 * @returns {string} MD5 string
                 */
                function binl2rstr(input) {
                    var i
                    var output = ''
                    var length32 = input.length * 32
                    for (i = 0; i < length32; i += 8) {
                        output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
                    }
                    return output
                }

                /**
                 * Convert a raw string to an array of little-endian words
                 * Characters >255 have their high-byte silently ignored.
                 *
                 * @param {string} input Raw input string
                 * @returns {Array<number>} Array of little-endian words
                 */
                function rstr2binl(input) {
                    var i
                    var output = []
                    output[(input.length >> 2) - 1] = undefined
                    for (i = 0; i < output.length; i += 1) {
                        output[i] = 0
                    }
                    var length8 = input.length * 8
                    for (i = 0; i < length8; i += 8) {
                        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
                    }
                    return output
                }

                /**
                 * Calculate the MD5 of a raw string
                 *
                 * @param {string} s Input string
                 * @returns {string} Raw MD5 string
                 */
                function rstrMD5(s) {
                    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
                }

                /**
                 * Calculates the HMAC-MD5 of a key and some data (raw strings)
                 *
                 * @param {string} key HMAC key
                 * @param {string} data Raw input string
                 * @returns {string} Raw MD5 string
                 */
                function rstrHMACMD5(key, data) {
                    var i
                    var bkey = rstr2binl(key)
                    var ipad = []
                    var opad = []
                    var hash
                    ipad[15] = opad[15] = undefined
                    if (bkey.length > 16) {
                        bkey = binlMD5(bkey, key.length * 8)
                    }
                    for (i = 0; i < 16; i += 1) {
                        ipad[i] = bkey[i] ^ 0x36363636
                        opad[i] = bkey[i] ^ 0x5c5c5c5c
                    }
                    hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
                    return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
                }

                /**
                 * Convert a raw string to a hex string
                 *
                 * @param {string} input Raw input string
                 * @returns {string} Hex encoded string
                 */
                function rstr2hex(input) {
                    var hexTab = '0123456789abcdef'
                    var output = ''
                    var x
                    var i
                    for (i = 0; i < input.length; i += 1) {
                        x = input.charCodeAt(i)
                        output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
                    }
                    return output
                }

                /**
                 * Encode a string as UTF-8
                 *
                 * @param {string} input Input string
                 * @returns {string} UTF8 string
                 */
                function str2rstrUTF8(input) {
                    return unescape(encodeURIComponent(input))
                }

                /**
                 * Encodes input string as raw MD5 string
                 *
                 * @param {string} s Input string
                 * @returns {string} Raw MD5 string
                 */
                function rawMD5(s) {
                    return rstrMD5(str2rstrUTF8(s))
                }

                /**
                 * Encodes input string as Hex encoded string
                 *
                 * @param {string} s Input string
                 * @returns {string} Hex encoded string
                 */
                function hexMD5(s) {
                    return rstr2hex(rawMD5(s))
                }

                /**
                 * Calculates the raw HMAC-MD5 for the given key and data
                 *
                 * @param {string} k HMAC key
                 * @param {string} d Input string
                 * @returns {string} Raw MD5 string
                 */
                function rawHMACMD5(k, d) {
                    return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
                }

                /**
                 * Calculates the Hex encoded HMAC-MD5 for the given key and data
                 *
                 * @param {string} k HMAC key
                 * @param {string} d Input string
                 * @returns {string} Raw MD5 string
                 */
                function hexHMACMD5(k, d) {
                    return rstr2hex(rawHMACMD5(k, d))
                }

                /**
                 * Calculates MD5 value for a given string.
                 * If a key is provided, calculates the HMAC-MD5 value.
                 * Returns a Hex encoded string unless the raw argument is given.
                 *
                 * @param {string} string Input string
                 * @param {string} [key] HMAC key
                 * @param {boolean} [raw] Raw output switch
                 * @returns {string} MD5 output
                 */
                function md5(string, key, raw) {
                    if (!key) {
                        if (!raw) {
                            return hexMD5(string)
                        }
                        return rawMD5(string)
                    }
                    if (!raw) {
                        return hexHMACMD5(key, string)
                    }
                    return rawHMACMD5(key, string)
                }

                // if (typeof define === 'function' && define.amd) {
                //     define(function () {
                //         return md5
                //     })
                // } else if (typeof module === 'object' && module.exports) {
                //     module.exports = md5
                // } else {
                $.md5 = md5
                // }
            }

            const toBeHashed = {}
            md5factory(toBeHashed)

            const hashedResult = toBeHashed.md5(inputString);
            return hashedResult;
        }


        /* =============== Convert a number into a string with thousands separators added =============== */

        /*
     * MDIMKOV 24.11.2021:  this function returns the string representation of a float number with thousands separators added
     *
     * RETURNS: string
     *
     * INPUT: float / string
     *
     * USAGE: addThousandsSeparator(50000000.12);
     *
     * */

        function addThousandsSeparator(nStr) {
            nStr += '';
            x = nStr.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }


        /* =============== Convert Umlaute into ae, oe, ue etc. =============== */

        /*
     * MDIMKOV 02.03.2022:  this function returns a string such as oa, oe, ue based on an Umplaut that is given as parameter
     *
     * RETURNS: string
     *
     * INPUT: string
     *
     * USAGE: replaceUmlaute('das schöne Mädchen');  // => 'das schoene Maedchen'
     *
     * */

        function replaceUmlaute(str) {
            const umlautMap = {
                '\u00dc': 'UE',
                '\u00c4': 'AE',
                '\u00d6': 'OE',
                '\u00fc': 'ue',
                '\u00e4': 'ae',
                '\u00f6': 'oe',
                '\u00df': 'ss',
            }

            return str
                .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
                    const big = umlautMap[a.slice(0, 1)];
                    return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
                })
                .replace(new RegExp('[' + Object.keys(umlautMap).join('|') + ']', "g"),
                    (a) => umlautMap[a]
                );
        }


        /* =============== Convert a date string, such as '22.03.2022' into a Date Object =============== */

        /*
        * MDIMKOV 31.03.2022: this function converts a date string, such as '22.03.2022' into a Date Object
        *
        * RETURNS: date Object
        *
        * INPUT: string
        *
        * USAGE: const myDate = createDateObjectFromString('22.03.2022') // -> Mon Mar 27 2023 00:00:00 GMT+0300
        *
        * */

        function createDateObjectFromString(strDate) {
            const dateArray = strDate.split('.');
            const newDate = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);
            return newDate;
        }


        /* =============== Get the revenue recognition end date by passing a start date and number of months =============== */

        /*
        * MDIMKOV 02.04.2022: this function gets the revenue recognition end date by passing a start date and number of months
        *   it will increase the number of months based on the number of months passed and will subtract a day
        *
        * Some sample results delivered by the function:
        *
        *       Start Date	    Months	        End Date
        *       15-Jan	        1	            14-Feb
        *       30-Jan	        1	            27-Feb
        *       29-Jan	        1	            27-Feb
        *       28-Jan	        1	            27-Feb
        *       27-Jan	        1	            26-Feb
        *       2-Feb	        1	            1-Mar
        *       1-Jan	        1	            31-Jan
        *       1-Apr-22	    12	            31-Mar-23
        *
        * RETURNS: date Object (start date); integer (number of months)
        *
        * INPUT: date Object
        *
        * USAGE: const revRecEndDate = getRevRecEndDate('2022-01-15', 1); // -> Mon Feb 14 2022 02:00:00 GMT+0200
        *
        * */

        function getRevRecEndDate(date, months) {
            date = new Date(date);
            var d = date.getDate();
            date.setMonth(date.getMonth() + +months); // add the months
            if (date.getDate() != d) {
                date.setDate(0);
            }
            date.setDate(date.getDate() - 1); // go back one day
            return date;
        }


        /* =============== Contruct a NetSuite URL, automatically find the domain / account ID in the URL =============== */

        /*
        * MDIMKOV 31.03.2022: this function constructs a URL that refers to the current NetSuite account / URL (e.g. 123456-sb1.app...)
        *       optionally, additional parameters, such as '&e=T' can be appended
        *       returns a URL such as [https://5115672-sb1.app.netsuite.com/app/] + the 2 parameters appended
        *
        *       NOTE! if excludeApp is set to [true], then the '/app/' part is not included (for example, when dealing with file URLs etc.)
        *
        * RETURNS: string
        *
        * INPUT: strings (for the optional parameters that will be appended
        *
        * USAGE: const url = constructURL('common/custom/custrecord.nl?id=', objectInternalId, '&e=T', false)  // => https://5115672-sb1.app.netsuite.com/app/common/custom/custrecord.nl?id=574&e=T
        *
        * */

        function constructURL(append1, append2, append3, excludeApp) {
            let urlString = '';
            const host = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });

            urlString += 'https://';
            urlString += host;
            if (!excludeApp) {
                urlString += '/app/';
            }
            urlString += append1 ? append1 : '';
            urlString += append2 ? append2 : '';
            urlString += append3 ? append3 : '';

            return urlString;
        }


        /* =============== Get the currency exchange rate for a given date =============== */

        /*
        * MDIMKOV 18.04.2022: this function returns the currency exchange rate (e.g. 1.95583) for a target currency based on source currency and date
        *
        * RETURNS: decimal
        *
        * INPUT: strings for the currencies, date for the date
        *
        * USAGE: const newAmount = getCurrencyExchangeRate('EUR', 'BGN', new Date()); => 1.95583
        *
        * */

        function getCurrencyExchangeRate(sourceCurrency, targetCurrency, date) {
            let rate = 0;

            rate = currency.exchangeRate({
                source: sourceCurrency,
                target: targetCurrency,
                date: new Date(date)
            });

            return rate;
        }


        /* =============== Get the subsidiary ID by passing the subsidiary name =============== */

        /*
        * MDIMKOV 25.04.2022: this function returns the subsidiary ID for a given subsidiary name;
        *                     Note: the name can be full and follow the 'Parent Name : Child Name' structure, or just the short name, e.g. 'My Subsidiary'
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const subsidiaryId = getSubsidiaryIdByName('Parent Company : Munich', false); // -> 12
        *        const subsidiaryId = getSubsidiaryIdByName('Munich', true); // -> 12
        *
        * */

        function getSubsidiaryIdByName(name, isFullName) {

            let sql = null;

            if (!isFullName) {
                sql = "SELECT TOP 1 * " +
                    "FROM subsidiary WHERE name = '" + name + "'";
            } else {
                sql = "SELECT TOP 1 * " +
                    "FROM subsidiary WHERE fullname = '" + name + "'";
            }

            const resultSet = query.runSuiteQL({query: sql}).asMappedResults();

            const myResult = query.runSuiteQL({query: sql}).asMappedResults()[0] ? query.runSuiteQL({query: sql}).asMappedResults()[0].id : null;

            return myResult;

        }


        /* =============== Get the non-hierarchy name of a hierarchy name for departments, locations, subsidiaries =============== */

        /*
        * MDIMKOV 20.12.2023: this function will always return the last part of a hierarchical, for example:
        *               it will return 'Marketing' from a string such as 'Headquarters : Financial : Marketing'
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: const nameNoHierarchy = getNoHierarchySubsidiaryDepartmentLocation('Headquarters : Financial : Marketing') // -> 'Marketing'
        *
        * */

        function getNoHierarchySubsidiaryDepartmentLocation(inputString) {
            const parts = inputString.split(' : ');
            return parts.length > 1 ? parts[parts.length - 1] : inputString;
        }


        /* =============== Get the class ID by passing the class name =============== */

        /*
        * MDIMKOV 25.04.2022: this function returns the class ID for a given class name;
        *                     Note: the name needs to follow the 'Parent Name : Child Name' structure
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const classId = getClassIdByName('Parent Class : Bern'); // -> 15
        *
        * */

        function getClassIdByName(name) {

            let internalId = 0;

            const recordSearchObj = search.create({
                type: record.Type.CLASSIFICATION,
                filters:
                    [['name', 'is', name]],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }


        /* =============== Get the department ID by passing the department name =============== */

        /*
        * MDIMKOV 25.04.2022: this function returns the department ID for a given department name;
        *                     Note: the name needs to follow the 'Parent Name : Child Name' structure
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const departmentId = getDepartmentIdByName('Parent Department : Finance'); // -> 17
        *
        * */

        function getDepartmentIdByName(name) {

            let internalId = 0;

            const recordSearchObj = search.create({
                type: record.Type.DEPARTMENT,
                filters:
                    [['name', 'is', name]],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });

            return internalId;

        }


        /* =============== Find account ID by a given account name =============== */

        /*
     * MDIMKOV 29.04.2022: this function finds the account ID of a given G/L account by looking for its account name
     *
     * RETURNS: integer (the G/L account ID)
     *
     * USAGE: const acctId = getAccountByName('PayPal EUR'); // -> 113
     *
     * */

        function getAccountByName(acctName) {
            let returnId = 0;
            const accountSearchObj = search.create({
                type: 'account',
                filters:
                    [
                        ['name', 'is', acctName]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'internalid',
                            sort: search.Sort.ASC
                        })
                    ]
            });

            const accountSearchResults = accountSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            try {
                if (accountSearchResults) {
                    returnId = accountSearchResults[0].id;
                }
            } catch (е) {
            }

            return returnId;

        }


        /* =============== Convert the string from the Options field on a transaction header into an array of field-value pairs =============== */

        /*
             * MDIMKOV 12.05.2022: Convert the string from the Options field on a transaction header into an array of field-value pairs
             *          Check the note about "previous version" - earlier [i + 3] was used -- this may be needed in future implementations again
             *
             * RETURNS: array
             *
             * USAGE: const headerOptionsArray = convertTransHeaderOptionsToArray(headerOptions); // -> [{field: "xxx", value: "yyy"}, {...}]
             *
             * */

        function convertTransHeaderOptionsToArray(headerOptions) {

            let newOptionsArray = [];

            const headerOptionsArray = headerOptions.split('');
            log.debug('headerOptionsArray - raw', headerOptionsArray);

            for (let i = 0; i < headerOptionsArray.length - 3; i++) {
                if (i % 3 == 0) {
                    newOptionsArray.push({
                        "field": (i == 0) ? headerOptionsArray[i] : headerOptionsArray[i].split('\u0004')[1],
                        "value": headerOptionsArray[i + 3]
                    });
                }
            }

            for (let i = 0; i < newOptionsArray.length; i++) {
                newOptionsArray[i].value = newOptionsArray[i].value.split('\u0004')[0];
            }

            return newOptionsArray;

        }


        /* =============== Find the top parent transaction id or number =============== */

        /*
        * MDIMKOV 15.05.2022: this function takes a transaction id and returns the [Created From] id or number from the top most parent transaction it was created from
        *  - if isReturnId is set to [true], the function will return the top-most parent transaction id, such as 66494
        *  - if isReturnId is set to [false], the function will return the top-most parent transaction name/number, like 'Sales Order #SO-J-147'
        *  - the function will iterate through parent transactions (e.g. a WO created from a WO that was created from a SO) until the top one is found
        *
        * RETURNS: string -- either an id of top-most parent transaction or its number (e.g. either 66494 or 'Sales Order #SO-J-147')
        *
        * INPUT: transId - integer (the current transaction id)
        *        isReturnId - boolean (if true, returns the transaction id, otherwise, the transaction type/name/number)
        *
        * USAGE: const topParentRecordName = findTopParentTransaction(23454, false); // -> 'Sales Order #SO-J-147'
        *
        * */

        function findTopParentTransaction(transId, isReturnId) {

            // MDIMKOV 15.05.2022: initialize main variables
            let returnValue = '';
            let parentId = transId;
            let oldCreatedFrom = '';
            const tranId = search.lookupFields({
                type: 'transaction',
                id: parentId,
                columns: ['tranid']
            }).tranid;


            // MDIMKOV 19.08.2022: enable logging
            // log.debug('MDIMKOV', '');
            // log.debug('MDIMKOV', 'start with function [findTopParentTransaction]');
            // log.debug('MDIMKOV', '... proceed with transaction ' + tranId + ' (id=' + transId + ')');


            // MDIMKOV 19.08.2022: check if transaction has at least one parent trasaction; if not, return null
            const firstCreatedFrom = search.lookupFields({
                type: 'transaction',
                id: parentId,
                columns: ['createdfrom']
            });

            if (!firstCreatedFrom || firstCreatedFrom['createdfrom'].length === 0) {
                returnValue = null;
                // log.debug('MDIMKOV', '... there is no parent transaction, return NULL and exit');
            } else {

                // MDIMKOV 15.05.2022: loop up to the parent records; if the top one is found ([createdfrom] empty), then exit the loop
                // log.debug('MDIMKOV', '... there is at least one parent transaction, proceed with the loop');
                for (let i = 0; i < 100; i++) {
                    const createdFrom = search.lookupFields({
                        type: 'transaction',
                        id: parentId,
                        columns: ['createdfrom']
                    });


                    // MDIMKOV 15.05.2022: on the last iteration, set the return value and exit the loop
                    if (!createdFrom || !createdFrom.createdfrom[0]) {
                        returnValue = isReturnId ? JSON.stringify(oldCreatedFrom.createdfrom[0].value) : JSON.stringify(oldCreatedFrom.createdfrom[0].text);
                        return returnValue;
                    } else {
                        // MDIMKOV 19.08.2022: parent transaction exists, so continue with the iterations
                        parentId = createdFrom.createdfrom[0].value;
                        oldCreatedFrom = createdFrom;
                    }
                }
            }

            // log.debug('MDIMKOV', 'value to be returned: ' + returnValue);
            // log.debug('MDIMKOV', '');
            return returnValue;
        }


        /* =============== Create a new class =============== */

        /*
        * MDIMKOV 15.05.2022: this function creates a new class (if it doesn't exist)
        *  - if the [parent] parameter is integer, it takes the parent class id, otherwise, the parent class name (full hierarchy), e.g. 'Class1 : Class2'
        *  - if the [subsidiary] parameter is integer, it takes the subsidiary id, otherwise, the subsidiary name (full hierarchy), e.g. 'Parent Org : Next Org1 : Next Org2'
        *
        * RETURNS: integer -- the id of the newly-created class
        *
        * INPUT:        - name - the name of the new class
        *               - parent - the parent class id or full hierarchy name (optional);
        *               - subsidiary - the subsidiary id or full hierarchy name (required for one-world implementations)
        *
        * USAGE: const newClassId = createClass('Test1', 'EAST : Test1', 'Parent Company', true); // -> 8755
        *
        * */

        function createClass(name, parent, subsidiary, includechildren) {
            try {
                // MDIMKOV 26.04.2022: if [parent] is an integer, this is the parent class id; if it is string, this is the parent class name and needs to be resolved:
                if (typeof parent === 'string') {
                    parent = getClassIdByName(parent);
                }

                // MDIMKOV 26.04.2022: if [subsidiary] is an integer, this is the subsidiary id; if it is string, this is the subsidiary name and needs to be resolved:
                if (typeof subsidiary === 'string') {
                    subsidiary = getSubsidiaryIdByName(subsidiary);
                }

                // MDIMKOV 26.04.2022: try to create the new record
                var rec = record.create({
                    type: record.Type.CLASSIFICATION,
                    isDynamic: false
                });

                rec.setValue('name', name);
                if (parent) {
                    rec.setValue('parent', parent);
                }
                if (subsidiary) {
                    rec.setValue('subsidiary', subsidiary);
                }
                rec.setValue('includechildren', includechildren);

                const newRecId = rec.save();

                return newRecId;
            } catch (e) {
                if (e.message !== 'This record already exists') {
                    log.error('ERROR', e.message + ' --- ' + e.stack);
                }
                return 0;
            }
        }


        /* =============== Get the item ID by passing the item code (name/number) =============== */

        /*
        * MDIMKOV 25.05.2022: this function returns the item ID for a given item code (called also NAME/NUMBER -- [itemid])
        *       NOTE! if the item has parent items, you can pass the name in any of the following way (both options are valid):
        *               > 'Item Name C'
        *               > 'Item Name A : Item Name B : Item Name C'
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const itemId = getItemIdByCode('AMN7887'); // -> 17
        *
        * */

        function getItemIdByCode(code) {

            let internalId = 0;

            const recordSearchObj = search.create({
                type: 'item',
                filters:
                    [['itemid', 'is', code]],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });
            return internalId;
        }


        /* =============== Get the location ID by passing the location name =============== */

        /*
        * MDIMKOV 25.05.2022: this function returns the location ID for a given location name;
        *                     Note: the name needs to follow the 'Parent Name : Child Name' structure
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const locationId = getLocationIdByName('Parent Location : Sofia'); // -> 17
        *
        * */

        function getLocationIdByName(name) {

            let internalId = 0;

            const recordSearchObj = search.create({
                type: record.Type.LOCATION,
                filters:
                    [['name', 'is', name]],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });
            return internalId;
        }


        /* =============== Add a number of days to a given date =============== */

        /*
        * MDIMKOV 01.06.2022: this function adds a number of days to a given date
        *   NOTE!!! this function works irrespectively of time zones
        *
        * RETURNS: date
        *
        * INPUT: date object, integer (number of days)
        *
        * USAGE: const dateTomorrow = addDaysToDate(new Date(), 1); // -> Wed Jun 08 2022 01:22:25 GMT-0700 (PDT)
        *
        * */

        function addDaysToDate(dateObj, days) {

            dateObj.setUTCDate(dateObj.getUTCDate() + days);

            const newDateStr = dateObj.getUTCFullYear() + '-' + (dateObj.getUTCMonth() + 1) + '-' + dateObj.getUTCDate();
            return format.parse({value: new Date(newDateStr), type: format.Type.DATE});
        }


        /* =============== Add a number of days to a given date (new) =============== */

        /*
        * MDIMKOV 19.10.2024: this function adds a number of days to a given date
        *
        * RETURNS: date
        *
        * INPUT: date object, integer (number of days)
        *
        * USAGE: const dateTomorrow = addDaysToDateNew(new Date(), 1); // -> Wed Jun 08 2022 01:22:25 GMT-0700 (PDT)
        *
        * */

        function addDaysToDateNew(date, days) {

            const adjustedDate = new Date(date); // Clone the date object
            adjustedDate.setDate(date.getDate() + days); // Adjust the date by the given number of days
            return adjustedDate;
        }


        /* =============== Get a value from a body field =============== */

        /*
        * MDIMKOV 01.06.2022: this function gets a value from a body field; you can also define 'value' or 'text' for drop-down fields
        *       * returnType can be 'date', 'float', 'integer', 'datetime' or any other listed in the format.Type enumerator (string is default)
        *       * note that this function will return an empty string when the return value is null, undefined etc. - this is to be used with drop-downs
        *
        * RETURNS: any (important: see note above about returnType)
        *f
        * INPUT: strings
        *
        * USAGE: const myMemo = getFieldValue('memo', 'transaction', 3543, ''); // -> 'my memo'
        *        const customerId = getFieldValue('entity', 'transaction', 764, 'integer', 'value'); // -> 123
        *        const customerName = getFieldValue('entity', 'transaction', 764, null, 'text'); // -> 'John Smith'
        *
        * */

        function getFieldValue(fieldName, recordType, internalId, returnType, valueOrText) {
            let returnValue = '';
            const fieldLookUp = search.lookupFields({
                type: recordType,
                id: internalId,
                columns: [fieldName]
            });

            if (valueOrText === 'value' && fieldLookUp[fieldName][0]) {
                returnValue = fieldLookUp[fieldName][0].value;
            } else if (valueOrText === 'text' && fieldLookUp[fieldName][0]) {
                returnValue = fieldLookUp[fieldName][0].text;
            } else {
                returnValue = fieldLookUp[fieldName];
            }

            if (returnType && returnValue) {
                returnValue = format.parse({
                    type: returnType,
                    value: returnValue
                });
            }

            // MDIMKOV 03.06.2022: don't ask me what this is. Just keep it or prepare for the worst
            if ('|' + returnValue + '|' === '||') {
                returnValue = '';
            }

            return returnValue;
        }


        /*
        * MDIMKOV 01.06.2022: this function sets a value to a body or entity field
        *       * optionally, specify withLoad=true: set the value by loading the record; this is, for example for inoubnd shipments date fields (newer rec type with date)
        *       * optionally, use [disableTriggers] = true to disable triggers
        *
        * RETURNS: integer (the ID of the updated record)
        *
        * INPUT: strings
        *
        * USAGE: const updatedRecordId = setFieldValue('memo', 'customer', 5548, 'test memo', true); // -> 4372
        *
        * */

        function setFieldValue(fieldName, recordType, internalId, value, withLoad, disableTriggers) {

            // MDIMKOV 03.06.2022: set the value using submit (in most cases)
            if (!withLoad) {
                return record.submitFields({
                    type: recordType,
                    id: internalId,
                    values: {
                        [fieldName]: value
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        disableTriggers: !!disableTriggers
                    }
                });
            } else {

                // MDIMKOV 03.06.2022: set the value by loading the record; this is, for example for inoubnd shipments date fields (newer rec type with date)
                const rec = record.load({
                    type: recordType,
                    id: internalId
                });
                rec.setValue(fieldName, value);
                rec.save({'disableTriggers': !!disableTriggers});
            }
        }


        /*
        * MDIMKOV 05.04.2025: this function sets a value to a transaction body field, without specifying the specific transaction type
        *       * optionally, use [disableTriggers] = true to disable triggers
        *
        * RETURNS: integer (the ID of the updated record)
        *
        * INPUT: various
        *
        * USAGE: const updatedTransId = setTransFieldValue('memo', 5548, 'test memo', true); // -> 73482
        *
        * */

        function setTransFieldValue(fieldName, internalId, value, disableTriggers) {

            // TVZ - 2025-04-05: define the transaction type, so it can be used later
            const typeRaw = singleRecordSearchSql('transaction', `id = ${internalId}`, 'type');
            if (!typeRaw) {
                return null;
            }

            const transType = translateTractionTypeNameC(typeRaw);
            if (!transType) {
                return null;
            }


            // TVZ - 2025-04-05: set the value using submit (in most cases)
            return record.submitFields({
                type: transType,
                id: internalId,
                values: {
                    [fieldName]: value
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: !!disableTriggers
                }
            });
        }


        /* =============== Count the transaction lines that meet certain criteria  =============== */

        /*
        * MDIMKOV 01.06.2022: this function will count the transaction lines that meet certain criteria
        *       * common requirement: if any of the SO lines has field [closed] set to TRUE, do ....
        *       * this function will return an integer value of the number of lines meeting the criteria
        *       * it can also be used to check if any line has a certain field value (e.g. returning either 0 or more than 0)
        *       * since newer record types, such as inbound shipments, cannot be called the general way, use the recordType parameter
        *          - recordType = 'transaction' -- in most cases
        *          - recordType = 'inboundshipment' -- an example for the exceptions
        *
        * RETURNS: integer
        *
        * INPUT: various
        *
        * USAGE: const doesItHave = countTransLines('transaction', 5584, ['myColumnDate', 'is', 'today']); // -> 0
        *        const doesItHave = countTransLines('inboundshipment', 5584, []); // -> 3
        *
        * */

        function countTransLines(recordType, transId, filterArray) {

            // MDIMKOV 04.06.2022: initialize variables;
            let returnVal = 0;
            let finalFilterArray = [];

            // MDIMKOV 05.06.2022: structure the filter by adding main criteria and optional [filterArray] criteria
            if ((Object.prototype.toString.call(filterArray) === '[object Array]') && filterArray.length > 0) {
                finalFilterArray.push('AND');
                finalFilterArray.push(filterArray);
            }

            // MDIMKOV 04.06.2022: this is the main case, when a transaction is being used (SO, PO, etc. in this case recordType is just 'transaction')
            if (recordType === 'transaction') {

                // MDIMKOV 05.06.2022: construct the main filter
                finalFilterArray = [
                    [
                        ['internalid', 'anyof', '110'], 'AND',
                        ['shipping', 'is', 'F'], 'AND',
                        ['taxline', 'is', 'F'], 'AND',
                        ['mainline', 'is', 'F']
                    ]
                ]

                // MDIMKOV 03.06.2022: create a saved search that will return the lines on the transaction to check
                const mySearch = search.create({
                    type: 'transaction',
                    filters: finalFilterArray,
                    columns: [
                        search.createColumn({
                            name: 'line',
                            summary: 'COUNT'
                        })
                    ]
                });
                mySearch.run().each(function (result) {
                    returnVal = result.getValue(result.columns[0]);
                    return false; // there would only be one summary record
                });
            } else if (recordType === 'inboundshipment') {

                // MDIMKOV 05.06.2022: this part will be for inbound shipments, as they follow a different way of extracting lines

                // MDIMKOV 05.06.2022: construct the main filter
                finalFilterArray = [
                    [
                        ['internalidnumber', 'equalto', transId]
                    ]
                ]

                // MDIMKOV 05.06.2022: structure the filter by adding main criteria and optional [filterArray] criteria
                if ((Object.prototype.toString.call(filterArray) === '[object Array]') && filterArray.length > 0) {
                    finalFilterArray.push('AND');
                    finalFilterArray.push(filterArray);
                }

                const inboundshipmentSearchObj = search.create({
                    type: 'inboundshipment',
                    filters: finalFilterArray,
                    columns:
                        [
                            search.createColumn({
                                name: 'inboundshipmentitemid',
                                summary: 'COUNT'
                            })
                        ]
                });
                inboundshipmentSearchObj.run().each(function (result) {
                    returnVal = result.getValue(result.columns[0]);
                    return false; // there would only be one summary record
                });
            }

            return returnVal;
        }


        /*
        * MDIMKOV 01.06.2022: this function will sum the values from a certain line field for a given transaction
        *       * common requirement: sum up the values in the CBM line field for a sales order
        *       * this function will return the summation of all values in the (e.g.) CBM field
        *       * optionally, add a filter parameter to narrow down the search results (e.g. only check lines where a=b)
        *       * since newer record types, such as inbound shipments, cannot be called the general way, use the recordType parameter
        *          - recordType = 'transaction' -- in most cases
        *          - recordType = 'inboundshipment' -- an example for the exceptions
        *
        * RETURNS: decimal
        *
        * INPUT: various
        *
        * USAGE: const a = transactionSumLines('transaction', 5584, ['myColumnDate', 'is', 'today'], 'custcol_cbm'); // -> 150
        *        const b = transactionSumLines('inboundshipment', 5584, [], 'quantity'); // -> 250
        *        const c = transactionSumLines('my_custom_record', null, ['myColumnDate', 'is', 'today'], 'quantity'); // -> 250
        *
        * */

        function transactionSumLines(recordType, transId, filterArray, fieldName) {

            // MDIMKOV 04.06.2022: initialize variables;
            let returnVal = 0;
            let finalFilterArray = [];

            // MDIMKOV 05.06.2022: structure the filter by adding main criteria and optional [filterArray] criteria
            if ((Object.prototype.toString.call(filterArray) === '[object Array]') && filterArray.length > 0) {
                finalFilterArray.push('AND');
                finalFilterArray.push(filterArray);
            }

            // MDIMKOV 04.06.2022: this is the main case, when a transaction is being used (SO, PO, etc. in this case recordType is just 'transaction')
            if (recordType === 'transaction') {

                // MDIMKOV 05.06.2022: construct the main filter
                if (transId) {
                    finalFilterArray = [
                        [
                            ['internalid', 'noneof', '@NONE@'], 'AND',
                            ['shipping', 'is', 'F'], 'AND',
                            ['taxline', 'is', 'F'], 'AND',
                            ['mainline', 'is', 'F']
                        ]
                    ]
                } else {
                    finalFilterArray = [
                        [
                            ['internalid', 'anyof', transId], 'AND',
                            ['shipping', 'is', 'F'], 'AND',
                            ['taxline', 'is', 'F'], 'AND',
                            ['mainline', 'is', 'F']
                        ]
                    ]
                }

                // MDIMKOV 03.06.2022: create a saved search that will return the lines on the transaction to check
                const mySearch = search.create({
                    type: 'transaction',
                    filters: finalFilterArray,
                    columns: [
                        search.createColumn({
                            name: fieldName,
                            summary: 'SUM'
                        })
                    ]
                });
                mySearch.run().each(function (result) {
                    returnVal = result.getValue(result.columns[0]);
                    return false; // there would only be one summary record
                });
            } else if (recordType === 'inboundshipment') {

                // MDIMKOV 05.06.2022: this part will be for inbound shipments, as they follow a different way of extracting lines

                // MDIMKOV 05.06.2022: construct the main filter
                finalFilterArray = [
                    [
                        ['internalidnumber', 'equalto', transId]
                    ]
                ]

                // MDIMKOV 05.06.2022: structure the filter by adding main criteria and optional [filterArray] criteria
                if ((Object.prototype.toString.call(filterArray) === '[object Array]') && filterArray.length > 0) {
                    finalFilterArray.push('AND');
                    finalFilterArray.push(filterArray);
                }

                // MDIMKOV 05.06.2022: custom line fields need a join, whereas standard fields don't; build this exception
                let columns = [];
                if (fieldName.startsWith('custrecord_')) {
                    columns = [
                        search.createColumn({
                            name: fieldName,
                            summary: 'SUM',
                            join: 'inboundShipmentItem',
                            sort: search.Sort.ASC,
                        })
                    ]
                } else {
                    columns = [
                        search.createColumn({
                            name: fieldName,
                            summary: 'SUM',
                            sort: search.Sort.ASC
                        })
                    ]
                }

                const inboundshipmentSearchObj = search.create({
                    type: 'inboundshipment',
                    filters: finalFilterArray,
                    columns: columns
                });
                inboundshipmentSearchObj.run().each(function (result) {
                    returnVal = result.getValue(result.columns[0]);
                    return false; // there would only be one summary record
                });
            }

            return returnVal;
        }


        /* =============== Retrieve one (the first) record from a saved search - field name and get its value on the resulting record =============== */

        /*
        * MDIMKOV 07.06.2022: this function will construct a saved search to retrieve the first (or single) record of it
        *                        - a field name will be passed and its value or text will be returned
        *                        - if [isGetText] is set to TRUE, the getText function will be called instead of getValue
        *                        - this can only be used for header values from transactions, custom record types etc.; no line values
        *                        - [orderByFieldName] optional parameter, so that the results can be sorted
        *                        - [isDescending] optional boolean parameter, to define results being ordered in descending order
        *
        * RETURNS: array
        *
        * INPUT: various
        *
        * USAGE: const getSomeValues = singleRecordSearch('transaction', ['myBodyDate', 'is', 'today'], 'entity', true); // -> ['John Smith']
        *
        * */

        function singleRecordSearch(recordType, filterArray, fieldName, isGetText, orderByFieldName, isDescending) {

            // MDIMKOV 07.06.2022: initialize the variables
            let returnValue = null;
            let columns = [];
            columns.push(fieldName);

            // MDIMKOV 07.06.2022: if the optional orderByFieldName is used, add it to the columns, so that the results can be ordered
            if (orderByFieldName) {
                columns.push(search.createColumn({
                    name: orderByFieldName,
                    sort: isDescending ? search.Sort.DESC : search.Sort.ASC
                }))
            }

            // MDIMKOV 07.06.2022: construct the search itself
            const mySearch = search.create({
                type: recordType,
                filters: filterArray,
                columns: columns
            });
            mySearch.run().each(function (result) {
                returnValue = isGetText ? result.getText(result.columns[0]) : result.getValue(result.columns[0]);
                return false; // only the single (or first) record needs to be returned
            });

            return returnValue;
        }


        /*
        * MDIMKOV 15.06.2022: this function logs the remaining governance usage points in a script
        *       - the optional logLevel parameter can be set to 'a' for audit; default is debug
        *       - the optional titleAddition parameter adds a string in parantheses for easier tracking
        *
        * RETURNS: log record
        *
        * INPUT: string
        *
        * USAGE: logGovernanceUsageRemaining('a', 'POINT10', 1); // -> log record created: '.... Remaining governance units (POINT10) --- 150'
        *
        * */

        function logGovernanceUsageRemaining(logLevel, titleAddition, indentLevel) {
            const scriptObj = runtime.getCurrentScript();
            const title = titleAddition ? 'remaining governance units (' + titleAddition + ') --- ' : 'remaining governance units --- ';

            if (logLevel && logLevel == 'a') {
                log.audit('MDIMKOV', addIndents(indentLevel) + title + scriptObj.getRemainingUsage());
            } else {
                log.debug('MDIMKOV', addIndents(indentLevel) + title + scriptObj.getRemainingUsage());
            }
        }


        /* =============== Group (reduce) a JSON (array of objects) =============== */

        /*
        * MDIMKOV 20.06.2022: this function takes an array of objects (JSON) and returns a grouped (reduced) representation of it
        *       - parameter [data] has the respective data in it (see example below)
        *       - parameter [groupByObjectsArray] has an array of the elements to group by (e.g. ['sku', 'lot']
        *       - parameter [summarizeObjectsArray] has an array of the elements to summarize by (e.g. ['quantity', 'length']
        *
        * RETURNS: array of objects
        *
        * INPUT: various
        *
        * USAGE: let initialData = [
        *           {"sku" : "A01", "lot" : "LOT-01", "quantity" : 10, "length" : 13},
        *           {"sku" : "A01", "lot" : "LOT-02", "quantity" : 20, "length" : 14},
        *           {"sku" : "A02", "lot" : "LOT-03", "quantity" : 35, "length" : 12},
        *           {"sku" : "A02", "lot" : "LOT-03", "quantity" : 45, "length" : 11}
        *       ]
        *
        *       const reducedData = groupReduceJson(initialData, ['sku', 'lot'], ['quantity', 'length']);
        *       // ->
        *       [
        *           {"sku" : "A01", "lot" : "LOT-01", "quantity" : 10, "length" : 13},
        *           {"sku" : "A01", "lot" : "LOT-02", "quantity" : 20, "length" : 14},
        *           {"sku" : "A02", "lot" : "LOT-03", "quantity" : 80, "length" : 23}
        *       ]
        *
        * */

        function groupReduceJson(data, groupByObjectsArray, summarizeObjectsArray) {
            let helper = {};
            let result = data.reduce(function (r, o, a) {

                // MDIMKOV 20.06.2022: construct the key, based on the input array (e.g. group by sku and lot)
                let key = '';
                groupByObjectsArray.forEach(function (element) {
                    key += o[element];
                    key += '-';
                });
                key = key.slice(0, -1); // remove the last '-' from the key, which is not needed

                if (!helper[key]) {
                    helper[key] = Object.assign({}, o);
                    helper[key].key = key;
                    r.push(helper[key]);
                } else {

                    // MDIMKOV 20.06.2022: add as many lines as needed for the elements that will be summarized (e.g. summarize quantity and length)
                    summarizeObjectsArray.forEach(function (element) {
                        helper[key][element] += o[element];
                    });
                }
                return r;
            }, []);

            return result
        }


        /* =============== Group (reduce) a JSON (array of objects) --- VERSION 2, with children =============== */

        /*
        * MDIMKOV 20.06.2022: this function takes an array of objects (JSON) and returns a grouped (reduced) representation of it
        *       - parameter [data] has the respective data in it (see example below)
        *       - parameter [groupByObjectsArray] has an array of the elements to group by (e.g. ['sku', 'lot']
        *       - parameter [summarizeObjectsArray] has an array of the elements to summarize by (e.g. ['quantity', 'length']
        *
        * RETURNS: array of objects
        *
        * INPUT: various
        *
        * USAGE: let initialData = [
        *           {"sku" : "A01", "lot" : "LOT-01", "quantity" : 10, "length" : 13},
        *           {"sku" : "A01", "lot" : "LOT-02", "quantity" : 20, "length" : 14},
        *           {"sku" : "A02", "lot" : "LOT-03", "quantity" : 35, "length" : 12},
        *           {"sku" : "A02", "lot" : "LOT-03", "quantity" : 45, "length" : 11}
        *       ]
        *
        *
        *       let finalData = groupReduceJsonWithChildren(initialData, 'lot');
        *
        *
        *       finalData: [{
        *                    "name": "LOT-01",
        *                    "children": [{
        *                        "sku": "A01",
        *                        "quantity": 10,
        *                        "length": 13
        *                    }]
        *                }, {
        *                    "name": "LOT-02",
        *                    "children": [{
        *                        "sku": "A01",
        *                        "quantity": 20,
        *                        "length": 14
        *                    }]
        *                }, {
        *                    "name": "LOT-03",
        *                    "children": [{
        *                        "sku": "A02",
        *                        "quantity": 35,
        *                        "length": 12
        *                    }, {
        *                        "sku": "A02",
        *                        "quantity": 45,
        *                        "length": 11
        *                    }]
        *                }]
        *
        * */

        function groupReduceJsonWithChildren(data, groupByProperty) {

            const result = data.reduce((r, {[groupByProperty]: name, ...object}) => {
                var temp = r.find(o => o.name === name);
                if (!temp) r.push(temp = {name, children: []});
                temp.children.push(object);
                return r;
            }, []);

            return result
        }


        /* =============== return the number of search results in a search object (mainly used for map reduce scripts) =============== */

        /*
        * MDIMKOV 29.10.2023: this function returns the number of search results in a search object
        *               the following parameters are being used:
        *                - [searchObj] - mandatory - the search object, for which the length will be logged
        *
        * RETURNS: integer
        *
        * INPUT: the search object, e.g. [searchObj]
        *
        * USAGE: searchResultCount(searchObj); // -> 3845
        *
        * */

        function searchResultCount(searchObj) {

            let resultSet = null;
            let resultCount = 0;
            let startIndex = 0;
            const chunkSize = 1000;

            do {
                resultSet = searchObj.runPaged({
                    pageSize: chunkSize,
                    start: startIndex
                });

                // MDIMKOV 29.10.2023: Count the results in this chunk.
                resultCount += resultSet.count;

                // MDIMKOV 29.10.2023: Move to the next chunk.
                startIndex += chunkSize;
            } while (resultSet.count === chunkSize);

            return resultCount
        }


        /* =============== Log the number of search results in a search object (mainly used for map reduce scripts) =============== */

        /*
        * MDIMKOV 01.06.2022: this function logs the number of search results in a search object
        *               the following parameters are being used:
        *                - [searchObj] - mandatory - the search object, for which the length will be logged
        *                - [logLevel] - optional - can be set to 'a' for audit; default is debug
        *                - [titleAddition] - optional - additional note that will be added
        *                - [indentLevel] - optional, integer - this one will add an indent such as [... ], [... ... ]
        *
        * RETURNS: void
        *
        * INPUT: the search object, e.g. [searchObj], an optional title addition (string), an optional ident level (integer)
        *
        * USAGE: logSearchResultCount(searchObj, 'a', 'taskSearch', 2); // -> a log record, such as [... ... number of records to process (taskSearch) --- 15]
        *
        * */

        function logSearchResultCount(searchObj, logLevel, titleAddition, indentLevel) {

            let resultSet = null;
            let resultCount = 0;
            let startIndex = 0;
            const chunkSize = 1000;

            do {
                resultSet = searchObj.runPaged({
                    pageSize: chunkSize,
                    start: startIndex
                });

                // MDIMKOV 29.10.2023: Count the results in this chunk.
                resultCount += resultSet.count;

                // MDIMKOV 29.10.2023: Move to the next chunk.
                startIndex += chunkSize;
            } while (resultSet.count === chunkSize);


            const title = titleAddition ? 'number of records to process (' + titleAddition + ') --- ' : 'number of records to process --- ';

            if (logLevel && logLevel == 'a') {
                log.audit('MDIMKOV', addIndents(indentLevel) + title + resultCount);
            } else {
                log.debug('MDIMKOV', addIndents(indentLevel) + title + resultCount);
            }
        }


        /*
        * MDIMKOV 08.07.2022: this function returns the transaction ID for a given [tranid], aka [Document Number] and the respective transaction type
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const id = getTransactionIdByTranid('SO113', 'salesorder'); // -> 17
        *
        * */

        function getTransactionIdByTranid(tranid, type) {

            let internalId = 0;
            const shortType = translateTractionTypeName(type);
            log.audit('MDIMKOV', '>>> TYPE: ' + type);
            log.audit('MDIMKOV', '>>> SHORT TYPE: ' + shortType);

            const recordSearchObj = search.create({
                type: 'transaction',
                filters:
                    [
                        ['tranid', 'is', tranid],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['type', 'anyof', shortType]
                    ],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });
            return internalId;
        }


        /*
        * MDIMKOV 08.07.2022: this function returns the transaction ID for a given [shipmentnumber], aka [Document Number], aka [Shipment Number]
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const id = getInboundShipmentIdByDocNum('INBSHIP1'); // -> 17
        *
        * */

        function getInboundShipmentIdByDocNum(docNum) {

            let internalId = 0;

            const recordSearchObj = search.create({
                type: 'inboundshipment',
                filters:
                    [['shipmentnumber', 'anyof', docNum]],
                columns:
                    ['internalid']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    internalId = result.id;
                }
                return false; // ideally it's just one record;
            });
            return internalId;
        }


        /*
        * MDIMKOV 08.07.2022: this function returns the net amount without tax from a sales order (as field is not available on record)
        *
        * RETURNS: float
        *
        * INPUT: integer - sales order ID
        *
        * USAGE: const netAmountNoTax = getNetAmountNoTax(4434); // -> 3,4456.12
        *
        * */

        function getNetAmountNoTax(id) {

            let amount = 0;

            const recordSearchObj = search.create({
                type: 'transaction',
                filters: [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['internalid', 'anyof', id]
                ],
                columns:
                    ['netamountnotax']
            });
            recordSearchObj.run().each(function (result) {
                if (result.id) {
                    amount = result.getValue(result.columns[0]);
                }
                return false; // ideally it's just one record;
            });
            return amount;
        }


        /*
        * MDIMKOV 08.07.2022: this function returns the summation of all lines returned by a saved search for a given field
        *
        * RETURNS: float
        *
        * INPUT: various
        *
        * USAGE: const myTotal = getSumOfSavedSearch('customrecord_abc', ['custrecord_nbwbh_salesorder','anyof','39903'], 'custrecord_nbwbh_netdepositamount'); // -> 3,4456.12
        *
        * */

        function getSumOfSavedSearch(recordType, filterArray, fieldName) {
            let amount = 0;

            const recordSearchObj = search.create({
                type: recordType,
                filters: filterArray,
                columns:
                    [
                        search.createColumn({
                            name: fieldName,
                            summary: 'SUM'
                        })
                    ]
            });
            recordSearchObj.run().each(function (result) {
                amount = result.getValue(result.columns[0]);
                return false; // ideally it's just one record;
            });

            return amount;
        }


        /*
        * MDIMKOV 22.07.2022: this function translates transaction type name, e.g. 'returnauthorization' into the short version, e.g. 'RtnAuth'
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: const shortTransName = translateTractionTypeNameA('returnauthorization'); // -> 'RtnAuth'
        *
        * */

        function translateTractionTypeNameA(type) {
            let newTransName = '';

            const transTypeDict = {
                'cashsale': 'CashSale',
                'check': 'Check',
                'commission': 'Commissn',
                'statementcharge': 'CustChrg',
                'creditmemo': 'CustCred',
                'customerdeposit': 'CustDep',
                'invoice': 'CustInvc',
                'payment': 'CustPymt',
                'customerrefund': 'CustRfnd',
                'quote': 'Estimate',
                'expensereport': 'ExpRept',
                'fulfillmentrequest': 'FftReq',
                'inventorycount': 'InvCount',
                'itemfulfillment': 'ItemShip',
                'journal': 'Journal',
                'payrollliabilitycheck': 'LiabPymt',
                'opportunity': 'Opprtnty',
                'paycheck': 'Paycheck',
                'purchaseorder': 'PurchOrd',
                'returnauthorization': 'RtnAuth',
                'salesorder': 'SalesOrd',
                'taxliabilitycheque': 'TaxLiab',
                'salestaxpayment': 'TaxPymt',
                'tegatapayable': 'TegPybl',
                'tegatareceivables': 'TegRcvbl',
                'transferorder': 'TrnfrOrd',
                'vendorreturnauthorization': 'VendAuth',
                'bill': 'VendBill',
                'cashpayment': 'VendPymt',
                'workorder': 'WorkOrd'
            };

            newTransName = transTypeDict[type];

            return newTransName;
        }


        /*
        * MDIMKOV 22.07.2022: this function translates transaction type short name, e.g. 'RtnAuth' into the long version, e.g. 'returnauthorization'
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: const longTransName = translateTractionTypeNameB('RtnAuth'); // -> 'returnauthorization'
        *
        * */

        function translateTractionTypeNameB(type) {
            let newTransName = '';

            const transTypeDict = {
                'CashSale': 'cashsale',
                'Check': 'check',
                'Commissn': 'commission',
                'CustChrg': 'statementcharge',
                'CustCred': 'creditmemo',
                'CustDep': 'customerdeposit',
                'CustInvc': 'invoice',
                'CustPymt': 'payment',
                'CustRfnd': 'customerrefund',
                'Estimate': 'quote',
                'ExpRept': 'expensereport',
                'FftReq': 'fulfillmentrequest',
                'InvCount': 'inventorycount',
                'ItemShip': 'itemfulfillment',
                'Journal': 'journal',
                'LiabPymt': 'payrollliabilitycheck',
                'Opprtnty': 'opportunity',
                'Paycheck': 'paycheck',
                'PurchOrd': 'purchaseorder',
                'RtnAuth': 'returnauthorization',
                'SalesOrd': 'salesorder',
                'TaxLiab': 'taxliabilitycheque',
                'TaxPymt': 'salestaxpayment',
                'TegPybl': 'tegatapayable',
                'TegRcvbl': 'tegatareceivables',
                'TrnfrOrd': 'transferorder',
                'VendAuth': 'vendorreturnauthorization',
                'VendBill': 'bill',
                'VendPymt': 'cashpayment',
                'WorkOrd': 'workorder'
            };

            newTransName = transTypeDict[type];

            return newTransName;
        }


        /*
        * MDIMKOV 22.07.2022: this function translates transaction type short name, e.g. 'VendBill' into the real type name,
        *       which can be used when loading an object, e.g. 'vendorbill'
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: const longTransName = translateTractionTypeNameC('VendBill'); // -> 'vendorbill'
        *
        * */

        function translateTractionTypeNameC(type) {
            let newTransName = '';

            const transTypeDict = {
                'CashSale': 'cashsale',
                'Check': 'check',
                'Commissn': 'xxxxxx',
                'CustChrg': 'xxxxxx',
                'CustCred': 'xxxxxx',
                'CustDep': 'customerdeposit',
                'CustInvc': 'invoice',
                'CustPymt': 'customerpayment',
                'CustRfnd': 'customerrefund',
                'Estimate': 'estimate',
                'ExpRept': 'expensereport',
                'FftReq': 'xxxxxx',
                'InvCount': 'inventorycount',
                'InvAdjst': 'inventoryadjustment',
                'InvTrnfr': 'inventorytransfer',
                'ItemRcpt': 'itemreceipt',
                'ItemShip': 'itemfulfillment',
                'Journal': 'journalentry',
                'LiabPymt': 'xxxxxx',
                'Opprtnty': 'opportunity',
                'Paycheck': 'xxxxxx',
                'PurchOrd': 'purchaseorder',
                'RtnAuth': 'returnauthorization',
                'SalesOrd': 'salesorder',
                'TaxLiab': 'xxxxxx',
                'TaxPymt': 'xxxxxx',
                'TegPybl': 'xxxxxx',
                'TegRcvbl': 'xxxxxx',
                'TrnfrOrd': 'transferorder',
                'VendAuth': 'xxxxxx',
                'VendBill': 'vendorbill',
                'VendPymt': 'xxxxxx',
                'WorkOrd': 'workorder',
                'VPrep': 'xxxxxx',
                'VPrepApp': 'xxxxxx'
            };

            newTransName = transTypeDict[type];

            return newTransName;
        }


        /*
        * // MDIMKOV 26.11.2023: this function translates transaction type name, e.g. 'vendorbill' into an ntype ID, such as 17,
        *       which can be used when loading working with custom fields based on the "Transaction Type" list
        *
        * RETURNS: integer
        *
        * INPUT: string
        *
        * USAGE: const ntypeTransId = translateTractionTypeNameD('vendorbill'); // -> 17
        *
        * */

        function translateTractionTypeNameD(type) {
            let newTransName = null;

            const transTypeDict = {
                'cashsale': 0,
                'check': 0,
                'customerdeposit': 0,
                'customerpayment': 0,
                'customerrefund': 0,
                'estimate': 0,
                'expensereport': 0,
                'inventorycount': 0,
                'inventoryadjustment': 11,
                'inventorytransfer': 12,
                'itemreceipt': 16,
                'itemfulfillment': 0,
                'journalentry': 1,
                'journal': 1,
                'opportunity': 0,
                'purchaseorder': 15,
                'returnauthorization': 0,
                'salesorder': 31,
                'transferorder': 0,
                'vendorbill': 17,
                'invoice': 7,
            };


            newTransName = transTypeDict[type];

            return newTransName;
        }


        /*
* // IMITROVA 12.12.2023: this function translates transaction ntype ID, such as 17, into transaction type name in NetSuite BUILTIN.DF(type), e.g. 'Bill' (type ='VendBill' , recordType = 'vendorbill')
* which can be used when working with custom fields based on the "Transaction Type" ID -> links transaction type IDs with transaction type NAME displayed in frond-end
*
* check available transaction types in your project
* // select BUILTIN.DF(t.type) as BuildIn_Type, t.type, t.recordType, max(t.tranDate) as lastTranDate , count(*)
* // from transaction t
* // group by BUILTIN.DF(t.type) , t.type, t.recordType
*
*
* RETURNS: string
*
* INPUT: integer
*
* USAGE: const transType = translateTractionTypeNameE(17); // -> 'Bill' (BUILTIN.DF(t.type) = 'Bill' , type ='VendBill' , recordType = 'vendorbill')
*
* */

        function translateTractionTypeNameE(type) {
            let newTransName = null;

            const transTypeDict = {
                1: 'Journal',
                2: 'Transfer',
                3: 'Check',
                4: 'Deposit',
                5: 'Cash Sale',
                6: 'Quote',
                7: 'Invoice',
                8: 'Statement Charge',
                9: 'Payment',
                10: 'Credit Memo',
                11: 'Inventory Adjustment',
                12: 'Inventory Transfer',
                13: 'Inventory Worksheet',
                14: 'Inventory Distribution',
                15: 'Purchase Order',
                16: 'Item Receipt',
                17: 'Bill',
                18: 'Bill Payment',
                19: 'Bill CCard',
                20: 'Bill Credit',
                21: 'Credit Card',
                22: 'CCard Refund',
                23: 'Sales Tax Payment',
                24: 'Paycheck',
                25: 'Payroll Liability Check',
                26: 'Payroll Adjustment',
                27: 'Liability Adjustment',
                28: 'Expense Report',
                29: 'Cash Refund',
                30: 'Customer Refund',
                31: 'Sales Order',
                32: 'Item Fulfillment',
                33: 'Return Authorization',
                34: 'Assembly Build',
                35: 'Assembly Unbuild',
                36: 'Currency Revaluation',
                37: 'Opportunity',
                38: 'Commission',
                40: 'Customer Deposit',
                41: 'Deposit Application',
                42: 'Bin Putaway Worksheet',
                43: 'Vendor Return Authorization',
                44: 'Work Order',
                45: 'Bin Transfer',
                46: 'Revenue Commitment',
                47: 'Revenue Commitment Reversal',
                48: 'Transfer Order',
                49: 'Tegata Receivables',
                50: 'Tegata Payable',
                51: 'Inventory Cost Revaluation',
                52: 'Finance Charge',
                56: 'Paycheck Journal',
                57: 'Inventory Count',
                74: 'System Journal'
            };


            newTransName = transTypeDict[type];

            return newTransName;
        }


        /* =============== Create and save a CSV file generated from a saved search and return the file ID =============== */

        /*
        * MDIMKOV 29.07.2022: this function creates and saves a CSV file generated from a saved search and returns the file ID
        *
        * RETURNS: integer (the saved file ID)
        *
        * INPUT: saved search id, file name (including file extension), folder id
        *
        * USAGE: savedFileId = createCsvFileFromSavedSearch('customsearch_my_ss', 'my_report.csv', 113); // -> 55849
        *
        * */


        function createCsvFileFromSavedSearch(ssId, fileName, folderId) {

            // TVZ - 2024-10-25: this function will remove any escape characters
            function sanitizeForCSV(input) {
                if (typeof input !== 'string') return '';

                return input
                    .replace(/,/g, '')        // Remove commas
                    .replace(/'/g, '')        // Remove single quotes
                    .replace(/"/g, '')        // Remove double quotes
                    .replace(/\n/g, ' ')      // Replace new lines with a space
                    .replace(/\r/g, ' ')      // Replace carriage returns with a space
                    .trim();                  // Remove leading/trailing whitespace
            }

            // MDIMKOV 29.07.2022: run the search and prepare the file contents
            let fileContets = '';

            const savedSearchObj = search.load({
                id: ssId
            });

            // MDIMKOV 29.07.2022: get the column names to be used as column headings
            const columnHeadings = savedSearchObj.columns.map(function (col) {
                return col.label.replace(',', '-');
            });

            fileContets += columnHeadings.join(',') + '\n';


            // MDIMKOV 29.07.2022: iterate through results and write them to the file contents
            savedSearchObj.run().each(function (result) {

                // Map each column's value to a sanitized, comma-separated string
                const rowValues = savedSearchObj.columns.map(function (col) {
                    let valueToAppend = result.getText(col) ? result.getText(col) : result.getValue(col);
                    return '"' + sanitizeForCSV(valueToAppend) + '"';
                });

                // Join the values with commas and add a newline at the end
                fileContets += rowValues.join(',') + '\n';

                return true;
            });

            log.debug('fileContets', fileContets);


            // MDIMKOV 29.07.2022: create the file object and save it
            const fileObj = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: fileContets,
                encoding: file.Encoding.UTF8,
                folder: folderId,
            });

            const fileId = fileObj.save();
            log.debug('fileId', fileId);

            return fileId;
        }


        /* =============== Gets a script parameter value for the deployment, which is currently running =============== */

        /*
        * MDIMKOV 26.07.2022: this function gets a script parameter for the deployment, which is currently running
        *
        * RETURNS: any (the script parameter value)
        *
        * INPUT: parameter name (string)
        *
        * USAGE: getScriptParameter('custscript_minamountowed'); // -> 123
        *
        * */

        function getScriptParameter(param) {
            const scriptObj = runtime.getCurrentScript();
            return scriptObj.getParameter(param);
        }


        /* =============== Sets a script parameter for the deployment, which is currently running, or for another script deployment =============== */

        /*
        * MDIMKOV 26.07.2022: this function sets a script parameter either for the deployment, which is currently running, or, if the
        *               optionalDeploymentId parameter is being provided, then for the deployment ID provided
        *
        * RETURNS: void
        *
        * INPUT: parameter name (string), value (any)
        *
        * USAGE: setScriptParameter('custscript_minamountowed', 123);
        * USAGE: setScriptParameter('custscript_minamountowed', 123, 'customdeploy_st_post_sb_rfr_tsks_ss');
        *
        * */

        function setScriptParameter(param, value, optionalDeploymentId) {
            let me = runtime.getCurrentScript();
            const mySearch = search.create({
                type: search.Type.SCRIPT_DEPLOYMENT,
                filters: [
                    search.createFilter({
                        name: 'scriptid',
                        operator: search.Operator.IS,
                        values: optionalDeploymentId ? optionalDeploymentId : me.deploymentId
                    })
                ]
            });

            const searchResults = mySearch.run().getRange({
                start: 0,
                end: 1
            });

            for (var i = 0; i < searchResults.length; i++) {
                const recDeployment = record.load({
                    type: record.Type.SCRIPT_DEPLOYMENT,
                    id: searchResults[i].id
                });
                recDeployment.setValue(param, value);
                recDeployment.save();
            }
        }


        /* =============== Generate a new unique id / number / code by using a record type that generates such =============== */

        /*
        * MDIMKOV 26.07.2022: this function generates a new unique id / number / code by using a record type that generates incremental numbers
        *               for this to work, you need a new custom record type, for which:
        *                   - SHOW ID is ticked
        *                   - The "Include Name Field" is UNCHECKED!!!
        *                   - Numbering is enabled
        *               the field that will generate the new id / number / code is called 'name', because the "SHOW ID" is actually NAME now
        *               no fields need to be added to the custom record type, although it's optionally possible
        *
        * RETURNS: any (the new id / number / code)
        *
        * INPUT: string (the custom record type id)
        *
        * USAGE: const newNum = generateUniqueNumber('customrecord_bb1_production_batch'); // -> 123
        *
        * */

        function generateUniqueNumber(recordType) {

            let newNumber = 0;

            const rec = record.create({
                type: recordType,
                isDynamic: false
            });

            const recId = rec.save();

            if (recId) {
                newNumber = getFieldValue('name', recordType, recId);
            }

            return newNumber;
        }


        /* =============== Round a number up to 2 digits after the decimal point  =============== */

        /*
        * MDIMKOV 01.08.2022: this function rounds a number up to 2 digits after the decimal point
        *
        * RETURNS: decimal, rounded
        *
        * INPUT: decimal
        *
        * USAGE: const roundedNumber = roundAmount(1.2334); // -> 1.23
        *
        * */

        function roundAmount(amt) {
            amt = Number(amt);
            amt = Math.round((amt + 0.00001) * 100) / 100;
            return amt;
        }


        /* =============== Retrieve the inventory number id (serial number, lot number id), so it can be used while assigning inventory details =============== */

        /*
        * // MDIMKOV 11.10.2022: this functiongets the inventory number id (serial number, lot number id), so it can be used while assigning inventory details
        *               - using the location id is optional
        *
        * RETURNS: integer
        *
        * INPUT: string, integer -- the serial/lot number string and the optional warehouse (location) id
        *
        * USAGE: const serialNumId = getLotSerialNumId('abc110013', 15); // -> 228
        *
        * */

        function getLotSerialNumId(serialNumber, locationId) {

            let returnValue = null;

            let filters = []

            // MDIMKOV 11.10.2022: define the filters based on whether the location is being supplied
            if (locationId) {
                filters = [
                    ['inventorynumber', 'is', serialNumber],
                    'AND',
                    ['location', 'anyof', locationId]
                ]
            } else {
                filters = [
                    ['inventorynumber', 'is', serialNumber]
                ]
            }

            const mySearch = search.create({
                type: 'inventorynumber',
                filters: filters,
                columns: ['internalid']
            });

            mySearch.run().each(function (result) {
                returnValue = result.getValue(result.columns[0]);
                return false; // only the single (or first) record needs to be returned
            });

            return returnValue;
        }


        /* =============== Execute JSON.parse by first cleaning the string from unwanted characters =============== */

        /*
        * // MDIMKOV 19.10.2022: this function will perform JSON.parse on a given string by first cleaning the string as follows:
        *       - remove leading and trailing double quotes -- mainly when using Celigo and other platforms that supply the string with quotes
        *       - remove the occurrence of &quot; -- also in Celigo and other platforms that encode the double quotes, invisible for the NetSuite logging
        *
        * RETURNS: object (JSON object)
        *
        * INPUT: string
        *
        * USAGE: const parsedContent = jsonparse('Hello World'); // -> [object]
        *
        * */

        function jsonparse(str) {
            let returnVar = null;
            let newStr = str;

            // MDIMKOV 18.10.2022: remove potential double quotes ["] from the beginning and the end of the string
            if (str.startsWith("\"") && str.endsWith("\"")) {
                newStr = str.substring(1, str.length - 1);
            }

            // MDIMKOV 18.10.2022: replace any potential occurrences of [&quot;] and replace them with double quotes ["]
            let finalStr = newStr.replace(/&quot;/g, '\"');

            // MDIMKOV 18.10.2022: execute JSON parse
            returnVar = JSON.parse(finalStr);

            return returnVar;
        }


        /* =============== Test a JSON string, print each character between '~' characters, to see real contents =============== */

        /*
        * MDIMKOV 21.11.2022: this function will take a string as an input and will then print it out following the example:
        *        - input: MILCHO
        *        - output: M~I~L~C~H~O
        *       then, the output can be pasted into Notepad and all '~' characters replaced by empty string to see the REAL content
        *       this works around a problem that a string containing '&quot;' among other letters will be displayed as '"' if logging is presented via HTML (e.g. NetSuite logging)
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: testJsonString('MILCHO', 'log results...') // -> the system will log M~I~L~C~H~O (with the respective log title); use this to find/replace later
        *
        * */

        function testJsonString(str, logTitle) {
            let fullString = '';
            for (let i = 0; i < str.length; i++) {
                fullString += str[i] + '~';
            }
            log.debug(logTitle, fullString);
        }


        /* =============== Format a number and add a thousands separator (a space) =============== */

        /*
        * MDIMKOV 09.05.2023: this function will take a number as input and will then print it out with a space thousands separator:
        *        - input: 73000
        *        - output: 73 000
        *
        * RETURNS: string
        *
        * INPUT: number
        *
        * USAGE: formatNumberWithSpaceSeparator(73000); // => 73 000
        *
        * */

        function formatNumberWithSpaceSeparator(num) {
            let str = num.toString();
            let parts = str.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            return parts.join('.');
        }


        /* =============== Format a number and add a thousands separator (a coma) and round up to 2 decimal points =============== */

        /*
        * MDIMKOV 05.06.2023: this function will take a number as input and will then print it out with a coma thousands separator
        *   it will also round the number up to the second decimal point:
        *        - input: 73000.1466
        *        - output: 73,000.15
        *
        * RETURNS: string
        *
        * INPUT: number
        *
        * USAGE: formatNumber(73000.1477, 2, ','); // => 73,000.15
        *
        * */

        function formatNumber(number, decimals, separator) {
            if (!number) {
                return null;
            }
            var formattedNumber = format.format({
                value: number,
                type: format.Type.CURRENCY,
                decimals: decimals,
                groupSeparator: separator
            });

            return formattedNumber;
        }


        /* =============== Get a friendly account name, consisting of the account number and the name without hierarchy =============== */

        /*
        * MDIMKOV 16.06.2023: this function will get a friendly account name, consisting of the account number and the name without hierarchy
        *        - input: 51304 Cost of Goods Sold : Contract Services : Catering
        *        - output: 51304 Catering
        *
        * RETURNS: string
        *
        * INPUT: string
        *
        * USAGE: getAccountFriendlyName('51304 Cost of Goods Sold : Contract Services : Catering'); // => 51304 Catering
        *
        * */

        function getAccountFriendlyName(acctName) {
            // Find the index of the first occurrence of an integer in the acctNameing
            const firstIntegerIndex = acctName.search(/\d/);

            // Extract the integer from the acctNameing
            const integer = acctName.slice(firstIntegerIndex).match(/\d+/)[0];

            // Find the index of the last occurrence of the column (:) sign
            const lastColonIndex = acctName.lastIndexOf(':');

            // Extract the last part of the acctNameing after the last colon
            const lastPart = acctName.slice(lastColonIndex + 1).trim();

            // Append the last part to the integer
            const result = integer + ' ' + lastPart;

            return result;
        }


        /* =============== Get the short name of a department / class / location =============== */

        /*
        * MDIMKOV 19.06.2023: since loading a department / class / location will always return the long (hierarchical) name,
        *                       such as 'Finance : Operations : ...', this function returns only the short name
        *
        * RETURNS: string
        *
        * INPUT: string - classification type
        *        integer - classification ID
        *
        * USAGE: getClassificationName('department', 123); // => 'Finance'
        *
        * */

        function getClassificationName(classificationType, classificationId) {

            let classificationName = '';

            const classificationSearch = search.create({
                type: classificationType,
                filters:
                    [
                        ['internalid', 'anyof', classificationId]
                    ],
                columns:
                    [
                        'namenohierarchy'
                    ]
            });
            classificationSearch.run().each(function (result) {
                classificationName = result.getValue(result.columns[0]);
                return false; // ideally only one result
            });

            return classificationName;
        }


        /* =============== Get all child IDs for department / class / location for a given parent =============== */

        /*
        * MDIMKOV 19.06.2023: this function will return an array of all department / class / location IDs for a given parent ID
        *
        * RETURNS: array of integers
        *
        * INPUT: string - classification type
        *        integer - classification ID
        *        boolean - wether or not to include the parent ID (the input ID) as well
        *
        * USAGE: getAllChildClassifications('department', 123, true); // => [123, 554, 667, 285]
        *
        * */

        function getAllChildClassifications(classificationType, classificationId, includeParentId) {

            // MDIMKOV 19.06.2023: declare the output variable and add the input classificationId, as it will be part of the set:
            const childClassificationIDs = [];
            if (includeParentId) {
                childClassificationIDs.push(classificationId);
            }


            // MDIMKOV 19.06.2023: find the short name of the department/class/location that was given as input (e.g. 'Finance')
            const classificationShortName = getClassificationName(classificationType, classificationId);


            // MDIMKOV 19.06.2023: the search will be checked for the classifications starting with e.g. 'Finance : '
            const classificationStartsWith = classificationShortName + ' : ';


            // MDIMKOV 19.06.2023: return the full hierarchical names of all classifications (locations, classes or departments)
            const classificationSearch = search.create({
                type: classificationType,
                filters: [],
                columns: [
                    'internalid',
                    'name'
                ]
            });

            classificationSearch.run().each(result => {
                const classificationId = result.getValue({
                    name: 'internalid'
                });
                const classificationFullName = result.getValue({
                    name: 'name'
                });

                if (classificationFullName.startsWith(classificationStartsWith)) {
                    childClassificationIDs.push(classificationId);
                }

                return true;
            });

            return childClassificationIDs;
        }


        /* =============== Get the transaction by passing the transaction internal id =============== */

        /*
        * MDIMKOV 21.06.2023: this function will take a transaction internal ID as an input and will return the transaction type, such as 'vendorbill'
        *        - input: 45622
        *        - output: vendorbill
        *
        * RETURNS: string
        *
        * INPUT: integer
        *
        * USAGE: getTransactionType(6654) // -> 'vendorbill'
        *
        * */

        function getTransactionType(internalId) {
            let transactionType = null;

            const rawType = singleRecordSearch(
                'transaction', [['mainline', 'is', 'T'], 'AND', ['internalid', 'anyof', internalId]], 'type');

            if (rawType) {
                transactionType = translateTractionTypeNameC(rawType)
            }

            return transactionType;
        }


        /* =============== Retrieve one (the first) record from a SQL query - field name and get its value on the resulting record =============== */

        /*
        * MDIMKOV 15.03.2024: this function will construct a SQL query to retrieve the first (or single) record of it
        *
        * RETURNS: any
        *
        * INPUT: various
        *
        * USAGE: const getSomeValues = singleRecordSearchSql('item', "externalid = '01t6900000AOAuxAAH'", 'id', null, null, null); // -> 58846
        *
        * */

        function singleRecordSearchSql(recordType, filterString, fieldName, isGetText, orderByFieldName, isDescending) {

            // MDIMKOV 15.03.2024: initialize the variables
            const orderDirection = isDescending ? 'DESC' : 'ASC';
            let fieldNameReady = fieldName;

            if (isGetText) {
                fieldNameReady = 'BUILTIN.DF(' + fieldName + ')'
            }

            const orderByClause = orderByFieldName ? " ORDER BY " + orderByFieldName + " " + orderDirection : '';

            const sql =
                " SELECT " + fieldNameReady +
                " FROM " + recordType +
                " WHERE " + filterString +
                orderByClause;
            // log.debug('MDIMKOV', 'sql: ' + sql);

            const resultSet = query.runSuiteQL({query: sql}).asMappedResults();
            // log.debug('MDIMKOV', 'resultSet: ' + resultSet);

            if (!resultSet || resultSet.length === 0) {
                return null;
            } else {
                let result = JSON.stringify(resultSet[0].expr1 ? resultSet[0].expr1 : resultSet[0][fieldName]);

                // TVZ - 2024-10-19: remove surrounding quotes, if existing
                if (result && result.startsWith('"') && result.endsWith('"')) {
                    result = result.slice(1, -1);
                }

                return result;
            }
        }


        /* =============== Get the start date or end date of an accounting period =============== */

        /*
        * MDIMKOV 26.06.2023: this function will take an accounting period internal ID as an input and will return the period start date and end date
        *        - input: 164
        *        - output: {'startdate': '1/1/2022', 'enddate': '1/31/2022'}
        *
        * RETURNS: object with both start and end date objects
        *
        * INPUT: integer (period ID)
        *
        * USAGE: const startDate = getAcctPeriodDate(164).startdate // -> '1/1/2022'
        *
        * */

        function getAcctPeriodDate(periodId) {
            let returnObj = {};

            const fieldLookUp = search.lookupFields({
                type: 'accountingperiod',
                id: periodId,
                columns: ['startdate', 'enddate']
            });

            if (fieldLookUp) {
                returnObj.startdate = format.parse({value: fieldLookUp.startdate, type: format.Type.DATE});
                returnObj.enddate = format.parse({value: fieldLookUp.enddate, type: format.Type.DATE});
            }

            return returnObj;
        }

        // MDIMKOV 06.03.2023: this function will print today's date in the following format: 6/28/2023
        function printTodaysDate() {
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();
            const year = today.getFullYear();
            return month + '/' + day + '/' + year
        }


        // MDIMKOV 06.03.2023: this function converts an input date object into the format of 6/28/2023
        function printDate(date) {
            const varDate = new Date(date);
            const month = varDate.getMonth() + 1;
            const day = varDate.getDate();
            const year = varDate.getFullYear();
            return month + '/' + day + '/' + year
        }


        // MDIMKOV 07.03.2023: this function will take an input number and add the respective zeros at the end (e.g. 353.1 => 353.10)
        function convertNumberToString(num) {
            if (num % 1 === 0) {
                return num.toFixed(2);
            } else if (num.toFixed(1) === num.toFixed(2)) {
                return num.toFixed(1) + "0";
            } else {
                return num.toFixed(2);
            }
        }


        // MDIMKOV 08.03.2023: this function returns the decimal part of a decimal number (up to a given number of decimal places) (e.g. 353.10 => '10')
        function getDecimalPartAsString(num, decimalPlaces) {
            const numString = num.toString();
            const decimalIndex = numString.indexOf('.');
            if (decimalIndex !== -1) {
                let decimalPart = numString.slice(decimalIndex + 1);
                decimalPart = decimalPart.replace(/0+$/, '');
                if (decimalPlaces) {
                    decimalPart = decimalPart.padEnd(decimalPlaces, '0');
                    decimalPart = decimalPart.slice(0, decimalPlaces);
                }
                return decimalPart !== '' ? decimalPart : '0';
            }
            if (decimalPlaces) {
                return '0'.padEnd(decimalPlaces, '0');
            }
            return "0";
        }


        /* =============== For a given date, get the month in a 'MM/YYYY' (or 'MM/YY') string =============== */

        /*
        * MDIMKOV 26.06.2023: this function will take a date object as input and will produce a 'MM/YYYY' (or 'MM/YY') string
        *
        * RETURNS: string (e.g. '06/2023' or '06/23')
        *
        * INPUT: date           => date object
        *        isTwoDigitYear => boolean: when true, than only the last two digits of the year are given
        *
        * USAGE: const theMonth = convertDateToMonthYearString(new Date(), false) // -> '06/2023'
        *
        * */

        function convertDateToMonthYearString(date, isTwoDigitYear) {
            const month = date.getMonth() + 1; // Adding 1 since getMonth() returns a zero-based index
            let year = date.getFullYear().toString();

            if (isTwoDigitYear) {
                year = year.slice(-2);
            }

            // Pad the month with a leading zero if necessary
            let paddedMonth = month < 10 ? `0${month}` : month;

            return `${paddedMonth}/${year}`;
        }


        /* =============== Return the period name for a given period ID =============== */

        /*
        * MDIMKOV 26.06.2023: this function will take a period ID as input and will return a string such as 'Jun 2022'
        *
        * RETURNS: string (e.g. 'Jun 2022')
        *
        * INPUT: integer (the period ID)
        *
        * USAGE: const periodName = getPeriodName(123) // -> 'Jun 2022'
        *
        * */

        function getPeriodName(periodId) {
            let periodName = ''

            periodName = getFieldValue('periodname', 'accountingperiod', periodId);

            return periodName;
        }


        /* =============== Set a field on all lines of a transaction with a certain value =============== */

        /*
        * MDIMKOV 07.07.2023: this function will take a transaction internal id as input and set a given field with a certain value on all lines
        *
        * RETURNS: void
        *
        * INPUT: internalId     integer         the transaction ID
        *        transType      string          the transaction type, such as 'salesorder'
        *        sublist        string          the sublist name, such as 'item'
        *        fieldId        string          the field ID
        *        value          any             the value to be set
        *
        * USAGE: setFieldOnTransLines(false, 123, 'invoice', 'item', 'memo', 'test', 'apply', 'T') // -> void
        *
        * */

        function setFieldOnTransLines(logs, internalId, transType, sublist, fieldId, value, criteriaFieldId, criteriaValue) {

            logs ? log.debug('setFieldOnTransLines', '') : null;
            logs ? log.debug(
                'setFieldOnTransLines',
                'internalId: ' + internalId +
                '; transType: ' + transType +
                '; sublist: ' + sublist +
                '; fieldId: ' + fieldId +
                '; value: ' + value +
                '; criteriaFieldId: ' + criteriaFieldId +
                '; criteriaValue: ' + criteriaValue
            ) : null;

            const rec = record.load({
                type: transType,
                id: internalId,
                isDynamic: true
            });

            logs ? log.debug('setFieldOnTransLines', 'line count (sublist=' + sublist + '): ' + rec.getLineCount({sublistId: sublist})) : null;
            for (let i = 0; i < rec.getLineCount({sublistId: sublist}); i++) {

                log ? log.debug('setFieldOnTransLines', '') : null;
                log ? log.debug('setFieldOnTransLines', '... now processing line i=' + i) : null;

                let currentValue = null;

                rec.selectLine({
                    sublistId: sublist,
                    line: i
                });

                // MDIMKOV 07.07.2023: if criteria have been defined, they are respected here
                if (criteriaFieldId) {
                    currentValue = rec.getCurrentSublistValue({
                        sublistId: sublist,
                        fieldId: criteriaFieldId
                    });
                }

                if (!criteriaFieldId || (criteriaValue == currentValue)) {
                    log ? log.debug('setFieldOnTransLines', '... criteria met => line i=' + i + ' will be processed') : null;
                    rec.setCurrentSublistValue({
                        sublistId: sublist,
                        fieldId: fieldId,
                        value: value
                    });
                }

                rec.commitLine({
                    sublistId: sublist
                });
            }
            rec.save();
        }


        /* =============== Return the IP address that the current NetSuite account is using to execute HTTPS calls =============== */

        /*
        * MDIMKOV 10.07.2023: this function will return the IP address that the current NetSuite account is using to execute HTTPS calls (used for white listing, whitelisting)
        *
        * RETURNS: string       the IP Address
        *
        * INPUT: none
        *
        * USAGE: const ip = getCurrentIpAddress(); // => 155.133.82.167
        *
        * */

        function getCurrentIpAddress() {

            const ipResponse = https.get({
                url: 'https://api.ipify.org/?format=json',
            });

            const ipResponseBody = ipResponse.body;
            const ipAddress = JSON.parse(ipResponseBody).ip;

            return ipAddress;
        }


        /* =============== Return the item Income Account ID, based on Item ID =============== */

        /*
        * MDIMKOV 10.09.2023: this function will return the item Income Account ID, based on Item ID
        *
        * RETURNS: integer          the account ID
        *
        * INPUT: integer            the item ID
        *
        * USAGE: const acctId = getItemIncomeAccountId(123); //=> 456
        *
        * */

        function getItemIncomeAccountId(itemId) {

            let accountId = 0;

            accountId = singleRecordSearch('item', ['internalid', 'anyof', itemId], 'incomeaccount', false);

            return accountId;
        }


        /* =============== Return the item Expense (COGS) Account ID, based on Item ID =============== */

        /*
        * MDIMKOV 10.09.2023: this function will return the item Expense (COGS) Account ID, based on Item ID
        *
        * RETURNS: integer          the account ID
        *
        * INPUT: integer            the item ID
        *
        * USAGE: const acctId = getItemExpenseAccountId(123); //=> 789
        *
        * */

        function getItemExpenseAccountId(itemId) {

            let accountId = 0;

            accountId = singleRecordSearch('item', ['internalid', 'anyof', itemId], 'expenseaccount', false);

            return accountId;
        }


        /* =============== Excamine a JSON object for overlapping date ranges; output an array with the overlapping record IDs =============== */

        /*
        * MDIMKOV 20.09.2023: this function will excamine a JSON object for overlapping date ranges; output an array with the overlapping record IDs
        *
        *       Note: if the to_date is omitted, a day far in future is given (1/1/2199)
        *
        * RETURNS: array of integers, such as [49, 233, 884, 1099]
        *
        * INPUT: [
        *            {
        *                "ID": 1,
        *                "from_date": "2022-01-10",
        *                "to_date": "2022-02-15"
        *            },
        *            {
        *                "ID": 2,
        *                "from_date": "2022-01-20",
        *                "to_date": "2022-02-25"
        *            },
        *            {
        *                "ID": 3,
        *                "from_date": "2022-03-01",
        *                "to_date": "2022-03-15"
        *            }
        *        ]
        *
        * USAGE: checkOverlappingDateRanges(---JSON data from above---) // -> [49, 233, 884, 1099]
        *
        * */

        function checkOverlappingDateRanges(data) {
            const overlappingIDs = [];

            for (let i = 0; i < data.length; i++) {
                const memberA = data[i];
                const fromA = new Date(memberA.from_date);
                let toA = new Date(memberA.to_date);

                // MDIMKOV 21.09.2023: in case the date was omitted, set it to 1/1/2199
                if (toA.getFullYear() == 1969) {
                    toA = new Date('2199-01-01');
                }

                for (let j = i + 1; j < data.length; j++) {
                    const memberB = data[j];
                    const fromB = new Date(memberB.from_date);
                    const toB = new Date(memberB.to_date);

                    // Check for overlap
                    if ((fromA <= toB && toA >= fromB) || (fromB <= toA && toB >= fromA)) {
                        // Overlapping periods found, add both IDs to the result
                        if (!overlappingIDs.includes(memberA.id)) {
                            overlappingIDs.push(memberA.id);
                        }
                        if (!overlappingIDs.includes(memberB.id)) {
                            overlappingIDs.push(memberB.id);
                        }
                    }
                }
            }

            return overlappingIDs;
        }


        /* =============== Prevent entering a record that has a value in a certain field that is already used on another record =============== */

        /*
        * MDIMKOV 25.09.2023: this function would raise an error in a client script (mainly on [save]) if in a given field the user enters a value,
        *       which is already used in the same field in another record (e.g., suitable for transaction ID etc.)
        *
        * RETURNS:      boolean        if [true] is returned, use it to raise message, as shown in the USAGE below
        *
        * INPUT:        recordType     the record type, such as 'salesorder' or 'employee'
        *               currentValue   the value that is currently being added into the field (could be any type)
        *               fieldId        the fieldId for which this is checked, e.g., custbody_my_field
        *               internalId     the internal id of the current record (if existing)
        *
        * NOTE:         The internalId parameter is supplied, so that it is being excluded from the saved search, to avoid counting the current record
        *                       if this is a new record, the internal id doesn't exist anyways
        *                       if the user is editing and existing record, supplying the internal id guarantees that the current record is excluded from the saved search
        *
        * USAGE:        1. Import the ['N/ui/dialog'] module
        *
        *               2. Potentially, script the [saveRecord] entry point on a client script
        *
        *               3. Use the following:
        *
        *               if (preventDuplicateValue('salesorder', 43425, 'memo', 123)) {
        * 	                    dialog.alert({
        *                         title: 'Duplicate Detected',
        *                         message: 'This store front number was already used, please use a different one.'
        *                       });
        *
        *    		            return false;
        *               }
        *
        * */

        function preventDuplicateValue(recordType, currentValue, fieldId, internalId) {

            let returnValue = false;

            foundRecId = singleRecordSearch(recordType, [
                [fieldId, 'is', currentValue],
                'AND',
                ['internalid', 'noneof', internalId ? internalId : 0]
            ], 'internalid');

            if (foundRecId) {
                returnValue = true;
            }

            return returnValue;
        }


        /* =============== Upsert address for vendor / customer record types =============== */

        /*
        * PLEASE NOTE - there is a new function: addOrUpdateRecordAddress(...)
        * MDIMKOV 26.09.2023: this function will add (or update) an address for an existing customer or vendor
        *
        * RETURNS: integer  the NetSuite internal id for the respective customer/vendor, in case upsert is successful
        *
        * INPUT:    record reference, JSON object
        *
        * USAGE:
        *       PLEASE NOTE - there is a new function: addOrUpdateRecordAddress(...)
                const recRef = record.load({
                    type: record.Type.CUSTOMER,
                    id: 2345,
                    isDynamic: true
                });

                const addrJSON = [
                    {field: 'country', value: 'NL'},
                    {field: 'attention', value: ''},
                    {field: 'addressee', value: 'Raccoon invoice entity'},
                    {field: 'addr1', value: 'Oranjestraat 12'},
                    {field: 'addr2', value: ''},
                    {field: 'zip', value: '1056'},
                    {field: 'city', value: 'Amsterdam'},
                    {field: 'state', value: 'Noord-Holland'}
                ]

           const isAddr = upsertAddress(recRef, addrJSON); // => true
        * PLEASE NOTE - there is a new function: addOrUpdateRecordAddress(...)
        *
        * */

        function upsertAddress(recRef, addrJSON) {

            const currentAddressCount = recRef.getLineCount({
                'sublistId': 'addressbook'
            });

            if (currentAddressCount === 0) {
                recRef.selectNewLine({
                    sublistId: 'addressbook'
                });
            } else {
                recRef.selectLine({
                    sublistId: 'addressbook',
                    line: 0
                });
            }

            const addressSubrecord = recRef.getCurrentSublistSubrecord({
                sublistId: 'addressbook',
                fieldId: 'addressbookaddress'
            });

            for (let i = 0; i < addrJSON.length; i++) {
                if (addrJSON[i].field) {
                    addressSubrecord.setValue({
                        fieldId: addrJSON[i].field,
                        value: addrJSON[i].value
                    });
                }
            }

            recRef.commitLine({
                sublistId: 'addressbook'
            });

            const recRefId = recRef.save();

            return recRefId;
        }


        /* =============== add a line to an existing file =============== */

        /*
        * MDIMKOV 29.10.2023: this function adds a line to an existing file
        *               the following parameters are being used:
        *                - [fileObjId] - mandatory - the ID of an already existing file
        *                - [textLine] - mandatory - a string to be added as a line
        *
        * RETURNS: integer (the ID of the already existing file)
        *
        * USAGE: appendLineToFile(3845, 'John,Doe,example@example.com'); // -> 3845
        *
        * */

        function appendLineToFile(fileObjId, textLine) {

            const fileObj = file.load({
                id: fileObjId
            });
            let content = fileObj.getContents();

            content += '\n' + textLine;

            const newFileObj = file.create({
                name: fileObj.name,
                fileType: fileObj.fileType,
                contents: content,
                encoding: fileObj.encoding,
                folder: fileObj.folder,
            });

            const newFileId = newFileObj.save();

            return newFileId;
        }


        /* =============== add a line to an existing file =============== */

        /*
        * MDIMKOV 01.11.2023: this function will return a string that is suitable for building a CSV file; namely it will replace:
        *       - line endings with " | "
        *       - double quotes with "*"
        *       - commas with '-'
        *       - will encompass each string in double quotes
        *
        *       this function needs additional development for more flexibility
        *
        * RETURNS: string (the clean string)
        *
        * USAGE: cleanStringForCSV('My address is 25 "Main Street", 32606, Florida'); // -> "My address is 25 *Main Street*- 32605- Florida"
        *
        * */

        function cleanStringForCSV(string) {
            returnString = string;

            if (string && string !== 'undefined' && typeof string == 'string') {
                returnString = string.replaceAll(',', '-');
                returnString = string.replaceAll('\n', ' | ');
                returnString = string.replaceAll('\r', ' | ');
                returnString = string.replace(/"/g, '*');
                returnString = string.replace(/\n/g, ' | ');
                returnString = '"' + returnString + '"';
            }

            return returnString
        }


        /*
            MDIMKOV 29.11.2023: this function converts an XML string into JSON (this function is NOT my intellectual property: https://goessner.net/download/prj/jsonxml/)
            This work is licensed under Creative Commons GNU LGPL License.
            License: http://creativecommons.org/licenses/LGPL/2.1/
            Version: 0.9
            Author:  Stefan Goessner/2006
            Web:     http://goessner.net/
        */
        function xml2json(xml, tab) {
            var X = {
                toObj: function (xml) {
                    var o = {};
                    if (xml.nodeType == 1) {   // element node ..
                        if (xml.attributes.length)   // element with attributes  ..
                            for (var i = 0; i < xml.attributes.length; i++)
                                o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
                        if (xml.firstChild) { // element has child nodes ..
                            var textChild = 0, cdataChild = 0, hasElementChild = false;
                            for (var n = xml.firstChild; n; n = n.nextSibling) {
                                if (n.nodeType == 1) hasElementChild = true;
                                else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
                                else if (n.nodeType == 4) cdataChild++; // cdata section node
                            }
                            if (hasElementChild) {
                                if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
                                    X.removeWhite(xml);
                                    for (var n = xml.firstChild; n; n = n.nextSibling) {
                                        if (n.nodeType == 3)  // text node
                                            o["#text"] = X.escape(n.nodeValue);
                                        else if (n.nodeType == 4)  // cdata node
                                            o["#cdata"] = X.escape(n.nodeValue);
                                        else if (o[n.nodeName]) {  // multiple occurence of element ..
                                            if (o[n.nodeName] instanceof Array)
                                                o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                            else
                                                o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                        } else  // first occurence of element..
                                            o[n.nodeName] = X.toObj(n);
                                    }
                                } else { // mixed content
                                    if (!xml.attributes.length)
                                        o = X.escape(X.innerXml(xml));
                                    else
                                        o["#text"] = X.escape(X.innerXml(xml));
                                }
                            } else if (textChild) { // pure text
                                if (!xml.attributes.length)
                                    o = X.escape(X.innerXml(xml));
                                else
                                    o["#text"] = X.escape(X.innerXml(xml));
                            } else if (cdataChild) { // cdata
                                if (cdataChild > 1)
                                    o = X.escape(X.innerXml(xml));
                                else
                                    for (var n = xml.firstChild; n; n = n.nextSibling)
                                        o["#cdata"] = X.escape(n.nodeValue);
                            }
                        }
                        if (!xml.attributes.length && !xml.firstChild) o = null;
                    } else if (xml.nodeType == 9) { // document.node
                        o = X.toObj(xml.documentElement);
                    } else
                        alert("unhandled node type: " + xml.nodeType);
                    return o;
                },
                toJson: function (o, name, ind) {
                    var json = name ? ("\"" + name + "\"") : "";
                    if (o instanceof Array) {
                        for (var i = 0, n = o.length; i < n; i++)
                            o[i] = X.toJson(o[i], "", ind + "\t");
                        json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
                    } else if (o == null)
                        json += (name && ":") + "null";
                    else if (typeof (o) == "object") {
                        var arr = [];
                        for (var m in o)
                            arr[arr.length] = X.toJson(o[m], m, ind + "\t");
                        json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
                    } else if (typeof (o) == "string")
                        json += (name && ":") + "\"" + o.toString() + "\"";
                    else
                        json += (name && ":") + o.toString();
                    return json;
                },
                innerXml: function (node) {
                    var s = ""
                    if ("innerHTML" in node)
                        s = node.innerHTML;
                    else {
                        var asXml = function (n) {
                            var s = "";
                            if (n.nodeType == 1) {
                                s += "<" + n.nodeName;
                                for (var i = 0; i < n.attributes.length; i++)
                                    s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                                if (n.firstChild) {
                                    s += ">";
                                    for (var c = n.firstChild; c; c = c.nextSibling)
                                        s += asXml(c);
                                    s += "</" + n.nodeName + ">";
                                } else
                                    s += "/>";
                            } else if (n.nodeType == 3)
                                s += n.nodeValue;
                            else if (n.nodeType == 4)
                                s += "<![CDATA[" + n.nodeValue + "]]>";
                            return s;
                        };
                        for (var c = node.firstChild; c; c = c.nextSibling)
                            s += asXml(c);
                    }
                    return s;
                },
                escape: function (txt) {
                    return txt.replace(/[\\]/g, "\\\\")
                        .replace(/[\"]/g, '\\"')
                        .replace(/[\n]/g, '\\n')
                        .replace(/[\r]/g, '\\r');
                },
                removeWhite: function (e) {
                    e.normalize();
                    for (var n = e.firstChild; n;) {
                        if (n.nodeType == 3) {  // text node
                            if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                                var nxt = n.nextSibling;
                                e.removeChild(n);
                                n = nxt;
                            } else
                                n = n.nextSibling;
                        } else if (n.nodeType == 1) {  // element node
                            X.removeWhite(n);
                            n = n.nextSibling;
                        } else                      // any other node
                            n = n.nextSibling;
                    }
                    return e;
                }
            };
            if (xml.nodeType == 9) // document node
                xml = xml.documentElement;
            var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
            return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
        }


        /*
            MDIMKOV 29.11.2023: this function converts a JSON string into XML (this function is NOT my intellectual property: https://goessner.net/download/prj/jsonxml/)
            This work is licensed under Creative Commons GNU LGPL License.
            License: http://creativecommons.org/licenses/LGPL/2.1/
            Version: 0.9
            Author:  Stefan Goessner/2006
            Web:     http://goessner.net/
        */
        function json2xml(o, tab) {
            var toXml = function (v, name, ind) {
                var xml = "";
                if (v instanceof Array) {
                    for (var i = 0, n = v.length; i < n; i++)
                        xml += ind + toXml(v[i], name, ind + "\t") + "\n";
                } else if (typeof (v) == "object") {
                    var hasChild = false;
                    xml += ind + "<" + name;
                    for (var m in v) {
                        if (m.charAt(0) == "@")
                            xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                        else
                            hasChild = true;
                    }
                    xml += hasChild ? ">" : "/>";
                    if (hasChild) {
                        for (var m in v) {
                            if (m == "#text")
                                xml += v[m];
                            else if (m == "#cdata")
                                xml += "<![CDATA[" + v[m] + "]]>";
                            else if (m.charAt(0) != "@")
                                xml += toXml(v[m], m, ind + "\t");
                        }
                        xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</" + name + ">";
                    }
                } else {
                    xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
                }
                return xml;
            }, xml = "";
            for (var m in o)
                xml += toXml(o[m], m, "");
            return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
        }


        /* =============== set of functions to fulfil a sales order (item fulfillment) each function is described separately =============== */

        /*
        * MDIMKOV 09.12.2023: this function is a set of functions used to transform an input JSON and adapt it to fit an item fulfillment object
        *       - itemFulfillment.expandJSON
        *
        *       - itemFulfillment.validateJSON (currently not used)
        *
        *       - itemFulfillment.adaptJSON
        *
        *       - itemFulfillment.fulfilTransaction
        *
        * RETURNS: several separate functions
        *
        * USAGE: each usage will be described separately below
        *
        * */

        function itemFulfillment() {
            function expandJSON(inputJSON, isLog) {
                // MDIMKOV 09.12.2023: this function takes an input JSON (sent by the 3PL), which follows a certain structure and expands the
                // SKUs in the "OrderItems" array, so that each SKU of a certain quantity is represented as as many single (quantity=1) objects,
                // as there is a quantity; for example, if SKU "G1" has the quantity of 2, it will be expanded to 2 separate objects with SKU "G1"
                // and quantity 1; since quantity will be always one, the quantity element is omitted;
                // this function will also expand kit items, but again only the number of main items, leaving the components untouched

                /* ========== SAMPLE INPUT ==========
                     {
                        "OrderNumber": "24163",
                        "TrackingNumber": "996014447000000083",
                        "TrackingURL": "",
                        "Message": "Testauftrag 10046517",
                        "OrderItems": [
                            {
                                "SKU": "I1",
                                "Quantity": 3,
                                "SerialNumbers": [
                                    "21BA87192201000206",
                                    "21BA87192201000836",
                                    "21BA87192201000999"
                                ]
                            },
                            {
                                "SKU": "I1",
                                "Quantity": 2,
                                "SerialNumbers": [
                                    "21BA87192201000112",
                                    "21BA87192201000543"
                                ]
                            },
                            {
                                "SKU": "KITNS",
                                "Quantity": 2,
                                "bundles": [
                                    {
                                        "bundleNo": "21D1974BE19F",
                                        "items": [
                                            {
                                                "SKU": "G1",
                                                "Quantity": 2,
                                                "SerialNumbers": [
                                                    "21659C4959A9",
                                                    "21659C495539"
                                                ]
                                            },
                                            {
                                                "SKU": "I1",
                                                "Quantity": 1,
                                                "SerialNumbers": [
                                                    "21BA87192201004029"
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "bundleNo": "218ED4AD9E88",
                                        "items": [
                                            {
                                                "SKU": "G1",
                                                "Quantity": 2,
                                                "SerialNumbers": [
                                                    "2154B2ABDCA0",
                                                    "2154B2ABDCA0"
                                                ]
                                            },
                                            {
                                                "SKU": "I1",
                                                "Quantity": 1,
                                                "SerialNumbers": [
                                                    "21BA87192201000179"
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "SKU": "G1",
                                "Quantity": 2,
                                "SerialNumbers": [
                                    "21CFD3F33B78",
                                    "21A2DC0642A8"
                                ]
                            }
                        ]
                        }
                * */


                /** ========== SAMPLE OUTPUT ==========
                 {
                 "OrderNumber": "24163",
                 "TrackingNumber": "996014447000000083",
                 "TrackingURL": "",
                 "Message": "Testauftrag 10046517",
                 "OrderItems": [
                 {
                 "SKU": "I1",
                 "SerialNumbers": [
                 "21BA87192201000206"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "SerialNumbers": [
                 "21BA87192201000836"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "SerialNumbers": [
                 "21BA87192201000999"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "SerialNumbers": [
                 "21BA87192201000112"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "SerialNumbers": [
                 "21BA87192201000543"
                 ]
                 },
                 {
                 "SKU": "KITNS",
                 "bundles": [
                 {
                 "bundleNo": "21D1974BE19F",
                 "items": [
                 {
                 "SKU": "G1",
                 "Quantity": 2,
                 "SerialNumbers": [
                 "21659C4959A9",
                 "21659C495539"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "Quantity": 1,
                 "SerialNumbers": [
                 "21BA87192201004029"
                 ]
                 }
                 ]
                 }
                 ]
                 },
                 {
                 "SKU": "KITNS",
                 "bundles": [
                 {
                 "bundleNo": "21D1974BE19A",
                 "items": [
                 {
                 "SKU": "G1",
                 "Quantity": 2,
                 "SerialNumbers": [
                 "21659C4959B9",
                 "21659C495589"
                 ]
                 },
                 {
                 "SKU": "I1",
                 "Quantity": 1,
                 "SerialNumbers": [
                 "21BA87192201004009"
                 ]
                 }
                 ]
                 }
                 ]
                 },
                 {
                 "SKU": "G1",
                 "SerialNumbers": [
                 "21A2DC0642A8"
                 ]
                 },
                 {
                 "SKU": "G1",
                 "SerialNumbers": [
                 "21A2DC0642A8"
                 ]
                 }
                 ]
                 }
                 */

                log.audit('MDIMKOV', 'function itemFulfillment.expandJSON --- START ---');
                if (isLog) {
                    log.debug('MDIMKOV', 'inputJSON: ' + JSON.stringify(inputJSON));
                }

                let outputJSON = {
                    ...inputJSON,
                    OrderItems: []
                };

                inputJSON.OrderItems.forEach(item => {
                    if (!item.bundles) {
                        for (let i = 0; i < item.Quantity; i++) {
                            outputJSON.OrderItems.push({
                                SKU: item.SKU,
                                SerialNumbers: [item.SerialNumbers ? item.SerialNumbers[i] : null]
                            });
                        }
                    } else {
                        for (let i = 0; i < item.Quantity; i++) {
                            outputJSON.OrderItems.push({
                                SKU: item.SKU,
                                bundles: [item.bundles[i]]
                            });
                        }
                    }
                });

                if (isLog) {
                    log.debug('MDIMKOV', 'outputJSON: ' + JSON.stringify(outputJSON));
                }
                log.audit('MDIMKOV', 'function itemFulfillment.expandJSON --- END ---');
                log.audit('MDIMKOV', '');


                return outputJSON;
            }


            function validateJSON(recIf, inputJSON, isLog) {
                // MDIMKOV 09.12.2023: this function will not be used at the moment; it could be used to validate the JSON against the
                // item fulfillment object, and make sure that (e.g.) quantities from the JSON are not higher than what needs to be fulfilled
                log.audit('MDIMKOV', 'function itemFulfillment.validateJSON --- START ---');
                log.audit('MDIMKOV', 'function itemFulfillment.validateJSON --- END ---');
                log.audit('MDIMKOV', '');
            }


            function adaptJSON(recIf, inputJSON, itemNameFieldName, isLog) {
                // MDIMKOV 09.12.2023: this function will take the expanded JSON (see = SAMPLE OUTPUT = from expandJSON function above)
                // and based on the item fulfillment object (which is being built during the record.transform), will adapt the expanded JSON
                // to match the structure of the item fulfillment object; basically it will go through each of the main items in the object, and,
                // based on the quantity, it will pick as many (expanded, qty=1) elements from the expanded JSON as needed
                try {
                    log.audit('MDIMKOV', 'function itemFulfillment.adaptJSON --- START ---');
                    if (isLog) {
                        log.debug('MDIMKOV', 'inputJSON: ' + JSON.stringify(inputJSON));
                    }

                    // MDIMKOV 09.12.2023: create the basic output JSON structure, do not add any order items for now
                    let outputJSON = {
                        ...inputJSON,
                        OrderItems: []
                    };


                    // MDIMKOV 09.12.2023: start iterating through the item fulfillment object and check for main (level 0) items
                    const lineCount = recIf.getLineCount({sublistId: 'item'});
                    log.debug('MDIMKOV', 'lineCount: ' + lineCount);

                    for (let i = 0; i < lineCount; i++) {

                        log.debug('MDIMKOV', '... now processing line=' + i);

                        recIf.selectLine({
                            sublistId: 'item',
                            line: i
                        });

                        const kitLevelQtyFactor = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'kitmemberquantityfactor',
                            line: i
                        });

                        const ifObjItemQuantityOld = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        // TVZ 18/06/2025 -- Change ifObjItemQuantity to read quantityremaining, ...
                        const ifObjItemQuantity = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantityremaining',
                            line: i
                        });

                        const itemType = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        });

                        // MDIMKOV 17.10.2022: find the item name (it's held in a custom field on the item record)
                        const itemId = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        const itemName = getFieldValue(itemNameFieldName, 'item', itemId).toUpperCase();

                        log.debug('TVZ', 'ifObjItemQuantityOld: ' + ifObjItemQuantityOld);
                        log.debug('TVZ', 'ifObjItemQuantity: ' + ifObjItemQuantity);
                        log.debug('TVZ', 'itemType: ' + itemType);
                        log.debug('TVZ', 'itemName: ' + itemName);

                        // MDIMKOV 09.12.2023: if kitLevel is 0, this is main item (either main kit item, or a stand-alone item), add it to the object
                        if (kitLevelQtyFactor === '0') {
                            if (isLog) {
                                log.debug('MDIMKOV', '... this is a main item, add it to the output object');
                            }


                            // MDIMKOV 09.12.2023: count the item elements that will be picked from the JSON; they could be less than the full quantity (in case of partial fulfillments)
                            let runningQuantity = 0;
                            let currentItemInJSON = null;
                            const serialNumbersArray = [];
                            const componentsArray = [];

                            // MDIMKOV 09.12.2023: for stand-alone items just add the SKU, the quantity and the serial number in an array
                            if (itemType === 'InvtPart') {
                                for (let j = 0; j < ifObjItemQuantity; j++) {

                                    // MDIMKOV 09.12.2023: find the next item (element) to pick from the input JSON
                                    currentItemInJSON = inputJSON.OrderItems.find(x => x.SKU.toUpperCase() === itemName);
                                    // log.debug('MDIMKOV', '... currentItemInJSON: ' + JSON.stringify(currentItemInJSON));

                                    if (currentItemInJSON) {
                                        // MDIMKOV 09.12.2023: get the item (element) serial number and add it to the serial number array
                                        if (currentItemInJSON.hasOwnProperty('SerialNumbers') && currentItemInJSON.SerialNumbers[0]) {
                                            serialNumbersArray.push(currentItemInJSON.SerialNumbers[0]);
                                        }

                                        // MDIMKOV 09.12.2023: remove this item (element) from the inputJSON.OrderItems, so it will not be used again
                                        const currentIndex = inputJSON.OrderItems.findIndex(x => x.SKU.toUpperCase() === itemName);
                                        inputJSON.OrderItems.splice(currentIndex, 1);

                                        runningQuantity += 1;
                                    }
                                }

                                outputJSON.OrderItems.push(
                                    {
                                        "SKU": itemName,
                                        "ItemInternalId": itemId,
                                        "Quantity": runningQuantity,
                                        "SerialNumbers": serialNumbersArray
                                    }
                                );

                            } else if (itemType === 'Kit') {
                                for (let j = 0; j < ifObjItemQuantity; j++) {

                                    // MDIMKOV 09.12.2023: find the next item (element) to pick from the input JSON
                                    currentItemInJSON = inputJSON.OrderItems.find(x => x.SKU.toUpperCase() === itemName);
                                    // log.debug('MDIMKOV', '... currentItemInJSON: ' + JSON.stringify(currentItemInJSON));

                                    if (currentItemInJSON) {
                                        // MDIMKOV 09.12.2023: if componentsArray is empty, load the initial structure into it with from the first item
                                        if (componentsArray.length === 0) {
                                            currentItemInJSON.bundles[0].items.forEach(function (element) {
                                                componentsArray.push({
                                                    "SKU": element.SKU,
                                                    "Quantity": element.Quantity,
                                                    "SerialNumbers": element.SerialNumbers ? element.SerialNumbers : null
                                                });
                                            });
                                        } else if (componentsArray.length > 0) { // at least one items is in, so add the next serial numbers
                                            currentItemInJSON.bundles[0].items.forEach(function (element, index) {
                                                componentsArray[index].Quantity += element.Quantity;
                                                componentsArray[index].SerialNumbers.push(element.SerialNumbers[0] ? element.SerialNumbers[0] : null);
                                            });
                                        }


                                        // MDIMKOV 09.12.2023: remove this item (element) from the inputJSON.OrderItems, so it will not be used again
                                        const currentIndex = inputJSON.OrderItems.findIndex(x => x.SKU.toUpperCase() === itemName);
                                        inputJSON.OrderItems.splice(currentIndex, 1);

                                        runningQuantity += 1;
                                    }
                                }

                                outputJSON.OrderItems.push(
                                    {
                                        "SKU": itemName,
                                        "ItemInternalId": itemId,
                                        "Quantity": runningQuantity,
                                        "Components": componentsArray
                                    }
                                );

                            }
                        }
                    }
                    log.debug('MDIMKOV', '');


                    if (isLog) {
                        log.debug('MDIMKOV', 'outputJSON: ' + JSON.stringify(outputJSON));
                    }
                    log.audit('MDIMKOV', 'function itemFulfillment.adaptJSON --- END ---');
                    log.audit('MDIMKOV', '');

                    return outputJSON;

                } catch (e) {
                    log.error('ERROR', e.message + ' --- ' + e.stack);
                }
            }


            function fulfilTransaction(recIf, inputJSON, isLog) {
                try {
                    log.audit('MDIMKOV', 'function itemFulfillment.fulfilTransaction --- START ---');
                    if (isLog) {
                        log.debug('MDIMKOV', 'inputJSON: ' + JSON.stringify(inputJSON));
                    }

                    // MDIMKOV 09.12.2023: start iterating through the item fulfillment object and fulfil items
                    let currentBlock = null;
                    let componentNumber = null;
                    let mainItemNumber = 0; // shows the number of an outer (main) item being processed on the fulfillment (i.e., skips components)
                    const lineCount = recIf.getLineCount({sublistId: 'item'});

                    if (isLog) {
                        log.debug('MDIMKOV', 'lineCount: ' + lineCount);
                    }

                    for (let i = 0; i < lineCount; i++) {

                        log.debug('MDIMKOV', '-------------');

                        recIf.selectLine({
                            sublistId: 'item',
                            line: i
                        });

                        const kitLevelQtyFactor = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'kitmemberquantityfactor',
                            line: i
                        });

                        const itemType = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        });

                        const itemName = recIf.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemname',
                            line: i
                        });

                        if (isLog) {
                            log.debug('MDIMKOV', '... now processing line=' + i + ' --- ' + itemName);
                        }


                        if (itemType === 'Kit') {
                            // MDIMKOV 09.12.2023: CASE A - this is a kit main item
                            log.debug('MDIMKOV', '... CASE A - this is a kit main item');

                            // MDIMKOV 10.12.2023: if quantity equals 0, it MUST be set to null instead of 0 (this unticks the FULFILL checkbox on the line)
                            const quantity = (inputJSON.OrderItems[mainItemNumber].Quantity > 0) ? inputJSON.OrderItems[mainItemNumber].Quantity : null;
                            const serialNumbers = inputJSON.OrderItems[mainItemNumber].SerialNumbers;

                            recIf.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: quantity
                            });

                            currentBlock = inputJSON.OrderItems[mainItemNumber].Components;
                            componentNumber = 0; // restart components
                            mainItemNumber += 1;

                        } else if (itemType === 'InvtPart' && kitLevelQtyFactor !== '0') {
                            // MDIMKOV 09.12.2023: CASE B - this is a kit component item
                            log.debug('MDIMKOV', '... CASE B - this is a kit component item');

                            if (currentBlock[componentNumber]) {
                                const componentQuantity = (currentBlock[componentNumber].Quantity > 0) ? currentBlock[componentNumber].Quantity : null; // 0 needs to be null - unticks the FULFIL checkbox
                                const componentSerialNumbers = currentBlock[componentNumber].SerialNumbers;

                                if (componentSerialNumbers.length > 0) {
                                    setSerialNumbers(recIf, i, componentQuantity, componentSerialNumbers, true);
                                }

                                componentNumber += 1;
                            }

                        } else if (itemType === 'InvtPart' && kitLevelQtyFactor === '0') {
                            // MDIMKOV 09.12.2023: CASE C - this is a stand-alone item
                            log.debug('MDIMKOV', '... CASE C - this is a stand-alone item');

                            // MDIMKOV 10.12.2023: if quantity equals 0, it MUST be set to null instead of 0 (this unticks the FULFILL checkbox on the line)
                            const quantity = (inputJSON.OrderItems[mainItemNumber].Quantity > 0) ? inputJSON.OrderItems[mainItemNumber].Quantity : null;
                            const serialNumbers = inputJSON.OrderItems[mainItemNumber].SerialNumbers;

                            recIf.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: quantity
                            });

                            if (serialNumbers.length > 0) {
                                setSerialNumbers(recIf, i, quantity, serialNumbers, true);
                            }

                            mainItemNumber += 1;
                        }


                        recIf.commitLine({
                            sublistId: 'item'
                        });
                    }

                    const recIfId = recIf.save();

                    return recIfId;

                    log.audit('MDIMKOV', 'function itemFulfillment.fulfilTransaction --- END ---');
                    log.audit('MDIMKOV', '');

                } catch (e) {
                    log.error('ERROR', e.message + ' --- ' + e.stack);
                }
            }
        }


        /* =============== Set the serial number for item fulfillments  =============== */

        /*
        * MDIMKOV 10.12.2023:
        *
        * RETURNS: void
        *
        * INPUT: recIf                  object          the [item fulfillment] record object
        *        line                   integer         the line, on which we are in the [item fulfillment] object
        *        quantity               integer         the quantity of this item/component that will be processed (matches number of serial numbers given)
        *        serialNosArray         array           an array of serial numbers to set
        *        removeSpaces           boolean         if set to [true], all spaces from the current serial number will be removed
        *
        * USAGE: setSerialNumbers(recIf, 1, 2, ['7AF896B3H', '43F866B3A'])
        *
        * */

        function setSerialNumbers(recIf, line, quantity, serialNosArray, removeSpaces) {

            // MDIMKOV 02.02.2024: in case spaces from the serial numbers need to be remove (e.g., issue with Aktia), this is handled here
            const serialNosNoSpacesArray = removeSpaces ? serialNosArray.map(serial => serial.replace(/ /g, "")) : serialNosArray;


            // MDIMKOV 14.10.2022: this function converts some of the common error messages into a friendly error message depending on the case
            function getFriendlyMessage(errorMessage) {
                let returnMessage = '';

                // MDIMKOV 14.10.2022: message that tells you that the serial number used is not valid;
                // the inventory number ID needs to be transformed into the real serial number
                // error message sample: 'You have entered an Invalid Field Value 430 for the following field: issueinventorynumber'
                if (errorMessage.startsWith('You have entered an Invalid Field Value') && errorMessage.endsWith('issueinventorynumber')) {
                    const match = errorMessage.match(/\d+/);
                    const serialNumberId = match ? match[0] : null; // extracts the number from the string
                    if (serialNumberId) {
                        const serialNumber = getFieldValue('inventorynumber', 'inventorynumber', serialNumberId);
                        if (serialNumber) {
                            returnMessage = 'Wrong serial number (' + serialNumber + ') was used';
                        }
                    }
                }

                return returnMessage ? returnMessage + ' --- ' : '';
            }

            try {
                const invDetail = recIf.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: line,
                    isDynamic: true
                });

                for (let j = 0; j < quantity; j++) {
                    log.debug('MDIMKOV', '... ... now adding inventory assignment line with j=' + j);

                    invDetail.selectNewLine({
                        sublistId: 'inventoryassignment'
                    });

                    invDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: 1    // always 1 in case of serial numbers
                    });


                    // MDIMKOV 11.10.2022: set the serial number
                    invDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        value: getLotSerialNumIDs(serialNosNoSpacesArray[j])
                    });

                    invDetail.commitLine({
                        sublistId: 'inventoryassignment'
                    });
                }
            } catch (e) {
                // MDIMKOV 14.10.2022: for some of the common error messages, the error message is being translated into a more friendly message
                log.error('ERROR', getFriendlyMessage(e.message) + e.message + ' --- ' + e.stack);
                throw (getFriendlyMessage(e.message) + e.message);
            }
        }


        /*
        * // IMITROVA 13.12.2023: this function convert results of SQL query to array of objects. Each object represents a row from input SQL.
        *
        *
        * RETURNS: array of objects . Each object represents a row from SQL query
        *
        * INPUT: SQL query (string)
        *
        * USAGE: const myResults = getAllQueryResultsOld(customerQuery);
        * // where customerQuery can be any SQL which has to be ORDER BY unique column set ( table primary key / id ... )
        *
        * NOTES:
        *  1) You must specify a sorting order in the query definition when using this method to avoid duplicate or missing results. The query definition must provide a unique and unambiguous sorting order with a specified precedence.
        *  2) The maximum number of result rows per page is 1000. The minimum number of result rows per page is 5, except for the last page in the result set (because the last page may include fewer than 5 results).
        *  3) If the SuiteAnalytics Connect feature is enabled in your NetSuite account, there is no limit to the number of results this method can return. If the SuiteAnalytics Connect feature is not enabled, this method can return a maximum of 100,000 results across all pages in the result set.
        *
        * */

        function getAllQueryResultsOld(userQuery) {

            const myPagedResults = query.runSuiteQLPaged({
                query: userQuery,
                pageSize: 999
            });

            let allResults = [];
            let iterator = myPagedResults.iterator();
            let rowNumTotal = 0;

            iterator.each(function (resultPage) {
                let currentPage = resultPage.value;
                let thisData = currentPage.data.results;

                for (let x = 0; x < thisData.length; x++) {
                    const rowResult = thisData[x].asMap();
                    rowNumTotal++
                    allResults.push(rowResult);
                }
                return true;
            });

            log.audit('IMITROVA', '--- Query has: ' + rowNumTotal + ' rows ---'); // For  function validation
            return allResults;
        }


        /*
        * // IMITROVA 16.12.2023: this function convert results of SQL query to array of objects. Each object represents a row from input SQL. Funtion is based on ROWNUM . ORDER BY in the query is no needed!
        *
        *
        * RETURNS: array of objects . Each object represents a row from SQL query
        *
        * INPUT:
        *	- customerQuery -> SQL query (string)
        *       - hideRowNum -> boolean parameter. It can be [true, false or null]. When it is set to TRUE, "rn" column in end results in missing
        *
        * USAGE: const myResults = getAllQueryResults(customerQuery,hideRowNum);
        *
        * EXAMPLE:
        *     	const customerQuery = `select t.type, t.id from transaction t`
        *	const myResults = getAllQueryResults(customerQuery, true);
        * output -> [{"type":"VendBill","id":68692},{"type":"Journal","id":68703}... ]
        * if const myResults = getAllQueryResults(customerQuery, false); // or null
        * output -> [{"type":"VendBill","id":68692,"rn":1},{"type":"Journal","id":68703,"rn":2}... ]
        *
        * */

        function getAllQueryResults(theQuery, hideRowNum) {

            let moreResults = true;
            let results = [];
            const pageSize = 5000;
            const maxRows = 1000000;
            let startRow = 1;


            do {

                let pageEndRow = startRow + pageSize - 1;

                let pagedQuery = `SELECT * from
                                      (SELECT * , rownum as rn from (${theQuery}))
                                      where rn BETWEEN ${startRow} AND ${pageEndRow}`;


                let page = query.runSuiteQL(pagedQuery).asMappedResults();
                let size = page.length;

                results.push(...page);

                if (size < pageSize) {
                    moreResults = false;
                }

                if (results.length > maxRows) {
                    throw new Error(`Max rows exceeded: ${maxRows}`);
                }

                startRow = pageEndRow + 1;


            } while (moreResults);

            if (hideRowNum) {
                results = results.map(item => {
                    const {rn, ...rest} = item;
                    return rest;
                });
            }

            return results
        }


        /* =============== SuiteQL query - get just one single string/numeric result =============== */

        /*
        * MDIMKOV 17.09.2024: this function returns just one (string or numeric) value from a SuiteQL query, for a given query
        *                       this is possible when only one column is being selected and only one row is being returned from the query
        *
        *
        *
        * INPUT: the SuiteQL query and the column name used
        *
        * RETURNS: string or numeric - a single value
        *
        * USAGE: getSingleValueFromSuiteQlQuery('Select Top 1 myColumn From account', 'myColumn'); // -> 'ABC'
        *
        * */

        function getSingleValueFromSuiteQlQuery(theQuery, columnName) {
            return query.runSuiteQL({query: theQuery}).asMappedResults()[0][columnName];
        }


        /* =============== Add country values in a suitelet for a field that should be based on a 'country' source =============== */

        /*
        * MDIMKOV 02.01.2024: this function, used on suitelets, adds SELECT options for country field
        *
        *   since just adding the 'country' source doesn't work (because the values returned there are integer, instead of 'GB', 'FR', 'US', etc.,
        *   this function is used to execute addSelectOption as many times as there are countries, on a pre-set array of them
        *
        *   you can also manually include a few entries that will be displayed at the top (the first one will be default)
        *
        *   for example:
        *
               const countryField = form.addField({
                    id: 'country',
                    type: ui.FieldType.SELECT,
                    label: 'Country',
                    container: 'newvendoraddr'
                })

                formFields.country.addSelectOption({  // display UK at the top
                    value: 'GB',
                    text: 'United Kingdom'
                });

                countrySourceListAddOptions(countryField);   // will add the whole list
        *
        *
        * INPUT: the field reference, for which [addSelectOption] needs to be executed as many times as there are countries
        *
        * RETURNS: void
        *
        * USAGE: see example above (in this comment block)
        *
        * */

        function countrySourceListAddOptions(fieldReference) {

            const countryList = [
                {"value": "AF", "text": "Afghanistan"},
                {"value": "AX", "text": "Aland Islands"},
                {"value": "AL", "text": "Albania"},
                {"value": "DZ", "text": "Algeria"},
                {"value": "AS", "text": "American Samoa"},
                {"value": "AD", "text": "Andorra"},
                {"value": "AO", "text": "Angola"},
                {"value": "AI", "text": "Anguilla"},
                {"value": "AQ", "text": "Antarctica"},
                {"value": "AG", "text": "Antigua and Barbuda"},
                {"value": "AR", "text": "Argentina"},
                {"value": "AM", "text": "Armenia"},
                {"value": "AW", "text": "Aruba"},
                {"value": "AU", "text": "Australia"},
                {"value": "AT", "text": "Austria"},
                {"value": "AZ", "text": "Azerbaijan"},
                {"value": "BS", "text": "Bahamas"},
                {"value": "BH", "text": "Bahrain"},
                {"value": "BD", "text": "Bangladesh"},
                {"value": "BB", "text": "Barbados"},
                {"value": "BY", "text": "Belarus"},
                {"value": "BE", "text": "Belgium"},
                {"value": "BZ", "text": "Belize"},
                {"value": "BJ", "text": "Benin"},
                {"value": "BM", "text": "Bermuda"},
                {"value": "BT", "text": "Bhutan"},
                {"value": "BO", "text": "Bolivia"},
                {"value": "BQ", "text": "Bonaire, Saint Eustatius and Saba"},
                {"value": "BA", "text": "Bosnia and Herzegovina"},
                {"value": "BW", "text": "Botswana"},
                {"value": "BV", "text": "Bouvet Island"},
                {"value": "BR", "text": "Brazil"},
                {"value": "IO", "text": "British Indian Ocean Territory"},
                {"value": "BN", "text": "Brunei Darussalam"},
                {"value": "BG", "text": "Bulgaria"},
                {"value": "BF", "text": "Burkina Faso"},
                {"value": "BI", "text": "Burundi"},
                {"value": "KH", "text": "Cambodia"},
                {"value": "CM", "text": "Cameroon"},
                {"value": "CA", "text": "Canada"},
                {"value": "IC", "text": "Canary Islands"},
                {"value": "CV", "text": "Cape Verde"},
                {"value": "KY", "text": "Cayman Islands"},
                {"value": "CF", "text": "Central African Republic"},
                {"value": "EA", "text": "Ceuta and Melilla"},
                {"value": "TD", "text": "Chad"},
                {"value": "CL", "text": "Chile"},
                {"value": "CN", "text": "China"},
                {"value": "CX", "text": "Christmas Island"},
                {"value": "CC", "text": "Cocos (Keeling) Islands"},
                {"value": "CO", "text": "Colombia"},
                {"value": "KM", "text": "Comoros"},
                {"value": "CD", "text": "Congo, Democratic Republic of"},
                {"value": "CG", "text": "Congo, Republic of"},
                {"value": "CK", "text": "Cook Islands"},
                {"value": "CR", "text": "Costa Rica"},
                {"value": "CI", "text": "Cote d'Ivoire"},
                {"value": "HR", "text": "Croatia/Hrvatska"},
                {"value": "CU", "text": "Cuba"},
                {"value": "CW", "text": "Curaçao"},
                {"value": "CY", "text": "Cyprus"},
                {"value": "CZ", "text": "Czech Republic"},
                {"value": "DK", "text": "Denmark"},
                {"value": "DJ", "text": "Djibouti"},
                {"value": "DM", "text": "Dominica"},
                {"value": "DO", "text": "Dominican Republic"},
                {"value": "TL", "text": "East Timor"},
                {"value": "EC", "text": "Ecuador"},
                {"value": "EG", "text": "Egypt"},
                {"value": "SV", "text": "El Salvador"},
                {"value": "GQ", "text": "Equatorial Guinea"},
                {"value": "ER", "text": "Eritrea"},
                {"value": "EE", "text": "Estonia"},
                {"value": "ET", "text": "Ethiopia"},
                {"value": "FK", "text": "Falkland Islands"},
                {"value": "FO", "text": "Faroe Islands"},
                {"value": "FJ", "text": "Fiji"},
                {"value": "FI", "text": "Finland"},
                {"value": "FR", "text": "France"},
                {"value": "GF", "text": "French Guiana"},
                {"value": "PF", "text": "French Polynesia"},
                {"value": "TF", "text": "French Southern Territories"},
                {"value": "GA", "text": "Gabon"},
                {"value": "GM", "text": "Gambia"},
                {"value": "GE", "text": "Georgia"},
                {"value": "DE", "text": "Germany"},
                {"value": "GH", "text": "Ghana"},
                {"value": "GI", "text": "Gibraltar"},
                {"value": "GR", "text": "Greece"},
                {"value": "GL", "text": "Greenland"},
                {"value": "GD", "text": "Grenada"},
                {"value": "GP", "text": "Guadeloupe"},
                {"value": "GU", "text": "Guam"},
                {"value": "GT", "text": "Guatemala"},
                {"value": "GG", "text": "Guernsey"},
                {"value": "GN", "text": "Guinea"},
                {"value": "GW", "text": "Guinea-Bissau"},
                {"value": "GY", "text": "Guyana"},
                {"value": "HT", "text": "Haiti"},
                {"value": "HM", "text": "Heard and McDonald Islands"},
                {"value": "VA", "text": "Holy See (City Vatican State)"},
                {"value": "HN", "text": "Honduras"},
                {"value": "HK", "text": "Hong Kong"},
                {"value": "HU", "text": "Hungary"},
                {"value": "IS", "text": "Iceland"},
                {"value": "IN", "text": "India"},
                {"value": "ID", "text": "Indonesia"},
                {"value": "IR", "text": "Iran (Islamic Republic of)"},
                {"value": "IQ", "text": "Iraq"},
                {"value": "IE", "text": "Ireland"},
                {"value": "IM", "text": "Isle of Man"},
                {"value": "IL", "text": "Israel"},
                {"value": "IT", "text": "Italy"},
                {"value": "JM", "text": "Jamaica"},
                {"value": "JP", "text": "Japan"},
                {"value": "JE", "text": "Jersey"},
                {"value": "JO", "text": "Jordan"},
                {"value": "KZ", "text": "Kazakhstan"},
                {"value": "KE", "text": "Kenya"},
                {"value": "KI", "text": "Kiribati"},
                {"value": "KP", "text": "Korea, Democratic People's Republic"},
                {"value": "KR", "text": "Korea, Republic of"},
                {"value": "XK", "text": "Kosovo"},
                {"value": "KW", "text": "Kuwait"},
                {"value": "KG", "text": "Kyrgyzstan"},
                {"value": "LA", "text": "Lao People's Democratic Republic"},
                {"value": "LV", "text": "Latvia"},
                {"value": "LB", "text": "Lebanon"},
                {"value": "LS", "text": "Lesotho"},
                {"value": "LR", "text": "Liberia"},
                {"value": "LY", "text": "Libya"},
                {"value": "LI", "text": "Liechtenstein"},
                {"value": "LT", "text": "Lithuania"},
                {"value": "LU", "text": "Luxembourg"},
                {"value": "MO", "text": "Macau"},
                {"value": "MK", "text": "North Macedonia"},
                {"value": "MG", "text": "Madagascar"},
                {"value": "MW", "text": "Malawi"},
                {"value": "MY", "text": "Malaysia"},
                {"value": "MV", "text": "Maldives"},
                {"value": "ML", "text": "Mali"},
                {"value": "MT", "text": "Malta"},
                {"value": "MH", "text": "Marshall Islands"},
                {"value": "MQ", "text": "Martinique"},
                {"value": "MR", "text": "Mauritania"},
                {"value": "MU", "text": "Mauritius"},
                {"value": "YT", "text": "Mayotte"},
                {"value": "MX", "text": "Mexico"},
                {"value": "FM", "text": "Micronesia, Federal State of"},
                {"value": "MD", "text": "Moldova, Republic of"},
                {"value": "MC", "text": "Monaco"},
                {"value": "MN", "text": "Mongolia"},
                {"value": "ME", "text": "Montenegro"},
                {"value": "MS", "text": "Montserrat"},
                {"value": "MA", "text": "Morocco"},
                {"value": "MZ", "text": "Mozambique"},
                {"value": "MM", "text": "Myanmar (Burma)"},
                {"value": "NA", "text": "Namibia"},
                {"value": "NR", "text": "Nauru"},
                {"value": "NP", "text": "Nepal"},
                {"value": "NL", "text": "Netherlands"},
                {"value": "NC", "text": "New Caledonia"},
                {"value": "NZ", "text": "New Zealand"},
                {"value": "NI", "text": "Nicaragua"},
                {"value": "NE", "text": "Niger"},
                {"value": "NG", "text": "Nigeria"},
                {"value": "NU", "text": "Niue"},
                {"value": "NF", "text": "Norfolk Island"},
                {"value": "MP", "text": "Northern Mariana Islands"},
                {"value": "NO", "text": "Norway"},
                {"value": "OM", "text": "Oman"},
                {"value": "PK", "text": "Pakistan"},
                {"value": "PW", "text": "Palau"},
                {"value": "PS", "text": "Palestinian Territories"},
                {"value": "PA", "text": "Panama"},
                {"value": "PG", "text": "Papua New Guinea"},
                {"value": "PY", "text": "Paraguay"},
                {"value": "PE", "text": "Peru"},
                {"value": "PH", "text": "Philippines"},
                {"value": "PN", "text": "Pitcairn Island"},
                {"value": "PL", "text": "Poland"},
                {"value": "PT", "text": "Portugal"},
                {"value": "PR", "text": "Puerto Rico"},
                {"value": "QA", "text": "Qatar"},
                {"value": "RE", "text": "Reunion Island"},
                {"value": "RO", "text": "Romania"},
                {"value": "RU", "text": "Russian Federation"},
                {"value": "RW", "text": "Rwanda"},
                {"value": "BL", "text": "Saint Barthélemy"},
                {"value": "SH", "text": "Saint Helena"},
                {"value": "KN", "text": "Saint Kitts and Nevis"},
                {"value": "LC", "text": "Saint Lucia"},
                {"value": "MF", "text": "Saint Martin"},
                {"value": "PM", "text": "Saint Pierre and Miquelon"},
                {"value": "VC", "text": "Saint Vincent and the Grenadines"},
                {"value": "WS", "text": "Samoa"},
                {"value": "SM", "text": "San Marino"},
                {"value": "ST", "text": "Sao Tome and Principe"},
                {"value": "SA", "text": "Saudi Arabia"},
                {"value": "SN", "text": "Senegal"},
                {"value": "RS", "text": "Serbia"},
                {"value": "SC", "text": "Seychelles"},
                {"value": "SL", "text": "Sierra Leone"},
                {"value": "SG", "text": "Singapore"},
                {"value": "SX", "text": "Sint Maarten"},
                {"value": "SK", "text": "Slovak Republic"},
                {"value": "SI", "text": "Slovenia"},
                {"value": "SB", "text": "Solomon Islands"},
                {"value": "SO", "text": "Somalia"},
                {"value": "ZA", "text": "South Africa"},
                {"value": "GS", "text": "South Georgia"},
                {"value": "SS", "text": "South Sudan"},
                {"value": "ES", "text": "Spain"},
                {"value": "LK", "text": "Sri Lanka"},
                {"value": "SD", "text": "Sudan"},
                {"value": "SR", "text": "Suriname"},
                {"value": "SJ", "text": "Svalbard and Jan Mayen Islands"},
                {"value": "SZ", "text": "Swaziland"},
                {"value": "SE", "text": "Sweden"},
                {"value": "CH", "text": "Switzerland"},
                {"value": "SY", "text": "Syrian Arab Republic"},
                {"value": "TW", "text": "Taiwan"},
                {"value": "TJ", "text": "Tajikistan"},
                {"value": "TZ", "text": "Tanzania"},
                {"value": "TH", "text": "Thailand"},
                {"value": "TG", "text": "Togo"},
                {"value": "TK", "text": "Tokelau"},
                {"value": "TO", "text": "Tonga"},
                {"value": "TT", "text": "Trinidad and Tobago"},
                {"value": "TN", "text": "Tunisia"},
                {"value": "TR", "text": "Turkey"},
                {"value": "TM", "text": "Turkmenistan"},
                {"value": "TC", "text": "Turks and Caicos Islands"},
                {"value": "TV", "text": "Tuvalu"},
                {"value": "UG", "text": "Uganda"},
                {"value": "UA", "text": "Ukraine"},
                {"value": "AE", "text": "United Arab Emirates"},
                {"value": "GB", "text": "United Kingdom"},
                {"value": "US", "text": "United States"},
                {"value": "UY", "text": "Uruguay"},
                {"value": "UM", "text": "US Minor Outlying Islands"},
                {"value": "UZ", "text": "Uzbekistan"},
                {"value": "VU", "text": "Vanuatu"},
                {"value": "VE", "text": "Venezuela"},
                {"value": "VN", "text": "Vietnam"},
                {"value": "VG", "text": "Virgin Islands (British)"},
                {"value": "VI", "text": "Virgin Islands (USA)"},
                {"value": "WF", "text": "Wallis and Futuna Islands"},
                {"value": "EH", "text": "Western Sahara"},
                {"value": "YE", "text": "Yemen"},
                {"value": "ZM", "text": "Zambia"},
                {"value": "ZW", "text": "Zimbabwe"}
            ]

            countryList.forEach(function (element) {
                fieldReference.addSelectOption({
                    value: element.value,
                    text: element.text
                });
            });
        }


        /* =============== Add county (state) values in a suitelet for a field that should be based on a 'county' / 'state' source =============== */

        /*
        * MDIMKOV 02.01.2024: this function, used on suitelets, adds SELECT options for state field
        *
        *   since just adding the 'state' source doesn't work (because the values returned there are integer,
        *   this function is used to execute addSelectOption as many times as there are states/counties, on a pre-set array of them
        *
        *   you can also manually include a few entries that will be displayed at the top (the first one will be default)
        *
        *   for example:
        *
        *           const stateField = form.addField({
        *                id: 'state',
        *                type: nUi.FieldType.SELECT,
        *                label: 'state',
        *                container: 'newvendoraddr'
        *            })
        *
        *            formFields.state.addSelectOption({  // display UK at the top
        *                value: 'GB',
        *                text: 'United Kingdom'
        *            });
        *
        *            stateSourceListAddOptions(stateField, 'GB');   // will add the whole list
        *
        *
        * INPUT: the field reference, for which [addSelectOption] needs to be executed as many times as there are countries
        *        the country code to filter by, for example 'GB', 'US', etc.
        *
        * RETURNS: void
        *
        * USAGE: see example above (in this comment block)
        *
        * */

        function stateSourceListAddOptions(fieldReference, filterByCountryCode) {

            let sql = null;

            // MDIMKOV 31.01.2024: in case no filtering by country:
            if (!filterByCountryCode) {
                sql = "SELECT State.ID, State.ShortName, State.FullName, State.Country " +
                    "FROM State " +
                    "ORDER BY State.ShortName"
            } else {
                // MDIMKOV 31.01.2024: in case there is filtering by country:
                sql = "SELECT State.ID, State.ShortName, State.FullName, State.Country " +
                    "FROM State " +
                    "WHERE country = '" + filterByCountryCode + "' " +
                    "ORDER BY State.ShortName"
            }

            // MDIMKOV 31.01.2024: add the value/text combinations; test is the full name, whereas the IDs in this case are the short names

            const resultSet = query.runSuiteQL({query: sql}).asMappedResults();

            const stateList = [];

            resultSet.forEach(function (element) {
                stateList.push({"value": element.shortname, "text": element.fullname});
            });

            stateList.forEach(function (element) {
                fieldReference.addSelectOption({
                    value: element.value,
                    text: element.text
                });
            });
        }


        /* =============== Get the tax code rate for a given tax code (id) =============== */

        /*
        * MDIMKOV 14.01.2024: this function returns the tax rate for a given tax code id
        *
        * RETURNS: decimal
        *
        * INPUT:    taxCodeId               integer          the tax code ID (e.g. 1550)
        *
        * USAGE: const taxRate = getTaxCodeRate(1550); // => 0.2 --- equals 20%
        *
        * */

        function getTaxCodeRate(taxCodeId) {
            const taxCodeRecord = record.load({
                type: record.Type.SALES_TAX_ITEM,
                id: taxCodeId
            });
            var taxRate = taxCodeRecord.getValue({
                fieldId: 'rate'
            });
            return taxRate;
        }


        /* =============== Redirect user to view mode =============== */

        /*
        * MDIMKOV 16.01.2024: when a user tries to open a record in EDIT mode, redirect him to VIEW mode
        *
        *       NOTE! must be used on beforeLoad!
        *
        * RETURNS: void
        *
        * INPUT:    context               object          the current record context
        *
        * USAGE: just call the function on beforeLoad
        *
        * */

        function redirectToViewMode(context, isExceptAdmin) {
            try {
                if (context.type == context.UserEventType.EDIT) {

                    function toViewMode(context) {
                        log.debug('MDIMKOV', 'Record was opened in EDIT mode => redirecting to view mode');
                        redirect.toRecord({
                            type: context.newRecord.type,
                            id: context.newRecord.id,
                            isEditMode: false
                        });
                    }

                    if (isExceptAdmin) {
                        const userObj = runtime.getCurrentUser();
                        if (userObj.roleId != 'administrator') {
                            toViewMode(context);
                        }
                    } else {
                        toViewMode(context);
                    }
                }
            } catch (e) {
            }
        }


        /* =============== Set file object to public available (online) or not available (not online) =============== */

        /*
        * MDIMKOV 01.02.2024: this function sets the file object property to [Online] (or not online), meaning public / not public
        *
        * RETURNS: void
        *
        * INPUT:    fileId              integer           the file object ID
        *           isOnline            boolean           sets the file object to either public or not
        *
        * USAGE: setFilePublic(554883, true); // -> void
        *
        * */

        function setFilePublic(fileId, isOnline) {
            const fileObj = file.load({
                id: fileId
            });

            fileObj.isOnline = isOnline;

            fileObj.save();
        }


        /* =============== Get the file URL - the address, at which the file is available =============== */

        /*
        * MDIMKOV 01.02.2024: this function gets the URL for a given file object; if the file is set to Online/Public,
        *       the URL can be used to directly access the file from outside NetSuite
        *       the function returns the full URL, including the NetSuite domain
        *
        * RETURNS: the (publicly) available URL
        *
        * INPUT:    fileId              integer           the file object ID
        *
        * USAGE: getFileURL(554883); // -> https://4514546-sb1.app.netsuite.com/core/media/media.nl?id=552442&c=4514546_SB1&h=GLHx_G-T56LCesJeFe98mktpoZ_2gWTBRAYLas8_0pyErQ_l&_xt=.pdf
        *
        * */

        function getFileURL(fileId) {
            const fileObj = file.load({
                id: fileId
            });

            return constructURL(fileObj.url, null, null, true);
        }


        /* =============== Get country NAME, CODE and ID =============== */

        /*
        * MDIMKOV 07.02.2024: this function finds the name(text), the code and the ID of a country by looking for name/code/id
        *
        * RETURNS: object
        *
        * USAGE:
        *
        * getCountryCodeTextId('United Kingdom');	//-> {text:"United Kingdom",code:"GB",id:"77"}
        * getCountryCodeTextId('GB');	//-> {text:"United Kingdom",code:"GB",id:"77"}
        * getCountryCodeTextId('77');	//-> {text:"United Kingdom",code:"GB",id:"77"}
        *
        * */


        const getCountryCodeTextId = (inputData) => {

            let country = {};
            let whereAttr = '';
            let inputDataAttr = inputData;
            const firstSymbol = parseFloat(inputData[0])

            if (firstSymbol) {
                whereAttr = 'uniquekey';
            } else {
                if (inputData.length == 2) {
                    whereAttr = 'id';
                    inputDataAttr = "\'" + inputData + "\'"

                } else {
                    whereAttr = 'name';
                    inputDataAttr = "\'" + inputData + "\'"
                }
            }


            const sql = "select  name, id, uniquekey\n" +
                "from country \n" +
                "where " + whereAttr + " = " + inputDataAttr;

            const queryResults = query.runSuiteQL({
                query: sql
            });

            const resultSet = queryResults.asMappedResults();

            country.text = resultSet[0].name;
            country.code = resultSet[0].id;
            country.id = resultSet[0].uniquekey;

            return country;
        }


        /* =============== Get state NAME, CODE and ID =============== */

        /*
        * MDIMKOV 07.05.2024: this function finds the name(text), the code and the ID of a state by looking for name/code/id
        *
        * RETURNS: object
        *
        * USAGE:
        *
        * getStateCodeTextId('Indiana');	//-> {text:"Indiana",code:"IN",id:"14"}
        * getStateCodeTextId('IN');	//-> {text:"Indiana",code:"IN",id:"14"}
        * getStateCodeTextId('14');	//-> {text:"Indiana",code:"IN",id:"14"}
        *
        * */


        const getStateCodeTextId = (inputData) => {

            log.debug('MDIMKOV', 'inputData>>>>: ' + inputData);

            let state = {};
            let whereAttr = '';
            let inputDataAttr = inputData;
            const firstSymbol = parseFloat(inputData[0])

            if (firstSymbol) {
                whereAttr = 'shortname';
            } else {
                if (inputData.length == 2) {
                    whereAttr = 'shortname';
                    inputDataAttr = "\'" + inputData + "\'"

                } else {
                    whereAttr = 'fullname';
                    inputDataAttr = "\'" + inputData + "\'"
                }
            }


            const sql = "select  fullname, id, shortname\n" +
                "from state \n" +
                "where " + whereAttr + " = " + inputDataAttr;
            log.debug('MDIMKOV', 'sql>>>>: ' + sql);

            const queryResults = query.runSuiteQL({
                query: sql
            });

            const resultSet = queryResults.asMappedResults();

            state.text = resultSet[0].fullname;
            state.code = resultSet[0].shortname;
            state.id = resultSet[0].id;


            return state;
        }


        /* =============== Generate Random Token =============== */

        /*
        * MDIMKOV 26.03.2024: this function will generate a random string based on length and additional criteria
        *   you can define if lower case, upper case, numbers, and special characters will be used
        *
        * RETURNS: string
        *
        * USAGE: const myToken = generateRandomToken(8, true, false, true, false); // => de8z06gp
        *
        * */


        function generateRandomToken(length, lower, upper, number, special) {
            // MDIMKOV 26.03.2024: force at least one type (e.g. lower case) to be used
            if (!lower && !upper && !number && !special) {
                return 'ERROR: At least one input type needs to be set to true';
            }


            // MDIMKOV 26.03.2024: Define all possible characters that can be in the token
            let characters = '';

            characters += lower ? 'abcdefghijklmnopqrstuvwxyz' : '';
            characters += upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '';
            characters += number ? '0123456789' : '';
            characters += special ? '~!@#$^&*()-_+=' : '';

            let token = '';
            for (let i = 0; i < length; i++) {
                // Choose a random character from the characters string
                const randomIndex = Math.floor(Math.random() * characters.length);
                token += characters.charAt(randomIndex);
            }
            return token;
        }


        /* =============== Set a value to global variable in a suitelet, that can be used between GET and POST =============== */

        /*
        * MDIMKOV 04.04.2024: this function is used as a Cache module for suitlets: assign a value to a key
        *       then, you can retrieve it by using suiteletCacheGet()
        *       NOTE! the key will be case-insensitive!
        *
        * RETURNS: void
        *
        * USAGE: suiteletCacheSet(form, 'vendorid', 38492)
        *
        * */


        function suiteletCacheSet(form, key, value) {
            let fieldName = 'custpage_' + key.toLowerCase();
            fieldName = form.addField({
                id: fieldName,
                type: ui.FieldType.LONGTEXT,
                label: fieldName
            }).updateDisplayType(
                {
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = value;
        }


        /* =============== Get a value from a global variable in a suitelet, that can be used between GET and POST =============== */

        /*
        * MDIMKOV 04.04.2024: this function is used as a Cache module for suitlets: get a value from a key
        *       which was set earlier by using suiteletCacheSet()
        *       you can use this to get step number in a multi-form suitelet
        *
        * RETURNS: text
        *
        * USAGE: suiteletCacheGet(context, 'vendorid'); //-> '38492'
        *
        * */


        function suiteletCacheGet(context, key) {
            const actualKey = 'custpage_' + key.toLowerCase();
            return context.request.parameters[actualKey];
        }


        /* =============== This function is used in suitelets to display a nice suitelet error message / catch error =============== */

        /*
        * MDIMKOV 09.04.2024: this function is used in suitelets to display a nice suitelet error message / catch error
        *
        * RETURNS: voic
        *
        * USAGE: add the following code to the CATCH statement: catchSuiteletError(context, e);
        *        raise an error message with: throw new Error('You are not allowed to view this page');
        *
        * */


        function catchSuiteletError(context, e) {
            log.error('ERROR', e.message + ' --- ' + e.stack);

            const form = ui.createForm({
                title: ' ',
                hideNavBar: false
            });

            // MDIMKOV 26.03.2024: add a page-init message
            form.addPageInitMessage({
                type: message.Type.ERROR,
                title: e.message,
                message: e.stack
            });

            context.response.writePage({
                pageObject: form
            });
        }


        /* =============== This function the current date/time as an epoch integer =============== */

        /*
        * MDIMKOV 02.05.2024: this function returns the current date/time as an epoch integer
        *
        * RETURNS: int
        *
        * USAGE: epochTimeCurrentTimeStamp(); // -> 1714636451
        *
        * */


        function epochTimeCurrentTimeStamp() {
            const today = new Date();

            // Get the timestamp in milliseconds
            const timestamp = today.getTime();

            // Convert milliseconds to seconds (Epoch time is in seconds)
            const epochTime = Math.floor(timestamp / 1000);

            return epochTime;
        }


        /* =============== This function creates a Customer Refund based on a Credit Memo =============== */

        /*
        * MDIMKOV 06.05.2024: since there is no record.transform function available for transforming a Credit Memo into a Customer Refund, this function can be used
        *
        *       optionally, the account ID of the account to be hit can be passed
        *
        * RETURNS: int - the ID of the newly created Customer Refund
        *
        * USAGE: createCustomerRefundFromCreditMemo(58483, 99584, 127; // -> 11431
        *
        * */


        function createCustomerRefundFromCreditMemo(customerId, creditMemoId, accountId) {

            // MDIMKOV 06.05.2024: start creating the Customer Refund based on the Credit Memo (no record.transform exists for this combination)
            const recRefund = record.create({
                type: record.Type.CUSTOMER_REFUND,
                isDynamic: true,
                defaultValues: {
                    entity: customerId
                }
            });

            if (accountId) {
                recRefund.setValue('account', accountId);
            }

            const iApplyLinesCount = recRefund.getLineCount({sublistId: 'apply'});


            for (let j = 0; j < iApplyLinesCount; j++) {

                const transToApplyId = recRefund.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: j
                });
                // log.debug('transToApplyId', transToApplyId);
                // log.debug('creditMemoId', creditMemoId);

                // MDIMKOV 11.08.2021: apply the newly-created credit memo to the customer refund
                if (transToApplyId == creditMemoId) {

                    recRefund.selectLine({
                        sublistId: 'apply',
                        line: j
                    });

                    recRefund.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        value: true,
                        line: j
                    });

                    recRefund.commitLine({
                        sublistId: 'apply'
                    });
                }
            }


            // MDIMKOV 06.05.2024: save the Customer Refund
            const recRefundId = recRefund.save();
            // log.audit('recRefundId', recRefundId);

            return recRefundId;
        }


        /*
        * MDIMKOV 01.06.2024: this function checks if a given subsidiary is assigned to a give customer
        *
        * RETURNS: boolean
        *
        * INPUT: customerID - ID of a customer
        *        subsidiaryID - ID of a subsidiary
        *
        * USAGE: isSubsidiaryAssignedToCustomer(45534, 2); // -> true
        *
        * */

        function isSubsidiaryAssignedToCustomer(customerID, subsidiaryID) {

            let matchFlag = false;

            const sqlQuery = `select count(*) as match_flag from CustomerSubsidiaryRelationship
                                      where entity=${customerID}
                                      and subsidiary=${subsidiaryID}`


            const queryResults = query.runSuiteQL({
                query: sqlQuery
            });

            const resultSet = queryResults.asMappedResults();

            if (resultSet[0].match_flag == '1') {
                // log.debug('MDIMKOV', ' There is match!');
                matchFlag = true;
            } else {
                // log.debug('MDIMKOV', ' There is NO match!');
            }

            return matchFlag;

        }


        /*
        * MDIMKOV 16.06.2024: this function adds a subsidiary to a customer or vendor, without saving the record
        *
        * RETURNS: void
        *
        * INPUT: rec - the record instance
        *        subsidiaryID - ID of a subsidiary to add
        *
        * USAGE: addSubsidiaryToEntity(rec, 9);
        *
        * */

        function addSubsidiaryToEntity(rec, subsidiaryID) {

            const lineNumber = rec.getLineCount({sublistId: 'submachine'});

            rec.insertLine({
                sublistId: 'submachine',
                line: lineNumber
            });

            rec.setSublistValue({
                sublistId: 'submachine',
                fieldId: 'subsidiary',
                value: subsidiaryID,
                line: lineNumber
            });
        }


        /*
        * MDIMKOV 01.06.2024: this function detaches an invoice from its originating sales order by removing and readding all lines on it
        *
        * RETURNS: boolean // true if success
        *
        * INPUT: invoiceId - the internal ID of the invoice to be dettached
        *
        * USAGE: detachSalesOrderFromInvoice(4325534); // -> true
        *
        * */
        function detachSalesOrderFromInvoice(invoiceId) {

            try {
                // MDIMKOV 24.06.2024: load Invoice
                var rec = record.load({
                    type: "invoice",
                    id: invoiceId,
                    isDynamic: true
                });
                var invoiceDate = rec.getValue('trandate')

                // MDIMKOV 24.06.2024: get the number of lines to be proceseed and item object
                var item_lines = rec.getLineCount({sublistId: 'item'});
                var count_lines = 0;
                var fields_item = rec.getSublistFields({sublistId: 'item'});
                // getting fields values for each item object
                for (var i = 0; i < item_lines; i++) {
                    rec.selectLine({sublistId: 'item', line: i});
                    var waiting_fields_values = [];
                    for (var j = 0; j < fields_item.length; j++) {
                        var value = rec.getCurrentSublistValue({sublistId: 'item', fieldId: fields_item[j]});
                        waiting_fields_values[j] = value;
                    }
                    rec.selectNewLine({sublistId: 'item'});
                    // coppy values in a new line except for specific fields linking the sale with the sales order
                    for (var k = 0; k < fields_item.length; k++) {
                        if (fields_item[k] !== 'orderdoc' && fields_item[k] !== 'orderline' && fields_item[k] !== 'lineuniquekey' && fields_item[k] !== 'id' && fields_item[k] !== 'line') {
                            rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: fields_item[k],
                                value: waiting_fields_values[k]
                            });
                            if (fields_item[k] == 'custcol_invoice_display_quantity') {
                                var display_qty = waiting_fields_values[k]
                            }
                            if (fields_item[k] == 'custcol_prorated_unit_price') {
                                var rate = waiting_fields_values[k]
                            }
                        }
                    }
                    if (display_qty !== null && display_qty !== '' && rate !== null && rate !== '') {
                        rec.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: display_qty * rate});
                    }
                    rec.commitLine({sublistId: 'item'});
                    count_lines++;
                }
                for (var l = 0; l < count_lines; l++) {
                    rec.removeLine({sublistId: 'item', line: 0});
                }
                // setting values on Invoice for workflows or SFDC purposes
                rec.setValue({fieldId: 'custbody_invoice_credited', value: true})
                rec.setValue({fieldId: 'custbody_is_detached_record', value: true})
                rec.setValue({fieldId: 'custbody_payment_voiding_required', value: false})
                // getting values for the new Credit Memo
                var credit_origin = rec.getValue({fieldId: 'custbody_cancel_origin'});
                var credit_desc = rec.getValue({fieldId: 'custbody_cancel_desc'});
                var memo = rec.getValue({fieldId: 'custbody_cancel_memo'});
                var op_rmks = rec.getValue({fieldId: 'custbody_cancel_or'});
                var cl_rmks = rec.getValue({fieldId: 'custbody_cancel_cr'});
                rec.save({ignoreMandatoryFields: true});


                // MDIMKOV 24.06.2024: return TRUE, meaning success
                return true;

            } catch (e) {
                return false;
            }
        }


        /* =============== This function adds/updates the primary entity bank details (for customer, vendor, employee) based on input JSON  =============== */

        /*
        * MDIMKOV 30.06.2024: upsert the primary entity bank details (for customer, vendor, employee) based on input JSON
        *                     NOTE! this function only creates/updates Primary bank details; it doesn't set the last Primary as Secondary etc.
        *
        *                     NOTE! for customers you can use isDirectDebit - based on whether you are getting money or paying money (refund)
        *
        * RETURNS: the updated/created record id
        *
        * USAGE: const inputJson = {
        *                               "custrecord_2663_entity_iban": "BG33UNCR76301076858920",
        *                               "custrecord_2663_entity_bic": "UNCRBGSF"
        *                          }
        *        upsertEntityBankDetailsEFT(54938, inputJson, 'employee', 123, false); // -> 459 (succeeded, record was upserted)
        *
        * */


        function upsertEntityBankDetailsEFT(entityId, inputJson, entityType, paymentFileFormatId, isDirectDebit) {

            // MDIMKOV 02.07.2024: dictionary for the entity types - customer / vendor / employee - resolve the respective parent field
            const entityTypeDict = {
                'vendor': 'custrecord_2663_parent_vendor',
                'employee': 'custrecord_2663_parent_employee',
                'customer': 'custrecord_2663_parent_cust_ref'
            };

            let entityField = entityTypeDict[entityType];


            // MDIMKOV 19.08.2024: to be able to select a Direct Debit template, a different field needs to be set as a parent customer
            if (isDirectDebit) {
                entityField = 'custrecord_2663_parent_customer';
            }


            // MDIMKOV 02.07.2024: search for a bank detail record (of type Primary) for the respective enitty
            const sql = "Select id\n" +
                "From customrecord_2663_entity_bank_details\n" +
                "Where (custrecord_2663_parent_vendor = " + entityId + " \n" +
                "OR custrecord_2663_parent_employee = " + entityId + " \n" +
                "OR custrecord_2663_parent_customer = " + entityId + ")\n" +
                "And custrecord_2663_entity_bank_type = 1"

            const bankDetailRecId = query.runSuiteQL({query: sql}).asMappedResults()[0] ? query.runSuiteQL({query: sql}).asMappedResults()[0].w : null;

            let rec = null;

            if (!bankDetailRecId) {

                // MDIMKOV 02.07.2024: proceed with creating a new bank detail record
                rec = record.create({
                    type: 'customrecord_2663_entity_bank_details'
                });

                rec.setValue(entityField, entityId); // sets value in the respective parent field: vendor/customer/employee parent field
                rec.setValue('name', generateRandomToken(8, true)); // random name
                rec.setValue('custrecord_2663_entity_bank_type', 1); // Primary
                rec.setValue('isinactive', false);
            } else {

                // MDIMKOV 02.07.2024: proceed with updating the current bank detail record
                rec = record.load({
                    type: 'customrecord_2663_entity_bank_details',
                    id: bankDetailRecId
                });
            }

            Object.entries(inputJson).forEach(([fieldId, value]) => {
                rec.setValue({
                    fieldId: fieldId,
                    value: value
                });
            });

            // rec.setValue('custrecord_2663_entity_file_format', paymentFileFormatId); // this additionally done after save, otherwise it doesn't take the EFT template id

            const newBankDetailRecId = rec.save();

            setFieldValue('custrecord_2663_entity_file_format', 'customrecord_2663_entity_bank_details', newBankDetailRecId, paymentFileFormatId);


            return newBankDetailRecId;
        }


        /* =============== this function will add a number of hours to a date time (ISO) string =============== */

        /*
         * MDIMKOV 10.07.2024: this function will add a number of hours to a date time (ISO) string
         *
         * RETURNS: string
         *
         * INPUT: the date as string and the hours to add
         *
         * USAGE: rec.setValue('custrecord_mhi_if_fulfill_date', locAddHoursToISODateString("2024-07-01T00:00:00.000Z", 8)); // => "2024-07-01T08:00:00.000Z"
         *
         * */

        function addHoursToISODateString(isoString, hoursToAdd) {
            const date = new Date(isoString);

            if (isNaN(date)) {
                throw new Error("Invalid date string");
            }

            date.setHours(date.getHours() + hoursToAdd);

            return new Date(date.toISOString());
        }


        /* =============== this function will provide the right format to set a date value =============== */

        /*
         * MDIMKOV 10.08.2024: this function will provide the right format to set a date value
         *
         * RETURNS: date object (NetSuite format)
         *
         * INPUT: the date as string, e.g. '2024-12-25'
         *
         * USAGE: rec.setValue('trandate', formatDateValue('2024-12-25')); // =>
         *
         * */

        function formatDateValue(dateString) {
            return format.parse({value: new Date(dateString + 'T12:00:00'), type: format.Type.DATE});
        }


        /* =============== Get the subsidiary, department, class, location ID by passing the classification name =============== */

        /*
        * MDIMKOV 14.08.2024: this function returns the subsidiary, department, class, location ID for a given classification name;
        *                     Note: the name can be full and follow the 'Parent Name : Child Name' structure, or just the short name, e.g. 'Child Name'
        *
        * RETURNS: integer
        *
        * INPUT: 1. string, any of: 'subsidiary', 'department', 'classification' (=class), 'location'
        *        2. string, the respective name
        *        3. boolean, isFull name - true or false
        *
        * USAGE: const subsidiaryId = getSubsidiaryIdByName('subsidiary', 'Parent Company : Munich', false); // -> 12
        *        const subsidiaryId = getSubsidiaryIdByName('subsidiary', 'Munich', true); // -> 12
        *
        * */

        function getClassificationIdByName(type, name, isFullName) {

            let sql = null;

            if (!isFullName) {
                sql = "SELECT TOP 1 * " +
                    "FROM " + type + " WHERE name = '" + name + "'";
            } else {
                sql = "SELECT TOP 1 * " +
                    "FROM " + type + " WHERE fullname = '" + name + "'";
            }

            const resultSet = query.runSuiteQL({query: sql}).asMappedResults();

            const myResult = query.runSuiteQL({query: sql}).asMappedResults()[0] ? query.runSuiteQL({query: sql}).asMappedResults()[0].id : null;

            return myResult;

        }


        /* =============== Get the subsidiary, department, class, location ID by passing the classification name =============== */

        /*
        * MDIMKOV 26.08.2024: this function applies a credit memo to an invoice
        *                     Note: the name can be full and follow the 'Parent Name : Child Name' structure, or just the short name, e.g. 'Child Name'
        *
        * RETURNS: void
        *
        * INPUT: 1. the internal ID of the sales invoice
        *        2. the internal ID of the credit memo
        *
        * USAGE: applyCreditMemoToInvoice(123, 456); // -> invoice applied
        *
        * */
        function applyCreditMemoToInvoice(invoiceId, creditMemoId) {

            const customerPayment = record.transform({
                fromType: record.Type.INVOICE,
                fromId: invoiceId,
                toType: record.Type.CUSTOMER_PAYMENT,
                isDynamic: true,
            });

            const lineCount = customerPayment.getLineCount({sublistId: 'credit'});
            for (let i = 0; i < lineCount; i++) {
                customerPayment.selectLine({sublistId: 'credit', line: i});
                customerPayment.selectLine({
                    sublistId: 'credit',
                    line: i
                });
                const applyCreditMemoId = customerPayment.getCurrentSublistValue({
                    sublistId: 'credit',
                    fieldId: 'internalid'
                });
                if (applyCreditMemoId == creditMemoId) {
                    customerPayment.setCurrentSublistValue({sublistId: 'credit', fieldId: 'apply', value: true});
                    customerPayment.commitLine({
                        sublistId: 'credit'
                    });
                    break;
                }
            }

            customerPayment.save();
        }


        // MDIMKOV 04.09.2024: this function gets the Avalara status for the current transaction
        function locGetAvalaraStatus(transId) {

            let finalStatus = null;

            const lookup = search.lookupFields({
                type: 'transaction',
                id: transId,
                columns: ['custbody_avalara_status']
            });

            if (lookup && lookup.custbody_avalara_status[0]) {
                finalStatus = lookup.custbody_avalara_status[0].text;
            }

            return finalStatus;
        }


        /* =============== Check if a transaction is subject to Avalara or not =============== */

        /*
        * MDIMKOV 08.09.2024: this function returns true or false based on whether a transaction is subject to Avalara or not
        *       an Avalara transaction would have a line set to AvaTax tax code (even if the transaction is not yet tax ready)
        *
        * RETURNS: boolean
        *
        * INPUT: he internal ID of the respective transaction
        *
        * USAGE: isAvalaraTransaction(123456); // -> true
        *
        * */
        function isAvalaraTransaction(transactionId) {

            const result = singleRecordSearch('transaction',
                [["internalid", "anyof", transactionId],
                    "AND",
                    ["taxline", "is", "T"]],
                'memo');

            // MDIMKOV 08.09.2024: if the memo field equals 'AvaTax', then this is Avalara enabled (return true), otherwise return false
            const isAvaTaxEnabled = (result === 'AvaTax');
            log.debug('MDIMKOV', 'isAvaTaxEnabled: ' + isAvaTaxEnabled);

            return isAvaTaxEnabled;
        }


        /* =============== Check if Avalara taxes have been calculated already, i.e., if a transaction subject to Avalara is tax ready =============== */

        /*
        * MDIMKOV 08.09.2024: this function returns true or false based on whether a transaction subject to Avalara has the taxes already calculated
        *       if the transaction is *not* subject to Avalara, the function returns [true], meaning it is tax ready
        *
        *       A detailed description is available here:
        *
        *       IF a transaction DOES NOT have AVATAX as the Tax Code
        *       (Any Non-US transaction)
        *        => Tax Ready = True
        *
        *       IF an Invoice HAS the AVATAX tax code
        *       AND
        *       The invoice has the **** Rest request in the AVALOGS
        *        => Tax Ready = True
        *
        *       IF an invoice HAS the AVATAX tax code
        *       AND the invoice has any other message in the AVALOGS
        *        => Tax Ready = False
        *
        * RETURNS: boolean
        *
        * INPUT: he internal ID of the respective transaction
        *
        * USAGE: isAvalaraTaxReady(123456); // -> true
        *
        * */
        function isAvalaraTaxReady(transactionId) {

            // =10= MDIMKOV 08.09.2024: check if the transaction is subject to Avalara; if it is NOT, then return TRUE
            if (!isAvalaraTransaction(transactionId)) {
                return true;
            }

            // MDIMKOV 08.09.2024: transactino is subject to Avalara, so check the Avalara logs associated with this transaction to see if taxes are ready
            const logEntry = singleRecordSearch('customrecord_avatransactionlogs', ['custrecord_ava_transaction', 'anyof', transactionId], 'custrecord_ava_note',
                null, 'internalid', true);

            // MDIMKOV 08.09.2024: check if the last Avalara log entry for this transaction includes 'Rest Response End', if so, Avalara is ready
            const isTaxReady = logEntry.includes('************************** REST Request Start ********************');

            log.debug('MDIMKOV', 'isTaxReady (Avalara): ' + isTaxReady);

            return isTaxReady
        }


        /* =============== Convert a string of email addresses (from a script parameter) into an array of email addresses =============== */

        /*
        * MDIMKOV 15.09.2024: this function converts a string of email addresses (from a script parameter) into an array of email addresses,
        *                       so that multiple email recepients can be emailed; this works around a limitation that a script parameter field
        *                       cannot be of type multi-select
        *
        * RETURNS: array of strings (the email addresses), e.g., ['md1@hotmail.com', 'md2@hotmail.com', 'md3@hotmail.com']
        *
        * INPUT: a string containing all email addresses to be emailed, separated by comma or by comma + space
        *           e.g.: 'md1@hotmail.com,md2@hotmail.com, m3@hotmail.com'
        *
        * USAGE: multiEmailAddressesStringToArray(getScriptParameter('custscript_tvz_2421_email_address')); // ['md1@hotmail.com', 'md2@hotmail.com', 'md3@hotmail.com']
        *
        * */
        function multiEmailAddressesStringToArray(emailString) {
            // Use a regular expression to split by comma and optional space
            return emailString.split(/,\s*/).map(email => email.trim());
        }


        /* =============== Check if entity or custom record is active or inactive =============== */

        /*
        * MDIMKOV 15.09.2024: this function checks if entity or custom is active or inactive
        *
        * RETURNS: boolean
        *
        * INPUT: recordId - integer - the entity ID
        *        recordType - string - 'vendor', 'customer', 'employee', etc.
        *
        * USAGE: const isActive = isRecordActive(12345, 'vendor'); // -> true
        *
        * */
        function isRecordActive(recordId, recordType) {
            getFieldValue('isinactive', recordType, recordId);
        }


        /* =============== Set an entity or custom record to either active or inactive =============== */

        /*
        * MDIMKOV 15.09.2024: this function sets an entity or custom record to either active or inactive
        *
        * RETURNS: void
        *
        * INPUT: recordId - integer - the entity ID
        *        recordType - string - 'vendor', 'customer', 'employee', etc.
        *        isInactive - boolean - false for setting to active, true for setting to inactive
        *
        * USAGE: setRecordActiveInactive(12345); // -> true
        *
        * */
        function setRecordActiveInactive(recordId, recordType, isInactive) {
            setFieldValue('isinactive', recordType, recordId, isInactive, false, true);
        }


        /* =============== Set a Cache value using a record (to be used in scripts instead of Cache module) =============== */

        /*
         * MDIMKOV 28.09.2024: this function sets a value into the [TVZ Script Cache] record type to be used in scripts instead of Cache module:
         *  - sets a value for a given script / deployment / key
         *  - directly sets a value if the record internal ID is passed
         *
         * RETURNS: void
         *
         * INPUT: scriptId - string - e.g., 'customscript_tvz_myscript'
         *        deploymentId - string - e.g., 'customdeploy_tvz_mydeployment'
         *        cacheKey - string - the key to set a value for, e.g., 'so_id'
         *        internalId - string - ignores scriptId / deploymentId / cacheKey and directly sets the value for the respective record
         *        value - string - the value to be set
         *
         * NOTE: the set will work either for a combination of script / deployment / key, or just for a direct record id
         *
         * USAGE: setting a value: scriptCacheSet('customscript_tvz_myscript', 'customdeploy_tvz_mydeployment', 'so_id', null, '57488'); // -> void
         *        setting a value with direct ID: scriptCacheSet(null, null, null, 1, '57488'); // -> void
         */

        function scriptCacheSet(scriptId, deploymentId, cacheKey, internalId, value) {
            // MDIMKOV 28.09.2024: proceed with setting a value
            if (internalId) {
                setFieldValue('custrecord_tvz_cache_value', 'customrecord_tvz_script_cache', internalId, value, false, true);
            } else {
                // MDIMKOV 28.09.2024: find the internal ID by scriptId / deploymentId / cacheKey, then set it
                const intId = singleRecordSearchSql('customrecord_tvz_script_cache', `custrecord_tvz_script = '${scriptId}' 
                                                                                        AND custrecord_tvz_script_deployment = '${deploymentId}' 
                                                                                        AND custrecord_tvz_cache_key = '${cacheKey}'`, 'id');
                setFieldValue('custrecord_tvz_cache_value', 'customrecord_tvz_script_cache', intId, value, false, true);
            }
        }


        /* =============== Get a Cache value using a record (to be used in scripts instead of Cache module) =============== */

        /*
         * MDIMKOV 28.09.2024: this function gets a value from the [TVZ Script Cache] record type to be used in scripts instead of Cache module:
         *  - gets a value for a given script / deployment / key
         *  - directly gets a value if the record internal ID is passed
         *
         * RETURNS: string - the cache value for the respective key
         *
         * INPUT: scriptId - string - e.g., 'customscript_tvz_myscript'
         *        deploymentId - string - e.g., 'customdeploy_tvz_mydeployment'
         *        cacheKey - string - the key to find a value for, e.g., 'so_id'
         *        internalId - string - ignores scriptId / deploymentId / cacheKey and directly gets the value for the respective record
         *
         * NOTE: the get will work either for a combination of script / deployment / key, or just for a direct record id
         *
         * USAGE: getting a value: scriptCacheGet('customscript_tvz_myscript', 'customdeploy_tvz_mydeployment', 'so_id', null); // -> '57488'
         *        getting a value with direct ID: scriptCacheGet(null, null, null, 1); // -> '57488'
         */

        function scriptCacheGet(scriptId, deploymentId, cacheKey, internalId) {
            // MDIMKOV 28.09.2024: proceed with getting a value
            let result = '';
            if (internalId) {
                result = singleRecordSearchSql('customrecord_tvz_script_cache', `ID = '${internalId}'`, 'custrecord_tvz_cache_value');
            } else {
                result = singleRecordSearchSql('customrecord_tvz_script_cache', `custrecord_tvz_script = '${scriptId}'
                                                                                     AND custrecord_tvz_script_deployment = '${deploymentId}'
                                                                                     AND custrecord_tvz_cache_key = '${cacheKey}'`,
                    'custrecord_tvz_cache_value');
            }

            let finalResult = null;

            if (result.startsWith('"') && result.endsWith('"')) {
                finalResult = result.slice(1, -1);
            } else {
                finalResult = result;
            }

            if (!resultSet || resultSet.length === 0) {
                return null;
            } else {
                return finalResult;
            }
        }


        /* =============== Get a language string from a language field on customer record, to be then set in an other language field =============== */

        /*
         * MDIMKOV 28.09.2024: this function gets a language string from a language field on customer record, to be then set in an other language field
         *                      you can then set the language on another record type with rec.setText
         *
         * RETURNS: string - e.g., 'German'
         *
         * INPUT: customerId - string - the ID of the customer
         *
         * USAGE: getCustomerLanguage(9948) // -> 'German' --- then use rec.setText to set it elsewhere
         */

        function getCustomerLanguageText(customerId) {
            const languageText = singleRecordSearchSql('customer', `id = ${customerId}`, 'language', true);

            if (languageText.startsWith('"') && languageText.endsWith('"')) {
                return languageText.slice(1, -1);
            } else {
                return languageText;
            }
        }


        /* =============== Get the number of days for a given Payment Terms ID =============== */

        /*
         * MDIMKOV - 2024-10-19: this function will return the number of [days till net due] for a given Payment Terms ID
         *
         * RETURNS: integer - e.g., 14
         *
         * INPUT: termsId - string - the ID of the Payment Terms record
         *
         * USAGE: getPaymentTermsDays(47) // -> 14
         */

        function getPaymentTermsDays(termsId) {
            return termsId ? singleRecordSearchSql('term', `id = ${termsId}`, 'daysuntilnetdue') : null;
        }


        /* =============== Get the last date of a quarter for a given date =============== */

        /*
         * MDIMKOV - 2024-10-19: this function will return the last date of a quarter for a given date
         *  Examples:
         *      2024-02-05 => 2024-03-31
         *      2024-10-04 => 2024-12-31
         *
         * RETURNS: date object
         *
         * INPUT: date - date object
         *
         * USAGE: getLastDateOfQuarter('2024-10-04') // -> 2024-12-31
         */

        function getLastDateOfQuarter(date) {
            const month = date.getMonth(); // get the month (0-11)
            const year = date.getFullYear(); // get the year

            let lastDate;

            if (month <= 2) {
                // Q1 (Jan-Mar)
                lastDate = new Date(year, 2, 31); // March 31
            } else if (month <= 5) {
                // Q2 (Apr-Jun)
                lastDate = new Date(year, 5, 30); // June 30
            } else if (month <= 8) {
                // Q3 (Jul-Sep)
                lastDate = new Date(year, 8, 30); // September 30
            } else {
                // Q4 (Oct-Dec)
                lastDate = new Date(year, 11, 31); // December 31
            }

            return lastDate;
        }


        /* =============== Pass a base64 string, create a file and attach it to a record in NetSuite =============== */

        /*
         * MDIMKOV - 2024-10-20: this function will create a PDF file and attach it to a record, based on a base64 string passed
         *      the file will be attached in the Communication > Files subtab of the respective record
         *
         * RETURNS: string - the file ID
         *
         * INPUT: recordId - string - the NetSuite ID of the record, to which the file will be attached
         *
         * USAGE: attachPdfFileFromBase64String(884452, 'vendorbill', -10, 'test', `xxxxxxx...`); // -> 123 (the ID of the file attached)
         */

        function attachPdfFileFromBase64String(recordId, recordType, folderId, fileName, pdfBase64Str) {
            try {
                // TVZ - 2024-10-20: ensure the input is a valid base64 string
                if (!pdfBase64Str || typeof pdfBase64Str !== 'string') {
                    throw new Error('Invalid base64 string provided');
                }


                // TVZ - 2024-10-20: create a file object with the base64 encoded PDF content
                var pdfFileObj = file.create({
                    name: fileName + '.pdf',   // Set the file name
                    fileType: file.Type.PDF,   // Set the file type to PDF
                    contents: pdfBase64Str,    // Set the base64-encoded string as content
                    encoding: file.Encoding.BASE_64 // Specify that the content is base64 encoded
                });


                // TVZ - 2024-10-20: save the file to the File Cabinet
                pdfFileObj.folder = folderId;  // Set the folder where you want to save the file (-10 for default 'SuiteScripts' folder)
                var fileId = pdfFileObj.save();  // Save the file and get the file ID


                // TVZ - 2024-10-20: attach the file to the given record
                record.attach({
                    record: {
                        type: 'file',
                        id: fileId
                    },
                    to: {
                        type: recordType, // Record type, e.g., 'vendorbill'
                        id: recordId // The record ID to attach to
                    }
                });

                log.debug('File Attached', 'File ID: ' + fileId + ' attached to Record ID: ' + recordId);

                return fileId;

            } catch (e) {
                log.error('Error', e.toString());
            }
        }


        /* =============== Set an entity record to either active or inactive =============== */

        /*
        * MDIMKOV 26.10.2024: this function returns the country 2-letter code for a given subsidiary ID
        *
        * RETURNS: string - the country ISO 2-letter code (e.g. 'US')
        *
        * INPUT: subsidiaryId - string - the Subsidiary ID
        *
        * USAGE: getSubsidiaryCountryCode(12); // -> 'FR'
        *
        * */
        function getSubsidiaryCountryCode(subsidiaryId) {
            return singleRecordSearchSql('subsidiary', `id = ${subsidiaryId}`, 'country');
        }


        /* =============== Get the balance, deposit balance and overdue balance for a given customer =============== */

        /*
        * TVZ - 2024-12-12: this function will give the balance, deposit balance and overdue balance for a given customer in default currency
        *
        * NOTE: this function has not yet been tested for multi-subsidiary customers
        *
        * INPUT: the customer internal ID
        *
        * OUTPUT: an object with all 3 balance types
        *
        * USAGE: const balance = getCustomerBalances(643324).balance; // -> 423.12
        *
        * */
        function getCustomerBalances(internalId) {
            const recCustomer = record.load({
                type: record.Type.CUSTOMER,
                id: internalId
            });

            const balance = recCustomer.getValue('balance');
            const depositBalance = recCustomer.getValue('depositbalance');
            const overDueBalance = recCustomer.getValue('overduebalance');

            const returnObject = {
                "balance": balance,
                "depositBalance": depositBalance,
                "overDueBalance": overDueBalance
            };
            // log.debug('TVZ', `returnObject: ${JSON.stringify(returnObject)}`);

            return returnObject
        }


        /**
         * TVZ 31.03.2025: Updates or adds an address for a customer or vendor.
         *
         * If an address is marked as default billing or shipping, it will be updated.
         * Otherwise, a new address is added.
         *
         * Unlike upsertAddress, this function doesn't save the entity, and can create an address before the entity is saved
         *
         *                 const recRef = record.load({
         *                     type: record.Type.CUSTOMER,
         *                     id: 2345,
         *                     isDynamic: true
         *                 });
         *
         *                 const addrJSON = [
         *                     {field: 'country', value: 'NL'},
         *                     {field: 'attention', value: ''},
         *                     {field: 'addressee', value: 'Raccoon invoice entity'},
         *                     {field: 'addr1', value: 'Oranjestraat 12'},
         *                     {field: 'addr2', value: ''},
         *                     {field: 'zip', value: '1056'},
         *                     {field: 'city', value: 'Amsterdam'},
         *                     {field: 'state', value: 'Noord-Holland'}
         *                 ]
         *
         * @param {Record} recRef - Loaded customer or vendor record (dynamic mode).
         * @param {Array} addrJSON - Array of field-value address objects.
         * @param {boolean} isShipping - Whether this is a shipping address.
         * @param {boolean} isBilling - Whether this is a billing address.
         *
         * @return {Object} - Object of type { oldAddress, newAddress }. When adding new address, oldAddress is empty
         */
        function addOrUpdateRecordAddress(recRef, addrJSON, isShipping = false, isBilling = false) {
            let oldAddress = '';
            let newAddress = '';
            const lineCount = recRef.getLineCount({sublistId: 'addressbook'});
            let targetLine = -1;

            // Look for existing default billing/shipping address
            for (let i = 0; i < lineCount; i++) {
                const currentShipping = recRef.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultshipping',
                    line: i
                });

                const currentBilling = recRef.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    line: i
                });

                if ((isShipping && currentShipping) || (isBilling && currentBilling)) {
                    targetLine = i;
                    break;
                }
            }

            if (targetLine > -1) {
                // Update existing address
                recRef.selectLine({sublistId: 'addressbook', line: targetLine});

                const addressSubrecord = recRef.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                oldAddress = getAddressTextFromSubrecord(addressSubrecord);
                //log.debug('TVZ', `old address: ${oldAddress}`);

                addrJSON.forEach(addr => {
                    addressSubrecord.setValue({
                        fieldId: addr.field,
                        value: addr.value
                    });
                });

                recRef.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultshipping',
                    value: isShipping
                });

                recRef.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    value: isBilling
                });

                newAddress = getAddressTextFromSubrecord(addressSubrecord);
                //log.debug('TVZ', `new address: ${newAddress}`);

                recRef.commitLine({sublistId: 'addressbook'});
            } else {
                // Add new address
                recRef.selectNewLine({sublistId: 'addressbook'});

                const addressSubrecord = recRef.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                addrJSON.forEach(addr => {
                    addressSubrecord.setValue({
                        fieldId: addr.field,
                        value: addr.value
                    });
                });

                recRef.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultshipping',
                    value: isShipping
                });

                recRef.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    value: isBilling
                });

                recRef.commitLine({sublistId: 'addressbook'});

                newAddress = getAddressTextFromSubrecord(addressSubrecord);
            }

            return {
                oldAddress: oldAddress,
                newAddress: newAddress,
            }
        }

        /**
         * TVZ 31.03.2025: Gets the full formatted address from an address subrecord
         *
         * @param {Subrecord} addressSubrecord - The addressbookaddress subrecord
         * @returns {string|null} - The formatted address text or null
         */
        function getAddressTextFromSubrecord(addressSubrecord) {
            if (!addressSubrecord) return null;

            const parts = [
                addressSubrecord.getValue({fieldId: 'attention'}),
                addressSubrecord.getValue({fieldId: 'addressee'}),
                addressSubrecord.getValue({fieldId: 'addr1'}),
                addressSubrecord.getValue({fieldId: 'addr2'}),
                addressSubrecord.getValue({fieldId: 'city'}),
                addressSubrecord.getValue({fieldId: 'state'}),
                addressSubrecord.getValue({fieldId: 'zip'}),
                addressSubrecord.getValue({fieldId: 'country'})
            ];

            return parts
                .filter(val => !!val)
                .join(', ');
        }


        /* =============== Navigate to a NetSuite transaction by ID =============== */

        /*
        * TVZ - 2025-04-05: this function will return a link to a transaction by passing only the internal ID of the transaction
        *
        * NOTE: the transaction type will be auto-resolved (no need to provide it); also, the full URL (incl. NetSuite domain) will be returned
        *
        * INPUT: the transaction internal ID
        *
        * OUTPUT: a fully qualified URL to the transaction
        *
        * USAGE: const url = navigateToTransaction(123456); // -> https://6796187-sb2.app.netsuite.com/app/accounting/transactions/transaction.nl?id=1105506
        *
        * */
        function navigateToTransaction(internalId) {
            return constructURL('accounting/transactions/transaction.nl?id=', internalId)
        }


        /* =============== Create a new folder in the File Cabinet =============== */

        /*
        * TVZ - 2025-04-05: this function will create a new folder in the File Cabinet based on name and parent folder ID
        *
        * INPUT: name and parent folder ID
        *
        * OUTPUT: the ID of the created folder
        *
        * NOTE: if the folder exists, the logic will fail with an error
        *
        * USAGE: const newFolderId = createNewFolder('Folder Name', 48439); //-> 34224
        *
        * */
        function createNewFolder(folderName, parentFolderId) {
            var folderRecord = record.create({
                type: record.Type.FOLDER,
                isDynamic: true
            });

            folderRecord.setValue({
                fieldId: 'name',
                value: folderName
            });

            folderRecord.setValue({
                fieldId: 'parent',
                value: parentFolderId
            });

            var folderId = folderRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            return folderId;
        }


        /* =============== Find accounting period ID by period name =============== */

        /*
        * TVZ - 2025-06-15: this function will find the accounting period ID by passing the period name
        *
        * INPUT: periodName - string - the name of the accounting period, e.g., 'June 2025'
        *
        * OUTPUT: the internal ID of the accounting period, or null if not found
        *
        * USAGE: const periodId = findAccountingPeriodIdByName('June 2025'); // -> 12345
        *
        * */
        function getPeriodIdByName(periodName) {
            let periodId = null;

            const periodSearch = search.create({
                type: search.Type.ACCOUNTING_PERIOD,
                filters: [
                    ['periodname', 'is', periodName]
                ],
                columns: ['internalid']
            });

            periodSearch.run().each((result) => {
                periodId = result.getValue('internalid');
                return false; // stop after the first result
            });

            return periodId;
        }


        /* =============== Get the base64 string of a PDF file for a given transaction ID =============== */

        /*
        * TVZ - 2025-06-23: this function will return the base64 string of a PDF file for a given transaction ID
        *
        * INPUT: trandsId - string - the internal ID of the transaction
        *
        * OUTPUT: a base64 string of the PDF file, or null if not found
        *
        * USAGE: const pdfBase64 = getTransactionPdfBase64(123456); // -> 'JVBERi0xLjQKJazc...'
        *
        * */
        function getTransactionPdfBase64(transId) {
            let pdfBase64 = null;
            const pdfFile = render.transaction({
                entityId: transId,
                printMode: render.PrintMode.PDF
            });
            const base64String = pdfFile.getContents();
            if (base64String) {
                // Ensure the base64 string is properly formatted
                if (base64String.startsWith('"') && base64String.endsWith('"')) {
                    pdfBase64 = base64String.slice(1, -1); // Remove quotes if present
                } else {
                    pdfBase64 = base64String; // Use as is if no quotes
                }
            } else {
                log.error('getTransactionPdfBase64', `No PDF found for transaction ID: ${transId}`);
                pdfBase64 = null; // No PDF found, return null
            }
            return pdfBase64;
        }


        /* =============== Roll back transaction by deleting the transaction record =============== */

        /*
        * TVZ - 2025-07-06: this function will roll back a transaction by deleting the transaction record
        *
        * INPUT: transType - string - the type of the transaction, e.g., 'invoice', 'salesorder', etc.
        *           transId - string - the internal ID of the transaction to roll back
        *
        * OUTPUT: boolean - true if the transaction was successfully rolled back, false if an error occurred
        *
        * USAGE: const isRolledBack = rollBackTrans('invoice', 123456); // -> true
        *
        * */
        function rollBackTrans(transType, transId) {
            try {
                record.delete({
                    type: transType,
                    id: transId
                });
            } catch (e) {
                return false;
            }
            return true;
        }


        /* =============== Add Contact to Vendor =============== */

        /*
        * // TVZ - 2025-07-14: this function will add a contact to a vendor record (param allows to optionally only add it if it does not exist already)
        *
        * INPUT: vendorId - string - the internal ID of the vendor to which the contact will be added
        *       contactObject - object - an object containing the contact fields and values to be set, e.g.:
        *
        *
        * OUTPUT: the internal ID of the created contact record, or the existing contact ID if it already exists
        *
        * USAGE:                 const contactObject = {
                                    firstname: 'First',
                                    lastname: 'Last',
                                    title: 'Manager',
                                    email: 'mdimkov_13@hotmail.com'
                                }

                const contactId = addContactToVendor(371862, contactObject, true);
                log.debug('TVZ', `contactId: ${contactId}`);
        *
        * */
        function addContactToVendor(vendorId, contactObject, onlyIfNoneExists) {

            if (onlyIfNoneExists) {

                // TVZ - 2025-07-14: if a contact already exists, return its ID
                const existingContact = singleRecordSearch('contact', ['company', 'is', vendorId], 'internalid');

                if (existingContact) {
                    log.debug('TVZ', `Contact already exists for vendor ${vendorId}: ${existingContact}`);
                    return existingContact;
                }

            }

            const recContact = record.create({
                type: record.Type.CONTACT,
                isDynamic: false,
            });

            recContact.setValue('company', vendorId);
            recContact.setValue('companyid', vendorId);
            recContact.setValue('parentcompany', vendorId);

            const firstName = contactObject.firstname || '';
            const lastName = contactObject.lastname || '';

            const randomToken = generateRandomToken(6, true, false, true, false);

            recContact.setValue('entityid', `${firstName} ${lastName} (${randomToken})`);

            // TVZ - 2025-07-14: add all fields from the contactObject to the vendor record
            for (const field in contactObject) {
                if (contactObject.hasOwnProperty(field)) {
                    recContact.setValue({
                        fieldId: field,
                        value: contactObject[field]
                    });
                }
            }

            return recContact.save();
        }


        /* =============== Get the subsidiary address on one line or on multiple lines =============== */

        /*
        * TVZ - 2025-07-23: this function will return the subsidiary address on one line or on multiple lines
        *
        * INPUT: subsidiaryId - string - the internal ID of the subsidiary
        *       multiLine - boolean - if true, returns the address on multiple lines, otherwise on one line
        *      isFirstLineBold - boolean - if true, makes the first line bold (only applies if multiLine is true)
        *
        * OUTPUT: string - the subsidiary address formatted as a single line or multiple lines
        *
        * USAGE: getSubsidiaryAddress(12, false, false); // -> '123 Main St Suite 456 City, State ZIP Country'
        *
        * */
        function getSubsidiaryAddress(subsidiaryId, isMultipleLines, isFirstLineBold) {
            const recSubsidiary = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryId
            });

            let companyAddress = recSubsidiary.getValue('mainaddress_text') || '';

            if (isMultipleLines) {
                // Split the address into lines
                const lines = companyAddress.split('\n');
                if (isFirstLineBold && lines.length > 0) {
                    // Make the first line bold using <b> tags
                    lines[0] = `<b>${lines[0]}</b>`;
                }
                // Join the lines with <br> for HTML line breaks
                companyAddress = lines.join('<br>');
            }

            return companyAddress;
        }


        /* =============== Set an entity record to either active or inactive =============== */

        /*
        * MDIMKOV 15.09.2024: this function sets an entity record to either active or inactive
        *
        * RETURNS: void
        *
        * INPUT: entityId - integer - the entity ID
        *        recordType - string - 'vendor', 'customer', 'employee', etc.
        *        isInactive - boolean - false for setting to active, true for setting to inactive
        *
        * USAGE: setEntityActiveInactive(12345); // -> true
        *
        * */
        function setEntityActiveInactive(entityId, recordType, isInactive) {
            setFieldValue('isinactive', recordType, entityId, isInactive, false, true);
        }


        // ##

        return {
            loadItemRec: loadItemRec,
            getPostingPeriod: getPostingPeriod,
            arrayContains: arrayContains,
            longLog: longLog,
            countryByText: countryByText,
            countryById: countryById,
            countryByCode: countryByCode,
            findAccountByNumber: findAccountByNumber,
            findListValue: findListValue,
            findListValueCached: findListValueCached,
            getRecIdbyExtId: getRecIdbyExtId,
            currencyISOtoID: currencyISOtoID,
            csvFileToJSON: csvFileToJSON,
            transInternalIdToDocumentNum: transInternalIdToDocumentNum,
            transDocumentNumToInternlId: transDocumentNumToInternlId,
            docNumToTransIntId: docNumToTransIntId,
            getUnitIdByItemIdAndCode: getUnitIdByItemIdAndCode,
            dateTimeStampForFileName: dateTimeStampForFileName,
            findShippingMethodId: findShippingMethodId,
            getCurrentUserNames: getCurrentUserNames,
            getCurrentUserId: getCurrentUserId,
            getCurrentUserRole: getCurrentUserRole,
            getCurrentUserRoleId: getCurrentUserRoleId,
            getCurrentUserEmailAddress: getCurrentUserEmailAddress,
            suiteTaxGrossToNetAmounts: suiteTaxGrossToNetAmounts,
            replaceUrlParam: replaceUrlParam,
            convertDateToFormat: convertDateToFormat,
            arrayRemoveDuplicateMembers: arrayRemoveDuplicateMembers,
            md5hash: md5hash,
            addThousandsSeparator: addThousandsSeparator,
            replaceUmlaute: replaceUmlaute,
            createDateObjectFromString: createDateObjectFromString,
            getRevRecEndDate: getRevRecEndDate,
            constructURL: constructURL,
            getCurrencyExchangeRate: getCurrencyExchangeRate,
            getSubsidiaryIdByName: getSubsidiaryIdByName,
            getNoHierarchySubsidiaryDepartmentLocation: getNoHierarchySubsidiaryDepartmentLocation,
            getClassIdByName: getClassIdByName,
            getDepartmentIdByName: getDepartmentIdByName,
            getAccountByName: getAccountByName,
            convertTransHeaderOptionsToArray: convertTransHeaderOptionsToArray,
            findTopParentTransaction: findTopParentTransaction,
            createClass: createClass,
            getItemIdByCode: getItemIdByCode,
            getLocationIdByName: getLocationIdByName,
            addDaysToDate: addDaysToDate,
            addDaysToDateNew: addDaysToDateNew,
            getFieldValue: getFieldValue,
            setFieldValue: setFieldValue,
            countTransLines: countTransLines,
            transactionSumLines: transactionSumLines,
            singleRecordSearch: singleRecordSearch,
            singleRecordSearchSql: singleRecordSearchSql,
            logGovernanceUsageRemaining: logGovernanceUsageRemaining,
            groupReduceJson: groupReduceJson,
            groupReduceJsonWithChildren: groupReduceJsonWithChildren,
            searchResultCount: searchResultCount,
            logSearchResultCount: logSearchResultCount,
            getTransactionIdByTranid: getTransactionIdByTranid,
            getInboundShipmentIdByDocNum: getInboundShipmentIdByDocNum,
            getNetAmountNoTax: getNetAmountNoTax,
            getSumOfSavedSearch: getSumOfSavedSearch,
            translateTractionTypeNameA: translateTractionTypeNameA,
            translateTractionTypeNameB: translateTractionTypeNameB,
            translateTractionTypeNameC: translateTractionTypeNameC,
            translateTractionTypeNameD: translateTractionTypeNameD,
            translateTractionTypeNameE: translateTractionTypeNameE,
            createCsvFileFromSavedSearch: createCsvFileFromSavedSearch,
            getScriptParameter: getScriptParameter,
            setScriptParameter: setScriptParameter,
            generateUniqueNumber: generateUniqueNumber,
            roundAmount: roundAmount,
            getLotSerialNumId: getLotSerialNumId,
            jsonparse: jsonparse,
            testJsonString: testJsonString,
            formatNumberWithSpaceSeparator: formatNumberWithSpaceSeparator,
            formatNumber: formatNumber,
            getAccountFriendlyName: getAccountFriendlyName,
            getClassificationName: getClassificationName,
            getAllChildClassifications: getAllChildClassifications,
            getTransactionType: getTransactionType,
            getAcctPeriodDate: getAcctPeriodDate,
            printTodaysDate: printTodaysDate,
            printDate: printDate,
            convertNumberToString: convertNumberToString,
            getDecimalPartAsString: getDecimalPartAsString,
            convertDateToMonthYearString: convertDateToMonthYearString,
            getPeriodName: getPeriodName,
            setFieldOnTransLines: setFieldOnTransLines,
            getCurrentIpAddress: getCurrentIpAddress,
            getItemIncomeAccountId: getItemIncomeAccountId,
            getItemExpenseAccountId: getItemExpenseAccountId,
            checkOverlappingDateRanges: checkOverlappingDateRanges,
            preventDuplicateValue: preventDuplicateValue,
            upsertAddress: upsertAddress,
            appendLineToFile: appendLineToFile,
            xml2json: xml2json,
            json2xml: json2xml,
            itemFulfillment: itemFulfillment,
            setSerialNumbers: setSerialNumbers,
            getAllQueryResultsOld: getAllQueryResultsOld,
            getAllQueryResults: getAllQueryResults,
            getSingleValueFromSuiteQlQuery: getSingleValueFromSuiteQlQuery, // SQL
            countrySourceListAddOptions: countrySourceListAddOptions,
            stateSourceListAddOptions: stateSourceListAddOptions,
            getTaxCodeRate: getTaxCodeRate,
            redirectToViewMode: redirectToViewMode,
            setFilePublic: setFilePublic,
            getFileURL: getFileURL,
            getCountryCodeTextId: getCountryCodeTextId,
            getStateCodeTextId: getStateCodeTextId,
            generateRandomToken: generateRandomToken,
            suiteletCacheSet: suiteletCacheSet,
            suiteletCacheGet: suiteletCacheGet,
            catchSuiteletError: catchSuiteletError,
            epochTimeCurrentTimeStamp: epochTimeCurrentTimeStamp,
            createCustomerRefundFromCreditMemo: createCustomerRefundFromCreditMemo,
            isSubsidiaryAssignedToCustomer: isSubsidiaryAssignedToCustomer,
            addSubsidiaryToEntity: addSubsidiaryToEntity,
            detachSalesOrderFromInvoice: detachSalesOrderFromInvoice,
            upsertEntityBankDetailsEFT: upsertEntityBankDetailsEFT,
            addHoursToISODateString: addHoursToISODateString,
            formatDateValue: formatDateValue,
            getClassificationIdByName: getClassificationIdByName,
            applyCreditMemoToInvoice: applyCreditMemoToInvoice,
            isAvalaraTransaction: isAvalaraTransaction,
            isAvalaraTaxReady: isAvalaraTaxReady,
            multiEmailAddressesStringToArray: multiEmailAddressesStringToArray,
            isRecordActive: isRecordActive,
            setRecordActiveInactive: setRecordActiveInactive,
            scriptCacheSet: scriptCacheSet,
            scriptCacheGet: scriptCacheGet,
            getCustomerLanguageText: getCustomerLanguageText,
            getPaymentTermsDays: getPaymentTermsDays,
            getLastDateOfQuarter: getLastDateOfQuarter,
            attachPdfFileFromBase64String: attachPdfFileFromBase64String,
            getSubsidiaryCountryCode: getSubsidiaryCountryCode,
            getCustomerBalances: getCustomerBalances,
            addOrUpdateRecordAddress: addOrUpdateRecordAddress,
            navigateToTransaction: navigateToTransaction,
            setTransFieldValue: setTransFieldValue,
            createNewFolder: createNewFolder,
            getPeriodIdByName: getPeriodIdByName,
            getTransactionPdfBase64: getTransactionPdfBase64,
            rollBackTrans: rollBackTrans,
            addContactToVendor: addContactToVendor,
            getSubsidiaryAddress: getSubsidiaryAddress,
            setEntityActiveInactive: setEntityActiveInactive
        }
    }
);
