sap.ui.define([
	"nus/edu/sg/coireport/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("nus.edu.sg.coireport.controller.NotFound", {

		onInit: function () {

		},
		onNavBack: function(){
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.navTo("RouteTask",true);
		}

	});

});
