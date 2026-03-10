sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./services",
	"./configuration",
	"./dataformatter",
	"./headerHelper"
], function (Filter, FilterOperator, Services, Config, Formatter, HeaderHelper) {
	"use strict";
	var utility = ("nus.edu.sg.coireport.utils.utility", {

		_headerToken: function (component) {
			var token = component.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token,
				"Content-Type": "application/json"
			};
			return oHeaders;
		},
		_handleOpenFragment: function (component, fragmentName, fragId, sDialogTab) {
			component._oDialog = null;
			component._oDialog = undefined;
			if (!component._oDialog) {
				component._oDialog = sap.ui.xmlfragment(fragId,
					fragmentName, component);
				component.getView().addDependent(component._oDialog);
			}
			if (sDialogTab) {
				component._oDialog.open(sDialogTab);
			} else {
				component._oDialog.open();
			}

		},

		_fnLookupFilter: function (property, value) {
			var aFilter = [];
			aFilter.push(new Filter(property, FilterOperator.EQ, value));
			return aFilter;
		},

		retrieveLocations: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"LOCATION"),
				function (oData) {
					component.AppModel.setProperty("/locations", oData.results);
				}.bind(this));
		},
		retrieveWorkTypes: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"WORK_TYPE"),
				function (oData) {
					component.AppModel.setProperty("/workTypes", oData.results);
				}.bind(this));
		},

		retrieveUnitType: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"UNIT_TYPE"),
				function (oData) {
					component.AppModel.setProperty("/unitTypes", oData.results);
				}.bind(this));
		},

		retrieveLevyDetails: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			var aFilters = [];
			aFilters.push([new Filter("REFERENCE_KEY", FilterOperator.EQ, "EXT_LEVY"),
				new Filter("REFERENCE_KEY", FilterOperator.EQ, "INT_LEVY")
			]);
			oCatalogSrvModel.read(Config.dbOperations.cwsAppConfigs, {
				filters: aFilters,
				success: function (oData) {
					if (oData) {
						component.AppModel.setProperty("/levyList", oData.results);
					}
				}.bind(component),
				error: function (oError) {}
			});

		},

		retrieveRemunerationType: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"REMUNERATION_TYPE"),
				function (oData) {
					component.AppModel.setProperty("/remunerationList", oData.results);
				}.bind(component));
		},

		retrieveWaivers: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY", "WAIVER"),
				function (oData) {
					component.AppModel.setProperty("/waiverList", oData.results);
				}.bind(component));
		},

		retrieveSubmission: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"SUBMISSION_TYPE"),
				function (oData) {
					component.AppModel.setProperty("/submission", oData.results);
				}.bind(component));
		},
		retrieveSuccessRuns: function (component) {
			var oHeaders = this._headerToken(component);
			Services._loadDataUsingJsonModel(Config.dbOperations.syncRunReport, null, "GET", oHeaders, function (oData) {
				component.AppModel.setProperty("/lastSyncResults", oData.getSource().getData().syncResults);
			}.bind(component));
		},

		retrieveStatus: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.statusConfigs, oCatalogSrvModel, component, this._fnLookupFilter("STATUS_TYPE",
					"OPWN"),
				function (oData) {
					component.AppModel.setProperty("/opwnStatus", oData.results);
				}.bind(component));
		},

		retrievePaymentType: function (component) {
			var oCatalogSrvModel = component.getComponentModel("CatalogSrvModel");
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, component, this._fnLookupFilter("REFERENCE_KEY",
					"PAYMENT_TYPE"),
				function (oData) {
					component.AppModel.setProperty("/paymentType", oData.results);
				}.bind(component));
		},
		/**
		 * Generate OPWN Excel Records
		 */
		generateOpwnExcelRecordsForSyncReports: function (dataArray, listOfMonths) {
			var spreadsheetData = dataArray.flatMap(data => {
				const baseData = {
					"STAFF_ID": data.STAFF_ID,
					"FULL_NM": data.FULL_NM,
					"ULU_C": data.ULU_C,
					"ULU_T": data.ULU_T,
					"FDLU_C": data.FDLU_C,
					"FDLU_T": data.FDLU_T,
					"REQUEST_ID": data.REQUEST_ID,
					"SUBMISSION_TYPE": data.SUBMISSION_TYPE_T,
					"PROCESS_TITLE": data.PROCESS_TITLE,
					"REQUEST_TYPE": data.REQUEST_TYPE,
					"SUB_TYPE_T": data.SUB_TYPE_T,
					"AMOUNT_S": data.AMOUNT_PAYABLE,
					"START_DATE": Formatter.formatDateAsString(data.START_DATE, "dd Mmm yyyy", false, listOfMonths),
					"END_DATE": Formatter.formatDateAsString(data.END_DATE, "dd Mmm yyyy", false, listOfMonths),
					"DURATION_DAYS": data.DURATION_DAYS,
					"ENG_ULU_T": data.ENG_ULU_T,
					"ENG_FDLU_T": data.ENG_FDLU_T,
					"PROGRAM_NAME": data.PROGRAM_NAME,
					"LOCATION": data.LOCATION_T,
					"WORK_DETAILS": data.WORK_DETAILS,
					"PROPERTY_USAGE": data.PROPERTY_USAGE_T,
					"IS_WAIVED": data.IS_WAIVED === 'Y' ? 'Yes' : 'No',
					"TOTAL_AMOUNT": data.AMOUNT,
					"SUBMITTED_ON_TS": Formatter.formatDateAsString(data.SUBMITTED_ON_TS, "dd Mmm yyyy", false, listOfMonths),
					"SUBMITTED_BY_FULLNAME": data.SUBMITTED_BY_FULLNAME,
					"STATUS_ALIAS": data.REQUEST_STATUS_ALIAS,
					"APPROVED_BY_FULL_NAME": data.APPROVED_BY_FULL_NAME,
					"APPROVED_ON": Formatter.formatDateAsString(data.APPROVED_ON, "dd Mmm yyyy", false, listOfMonths),
					"MODIFIED_ON": (data.MIGRATED) ? Formatter.formatDateAsString(data.SUBMITTED_ON_TS, "dd Mmm yyyy", false, listOfMonths) : (
						data.REQUEST_STATUS === "38" || data.REQUEST_STATUS === "48") ? Formatter.formatDateAsString(data.MODIFIED_ON, "dd Mmm yyyy",
						false, listOfMonths) : "",
					"MODIFIED_BY": (data.MIGRATED) ? data.SUBMITTED_BY_FULLNAME : (data.REQUEST_STATUS === "38" || data.REQUEST_STATUS === "48") ?
						data.MODIFIED_BY_FULLNAME : "",
					"WBS": data.AMENDED_WBS,
					"VALUE": data.AMENDED_ALLOT_VAL,
					"MONTH": listOfMonths[Number(data.MONTH) - 1].substring(0, 3) + "-" + data.YEAR,
					"AMOUNT": data.AMOUNT_PAYABLE,
					"STATUS": data.PAYMENT_REQ_STATUS_ALIAS,
					"PAYMENT_TYPE": data.PAYMENT_TYPE_ALIAS,
					"BALANCE_AMOUNT": data.BALANCE_AMOUNT,
					"PAID_AMOUNT": data.PAID_AMOUNT
						// "PAYMENT_ID": data.PAYMENT_ID.slice(4) //Added payment_id for sorting
				};

				return [baseData];
			});

			return spreadsheetData.flat();
		},
		/**
		 * Generate CWS NED Excel Records
		 */
		generateCwsNedExcelRecordsForSyncReports: function (dataArray, listOfMonths) {
			var spreadsheetData = dataArray.flatMap(data => {
				const baseData = {
					"STAFF_ID": data.STAFF_ID,
					"FULL_NM": data.FULL_NM,
					"ULU_C": data.ULU_C,
					"ULU_T": data.ULU_T,
					"FDLU_C": data.FDLU_C,
					"FDLU_T": data.FDLU_T,
					"REQUEST_ID": data.REQUEST_ID,
					"SUBMISSION_TYPE": data.SUBMISSION_TYPE_T,
					"PROCESS_TITLE": data.PROCESS_TITLE,
					"REQUEST_TYPE": data.REQUEST_TYPE,
					"SUB_TYPE_T": data.SUB_TYPE_T,
					"START_DATE": Formatter.formatDateAsString(data.START_DATE, "dd Mmm yyyy", false, listOfMonths),
					"END_DATE": Formatter.formatDateAsString(data.END_DATE, "dd Mmm yyyy", false, listOfMonths),
					"DURATION_DAYS": data.DURATION_DAYS,
					"CLIENT_NAME": data.CLIENT_NAME,
					"LOCATION": data.LOCATION_T,
					"WORK_HOURS": data.WORK_HOURS,
					"TIME_OFF_REQD": data.TIME_OFF_REQD,
					"WORK_DETAILS": data.WORK_DETAILS,
					"PROPERTY_USAGE": data.PROPERTY_USAGE_T,
					"PROPERTY_DETAILS": data.PROPERTY_DETAILS,
					"SUBMITTED_ON_TS": Formatter.formatDateAsString(data.SUBMITTED_ON_TS, "dd Mmm yyyy", false, listOfMonths),
					"SUBMITTED_BY_FULLNAME": data.SUBMITTED_BY_FULLNAME,
					"STATUS_ALIAS": data.REQUEST_STATUS_ALIAS,
					"APPROVED_BY_FULL_NAME": data.APPROVED_BY_FULL_NAME,
					"APPROVED_ON": Formatter.formatDateAsString(data.APPROVED_ON, "dd Mmm yyyy", false, listOfMonths),
					"OFFLINE_APPROVAL": data.OFFLINE_APPROVAL,
					"MODIFIED_ON": (data.MIGRATED) ? Formatter.formatDateAsString(data.SUBMITTED_ON_TS, "dd Mmm yyyy", false, listOfMonths) : (
						data.REQUEST_STATUS === "38" || data.REQUEST_STATUS ===
						"48") ? Formatter.formatDateAsString(data.MODIFIED_ON, "dd Mmm yyyy", false, listOfMonths) : "",
					"MODIFIED_BY": (data.MIGRATED) ? data.SUBMITTED_BY_FULLNAME : (data.REQUEST_STATUS === "38" || data.REQUEST_STATUS === "48") ?
						data.MODIFIED_BY_FULLNAME : "",
					"YEAR": data.PAYMENT_TYPE === 'A' ? data.YEAR : '',
					"REMUNERATION_TYPE": data.PAYMENT_TYPE === 'A' ? data.REMUNERATION_TYPE_T : '',
					"CURRENCY": data.PAYMENT_TYPE === 'A' ? data.PAYMENT_CURRENCY : '',
					"AMOUNT": data.PAYMENT_TYPE === 'A' ? data.AMOUNT : '',
					"AGREED_QNTY": data.PAYMENT_TYPE === 'A' ? (data.STOCK_OPTION_QNTY ? data.STOCK_OPTION_QNTY : (data.STOCK_QNTY ?
						data.STOCK_QNTY : (data.SHARES ? data.SHARES : ""))) : "",
					"UNIT_TYPE": data.PAYMENT_TYPE === 'A' ? data.UNIT_TYPE_T : "",
					"DESCRIPTION": data.PAYMENT_TYPE === 'A' ? data.DESCRIPTION : '',
					"BIZ_EXP_AMT": data.BIZ_EXP_AMT,
					"LEVY_AMOUNT": data.LEVY_AMOUNT,
					"IS_WAIVED": data.IS_PYMT_WAIVED === 'Y' ? 'Yes' : 'No',
					"R_DESCRIPTION": data.PAYMENT_TYPE === 'R' ? data.DESCRIPTION : '',
					"R_AMOUNT": data.PAYMENT_TYPE === 'R' ? data.AMOUNT : '',
					"R_CURRENCY": data.PAYMENT_TYPE === 'R' ? data.PAYMENT_CURRENCY : '',
					"R_YEAR": data.PAYMENT_TYPE === 'R' ? data.YEAR : '',
					"R_QTY": data.PAYMENT_TYPE === 'R' ? (data.STOCK_OPTION_QNTY ? data.STOCK_OPTION_QNTY : (data.STOCK_QNTY ?
						data.STOCK_QNTY : (data.SHARES ? data.SHARES : ""))) : "",
					"R_REMUNERATION_TYPE": data.PAYMENT_TYPE === 'R' ? data.REMUNERATION_TYPE_T : '',
					"PAYMENT_REF_NO": data.PAYMENT_REF_NO,
					"PAYMENT_DATE": Formatter.formatDateAsString(data.PAYMENT_DATE_CAL, "dd Mmm yyyy", false, listOfMonths),
					"INVOICE_NO": data.PAYMENT_TYPE === 'R' ? data.INVOICE_NO : "",
					"LEVY_STATUS": data.PAYMENT_TYPE === 'R' ? Formatter.displayLevyStatus(data.IS_PYMT_WAIVED, data.INVOICE_NO,
						data.CLR_DOC_NO) : "",
					"R_UNIT_TYPE": data.PAYMENT_TYPE === 'R' ? data.UNIT_TYPE_T : "",
					"PAYMENT_ID": data.PAYMENT_ID.slice(4) //Added payment_id for sorting
				};

				return [baseData];
			});
			return spreadsheetData.flat();
		}
	});
	return utility;
}, true);