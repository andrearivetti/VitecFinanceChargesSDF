/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/format', 'SuiteScripts/_Libraries/_lib.v2', 'SuiteScripts/_Libraries/_const', 'N/render', 'N/xml', 'N/file', 'N/task', 'N/email'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{query} query
     * @param{runtime} runtime
     * @param{format} format
     * @param{_lib} _lib
     * @param{_c} _c
     * @param{render} render
     * @param{xml} xml
     * @param{file} file
     * @param{task} task
     * @param{email} email
     */
    (record, search, query, runtime, format, _lib, _c, render, xml, file, task, email) => {

        /* ART/TVZ -- Nov/2025 --this map reduce script, running on a scheduled basis:
       * identifies configuration records in the [customrecord_tvz_2575_art_config] record type to be processed
 - identifies the saved search selected on each of the configuration records, which is used for invoice creation
 - creates invoices (one per customer) based on these saved searches
 - each invoice holds lines for finance charges (based on days delayed and a collection fee)
 - additionally, an automatic email is being sent to the customer to inform them
       * */


        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */


        const NETSUITE_ACCOUNT_TIME_ZONE = 'Europe/Stockholm';
        const INVOICE_STATUS = `'Paid In Full'`;
        const PAYMENT_LINK_TYPE = `'Payment'` // list of NextTransactionLineLink.Linktype associated with payment for this account
        const SYSDATE = truncDate(new Date());
        const FIN_CHARGE_INV_FILE_FOLDER = 30486; // [ART| TVZ Finance Charge Invoice Files] folder:  30486 - PROD / 9665 - SB
        const SYSDATE_EPOCH = localDateEpoch(new Date())

        const getInputData = (inputContext) => {

            try {
                log.audit('ART|TVZ', '--- getInputData  with SuiteQL---');
                log.audit('ART|TVZ', '--- sysdate---' + SYSDATE);
                log.audit('ART|TVZ', '--- sysdate---' + typeof SYSDATE);
                log.audit('ART|TVZ', '--- SYSDATE_EPOCH---' + SYSDATE_EPOCH);


                const sqlQueryNextFinanceCharge = `select id,
                                                          custrecord_tvz_2575_art_saved_search
                                                   from customrecord_tvz_2575_art_config
                                                   where isinactive = 'F'
                                                     and (custrecord_tvz_2575_art_last_run is null
                                                       OR trunc(custrecord_tvz_2575_art_last_run)!='${SYSDATE}')
                                                     and rownum = 1`

                //  log.audit('ART|TVZ', '--- sqlQueryNextFinanceCharge---' + sqlQueryNextFinanceCharge);

                const queryResultsNextFinanceCharge = query.runSuiteQL({
                    query: sqlQueryNextFinanceCharge
                });

                const resultSetNextFinanceChargeID = queryResultsNextFinanceCharge.asMappedResults();

                if (resultSetNextFinanceChargeID.length > 0) {

                    let invoiceList = [];
                    let outputObj = [];
                    log.debug('ART|TVZ', '--- resultSetNextFinanceChargeID ---' + JSON.stringify(resultSetNextFinanceChargeID));

                    // RUN Saved Search from [Finance Charge Configuration] record
                    var transactionSearchObj = search.load({
                        id: resultSetNextFinanceChargeID[0].custrecord_tvz_2575_art_saved_search
                    });

                    var searchResultCount = transactionSearchObj.runPaged().count;
                    log.debug('ART|TVZ', 'FCC process will be run for: ' + searchResultCount + ' transactions lines');

                    /*                 // If SS returns main line data
                                        transactionSearchObj.run().each(function (result) {

                                            // Per each result add [Finance Charge Configuration] record ID
                                            let newObj = {"customrecord_tvz_2575_art_config": resultSetNextFinanceChargeID[0].id};
                                            let rowResult = JSON.stringify(newObj).slice(0, -1) + ',' + JSON.stringify(result).slice(1)

                                            invoiceList.push(rowResult);
                                            return true;
                                        })*/

                    transactionSearchObj.run().each(function (result) {
                        invoiceList.push(result.id);
                        return true;
                    })

                    invoiceList = removeDuplicates(invoiceList)
                    log.debug('ART|TVZ', '--- List of invoices for processing: ' + invoiceList);

                    for (let i = 0; i < invoiceList.length; i++) {
                        outputObj.push({
                            'tranid': invoiceList[i],
                            'finchargeid': resultSetNextFinanceChargeID[0].id
                        });
                    }

                    // Set current Config record as processed
                    record.submitFields({
                        type: 'customrecord_tvz_2575_art_config',
                        id: resultSetNextFinanceChargeID[0].id,
                        values: {
                            custrecord_tvz_2575_art_last_run: new Date(),
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                            disableTriggers: true
                        }
                    })

                    return outputObj;
                } else {
                    log.audit('ART|TVZ', 'There is no [Finance Charge Configuration] record for processing.');
                    return [{'terminateScriptFlag': 1}];
                }


            } catch (e) {
                log.error('ERROR', e.message + '--- ' + e.stack);
            }


        }


        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {

            try {
                // log.debug('ART|TVZ', '--- Start MAP ---')

                const transaction = JSON.parse(mapContext.value);


                if (transaction.terminateScriptFlag == 1) {
                    mapContext.write({
                        key: transaction,
                        // value:
                    })
                    return
                }

                const invoiceID = transaction.tranid;
                // log.debug('ART|TVZ', 'invoiceID: ' + invoiceID);

                const transactionLookUp = search.lookupFields({
                    type: 'transaction',
                    id: invoiceID,
                    columns: ['tranid', 'entity', 'trandate', 'duedate', 'fxamount', 'exchangerate','custbody_tvz_2575_art_excld_fc', 'custbody_tvz_2575_art_fin_chrg']
                });

                //   log.debug('ART|TVZ', '--- transactionLookUp ---' + JSON.stringify(transactionLookUp));

                const customerID = transactionLookUp.entity[0].value;
                const invoiceExcudeFC = transactionLookUp.custbody_tvz_2575_art_excld_fc;
                const invoiceOldFinChrgId = transactionLookUp.custbody_tvz_2575_art_fin_chrg[0].text;
                const invoiceTranId = transactionLookUp.tranid;


                // const customerID = transaction.values.entity[0].value;
                // const customerID = transaction.values.entity[0].value;
                // const invoiceID = transaction.id;
                const customerExcudeFC = _lib.getFieldValue('custentity_tvz_2575_art_excld_fc', 'customer', customerID);
                // const invoiceExcudeFC = _lib.getFieldValue('custbody_tvz_2575_art_excld_fc', 'transaction', invoiceID);
                // const invoiceTranId = _lib.getFieldValue('tranid', 'transaction', invoiceID);
                let finChargeYear = _lib.getFieldValue('custrecord_tvz_2575_art_year', 'customrecord_tvz_2575_art_config', transaction.finchargeid);


                let paymentDate = getPaymentDate(invoiceID);
                let tranDateYear = new Date(localDateEpoch(transactionLookUp.trandate)).getFullYear()


                const dueDateNum = localDateEpoch(transactionLookUp.duedate);
                const paymentDateNum = localDateEpoch(paymentDate);

                log.audit('ART|TVZ', 'transactionLookUp.duedate: ' + transactionLookUp.duedate);
                log.audit('ART|TVZ', 'paymentDateNum: ' + paymentDateNum);
                log.audit('ART|TVZ', 'paymentDate: ' + paymentDate);
                log.audit('ART|TVZ', 'paymentDateNum: ' + paymentDateNum);

                //
                //     log.audit('ART|TVZ', 'invoiceOldFinChrgId: ' + invoiceOldFinChrgId);
                // log.audit('ART|TVZ', 'invoiceOldFinChrgId.length: ' + invoiceOldFinChrgId.length);
                //     log.audit('ART|TVZ', 'customerExcudeFC: ' + customerExcudeFC);
                //     log.audit('ART|TVZ', 'invoiceExcudeFC: ' + invoiceExcudeFC);
                //     log.audit('ART|TVZ', 'paymentDate.length: ' + paymentDate.length);

                // If there is no invoiceOldFinChrgId -> custbody_tvz_2575_art_fin_chrg=[{"value":"","text":" "}]}
                if (finChargeYear != tranDateYear) {
                    log.audit('ART|TVZ', 'invoiceID: ' + invoiceTranId + ' (id=' + invoiceID + ') is excluded because transaction date is not in the same year as [Finance Charge Configuration]');
                    return
                }

                if (invoiceExcudeFC) {
                    let failedReason = 'Current invoice: ' + invoiceTranId + ' (id=' + invoiceID + ') is excluded from FFC'
                    log.audit('ART|TVZ', failedReason);
                    // updateOrgInvoice(invoiceID, failedReason)
                    return
                }

                if (invoiceOldFinChrgId.length > 1) {
                    let failedReason = 'Invoice: ' + invoiceTranId + ' (id=' + invoiceID + ') already has charge invoice #' + invoiceOldFinChrgId
                    log.audit('ART|TVZ', failedReason);
                    updateOrgInvoice(invoiceID, failedReason)
                    return
                }

                if (paymentDateNum <= dueDateNum) {
                    let failedReason = 'Invoice: ' + invoiceTranId + ' (id=' + invoiceID + ') is paid on time, payment date was: ' + paymentDate
                    log.audit('ART|TVZ', failedReason);
                    updateOrgInvoice(invoiceID, failedReason)
                    return
                }

                if (customerExcudeFC) {
                    let failedReason = 'Customer of invoice: ' + invoiceTranId + ' (id=' + invoiceID + ') is excluded from FFC'
                    log.audit('ART|TVZ', failedReason);
                    updateOrgInvoice(invoiceID, failedReason)
                    return
                }


                // if (customerExcudeFC || invoiceExcudeFC || dueDateNum > paymentDateNum) {//paymentDate.length != 0) {
                //     log.audit('ART|TVZ', 'invoiceID: ' + invoiceTranId + ' (id=' + invoiceID + ') is excluded from Finance Charges process ');
                //     return
                // }


                let mapKeyOut = {
                    'customrecord_tvz_2575_art_config': transaction.finchargeid,
                    'customer': customerID
                }

                let mapValueOut = {
                    'tranid': invoiceID,
                    'tranname': transactionLookUp.tranid,
                    'trandate': transactionLookUp.trandate,
                    'duedate': transactionLookUp.duedate,
                    'paymentdate': paymentDate,
                    'amount': transactionLookUp.fxamount,
                    'exchangerate': transactionLookUp.exchangerate,
                }

                // log.debug('ART|TVZ', 'mapKeyOut: ' + JSON.stringify(mapKeyOut));
                // log.debug('ART|TVZ', 'mapValueOut: ' + JSON.stringify(mapValueOut));


                mapContext.write({
                    key: mapKeyOut,
                    value: mapValueOut
                });

                //  _lib.logGovernanceUsageRemaining('MAP end');

            } catch (e) {
                log.error('ERROR', e.message + '--- ' + e.stack);
            }

        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

            try {

                log.audit('ART|TVZ', '--- reduce  stage start---');

                const reduceKeysInput = JSON.parse(reduceContext.key);
                log.debug('ART|TVZ', '--- reduceKeysInput ---' + JSON.stringify(reduceKeysInput));

                if (reduceKeysInput.terminateScriptFlag == 1) {
                    reduceContext.write({
                        key: reduceKeysInput,
                        // value:
                    })
                    return
                }

                const reduceValuesInput = reduceContext.values;
                const finChargeConfID = reduceKeysInput.customrecord_tvz_2575_art_config;

                // log.debug('ART|TVZ', '--- finChargeConfID ---' + finChargeConfID);
                // log.debug('ART|TVZ', '--- reduceValuesInput ---' + reduceValuesInput);

                const finChargeConfLookUp = search.lookupFields({
                    type: 'customrecord_tvz_2575_art_config',
                    id: finChargeConfID,
                    columns: ['custrecord_tvz_2575_art_yearly_fee',
                        'custrecord_tvz_2575_art_collection_fee',
                        'custrecord_tvz_2575_art_interst_fee_item',
                        'custrecord_tvz_2575_art_coll_fee_item',
                        'custrecord_tvz_2575_art_class',
                        'custrecord_tvz_2575_art_descr_layout',
                        'custrecord_tvz_2575_art_descr_fixed_fee',
                        'custrecord_tvz_2575_art_print_pdf_form',
                        'custrecord_tvz_2575_art_email_sender',
                        'custrecord_tvz_2575_art_email_template', 
                        'custrecord_fincharge_threshold_amt'
                    ]
                });

                log.debug('ART|TVZ', '--- finChargeConfLookUp ---' + JSON.stringify(finChargeConfLookUp));


                const finChargeItemID = finChargeConfLookUp.custrecord_tvz_2575_art_interst_fee_item[0].value;
                const finChargeItemClassOvr = parseInt(finChargeConfLookUp.custrecord_tvz_2575_art_class[0].value)
                const finChargeItemLookUp = search.lookupFields({
                    type: 'item',
                    id: finChargeItemID,
                    columns: ['class']
                });

                log.debug('ART|TVZ', '--- finChargeItemLookUp ---' + JSON.stringify(finChargeItemLookUp));
                log.debug('ART|TVZ', '--- item ---' + finChargeItemID);
                log.debug('ART|TVZ', '--- class ---' + finChargeItemClassOvr);

                let yearlyFee = finChargeConfLookUp.custrecord_tvz_2575_art_yearly_fee;
                log.debug('ART|TVZ', '--- yearlyFee ---' + yearlyFee);
                yearlyFee = parseFloat(yearlyFee);//.slice(0, -1)

                log.debug('ART|TVZ', '--- yearlyFee ---' + yearlyFee);

                const collectionFee = parseFloat(finChargeConfLookUp.custrecord_tvz_2575_art_collection_fee);
                let collFeeItemID = 0, addItem = 0;
                if (finChargeConfLookUp.custrecord_tvz_2575_art_coll_fee_item.length > 0) {
                    collFeeItemID = finChargeConfLookUp.custrecord_tvz_2575_art_coll_fee_item[0].value;
                }

                log.debug('ART|TVZ', '--- collectionFee ---' + collectionFee);
                log.debug('ART|TVZ', '--- collFeeItemID ---' + collFeeItemID);


                // ART|TVZ: Create new Finance Charge Invoice:
                const newFinChrgInv = record.create({
                    type: 'invoice',
                    isDynamic: true
                });

                //  newFinChrgInv.setValue('customform', 240); //Do we need additional form for this Invoice type
                newFinChrgInv.setValue('custbody_art_user_booking_inv', 16);
                newFinChrgInv.setValue('entity', reduceKeysInput.customer);
                newFinChrgInv.setValue('trandate', new Date(SYSDATE_EPOCH));
                newFinChrgInv.setValue('memo', 'FFC invoice');

                log.debug('ART|TVZ', '--- reduceValuesInput.length ---' + reduceValuesInput.length);

                for (let i = 0; i < reduceValuesInput.length; i++) {
                    const currectInputInv = JSON.parse(reduceValuesInput[i]);

                    log.debug('ART|TVZ', 'currectInputInv ' + JSON.stringify(currectInputInv));


                    const dueDate = truncDate(currectInputInv.duedate);
                    const dueDateNum = localDateEpoch(currectInputInv.duedate);
                    const sysDateNum = localDateEpoch(new Date());
                    log.debug('ART|TVZ', 'sysDateNum: ' + sysDateNum);
                    log.debug('ART|TVZ', 'currectInputInv.paymentdate: ' + currectInputInv.paymentdate);
                    const paymentDateNum = (currectInputInv.paymentdate.length > 0) ? localDateEpoch(currectInputInv.paymentdate) : sysDateNum;
                    log.debug('ART|TVZ', 'paymentDateNum ' + paymentDateNum);
                    const paymentDelayInDays = Math.trunc((paymentDateNum - dueDateNum + 1) / 86400000)
                    const finChargeAmt = (paymentDelayInDays / 365) * (currectInputInv.amount * yearlyFee * 0.01);
                    //Check threshold amount for finance charge
                    const thresholdAmt = parseFloat(finChargeConfLookUp.custrecord_fincharge_threshold_amt) || 0;
                    log.debug('ART|TVZ', 'thresholdAmt ' + thresholdAmt);
                    
                    const exchangeRate = reduceKeysInput.exchangerate || 1; // Default to 1 if exchange rate is not available
                    const thresholdAmtFx = thresholdAmt * exchangeRate; 
                    if(finChargeAmt < thresholdAmtFx) {
                        continue; // Skip this invoice if finance charge amount is below threshold;
                    }
                    let descrLayout = finChargeConfLookUp.custrecord_tvz_2575_art_descr_layout

                    log.debug('ART|TVZ', '--- tranid ---' + currectInputInv.tranid);
                    log.debug('ART|TVZ', '--- rate/amount ---' + currectInputInv.amount);
                    log.debug('ART|TVZ', '--- duedate ---' + currectInputInv.duedate);
                    log.debug('ART|TVZ', '--- paymentdate ---' + currectInputInv.paymentdate);
                    log.debug('ART|TVZ', 'paymentDelayInDays ' + paymentDelayInDays);
                    log.debug('ART|TVZ', 'finChargeAmt ' + finChargeAmt);

                    const contextData = {
                        'tranid': currectInputInv.tranname,
                        'dueDate': dueDate,
                        'paidDate': currectInputInv.paymentdate,
                        'yearlyFee': yearlyFee,
                    };

                    descrLayout = applyTemplate(descrLayout, contextData)

                    log.debug('ART|TVZ', 'descrLayout: ' + descrLayout);

                    newFinChrgInv.selectNewLine({
                        sublistId: 'item'
                    });
                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: finChargeItemID
                    });
                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        value: descrLayout
                    });

                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1
                    });

                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: _lib.roundAmount(finChargeAmt)
                    });

                    // newFinChrgInv.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'amount',
                    //     value: finChargeAmt
                    // });

                    // newFinChrgInv.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_orgn_invoice',
                    //     value: reduceValuesInput.tranid
                    // });
                    if (finChargeItemClassOvr) {
                        newFinChrgInv.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'class',
                            value: finChargeItemClassOvr
                        });
                    }

                    addItem++;

                    newFinChrgInv.commitLine({
                        sublistId: 'item'
                    });

                }
                
            if(addItem > 0){
                // Add collection Fee line
                if (collFeeItemID != 0) {

                    //    let descrFixedFee = finChargeConfLookUp.custrecord_tvz_2575_art_descr_fixed_fee
                    //   descrFixedFee = applyTemplate(descrFixedFee, contextData);
                    const contextData = {
                        'collectionFee': collectionFee,
                    };

                    let descrFixedFee = applyTemplate(finChargeConfLookUp.custrecord_tvz_2575_art_descr_fixed_fee, contextData);
                    log.debug('ART|TVZ', 'descrFixedFee ' + descrFixedFee);

                    newFinChrgInv.selectNewLine({
                        sublistId: 'item'
                    });
                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: collFeeItemID
                    });
                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        value: descrFixedFee
                    });

                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1
                    });

                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: collectionFee
                    });

                    newFinChrgInv.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: collectionFee
                    });

                    newFinChrgInv.commitLine({
                        sublistId: 'item'
                    });
                }

                newFinChrgInv.setValue('custbody_tvz_2575_art_excld_fc', true);
                newFinChrgInv.setValue('custbody_art_invoice_created_approved', true);
                //   newFinChrgInv.setValue('tobeemailed', false);

                const newFinChrgInvID = newFinChrgInv.save();


                log.audit('ART|TVZ', 'New Finance Charge Invoice : --- ' + newFinChrgInvID);

            }

                //Update all original invoices
                for (let i = 0; i < reduceValuesInput.length; i++) {
                    const currectInputInv = JSON.parse(reduceValuesInput[i]);


                    record.submitFields({
                        type: 'invoice',
                        id: currectInputInv.tranid,
                        values: {
                            custbody_tvz_2575_art_fin_chrg: newFinChrgInvID,
                            custbody_tvz_2575_art_excld_fc: true
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                            disableTriggers: true
                        }
                    })
                }
                //Create PDF
                const finChargePrintForm = finChargeConfLookUp.custrecord_tvz_2575_art_print_pdf_form[0].value;
                localGenerateFinChargeInvPDF(newFinChrgInvID, finChargePrintForm)

                //   renderInvoiceWithTemplate(newFinChrgInvID, finChargePrintTmpl) // generated file is broken


                //Send Emails
                const finChargeEmailTmpl = finChargeConfLookUp.custrecord_tvz_2575_art_email_template[0].value;
                const finChargeEmailSender = finChargeConfLookUp.custrecord_tvz_2575_art_email_sender[0].value;

                localGenerateFinChargeInvEmail(newFinChrgInvID, finChargeEmailTmpl, finChargeEmailSender, reduceKeysInput.customer)

                reduceContext.write({
                    key: finChargeConfID,
                    value: ''
                })

                _lib.logGovernanceUsageRemaining('REDUCE end');

            } catch (e) {

                log.error('ERROR', e.message + '--- ' + e.stack);


            }

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            try {

                log.audit('ART|TVZ', '--- Summary  stage ---');

                let processedFinChargeConfID = [];

                summaryContext.output.iterator().each(function (key, value) {

                    log.debug('ART|TVZ', '--- symmary key ---' + key);
                    let finChargeConfID = JSON.parse(key)
                    // customerCBS.providerCBS = value

                    processedFinChargeConfID.push(JSON.stringify(finChargeConfID))
                    return true;
                });


                // processedFinChargeConfID = removeDuplicates(processedFinChargeConfID);
                //
                // processedFinChargeConfID = parseInt(processedFinChargeConfID[0]);
                //
                // log.debug('ART|TVZ', '--- processedFinChargeConfID ---' + processedFinChargeConfID);
                //
                // if (processedFinChargeConfID) {
                //     record.submitFields({
                //         type: 'customrecord_tvz_2575_art_config',
                //         id: processedFinChargeConfID,
                //         values: {
                //             custrecord_tvz_2575_art_last_run: new Date(),
                //         },
                //         options: {
                //             enableSourcing: false,
                //             ignoreMandatoryFields: true,
                //             disableTriggers: true
                //         }
                //     });
                //
                //     log.debug('ART|TVZ', 'Finance Charge Configuration with ID=' + processedFinChargeConfID + ' has been processed');


                // Find next [Finance Charge Configuration] record which this Map/Reduce script to be run:
                const sqlQueryNextFCC = `select id
                                         from customrecord_tvz_2575_art_config
                                         where isinactive = 'F'
                                             -- and id!= ${processedFinChargeConfID}
                                           and (custrecord_tvz_2575_art_last_run is null
                                             OR trunc(custrecord_tvz_2575_art_last_run)!='${SYSDATE}')
                                           and rownum = 1`

                const queryResultsNextFCC = query.runSuiteQL({
                    query: sqlQueryNextFCC
                });

                const resultSetNextFCC = queryResultsNextFCC.asMappedResults();


                if (resultSetNextFCC.length > 0) {

                    const nextFCCid = resultSetNextFCC[0].id

                    log.debug('ART|TVZ', 'nextFCCid: ' + nextFCCid);

                    if (nextFCCid) {
                        try {
                            log.debug('ART|TVZ', 'The same M/R script is called with next [Finance Charge Configuration] with id: ' + nextFCCid);

                            var mrTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                            mrTask.scriptId = 'customscript_tvz_2575_art_fin_chrg_mr';
                            mrTask.deploymentId = 'customdeploy_tvz_2575_art_fin_chrg_mr_mn';


                            var mrTaskId = mrTask.submit()

                            log.debug('ART|TVZ', '--- M/R  [customscript_tvz_2575_art_fin_chrg_mr] has been called again!');
                        } catch (e) {
                            log.error('ERROR', e.message + '--- ' + e.stack);
                        }
                    } else {
                        log.debug('ART|TVZ', 'There are no other [Finance Charge Configuration] for processing.');
                    }
                } else {
                    log.debug('ART|TVZ', 'There are no other [Finance Charge Configuration] for processing.');
                }
                //  }

                _lib.logGovernanceUsageRemaining('SUMMARY end');
            } catch (e) {
                log.error('ERROR', e.message + '--- ' + e.stack);
            }
        }

        function removeDuplicates(arr) {
            let unique = [];
            arr.forEach(element => {
                if (!unique.includes(element)) {
                    unique.push(element);
                }
            });
            return unique;
        }

        function convertTZ(date, tzString) {
            return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));
        }

        function localDateEpoch(date) { //date= 2025-11-21

            let currentDate = convertTZ(date, NETSUITE_ACCOUNT_TIME_ZONE)  //currentDate = Fri Nov 21 2025 01:00:00 GMT-0800 (PST)
            currentDate = new Date(currentDate) // currentDate = Fri Nov 21 2025 00:00:00 GMT-0800 (PST)
            currentDate = currentDate.setHours(0, 0, 0, 0); // currentDate = 1763712000000

            return currentDate
        }

        function truncDate(date) {

            let currentDate = localDateEpoch(date)
            currentDate = new Date(currentDate)
            // currentDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
            currentDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`

            return currentDate
        }

        function getPaymentDate(invoiceID) {
            try {
                const sql = `select t.id,
                                    max(ntl.nextdate) as last_payment_date,
                                    min(ntl.nextdate) as first_payment_date
                             from transaction t
                                      join transactionstatus s on s.id = t.status and s.trantype = t.type
                                      join NextTransactionLineLink ntl
                                           on ntl.previousdoc = t.id and ntl.linktype in (${PAYMENT_LINK_TYPE})
                             where t.id = ${invoiceID}
                               and s.name = ${INVOICE_STATUS}
                             group by t.id`

                const queryResults = query.runSuiteQL({
                    query: sql
                });

                const resultSet = queryResults.asMappedResults();

                if (resultSet.length == 1) {
                    return resultSet[0].last_payment_date
                } else {
                    return []
                }
            } catch (e) {
                log.error('ERROR (GET)', e.message + ' --- ' + e.stack);
            }
        }

        function applyTemplate(template, data) {
            return template.replace(/\$\{(\w+)\}/g, function (match, key) {
                return data[key] !== undefined ? data[key] : match;
            });
        }

        function renderInvoiceWithTemplate(invoiceId, templateId) {

            // Load invoice
            const inv = record.load({
                type: record.Type.INVOICE,
                id: invoiceId
            });

            // Load the PDF template (from Advanced PDF/HTML Template record)
            const templateFile = file.load({
                id: templateId
            });

            // Prepare renderer
            const renderer = render.create();
            renderer.templateContent = templateFile.getContents();

            // Pass the invoice to the template
            renderer.addRecord('record', inv);

            // Render final PDF
            const pdfFile = renderer.renderAsPdf();
            pdfFile.name = `finance_charge_invoice_TEST_${invoiceId}.pdf`;
            pdfFile.folder = FIN_CHARGE_INV_FILE_FOLDER;

            // Save PDF into File Cabinet
            const fileId = pdfFile.save();

            log.audit('ART|TVZ', 'renderInvoiceWithTemplate PDF id: ' + fileId);

            // Attach to invoice custom field
            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: {
                    custbody_tvz_2575_art_fci_pdf: fileId
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                    disableTriggers: true
                }
            });


        }

        function localGenerateFinChargeInvPDF(invoiceId, formidInput) {
            try {
                log.debug('ART|TVZ', 'localGenerateFinChargeInvPDF for invoice :   ' + invoiceId + ' & formid --- ' + formidInput);

                const formid = parseInt(formidInput);

                let FinChargeInvPDFFile = render.transaction({
                    entityId: invoiceId,
                    printMode: render.PrintMode.PDF,
                    formId: formid
                });

                FinChargeInvPDFFile.name = `finance_charge_invoice_${invoiceId}.pdf`;
                FinChargeInvPDFFile.folder = FIN_CHARGE_INV_FILE_FOLDER;

                var FinChargeInvPDFFileID = FinChargeInvPDFFile.save()
                log.audit('ART|TVZ', 'localGenerateFinChargeInvPDF generates :   ' + FinChargeInvPDFFileID);

                _lib.logGovernanceUsageRemaining('local function end');

                record.submitFields({
                    type: record.Type.INVOICE,
                    id: invoiceId,
                    values: {
                        custbody_tvz_2575_art_fci_pdf: FinChargeInvPDFFileID
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        disableTriggers: true
                    }
                });

            } catch (e) {
                log.error('ERROR (GET)', e.message + ' --- ' + e.stack);
            }
        }

        function localGenerateFinChargeInvEmail(invoiceId, emailTemplId, senderIdInput, receiverId) {

            try {
                log.debug('TVZ --', 'localGenerateFinChargeInvEmail for invoice: ' + invoiceId + ' emailTemplID: ' + emailTemplId + ' Sender: ' + senderIdInput + ' receiverId: ' + receiverId);

                const senderId = parseInt(senderIdInput);

                // TVZ--: Merge email template with current data
                const mergeEmailResult = render.mergeEmail({
                    templateId: emailTemplId,
                    transactionId: invoiceId,
                    entity: {
                        type: 'employee',
                        id: senderId
                    },
                });

                // TVZ--: Send Email
                if (receiverId && senderId) {

                    email.send({
                        author: senderId,
                        recipients: receiverId,
                        //!* or pass directly an employee id! For multiple recipients, use an array of internal IDs or email addresses. You can use an array that contains a combination of internal IDs and email addresses.*!/
                        subject: mergeEmailResult.subject,
                        body: mergeEmailResult.body,
                        // attachments:
                        //     [recPDFfile],
                        relatedRecords: {
                            transactionId: invoiceId
                        }
                    })
                    log.audit('ART|TVZ', 'email sent to : ' + receiverId + ' for invocie with id=' + invoiceId);


                } else {
                    log.error('ART|TVZ', 'Missing E-mail recipient or sender!');
                }

            } catch (e) {
                log.error('ERROR', e.message + ' --- ' + e.stack);
            }
        }

        function updateOrgInvoice(invoiceID, failedReason) {
            try {
                record.submitFields({
                    type: 'invoice',
                    id: invoiceID,
                    values: {
                        custbody_tvz_2575_art_ffc_failed_rsn: failedReason,
                        custbody_tvz_2575_art_excld_fc: true
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                        disableTriggers: true
                    }
                })
            } catch (e) {
                log.error('ERROR (GET)', e.message + ' --- ' + e.stack);
            }
        }


        return {
            getInputData,
            map,
            reduce,
            summarize
        }

    }
)
