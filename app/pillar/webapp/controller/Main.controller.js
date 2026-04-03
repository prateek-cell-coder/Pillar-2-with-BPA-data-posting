sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "com/bosch/pillar/pillar/util/ExcelFormatter"
], (Controller, JSONModel, MessageToast, MessageBox, ExcelFormatter) => {
    "use strict";

    return Controller.extend("com.bosch.pillar.pillar.controller.Main", {

        onInit() {
            this.getView().setModel(new JSONModel({ rows: [] }), "tableModel");

            // Native hidden file input — avoids sap.ui.unified.FileUploader issues
            const oInput  = document.createElement("input");
            oInput.type   = "file";
            oInput.accept = ".xlsx,.xls";
            oInput.style.display = "none";
            oInput.id     = "__pillarFileInput";
            oInput.addEventListener("change", this._onNativeFileChange.bind(this));
            document.body.appendChild(oInput);
        },

        onUploadPress() {
            document.getElementById("__pillarFileInput").click();
        },

        _onNativeFileChange(oEvent) {
            const oFile = oEvent.target.files[0];
            if (!oFile) return;

            // Reset so same file can be re-uploaded
            oEvent.target.value = "";

            if (!oFile.name.endsWith(".xlsx") && !oFile.name.endsWith(".xls")) {
                MessageBox.error("Please upload a valid Excel file (.xlsx or .xls)");
                return;
            }

            const oReader = new FileReader();
            oReader.onload = (e) => {
                try {
                    const aRows = ExcelFormatter.parseAndFormat(e.target.result);
                    this.getView().getModel("tableModel").setProperty("/rows", aRows);
                    this.byId("uploadStatus").setVisible(true);
                    this.byId("uploadStatusText").setText(
                        `✔ "${oFile.name}" — ${aRows.length} rows formatted successfully.`
                    );
                    MessageToast.show(`${aRows.length} rows loaded and formatted!`);
                } catch (err) {
                    MessageBox.error("Failed to parse Excel: " + err.message);
                }
            };
            oReader.readAsArrayBuffer(oFile);
        },

        onExport() {
            const aRows = this.getView().getModel("tableModel").getProperty("/rows");
            if (!aRows || aRows.length === 0) {
                MessageToast.show("No data to export. Please upload a file first.");
                return;
            }
            ExcelFormatter.exportToExcel(aRows, "Pillar2_Formatted.xlsx");
            MessageToast.show("Export started!");
        },

        onTriggerProcessAutomation() {
            const oView        = this.getView();
            const sSystem      = oView.byId("systemSelect").getSelectedKey();
            const sCompanyCode = oView.byId("companyCode").getValue();

            if (!sSystem || !sCompanyCode) {
                MessageBox.warning("Please fill in System and Company Code before triggering.");
                return;
            }
            MessageToast.show("Process Automation Triggered!");
        },

        onExit() {
            const el = document.getElementById("__pillarFileInput");
            if (el) el.remove();
        }
    });
});