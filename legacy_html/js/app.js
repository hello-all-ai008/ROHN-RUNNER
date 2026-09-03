// js/app.js

// Mock Data: Runners
const runners = [
  { bib: "1001", name: "Tiw Runner", ageGroup: "30-39", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1002", name: "Somchai Fast", ageGroup: "20-29", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1003", name: "Suda Trail", ageGroup: "30-39", gender: "F", distance: "5KM", status: "DNS" },
  { bib: "1004", name: "Mana Power", ageGroup: "40-49", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1005", name: "Wandee Run", ageGroup: "20-29", gender: "F", distance: "5KM", status: "DNS" }
];

// Initialize local storage if empty
if (!localStorage.getItem('runners')) {
  localStorage.setItem('runners', JSON.stringify(runners));
}

// Function to get runner by BIB
function getRunnerByBib(bib) {
  const data = JSON.parse(localStorage.getItem('runners'));
  return data.find(r => r.bib === bib);
}

// Function to update runner check-in
function checkInRunner(bib) {
  let data = JSON.parse(localStorage.getItem('runners'));
  let found = false;
  let runnerName = "";
  
  data = data.map(r => {
    if (r.bib === bib) {
      r.status = "CHECKED_IN";
      r.checkInTime = new Date().toLocaleTimeString();
      found = true;
      runnerName = r.name;
    }
    return r;
  });

  if (found) {
    localStorage.setItem('runners', JSON.stringify(data));
    return { success: true, name: runnerName };
  }
  return { success: false, message: "BIB not found" };
}

// Function to broadcast cast event to monitor
function castToMonitor(monitorId, bib, name) {
  const event = {
    monitorId: monitorId,
    bib: bib,
    name: name,
    timestamp: new Date().getTime()
  };
  localStorage.setItem('cast_event', JSON.stringify(event));
}

// Function to listen for cast events (used by Monitor page)
function listenForCast(monitorId, callback) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cast_event') {
      const event = JSON.parse(e.newValue);
      if (event && event.monitorId === monitorId) {
        callback(event.bib, event.name);
      }
    }
  });
}
