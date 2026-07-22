/* ==========================================================================
   Teacher Dashboard — Vivekanand Shiksha Niketan Junior High School
   Functional logic using Firebase Realtime Database (via firebase.js).
   Data lives under these Realtime Database paths:
   /students, /attendance, /homework, /results
   ========================================================================== */

// ---------- State (kept in sync with Firebase in real time) ----------

let students   = [];
let attendance = [];
let homework   = [];
let results    = [];

// ---------- On page load ----------

document.addEventListener("DOMContentLoaded", function () {

  // Live listeners — table/cards refresh automatically whenever data changes
  db.ref("students").on("value", function (snap) {
    const val = snap.val() || {};
    students = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderStudentTable();
    renderDashboardCounts();
  });

  db.ref("attendance").on("value", function (snap) {
    const val = snap.val() || {};
    attendance = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderDashboardCounts();
  });

  db.ref("homework").on("value", function (snap) {
    const val = snap.val() || {};
    homework = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
  });

  db.ref("results").on("value", function (snap) {
    const val = snap.val() || {};
    results = Object.keys(val).map(key => Object.assign({ key: key }, val[key]));
    renderDashboardCounts();
  });

  const addStudentBtn = document.querySelector(".student-toolbar .add-btn");
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", function () {
      document.querySelector(".student-form").scrollIntoView({ behavior: "smooth" });
    });
  }

  const studentForm = document.querySelector(".student-form form");
  if (studentForm) {
    studentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addStudent(studentForm);
    });
  }

  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderStudentTable(searchInput.value);
    });
  }

  const attendanceBtn = document.querySelector(".attendance-btn");
  if (attendanceBtn) {
    attendanceBtn.addEventListener("click", loadAttendanceStudents);
  }

  const attendanceSaveBtn = document.querySelector(".attendance-section .save-btn");
  if (attendanceSaveBtn) {
    attendanceSaveBtn.addEventListener("click", saveAttendance);
  }

  const homeworkSaveBtn = document.querySelector(".homework-section .save-btn");
  if (homeworkSaveBtn) {
    homeworkSaveBtn.addEventListener("click", saveHomework);
  }

  const resultSaveBtn = document.querySelector(".result-section .save-btn");
  if (resultSaveBtn) {
    resultSaveBtn.addEventListener("click", saveResult);
  }

  // Sidebar navigation: click a menu item to scroll to its section
  document.querySelectorAll(".sidebar li").forEach(function (li, index) {
    li.addEventListener("click", function () {
      document.querySelectorAll(".sidebar li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      const sectionMap = [
        null, // Dashboard -> top
        ".student-management",
        null, // Teachers (not built yet)
        ".attendance-section",
        ".result-section",
        null, // Marksheet (not built yet)
        null, // Fees (not built yet)
        null, // Notice Board (not built yet)
        null, // Gallery (not built yet)
        null, // Settings (not built yet)
        null  // Logout
      ];

      if (index === sectionMap.length - 1) {
        logoutTeacher();
        return;
      }

      const target = sectionMap[index];
      if (target && document.querySelector(target)) {
        document.querySelector(target).scrollIntoView({ behavior: "smooth" });
      } else if (index === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

});

// ---------- Dashboard summary cards ----------

function renderDashboardCounts() {
  const cards = document.querySelectorAll(".dashboard-cards .card h2");
  if (cards.length < 4) return;

  const today = new Date().toISOString().split("T")[0];
  const todaysRecords = attendance.filter(a => a.date === today);
  const presentCount = todaysRecords.filter(a => a.status === "Present").length;
  const attendancePercent = todaysRecords.length
    ? Math.round((presentCount / todaysRecords.length) * 100)
    : 0;

  cards[0].textContent = students.length;
  cards[1].textContent = "0"; // Teacher records not managed on this page
  cards[2].textContent = attendancePercent + "%";
  cards[3].textContent = results.length;
}

// ---------- Student management ----------

function addStudent(form) {
  const inputs = form.querySelectorAll(".form-group input, .form-group select");

  const student = {
    name: inputs[1].value.trim(),
    father: inputs[2].value.trim(),
    mother: inputs[3].value.trim(),
    dob: inputs[4].value,
    gender: inputs[5].value,
    className: inputs[6].value,
    section: inputs[7].value.trim(),
    roll: inputs[8].value.trim(),
    sr: inputs[9].value.trim(),
    admissionNo: inputs[10].value.trim(),
    mobile: inputs[11].value.trim(),
    address: form.querySelector("textarea").value.trim()
  };

  if (!student.name) {
    alert("Please enter the student's name before saving.");
    return;
  }

  db.ref("students").push(student)
    .then(function () {
      form.reset();
      alert("Student record saved.");
    })
    .catch(function (err) {
      alert("Could not save student: " + err.message);
    });
}

function renderStudentTable(filter) {
  const tbody = document.querySelector(".student-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const list = filter
    ? students.filter(s =>
        (s.name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.sr || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.roll || "").toLowerCase().includes(filter.toLowerCase())
      )
    : students;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#8891AC;">No students added yet.</td></tr>';
    return;
  }

  list.forEach(function (s) {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td><img src="images/student.png" class="student-photo"></td>' +
      "<td>" + (s.name || "") + "</td>" +
      "<td>" + (s.father || "") + "</td>" +
      "<td>" + (s.mother || "") + "</td>" +
      "<td>" + (s.className || "") + "</td>" +
      "<td>" + (s.section || "") + "</td>" +
      "<td>" + (s.roll || "") + "</td>" +
      "<td>" + (s.sr || "") + "</td>" +
      "<td>" + (s.mobile || "") + "</td>" +
      '<td>' +
      '<button class="view-btn" title="View"><i class="fa-solid fa-eye"></i></button>' +
      '<button class="edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
      '<button class="delete-btn" title="Delete" data-key="' + s.key + '"><i class="fa-solid fa-trash"></i></button>' +
      "</td>";
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Delete this student record?")) {
        deleteStudent(btn.getAttribute("data-key"));
      }
    });
  });
}

