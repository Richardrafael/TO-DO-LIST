sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/base/strings/formatMessage"
], (Device, Controller, Filter, FilterOperator, JSONModel, formatMessage) => {
	"use strict"

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		onInit() {
			this.aSearchFilters = [];
			this.aTabFilters = [];
			// this.getView().setModel(new JSONModel({

			// }), "view");

			const oData = {
				"ProductCollection": [
					{
						"cDtypePriority": "M",
						"Name": "Média"
					},
					{
						"cDtypePriority": "A",
						"Name": "Alta"
					},
					{
						"cDtypePriority": "B",
						"Name": "Baixa"
					}
				]
			}
			const oModel = new JSONModel(oData);
			this.getView().setModel(oModel, 'view');

		},
		getModel() {
			return this.getView().getModel();
		},
		onPress() {
			const oModel = this.getModel();
			const task = oModel.getProperty("/newTask");
			const tpPriority = oModel.getProperty("/newTpPriority");
			const dateDelivery = oModel.getProperty("/dateDelivery");
			const aTodos = this.getTodos().map((oTodo) => Object.assign({}, oTodo));
			aTodos.push({
				task: task,
				TpPriority: tpPriority,
				date: dateDelivery,
				completed: false
			});

			oModel.setProperty("/todos", aTodos);
			oModel.setProperty("/newTask", "");
			oModel.setProperty("/newTpPriority", "");
			oModel.setProperty("/dateDelivery", "");
			console.log(aTodos)
			oModel.setProperty("/nagali", "0");
		},
		onClearCompleted() {
			const aTodos = this.getTodos().map((oTodo) => Object.assign({}, oTodo));
			this.removeCompletedTodos(aTodos);
			this.getModel().setProperty("/todos", aTodos);
		},
		removeCompletedTodos(aTodos) {
			let i = aTodos.length;
			while (i--) {
				const oTodo = aTodos[i];
				if (oTodo.completed) {
					aTodos.splice(i, 1);
				}
			}
		},
		getTodos() {
			const oModel = this.getModel();
			return oModel && oModel.getProperty("/todos") || [];
		},
		onUpdateItemsLeftCount() {
			const iItemsLeft = this.getTodos().filter((oTodo) => oTodo.completed !== true).length;
			this.getModel().setProperty("/itemsLeftCount", iItemsLeft);
		},
		onSearch(oEvent) {
			const oModel = this.getModel();
			this.aSearchFilters = [];
			this.sSearchQuery = oEvent.getSource().getValue();
			if (this.sSearchQuery && this.sSearchQuery.length > 0) {
				oModel.setProperty("/itemsRemovable", false);
				const filter = new Filter("task", FilterOperator.Contains, this.sSearchQuery);
				this.aSearchFilters.push(filter);
			} else {
				oModel.setProperty("/itemsRemovable", true);
			}
			this._applyListFilters();
		},

		onFilter(oEvent) {
			this.aTabFilters = [];
			this.sFilterKey = oEvent.getParameter("item").getKey();
			switch (this.sFilterKey) {
				case "active":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, false));
					break;
				case "completed":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, true));
					break;
				case "all":
				default:
			}
			this._applyListFilters();
		},

		_applyListFilters() {
			const oList = this.byId("todoList");
			const oBinding = oList.getBinding("items");

			oBinding.filter(this.aSearchFilters.concat(this.aTabFilters), "todos");

			const sI18nKey = this.getI18NKey(this.sFilterKey, this.sSearchQuery);

			this.byId("filterToolbar").setVisible(!!sI18nKey);
			if (sI18nKey) {
				this.byId("filterLabel").bindProperty("text", {
					path: sI18nKey,
					model: "i18n",
					formatter: (textWithPlaceholder) => {
						return formatMessage(textWithPlaceholder, [this.sSearchQuery]);
					}
				});
			}
		},

		getI18NKey(sFilterKey, sSearchQuery) {
			if (!sFilterKey || sFilterKey === "all") {
				return sSearchQuery ? "ITEMS_CONTAINING" : undefined;
			} else if (sFilterKey === "active") {
				return "ACTIVE_ITEMS" + (sSearchQuery ? "_CONTAINING" : "");
			} else {
				return "COMPLETED_ITEMS" + (sSearchQuery ? "_CONTAINING" : "");
			}
		}
	});

});

