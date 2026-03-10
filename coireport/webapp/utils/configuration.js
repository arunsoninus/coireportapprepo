sap.ui.define([],
	function () {

		return {
			getRandomNumber: function () {
				return Math.floor(Math.random() * Math.floor(5));
			},
			taskOperations: {},
			gwTaskOperations: {},
			sfOperations: {},
			processOperations: {},
			dbOperations: {
				userDetails: "/getUserDetails()",
				photoApi: "/getPhoto",
				cwsRequestViewApi : "/cwsRequestViews",
				taskProcessHistory: "/rest/inbox/getProcessTrackerDetails?draftId=",
				taskProcessHistoryNew: "/getProcessTrackerForNewNChangeRequests",
				statusConfigs: "/statusconfig_data",
				userLookups : "/v_user_lookup",
				chrsJobInfo: "/v_active_inactive_user_lookup",
				approverMatrixView : "/v_approval_maxtrix",
				checkWbs: "/ecpwbsvalidate",
				cwsAppConfigs: "/cwsappconfig_data",
				appConfigs : "/appconfig_data",
				paymentDetails:"/retrieveMassPaymentList",
				fdluulu_datas : "/fdluulu_data"
			}

		};
	});