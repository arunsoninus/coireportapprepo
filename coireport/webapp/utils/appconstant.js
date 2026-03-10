sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		"cwVisible": false,
		"opwnVisible": false,
		"claimAuthorizations": [],
		"sClaimaintListUluFdlu": "",
		"lkSelection": {
			"UluList": [],
		},
		"claimRequest": {
			"statusList": [],
			"requestIdList": [],
			"fdluList": [],
			"staffList": []
		},
		"errorMessage": [],
		"token": null,
		"loggedInUserId": null,
		"loggedInUserInfo": {},
		"visibility": {},
		"userRole": null,
		"staffList": [],
		"claimsList": [],
		"otherAssignments": [],
		"sortingLookupData": [{
			"key": "REQUEST_ID",
			"selectedStatus": false,
			"text": "Request ID"
		}, {
			"key": "STAFF_ID",
			"selectedStatus": false,
			"text": "Staff ID"
		}, {
			"key": "FULL_NM",
			"selectedStatus": false,
			"text": "Staff Name"
		}, {
			"key": "START_DATE",
			"selectedStatus": false,
			"text": "Start Date"
		}, {
			"key": "END_DATE",
			"selectedStatus": false,
			"text": "End Date"
		}],
		"groupLookupData": [{
			"key": "REQUEST_ID",
			"selectedStatus": false,
			"text": "Request ID"
		}, {
			"key": "STAFF_ID",
			"selectedStatus": false,
			"text": "Staff ID"
		}, {
			"key": "FULL_NM",
			"selectedStatus": false,
			"text": "Staff Name"
		}, {
			"key": "START_DATE",
			"selectedStatus": false,
			"text": "Start Date"
		}, {
			"key": "END_DATE",
			"selectedStatus": false,
			"text": "End Date"
		}],
		offlineReportAccess : true,
		lastSyncResults : []
	};
});