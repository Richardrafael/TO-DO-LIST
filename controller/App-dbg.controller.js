sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/base/strings/formatMessage",
	"sap/ui/demo/todo/util/Helper",
	"sap/m/MessageToast"
], (Device, Controller, Filter, FilterOperator, JSONModel, formatMessage, Helper, MessageToast) => {
	"use strict"

	return Controller.extend("sap.ui.demo.todo.controller.App", {

		onInit() {
			this.formatter = Helper;
			this.aSearchFilters = [];
			this.aTabFilters = [];
			const oModel = new JSONModel();
			this.getView().setModel(oModel, 'view');

			// Update cards after initial data is loaded
			this.getOwnerComponent().getModel().dataLoaded().then(() => {
				this._updateCardData();
			});
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

		_updateCardData() {
			const oModel = this.getOwnerComponent().getModel();
			const aTodos = oModel.getProperty("/todos") || [];
			const itemsCount = oModel.getProperty("/itemsCount") || 0;
			const oViewModel = this.getView().getModel("view");

			let iOverdue = 0;
			let iToday = 0;
			let iTomorrow = 0;

			const oToday = new Date();
			oToday.setHours(0, 0, 0, 0);

			const oTomorrow = new Date(oToday);
			oTomorrow.setDate(oTomorrow.getDate() + 1);

			const oDayAfterTomorrow = new Date(oTomorrow);
			oDayAfterTomorrow.setDate(oDayAfterTomorrow.getDate() + 1);

			aTodos.forEach(oTodo => {
				if (!oTodo.completed) {
					const oDueDate = new Date(oTodo.date);
					oDueDate.setHours(0, 0, 0, 0);

					if (oDueDate.getTime() < oToday.getTime()) {
						iOverdue++;
					} else if (oDueDate.getTime() >= oToday.getTime() && oDueDate.getTime() < oTomorrow.getTime()) {
						iToday++;
					} else if (oDueDate.getTime() >= oTomorrow.getTime() && oDueDate.getTime() < oDayAfterTomorrow.getTime()) {
						iTomorrow++;
					}
				}
			});

			const oCardData = {
				overdue: { title: "Atrasadas", number: iOverdue, icon: "sap-icon://alert", iconColor: "Negative", subtitle: "Tarefas vencidas" },
				today: { title: "Para Hoje", number: iToday, icon: "sap-icon://calendar", iconColor: "Neutral", subtitle: "Tarefas a vencerem hoje" },
				tomorrow: { title: "Para Amanhã", number: iTomorrow, icon: "sap-icon://date-time", iconColor: "Positive", subtitle: "Tarefas para o próximo dia" }
			};
			oViewModel.setProperty("/cardData", oCardData);
			oViewModel.setProperty("/all", itemsCount);
			console.log(itemsCount)
		},

		getModel() {
			return this.getView().getModel();
		},
		onPress() {
			try {
				const oModel = this.getModel();
				const task = oModel.getProperty("/newTask");
				const tpPriority = oModel.getProperty("/newTpPriority");
				const dateDelivery = oModel.getProperty("/dateDelivery");

				if (!task) {
					MessageToast.show("Necesário informar uma Tarefa.");
					return;
				}
				if (!dateDelivery) {
					MessageToast.show("Necesário informar uma Data.");
					return;
				}
				if (!tpPriority) {
					MessageToast.show("Necesário informar um Tipo.");
					return;
				}
				const aTodos = this.getTodos().map((oTodo) => Object.assign({}, oTodo));
				console.log(tpPriority)
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
				MessageToast.show("Tarefa Adicionada");
				this._updateCardData();
			} catch (e) {
				console.log(e)
			}


		},
		// Controller
		formatDate: function (sDate) {
			if (!sDate) return "";
			const parts = sDate.split("/");

			// vem como 9/29/25 (MM/DD/YY)
			const month = parts[0].padStart(2, "0");  // 09
			const day = parts[1].padStart(2, "0");    // 29
			const year = parts[2].length === 2 ? "20" + parts[2] : parts[2]; // 2025

			// devolve como 29/09/2025
			return `${day}/${month}/${year}`;
		},


		onClearCompleted() {
			const aTodos = this.getTodos().map((oTodo) => Object.assign({}, oTodo));
			this.removeCompletedTodos(aTodos);
			this.getModel().setProperty("/todos", aTodos);
			this._updateCardData();
		},
		// removeCompletedTodos(aTodos) {
		// 	let i = aTodos.length;
		// 	while (i--) {
		// 		const oTodo = aTodos[i];
		// 		if (oTodo.completed) {
		// 			aTodos.splice(i, 1);
		// 		}
		// 	}
		// },
		getTodos() {
			const oModel = this.getModel();
			return oModel && oModel.getProperty("/todos") || [];
		},
		onUpdateItemsLeftCount() {
			const iItemsLeft = this.getTodos().filter((oTodo) => oTodo.completed !== true).length;
			this.getModel().setProperty("/itemsLeftCount", iItemsLeft);
			this._updateCardData();
		},
		onDeleteItem(oEvent) {
			const oModel = this.getModel();
			const aTodos = oModel.getProperty("/todos");
			const sPath = oEvent.getSource().getBindingContext().getPath();
			const iIndex = parseInt(sPath.split("/").pop(), 10);

			aTodos.splice(iIndex, 1);
			oModel.setProperty("/todos", aTodos);

			this._updateCardData();
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

