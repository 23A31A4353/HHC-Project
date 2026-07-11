// ==========================================================================
// HEALEASE APPOINTMENT PORTAL - PROFESSIONAL DATA CONTROLLER
// ==========================================================================

const SPREADSHEET_ID = "1mSOiz0gr3ExySDGRgj8BxWW35TFgawg7z9ijYo2BwXk";
const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

// Fallback Cache Database in case of offline state
const fallbackData = [
    {
        timestamp: "10/07/2026 16:42:58",
        fullName: "sbqwmbfmaejkfnjcw",
        phone: "2145456789",
        email: "nhkjahk@gmail.com",
        age: 12,
        department: "Cardiology",
        doctor: "Dr. Ravi Teja",
        date: "2026-07-11",
        time: "07:00 PM"
    },
    {
        timestamp: "10/07/2026 16:52:23",
        fullName: "RAYI PAVAN KUMAR",
        phone: "8886207394",
        email: "rayipavankumar4@gmail.com",
        age: 19,
        department: "General Medicine",
        doctor: "Dr. N. T. R. Rao",
        date: "2026-07-11",
        time: "12:00 PM"
    },
    {
        timestamp: "11/07/2026 10:16:06",
        fullName: "Ghsns",
        phone: "45616787778",
        email: "rayipavankumar4@gmail.com",
        age: 12,
        department: "Cardiology",
        doctor: "Dr. Ravi Teja",
        date: "2026-07-12",
        time: "12:00 PM"
    }
];

// Application state
let currentRecords = [];
let lastResponseText = "";
let isInitialLoad = true;

// DOM Elements Object
let elements = {};

document.addEventListener("DOMContentLoaded", () => {
    // Initialise elements
    elements = {
        themeBtn: document.getElementById("theme-btn"),
        tbody: document.getElementById("data-tbody"),
        syncDot: document.getElementById("sync-dot"),
        syncText: document.getElementById("sync-text"),
        searchBox: document.getElementById("dashboard-search"),
        statTotal: document.getElementById("stat-total"),
        statCardiology: document.getElementById("stat-cardiology"),
        statMedicine: document.getElementById("stat-medicine"),
        statOthers: document.getElementById("stat-others"),
        lastSyncTime: document.getElementById("last-sync-time"),
        emptyState: document.getElementById("table-empty-state")
    };
    
    // Theme setup from local storage
    const savedTheme = localStorage.getItem("healease_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Setup listeners
    setupEventListeners();
    
    // Initial fetch sync
    syncGoogleSheet();
    
    // Start interval loop to check for sheet updates every 5 seconds
    setInterval(syncGoogleSheet, 5000);
});

// Event Listeners setup
function setupEventListeners() {
    // Theme Switch toggle
    elements.themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("healease_theme", nextTheme);
    });
    
    // Live Search box
    elements.searchBox.addEventListener("input", filterAndRenderTable);
}

// Update the visual status indicators
function updateSyncStatus(status) {
    if (!elements.syncDot || !elements.syncText) return;
    
    if (status === "loading") {
        elements.syncDot.className = "dot-active sync-loading";
        elements.syncText.textContent = "Syncing...";
    } else if (status === "success") {
        elements.syncDot.className = "dot-active";
        elements.syncText.textContent = "Live Synchronized";
        if (elements.lastSyncTime) {
            elements.lastSyncTime.textContent = new Date().toLocaleTimeString();
        }
    } else {
        elements.syncDot.className = "dot-active sync-offline";
        elements.syncText.textContent = "Sync Offline (Cached)";
    }
}

// Fetch Google Sheet live data
async function syncGoogleSheet() {
    if (isInitialLoad) {
        updateSyncStatus("loading");
    }
    
    try {
        const response = await fetch(SPREADSHEET_URL);
        if (!response.ok) throw new Error("Network response failed");
        
        const text = await response.text();
        
        // Re-render only if raw sheet contents have changed
        if (text === lastResponseText) {
            if (isInitialLoad) {
                isInitialLoad = false;
                updateSyncStatus("success");
            }
            return;
        }
        
        lastResponseText = text;
        currentRecords = parseGoogleSheetResponse(text);
        
        // Render updated list
        filterAndRenderTable();
        
        if (isInitialLoad) {
            isInitialLoad = false;
            updateSyncStatus("success");
        } else {
            flashSyncSuccess();
        }
    } catch (error) {
        console.warn("Live fetch error, serving cached fallback data:", error);
        if (isInitialLoad) {
            currentRecords = fallbackData;
            filterAndRenderTable();
            isInitialLoad = false;
        }
        updateSyncStatus("offline");
    }
}

