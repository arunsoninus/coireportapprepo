sap.ui.define(
	function () {
		return {
			displayLevyStatus: function (sIsWaived, iInvoiceNo, iClrDocNo) {
				var sLevyStatus = "";
				if (sIsWaived === "Y") {
					sLevyStatus = "Not Applicable";
				} else if (!iInvoiceNo) {
					sLevyStatus = "Pending posting to Finance System (FS2)";
				} else if (iInvoiceNo && !iClrDocNo) {
					sLevyStatus = "Posted to Finance System (FS2)";
				} else if (iInvoiceNo && iClrDocNo) {
					sLevyStatus = "Paid";
				} else {
					sLevyStatus = "";
				}
				return sLevyStatus;
			},
			/**
			 * Formatter for handling the Extraction Type
			 */
			isSelectedExtractionType: function (bOfflineAccess, sCurrentValue, sExpectedValue) {
				return Boolean(!!bOfflineAccess && (sCurrentValue === sExpectedValue));
			},
			/*
			 * Format Date as String
			 */
			formatDateAsString: function (dateValue, format, isYearFormat, localData) {
				var response = "";
				if (dateValue && dateValue !== "NA" && dateValue !== "/Date(0)/") {
					if (dateValue) {
						if (typeof (dateValue) === "string" && dateValue.indexOf("/Date") > -1) {
							dateValue = parseFloat(dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1));
						}
						dateValue = new Date(dateValue);
					}

					if (dateValue) {
						var yyyy = dateValue.getFullYear() + "";
						var tempDateStr = new Date().getFullYear();
						if (isYearFormat && isYearFormat != 'false' && (parseInt(yyyy) < tempDateStr)) {
							yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
						}
						var mm = (dateValue.getMonth() + 1) + "";
						mm = (mm.length > 1) ? mm : "0" + mm;
						var dd = dateValue.getDate() + "";
						dd = (dd.length > 1) ? dd : "0" + dd;

						var hh, mins, secs;

						switch (format) {
						case "yyyyMMdd":
							response = yyyy + mm + dd;
							break;
						case "dd/MM/yyyy":
							response = dd + "/" + mm + "/" + yyyy;
							break;
						case "yyyy-MM-dd":
							response = yyyy + "-" + mm + "-" + dd;
							break;
						case "yyyy-dd-MM":
							response = yyyy + "-" + dd + "-" + mm;
							break;
						case "MM/dd/yyyy":
							response = mm + "/" + dd + "/" + yyyy;
							break;
						case "MM/yyyy":
							response = mm + "/" + yyyy;
							break;
						case "yyyy-MM-ddThh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
							break;
						case "yyyy-MM-dd hh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mins + ":" + secs;
							break;
						case "hh:MM:ss":
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = hh + ":" + mins + ":" + secs;
							break;
						case "dd/MM/yyyy hh:MM:ss":
							response = dd + "/" + mm + "/" + yyyy + " ";
							hh = dateValue.getHours() + "";
							hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response += hh + ":" + mins + ":" + secs;
							break;
						case "dd/MM/yyyy hh:MM:ss aa":
							response = dd + "/" + mm + "/" + yyyy + " ";
							hh = dateValue.getHours();
							var ampm = (hh >= 12) ? 'PM' : 'AM';
							hh = hh % 12;
							hh = (hh ? (hh < 10 ? "0" + hh : hh) : 12);
							// hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response += hh + ":" + mins + ":" + secs + " " + ampm;
							break;
						case "dd Mmm,yyyy":
							response = mm + "/" + dd + "/" + yyyy + " ";
							mm = localData[Number(mm) - 1].substring(0, 3);
							hh = dateValue.getHours();
							var ampm = (hh >= 12) ? 'PM' : 'AM';
							hh = hh % 12;
							hh = (hh ? (hh < 10 ? "0" + hh : hh) : 12);
							// hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = dd + " " + mm + "," + yyyy;
							break;
						case "dd Mmm yyyy":
							response = mm + "/" + dd + "/" + yyyy + " ";
							mm = localData[Number(mm) - 1].substring(0, 3);
							hh = dateValue.getHours();
							var ampm = (hh >= 12) ? 'PM' : 'AM';
							hh = hh % 12;
							hh = (hh ? (hh < 10 ? "0" + hh : hh) : 12);
							// hh = (hh.length > 1) ? hh : "0" + hh;
							mins = dateValue.getMinutes() + "";
							mins = (mins.length > 1) ? mins : "0" + mins;
							secs = dateValue.getSeconds() + "";
							secs = (secs.length > 1) ? secs : "0" + secs;
							response = dd + " " + mm + " " + yyyy;
							break;
						default:
							response = dateValue;
							break;
						}
					}
				}
				return response;
			},
			createCwNedColumnConfig: function (EdmType, isLive) {
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
					label: "Start Date",
					property: 'START_DATE',
					type: EdmType.String
				}, {
					label: "End Date",
					property: 'END_DATE',
					type: EdmType.String
				}, {
					label: "Actual Days",
					type: EdmType.String,
					property: 'DURATION_DAYS'
				}, {
					label: "Client Name",
					type: EdmType.String,
					property: 'CLIENT_NAME'
				}, {
					label: "Client Location",
					type: EdmType.String,
					property: 'LOCATION'
				}, {
					label: "Details of Work",
					type: EdmType.String,
					property: 'WORK_DETAILS'
				}, {
					label: "Agreed Payment - Year",
					property: 'YEAR'
				}, {
					label: "Agreed Payment - Remuneration Type",
					type: EdmType.String,
					property: 'REMUNERATION_TYPE'
				}, {
					label: "Agreed Payment - Currency",
					type: EdmType.String,
					property: 'CURRENCY'
				}, {
					label: "Agreed Payment - Amount",
					width: "30%",
					property: 'AMOUNT',
					type: EdmType.Number,
					scale: 2
				}, {
					label: "Agreed Payment - Stock / Shares",
					width: "25%",
					property: "AGREED_QNTY"
				}, {
					label: "Agreed Payment - Unit Type for Stock / Shares",
					width: "25%",
					property: 'UNIT_TYPE'
				}, {
					label: "Agreed Payment - Description",
					property: 'DESCRIPTION'
				}, {
					label: "Agreed Payment - Business Expense Currency",
					type: EdmType.String,
					property: 'CURRENCY'
				}, {
					label: "Business Expenses Amount",
					property: 'BIZ_EXP_AMT',
					type: EdmType.Number,
					scale: 2
				}, {
					label: "Received Payment - Currency",
					property: 'R_CURRENCY'
				}, {
					label: "Received Payment Amount",
					property: 'R_AMOUNT',
					type: EdmType.Number,
					scale: 2
				}, {
					label: "Received Payment - Unit Type for Stock / Shares",
					property: 'R_UNIT_TYPE'
				}, {
					label: "Received Payment - Description",
					property: 'R_DESCRIPTION'
				}, {
					label: "Levy Amount",
					property: 'LEVY_AMOUNT',
					type: EdmType.Number,
					scale: 2
				}, {
					label: "Waiver",
					property: 'IS_WAIVED'
				}, {
					label: "Received Payment - Payment Reference No.",
					property: 'PAYMENT_REF_NO'
				}, {
					label: "Received Payment - Payment Date",
					property: 'PAYMENT_DATE',
					width: "20%"
				}, {
					label: "Levy Status",
					property: 'LEVY_STATUS',
					type: EdmType.String,
					width: "40%"
				}, {
					label: "Levy Invoice No.",
					property: 'INVOICE_NO',
					type: EdmType.String,
					width: "40%"
				}, {
					label: "Request Status",
					property: 'STATUS_ALIAS',
					width: "20%",
					type: EdmType.String
				}];
			},

			createColumnConfigOpwn: function (EdmType, isLive) {
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
					width: "20%"
				}, {
					label: "End Date",
					property: 'END_DATE',
					width: "20%"
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
					property: 'LOCATION'
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
					property: 'STATUS_ALIAS',
					type: EdmType.String
				}];

			}
		};
	});