function deleteStudent(key) {
  db.ref("students/" + key).remove()
    .catch(function (err) {
      alert("Could not delete student: " + err.message);
    });
}

// ---------- Attendance ----------

function loadAttendanceStudents() {
  const selects = document.querySelectorAll(".attendance-top select");
  const dateInput = document.querySelector(".attendance-top input[type='date']");
  const className = selects[0] ? selects[0].value : "";
  const section = selects[1] ? selects[1].value : "";

  const tbody = document.querySelector(".attendance-section tbody");
  if (!tbody) return;

  const matched = students.filter(function (s) {
    const classOk = !className || className === "Select Class" || s.className === className;
    const sectionOk = !section || section === "Select Section" || s.section === section;
    return classOk && sectionOk;
  });

  tbody.innerHTML = "";

  if (matched.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#8891AC;">No students found for this class/section.</td></tr>';
    return;
  }

  matched.forEach(function (s) {
    const row = document.createElement("tr");
    row.dataset.studentKey = s.key;
    row.innerHTML =
      '<td><img src="images/student.png" class="student-photo"></td>' +
      "<td>" + (s.roll || "") + "</td>" +
      "<td>" + (s.name || "") + "</td>" +
      '<td><input type="radio" name="att_' + s.key + '" value="Present"></td>' +
      '<td><input type="radio" name="att_' + s.key + '" value="Absent"></td>' +
      '<td><input type="radio" name="att_' + s.key + '" value="Leave"></td>';
    tbody.appendChild(row);
  });

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

function saveAttendance() {
  const dateInput = document.querySelector(".attendance-top input[type='date']");
  const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split("T")[0];

  const rows = document.querySelectorAll(".attendance-section tbody tr[data-student-key]");
  if (rows.length === 0) {
    alert("Load students first, then mark attendance.");
    return;
  }

  const updates = {};
  let savedCount = 0;

  rows.forEach(function (row) {
    const studentKey = row.dataset.studentKey;
    const checked = row.querySelector("input[type='radio']:checked");
    if (!checked) return;

    const recordKey = studentKey + "_" + date;
    updates[recordKey] = { studentKey: studentKey, date: date, status: checked.value };
    savedCount++;
  });

  if (savedCount === 0) {
    alert("Mark at least one student's attendance before saving.");
    return;
  }

  db.ref("attendance").update(updates)
    .then(function () {
      alert(savedCount + " attendance record(s) saved for " + date + ".");
    })
    .catch(function (err) {
      alert("Could not save attendance: " + err.message);
    });
}

// ---------- Homework ----------

function saveHomework() {
  const section = document.querySelector(".homework-section");
  const select = section.querySelector("select");
  const subjectInput = section.querySelectorAll("input")[0];
  const dateInput = section.querySelector("input[type='date']");
  const textarea = section.querySelector("textarea");

  if (!subjectInput.value.trim() || !textarea.value.trim()) {
    alert("Please fill in subject and homework details.");
    return;
  }

  db.ref("homework").push({
    className: select.value,
    subject: subjectInput.value.trim(),
    date: dateInput.value,
    content: textarea.value.trim()
  })
    .then(function () {
      subjectInput.value = "";
      textarea.value = "";
      alert("Homework published.");
    })
    .catch(function (err) {
      alert("Could not publish homework: " + err.message);
    });
}

// ---------- Results ----------

function saveResult() {
  const section = document.querySelector(".result-section");
  const inputs = section.querySelectorAll(".form-group input");
  const selects = section.querySelectorAll(".form-group select");

  const record = {
    session: inputs[0] ? inputs[0].value.trim() : "",
    exam: selects[0] ? selects[0].value : "",
    className: selects[1] ? selects[1].value : "",
    section: selects[2] ? selects[2].value : ""
  };

  if (!record.session) {
    alert("Please enter the session (e.g. 2026-2027).");
    return;
  }

  db.ref("results").push(record)
    .then(function () {
      alert("Result entry saved for " + record.className + " — " + record.exam + ".");
    })
    .catch(function (err) {
      alert("Could not save result: " + err.message);
    });
}

// ---------- Logout ----------

function logoutTeacher() {
  if (confirm("Logout from Teacher Dashboard?")) {
    window.location.href = "teacher-login.html";
  }
}
