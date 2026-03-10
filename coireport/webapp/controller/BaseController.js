sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"nus/edu/sg/coireport/utils/services",
	"nus/edu/sg/coireport/utils/appconstant",
	"nus/edu/sg/coireport/utils/utility",
	"nus/edu/sg/coireport/utils/configuration",
	"sap/ui/model/odata/v2/ODataModel", "nus/edu/sg/coireport/utils/dataformatter", "sap/ui/core/Fragment",
	"sap/ui/export/library"
], function (Controller, Filter, FilterOperator, JSONModel, Services, AppConstant, Utility, config, ODataModel, Formatter, Fragment,
	exportLibrary) {
	"use strict";
	var EdmType = exportLibrary.EdmType;

	return Controller.extend("nus.edu.sg.coireport.controller.BaseController", {

		initializeModel: function () {
			this.getView().setBusy(true);
			var oAppModel = this.setComponentModel("AppModel");
			oAppModel.setData(AppConstant);
			oAppModel.setProperty("/extractionType", (oAppModel.getProperty("/offlineReportAccess")) ? this.getI18n(
				"coireport.ExtractionType.LiveProp") : "");
			this.AppModel = oAppModel;
			this.getUserDetails();
		},
		getUserDetails: async function () {
			await Services.getUserInfoDetails(
				this,
				async function (userData) {
					var oRetData = userData.getUserDetails;
					if (oRetData && oRetData.staffInfo && oRetData.staffInfo.primaryAssignment && oRetData.staffInfo.primaryAssignment.STF_NUMBER) {
						this.AppModel.setProperty("/loggedInUserInfo/userName", oRetData.staffInfo.primaryAssignment.STF_NUMBER);
						this.AppModel.setProperty("/oPrimaryData", oRetData);

						var aMatrixData = this.AppModel.getProperty("/oPrimaryData/staffInfo/inboxApproverMatrix"),
							aProcessCode = [];
						aMatrixData.forEach(function (oMatrixData) {
							if (oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN") {
								aProcessCode.push(oMatrixData.PROCESS_CODE);
							}
						});
						this.AppModel.setProperty("/cwVisible", aMatrixData.some(oMatrixData =>
							oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN" &&
							(oMatrixData.PROCESS_CODE === "201" || oMatrixData.PROCESS_CODE === "202" || oMatrixData.PROCESS_CODE === "204")));
						this.AppModel.setProperty("/opwnVisible", aMatrixData.some(oMatrixData =>
							oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN" &&
							(oMatrixData.PROCESS_CODE === "203")));
						// this._fnLoadMetaData();
					}
					await this.retrieveAllLookups();
				}.bind(this)
			);
		},
		// generateTokenForLoggedInUser: function () {
		// 	services.fetchLoggedUserToken(this, function (oRetData) {
		// 		// this.AppModel.setProperty("/token", oRetData.token);
		// 		this.AppModel.setProperty("/loggedInUserInfo/userName", oRetData.staffInfo.primaryAssignment.STF_NUMBER);
		// 		this.AppModel.setProperty("/oPrimaryData", oRetData);

		// 		var aMatrixData = this.AppModel.getProperty("/oPrimaryData/staffInfo/inboxApproverMatrix"),
		// 			aProcessCode = [];
		// 		aMatrixData.forEach(function (oMatrixData) {
		// 			if (oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN") {
		// 				aProcessCode.push(oMatrixData.PROCESS_CODE);
		// 			}
		// 		});
		// 		this.AppModel.setProperty("/cwVisible", aMatrixData.some(oMatrixData =>
		// 			oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN" &&
		// 			(oMatrixData.PROCESS_CODE === "201" || oMatrixData.PROCESS_CODE === "202" || oMatrixData.PROCESS_CODE === "204")));
		// 		this.AppModel.setProperty("/opwnVisible", aMatrixData.some(oMatrixData =>
		// 			oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN" &&
		// 			(oMatrixData.PROCESS_CODE === "203")));
		// 		this._fnLoadMetaData();
		// 	}.bind(this));
		// },
		retrieveAllLookups: async function () {
			this.onClear();
			Utility.retrieveLocations(this);
			Utility.retrieveWorkTypes(this);
			Utility.retrieveUnitType(this);
			Utility.retrieveLevyDetails(this);
			Utility.retrieveRemunerationType(this);
			Utility.retrieveWaivers(this);
			Utility.retrieveSubmission(this);
			Utility.retrieveSuccessRuns(this);
			Utility.retrieveStatus(this);
			Utility.retrievePaymentType(this);
			this.onSearch();
			this.getView().setBusy(false);
		},
		// _fnLoadMetaData: function () {
		// 	var serviceName = config.dbOperations.metadataClaims;
		// 	var token = this.AppModel.getProperty("/token");
		// 	var oHeaders = {
		// 		"Accept": "application/json",
		// 		"Authorization": "Bearer" + " " + token
		// 	};

		// 	var oDataModel = new ODataModel({
		// 		serviceUrl: serviceName,
		// 		headers: oHeaders
		// 	});
		// 	oDataModel.setUseBatch(false);
		// 	oDataModel.metadataLoaded().then(function () {
		// 		this.getOwnerComponent().setModel(oDataModel, "CoiReportSrvModel");
		// 		this.onClear();
		// 		Utility.retrieveLocations(this);
		// 		Utility.retrieveWorkTypes(this);
		// 		Utility.retrieveUnitType(this);
		// 		Utility.retrieveLevyDetails(this);
		// 		Utility.retrieveRemunerationType(this);
		// 		Utility.retrieveWaivers(this);
		// 		Utility.retrieveSubmission(this);
		// 		Utility.retrieveSuccessRuns(this);
		// 		Utility.retrieveStatus(this);
		// 		Utility.retrievePaymentType(this);
		// 		this.onSearch();
		// 		this.getView().setBusy(false);
		// 	}.bind(this));
		// },

		getComponentModel: function (modelName) {
			var model = (modelName) ? this.getOwnerComponent().getModel(modelName) : this.getOwnerComponent().getModel();
			return model;
		},
		setComponentModel: function (modelName) {
			var model = (modelName) ? this.getOwnerComponent().setModel(new JSONModel(), modelName) : null;
			return this.getOwnerComponent().getModel(modelName);
		},
		handleRefresh: function () {
			this.getOwnerComponent().getInitialDataForUser();
		},

		// Filter Month and Year from the payment details

		fnFilterPaymentMonth: function (dataArray, targetDates) {
			return dataArray.filter(item => {
				var itemDate = `${item.MONTH}/${item.YEAR}`;
				return targetDates.includes(itemDate);
			});
		},

		getI18n: function (sTextField) {
			var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var i18nTextValue = oResourceBundle.getText(sTextField);
			return i18nTextValue ? i18nTextValue : sTextField;
		},
		_fnULUgeneratefilter: function (param) {
			var oLogData = this.AppModel.getProperty("/oPrimaryData/staffInfo");
			var oClaimType = this.AppModel.getProperty("/claimRequest/claimTypeList");
			var aFilters, dynamicFilters = [],
				key = "",
				ULUkey = "",
				FDLUkey = "";
			if (oClaimType && oClaimType.length > 0) {
				ULUkey = oClaimType[0].CONFIG_KEY === "OPWN" ? "ULU" : "ULU_C";
				FDLUkey = oClaimType[0].CONFIG_KEY === "OPWN" ? "FDLU" : "FDLU_C";
			}
			for (var i = 0; i < oLogData.inboxApproverMatrix.length; i++) {
				aFilters = [];
				if (oLogData.inboxApproverMatrix[i].ULU_C !== "ALL" && oLogData.inboxApproverMatrix[i].STAFF_USER_GRP === "ORMD_ADMIN") {
					aFilters.push(new Filter(ULUkey, FilterOperator.EQ, oLogData.inboxApproverMatrix[i].ULU_C));
				}

				if (oLogData.inboxApproverMatrix[i].FDLU_C !== "ALL" && oLogData.inboxApproverMatrix[i].STAFF_USER_GRP === "ORMD_ADMIN") {
					aFilters.push(new Filter(FDLUkey, FilterOperator.EQ, oLogData.inboxApproverMatrix[i].FDLU_C));
				}

				if (aFilters.length > 0)
					dynamicFilters.push(new Filter(aFilters, true));
			}
			return dynamicFilters;
		},
		/*
		 * Set Busy Indicators
		 */
		loadBusyIndicator: function (content, isBusy) {
			var pageContent = this.getView().byId(content);
			pageContent = (pageContent) ? pageContent : sap.ui.getCore().byId(content);
			pageContent.setBusy(isBusy);
		},
		/**
		 * Fetch control
		 */
		getUIControl: function (id, fragmentId) {
			var view = this.getView();
			var control = (fragmentId) ? Fragment.byId(fragmentId, id) : (view.byId(id)) ? view.byId(id) : sap.ui.getCore().byId(id);
			return control;
		},
		_convertToUTC: function (o) {
			if (!o) {
				return o;
			}
			var _ = new Date(o.getTime());
			_.setMinutes(_.getMinutes() - o.getTimezoneOffset());
			return _;
		},

		displayMonth: function (month, year) {
			var monthNames = [
				"Jan", "Feb", "Mar", "Apr",
				"May", "Jun", "Jul", "Aug",
				"Sep", "Oct", "Nov", "Dec"
			];
			var i = Number(month - 1);
			return monthNames[i] + "-" + year;
		},

		showBusyIndicator: function (milliseconds) {
			var delay = milliseconds || 0;
			sap.ui.core.BusyIndicator.show(delay);
		},

		hideBusyIndicator: function () {
			sap.ui.core.BusyIndicator.hide();
		},

		createColumnConfig: function () {
			return [{
				label: "Staff Id",
				property: 'STAFF_ID',
			}, {
				label: 'Staff Name',
				width: "40%",
				property: 'FULL_NM'
			}, {
				label: "ULU Name",
				property: 'ULU_T',
				type: EdmType.String
			}, {
				label: "FDLU Name",
				property: 'FDLU_T',
				type: EdmType.String
			}, {
				label: "Request ID",
				property: 'REQUEST_ID',
				type: EdmType.String
			}, {
				label: "Submission Type",
				property: 'SUBMISSION_TYPE',
				type: EdmType.String
			}, {
				label: "Request Type",
				property: 'PROCESS_TITLE',
				type: EdmType.String
			}, {
				label: "Sub Type",
				property: 'SUB_TYPE_T',
				type: EdmType.String
			}, {
				label: "Start Date",
				property: 'START_DATE',
				type: EdmType.Date,
				format: 'dd mmm, yyyy'
			}, {
				label: "End Date",
				property: 'END_DATE',
				type: EdmType.Date,
				format: 'dd mmm, yyyy'
			}, {
				label: "Actual Days",
				property: 'DURATION_DAYS',
				type: EdmType.String
			}, {
				label: "Client Name",
				property: 'CLIENT_NAME'
			}, {
				label: "Client Location",
				property: 'CLIENT_LOCATION',
				type: EdmType.String
			}, {
				label: "Details of Work",
				type: EdmType.String,
				property: 'WORK_DETAILS'
			}, {
				label: "Agreed Payment - Year",
				type: EdmType.String,
				width: "50%",
				property: 'YEAR'
			}, {
				label: "Agreed Payment - Remuneration Type",
				type: EdmType.String,
				width: "50%",
				property: 'REMUNERATION_TYPE'
			}, {
				label: "Agreed Payment - Currency",
				type: EdmType.String,
				width: "50%",
				property: 'CURRENCY'
			}, {
				label: "Agreed Payment - Amount",
				type: EdmType.String,
				property: 'AMOUNT'
			}, {
				label: "Agreed Payment - Stock / Shares",
				width: "25%",
				property: "AGREED_QNTY" // P2A021 - Changes
			}, {
				label: "Agreed Payment - Unit Type for Stock / Shares",
				width: "25%",
				property: 'UNIT_TYPE' // P2A021 - Changes
			}, {
				label: "Agreed Payment - Description",
				type: EdmType.String,
				property: 'DESCRIPTION'
			}, {
				label: "Agreed Payment - Business Expense Currency",
				type: EdmType.String,
				property: 'CURRENCY'
			}, {
				label: "Business Expense Amount",
				property: 'BIZ_EXP_AMT'
			}, {
				label: "Received Payment Currency",
				property: 'R_CURRENCY'
			}, {
				label: "Received Payment Amount",
				property: 'R_AMOUNT'
			}, {
				label: "Received Payment - Unit Type for Stock/Shares",
				type: EdmType.String,
				property: 'R_UNIT_TYPE'
			}, {
				label: "Received Payment - Description",
				type: EdmType.String,
				property: 'R_DESCRIPTION'
			}, {
				label: "Levy Amount",
				type: EdmType.String,
				property: 'LEVY_AMOUNT'
			}, {
				label: "Waiver",
				property: 'IS_WAIVED'
			}, {
				label: "Received Payment - Payment Reference No.",
				type: EdmType.String,
				property: 'PAYMENT_REF_NO'
			}, {
				label: "Received Payment - Payment Date",
				type: EdmType.String,
				property: 'PAYMENT_DATE'
			}, {
				label: "Levy Status",
				property: 'LEVY_STATUS',
				width: "40%"
			}, {
				label: "Levy Invoice No.",
				property: 'INVOICE_NO'
			}, {
				label: "Request Status",
				type: EdmType.String,
				property: 'STATUS_ALIAS'
			}];
		},

		createColumnConfigOPWN: function () {

			return [{
				label: "Staff ID",
				property: 'STAFF_ID',
			}, {
				label: 'Staff Name',
				width: "40%",
				property: 'FULL_NM'
			}, {
				label: "ULU Name",
				property: 'ULU_T',
				type: EdmType.String
			}, {
				label: "FDLU Name",
				property: 'FDLU_T',
				type: EdmType.String
			}, {
				label: "Request ID",
				property: 'REQUEST_ID',
				type: EdmType.String
			}, {
				label: "Submission Type",
				property: 'SUBMISSION_TYPE'
			}, {
				label: 'Request Type',
				property: 'PROCESS_TITLE'
			}, {
				label: "Sub Type",
				property: 'SUB_TYPE_T',
				type: EdmType.String
			}, {
				label: "Amount Payable to Staff",
				property: 'AMOUNT_S',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "Start Date",
				property: 'START_DATE',
				type: EdmType.Date,
				format: 'dd mmm, yyyy'
			}, {
				label: "End Date",
				property: 'END_DATE',
				type: EdmType.Date,
				format: 'dd mmm, yyyy'
			}, {
				label: "Actual Days",
				property: 'DURATION_DAYS',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "ULU of Engaging Department",
				property: 'ENG_ULU_T'
			}, {
				label: "FDLU of Engaging Department",
				type: EdmType.String,
				property: 'ENG_FDLU_T'
			}, {
				label: "Location",
				property: 'CLIENT_LOCATION'
			}, {
				label: "Program Name",
				property: 'PROGRAM_NAME'
			}, {
				label: "Details of Work",
				type: EdmType.String,
				property: 'WORK_DETAILS'
			}, {
				label: "Total Amount",
				property: 'TOTAL_AMOUNT',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "Balance Amount",
				property: 'BALANCE_AMOUNT',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "Paid Amount",
				property: 'PAID_AMOUNT',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "Month",
				type: EdmType.String,
				property: 'MONTH'
			}, {
				label: "Amount",
				property: 'AMOUNT',
				type: EdmType.Number,
				scale: 2
			}, {
				label: "Request Status",
				type: EdmType.String,
				property: 'STATUS_ALIAS'
			}
				//  {
				// 	label: "Admin Fees",
				// 	type: EdmType.String,
				// 	width: "25%",
				// 	property: 'PROPERTY_USAGE'
				// }, {
				// 	label: "Waiver",
				// 	property: 'IS_WAIVED'
				// },
				// {
				// 	label: "Status",
				// 	property: 'STATUS',
				// 	type: EdmType.String
				// }, {
				// 	label: "Payment Type",
				// 	property: 'PAYMENT_TYPE',
				// 	type: EdmType.String
				// }, {
				// 	label: "WBS",
				// 	type: EdmType.String,
				// 	property: 'WBS'
				// }, {
				// 	label: "WBS Percentage",
				// 	type: EdmType.String,
				// 	property: 'VALUE'
				// }, {
				// 	label: "Submitted On",
				// 	property: 'SUBMITTED_ON_TS',
				// 	width: "20%"
				// }, {
				// 	label: "Submitted By",
				// 	property: 'SUBMITTED_BY_FULLNAME',
				// 	type: EdmType.String
				// }, {
				// 	label: "Status",
				// 	property: 'STATUS_ALIAS',
				// 	width: "20%",
				// 	type: EdmType.String
				// }, {
				// 	label: "Approved By",
				// 	property: 'TASK_COMPLETED_FULL_NM',
				// 	type: EdmType.String
				// }, {
				// 	label: "Approved On",
				// 	type: EdmType.Date,
				// 	format: 'dd MMM, yyyy',
				// 	property: 'TASK_ACTUAL_DOC'
				// }
			];

		},

		formatTimestamp: function (timestamp) {

			var jsDate = new Date(timestamp); // Extract timestamp
			var day = jsDate.getDate().toString().padStart(2, '0');
			var month = jsDate.toLocaleString('default', {
				month: 'short'
			});
			var year = jsDate.getFullYear();
			var hours = jsDate.getHours().toString().padStart(2, '0');
			var minutes = jsDate.getMinutes().toString().padStart(2, '0');
			var seconds = jsDate.getSeconds().toString().padStart(2, '0');

			return `${day} ${month}, ${year} ${hours}:${minutes}:${seconds}`;
		}

	});
}, true);