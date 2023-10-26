function doGet(e) {
  var operation = e.parameter.operation;
  
  //operation = 'monthlyReservations';

  if (operation === 'monthlyReservations') {
    return getMonthlyReservations();
  } else if (operation === 'dailyCheck') {
    return getDailyCheck();
  } else if (operation === 'changedReservations') {
    return checkForReservationChanges();
  } else {
    return ContentService.createTextOutput('Invalid operation');
  }
}


function getMonthlyReservations(startDate) {
  // Remove the line below if you want to use the function parameter
  //var startDate = '2023/10/22';
  
  // Access the sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('reservations');
  
  // Get the data
  var data = sheet.getDataRange().getValues();
  
  // Parse the startDate parameter
  var startDateTime = new Date(startDate);
  console.log(startDate);
  console.log(startDateTime);
  
  // Get the first day of the next month
  var firstDayOfNextMonth = new Date(startDateTime.getFullYear(), startDateTime.getMonth() + 1, 1);
  
  // Prepare a result array
  var result = [];
  
  // Iterate through the data
  for (var i = 1; i < data.length; i++) {  // Start at 1 to skip the header row
    var checkinDate = new Date(data[i][1]);  // Column B (0-indexed as 1)
    var checkoutDate = new Date(data[i][2]);  // Column C (0-indexed as 2)
    
    // Reset the time component of checkinDate and checkoutDate
    checkinDate.setHours(0,0,0,0);
    checkoutDate.setHours(0,0,0,0);
    
    // Check if the specified date falls within the reservation period
    // or if the reservation check-in is within the specified date range
    if ((checkinDate <= startDateTime && checkoutDate >= startDateTime) || 
        (checkinDate >= startDateTime && checkinDate < firstDayOfNextMonth)) {
      
      // Format the check-in and check-out dates
      var formattedCheckinDate = Utilities.formatDate(checkinDate, "Europe/Bucharest", "dd.MM");
      var formattedCheckoutDate = Utilities.formatDate(checkoutDate, "Europe/Bucharest", "dd.MM");
      
      // Determine the correct word for adult/adults and child/children
      var adultWord = data[i][5] == 1 ? 'adult' : 'adulti';
      var childrenWord = data[i][6] == 0 ? '' : data[i][6] == 1 ? 'copil' : 'copii';
      
      // Build the reservation details string
      var reservationDetails = formattedCheckinDate + ' - ' + formattedCheckoutDate +
        ' / ' + data[i][0] +
        ' (' + data[i][5] + ' ' + adultWord;
      if (childrenWord) {
        reservationDetails += ' + ' + data[i][6] + ' ' + childrenWord;
      }
      reservationDetails += ')';
      
      // Add the reservation details to the result array
      result.push(reservationDetails);
    }
  }
  
  // Convert result array to a single string, with each reservation on a new line
  var resultText = result.join('\n');

  console.log(resultText);
  
  // Return as text output
  return ContentService.createTextOutput(resultText);
}



function getDailyCheck() {

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

function checkForReservationChanges() {
  // Get today's date and reset the time component
  var today = new Date();
  today.setHours(0,0,0,0);
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('reservations');
  var data = sheet.getDataRange().getValues();
  
  var oldSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('oldReservations');
  if (!oldSheet) {
    oldSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('oldReservations');
    oldSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    return ContentService.createTextOutput('Initial data stored. No new reservations checked.');
  }
  
  var oldData = oldSheet.getDataRange().getValues();
  
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();
  
  var isNewReservationInCurrentMonth = false;
  var isCancellationInCurrentMonth = false;

  var newReservations = detectNewReservations(data, oldData);
  var cancellations = detectCancellations(data, oldData);

  // Check for new reservations in the current month
  for (var i = 0; i < newReservations.length; i++) {
    var checkinDate = new Date(newReservations[i][1]);
    if (checkinDate.getMonth() === currentMonth && checkinDate.getFullYear() === currentYear) {
      isNewReservationInCurrentMonth = true;
      break;
    }
  }

  // Check for cancellations in the current month
  for (var i = 0; i < cancellations.length; i++) {
    var checkinDate = new Date(cancellations[i][1]);
    if (checkinDate.getMonth() === currentMonth && checkinDate.getFullYear() === currentYear) {
      isCancellationInCurrentMonth = true;
      break;
    }
  }

  oldSheet.clear();
  oldSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  
  if (isNewReservationInCurrentMonth || isCancellationInCurrentMonth) {
    return getMonthlyReservations(today);
  }
  
  return ContentService.createTextOutput('none');
}

function detectNewReservations(data, oldData) {
  var newReservations = [];
  for (var i = 1; i < data.length; i++) {
    var isNew = true;
    for (var j = 1; j < oldData.length; j++) {
      if (data[i][0].toString() === oldData[j][0].toString() && data[i][1].toString() === oldData[j][1].toString() && data[i][2].toString() === oldData[j][2].toString()) {
        isNew = false;
        break;
      }
    }
    if (isNew) {
      newReservations.push(data[i]);
    }
  }
  return newReservations;
}

function detectCancellations(data, oldData) {
  var cancellations = [];
  for (var i = 1; i < oldData.length; i++) {
    var isCancelled = true;
    for (var j = 1; j < data.length; j++) {
      if (oldData[i][0].toString() === data[j][0].toString() && oldData[i][1].toString() === data[j][1].toString() && oldData[i][2].toString() === data[j][2].toString()) {
        isCancelled = false;
        break;
      }
    }
    if (isCancelled) {
      cancellations.push(oldData[i]);
    }
  }
  return cancellations;
}



function dayName(dayNumber) {
  var days = [
    "duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"
  ];
  return days[dayNumber];
}

function monthName(monthNumber) {
  var months = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
  ];
  return months[monthNumber];
}

function formatDate(date) {
  var day = dayName(date.getDay());
  var dateNumber = Utilities.formatDate(date, "Europe/Bucharest", "dd");
  var month = monthName(date.getMonth());
  return day + ", " + dateNumber + ' ' + month;
}



/*
function getMonthNumber(monthStr) {
  return new Date(monthStr + '-1-01').getMonth() + 1;
}

function parseDate(dateStr) {
  var parts = dateStr.split("-");
  var day = parseInt(parts[0], 10);
  var month = getMonthIndex(parts[1]);
  var year = parseInt(parts[2], 10) + 2000;  // Assumes that YY is 2000 + YY
  return new Date(year, month, day);
}

function getMonthIndex(monthStr) {
  var months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  return months[monthStr];
}
*/
