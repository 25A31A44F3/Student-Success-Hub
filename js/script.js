
/* ==========================================
   STUDENT SUCCESS HUB AI
   DASHBOARD JAVASCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // HELPER FUNCTIONS
    // ======================================

    function getSavedData(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error("Storage error:", error);
            return fallback;
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error("Could not save data:", error);
        }
    }

    // ======================================
    // 1. SIDEBAR NAVIGATION
    // ======================================

    const menuItems = document.querySelectorAll(
        ".sidebar li"
    );

    
const sectionMap = [
    null,                  // Dashboard
    ".attendance-widget",  // Attendance
    ".planner-widget",     // Study Planner
    ".assignment-widget",  // Assignments
    ".coding-widget",      // Coding Tracker
    ".placement-widget",   // Placements
    ".analytics-widget"    // Analytics
];


    menuItems.forEach((item, index) => {

        item.addEventListener("click", () => {

            menuItems.forEach(menu => {
                menu.classList.remove("active");
            });

            item.classList.add("active");

            if (index === 0) {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
                return;
            }

            const target = document.querySelector(
                sectionMap[index]
            );

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        });

    });

    // ======================================
    // 2. TASK MANAGER
    // ======================================

    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskList = document.getElementById("taskList");

    const defaultTasks = [
        {
            id: 1,
            text: "Complete DSA practice",
            completed: false
        },
        {
            id: 2,
            text: "Revise Java concepts",
            completed: false
        },
        {
            id: 3,
            text: "Complete NPTEL assignment",
            completed: false
        }
    ];

    let tasks = getSavedData(
        "ssh_tasks",
        defaultTasks
    );

    if (!Array.isArray(tasks)) {
        tasks = defaultTasks;
    }

    function renderTasks() {

        if (!taskList) return;

        taskList.innerHTML = "";

        if (tasks.length === 0) {

            const empty = document.createElement("p");
            empty.textContent = "No tasks yet. Add your first task!";
            empty.style.color = "#64748b";
            empty.style.fontSize = "13px";

            taskList.appendChild(empty);
            return;
        }

        tasks.forEach(task => {

            const item = document.createElement("div");
            item.className = "task-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;

            const text = document.createElement("span");
            text.textContent = task.text;
            text.style.flex = "1";

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "✕";
            deleteBtn.title = "Delete task";
            deleteBtn.setAttribute("aria-label", "Delete task");

            deleteBtn.style.border = "none";
            deleteBtn.style.background = "transparent";
            deleteBtn.style.color = "#ef4444";
            deleteBtn.style.fontSize = "17px";
            deleteBtn.style.cursor = "pointer";

            checkbox.addEventListener("change", () => {

                task.completed = checkbox.checked;
                saveData("ssh_tasks", tasks);
                renderTasks();

            });

            deleteBtn.addEventListener("click", () => {

                tasks = tasks.filter(t => t.id !== task.id);

                saveData("ssh_tasks", tasks);
                renderTasks();

            });

            item.appendChild(checkbox);
            item.appendChild(text);
            item.appendChild(deleteBtn);

            taskList.appendChild(item);

        });

    }

    function addTask() {

        if (!taskInput) return;

        const text = taskInput.value.trim();

        if (!text) {
            alert("Please enter a task.");
            return;
        }

        const newTask = {
            id: Date.now() + Math.random(),
            text: text,
            completed: false
        };

        tasks.push(newTask);

        saveData("ssh_tasks", tasks);

        taskInput.value = "";

        renderTasks();

        taskInput.focus();

    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", addTask);
    }

    if (taskInput) {

        taskInput.addEventListener("keydown", event => {

            if (event.key === "Enter") {
                addTask();
            }

        });

    }

    renderTasks();

    // ======================================
    // 3. CODING HEATMAP
    // ======================================

    const heatmap = document.getElementById("heatmap");

    const today = new Date().toISOString().slice(0, 10);

    let codingActivity = getSavedData(
        "ssh_coding_activity",
        {}
    );

    if (
        !codingActivity ||
        typeof codingActivity !== "object" ||
        Array.isArray(codingActivity)
    ) {
        codingActivity = {};
    }

    function renderHeatmap() {

        if (!heatmap) return;

        heatmap.innerHTML = "";

        for (let i = 97; i >= 0; i--) {

            const date = new Date();
            date.setDate(date.getDate() - i);

            const dateKey = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            const count = codingActivity[dateKey] || 0;

            const cell = document.createElement("div");
            cell.className = "heat-cell";

            if (count === 1) {
                cell.classList.add("level-1");
            } else if (count === 2) {
                cell.classList.add("level-2");
            } else if (count >= 3) {
                cell.classList.add("level-3");
            }

            cell.title = `${dateKey}: ${count} coding sessions`;

            heatmap.appendChild(cell);

        }

    }

    renderHeatmap();

    
// ======================================
// 4. SMART STUDY PLANNER + FOCUS TIMER
// ======================================

const studyPlanForm = document.getElementById("studyPlanForm");
const studyPlanList = document.getElementById("studyPlanList");
const studyHistoryBox = document.getElementById("studyHistory");

const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");

const activeStudyTopic = document.getElementById("activeStudyTopic");
const timerFeedback = document.getElementById("timerFeedback");

let studyPlans = getSavedData("ssh_study_plans_v2", []);
let studyHistory = getSavedData("ssh_study_history", []);

if (!Array.isArray(studyPlans)) studyPlans = [];
if (!Array.isArray(studyHistory)) studyHistory = [];

let activePlanId = null;
let timerInterval = null;
let remainingSeconds = 25 * 60;
let timerEndTime = null;
let timerRunning = false;

function studyDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function formatStudyTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return hours > 0
        ? `${hours}h ${mins}m`
        : `${mins}m`;
}

function renderTimer() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function getActivePlan() {
    return studyPlans.find(p => p.id === activePlanId);
}

function updateStudyStatistics() {

    const today = studyDateKey(new Date());

    const todaySessions = studyHistory.filter(
        session => session.date === today
    );

    const todayMinutes = todaySessions.reduce(
        (sum, session) => sum + session.minutes,
        0
    );

    const percentage = Math.min(
        100,
        Math.round(todayMinutes / 120 * 100)
    );

    document.getElementById("studyMinutes").textContent =
        formatStudyTime(todayMinutes);

    document.getElementById("studySessions").textContent =
        todaySessions.length;

    document.getElementById("studyGoalPercent").textContent =
        percentage + "%";

    document.getElementById("studyGoalFill").style.width =
        percentage + "%";

    // Update top study card using completed sessions.
    const studyCardNumber = document.querySelector(
        ".card.green h1"
    );

    const studyCardDescription = document.querySelector(
        ".card.green p"
    );

    if (studyCardNumber) {
        studyCardNumber.textContent =
            formatStudyTime(todayMinutes);
    }

    if (studyCardDescription) {
        studyCardDescription.textContent =
            "Completed focus sessions today";
    }
}

function renderStudyHistory() {

    studyHistoryBox.innerHTML = "";

    if (studyHistory.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No completed study sessions yet.";
        empty.style.fontSize = "12px";
        empty.style.color = "#64748b";
        studyHistoryBox.appendChild(empty);
        return;
    }

    studyHistory.slice(-5).reverse().forEach(session => {

        const item = document.createElement("div");
        item.className = "study-history-item";

        item.textContent =
            `${session.date} • ${session.subject} - ` +
            `${session.topic} • ${session.minutes} min`;

        studyHistoryBox.appendChild(item);
    });
}

function renderStudyPlans() {

    studyPlanList.innerHTML = "";

    if (studyPlans.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No study plans yet. Add your first plan.";
        empty.style.fontSize = "12px";
        empty.style.color = "#64748b";
        studyPlanList.appendChild(empty);
    }

    studyPlans.forEach(plan => {

        const entry = document.createElement("div");
        entry.className = "study-plan-entry";

        const heading = document.createElement("h4");
        heading.textContent = `${plan.subject}: ${plan.topic}`;

        const info = document.createElement("p");
        info.textContent =
            `Exam: ${plan.examDate} • ` +
            `${plan.priority} Priority • ${plan.minutes} min`;

        const actions = document.createElement("div");
        actions.className = "study-plan-actions";

        const selectBtn = document.createElement("button");
        selectBtn.className = "study-select-btn";
        selectBtn.textContent =
            activePlanId === plan.id ? "Selected" : "Select";

        selectBtn.addEventListener("click", () => {

            if (timerRunning) {
                timerFeedback.textContent =
                    "Pause or reset the current timer first.";
                return;
            }

            activePlanId = plan.id;
            remainingSeconds = plan.minutes * 60;
            renderTimer();

            activeStudyTopic.textContent =
                `${plan.subject} - ${plan.topic}`;

            timerFeedback.textContent =
                "Plan selected. Press Start to focus.";

            renderStudyPlans();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "study-delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {

            if (!confirm("Delete this study plan?")) return;

            if (activePlanId === plan.id) {
                resetFocusTimer();
                activePlanId = null;
                activeStudyTopic.textContent =
                    "Select a study plan to begin";
            }

            studyPlans = studyPlans.filter(
                p => p.id !== plan.id
            );

            saveData("ssh_study_plans_v2", studyPlans);
            renderStudyPlans();
        });

        actions.appendChild(selectBtn);
        actions.appendChild(deleteBtn);

        entry.appendChild(heading);
        entry.appendChild(info);
        entry.appendChild(actions);

        studyPlanList.appendChild(entry);
    });
}

if (studyPlanForm) {

    studyPlanForm.addEventListener("submit", event => {

        event.preventDefault();

        const subject = document.getElementById(
            "studySubject"
        ).value.trim();

        const topic = document.getElementById(
            "studyTopic"
        ).value.trim();

        const examDate = document.getElementById(
            "studyExamDate"
        ).value;

        const priority = document.getElementById(
            "studyPriority"
        ).value;

        const minutes = Number(
            document.getElementById("studyDuration").value
        );

        if (!subject || !topic || !examDate) {
            return;
        }

        studyPlans.push({
            id: Date.now() + Math.random(),
            subject,
            topic,
            examDate,
            priority,
            minutes
        });

        saveData("ssh_study_plans_v2", studyPlans);

        studyPlanForm.reset();

        document.getElementById("studyFeedback").textContent =
            "Study plan added successfully!";

        renderStudyPlans();
    });
}

function stopTimerInterval() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function completeFocusSession() {

    stopTimerInterval();
    timerRunning = false;
    timerEndTime = null;
    remainingSeconds = 0;
    renderTimer();

    const plan = getActivePlan();

    if (!plan) return;

    studyHistory.push({
        id: Date.now() + Math.random(),
        date: studyDateKey(new Date()),
        subject: plan.subject,
        topic: plan.topic,
        minutes: plan.minutes
    });

    saveData("ssh_study_history", studyHistory);

    updateStudyStatistics();
    renderStudyHistory();

    timerFeedback.textContent =
        "🎉 Focus session completed! Great work.";

}

function tickFocusTimer() {

    if (!timerRunning || timerEndTime === null) return;

    remainingSeconds = Math.max(
        0,
        Math.ceil((timerEndTime - Date.now()) / 1000)
    );

    renderTimer();

    if (remainingSeconds === 0) {
        completeFocusSession();
    }
}

function resetFocusTimer() {

    stopTimerInterval();
    timerRunning = false;
    timerEndTime = null;

    const plan = getActivePlan();

    remainingSeconds = plan
        ? plan.minutes * 60
        : 25 * 60;

    renderTimer();

    timerFeedback.textContent = "Timer reset.";
}

if (startTimerBtn) {

    startTimerBtn.addEventListener("click", () => {

        if (timerRunning) return;

        if (!getActivePlan()) {
            timerFeedback.textContent =
                "Please select a study plan first.";
            return;
        }

        if (remainingSeconds <= 0) {
            resetFocusTimer();
        }

        timerRunning = true;
        timerEndTime = Date.now() + remainingSeconds * 1000;

        stopTimerInterval();

        timerInterval = setInterval(tickFocusTimer, 1000);

        timerFeedback.textContent = "Focus session running.";
    });
}

if (pauseTimerBtn) {

    pauseTimerBtn.addEventListener("click", () => {

        if (!timerRunning) return;

        tickFocusTimer();

        if (!timerRunning) return;

        timerRunning = false;
        timerEndTime = null;
        stopTimerInterval();

        timerFeedback.textContent = "Timer paused.";
    });
}

if (resetTimerBtn) {
    resetTimerBtn.addEventListener("click", resetFocusTimer);
}

// Recover timer display when returning to the tab.
// The timer is not persisted across a full page reload.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && timerRunning) {
        tickFocusTimer();
    }
});

renderTimer();
renderStudyPlans();
renderStudyHistory();
updateStudyStatistics();

    
// ======================================
// 5. ADVANCED ATTENDANCE MANAGER
// ======================================

const subjectNameInput = document.getElementById(
    "subjectName"
);

const subjectAttendedInput = document.getElementById(
    "subjectAttended"
);

const subjectTotalInput = document.getElementById(
    "subjectTotal"
);

const addSubjectBtn = document.getElementById(
    "addSubjectBtn"
);

const subjectList = document.getElementById(
    "subjectList"
);

const subjectFeedback = document.getElementById(
    "subjectFeedback"
);

const minimumAttendance = 75;

let subjects = getSavedData(
    "ssh_attendance_subjects",
    []
);

if (!Array.isArray(subjects)) {
    subjects = [];
}

// Calculate safe leaves at 75% threshold
function calculateSafeLeaves(attended, total) {

    return Math.max(
        0,
        Math.floor(
            attended / (minimumAttendance / 100) - total
        )
    );

}

// Calculate overall attendance
function updateOverallAttendance() {

    let attended = 0;
    let total = 0;

    subjects.forEach(subject => {
        attended += subject.attended;
        total += subject.total;
    });

    const percentage = total > 0
        ? (attended / total) * 100
        : 0;

    const safeLeaves = calculateSafeLeaves(
        attended,
        total
    );

    const percentageText = percentage.toFixed(1) + "%";

    const circle = document.getElementById(
        "attendanceCircle"
    );

    if (circle) {
        circle.style.background = `conic-gradient(
            #2563eb 0% ${percentage}%,
            #e8edf5 ${percentage}% 100%
        )`;
    }

    document.getElementById(
        "overallAttendance"
    ).textContent = percentageText;

    document.getElementById(
        "totalAttended"
    ).textContent = attended;

    document.getElementById(
        "totalClasses"
    ).textContent = total;

    document.getElementById(
        "safeLeaves"
    ).textContent = safeLeaves;

    // Update dashboard summary card
    const summaryNumber = document.querySelector(
        ".card.blue h1"
    );

    const summaryDescription = document.querySelector(
        ".card.blue p"
    );

    if (summaryNumber) {
        summaryNumber.textContent = percentageText;
    }

    if (summaryDescription) {
        summaryDescription.textContent =
            "Safe Leaves: " + safeLeaves;
    }

    const alertBox = document.getElementById(
        "attendanceAlert"
    );

    if (!alertBox) return;

    if (total === 0) {

        alertBox.textContent =
            "Add subjects to start tracking attendance.";

        alertBox.style.color = "#64748b";

    } else if (percentage < minimumAttendance) {

        alertBox.textContent =
            "⚠️ Attendance below 75%. Attend more classes!";

        alertBox.style.color = "#dc2626";

    } else {

        alertBox.textContent =
            "✓ Your overall attendance is at least 75%.";

        alertBox.style.color = "#15803d";

    }

}

// Create subject card
function renderSubjects() {

    if (!subjectList) return;

    subjectList.innerHTML = "";

    if (subjects.length === 0) {

        const empty = document.createElement("p");

        empty.textContent =
            "No subjects added yet.";

        empty.style.color = "#64748b";
        empty.style.fontSize = "13px";

        subjectList.appendChild(empty);

    }

    subjects.forEach(subject => {

        const percentage = subject.total > 0
            ? (subject.attended / subject.total) * 100
            : 0;

        const safeLeaves = calculateSafeLeaves(
            subject.attended,
            subject.total
        );

        const card = document.createElement("div");
        card.className = "subject-card";

        const top = document.createElement("div");
        top.className = "subject-top";

        const title = document.createElement("h4");
        title.textContent = subject.name;

        const percent = document.createElement("strong");
        percent.className = "subject-percentage";
        percent.textContent = percentage.toFixed(1) + "%";

        top.appendChild(title);
        top.appendChild(percent);

        const info = document.createElement("p");
        info.className = "subject-info";
        info.textContent =
            `${subject.attended} / ${subject.total} classes attended`;

        const progress = document.createElement("div");
        progress.className = "subject-progress";

        const fill = document.createElement("div");
        fill.className = "subject-progress-fill";
        fill.style.width = percentage + "%";

        if (percentage < minimumAttendance && subject.total > 0) {
            fill.style.background = "#ef4444";
        }

        progress.appendChild(fill);

        const actions = document.createElement("div");
        actions.className = "subject-actions";

        const presentBtn = document.createElement("button");
        presentBtn.className = "present-btn";
        presentBtn.textContent = "✓ Present";

        const absentBtn = document.createElement("button");
        absentBtn.className = "absent-btn";
        absentBtn.textContent = "✕ Absent";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-subject-btn";
        deleteBtn.textContent = "Delete";

        presentBtn.addEventListener("click", () => {

            subject.attended++;
            subject.total++;

            saveData("ssh_attendance_subjects", subjects);
            refreshAttendance();

        });

        absentBtn.addEventListener("click", () => {

            subject.total++;

            saveData("ssh_attendance_subjects", subjects);
            refreshAttendance();

        });

        deleteBtn.addEventListener("click", () => {

            if (!confirm("Delete this subject?")) return;

            subjects = subjects.filter(
                item => item.id !== subject.id
            );

            saveData("ssh_attendance_subjects", subjects);
            refreshAttendance();

        });

        actions.appendChild(presentBtn);
        actions.appendChild(absentBtn);
        actions.appendChild(deleteBtn);

        const status = document.createElement("p");

        if (subject.total === 0) {

            status.className = "subject-info";
            status.textContent = "No classes recorded yet.";

        } else if (percentage < minimumAttendance) {

            const needed = Math.max(
                0,
                Math.ceil(
                    (0.75 * subject.total - subject.attended) / 0.25
                )
            );

            status.className = "subject-warning";
            status.textContent =
                `⚠️ Attend ${needed} more consecutive classes to reach 75%.`;

        } else {

            status.className = "subject-safe";
            status.textContent =
                `✓ Estimated safe leaves: ${safeLeaves}`;

        }

        card.appendChild(top);
        card.appendChild(info);
        card.appendChild(progress);
        card.appendChild(actions);
        card.appendChild(status);

        subjectList.appendChild(card);

    });

}

// Refresh dashboard
function refreshAttendance() {
    renderSubjects();
    updateOverallAttendance();
}

// Add subject
if (addSubjectBtn) {

    addSubjectBtn.addEventListener("click", () => {

        const name = subjectNameInput.value.trim();

        const attendedText = subjectAttendedInput.value.trim();
        const totalText = subjectTotalInput.value.trim();

        const attended = Number(attendedText);
        const total = Number(totalText);

        if (!name) {
            subjectFeedback.textContent =
                "Please enter a subject name.";
            subjectFeedback.style.color = "#dc2626";
            return;
        }

        if (
            attendedText === "" ||
            totalText === "" ||
            !Number.isSafeInteger(attended) ||
            !Number.isSafeInteger(total) ||
            attended < 0 ||
            total < 0 ||
            attended > total
        ) {

            subjectFeedback.textContent =
                "Enter valid attended and total class counts.";

            subjectFeedback.style.color = "#dc2626";
            return;

        }

        const duplicate = subjects.some(
            subject =>
                subject.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicate) {

            subjectFeedback.textContent =
                "This subject already exists.";

            subjectFeedback.style.color = "#dc2626";
            return;

        }

        subjects.push({
            id: Date.now() + Math.random(),
            name: name,
            attended: attended,
            total: total
        });

        saveData("ssh_attendance_subjects", subjects);

        subjectNameInput.value = "";
        subjectAttendedInput.value = "";
        subjectTotalInput.value = "";

        subjectFeedback.textContent =
            "Subject added successfully!";

        subjectFeedback.style.color = "#15803d";

        refreshAttendance();

    });

}

refreshAttendance();

    
// ======================================
// 6. ADVANCED ASSIGNMENT MANAGER
// ======================================

const assignmentForm = document.getElementById("assignmentForm");
const assignmentList = document.getElementById("assignmentList");
const assignmentFilter = document.getElementById("assignmentFilter");
const cancelAssignmentEdit = document.getElementById("cancelAssignmentEdit");

let assignments = getSavedData("ssh_assignments", []);

if (!Array.isArray(assignments)) {
    assignments = [];
}

// Upgrade older saved assignments without deleting them.
assignments = assignments.map(a => ({
    id: a.id ?? Date.now() + Math.random(),
    subject: a.subject || "General",
    title: a.title || "Untitled Assignment",
    due: a.due || "",
    priority: a.priority || "Medium",
    status: a.status || "Pending"
}));

let editingAssignmentId = null;

function assignmentDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function getDeadlineStatus(assignment) {

    if (assignment.status === "Completed") {
        return {
            text: "✓ Completed",
            type: "completed"
        };
    }

    if (!assignment.due) {
        return {
            text: "No due date",
            type: "upcoming"
        };
    }

    const today = assignmentDateKey(new Date());

    if (assignment.due < today) {
        return {
            text: "⚠️ Overdue",
            type: "overdue"
        };
    }

    if (assignment.due === today) {
        return {
            text: "⏰ Due Today",
            type: "today"
        };
    }

    return {
        text: "📅 Due: " + assignment.due,
        type: "upcoming"
    };
}

function updateAssignmentSummary() {

    const total = assignments.length;

    const completed = assignments.filter(
        a => a.status === "Completed"
    ).length;

    const pending = assignments.filter(
        a => a.status !== "Completed"
    ).length;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("assignmentTotal").textContent = total;

    document.getElementById("assignmentCompleted").textContent =
        completed;

    document.getElementById("assignmentPending").textContent =
        pending;

    document.getElementById("assignmentPercent").textContent =
        percentage + "%";

    document.getElementById("assignmentProgressFill").style.width =
        percentage + "%";
}

function resetAssignmentForm() {

    if (!assignmentForm) return;

    assignmentForm.reset();
    editingAssignmentId = null;

    document.getElementById("assignmentFormTitle").textContent =
        "Add New Assignment";

    document.getElementById("saveAssignmentBtn").textContent =
        "+ Add Assignment";

    cancelAssignmentEdit.hidden = true;
}

function renderAssignments() {

    if (!assignmentList) return;

    assignmentList.innerHTML = "";

    const selectedFilter = assignmentFilter.value;

    const visibleAssignments = assignments.filter(a =>
        selectedFilter === "All" || a.status === selectedFilter
    );

    if (visibleAssignments.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No assignments to display.";
        empty.style.color = "#64748b";
        empty.style.fontSize = "13px";
        assignmentList.appendChild(empty);
    }

    visibleAssignments.forEach(assignment => {

        const card = document.createElement("div");
        card.className = "assignment-entry";

        const top = document.createElement("div");
        top.className = "assignment-entry-top";

        const subject = document.createElement("span");
        subject.className = "assignment-subject";
        subject.textContent = assignment.subject;

        const priority = document.createElement("span");
        priority.className =
            "priority " + assignment.priority.toLowerCase();
        priority.textContent = assignment.priority;

        top.appendChild(subject);
        top.appendChild(priority);

        const title = document.createElement("h4");
        title.textContent = assignment.title;

        const status = document.createElement("p");
        status.textContent = "Status: " + assignment.status;

        const deadline = getDeadlineStatus(assignment);

        const deadlineText = document.createElement("p");
        deadlineText.className =
            "assignment-deadline " + deadline.type;
        deadlineText.textContent = deadline.text;

        const actions = document.createElement("div");
        actions.className = "assignment-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "assignment-edit-btn";
        editBtn.textContent = "Edit";

        editBtn.addEventListener("click", () => {

            editingAssignmentId = assignment.id;

            document.getElementById("assignmentSubject").value =
                assignment.subject;

            document.getElementById("assignmentTitle").value =
                assignment.title;

            document.getElementById("assignmentDue").value =
                assignment.due;

            document.getElementById("assignmentPriority").value =
                assignment.priority;

            document.getElementById("assignmentStatus").value =
                assignment.status;

            document.getElementById("assignmentFormTitle").textContent =
                "Edit Assignment";

            document.getElementById("saveAssignmentBtn").textContent =
                "Save Changes";

            cancelAssignmentEdit.hidden = false;

            assignmentForm.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });

        const completeBtn = document.createElement("button");
        completeBtn.className = "assignment-complete-btn";

        completeBtn.textContent =
            assignment.status === "Completed"
                ? "Reopen"
                : "Complete";

        completeBtn.addEventListener("click", () => {

            assignment.status =
                assignment.status === "Completed"
                    ? "Pending"
                    : "Completed";

            saveData("ssh_assignments", assignments);
            refreshAssignments();

        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "assignment-delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {

            if (!confirm("Delete this assignment?")) return;

            assignments = assignments.filter(
                a => a.id !== assignment.id
            );

            saveData("ssh_assignments", assignments);

            if (editingAssignmentId === assignment.id) {
                resetAssignmentForm();
            }

            refreshAssignments();

        });

        actions.appendChild(editBtn);
        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(top);
        card.appendChild(title);
        card.appendChild(status);
        card.appendChild(deadlineText);
        card.appendChild(actions);

        assignmentList.appendChild(card);

    });

}

function refreshAssignments() {
    updateAssignmentSummary();
    renderAssignments();
}

if (assignmentForm) {

    assignmentForm.addEventListener("submit", event => {

        event.preventDefault();

        const subject = document.getElementById(
            "assignmentSubject"
        ).value.trim();

        const title = document.getElementById(
            "assignmentTitle"
        ).value.trim();

        const due = document.getElementById(
            "assignmentDue"
        ).value;

        const priority = document.getElementById(
            "assignmentPriority"
        ).value;

        const status = document.getElementById(
            "assignmentStatus"
        ).value;

        if (!subject || !title || !due) {
            alert("Please complete all required fields.");
            return;
        }

        if (editingAssignmentId !== null) {

            const existing = assignments.find(
                a => a.id === editingAssignmentId
            );

            if (existing) {
                existing.subject = subject;
                existing.title = title;
                existing.due = due;
                existing.priority = priority;
                existing.status = status;
            }

        } else {

            assignments.push({
                id: Date.now() + Math.random(),
                subject,
                title,
                due,
                priority,
                status
            });

        }

        saveData("ssh_assignments", assignments);

        resetAssignmentForm();
        refreshAssignments();

        const feedback = document.getElementById(
            "assignmentFeedback"
        );

        feedback.textContent = "Assignment saved successfully!";
        feedback.style.color = "#15803d";

    });

}

if (assignmentFilter) {
    assignmentFilter.addEventListener(
        "change",
        renderAssignments
    );
}

if (cancelAssignmentEdit) {
    cancelAssignmentEdit.addEventListener(
        "click",
        resetAssignmentForm
    );
}

refreshAssignments();

   

const assistantChatForm =
    document.getElementById("assistantChatForm");

const assistantChatInput =
    document.getElementById("assistantChatInput");

const assistantChatBox =
    document.getElementById("assistantChatBox");

const assistantNotesUpload =
    document.getElementById("assistantNotesUpload");

const assistantNotesList =
    document.getElementById("assistantNotesList");

const assistantNotesPreview =
    document.getElementById("assistantNotesPreview");

const assistantMCQSubject =
    document.getElementById("assistantMCQSubject");

let assistantChatHistory =
    getSavedData("ssh_assistant_chat_v2", []);

let assistantNotes =
    getSavedData("ssh_assistant_notes", []);

let assistantMCQHistory =
    getSavedData("ssh_assistant_mcq_history", []);

if (!Array.isArray(assistantChatHistory)) {
    assistantChatHistory = [];
}

if (!Array.isArray(assistantNotes)) {
    assistantNotes = [];
}

if (!Array.isArray(assistantMCQHistory)) {
    assistantMCQHistory = [];
}

// ===========================================
// LOCAL STUDY KNOWLEDGE
// ===========================================

const assistantKnowledge = [
    {
        keywords: ["inheritance"],
        answer:
            "Java Inheritance:\n" +
            "Inheritance allows a child class to reuse " +
            "properties and methods of a parent class.\n\n" +
            "Example:\n" +
            "class Animal {\n" +
            "  void eat() { System.out.println(\"Eating\"); }\n" +
            "}\n" +
            "class Dog extends Animal { }\n\n" +
            "Dog inherits the eat() method."
    },
    {
        keywords: ["stack"],
        answer:
            "Stack is a linear data structure that follows " +
            "LIFO (Last In, First Out).\n\n" +
            "Operations:\n" +
            "1. Push - Insert an element\n" +
            "2. Pop - Remove the top element\n" +
            "3. Peek - View the top element\n\n" +
            "Example: Undo operations in a text editor."
    },
    {
        keywords: ["queue"],
        answer:
            "Queue follows FIFO (First In, First Out).\n\n" +
            "Enqueue adds an element at the rear.\n" +
            "Dequeue removes an element from the front.\n\n" +
            "Example: Printer job scheduling."
    },
    {
        keywords: ["machine learning", "ml"],
        answer:
            "Machine Learning is a field of AI where " +
            "systems learn patterns from data.\n\n" +
            "Main types:\n" +
            "1. Supervised Learning\n" +
            "2. Unsupervised Learning\n" +
            "3. Reinforcement Learning\n\n" +
            "Example: Predicting house prices from past data."
    },
    {
        keywords: ["python"],
        answer:
            "Python is a high-level programming language " +
            "used for automation, web development, " +
            "machine learning and data science.\n\n" +
            "Example:\n" +
            "numbers = [1, 2, 3]\n" +
            "print(sum(numbers))"
    },
    {
        keywords: ["java"],
        answer:
            "Java is an object-oriented programming language.\n\n" +
            "Important concepts include classes, objects, " +
            "inheritance, polymorphism, abstraction " +
            "and encapsulation.\n\n" +
            "Example:\n" +
            "System.out.println(\"Hello World\");"
    },
    {
        keywords: ["binary search"],
        answer:
            "Binary Search finds an element in a sorted array " +
            "by repeatedly dividing the search range in half.\n\n" +
            "Time complexity: O(log n).\n" +
            "The array must be sorted."
    },
    {
        keywords: ["linked list"],
        answer:
            "A linked list stores elements in nodes. " +
            "Each node contains data and a reference " +
            "to the next node.\n\n" +
            "Types include singly, doubly and circular linked lists."
    }
];

function assistantGetLocalAnswer(question) {

    const normalized = question.toLowerCase();

    const match = assistantKnowledge.find(item =>
        item.keywords.some(keyword =>
            normalized.includes(keyword)
        )
    );

    if (match) {
        return match.answer +
            "\n\n(Source: Built-in study reference)";
    }

    return (
        "I don't have a built-in explanation for that topic yet.\n\n" +
        "Try asking about Java, Python, inheritance, stack, " +
        "queue, linked list, binary search or machine learning.\n\n" +
        "You can also upload notes and search their contents."
    );
}

// ===========================================
// CHAT HISTORY
// ===========================================

function renderAssistantChat() {

    if (!assistantChatBox) return;

    assistantChatBox.innerHTML = "";

    if (assistantChatHistory.length === 0) {
        const welcome = document.createElement("div");
        welcome.className = "assistant-message bot";

        welcome.textContent =
            "Hello! 👋 I'm your offline study assistant.\n" +
            "Ask about supported topics or upload notes to search.";

        assistantChatBox.appendChild(welcome);
    }

    assistantChatHistory.forEach(message => {

        const bubble = document.createElement("div");

        bubble.className =
            "assistant-message " +
            (message.role === "user" ? "user" : "bot");

        bubble.textContent = message.text;

        assistantChatBox.appendChild(bubble);
    });

    assistantChatBox.scrollTop =
        assistantChatBox.scrollHeight;
}

function assistantSendMessage(question) {

    const text = question.trim();
    if (!text) return;

    assistantChatHistory.push({
        role: "user",
        text
    });

    assistantChatHistory.push({
        role: "bot",
        text: assistantGetLocalAnswer(text)
    });

    saveData(
        "ssh_assistant_chat_v2",
        assistantChatHistory
    );

    renderAssistantChat();
}

if (assistantChatForm) {

    assistantChatForm.addEventListener("submit", event => {

        event.preventDefault();

        assistantSendMessage(assistantChatInput.value);

        assistantChatInput.value = "";
    });
}

document.querySelectorAll(
    ".assistant-quick-questions button"
).forEach(button => {

    button.addEventListener("click", () => {
        assistantSendMessage(button.dataset.question || "");
    });

});

const clearAssistantChat =
    document.getElementById("clearAssistantChat");

if (clearAssistantChat) {

    clearAssistantChat.addEventListener("click", () => {

        if (!confirm("Clear all chat history?")) return;

        assistantChatHistory = [];

        saveData("ssh_assistant_chat_v2", []);
        renderAssistantChat();
    });
}

// ===========================================
// NOTES UPLOAD AND STORAGE
// ===========================================

function renderAssistantNotes() {

    if (!assistantNotesList) return;

    assistantNotesList.innerHTML = "";

    if (assistantNotes.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No notes uploaded yet.";
        empty.style.fontSize = "12px";
        empty.style.color = "#64748b";
        assistantNotesList.appendChild(empty);
    }

    assistantNotes.forEach(note => {

        const item = document.createElement("div");
        item.className = "assistant-note-item";

        const name = document.createElement("span");
        name.className = "assistant-note-name";
        name.textContent = note.name;

        const actions = document.createElement("div");
        actions.className = "assistant-note-actions";

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "assistant-view-note";
        viewBtn.textContent = "View";

        viewBtn.addEventListener("click", () => {

            document.getElementById(
                "assistantPreviewTitle"
            ).textContent = note.name;

            assistantNotesPreview.textContent = note.content;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "assistant-delete-note";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {

            if (!confirm("Delete this note?")) return;

            assistantNotes = assistantNotes.filter(
                item => item.id !== note.id
            );

            saveData("ssh_assistant_notes", assistantNotes);

            assistantNotesPreview.textContent =
                "Select a note to view its contents.";

            document.getElementById(
                "assistantPreviewTitle"
            ).textContent = "Notes Preview";

            renderAssistantNotes();
        });

        actions.appendChild(viewBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(name);
        item.appendChild(actions);

        assistantNotesList.appendChild(item);
    });
}

if (assistantNotesUpload) {

    assistantNotesUpload.addEventListener(
        "change",
        async event => {

            const file = event.target.files[0];

            if (!file) return;

            const feedback = document.getElementById(
                "assistantUploadFeedback"
            );

            const extension = file.name
                .split(".")
                .pop()
                .toLowerCase();

            if (!["txt", "md"].includes(extension)) {

                feedback.textContent =
                    "Only TXT and Markdown files are supported.";

                event.target.value = "";
                return;
            }

            if (file.size > 1024 * 1024) {

                feedback.textContent =
                    "File too large. Maximum size is 1 MB.";

                event.target.value = "";
                return;
            }

            try {

                const content = await file.text();

                const newNote = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    content,
                    uploadedAt: new Date().toISOString()
                };

                const updatedNotes = [
                    ...assistantNotes,
                    newNote
                ];

                // Browser localStorage has limited capacity.
                localStorage.setItem(
                    "ssh_assistant_notes",
                    JSON.stringify(updatedNotes)
                );

                assistantNotes = updatedNotes;

                feedback.textContent =
                    "Note uploaded successfully!";

                feedback.style.color = "#15803d";

                renderAssistantNotes();

            } catch (error) {

                feedback.textContent =
                    "Unable to save the note. Browser storage " +
                    "may be full. Try a smaller file.";

                feedback.style.color = "#dc2626";
            }

            event.target.value = "";
        }
    );
}

// ===========================================
// SEARCH UPLOADED NOTES
// ===========================================

const assistantSearchNotesBtn =
    document.getElementById("assistantSearchNotesBtn");

function searchAssistantNotes() {

    const query = document.getElementById(
        "assistantNotesSearchInput"
    ).value.trim().toLowerCase();

    const resultsBox = document.getElementById(
        "assistantNotesResults"
    );

    resultsBox.innerHTML = "";

    if (!query) {
        resultsBox.textContent =
            "Enter a word or phrase to search.";
        return;
    }

    let matches = 0;

    assistantNotes.forEach(note => {

        const lowerContent = note.content.toLowerCase();

        const index = lowerContent.indexOf(query);

        if (index === -1) return;

        matches++;

        const result = document.createElement("div");
        result.className = "assistant-search-result";

        const heading = document.createElement("strong");
        heading.textContent = note.name;

        const snippet = document.createElement("p");

        const start = Math.max(0, index - 80);
        const end = Math.min(
            note.content.length,
            index + query.length + 120
        );

        snippet.textContent =
            note.content.slice(start, end);

        result.appendChild(heading);
        result.appendChild(snippet);

        resultsBox.appendChild(result);
    });

    if (matches === 0) {
        resultsBox.textContent =
            "No matching text found in uploaded notes.";
    }
}

if (assistantSearchNotesBtn) {
    assistantSearchNotesBtn.addEventListener(
        "click",
        searchAssistantNotes
    );
}

const assistantNotesSearchInput =
    document.getElementById("assistantNotesSearchInput");

if (assistantNotesSearchInput) {
    assistantNotesSearchInput.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchAssistantNotes();
            }
        }
    );
}

// ===========================================
// BUILT-IN MCQ PRACTICE
// ===========================================

const assistantMCQBank = {

    Java: [
        {
            q: "Which keyword is used for inheritance in Java?",
            options: ["implements", "extends", "inherits", "super"],
            answer: 1,
            explanation: "The extends keyword creates a subclass."
        },
        {
            q: "Which method is the entry point of a Java program?",
            options: ["start()", "run()", "main()", "execute()"],
            answer: 2,
            explanation: "Execution starts from the main method."
        },
        {
            q: "Which concept allows multiple methods with the same name but different parameters?",
            options: ["Overloading", "Encapsulation", "Abstraction", "Inheritance"],
            answer: 0,
            explanation: "Method overloading uses different parameter lists."
        }
    ],

    Python: [
        {
            q: "Which data type is mutable in Python?",
            options: ["tuple", "string", "list", "int"],
            answer: 2,
            explanation: "Lists can be modified after creation."
        },
        {
            q: "What is the output of len([1, 2, 3])?",
            options: ["2", "3", "4", "Error"],
            answer: 1,
            explanation: "The list contains three elements."
        },
        {
            q: "Which keyword defines a function in Python?",
            options: ["func", "def", "function", "define"],
            answer: 1,
            explanation: "Python uses def to define functions."
        }
    ],

    DSA: [
        {
            q: "Which data structure follows LIFO?",
            options: ["Queue", "Stack", "Tree", "Graph"],
            answer: 1,
            explanation: "A stack follows Last In, First Out."
        },
        {
            q: "Binary search requires which condition?",
            options: ["Sorted data", "Random data", "Unique data", "Linked data"],
            answer: 0,
            explanation: "Binary search requires sorted input."
        },
        {
            q: "What is the time complexity of binary search?",
            options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
            answer: 2,
            explanation: "The search range is halved each step."
        }
    ],

    ML: [
        {
            q: "Which learning type uses labeled data?",
            options: ["Unsupervised", "Supervised", "Reinforcement", "None"],
            answer: 1,
            explanation: "Supervised learning uses labeled examples."
        },
        {
            q: "Which task predicts continuous values?",
            options: ["Classification", "Clustering", "Regression", "Sorting"],
            answer: 2,
            explanation: "Regression predicts numerical values."
        },
        {
            q: "Which algorithm is commonly used for clustering?",
            options: ["K-Means", "Linear Regression", "Naive Bayes", "Decision Tree Classifier"],
            answer: 0,
            explanation: "K-Means groups similar observations."
        }
    ]
};

let assistantMCQIndices = {
    Java: 0,
    Python: 0,
    DSA: 0,
    ML: 0
};

let assistantMCQAnswered = false;

function updateAssistantMCQScore() {

    const total = assistantMCQHistory.length;

    const correct = assistantMCQHistory.filter(
        item => item.correct === true
    ).length;

    const score = document.getElementById(
        "assistantMCQScore"
    );

    if (score) {
        score.textContent = `${correct} / ${total}`;
    }
}

function renderAssistantMCQ() {

    const box = document.getElementById(
        "assistantMCQBox"
    );

    if (!box || !assistantMCQSubject) return;

    box.innerHTML = "";
    assistantMCQAnswered = false;

    const subject = assistantMCQSubject.value;
    const questions = assistantMCQBank[subject];

    const index = assistantMCQIndices[subject];
    const question = questions[index];

    const heading = document.createElement("p");
    heading.className = "assistant-mcq-question";
    heading.textContent =
        `Question ${index + 1}: ${question.q}`;

    box.appendChild(heading);

    question.options.forEach((option, optionIndex) => {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "assistant-mcq-option";
        button.textContent = option;

        button.addEventListener("click", () => {

            if (assistantMCQAnswered) return;

            assistantMCQAnswered = true;

            const correct = optionIndex === question.answer;

            assistantMCQHistory.push({
                subject,
                question: question.q,
                correct,
                date: new Date().toISOString()
            });

            saveData(
                "ssh_assistant_mcq_history",
                assistantMCQHistory
            );

            const buttons = box.querySelectorAll(
                ".assistant-mcq-option"
            );

            buttons.forEach((btn, i) => {

                btn.disabled = true;

                if (i === question.answer) {
                    btn.classList.add("correct");
                } else if (i === optionIndex && !correct) {
                    btn.classList.add("incorrect");
                }
            });

            const feedback = document.getElementById(
                "assistantMCQFeedback"
            );

            feedback.textContent =
                (correct ? "Correct! " : "Incorrect. ") +
                question.explanation;

            feedback.style.color = correct
                ? "#15803d"
                : "#dc2626";

            updateAssistantMCQScore();
        });

        box.appendChild(button);
    });
}

if (assistantMCQSubject) {

    assistantMCQSubject.addEventListener(
        "change",
        () => {

            document.getElementById(
                "assistantMCQFeedback"
            ).textContent = "";

            renderAssistantMCQ();
        }
    );
}

const assistantNextMCQ =
    document.getElementById("assistantNextMCQ");

if (assistantNextMCQ) {

    assistantNextMCQ.addEventListener("click", () => {

        const subject = assistantMCQSubject.value;

        assistantMCQIndices[subject] =
            (assistantMCQIndices[subject] + 1) %
            assistantMCQBank[subject].length;

        document.getElementById(
            "assistantMCQFeedback"
        ).textContent = "";

        renderAssistantMCQ();
    });
}

// INITIAL LOAD
renderAssistantChat();
renderAssistantNotes();
renderAssistantMCQ();
updateAssistantMCQScore();

    
// ======================================
// 8. ADVANCED CODING TRACKER
// ======================================

const codingPlatform = document.getElementById(
    "codingPlatform"
);

const problemsSolvedInput = document.getElementById(
    "problemsSolved"
);

const logCodingBtn = document.getElementById(
    "logCodingBtn"
);

const totalProblemsElement = document.getElementById(
    "totalProblems"
);

const codingStreakElement = document.getElementById(
    "codingStreak"
);

const codingFeedback = document.getElementById(
    "codingFeedback"
);

let codingSessions = getSavedData(
    "ssh_coding_sessions",
    []
);

if (!Array.isArray(codingSessions)) {
    codingSessions = [];
}

// Use local calendar dates for streaks.
function localDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function calculateCodingStreak() {

    const activeDays = new Set(
        codingSessions.map(session => session.date)
    );

    const date = new Date();

    // A streak stays active if the last
    // practice was today or yesterday.
    if (!activeDays.has(localDateKey(date))) {
        date.setDate(date.getDate() - 1);
    }

    let streak = 0;

    while (activeDays.has(localDateKey(date))) {
        streak++;
        date.setDate(date.getDate() - 1);
    }

    return streak;
}

function updateCodingDashboard() {

    const totalProblems = codingSessions.reduce(
        (sum, session) => sum + session.problems,
        0
    );

    const streak = calculateCodingStreak();

    if (totalProblemsElement) {
        totalProblemsElement.textContent = totalProblems;
    }

    if (codingStreakElement) {
        codingStreakElement.textContent = streak;
    }

    // Update top summary card
    const codingCardNumber = document.querySelector(
        ".card.orange h1"
    );

    if (codingCardNumber) {
        codingCardNumber.textContent = streak + " Days";
    }

    // Update heatmap from real logged sessions
    codingActivity = {};

    codingSessions.forEach(session => {

        codingActivity[session.date] =
            (codingActivity[session.date] || 0) + 1;

    });

    saveData(
        "ssh_coding_activity",
        codingActivity
    );

    renderHeatmap();

    // Update platform statistics
    document.querySelectorAll(
        ".coding-platforms .platform"
    ).forEach(platformRow => {

        const platformName = platformRow.querySelector("span");
        const platformValue = platformRow.querySelector("strong");

        if (!platformName || !platformValue) return;

        const name = platformName.textContent.trim();

        const count = codingSessions
            .filter(session => session.platform === name)
            .reduce((sum, session) => sum + session.problems, 0);

        if (name === "LeetCode" || name === "HackerRank") {
            platformValue.textContent = count + " Logged";
        }

    });

}

if (logCodingBtn) {

    logCodingBtn.addEventListener("click", () => {

        const problems = Number(
            problemsSolvedInput.value
        );

        if (
            !Number.isSafeInteger(problems) ||
            problems <= 0
        ) {
            codingFeedback.style.color = "#dc2626";
            codingFeedback.textContent =
                "Please enter a valid number of problems.";
            return;
        }

        const session = {
            id: Date.now() + Math.random(),
            platform: codingPlatform.value,
            problems: problems,
            date: localDateKey(new Date())
        };

        codingSessions.push(session);

        saveData(
            "ssh_coding_sessions",
            codingSessions
        );

        problemsSolvedInput.value = "";

        codingFeedback.style.color = "#15803d";
        codingFeedback.textContent =
            problems + " problems logged successfully!";

        updateCodingDashboard();

    });

}

updateCodingDashboard();

// ======================================
// 9. ADVANCED DASHBOARD ANALYTICS
// ======================================

const refreshAnalyticsBtn =
    document.getElementById("refreshAnalyticsBtn");

function analyticsDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function analyticsSetText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function analyticsSetBar(id, percentage) {
    const element = document.getElementById(id);

    if (element) {
        element.style.width =
            Math.max(0, Math.min(100, percentage)) + "%";
    }
}

function analyticsFormatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    return `${hours}h ${mins}m`;
}

function analyticsCreateChart(containerId, values, type) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = "";

    const maxValue = Math.max(1, ...values.map(v => v.value));

    values.forEach(item => {

        const column = document.createElement("div");
        column.className = "analytics-bar-column";

        const value = document.createElement("span");
        value.className = "analytics-bar-value";
        value.textContent = item.value;

        const track = document.createElement("div");
        track.className = "analytics-bar-track";

        const fill = document.createElement("div");
        fill.className = "analytics-bar-fill";

        if (type === "coding") {
            fill.classList.add("coding");
        }

        fill.style.height =
            (item.value / maxValue * 100) + "%";

        const day = document.createElement("span");
        day.className = "analytics-bar-day";
        day.textContent = item.day;

        track.appendChild(fill);

        column.appendChild(value);
        column.appendChild(track);
        column.appendChild(day);

        container.appendChild(column);
    });
}

function refreshDashboardAnalytics() {

    // Read the latest data from browser storage.
    const savedTasks = getSavedData("ssh_tasks", []);
    const savedStudy = getSavedData("ssh_study_history", []);
    const savedCoding = getSavedData("ssh_coding_sessions", []);
    const savedSubjects = getSavedData("ssh_attendance_subjects", []);
    const savedAssignments = getSavedData("ssh_assignments", []);

    const tasksData = Array.isArray(savedTasks) ? savedTasks : [];
    const studyData = Array.isArray(savedStudy) ? savedStudy : [];
    const codingData = Array.isArray(savedCoding) ? savedCoding : [];
    const subjectsData = Array.isArray(savedSubjects) ? savedSubjects : [];
    const assignmentsData =
        Array.isArray(savedAssignments) ? savedAssignments : [];

    // ----------------------------------
    // TASK ANALYTICS
    // ----------------------------------

    const totalTasks = tasksData.length;

    const completedTasks = tasksData.filter(
        task => task.completed === true
    ).length;

    const taskPercentage = totalTasks > 0
        ? Math.round(completedTasks / totalTasks * 100)
        : 0;

    analyticsSetText(
        "analyticsTasks",
        `${completedTasks}/${totalTasks}`
    );

    analyticsSetText(
        "analyticsTaskPercent",
        taskPercentage + "%"
    );

    analyticsSetBar("analyticsTaskBar", taskPercentage);

    // ----------------------------------
    // LAST SEVEN DAYS
    // ----------------------------------

    const days = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - i);

        days.push({
            date: analyticsDateKey(date),
            day: date.toLocaleDateString("en-US", {
                weekday: "short"
            })
        });
    }

    // ----------------------------------
    // STUDY ANALYTICS
    // ----------------------------------

    const studyChartData = days.map(day => {

        const minutes = studyData
            .filter(session => session.date === day.date)
            .reduce(
                (sum, session) =>
                    sum + (Number(session.minutes) || 0),
                0
            );

        return {
            day: day.day,
            value: minutes
        };
    });

    const weeklyStudyMinutes = studyChartData.reduce(
        (sum, day) => sum + day.value,
        0
    );

    analyticsSetText(
        "analyticsStudy",
        analyticsFormatMinutes(weeklyStudyMinutes)
    );

    analyticsCreateChart(
        "weeklyStudyChart",
        studyChartData,
        "study"
    );

    // ----------------------------------
    // CODING ANALYTICS
    // ----------------------------------

    const totalProblemsSolved = codingData.reduce(
        (sum, session) =>
            sum + (Number(session.problems) || 0),
        0
    );

    analyticsSetText(
        "analyticsCoding",
        totalProblemsSolved
    );

    const codingChartData = days.map(day => {

        const problems = codingData
            .filter(session => {

                const sessionDate =
                    session.date || session.dateKey || "";

                return sessionDate === day.date;

            })
            .reduce(
                (sum, session) =>
                    sum + (Number(session.problems) || 0),
                0
            );

        return {
            day: day.day,
            value: problems
        };
    });

    analyticsCreateChart(
        "weeklyCodingChart",
        codingChartData,
        "coding"
    );

    // ----------------------------------
    // ATTENDANCE ANALYTICS
    // ----------------------------------

    const attendedClasses = subjectsData.reduce(
        (sum, subject) =>
            sum + (Number(subject.attended) || 0),
        0
    );

    const totalClasses = subjectsData.reduce(
        (sum, subject) =>
            sum + (Number(subject.total) || 0),
        0
    );

    const attendancePercentage = totalClasses > 0
        ? Math.round(attendedClasses / totalClasses * 100)
        : 0;

    analyticsSetText(
        "analyticsAttendance",
        attendancePercentage + "%"
    );

    analyticsSetText(
        "analyticsAttendancePercent",
        attendancePercentage + "%"
    );

    analyticsSetBar(
        "analyticsAttendanceBar",
        attendancePercentage
    );

    // ----------------------------------
    // ASSIGNMENT ANALYTICS
    // ----------------------------------

    const totalAssignments = assignmentsData.length;

    const completedAssignments = assignmentsData.filter(
        assignment => assignment.status === "Completed"
    ).length;

    const assignmentPercentage = totalAssignments > 0
        ? Math.round(
            completedAssignments / totalAssignments * 100
        )
        : 0;

    const today = analyticsDateKey(new Date());

    const overdueAssignments = assignmentsData.filter(
        assignment =>
            assignment.status !== "Completed" &&
            assignment.due &&
            assignment.due < today
    ).length;

    analyticsSetText(
        "analyticsAssignmentsTotal",
        totalAssignments
    );

    analyticsSetText(
        "analyticsAssignmentsDone",
        completedAssignments
    );

    analyticsSetText(
        "analyticsAssignmentsOverdue",
        overdueAssignments
    );

    analyticsSetText(
        "analyticsAssignmentPercent",
        assignmentPercentage + "%"
    );

    analyticsSetBar(
        "analyticsAssignmentBar",
        assignmentPercentage
    );

    console.log("Dashboard analytics refreshed.");
}

// Refresh button
if (refreshAnalyticsBtn) {
    refreshAnalyticsBtn.addEventListener(
        "click",
        refreshDashboardAnalytics
    );
}

// Load analytics automatically.
refreshDashboardAnalytics();

// ===========================================
// 10. ADVANCED PLACEMENT PREPARATION HUB
// ===========================================

const placementDSATopics = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Stacks and Queues",
    "Searching and Sorting",
    "Recursion",
    "Trees and Binary Search Trees",
    "Graphs",
    "Hashing",
    "Dynamic Programming"
];

const placementResumeItems = [
    "Contact Information",
    "Professional Summary",
    "Education Details",
    "Technical Skills",
    "Projects",
    "Internships or Experience",
    "Certifications",
    "Achievements",
    "GitHub and LinkedIn Links"
];

const placementQuestions = [
    {
        question: "What is 20% of 250?",
        options: ["25", "40", "50", "60"],
        answer: 2,
        explanation: "20/100 × 250 = 50."
    },
    {
        question: "A train travels 120 km in 2 hours. What is its speed?",
        options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
        answer: 2,
        explanation: "Speed = Distance / Time = 120 / 2 = 60 km/h."
    },
    {
        question: "Find the next number: 2, 4, 8, 16, ?",
        options: ["20", "24", "30", "32"],
        answer: 3,
        explanation: "Each number is multiplied by 2."
    },
    {
        question: "The average of 10, 20 and 30 is:",
        options: ["15", "20", "25", "30"],
        answer: 1,
        explanation: "(10 + 20 + 30) / 3 = 20."
    },
    {
        question: "If 5 workers finish a task in 10 days, how many days will 10 workers take at the same rate?",
        options: ["2", "5", "10", "20"],
        answer: 1,
        explanation: "Doubling the workers halves the time: 5 days."
    },
    {
        question: "What is the probability of getting heads when tossing a fair coin?",
        options: ["1/4", "1/2", "1/3", "1"],
        answer: 1,
        explanation: "There is one favorable outcome out of two equally likely outcomes."
    },
    {
        question: "A product costs ₹800 after a 20% discount. What was its original price?",
        options: ["₹900", "₹960", "₹1000", "₹1200"],
        answer: 2,
        explanation: "Original price = 800 / 0.8 = ₹1000."
    },
    {
        question: "Which number is divisible by both 3 and 5?",
        options: ["21", "25", "30", "32"],
        answer: 2,
        explanation: "30 is divisible by both 3 and 5."
    }
];

const placementInterviewQuestions = [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Explain one project you have developed.",
    "Why should we hire you?",
    "What is the difference between an array and a linked list?",
    "Explain object-oriented programming.",
    "Describe a challenge you faced and how you solved it.",
    "Where do you see yourself in five years?"
];

const placementStatuses = [
    "Interested",
    "Applied",
    "Online Assessment",
    "Interview",
    "Selected",
    "Rejected"
];

let placementDSA = getSavedData("ssh_placement_dsa", []);
let placementResume = getSavedData("ssh_placement_resume", []);
let placementCompanies = getSavedData("ssh_placement_companies", []);
let placementQuizHistory = getSavedData("ssh_placement_quiz", []);
let placementInterviewHistory =
    getSavedData("ssh_placement_interviews", []);

if (!Array.isArray(placementDSA)) placementDSA = [];
if (!Array.isArray(placementResume)) placementResume = [];
if (!Array.isArray(placementCompanies)) placementCompanies = [];
if (!Array.isArray(placementQuizHistory)) placementQuizHistory = [];
if (!Array.isArray(placementInterviewHistory)) {
    placementInterviewHistory = [];
}

let placementQuestionIndex = 0;
let placementQuestionAnswered = false;
let placementInterviewIndex = 0;

function placementSetText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function placementSetWidth(id, percentage) {
    const element = document.getElementById(id);
    if (element) element.style.width = percentage + "%";
}

function placementPercentage(done, total) {
    return total > 0 ? Math.round(done / total * 100) : 0;
}

// ===========================================
// DSA CHECKLIST
// ===========================================

function renderPlacementChecklist(
    containerId,
    items,
    selectedItems,
    storageKey,
    type
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    items.forEach(item => {
        const label = document.createElement("label");
        label.className = "placement-check-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedItems.includes(item);

        if (checkbox.checked) {
            label.classList.add("completed");
        }

        const text = document.createElement("span");
        text.textContent = item;

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                if (!selectedItems.includes(item)) {
                    selectedItems.push(item);
                }
            } else {
                const index = selectedItems.indexOf(item);
                if (index !== -1) selectedItems.splice(index, 1);
            }

            saveData(storageKey, selectedItems);
            label.classList.toggle("completed", checkbox.checked);

            updatePlacementReadiness();
        });

        label.appendChild(checkbox);
        label.appendChild(text);
        container.appendChild(label);
    });
}

function renderPlacementDSA() {
    renderPlacementChecklist(
        "placementDSAList",
        placementDSATopics,
        placementDSA,
        "ssh_placement_dsa",
        "dsa"
    );
}

function renderPlacementResume() {
    renderPlacementChecklist(
        "placementResumeList",
        placementResumeItems,
        placementResume,
        "ssh_placement_resume",
        "resume"
    );
}

// ===========================================
// APTITUDE QUIZ
// ===========================================

function updatePlacementQuizScore() {
    const total = placementQuizHistory.length;
    const correct = placementQuizHistory.filter(
        item => item.correct === true
    ).length;

    placementSetText("placementQuizScore", `${correct} / ${total}`);
}

function renderPlacementQuestion() {
    const container = document.getElementById("placementQuiz");
    if (!container) return;

    container.innerHTML = "";
    placementQuestionAnswered = false;

    const question = placementQuestions[placementQuestionIndex];

    const heading = document.createElement("p");
    heading.className = "placement-question-text";
    heading.textContent =
        `Question ${placementQuestionIndex + 1}: ${question.question}`;

    container.appendChild(heading);

    question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "placement-quiz-option";
        button.textContent = option;

        button.addEventListener("click", () => {
            if (placementQuestionAnswered) return;

            placementQuestionAnswered = true;
            const correct = index === question.answer;

            placementQuizHistory.push({
                question: question.question,
                correct,
                date: new Date().toISOString()
            });

            saveData("ssh_placement_quiz", placementQuizHistory);

            const buttons = container.querySelectorAll(
                ".placement-quiz-option"
            );

            buttons.forEach((btn, i) => {
                btn.disabled = true;

                if (i === question.answer) {
                    btn.classList.add("correct");
                } else if (i === index && !correct) {
                    btn.classList.add("incorrect");
                }
            });

            const feedback = document.getElementById(
                "placementQuizFeedback"
            );

            feedback.textContent =
                (correct ? "Correct! " : "Incorrect. ") +
                question.explanation;

            feedback.style.color = correct
                ? "#15803d"
                : "#dc2626";

            updatePlacementQuizScore();
            updatePlacementReadiness();
        });

        container.appendChild(button);
    });
}

const placementNextQuestionBtn = document.getElementById(
    "placementNextQuestion"
);

if (placementNextQuestionBtn) {
    placementNextQuestionBtn.addEventListener("click", () => {
        placementQuestionIndex =
            (placementQuestionIndex + 1) % placementQuestions.length;

        placementSetText("placementQuizFeedback", "");
        renderPlacementQuestion();
    });
}

// ===========================================
// COMPANY APPLICATION TRACKER
// ===========================================

function updatePlacementCompanySummary() {
    placementSetText(
        "placementCompanyTotal",
        placementCompanies.length
    );

    const appliedStatuses = [
        "Applied",
        "Online Assessment",
        "Interview",
        "Selected",
        "Rejected"
    ];

    const applied = placementCompanies.filter(
        company => appliedStatuses.includes(company.status)
    ).length;

    const selected = placementCompanies.filter(
        company => company.status === "Selected"
    ).length;

    placementSetText("placementCompanyApplied", applied);
    placementSetText("placementCompanySelected", selected);
}

function renderPlacementCompanies() {
    const container = document.getElementById(
        "placementCompanyList"
    );

    if (!container) return;
    container.innerHTML = "";

    if (placementCompanies.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No companies added yet.";
        empty.style.fontSize = "12px";
        empty.style.color = "#64748b";
        container.appendChild(empty);
    }

    placementCompanies.forEach(company => {
        const card = document.createElement("div");
        card.className = "placement-company-card";

        const title = document.createElement("h4");
        title.textContent = company.name;

        const role = document.createElement("p");
        role.textContent = company.role;

        const actions = document.createElement("div");
        actions.className = "placement-company-actions";

        const statusSelect = document.createElement("select");

        placementStatuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        statusSelect.value = company.status;

        statusSelect.addEventListener("change", () => {
            company.status = statusSelect.value;
            saveData(
                "ssh_placement_companies",
                placementCompanies
            );

            updatePlacementCompanySummary();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            if (!confirm("Delete this company?")) return;

            placementCompanies = placementCompanies.filter(
                item => item.id !== company.id
            );

            saveData(
                "ssh_placement_companies",
                placementCompanies
            );

            renderPlacementCompanies();
            updatePlacementCompanySummary();
        });

        actions.appendChild(statusSelect);
        actions.appendChild(deleteBtn);

        card.appendChild(title);
        card.appendChild(role);
        card.appendChild(actions);

        container.appendChild(card);
    });
}

const placementCompanyForm = document.getElementById(
    "placementCompanyForm"
);

if (placementCompanyForm) {
    placementCompanyForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById(
            "placementCompanyName"
        ).value.trim();

        const role = document.getElementById(
            "placementCompanyRole"
        ).value.trim();

        const status = document.getElementById(
            "placementCompanyStatus"
        ).value;

        if (!name || !role) return;

        placementCompanies.push({
            id: Date.now() + Math.random(),
            name,
            role,
            status
        });

        saveData(
            "ssh_placement_companies",
            placementCompanies
        );

        placementCompanyForm.reset();
        renderPlacementCompanies();
        updatePlacementCompanySummary();
    });
}

// ===========================================
// MOCK INTERVIEW PRACTICE
// ===========================================

function renderPlacementInterview() {
    placementSetText(
        "placementInterviewQuestion",
        placementInterviewQuestions[placementInterviewIndex]
    );

    document.getElementById(
        "placementInterviewAnswer"
    ).value = "";

    placementSetText("placementInterviewFeedback", "");
}

function updatePlacementInterviewCount() {
    placementSetText(
        "placementInterviewCount",
        placementInterviewHistory.length + " done"
    );
}

const placementSaveInterview = document.getElementById(
    "placementSaveInterview"
);

if (placementSaveInterview) {
    placementSaveInterview.addEventListener("click", () => {
        const answer = document.getElementById(
            "placementInterviewAnswer"
        ).value.trim();

        if (!answer) {
            placementSetText(
                "placementInterviewFeedback",
                "Please write your answer first."
            );
            return;
        }

        placementInterviewHistory.push({
            id: Date.now() + Math.random(),
            question:
                placementInterviewQuestions[placementInterviewIndex],
            answer,
            date: new Date().toISOString()
        });

        saveData(
            "ssh_placement_interviews",
            placementInterviewHistory
        );

        placementSetText(
            "placementInterviewFeedback",
            "Practice answer saved successfully!"
        );

        updatePlacementInterviewCount();
        updatePlacementReadiness();
    });
}

const placementNextInterview = document.getElementById(
    "placementNextInterview"
);

if (placementNextInterview) {
    placementNextInterview.addEventListener("click", () => {
        placementInterviewIndex =
            (placementInterviewIndex + 1) %
            placementInterviewQuestions.length;

        renderPlacementInterview();
    });
}

// ===========================================
// OVERALL PLACEMENT READINESS
// ===========================================

function updatePlacementReadiness() {
    const dsaPercent = placementPercentage(
        placementDSA.length,
        placementDSATopics.length
    );

    const resumePercent = placementPercentage(
        placementResume.length,
        placementResumeItems.length
    );

    const aptitudePercent = Math.min(
        100,
        placementQuizHistory.length / 8 * 100
    );

    const interviewPercent = Math.min(
        100,
        placementInterviewHistory.length / 5 * 100
    );

    const readiness = Math.round(
        (dsaPercent + resumePercent +
         aptitudePercent + interviewPercent) / 4
    );

    placementSetText("placementReadiness", readiness + "%");
    placementSetText("placementDSAPercent", dsaPercent + "%");
    placementSetText("placementResumePercent", resumePercent + "%");

    placementSetText("placementDSAStat", "DSA: " + dsaPercent + "%");
    placementSetText(
        "placementAptitudeStat",
        "Aptitude: " + Math.round(aptitudePercent) + "%"
    );
    placementSetText(
        "placementResumeStat",
        "Resume: " + resumePercent + "%"
    );
    placementSetText(
        "placementInterviewStat",
        "Interview: " + Math.round(interviewPercent) + "%"
    );

    placementSetWidth("placementDSABar", dsaPercent);
    placementSetWidth("placementResumeBar", resumePercent);

    const circle = document.getElementById(
        "placementReadinessCircle"
    );

    if (circle) {
        circle.style.background =
            `conic-gradient(#2563eb ${readiness}%, #e2e8f0 ${readiness}%)`;
    }

    let message = "Keep practicing and completing your goals.";

    if (readiness >= 80) {
        message = "Excellent checklist progress! Continue practicing.";
    } else if (readiness >= 50) {
        message = "Good progress! Focus on your remaining areas.";
    }

    placementSetText("placementReadinessMessage", message);
}

// INITIAL LOAD
renderPlacementDSA();
renderPlacementResume();
renderPlacementQuestion();
renderPlacementCompanies();
renderPlacementInterview();

updatePlacementQuizScore();
updatePlacementCompanySummary();
updatePlacementInterviewCount();
updatePlacementReadiness();



});
