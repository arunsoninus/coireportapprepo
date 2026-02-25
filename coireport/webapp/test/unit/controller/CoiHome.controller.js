/*global QUnit*/

sap.ui.define([
	"nus/edu/sg/coireport/controller/CoiHome.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CoiHome Controller");

	QUnit.test("I should test the CoiHome controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
