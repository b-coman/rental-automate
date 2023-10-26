


/* function doGet() {
  // Access the sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('reservations');
  
  // Get the data
  var data = sheet.getDataRange().getValues();
  
  // Get today's date and reset the time component
  var today = new Date();
  today.setHours(0,0,0,0);
  
  // Prepare a result object
  var result = {
    inRange: 'no',
    guestName: '',
    checkinDate: '',
    checkoutDate: '',
    persons: '',
    adults: '',
    children: '',
    isCheckinDate: 'no',
    isCheckoutDate: 'no'
  };
  
  // Iterate through the data
  for (var i = 1; i < data.length; i++) {  // Start at 1 to skip the header row
    var checkinDate = new Date(data[i][1]);  // Column B (0-indexed as 1)
    var checkoutDate = new Date(data[i][2]);  // Column C (0-indexed as 2)
    
    // Reset the time component of checkinDate and checkoutDate
    checkinDate.setHours(0,0,0,0);
    checkoutDate.setHours(0,0,0,0);
    
    // Check if today is between check-in date and check-out date
    if (today >= checkinDate && today <= checkoutDate) {
      result.inRange = 'yes';
      result.guestName = data[i][0];  // Column A (0-indexed as 0)
      result.checkinDate = formatDate(checkinDate);
      result.checkoutDate = formatDate(checkoutDate);
      result.persons = data[i][4];  // Column E (0-indexed as 4)
      result.adults = data[i][5];  // Column F (0-indexed as 5)
      result.children = data[i][6];  // Column G (0-indexed as 6)
      if (today.getTime() === checkinDate.getTime()) {
        result.isCheckinDate = 'yes';
      }
      if (today.getTime() === checkoutDate.getTime()) {
        result.isCheckoutDate = 'yes';
      }
      break;  // Exit loop as data is found
    }
  }
  
  // Convert result object to JSON string and return as text output
  return ContentService.createTextOutput(JSON.stringify(result));
}
*/