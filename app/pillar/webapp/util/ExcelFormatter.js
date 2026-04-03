sap.ui.define([], () => {
    "use strict";

    const EXPECTED_COLUMNS = [
        "Asset","SNo","AssetClass","CapitalizedOn","DeactDate","Use",
        "AssetDescription","BSAcctAPC","Retirement","DeprRetired",
        "RetBookValue","RetRevenue","Loss","Gain","Crcy","TType",
        "Document","Text","Reference","InvoiceID"
    ];

    const get = (arr, idx) => (arr[idx] || "").trim();

    function cleanNumber(val) {
        if (!val || String(val).trim() === "") return "0,00";
        return String(val).trim();
    }

    function parseSAPFile(text) {
        const lines = text.split(/\r?\n/);
        const rows  = [];
        let i = 0;

        // Skip to first data line (empty first col, number in second col)
        while (i < lines.length) {
            const cols = lines[i].split("\t");
            if (cols[0].trim() === "" && cols.length > 1 && /^\d+$/.test(cols[1].trim())) {
                break;
            }
            i++;
        }

        while (i < lines.length) {
            const c1 = (lines[i]     || "").split("\t");
            const c2 = (lines[i + 1] || "").split("\t");

            const asset = c1[1] ? c1[1].trim() : "";
            if (!asset || !/^\d+$/.test(asset)) { i++; continue; }

            const text = get(c2, 7);

            // Reference: col[14] if line2 is wide enough, else extract SD+number from Text
            let reference = "";
            if (c2.length >= 15 && get(c2, 14)) {
                reference = get(c2, 14);
            } else {
                const sdMatch = text.match(/SD\s*(\d[\d\-]+)/);
                reference = sdMatch ? sdMatch[1] : "";
            }

            rows.push({
                Asset:            get(c1, 1),
                SNo:              get(c1, 3),
                AssetClass:       get(c1, 6),
                CapitalizedOn:    get(c1, 9),
                DeactDate:        get(c1, 11),
                Use:              get(c1, 12),
                AssetDescription: get(c1, 13),
                BSAcctAPC:        get(c1, 16),
                Retirement:       cleanNumber(get(c1, 17)),
                DeprRetired:      cleanNumber(get(c1, 18)),
                RetBookValue:     cleanNumber(get(c1, 19)),
                RetRevenue:       cleanNumber(get(c1, 20)),
                Loss:             cleanNumber(get(c1, 21)),
                Gain:             cleanNumber(get(c1, 22)),
                Crcy:             get(c1, 23),
                TType:            get(c2, 1),
                Document:         get(c2, 2),
                Text:             text,
                Reference:        reference,
                InvoiceID:        ""
            });

            i += 3; // line1 + line2 + blank line
        }

        return rows;
    }

    return {

        parseAndFormat(arrayBuffer) {
            const XLSX = window.XLSX;
            if (!XLSX) throw new Error("SheetJS library not loaded. Check index.html.");

            const uint8   = new Uint8Array(arrayBuffer);
            const isUTF16 = (uint8[0] === 0xFF && uint8[1] === 0xFE) ||
                            (uint8[0] === 0xFE && uint8[1] === 0xFF);

            if (isUTF16) {
                // SAP UTF-16 tab-delimited export
                const text = new TextDecoder("utf-16").decode(arrayBuffer);
                const rows = parseSAPFile(text);
                if (!rows.length) throw new Error("No data rows found in file.");
                return rows;
            }

            // Standard xlsx/xls fallback via SheetJS
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheet    = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows  = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (!rawRows.length) throw new Error("Excel file is empty.");
            return rawRows;
        },

        exportToExcel(rows, filename) {
            const XLSX = window.XLSX;
            if (!XLSX) throw new Error("SheetJS library not loaded.");
            const ws = XLSX.utils.json_to_sheet(rows, { header: EXPECTED_COLUMNS });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pillar2");
            XLSX.writeFile(wb, filename);
        }
    };
});