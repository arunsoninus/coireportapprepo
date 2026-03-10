sap.ui.define([
	"../controller/BaseController", "sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"../utils/dataformatter", "sap/m/MessageToast", "sap/m/MessageBox", "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"../utils/utility",
	"../utils/configuration",
	"sap/ui/export/Spreadsheet",
	"sap/ui/export/library",
	"sap/m/Token",
	"../utils/services"

], function (BaseController, Fragment, JSONModel, Formatter, MessageToast, MessageBox, Filter,
	FilterOperator, Sorter, Utility, Config, Spreadsheet, exportLibrary,
	Token, Services) {
	"use strict";
	var EdmType = exportLibrary.EdmType;
	return BaseController.extend("nus.edu.sg.coireport.controller.CoiHome", {
		formatter: Formatter,

		// *****************Controller Methods***************** //
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
			// this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			var oViewModel = new JSONModel(),
				oViewData = {
					"SortCwTable": {
						"sortKey": "",
						"sortDescending": ""
					},
					"GroupCwTable": {
						"groupKey": "",
						"groupDescending": ""
					},
					"SearchProperty": ""
				};
			oViewModel.setData(oViewData);
			this.getView().setModel(oViewModel, "ViewModel");

			this.initializeModel();

			var CoiCwNedTable = this.getView().byId("CoiCwNedRequestsTableId");
			this.oTemplate = CoiCwNedTable.getBindingInfo("items").template;
			CoiCwNedTable.unbindAggregation("items");

			var CoiOpwnTable = this.getView().byId("CoiOpwnRequestsTableId");
			this.oTemplateopwn = CoiOpwnTable.getBindingInfo("items").template;
			CoiOpwnTable.unbindAggregation("items");
		},

		// *****************Lifecycle Methods***************** //
		onUpdateFinished: function (oEvent) {
			var oBinding = oEvent.getSource().getBinding("items");
			var iTotalCount = oBinding.getLength();
			this.AppModel.setProperty("/CWNED_Count", iTotalCount);
		},

		onUpdateFinishedopwn: function (oEvent) {
			var oBinding = oEvent.getSource().getBinding("items");
			var iTotalCount = oBinding.getLength();
			this.AppModel.setProperty("/OPWN_Count", iTotalCount);
		},

		// *****************Event Handling Functions***************** //
		onNavDashBoard: function () {
			sap.ushell.Container.getServiceAsync("Navigation")
				.then(function (oNavigation) {
					oNavigation.navigate({
						target: {
							semanticObject: "cwdashboard",
							action: "Display"
						},
						params: {}
					});
				})
				.catch(function (err) {
					console.error("Dashboard App Navigation failed", err);
				});
			// var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			// var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
			// 	target: {
			// 		semanticObject: "cwdashboard",
			// 		action: "Display"
			// 	},
			// 	params: {}
			// })) || "";
			// oCrossAppNavigator.toExternal({
			// 	target: {
			// 		shellHash: hash
			// 	}
			// });
		},

		onPressGroupRequest: function (oEvent) {
			var sDialogTab = "group";
			var tableSource = oEvent.getSource().getParent().getParent();
			this.grpSortOnTable = (tableSource.getId().includes('CoiOpwnRequestsTableId')) ? "CoiOpwnRequestsTableId" :
				"CoiCwNedRequestsTableId";
			// load asynchronous XML fragment
			if (!this._pViewSettingsDialog) {
				this._pViewSettingsDialog = Fragment.load({
					id: this.getView().getId(),
					name: "nus.edu.sg.coireport.view.subview.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					return oDialog;
				}.bind(this));
			}
			this._pViewSettingsDialog.then(function (oDialog) {
				oDialog.open(sDialogTab);
			});
		},

		handleConfirm: function (oEvent) {
			var oTable = this.getUIControl(this.grpSortOnTable),
				oSelectedSort = oEvent.getParameter("sortItem"),
				sortingMethod = oEvent.getParameter("sortDescending"),
				oSelectedGroup = oEvent.getParameter("groupItem"),
				groupMethod = oEvent.getParameter("groupDescending"),
				// mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				// sPath,
				// bDescending,
				// aSorters = [],
				// vGroup,
				// aGroups = [],
				oViewModel = this.getView().getModel("ViewModel"),
				oSort, oGroup;
			if (oSelectedSort) {
				oSort = {
					sortKey: oSelectedSort.getKey(),
					sortDescending: sortingMethod
				};
			} else {
				oSort = {
					sortKey: "REQ_UNIQUE_ID",
					sortDescending: true
				};
			}
			oViewModel.setProperty("/SortCwTable", oSort);
			this.applySortTable(oBinding, oSort);
			if (oSelectedGroup) {
				oGroup = {
					groupKey: oSelectedGroup.getKey(),
					groupDescending: groupMethod
				};
			} else {
				oGroup = "";
			}
			oViewModel.setProperty("/GroupCwTable", oGroup);
			this.applyGroupTable(oBinding, oGroup);
		},

		// Sort - common function for sort and group - Bug fix - CW0084
		applySortTable: function (oBinding, oSort) {
			var aSorters = [];
			if (oSort) {
				aSorters.push(new Sorter(oSort.sortKey, oSort.sortDescending));
				oBinding.sort(aSorters);
			}
		},

		// Group - common function for sort and group - Bug fix - CW0084
		applyGroupTable: function (oBinding, oGroup) {
			var aGroups = [];
			if (oGroup) {
				aGroups.push(new Sorter(oGroup.groupKey, oGroup.groupDescending, true));
				oBinding.sort(aGroups);
			}
		},

		onPressSortRequest: function (oEvent) {
			var sDialogTab = "sort";
			var tableSource = oEvent.getSource().getParent().getParent();
			this.grpSortOnTable = (tableSource.getId().includes('CoiOpwnRequestsTableId')) ? "CoiOpwnRequestsTableId" :
				"CoiCwNedRequestsTableId";
			// load asynchronous XML fragment
			var fragmentName = "nus.edu.sg.coireport.view.subview.ViewSettingsDialog";
			var fragId = this.getView().getId();
			Utility._handleOpenFragment(this, fragmentName, fragId, sDialogTab);
		},

		onClear: function (oEvent) {
			this.getUIControl("inpRqstTypeValueHelp").removeAllTokens();
			this.getUIControl("inpUluValueHelp").removeAllTokens();
			this.AppModel.setProperty("/claimType", '');
			this.AppModel.setProperty("/claimTypeCode", '');
			this.AppModel.setProperty("/claimRequest/selectedItemsClaimStatus", []);

			this.AppModel.setProperty("/CWNED_Count", "");
			this.AppModel.setProperty("/OPWN_Count", "");
			this.AppModel.setProperty("/requestId", '');
			this.AppModel.setProperty("/uluSelected", '');
			this.AppModel.setProperty("/uluSelectedCode", '');
			this.AppModel.setProperty("/submittedByName", '');
			this.AppModel.setProperty("/submittedById", '');

			this.AppModel.setProperty("/rClaimType", "");
			this.AppModel.setProperty("/rRequestid", "");
			this.AppModel.setProperty("/rulus", "");
		},
		/**
		 * On Press Data Extract 
		 */
		onPressRunReportDataExport: function (oEvent) {
			// this.showBusyIndicator();
			if (this.AppModel.getProperty("/offlineReportAccess") && (this.AppModel.getProperty("/extractionType") === this.getI18n(
				"coireport.ExtractionType.OfflineProp"))) {
				this.onPressProceedToDownloadOfflineReport();
			} else {
				this.onPressProceedToDownloadLiveReport();
			}
		},
		/**
		 * On Press Download Live Report - As-is Design
		 */
		onPressProceedToDownloadLiveReport: function (oEvent) {
			this.showBusyIndicator();
			var oKey = this.AppModel.getProperty("/oTabKey");
			var isPaidRecords = this.AppModel.getProperty("/oPaidMonthstate"),
				oTable = oKey === "opwn" ? this.getUIControl("CoiOpwnRequestsTableId") : this.getUIControl("CoiCwNedRequestsTableId");
			var aFilters = decodeURIComponent(oTable.getBinding("items").sFilterParams);
			aFilters = aFilters.split("=");
			var oDataModel = this.getComponentModel("CoiReportSrvModel"),
				aDownloadFilter = oKey === "opwn" && !isPaidRecords ? aFilters[1] + " and CwsPaymentsDetails/IS_DELETED eq 'N'" : aFilters[1];
			oDataModel.read(Config.dbOperations.cwsRequestViewApi, {
				urlParameters: {
					"$filter": aDownloadFilter,
					"$expand": "CwsPaymentsDetails,CwsWbsDataDetails"
				},
				success: function (oData) {
					if (oData && oData.results.length > 0) {
						this._fnDataDescription(oData.results, oKey);
					} else {
						this.hideBusyIndicator();
						MessageBox.error("No Data to download.");
					}
				}.bind(this)
			});
		},
		/**
		 * On Press Download Offline Report - Only provisioned to Application Admin and controlled by a configuration flag
		 */
		onPressProceedToDownloadOfflineReport: function (oEvent) {
			// this.showBusyIndicator();
			var oKey = this.AppModel.getProperty("/oTabKey");
			var isPaidRecords = this.AppModel.getProperty("/oPaidMonthstate"),
				oTable = oKey === "opwn" ? this.getUIControl("CoiOpwnRequestsTableId") : this.getUIControl("CoiCwNedRequestsTableId");
			var aFilters = decodeURIComponent(oTable.getBinding("items").sFilterParams);
			aFilters = aFilters.split("=");
			aFilters[1] = aFilters[1].replaceAll("CwsPaymentsDetails/", "");
			aFilters[1] = aFilters[1].replaceAll("CwsWbsDataDetails/", "");

			var oDataModel = this.getComponentModel("CoiReportSrvModel"),
				aDownloadFilter = oKey === "opwn" && !isPaidRecords ? aFilters[1] + " and IS_DELETED eq 'N'" : aFilters[1];

			// if (!oKey || (oKey === "opwn" && isPaidRecords) || oKey === "cw") {
			var oUrlParameters = {
				"$filter": aFilters[1]
			};

			oDataModel.read("/CwsReportExtracts", {
				urlParameters: oUrlParameters,
				success: function (oData) {
					if (oData && oData.results.length > 0) {
						this._fnHandleReportExtraction(oData.results, oKey);
					} else {
						this.hideBusyIndicator();
						MessageBox.error("No Data to download.");
					}
				}.bind(this)
			});
			// }
		},
		/**
		 * CWS Data Extract Report Handler
		 */
		_fnHandleReportExtraction: function (aData, key) {
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyyMMddhhmmss"
			});

			var date = oDateFormat.format(new Date());
			var aCols, aProducts, oSettings, oSheet;
			var oTabkey = this.AppModel.getProperty("/oTabKey");
			var oName = (oTabkey === "opwn") ? "COI_OPWN_OFFLINE_REPORT" : "COI_CW_NED_OFFLINE_REPORT";
			var listOfMonths = this.getI18n("coireport.ListOfMonths").split(",");
			aCols = (oTabkey === "opwn") ? Formatter.createColumnConfigOpwn(EdmType) : Formatter.createCwNedColumnConfig(EdmType);

			var oDataSource = (oTabkey === "opwn") ? Utility.generateOpwnExcelRecordsForSyncReports(aData, listOfMonths) :
				Utility.generateCwsNedExcelRecordsForSyncReports(aData, listOfMonths);

			var sortedArray = oDataSource.sort((a, b) => {
				if (a.STAFF_ID !== b.STAFF_ID) {
					return a.STAFF_ID - b.STAFF_ID;
				} else if (a.REQUEST_ID !== b.REQUEST_ID) {
					return a.REQUEST_ID - b.REQUEST_ID;
				} else if (a.PAYMENT_ID !== b.PAYMENT_ID) {
					return a.PAYMENT_ID - b.PAYMENT_ID;
				} else if (a.PAYMENT_DATE !== b.PAYMENT_DATE) {
					return new Date(a.PAYMENT_DATE) - new Date(b.PAYMENT_DATE);
				} else {
					return a.SUBMITTED_ON_TS - b.SUBMITTED_ON_TS;
				}
			});

			oSettings = {
				workbook: {
					columns: aCols,
					context: {
						sheetName: this.getI18n(oName) + "Details"
					}
				},
				dataSource: sortedArray,
				fileName: this.getI18n(oName) + "_" + date + ".xlsx"
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					this.hideBusyIndicator();
					MessageToast.show(this.getI18n(oName) + ' exported successfully.');
				}.bind(this))
				.finally(function () {
					oSheet.destroy();
				});
		},

		// Value help Methods - Request ID
		handleValueHelpRequestId: function (oEvent) {
			this.AppModel.setProperty("/claimRequest/requestIdList", []);

			var sValue = oEvent.getParameter("value"),
				oDataModel = this.getComponentModel("CoiReportSrvModel"),
				aFilter = [];
			aFilter.push(new Filter("REQUEST_ID", FilterOperator.Contains, sValue.trim()));
			oDataModel.read(Config.dbOperations.cwsRequestViewApi, {
				filters: aFilter,
				urlParameters: {
					"$select": "REQUEST_ID"
				},
				success: function (oData) {
					if (oData) {
						this.AppModel.setProperty("/claimRequest/requestIdList", oData.results);
					}
				}.bind(this),
				error: function (oError) { }
			});
		},

		handleConfirmRequestId: function (oEvent) {
			this.getUIControl("inpRequestNoValueHelp").removeAllTokens();
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				for (var i = 0; i < aContexts.length; i++) {
					var sPath = aContexts[i].getPath(),
						objSelectedRequestId = this.AppModel.getProperty(sPath);
					this.getUIControl("inpRequestNoValueHelp").addToken(new Token({
						text: objSelectedRequestId.REQUEST_ID,
						key: objSelectedRequestId.REQUEST_ID
					}));
				}
			}
		},

		// Value help Methods - Request No.
		openRequestNoValueHelpPopUp: function () {
			var oView = this.getView();
			this.AppModel.setProperty("/claimRequest/requestIdList", []);
			if (!this._oDialogAddRequestId) {
				this._oDialogAddRequestId = Fragment.load({
					id: oView.getId(),
					name: "nus.edu.sg.coireport.view.subview.RequestIdValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this._oDialogAddRequestId.then(function (oDialog) {
				oDialog.setRememberSelections(false);
				oDialog.open();
			});
		},

		// Value help Methods - Request Status
		handleValueHelpStatus: function (oEvent) {
			var oDataModel = this.getComponentModel("CatalogSrvModel"),
				aFilters = [];
			aFilters.push(new Filter("STATUS_TYPE", FilterOperator.EQ, 'CW'));
			aFilters.push(new Filter("STATUS_ALIAS", FilterOperator.NE, 'Draft'));
			aFilters.push(new Filter("SHOW_INBOX", FilterOperator.EQ, 'Y'));
			Services.readLookups(Config.dbOperations.statusConfigs, oDataModel, this, aFilters,
				function (oData) {
					this._updateStatusConfig(oData);
				}.bind(this));
		},
		handleConfirmStatus: function (oEvent) {
			this.getUIControl("inpClaimStatus").removeAllTokens();
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				if (aContexts && aContexts.length) {
					for (var i = 0; i < aContexts.length; i++) {
						var sPath = aContexts[i].getPath();
						var objSelectedStatus = this.AppModel.getProperty(sPath);
						this.getUIControl("inpClaimStatus").addToken(new Token({
							text: objSelectedStatus.STATUS_ALIAS,
							key: objSelectedStatus.STATUS_CODE
						}));
					}
				}
			}
		},

		onSearch: function (oEvent) {
			this.AppModel.setProperty("/aSearchFilter", []);
			this.searchFilter();
			var aFilter = this.AppModel.getProperty("/aSearchFilter");
			var oStaffFilter = this.AppModel.getProperty("/hrpStaffList");
			if (aFilter.length === 0) {
				aFilter = this.empSearchFilter();
				this.fnLoadTable(aFilter);
			} else {
				var sFilters = this.empSearchFilter();
				aFilter = new Filter({
					filters: [new Filter(aFilter, true), new Filter(sFilters, true)],
					and: true
				});
				this.fnLoadTable(aFilter);
			}
			if (oEvent) {
				this._fnSaveState();
				var tabKey = this.AppModel.getProperty("/oTabKey");
				this.AppModel.setProperty("/oSelectedSection", tabKey);
			}
		},

		// Value help Methods - Request Type
		handleValueHelpRequestType: function (oEvt) {
			var oCatalogSrvModel = this.getComponentModel("CatalogSrvModel"),
				aFilters = [],
				aMatrixData = this.AppModel.getProperty("/oPrimaryData/staffInfo/inboxApproverMatrix"),
				aProcessCode = [],
				orFilter;
			aMatrixData.forEach(function (oMatrixData) {
				if (oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN") {
					aProcessCode.push(new Filter("REFERENCE_VALUE", FilterOperator.EQ, oMatrixData.PROCESS_CODE));
				}
			});
			orFilter = new Filter(aProcessCode, false);
			aFilters.push([new Filter("REFERENCE_KEY", FilterOperator.EQ, "EXT"),
			new Filter("REFERENCE_KEY", FilterOperator.EQ, "INT"),
				orFilter
			]);
			Services.readLookups(Config.dbOperations.cwsAppConfigs, oCatalogSrvModel, this, aFilters,
				function (oData) {
					this._updateRequestType(oData, oEvt);
				}.bind(this));
		},
		handleConfirmClaimType: function (oEvent) {
			this.getUIControl("inpRqstTypeValueHelp").removeAllTokens();
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				this.AppModel.setProperty("/oPMonth", false);
				for (var i = 0; i < aContexts.length; i++) {
					var sPath = aContexts[i].getPath();
					var obj = this.AppModel.getProperty(sPath);
					if (obj.CONFIG_KEY === "OPWN") {
						this.AppModel.setProperty("/oTabKey", "opwn");
						this.AppModel.setProperty("/opwnVisible", true);
					}

					if (obj.CONFIG_KEY !== "OPWN") {
						this.AppModel.setProperty("/oTabKey", "cw");
						this.AppModel.setProperty("/cwVisible", true);
					}

					if (this.AppModel.getProperty("/opwnVisible") && aContexts.length === 1) {
						this.AppModel.setProperty("/oPMonth", true);
					}

					var newToken = new Token({
						text: obj.CONFIG_VALUE,
						key: obj.CONFIG_KEY,
						customData: {
							key: "REFERENCE_VALUE",
							value: obj.REFERENCE_VALUE
						}
					});

					this.getUIControl("inpRqstTypeValueHelp").addToken(newToken);
					this.getUIControl("inpUluValueHelp").removeAllTokens();
				}
			}
		},

		// Value help Methods - Staff ID
		openStaffIdValueHelpPopUp: function () {
			this.AppModel.setProperty("/claimRequest/staffList", []);
			var oView = this.getView();
			if (!this._oDialogAddStaff) {
				this._oDialogAddStaff = Fragment.load({
					id: oView.getId(),
					name: "nus.edu.sg.coireport.view.subview.StaffValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}

			this._oDialogAddStaff.then(function (oDialog) {
				oDialog.setRememberSelections(false);
				oDialog.open();
			}.bind(this));
		},
		handleConfirmStaff: function (oEvent, key) {
			var aContexts = oEvent.getParameter("selectedContexts");

			if (key === "HRP" && aContexts.length > 50) {
				MessageToast.show("Only 50 staff can select maximum");
				return;
			}
			var aExistingTokens = this.getUIControl("inpStaffValueHelp").getTokens();

			if (aContexts && aContexts.length) {
				for (var i = 0; i < aContexts.length; i++) {
					var sPath = aContexts[i].getPath();
					var objSelectedStaff = this.AppModel.getProperty(sPath);
					var sKey = objSelectedStaff.STF_NUMBER;
					if (this.checkTokenAlreadyExist(aExistingTokens, sKey)) {
						return;
					}
					this.getUIControl("inpStaffValueHelp").addToken(new Token({
						text: objSelectedStaff.FULL_NM,
						key: objSelectedStaff.STF_NUMBER
					}));
				}
			}
		},

		/* Common search function for filter*/
		handleSearchStaff: function (oEvent) {
			var sValue = oEvent.getParameter("value").toString();
			if (sValue.length < 3) {
				this.AppModel.setProperty("/claimRequest/staffList", []);
				MessageToast.show("Please enter minimum 3 characters to search");
				return;
			}
			this.showBusyIndicator();
			var oDataModel = this.getComponentModel("CatalogSrvModel"),
				sKey = "SF_STF_NUMBER",
				filterStaffId = new Filter(sKey, FilterOperator.EQ, sValue),
				filterStaffLowerCase = new Filter("FULL_NM", FilterOperator.Contains, sValue.toLowerCase()),
				sStaffNameUppeCamelCase = sValue[0] !== '' ? this._updateStaffNameSearchVal(sValue) : '',
				filterStaffNameUpperCamelCase = new Filter("FULL_NM", FilterOperator.Contains, sStaffNameUppeCamelCase),
				filterStaffNameUpperCase = new Filter("FULL_NM", FilterOperator.Contains, sValue.toUpperCase()),
				staffFiltersGrp = new Filter({
					filters: [filterStaffNameUpperCamelCase, filterStaffLowerCase, filterStaffNameUpperCase],
					and: false
				}),
				filterEXT = new Filter("IS_EXTERNAL", FilterOperator.EQ, 0),
				aFilterStaffType = new Filter({
					filters: [filterStaffId, filterEXT],
					and: true
				}),
				aFilterStaffName = new Filter({
					filters: [staffFiltersGrp, filterEXT],
					and: true
				}),
				filtersGrp = new Filter({
					filters: [aFilterStaffType, aFilterStaffName],
					and: false
				}),
				aFilterValue = new Filter({
					filters: [filtersGrp],
					and: true
				});
			oEvent.getSource().setRememberSelections(false);
			if (!sValue) {
				this.AppModel.setProperty("/claimRequest/staffList", []);
				this.hideBusyIndicator();
			} else {
				// var sURL = "/UserLookups",
				var selecVal = "NUSNET_ID,FULL_NM,STF_NUMBER,SF_STF_NUMBER";
				// selecVal = SelecVal;
				oDataModel.read(Config.dbOperations.userLookups, {
					urlParameters: {
						"$select": selecVal
					},
					filters: [aFilterValue],
					success: function (oData) {
						if (oData.results.length) {
							this.AppModel.setProperty("/claimRequest/staffList", oData.results)
						} else {
							this.AppModel.setProperty("/claimRequest/staffList", []);
						}
						this.hideBusyIndicator();
					}.bind(this),
					error: function (oError) {
						this.hideBusyIndicator();
					}.bind(this)
				});
			}
		},
		/* Filter 6 - ULU */
		handleValueHelpUlu: function (oEvent, initialCallBack) {
			//changed the logic of ULU and FDLU search help 
			var oCatalogSrvModel = this.getComponentModel("CatalogSrvModel");
			var oFilter = this._fnULUgeneratefilter();
			// var aFilters = [];
			Services.readLookups(Config.dbOperations.fdluulu_datas, oCatalogSrvModel, this, oFilter,
				function (oData) {
					this._updateUlu(oData);
				}.bind(this));
		},

		handleConfirmUlu: function (oEvent) {
			this.getUIControl("inpUluValueHelp").removeAllTokens();
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				for (var i = 0; i < aContexts.length; i++) {
					var sPath = aContexts[i].getPath();
					var objSelectedUlu = this.AppModel.getProperty(sPath);
					this.getUIControl("inpUluValueHelp").addToken(new Token({
						text: objSelectedUlu.ULU_C === "ALL" ? "ALL" : objSelectedUlu.ULU_T,
						key: objSelectedUlu.ULU_C
					}));
				}
			}
		},

		/* Filter 7 - FDLU */

		handleValueHelpFdlu: function (oEvent) {
			var selectedItemsUlu = this.getUIControl("inpUluValueHelp").getTokens();
			// var oDataModel = this.getComponentModel("CoiReportSrvModel");
			var oCatalogSrvModel = this.getComponentModel("CatalogSrvModel");
			var aFilters, dynamicFilters = [],
				combinedFilter = "";
			selectedItemsUlu.forEach(function (value) {
				dynamicFilters.push(new Filter("ULU_C", FilterOperator.EQ, value.getKey()));
			});
			if (dynamicFilters.length > 0) {
				combinedFilter = new Filter({
					filters: dynamicFilters,
					and: false
				});
			} else {
				var comFilter = this._fnULUgeneratefilter();
				combinedFilter = comFilter.length > 0 ? new Filter({
					filters: comFilter,
					and: false
				}) : "";
			}
			Services.readLookups(Config.dbOperations.fdluulu_datas, oCatalogSrvModel, this, [combinedFilter],
				function (oData) {
					this._updateFdlu(oData, selectedItemsUlu);
				}.bind(this));

		},

		handleConfirmFdlu: function (oEvent) {
			this.getUIControl("inpFdluValueHelp").removeAllTokens();
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				for (var i = 0; i < aContexts.length; i++) {
					var sPath = aContexts[i].getPath();
					var objSelectedFdlu = this.AppModel.getProperty(sPath);
					this.getUIControl("inpFdluValueHelp").addToken(new Token({
						text: objSelectedFdlu.FDLU_T,
						key: objSelectedFdlu.FDLU_C
					}));
				}
			}
		},

		handleSearch: function (oEvent, key1, key2) {
			var oBinding = "";
			if (oEvent) {
				var sValue = oEvent.getParameter("value");
				var oFilter = [];
				oBinding = oEvent.getSource().getBinding("items");
			} else {
				oBinding = oEvent;
			}
			if (!!sValue && sValue !== "") {
				var oFilter1 = new Filter(key1, FilterOperator.Contains, sValue),
					oFilter2 = new Filter(key2, FilterOperator.Contains, sValue),
					oFilter = new Filter([oFilter1, oFilter2], false);
			} else {
				oFilter = "";
			}
			oBinding.filter([oFilter]);
		},

		handleStaffSearch: function (oEvent, key) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(key, FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		// *****************Internal Custom Functions***************** //
		checkTokenAlreadyExist: function (aExistingTokens, sKey) {
			var bTokenExist = false;
			for (var j = 0; j < aExistingTokens.length; j++) {
				if (aExistingTokens[j].getKey() === sKey) {
					bTokenExist = true;
				}
			}
			return bTokenExist;
		},
		fnLoadTable: function (aFilter) {
			if (this.AppModel.getProperty("/opwnVisible")) {
				var orFilter,
					andFilter = aFilter,
					oLogData = this.AppModel.getProperty("/oPrimaryData/staffInfo"),
					oClaimsReqTableopwn = this.getView().byId("CoiOpwnRequestsTableId");
				orFilter = [new Filter("REQUEST_TYPE", FilterOperator.EQ, "OPWN")];
				if (andFilter.aFilters) {
					aFilter.aFilters.push(new Filter(orFilter, true));
				} else {
					andFilter.push(new Filter(orFilter, true));
				}
				oClaimsReqTableopwn.setBusy(true);
				oClaimsReqTableopwn.bindItems({
					path: "CoiReportSrvModel>" + Config.dbOperations.cwsRequestViewApi,
					template: this.oTemplateopwn,
					sorter: new Sorter({
						path: "REQUEST_ID",
						descending: true
					}),
					filters: andFilter,
					events: {
						dataReceived: function (oEvent) {
							oClaimsReqTableopwn.setBusy(false);
						}.bind(this)
					}
				});
				this.getView().byId("CoiOpwnRequestsTableId").setVisible(true);
				andFilter = [];
			}

			if (this.AppModel.getProperty("/cwVisible")) {
				this.fnLoadCW(aFilter);
			}
		},

		fnLoadCW: function (sFilter) {
			var oLogData = this.AppModel.getProperty("/oPrimaryData/staffInfo"),
				oClaimsReqTable = this.getView().byId("CoiCwNedRequestsTableId"),
				orFilter = [new Filter("REQUEST_TYPE", FilterOperator.NE, "OPWN")];
			if (sFilter.aFilters) {
				if (this.AppModel.getProperty("/opwnVisible"))
					sFilter.aFilters.splice(sFilter.aFilters.length - 1, 1);
				sFilter.aFilters.push(new Filter(orFilter, true));
			} else {
				if (this.AppModel.getProperty("/opwnVisible"))
					sFilter.splice(sFilter.length - 1, 1);
				sFilter.push(new Filter(orFilter, true));
			}
			oClaimsReqTable.setBusy(true);
			oClaimsReqTable.bindItems({
				path: "CoiReportSrvModel>" + Config.dbOperations.cwsRequestViewApi,
				template: this.oTemplate,
				sorter: new Sorter({
					path: "REQUEST_ID",
					descending: true
				}),
				filters: sFilter,
				events: {
					dataReceived: function (oEvent) {
						oClaimsReqTable.setBusy(false);
					}.bind(this)
				}
			});
			this.getView().byId("CoiCwNedRequestsTableId").setVisible(true);
			sFilter = [];
		},

		empSearchFilter: function () {
			var staffId = this.AppModel.getProperty("/loggedInUserInfo/userName");
			var oClaimType = this.AppModel.getProperty("/claimRequest/claimTypeList");
			var aFilter = [],
				andFilter = [];
			var aMatrixData = this.AppModel.getProperty("/oPrimaryData/staffInfo/inboxApproverMatrix"),
				aProcessCode = [],
				orFilter;
			aMatrixData.forEach(function (oMatrixData) {
				if (oMatrixData.STAFF_USER_GRP === "ORMD_ADMIN") {
					aProcessCode.push(new Filter("PROCESS_CODE", FilterOperator.EQ, oMatrixData.PROCESS_CODE));
				}
			});
			orFilter = new Filter(aProcessCode, false);
			var sFilter = new Filter([
				new Filter("TO_DISPLAY", FilterOperator.EQ, "Y"),
				new Filter("REQUEST_STATUS", FilterOperator.NE, "31"), // Initial draft
				new Filter("REQUEST_STATUS", FilterOperator.NE, "39"), // Withdrawn
				new Filter("REQUEST_STATUS", FilterOperator.NE, "49"), // Deleted	
				new Filter("REQUEST_STATUS", FilterOperator.NE, "44"), // Status when staff retracts
				new Filter("REQUEST_STATUS", FilterOperator.NE, "45"), // Status when department admin retracts
				new Filter("REQUEST_STATUS", FilterOperator.NE, "46"), // Status when program admin retracts	
				orFilter
			], true);

			aFilter.push(new Filter(sFilter, true));
			return aFilter;
		},

		searchFilter: function (oEvent) {
			var staffId = this.AppModel.getProperty("/loggedInUserInfo/userName"),
				selectedItemsUlu = this.getUIControl("inpUluValueHelp").getTokens(),
				oClaimType = this.AppModel.getProperty("/claimRequest/claimTypeList"),
				claimTypeCode = this.getUIControl("inpRqstTypeValueHelp").getTokens(),
				claimType = this.AppModel.getProperty("/claimType"),
				selectedItemsStatus = this.AppModel.getProperty("/claimRequest/selectedItemsClaimStatus"),
				selectedItemsClaimNo = this.getUIControl("inpRequestNoValueHelp").getTokens(),
				selectedItemsFdlu = this.getUIControl("inpFdluValueHelp").getTokens(),
				osubmissiondate = this.getUIControl("dp_submission"),
				oPeriod = this.getUIControl("dp_period"),
				oStatus = this.getUIControl("inpClaimStatus").getTokens(),
				selectedItemsStaffId = this.getUIControl("inpStaffValueHelp").getTokens(),
				ulu = this.AppModel.getProperty("/uluSelectedCode"),
				uluName = this.AppModel.getProperty("/uluSelected"),
				fdlu = this.AppModel.getProperty("/fdluSelectedCode"),
				fdluName = this.AppModel.getProperty("/fdluSelected"),
				submittedBy = this.AppModel.getProperty("/submittedById"),
				submittedByName = this.AppModel.getProperty("/submittedByName"),
				searchByClientOrPrgmName = this.AppModel.getProperty("/searchByClientOrPrgmName"),
				aFilter = [],
				andFilter = [];

			if (!!claimTypeCode && claimTypeCode.length > 0) {
				var orFilter = [],
					rClaimCode = [];
				for (var i = 0; i < claimTypeCode.length; i++) {
					if (claimTypeCode[i].getProperty("key") === "OPWN") {
						this.AppModel.setProperty("/oTabKey", "opwn");
						this.AppModel.setProperty("/opwnVisible", true);
					} else {
						this.AppModel.setProperty("/oTabKey", "cw");
						this.AppModel.setProperty("/cwVisible", true);
					}
					rClaimCode.push({
						"CONFIG_KEY": claimTypeCode[i].getProperty("key"),
						"CONFIG_VALUE": claimTypeCode[i].getProperty("text")
					});
					orFilter.push(new Filter("REQUEST_TYPE", FilterOperator.EQ, claimTypeCode[i].getProperty("key")));
				}
				this.AppModel.setProperty("/rClaimType", rClaimCode);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rClaimType", []);
			}
			if (!!selectedItemsClaimNo && selectedItemsClaimNo.length > 0) {
				var orFilter = [],
					rRequestID = [];
				for (var i = 0; i < selectedItemsClaimNo.length; i++) {
					orFilter.push(new Filter("REQUEST_ID", FilterOperator.EQ, selectedItemsClaimNo[i].getProperty("key")));
					rRequestID.push({
						"REQUEST_ID": selectedItemsClaimNo[i].getProperty("key"),
						"REQUEST_ID": selectedItemsClaimNo[i].getProperty("text")
					});
				}
				this.AppModel.setProperty("/rRequestid", rRequestID);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rRequestid", []);
			}
			if (osubmissiondate.getDateValue()) {
				var oSubDate = osubmissiondate.getDateValue();
				var oSubEdate = osubmissiondate.getSecondDateValue();
				this.AppModel.setProperty("/rSubmissionsDate", oSubDate);
				this.AppModel.setProperty("/rSubmissioneDate", oSubEdate);
				andFilter.push(new Filter("SUBMITTED_ON_TS", FilterOperator.BT, oSubDate.toISOString(), oSubEdate.toISOString()));
			} else {
				this.AppModel.setProperty("/rSubmissionsDate", null);
				this.AppModel.setProperty("/rSubmissioneDate", null);
			}
			if (oPeriod.getDateValue()) {
				var oSubDate = oPeriod.getDateValue();
				var oSubEdate = oPeriod.getSecondDateValue();
				this.AppModel.setProperty("/rPeriodsDate", oSubDate);
				this.AppModel.setProperty("/rPeriodeDate", oSubEdate);
				var staUTC = new Date(oSubDate).toISOString();
				var etaUTC = new Date(oSubEdate).toISOString();
				andFilter.push(new Filter("START_DATE_CAL", FilterOperator.GE, staUTC));
				andFilter.push(new Filter("END_DATE_CAL", FilterOperator.LE, etaUTC));
			} else {
				this.AppModel.setProperty("/rPeriodsDate", null);
				this.AppModel.setProperty("/rPeriodeDate", null);
			}
			if (!!selectedItemsUlu && selectedItemsUlu.length > 0) {
				var orFilter = [],
					key = "",
					ruluTokens = [];
				if (claimTypeCode && claimTypeCode.length > 0) {
					key = claimTypeCode[0].getProperty("key") === "OPWN" ? "ULU" : "ULU_C";
				}

				for (var i = 0; i < selectedItemsUlu.length; i++) {
					orFilter.push(new Filter("ULU", FilterOperator.EQ, selectedItemsUlu[i].getProperty("key")));
					orFilter.push(new Filter("ULU_C", FilterOperator.EQ, selectedItemsUlu[i].getProperty("key")));
					ruluTokens.push({
						"ULU_C": selectedItemsUlu[i].getProperty("key"),
						"ULU_T": selectedItemsUlu[i].getProperty("text")
					});
				}
				this.AppModel.setProperty("/rulus", ruluTokens);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rulus", []);
			}
			if (!!selectedItemsFdlu && selectedItemsFdlu.length > 0) {
				var orFilter = [],
					key = "",
					rfdluTokens = [];
				if (claimTypeCode && claimTypeCode.length > 0) {
					key = claimTypeCode[0].getProperty("key") === "OPWN" ? "FDLU" : "FDLU_C";
				}

				for (var i = 0; i < selectedItemsFdlu.length; i++) {
					orFilter.push(new Filter("FDLU", FilterOperator.EQ, selectedItemsFdlu[i].getProperty("key")));
					orFilter.push(new Filter("FDLU_C", FilterOperator.EQ, selectedItemsFdlu[i].getProperty("key")));
					rfdluTokens.push({
						"FDLU_C": selectedItemsFdlu[i].getProperty("key"),
						"FDLU_T": selectedItemsFdlu[i].getProperty("text")
					});
				}
				this.AppModel.setProperty("/rfdlus", rfdluTokens);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rfdlus", []);
			}
			if (!!oStatus && oStatus.length > 0) {
				var orFilter = [],
					rStatusTokens = [];

				for (var i = 0; i < oStatus.length; i++) {
					orFilter.push(new Filter("REQUEST_STATUS", FilterOperator.EQ, oStatus[i].getProperty("key")));
					rStatusTokens.push({
						"STATUS_CODE": oStatus[i].getProperty("key"),
						"STATUS_ALIAS": oStatus[i].getProperty("text")
					});
				}

				this.AppModel.setProperty("/rStatus", rStatusTokens);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rStatus", []);
			}
			if (!!selectedItemsStaffId && selectedItemsStaffId.length > 0) {
				var orFilter = [],
					rstaffTokens = [];
				for (var i = 0; i < selectedItemsStaffId.length; i++) {
					orFilter.push(new Filter("STAFF_ID", FilterOperator.EQ, selectedItemsStaffId[i].getProperty("key")));

					rstaffTokens.push({
						"STAFF_ID": selectedItemsStaffId[i].getProperty("key"),
						"FULL_NM": selectedItemsStaffId[i].getProperty("text")
					});
				}
				this.AppModel.setProperty("/rStafflist", rstaffTokens);
				andFilter.push(new Filter(orFilter, false));
			} else {
				this.AppModel.setProperty("/rStafflist", []);
			}

			andFilter.push(new Filter("CwsPaymentsDetails/IS_DELETED", FilterOperator.EQ, "N"));

			if (this.AppModel.getProperty("/oMigratestate")) {
				orFilter = [];
			} else {
				orFilter = [];
				orFilter.push(new Filter("MIGRATED", FilterOperator.NE, "MC"));
				orFilter.push(new Filter("MIGRATED", FilterOperator.NE, "MG"));
				orFilter.push(new Filter("MIGRATED", FilterOperator.NE, "MD"));
				andFilter.push(new Filter(orFilter, true));
			}

			//Amend Client or Program Name Filter - Enhancement (18.02.2026)
			if (!!searchByClientOrPrgmName && searchByClientOrPrgmName.length > 0) {
				var orFilter = [];
				orFilter.push(new Filter({
					path: "tolower(CLIENT_NAME)",
					operator: FilterOperator.Contains,
					value1: "'" + searchByClientOrPrgmName.toLowerCase() + "'"
				}));

				orFilter.push(new Filter({
					path: "tolower(PROGRAM_NAME)",
					operator: FilterOperator.Contains,
					value1: "'" + searchByClientOrPrgmName.toLowerCase() + "'"
				}));

				// orFilter.push(new Filter("CLIENT_NAME", FilterOperator.Contains, searchByClientOrPrgmName));
				// orFilter.push(new Filter("CLIENT_NAME", FilterOperator.Contains, searchByClientOrPrgmName.toUpperCase()));
				// orFilter.push(new Filter("PROGRAM_NAME", FilterOperator.Contains, searchByClientOrPrgmName));
				// orFilter.push(new Filter("PROGRAM_NAME", FilterOperator.Contains, searchByClientOrPrgmName.toUpperCase()));
				andFilter.push(new Filter(orFilter, false));
			}

			if (andFilter.length > 0) {
				aFilter.push(new Filter(andFilter, true));
			}

			this.AppModel.setProperty("/aSearchFilter", aFilter);
		},

		/**
		 * On Select Extraction Mode Radio Button Group
		 */
		onSelectExtractionMode: function (oEvent) {
			var sMode = oEvent.getSource().data("selectmode"); // shorter API
			if (sMode) {
				this.AppModel.setProperty("/extractionType", sMode);
				this.showMessageInfoForLastSync();
			}
		},
		/**
		 * Prepare Message and display in the Information Tab against each table
		 */
		showMessageInfoForLastSync: function () {
			var message = "";
			if (this.AppModel.getProperty("/offlineReportAccess") && (this.AppModel.getProperty("/extractionType") === this.getI18n(
				"coireport.ExtractionType.OfflineProp"))) {
				var selectedProcess = this.AppModel.getProperty("/oTabKey");
				var syncResults = this.AppModel.getProperty("/lastSyncResults");
				const latestSync = {};
				// Iterate over all entries
				syncResults.forEach(entry => {
					const {
						PROCESS_CODE,
						LAST_SYNCED_ON
					} = entry;

					// If the PROCESS_CODE doesn't exist yet or the current entry is newer, update it
					if (!latestSync[PROCESS_CODE] || new Date(LAST_SYNCED_ON) > new Date(latestSync[PROCESS_CODE].LAST_SYNCED_ON)) {
						latestSync[PROCESS_CODE] = entry;
					}
				});

				// message = `For Offline Data download, the data will be as of `;
				message = this.getI18n("coireport.Offline.InitialMsg");

				if (this.AppModel.getProperty("/cwVisible")) {
					message += ' ' +
						`${latestSync['201'].PROCESS_TITLE} - ${Formatter.formatDateAsString(latestSync['201'].LAST_SYNCED_ON, "dd/MM/yyyy hh:MM:ss aa")}, ` +
						`${latestSync['202'].PROCESS_TITLE} - ${Formatter.formatDateAsString(latestSync['202'].LAST_SYNCED_ON, "dd/MM/yyyy hh:MM:ss aa")}, ` +
						`${latestSync['204'].PROCESS_TITLE} - ${Formatter.formatDateAsString(latestSync['204'].LAST_SYNCED_ON, "dd/MM/yyyy hh:MM:ss aa")}.`;
				}

				if (this.AppModel.getProperty("/opwnVisible")) {
					message += this.AppModel.getProperty("/cwVisible") ? ' and ' : ' ';
					message +=
						`${latestSync['203'].PROCESS_TITLE} - ${Formatter.formatDateAsString(latestSync['203'].LAST_SYNCED_ON, "dd/MM/yyyy hh:MM:ss aa")}.`;
				}
			}

			this.AppModel.setProperty("/offlineSyncMessage", message);
		},

		generateData: function (inputArray) {
			var oData = [];
			for (var i = 0; i < inputArray.length; i++) {
				oData.push({
					"REQ_UNIQUE_ID": inputArray[i].REQ_UNIQUE_ID,
					"REQUEST_ID": inputArray[i].REQUEST_ID,
					"ROLE": inputArray[i].ROLE,
					"START_DATE": inputArray[i].START_DATE,
					"END_DATE": inputArray[i].END_DATE,
					"AMOUNT": inputArray[i].AMOUNT,
					"NOOFMONTHS": inputArray[i].NOOFMONTHS
				});
			}
			return oData;
		},

		// *****************Custom Private Functions***************** //

		// 8. Event for saving the info before navigating to other app
		_fnSaveState: function () {

			if (sap.ushell && sap.ushell.Container) {
				// var that = this;
				sap.ushell.Container.getServiceAsync("Personalization")
					.then(function (oPersonalizationService) {
						return oPersonalizationService.getContainer("Coireport", {
							validity: 0
						});
					}.bind(this))
					.then(function (oContainer) {
						this.oStateContainer = oContainer;
						// Clear previous personalization
						this.oStateContainer.clear();
						var oFilterValue = that.AppModel.getData();
						this.oStateContainer.setItemValue("persData", oFilterValue);
						return this.oStateContainer.save();
					}.bind(this))
					.catch(function (oError) {
						console.error("Error saving personalization:", oError);
					});
			}

			// sap.ushell.Container.getService("Personalization").getContainer("Coireport", {
			// 	validity: 0
			// }).fail(function () {
			// 	//Error Handling
			// }).done(jQuery.proxy(function (oParam) {
			// 	this.oStateContainer = oParam;
			// 	this.oStateContainer.clear();
			// 	var oFiltervalue = this.AppModel.getData();
			// 	this.oStateContainer.setItemValue("persData", oFiltervalue);
			// 	this.oStateContainer.save();
			// }, this));
		},
		// 9. Event to restore the values from back navigation
		_fnRestoreState: function () {

			if (sap.ushell && sap.ushell.Container) {
				var that = this;
				that.AppModel.setProperty("/oRState", true);
				sap.ushell.Container.getServiceAsync("Personalization")
					.then(function (oPersonalizationService) {
						return oPersonalizationService.getContainer("Coireport", {
							validity: 0
						});
					}.bind(this))
					.then(function () {
						this.oStateContainer = oContainer;
						var oFilterValue = oParams.getItemValue("persData");
						if (oFilterValue !== undefined) {
							this.onPressGoRetrieveRequests();
						}
					}.bind(this))
					.catch(function (oError) {
						console.error("Error saving personalization:", oError);
					});
			}

			// this.AppModel.setProperty("/oRState", true);
			// sap.ushell.Container.getService("Personalization").getContainer("Coireport", {
			// 	validity: 0
			// }).fail(function () {
			// 	// Error Handler
			// }).done(jQuery.proxy(function (oParams) {
			// 	this.oStateContainer = oParams;
			// 	var oFilterValue = oParams.getItemValue("persData");
			// 	if (oFilterValue !== undefined) {
			// 		this.AppModel.setData(oFilterValue);
			// 		this.onSearch();
			// 	}
			// }, this));
		},

		_fnDataDescription: function (oData, oKey) {
			var data = [],
				dataValid = [],
				oLocation = this.AppModel.getProperty("/locations"),
				oWorkTypes = this.AppModel.getProperty("/workTypes"),
				oLevy = this.AppModel.getProperty("/levyList"),
				oRemuneration = this.AppModel.getProperty("/remunerationList"),
				owaiver = this.AppModel.getProperty("/waiverList"),
				osubmission = this.AppModel.getProperty("/submission"),
				oStatus = this.AppModel.getProperty("/opwnStatus"),
				oPayment = this.AppModel.getProperty("/paymentType");

			if (oData && oKey === "opwn") {
				data = oData;
				var oSubDesc = osubmission.reduce((map, obj) => {
					map[obj.CONFIG_KEY] = obj.CONFIG_VALUE;
					return map;
				}, {});
				data.forEach(obj => {
					if (oSubDesc.hasOwnProperty(obj.SUBMISSION_TYPE)) {
						obj.SUBMISSION_TYPE = oSubDesc[obj.SUBMISSION_TYPE];
					}
				});

				// Levy List
				var oLevyDesc = oLevy.reduce((map, obj) => {
					map[obj.CONFIG_KEY] = obj.REFERENCE_VALUE + "," + obj.CONFIG_VALUE;
					return map;
				}, {});
				data.forEach(obj => {
					if (oLevyDesc.hasOwnProperty(obj.PROPERTY_USAGE)) {
						var oValue = oLevyDesc[obj.PROPERTY_USAGE].split(",");
						obj.PROPERTY_USAGE = oValue[1];
						obj.PROPERTY_PERCENT = oValue[0];
					} else {
						var okey = obj.EMP_CAT_C === "46" ? "LVY05" : "LVY04";
						var oValue = oLevyDesc[okey].split(",");
						obj.PROPERTY_USAGE = oValue[1];
						obj.PROPERTY_PERCENT = oValue[0];
					}
				});
				data = data.map((element) => {
					var updatedCwsPaymentsDetails = (element.CwsPaymentsDetails.results).map((payment) => {
						if (payment.IS_DELETED !== "Y") {
							var matchingWbsData = (element.CwsWbsDataDetails.results).find((wbsData) => wbsData.WBS_CODE === payment.WBS);
							if (matchingWbsData) {
								payment.VALUE = matchingWbsData.VALUE;
							} else {
								payment.VALUE = "";
							}
						}
						return payment;
					});

					return {
						...element,
						CwsPaymentsDetails: updatedCwsPaymentsDetails.filter((subElement) => subElement.IS_DELETED !== "Y"),
						CwsWbsDataDetails: (element.CwsWbsDataDetails.results).filter((subElement) => subElement.IS_DELETED !== "Y"),
					};
				});
				var url = Config.dbOperations.paymentDetails;
				var token = this.AppModel.getProperty("/token");
				var oHeaders = {
					"Content-Type": "application/json",
					"Authorization": "Bearer" + " " + token
				};
				var dynamicData = this.generateData(oData);
				var result = {
					"root": dynamicData
				};
				var saveClaimModel = new JSONModel();
				saveClaimModel.loadData(url, JSON.stringify(result), true, "POST", null, null, oHeaders);
				saveClaimModel.attachRequestCompleted(function (oResponse) {
					var oPaymentData = oResponse.getSource().getData().root;
					var mergedArray = data.map(item1 => {
						var matchingItem2 = oPaymentData.find(item2 => item2.REQUEST_ID === item1.REQUEST_ID);
						if (matchingItem2) {
							return {
								...item1,
								...matchingItem2
							};
						} else {
							return item1;
						}
					});
					this._fnHandleDataToExport(mergedArray);
				}, this);
			} else {

				data = oData;
				//Levy list
				var oLevyDesc = oLevy.reduce((map, obj) => {
					map[obj.CONFIG_KEY] = obj.REFERENCE_VALUE + "," + obj.CONFIG_VALUE;
					return map;
				}, {});
				data.forEach(obj => {
					if (oLevyDesc.hasOwnProperty(obj.PROPERTY_USAGE)) {
						var oValue = oLevyDesc[obj.PROPERTY_USAGE].split(",");
						obj.PROPERTY_USAGE = oValue[1];
						obj.PROPERTY_PERCENT = oValue[0];
					}
				});

				// submission type
				var oSubDesc = osubmission.reduce((map, obj) => {
					map[obj.CONFIG_KEY] = obj.CONFIG_VALUE;
					return map;
				}, {});
				data.forEach(obj => {
					if (oSubDesc.hasOwnProperty(obj.SUBMISSION_TYPE)) {
						obj.SUBMISSION_TYPE = oSubDesc[obj.SUBMISSION_TYPE];
					}
				});
				this._fnHandleDataToExport(data);
			}

		},
		_updateUlu: function (oData) {
			if (oData) {
				//to remove ULU duplicates					
				var uluList = [];
				var isUluRepeated;
				for (var i = 0; i < oData.results.length; i++) {
					var item = oData.results[i];
					var uluListItem = {};
					if (item.ULU_C === '') {
						continue;
					}
					uluListItem.ULU_C = item.ULU_C;
					uluListItem.ULU_T = item.ULU_T;
					uluListItem.FDLU_C = item.FDLU_C;
					uluListItem.FDLU_T = item.FDLU_T;
					isUluRepeated = '';
					if (i > 0) {
						for (var j = 0; j < uluList.length; j++) {
							if (item.ULU_C === uluList[j].ULU_C) {
								isUluRepeated = 'Y';
								break;
							}
						}
						if (isUluRepeated !== 'Y') {
							uluList.push(uluListItem);
						}
					} else {
						uluList.push(uluListItem);
					}
				}

				$.each(uluList, function (i, value) {
					uluList[i].Selected = false;
				});
				var oULUs = this.getUIControl("inpUluValueHelp").getTokens();
				// this.handleSearch('', 'ULU_C', 'ULU_T');
				if (oULUs && oULUs.length > 0) {
					uluList.forEach(function (item1) {
						var matchingItem = oULUs.find(function (item2) {
							return item1.ULU_C === item2.getProperty("key")
						});

						if (matchingItem) {
							item1.Selected = true;
						}
					});
				}

				this.AppModel.setProperty("/claimRequest/UluList", uluList);
				var oView = this.getView();
				if (!this._oDialogAddUlu) {
					this._oDialogAddUlu = Fragment.load({
						id: oView.getId(),
						name: "nus.edu.sg.coireport.view.subview.UluValueHelpDialog",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this._oDialogAddUlu.then(function (oDialog) {
					oDialog.setRememberSelections(false);
					oDialog.open();
				}.bind(this));
			}
		},
		_updateStatusConfig: function (oData) {
			if (oData) {
				//to remove duplicate status description
				var aStatusDescListSet = [];
				if (oData.results && oData.results.length) {
					for (var i = 0; i < oData.results.length; i++) {
						var statusDescListSetItem = {};
						var statusDescDuplicate = undefined;
						statusDescListSetItem.STATUS_CODE = oData.results[i].STATUS_CODE;
						statusDescListSetItem.STATUS_ALIAS = oData.results[i].STATUS_ALIAS;
						if (i === 0) {
							aStatusDescListSet.push(statusDescListSetItem);
						} else {
							// var statusDescDuplicate;
							for (var k = 0; k < aStatusDescListSet.length; k++) {
								if (statusDescListSetItem.STATUS_ALIAS === aStatusDescListSet[k].STATUS_ALIAS) {
									statusDescDuplicate = 'Y';
									break;
								}
							}
							if (!statusDescDuplicate) {
								aStatusDescListSet.push(statusDescListSetItem);
							}
						}
					}
				}
				$.each(aStatusDescListSet, function (i, value) {
					aStatusDescListSet[i].Selected = false;
				});
				var oStatus = this.getUIControl("inpClaimStatus").getTokens();
				if (oStatus && oStatus.length > 0) {
					aStatusDescListSet.forEach(function (item1) {
						var matchingItem = oStatus.find(function (item2) {
							return item1.STATUS_CODE === item2.getProperty("key")
						});

						if (matchingItem) {
							item1.Selected = true;
						}
					});
				}

				this.AppModel.setProperty("/claimRequest/statusList", aStatusDescListSet);
				this.AppModel.setProperty("/claimRequest/fullStatusList", oData.results);

				var oView = this.getView();
				if (!this._oDialogStatus) {
					this._oDialogStatus = Fragment.load({
						id: oView.getId(),
						name: "nus.edu.sg.coireport.view.subview.StatusValueHelpDialog",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this._oDialogStatus.then(function (oDialog) {
					oDialog.open();
				}.bind(this));
			}
		},

		_updateRequestType: function (oData, oEvt) {
			if (oData) {
				var filteredArray = oData.results;
				$.each(filteredArray, function (i, value) {
					filteredArray[i].Selected = false;
				});
				var oClaims = this.getUIControl("inpRqstTypeValueHelp").getTokens();
				if (oClaims && oClaims.length > 0) {
					filteredArray.forEach(function (item1) {
						var matchingItem = oClaims.find(function (item2) {
							return item1.CONFIG_KEY === item2.getProperty("key")
						});

						if (matchingItem) {
							item1.Selected = true;
						}
					});
				}
				this.AppModel.setProperty("/lkSelection/requestTypeList", filteredArray);
				if (oEvt) {
					var oView = this.getView();
					if (!this._oDialogAddClaimType) {
						this._oDialogAddClaimType = Fragment.load({
							id: oView.getId(),
							name: "nus.edu.sg.coireport.view.subview.RequestTypeValueHelpDialog",
							controller: this
						}).then(function (oDialog) {
							oView.addDependent(oDialog);
							return oDialog;
						});
					}
					this._oDialogAddClaimType.then(function (oDialog) {
						oDialog.setRememberSelections(false);
						oDialog.open();
					}.bind(this));
				}
			}
		},

		_updateStaffNameSearchVal: function (sValue) {

			var sReturnValue,
				aReturnVal = sValue.split(" "),
				i = 1;
			sReturnValue = aReturnVal[0][0].toUpperCase() + aReturnVal[0].substring(1, (aReturnVal[0].length)).toLowerCase();
			while (i < aReturnVal.length) {
				sReturnValue = sReturnValue + " " + aReturnVal[i][0].toUpperCase() + aReturnVal[i].substring(1, (aReturnVal[i].length)).toLowerCase();
				i++;
			}
			return sReturnValue;
		},

		_updateFdlu: function (oData, selectedItemsUlu) {
			if (oData) {
				//to remove ULU duplicates					
				var fdluList = [];
				var isFdluRepeated;
				if (!!!selectedItemsUlu || selectedItemsUlu.length === 0) {
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];
						var fdluListItem = {};
						if (item.ULU_C === '') {
							continue;
						}
						if (item.FDLU_C === '') {
							continue;
						}
						fdluListItem.FDLU_C = item.FDLU_C;
						fdluListItem.FDLU_T = item.FDLU_T;
						isFdluRepeated = '';
						if (i > 0) {
							for (var j = 0; j < fdluList.length; j++) {
								if (item.FDLU_C === fdluList[j].FDLU_C) {
									isFdluRepeated = 'Y';
									break;
								}
							}
							if (isFdluRepeated !== 'Y') {
								fdluList.push(fdluListItem);
							}
						} else {
							fdluList.push(fdluListItem);
						}
					}
				} else if (selectedItemsUlu.length > 0) {
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];
						var fdluListItem = {};
						if (item.ULU_C === '') {
							continue;
						}
						if (item.FDLU_C === '') {
							continue;
						}
						for (var k = 0; k < selectedItemsUlu.length; k++) {
							if (item.ULU_C === selectedItemsUlu[k].getProperty("key")) {
								fdluListItem.FDLU_C = item.FDLU_C;
								fdluListItem.FDLU_T = item.FDLU_T;
								isFdluRepeated = '';
								if (i > 0) {
									for (var j = 0; j < fdluList.length; j++) {
										if (item.FDLU_C === fdluList[j].FDLU_C) {
											isFdluRepeated = 'Y';
											break;
										}
									}
									if (isFdluRepeated !== 'Y') {
										fdluList.push(fdluListItem);
									}
								} else {
									fdluList.push(fdluListItem);
								}
							}
						}
					}

				}

				$.each(fdluList, function (i, value) {
					fdluList[i].Selected = false;
				});
				var oFDLUs = this.getUIControl("inpFdluValueHelp").getTokens();
				if (oFDLUs && oFDLUs.length > 0) {
					fdluList.forEach(function (item1) {
						var matchingItem = oFDLUs.find(function (item2) {
							return item1.FDLU_C === item2.getProperty("key")
						});

						if (matchingItem) {
							item1.Selected = true;
						}
					});
				}

				this.AppModel.setProperty("/claimRequest/fdluList", fdluList);
				var oView = this.getView();
				if (!this._oDialogAddFdlu) {
					this._oDialogAddFdlu = Fragment.load({
						id: oView.getId(),
						name: "nus.edu.sg.coireport.view.subview.FdluValueHelpDialog",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this._oDialogAddFdlu.then(function (oDialog) {
					oDialog.setRememberSelections(false);
					oDialog.open();
				}.bind(this));
			}
		},
		_fnHandleDataToExport: function (aData, key) {
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyyMMddhhmmss"
			}),
				date = oDateFormat.format(new Date()),
				aCols, aProducts, oSettings, oSheet,
				oTabkey = this.AppModel.getProperty("/oTabKey"),
				oName = (oTabkey === "opwn") ? "COI_OPWN_REPORT" : "COI_CW_NED_REPORT",
				oDataSource, sortedArray;
			aCols = (oTabkey === "opwn") ? this.createColumnConfigOPWN() : this.createColumnConfig();
			oDataSource = (oTabkey === "opwn") ? this.generateLineItemOPWN(aData, key) : this.generateLineItem(aData);

			sortedArray = oDataSource.sort((a, b) => {
				if (a.STAFF_ID !== b.STAFF_ID) {
					return a.STAFF_ID - b.STAFF_ID;
				} else if (a.REQUEST_ID !== b.REQUEST_ID) {
					return a.REQUEST_ID - b.REQUEST_ID;
				} else if (a.PAYMENT_ID !== b.PAYMENT_ID) {
					return a.PAYMENT_ID - b.PAYMENT_ID;
				} else if (a.PAYMENT_DATE !== b.PAYMENT_DATE) {
					return new Date(a.PAYMENT_DATE) - new Date(b.PAYMENT_DATE);
				} else {
					return a.SUBMITTED_ON_TS - b.SUBMITTED_ON_TS;
				}
			});

			oSettings = {
				workbook: {
					columns: aCols,
					context: {
						sheetName: this.getI18n(oName) + "Details"
					}
				},
				dataSource: sortedArray,
				fileName: this.getI18n(oName) + "_" + date + ".xlsx"
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					this.hideBusyIndicator();
					MessageToast.show(this.getI18n(oName) + ' exported successfully.');
				}.bind(this))
				.finally(function () {
					oSheet.destroy();
				});
		},

		generateLineItem: function (dataArray) {

			var oView = this;
			dataArray = dataArray.map((element) => {
				return {
					...element,
					CwsPaymentsDetails: (element.CwsPaymentsDetails.results).filter((subElement) => subElement.IS_DELETED !== "Y")
				}
			});

			var spreadsheetData = dataArray.flatMap(data => {
				const baseData = {
					"STAFF_ID": data.STAFF_ID,
					"FULL_NM": data.FULL_NM,
					"ULU_C": data.ULU_C,
					"ULU_T": data.ULU_T,
					"FDLU_C": data.FDLU_C,
					"FDLU_T": data.FDLU_T,
					"REQUEST_ID": data.REQUEST_ID,
					"SUBMISSION_TYPE": data.SUBMISSION_TYPE,
					"PROCESS_TITLE": data.PROCESS_TITLE,
					"SUB_TYPE_T": data.SUB_TYPE_T,
					"START_DATE": data.START_DATE,
					"END_DATE": data.END_DATE,
					"DURATION_DAYS": data.DURATION_DAYS,
					"CLIENT_NAME": data.CLIENT_NAME,
					"CLIENT_LOCATION": data.LOCATION === "L" ? "Local" : data.LOCATION === "O" ? "Overseas" : "",
					"WORK_DETAILS": data.WORK_DETAILS,
					"STATUS_ALIAS": data.STATUS_ALIAS
				};

				if (data.CwsPaymentsDetails && data.CwsPaymentsDetails.length > 0) {
					let aRemunerationList = this.AppModel.getProperty("/remunerationList"); //Added Remuneration list CCEV3364
					return data.CwsPaymentsDetails.map(payment => {
						const mergedDataArray = [],
							aPaymentDate = payment.PAYMENT_TYPE === 'R' ? oView.formatTimestamp(payment.PAYMENT_DATE).split(" ") : [];
						mergedDataArray.push({
							...baseData,
							"YEAR": payment.PAYMENT_TYPE === 'A' ? payment.YEAR : '',
							"REMUNERATION_TYPE": payment.PAYMENT_TYPE === 'A' ? aRemunerationList.find(obj1 => obj1.CONFIG_KEY ===
								payment.REMUNERATION_TYPE) ? aRemunerationList.find(obj1 => obj1.CONFIG_KEY ===
									payment.REMUNERATION_TYPE).CONFIG_VALUE : '' : '',
							"CURRENCY": payment.PAYMENT_TYPE === 'A' ? payment.CURRENCY : '',
							"AMOUNT": payment.PAYMENT_TYPE === 'A' ? payment.AMOUNT : '',
							"AGREED_QNTY": payment.PAYMENT_TYPE === 'A' ? (payment.STOCK_OPTION_QNTY ? payment.STOCK_OPTION_QNTY : (payment.STOCK_QNTY ?
								payment.STOCK_QNTY :
								(payment.SHARES ? payment.SHARES : ""))) : "",
							"UNIT_TYPE": payment.PAYMENT_TYPE === 'A' ? (payment.UNIT_TYPE === "" ? "" : (payment.UNIT_TYPE === 'P' ? "Percentage" :
								"")) : "",
							"DESCRIPTION": payment.PAYMENT_TYPE === 'A' ? payment.DESCRIPTION : '',
							"BIZ_EXP_AMT": payment.BIZ_EXP_AMT,
							"LEVY_AMOUNT": payment.LEVY_AMOUNT,
							"IS_WAIVED": payment.IS_WAIVED === 'Y' ? 'Yes' : 'No',
							"R_DESCRIPTION": payment.PAYMENT_TYPE === 'R' ? payment.DESCRIPTION : '',
							"R_AMOUNT": payment.PAYMENT_TYPE === 'R' ? payment.AMOUNT : '',
							"R_CURRENCY": payment.PAYMENT_TYPE === 'R' ? payment.CURRENCY : '',
							"R_YEAR": payment.PAYMENT_TYPE === 'R' ? payment.YEAR : '',
							"R_QTY": payment.PAYMENT_TYPE === 'R' ? (payment.STOCK_OPTION_QNTY ? payment.STOCK_OPTION_QNTY : (payment.STOCK_QNTY ?
								payment.STOCK_QNTY :
								(payment.SHARES ? payment.SHARES : ""))) : "",
							"R_REMUNERATION_TYPE": payment.PAYMENT_TYPE === 'R' ? aRemunerationList.find(obj1 => obj1.CONFIG_KEY ===
								payment.REMUNERATION_TYPE) ? aRemunerationList.find(obj1 => obj1.CONFIG_KEY ===
									payment.REMUNERATION_TYPE).CONFIG_VALUE : '' : '',
							"PAYMENT_REF_NO": payment.PAYMENT_REF_NO,
							"PAYMENT_DATE": payment.PAYMENT_TYPE === 'R' ? aPaymentDate[0] + " " + aPaymentDate[1] + " " + aPaymentDate[2] : "",
							"INVOICE_NO": payment.PAYMENT_TYPE === 'R' ? payment.INVOICE_NO : "",
							"LEVY_STATUS": payment.PAYMENT_TYPE === 'R' ? Formatter.displayLevyStatus(payment.IS_WAIVED, payment.INVOICE_NO, payment.CLR_DOC_NO) : "",
							"R_UNIT_TYPE": payment.PAYMENT_TYPE === 'R' ? (payment.UNIT_TYPE === "" ? "" : (payment.UNIT_TYPE === 'P' ?
								"Percentage" :
								"")) : "",
							"PAYMENT_ID": payment.PAYMENT_ID.slice(4) //Added payment_id for sorting
						});
						return mergedDataArray;
					});
				} else {
					return [baseData];
				}
			});
			return spreadsheetData.flat();
		},

		generateLineItemOPWN: function (dataArray, key) {
			var oView = this;
			var total, oMonth, AdminFee, MonthArray, propPercent, paymentRecords;
			var spreadsheetData = dataArray.flatMap(data => {
				var total = 0;
				MonthArray = [];
				paymentRecords = data.CwsPaymentsDetails;
				if (data.CwsPaymentsDetails.length > 0) {
					paymentRecords = this.fnFilterPaymentMonth(data.CwsPaymentsDetails, MonthArray);
				}
				const baseData = {
					"STAFF_ID": data.STAFF_ID,
					"FULL_NM": data.FULL_NM,
					"ULU_C": data.ULU_C,
					"ULU_T": data.ULU_T,
					"FDLU_C": data.FDLU_C,
					"FDLU_T": data.FDLU_T,
					"REQUEST_ID": data.REQUEST_ID,
					"SUBMISSION_TYPE": data.SUBMISSION_TYPE,
					"PROCESS_TITLE": data.PROCESS_TITLE,
					"REQUEST_TYPE": data.REQUEST_TYPE,
					"SUB_TYPE_T": data.SUB_TYPE_T,
					"AMOUNT_S": data.AMOUNT,
					"START_DATE": data.START_DATE,
					"END_DATE": data.END_DATE,
					"DURATION_DAYS": data.DURATION_DAYS,
					"ULU_T": data.ENG_ULU_T,
					"FDLU_T": data.ENG_FDLU_T,
					"CLIENT_LOCATION": data.LOCATION === "L" ? "Local" : data.LOCATION === "O" ? "Overseas" : "",
					"PROGRAM_NAME": data.PROGRAM_NAME,
					"WORK_DETAILS": data.WORK_DETAILS,
					"PROPERTY_USAGE": data.PROPERTY_USAGE,
					"IS_WAIVED": data.IS_WAIVED === 'Y' ? 'Yes' : 'No',
					"TOTAL_AMOUNT": data.AMOUNT,
					"SUBMITTED_ON_TS": oView.formatTimestamp(data.SUBMITTED_ON_TS),
					"SUBMITTED_BY_FULLNAME": data.SUBMITTED_BY_FULLNAME,
					"STATUS_ALIAS": data.STATUS_ALIAS,
					"TASK_COMPLETED_FULL_NM": data.TASK_COMPLETED_FULL_NM, //CW0141 - Bug Fix
					"TASK_ACTUAL_DOC": data.TASK_ACTUAL_DOC, //CW0141 - Bug Fix
					"OFFLINE_APPROVAL": data.OFFLINE_APPROVAL,
					"MODIFIED_ON": (data.MIGRATED) ? oView.formatTimestamp(data.SUBMITTED_ON_TS) : (data.REQUEST_STATUS === "38" || data.REQUEST_STATUS ===
						"48") ? oView.formatTimestamp(data.MODIFIED_ON) : "",
					"MODIFIED_BY": (data.MIGRATED) ? data.SUBMITTED_BY_FULLNAME : (data.REQUEST_STATUS === "38" || data.REQUEST_STATUS === "48") ?
						data.MODIFIED_BY_FULLNAME : "",
					"WBS": "",
					"VALUE": "",
					"STATUS_ALIAS": data.STATUS_ALIAS
				};

				baseData.WBS = "";
				baseData.VALUE = "";
				baseData.AMOUNT = 0;

				var wbsMap = {};
				var oMonthMap = {};
				jQuery.sap.each(paymentRecords, function (pK, pV) {
					wbsMap[pV.WBS] = pV.WBS;
					baseData.AMOUNT += parseFloat(pV.AMOUNT) || 0;
					oMonthMap[pV.MONTH + "," + pV.YEAR] = pV.MONTH + "," + pV.YEAR;
				});

				baseData.AMOUNT = (baseData.AMOUNT).toFixed(2) || 0;

				if (Object.keys(wbsMap).length > 0) {
					jQuery.sap.each(data.CwsWbsDataDetails, function (wK, wV) {
						if (wbsMap[wV.WBS_CODE]) {
							wbsMap[wV.WBS_CODE] = wV.VALUE;
						}
					});

					jQuery.sap.each(wbsMap, function (mK, mV) {
						baseData.WBS += mK + ";";
						baseData.VALUE += parseFloat(mV) + "%" + ";";
					});
					baseData.WBS = baseData.WBS.substring(0, baseData.WBS.length - 1);
					baseData.VALUE = baseData.VALUE.substring(0, baseData.VALUE.length - 1);
				}

				var mergedDataArray = [];
				var oPayment = key === "isPaid" ? data.paymentList : data.paymentList;

				if (oPayment && oPayment.length > 0) {
					for (const payment of oPayment) {
						const mergedData = {
							...baseData,
							"MONTH": oView.displayMonth(payment.MONTH, payment.YEAR),
							"AMOUNT": payment.AMOUNT,
							"STATUS": payment.PAYMENT_REQ_STATUS_ALIAS,
							"PAYMENT_TYPE": payment.PAYMENT_TYPE_ALIAS,
							"BALANCE_AMOUNT": payment.BALANCE_AMOUNT,
							"PAID_AMOUNT": payment.PAID_AMOUNT,
						};
						mergedDataArray.push(mergedData);
					}
					return mergedDataArray;
				} else {
					return [baseData];
				}
			});

			return spreadsheetData.flat();
		}

	});
});