// Flash success indicator upon receiving updated data
function flashSyncSuccess() {
    if (!elements.syncDot || !elements.syncText) return;
    
    elements.syncDot.className = "dot-active sync-loading";
    elements.syncText.textContent = "Data Updated!";
    if (elements.lastSyncTime) {
        elements.lastSyncTime.textContent = new Date().toLocaleTimeString();
    }
    
    setTimeout(() => {
        elements.syncDot.className = "dot-active";
        elements.syncText.textContent = "Live Synchronized";
    }, 2500);
}

// Parse Visualization JSON payload
function parseGoogleSheetResponse(text) {
    const startIdx = text.indexOf("setResponse(");
    if (startIdx === -1) throw new Error("Invalid response format");
    
    const jsonStr = text.substring(startIdx + 12, text.lastIndexOf(")"));
    const data = JSON.parse(jsonStr);
    
    if (data.status !== "ok") throw new Error("API status: " + data.status);
    
    const rows = data.table.rows;
    
    return rows.map(row => {
        const c = row.c;
        return {
            timestamp: getCellValue(c[0]),
            fullName: getCellValue(c[1]),
            phone: getCellValue(c[2]),
            email: getCellValue(c[3]),
            age: getCellValue(c[4]),
            department: getCellValue(c[5]),
            doctor: getCellValue(c[6]),
            date: getCellValue(c[7]),
            time: getCellValue(c[8])
        };
    });
}

function getCellValue(cell) {
    if (!cell) return "";
    if (cell.f !== undefined && cell.f !== null) return cell.f;
    if (cell.v !== undefined && cell.v !== null) {
        if (typeof cell.v === "string" && cell.v.startsWith("Date(")) {
            return parseGoogleDate(cell.v);
        }
        return String(cell.v);
    }
    return "";
}

function parseGoogleDate(dateStr) {
    const matches = dateStr.match(/\d+/g);
    if (!matches) return dateStr;
    const year = matches[0];
    const month = String(Number(matches[1]) + 1).padStart(2, '0');
    const day = String(matches[2]).padStart(2, '0');
    
    if (matches.length > 3) {
        const hrs = String(matches[3]).padStart(2, '0');
        const mins = String(matches[4]).padStart(2, '0');
        const secs = String(matches[5] || 0).padStart(2, '0');
        return `${day}/${month}/${year} ${hrs}:${mins}:${secs}`;
    }
    return `${year}-${month}-${day}`;
}

