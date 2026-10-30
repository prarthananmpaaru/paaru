const districts = [
"Bagalkote","Ballari","Belagavi","Bengaluru Rural",
"Bengaluru South","Bengaluru Urban","Bidar","Chamarajanagar",
"Chikkaballapura","Chikkamagaluru","Chitradurga",
"Dakshina Kannada","Davanagere","Dharwad","Gadag",
"Hassan","Haveri","Kalaburagi","Kodagu","Kolar",
"Koppal","Mandya","Mysuru","Raichur","Shivamogga",
"Tumakuru","Udupi","Uttara Kannada","Vijayanagara",
"Vijayapura","Yadgir"
];

let reports = [
 {id:"CIVI-1001",category:"Road Damage",district:"Mysuru",area:"Kuvempunagar",priority:"High",status:"In-Progress"},
 {id:"CIVI-1002",category:"Garbage Overflow",district:"Bengaluru Urban",area:"Jayanagar",priority:"Medium",status:"Pending"},
 {id:"CIVI-1003",category:"Waterlogging",district:"Dakshina Kannada",area:"Mangaluru",priority:"High",status:"Resolved"},
 {id:"CIVI-1004",category:"Broken Streetlight",district:"Belagavi",area:"Tilakwadi",priority:"Medium",status:"In-Progress"},
 {id:"CIVI-1005",category:"Water Supply",district:"Mandya",area:"Mandya Town",priority:"Medium",status:"Pending"},
 {id:"CIVI-1006",category:"Road Damage",district:"Hassan",area:"Hassan Town",priority:"High",status:"Resolved"},
 {id:"CIVI-1007",category:"Garbage Overflow",district:"Udupi",area:"Manipal",priority:"Low",status:"Pending"},
 {id:"CIVI-1008",category:"Waterlogging",district:"Shivamogga",area:"Vinoba Nagar",priority:"High",status:"In-Progress"}
];

const saved = JSON.parse(localStorage.getItem("civisenseReports") || "[]");
reports = reports.concat(saved);

let gpsCoordinates = "";

const districtSelect = document.getElementById("district");
const districtFilter = document.getElementById("districtFilter");

districts.forEach(district => {
  districtSelect.add(new Option(district, district));
  districtFilter.add(new Option(district, district));
});

function saveReports() {
  const newReports = reports.filter(r => !r.sample);
  localStorage.setItem("civisenseReports", JSON.stringify(newReports));
}

function getPriority(category, description) {
  const text = (category + " " + description).toLowerCase();

  if (
    text.includes("waterlogging") ||
    text.includes("danger") ||
    text.includes("accident") ||
    text.includes("major")
  ) return "High";

  if (
    text.includes("road") ||
    text.includes("garbage") ||
    text.includes("streetlight") ||
    text.includes("water")
  ) return "Medium";

  return "Low";
}

function render() {
  document.getElementById("totalCount").textContent = reports.length;

  document.getElementById("resolvedCount").textContent =
    reports.filter(r => r.status === "Resolved").length;

  document.getElementById("progressCount").textContent =
    reports.filter(r => r.status === "In-Progress").length;

  document.getElementById("districtCount").textContent =
    new Set(reports.map(r => r.district)).size;

  const counts = {};

  reports.forEach(report => {
    counts[report.district] = (counts[report.district] || 0) + 1;
  });

  const selected = districtFilter.value;

  document.getElementById("districtGrid").innerHTML =
    districts
      .filter(d => selected === "All" || d === selected)
      .map(d => `
        <div class="district-card">
          <b>${d}</b>
          <span>${counts[d] || 0} report(s)</span>
        </div>
      `).join("");

  document.getElementById("reportTable").innerHTML =
    [...reports].reverse().map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.category}</td>
        <td>${r.district}</td>
        <td>${r.priority}</td>
        <td>${r.status}</td>
      </tr>
    `).join("");
}

districtFilter.addEventListener("change", render);

document.getElementById("category").addEventListener("change", updateAnalysis);
document.getElementById("description").addEventListener("input", updateAnalysis);

function updateAnalysis() {
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const badge = document.getElementById("priorityBadge");

  if (!category && !description.trim()) {
    document.getElementById("analysisText").textContent =
      "Choose an issue to see its suggested priority.";
    badge.textContent = "WAITING";
    return;
  }

  const priority = getPriority(category, description);

  document.getElementById("analysisText").textContent =
    "Suggested priority: " + priority +
    ". This is a rule-based demo analysis.";

  badge.textContent = priority.toUpperCase();
}

document.getElementById("reportForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const category = document.getElementById("category").value;
  const district = districtSelect.value;
  const area = document.getElementById("area").value.trim();
  const description = document.getElementById("description").value.trim();

  const duplicate = reports.some(r =>
    r.district === district &&
    r.category === category &&
    r.area.toLowerCase() === area.toLowerCase()
  );

  if (duplicate && !confirm("A similar report exists. Submit anyway?")) {
    return;
  }

  const id = "CIVI-" + Math.floor(1000 + Math.random() * 9000);

  reports.push({
    id,
    name: document.getElementById("citizenName").value,
    district,
    category,
    area,
    description,
    priority: getPriority(category, description),
    status: "Pending",
    gps: gpsCoordinates
  });

  saveReports();
  render();

  alert("Report submitted!\nYour Complaint ID is: " + id);

  this.reset();
  gpsCoordinates = "";
  document.getElementById("gpsStatus").textContent = "Location is optional";
  document.getElementById("photoPreview").innerHTML = "";
  updateAnalysis();
});

document.getElementById("gpsBtn").addEventListener("click", function() {
  const status = document.getElementById("gpsStatus");

  if (!navigator.geolocation) {
    status.textContent = "GPS is not supported.";
    return;
  }

  status.textContent = "Getting location...";

  navigator.geolocation.getCurrentPosition(
    position => {
      gpsCoordinates =
        position.coords.latitude.toFixed(5) + ", " +
        position.coords.longitude.toFixed(5);

      status.textContent = "Location captured: " + gpsCoordinates;
    },
    () => {
      status.textContent = "Location unavailable. Allow browser permission.";
    }
  );
});

document.getElementById("photo").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById("photoPreview");

  preview.innerHTML = "";

  if (file) {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Issue photo preview";
    preview.appendChild(image);
  }
});

document.getElementById("trackBtn").addEventListener("click", function() {
  const id = document.getElementById("trackId").value.trim().toUpperCase();

  const report = reports.find(r => r.id.toUpperCase() === id);
  const result = document.getElementById("trackResult");

  if (!id) {
    result.textContent = "Enter a complaint ID.";
  } else if (report) {
    result.innerHTML =
      "Complaint: " + report.id +
      "<br>Issue: " + report.category +
      "<br>District: " + report.district +
      "<br>Status: " + report.status +
      "<br>Priority: " + report.priority;
  } else {
    result.textContent = "Complaint not found. Check your ID.";
  }
});

render();