
// 1. Open your Google Sheet.
// 2. Create a NEW tab named "Callbacks" (case-sensitive).
// 3. Go to Extensions > Apps Script.
// 4. Paste this code completely replacing what's there.
// 5. Click Deploy > New Deployment > Type: Web App.
// 6. Execute as: Me.
// 7. Who has access: Anyone.
// 8. Click Deploy, Authorize, and copy the "Web App URL".

function doPost(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Callbacks");
        if (!sheet) {
            // You must create a tab named "Callbacks" or this will fail
            return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);
        }

        // We expect the website to send JSON data
        // { "name": "...", "phone": "...", "location": "..." }
        var data = JSON.parse(e.postData.contents);

        var timestamp = new Date();

        // Append to the sheet: [Date, Name, Phone, Location]
        sheet.appendRow([timestamp, data.name, data.phone, data.location]);

        // Send email notification (Make sure to use your correct email)
        MailApp.sendEmail({
            to: "jvtraders961@gmail.com, megha4401varshine@gmail.com",
            subject: "New Callback Request from Website",
            body: "New Enquiry Received:\n\n" +
                "Name: " + data.name + "\n" +
                "Phone: " + data.phone + "\n" +
                "Location: " + data.location + "\n\n" +
                "Check the 'Callbacks' sheet for details."
        });

        return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);

    } catch (ex) {
        return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": ex.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}