// Compute statistics and filter table results
function filterAndRenderTable() {
    const query = elements.searchBox.value.toLowerCase().trim();
    
    // Stats calculation
    let totalCount = 0;
    let cardiologyCount = 0;
    let medicineCount = 0;
    let otherCount = 0;
    
    currentRecords.forEach(record => {
        totalCount++;
        const dept = record.department || "";
        if (dept.toLowerCase() === "cardiology") {
            cardiologyCount++;
        } else if (dept.toLowerCase() === "general medicine") {
            medicineCount++;
        } else {
            otherCount++;
        }
    });
    
    // Update stats elements
    elements.statTotal.textContent = totalCount;
    elements.statCardiology.textContent = cardiologyCount;
    elements.statMedicine.textContent = medicineCount;
    elements.statOthers.textContent = otherCount;

    // Live Insights Calculations
    let totalAge = 0;
    let ageCount = 0;
    const deptCounts = {};
    const doctorCounts = {};
    const dateCounts = {};
    
    currentRecords.forEach(record => {
        // Average Age
        const age = Number(record.age);
        if (age && !isNaN(age)) {
            totalAge += age;
            ageCount++;
        }
        
        // Department counts
        const dept = record.department;
        if (dept) {
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        }
        
        // Doctor counts
        const doc = record.doctor;
        if (doc) {
            doctorCounts[doc] = (doctorCounts[doc] || 0) + 1;
        }
        
        // Date counts
        const date = record.date;
        if (date) {
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
    });
    
    const avgAge = ageCount > 0 ? (totalAge / ageCount).toFixed(1) + " Yrs" : "—";
    
    let topDept = "—";
    let maxDeptVal = 0;
    Object.entries(deptCounts).forEach(([dept, count]) => {
        if (count > maxDeptVal) {
            maxDeptVal = count;
            topDept = dept;
        }
    });
    if (topDept !== "—" && totalCount > 0) {
        topDept = `${topDept} (${Math.round((maxDeptVal / totalCount) * 100)}%)`;
    }
    
    let topDoc = "—";
    let maxDocVal = 0;
    Object.entries(doctorCounts).forEach(([doc, count]) => {
        if (count > maxDocVal) {
            maxDocVal = count;
            topDoc = doc;
        }
    });
    
    let peakDate = "—";
    let maxDateVal = 0;
    Object.entries(dateCounts).forEach(([date, count]) => {
        if (count > maxDateVal) {
            maxDateVal = count;
            peakDate = date;
        }
    });
    if (peakDate !== "—") {
        const dateObj = new Date(peakDate);
        if (!isNaN(dateObj.getTime())) {
            peakDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
    }
    
    // Update Insights DOM
    if (document.getElementById("insight-avg-age")) {
        document.getElementById("insight-avg-age").textContent = avgAge;
        document.getElementById("insight-top-dept").textContent = topDept;
        document.getElementById("insight-top-doc").textContent = topDoc;
        document.getElementById("insight-peak-date").textContent = peakDate;
    }
    
    // Search filtering
    let filtered = currentRecords;
    if (query) {
        filtered = filtered.filter(item => 
            (item.fullName || "").toLowerCase().includes(query) ||
            (item.email || "").toLowerCase().includes(query) ||
            (item.phone || "").toLowerCase().includes(query) ||
            (item.department || "").toLowerCase().includes(query) ||
            (item.doctor || "").toLowerCase().includes(query) ||
            (item.timestamp || "").toLowerCase().includes(query) ||
            (item.date || "").toLowerCase().includes(query) ||
            (item.time || "").toLowerCase().includes(query)
        );
    }
    
    // Render HTML rows
    elements.tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        elements.emptyState.style.display = "flex";
    } else {
        elements.emptyState.style.display = "none";
        
        filtered.forEach((item, index) => {
            const row = document.createElement("tr");
            row.style.animation = `rowFadeIn 0.3s ease forwards ${index * 0.04}s`;
            row.style.opacity = 0;
            
            row.innerHTML = `
                <td class="col-timestamp">${escapeHTMLOrPlaceholder(item.timestamp)}</td>
                <td class="col-name">${escapeHTMLOrPlaceholder(item.fullName)}</td>
                <td class="col-phone">${escapeHTMLOrPlaceholder(item.phone)}</td>
                <td class="col-email">${escapeHTMLOrPlaceholder(item.email)}</td>
                <td class="col-age">${escapeHTMLOrPlaceholder(item.age ? String(item.age) : "")}</td>
                <td class="col-dept">${escapeHTMLOrPlaceholder(item.department)}</td>
                <td class="col-doctor">${escapeHTMLOrPlaceholder(item.doctor)}</td>
                <td class="col-date">${escapeHTMLOrPlaceholder(item.date)}</td>
                <td class="col-time">${escapeHTMLOrPlaceholder(item.time)}</td>
            `;
            
            elements.tbody.appendChild(row);
        });
    }
}

// XSS Sanitizer with empty cell fallback wrapper to prevent layout empty spaces
function escapeHTMLOrPlaceholder(str) {
    if (!str || !str.trim()) {
        return `<span class="fallback-val">—</span>`; // Clean fallback placeholder for empty cell values
    }
    
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
