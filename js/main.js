let currentTask = null;

// 日付と時間を表示する
function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// プロジェクトを追加する
function addProject() {
  const newProject = document.getElementById("newProject").value;
  if (!newProject) {
    return;
  }
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  projects.push(newProject);
  localStorage.setItem("projects", JSON.stringify(projects));
  document.getElementById("newProject").value = "";
  displayProjects();
}
// プロジェクトを表示する
function displayProjects() {
  /* ローカルストレージからprojectsのデータを取得し、それをJSONとしてパースする。
  もしデータが存在しない場合は、空の配列を使う*/
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const projectElement = document.getElementById("project");
  projectElement.innerHTML = "";
  for (let project of projects) {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectElement.appendChild(option);
  }
}
// タスクを追加する
function addTaskType() {
  const newTaskType = document.getElementById("newTaskType").value;
  if (!newTaskType) {
    return;
  }
  const taskTypes = JSON.parse(localStorage.getItem("taskTypes")) || [];
  taskTypes.push(newTaskType);
  localStorage.setItem("taskTypes", JSON.stringify(taskTypes));
  document.getElementById("newTaskType").value = "";
  displayTaskTypes();
}
// タスクを表示する
function displayTaskTypes() {
  const taskTypes = JSON.parse(localStorage.getItem("taskTypes")) || [];
  const taskTypeElement = document.getElementById("taskType");
  taskTypeElement.innerHTML = "";
  for (let taskType of taskTypes) {
    const option = document.createElement("option");
    option.value = taskType;
    option.textContent = taskType;
    taskTypeElement.appendChild(option);
  }
}
// タスクを開始
function startTask() {
  const project = document.getElementById("project").value;
  const taskType = document.getElementById("taskType").value;
  const startTime = getCurrentTime();
  currentTask = {
    id: new Date().getTime(), // 現在のタイムスタンプをユニークなIDとして使用
    project,
    taskType,
    startTime,
  };
  displayCurrentStatus();
}
// タスクのIDを削除する
function removeTask(id) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history = history.filter((item) => item.id !== id); // IDが一致するアイテムをフィルタリング
  localStorage.setItem("history", JSON.stringify(history));
  displayHistory();
  drawStackedChart();
}
// 時間を分で表す
function calculateMinutesWorked(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutesWorked = (end - start) / 1000 / 60;
  return minutesWorked;
}

// 表を表示する
function displayHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const historyTable = document.getElementById("history");
  historyTable.innerHTML = "";

  // ヘッダー行を作成
  const headerRow = document.createElement("tr");
  const headers = ["Date", "PJ", "Task", "Start", "Finish", "Total Time"];
  for (let header of headers) {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  }
  historyTable.appendChild(headerRow);

  // 各アイテムを表に追加
  for (let item of history) {
    const itemRow = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = item.startTime.substring(0, 10);
    itemRow.appendChild(dateCell);

    const projectCell = document.createElement("td");
    projectCell.textContent = item.project;
    itemRow.appendChild(projectCell);

    const taskCell = document.createElement("td");
    taskCell.textContent = item.taskType;
    itemRow.appendChild(taskCell);

    const startCell = document.createElement("td");
    const startTime = item.startTime.substring(11); // 時刻部分のみ抽出
    startCell.textContent = startTime;
    itemRow.appendChild(startCell);

    const endCell = document.createElement("td");
    const endTime = item.endTime.substring(11); // 時刻部分のみ抽出
    endCell.textContent = endTime;
    itemRow.appendChild(endCell);

    const minutesCell = document.createElement("td");
    if (item.minutesWorked !== undefined) {
      const minutesWorked = item.minutesWorked.toFixed(2);
      minutesCell.textContent = minutesWorked;
    }
    itemRow.appendChild(minutesCell);

    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML =
      '<span class="material-icons-outlined">delete</span>';
    deleteButton.addEventListener("click", function () {
      removeTask(item.id);
    });
    deleteCell.appendChild(deleteButton);
    itemRow.appendChild(deleteCell);

    historyTable.appendChild(itemRow);
  }
}
// ボタンを押した時の状態を表示する
function displayCurrentStatus() {
  if (currentTask) {
    const historyElement = document.getElementById("history");
    historyElement.innerHTML = ` ${currentTask.project},  ${currentTask.taskType} <br>Start: ${currentTask.startTime}<br> - 進行中...`;
  }
}

// グラフを作って表示する
window.myChart = null;

function createProjectTaskData() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  let projectData = {};

  for (let item of history) {
    const { project, taskType, minutesWorked } = item;

    if (!(project in projectData)) {
      projectData[project] = {};
    }

    if (!(taskType in projectData[project])) {
      projectData[project][taskType] = 0;
    }

    projectData[project][taskType] += minutesWorked;
  }

  return projectData;
}

// 積み上げ式棒グラフを作成する
function drawStackedChart() {
  const projectData = createProjectTaskData();
  const projects = Object.keys(projectData);
  let labels = [];
  let taskTypes = [];

  for (let project of projects) {
    const taskData = projectData[project];
    labels.push(project);
    taskTypes = [...new Set([...taskTypes, ...Object.keys(taskData)])];
  }

  let data = [];
  for (let project of projects) {
    const taskData = projectData[project];
    let projectDataArray = [];
    for (let taskType of taskTypes) {
      projectDataArray.push(taskData[taskType] || 0);
    }
    data.push(projectDataArray);
  }

  let datasets = [];
  for (let i = 0; i < taskTypes.length; i++) {
    const color = getRandomColor();
    datasets.push({
      label: taskTypes[i],
      data: data.map((projectDataArray) => projectDataArray[i]),
      backgroundColor: color,
    });
  }

  const ctx = document.getElementById("chart").getContext("2d");

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          stacked: true,
        },
        x: {
          stacked: true,
        },
      },
    },
  });
}

// ランダムな色でグラフを表示します
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// タスクの終了
function endTask() {
  const endTime = getCurrentTime();
  currentTask.endTime = endTime;
  currentTask.minutesWorked = calculateMinutesWorked(
    currentTask.startTime,
    currentTask.endTime
  );

  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.push(currentTask);
  localStorage.setItem("history", JSON.stringify(history));

  currentTask = null;
  displayHistory();
  drawStackedChart();
}

// csvデータを作ってダウンロードできるようにする
function convertToCSV(data) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const field = row[header];
      const escaped = ("" + field).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  // windows PCで文字化けしないようにBOM(Byte Order Mark)を追加する
  return "\ufeff" + csvRows.join("\n");
}

function downloadCSV(filename, data) {
  const blob = new Blob([data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToCSV() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const csvData = convertToCSV(history);
  downloadCSV("history.csv", csvData);
}
// 時間によって変化する背景を実装する
function changeBackgroundColor() {
  const currentHour = new Date().getHours();

  let backgroundColor = "";

  if (currentHour >= 6 && currentHour < 12) {
    backgroundColor = "#FFF7E9"; // 朝は薄い黄色
  } else if (currentHour >= 12 && currentHour < 18) {
    backgroundColor = "#EFBAAA"; // 昼はピンク
  } else {
    backgroundColor = "#604D42"; // 夜は茶色
  }

  document.body.style.backgroundColor = backgroundColor;
}

function startBackgroundTimer() {
  changeBackgroundColor(); // 初回の実行

  setInterval(changeBackgroundColor, 60000); // 1分ごとに実行
}

// 現在の時間を表示
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}`;
  return dateTimeString;
}

function updateDateTime() {
  const datetimeElement = document.getElementById("datetime");
  datetimeElement.textContent = getCurrentDateTime();
}

// 初回の表示
updateDateTime();

// 1分ごとに更新
setInterval(updateDateTime, 60000);
setInterval(drawStackedChart, 60000);

updateDateTime();
displayProjects();
displayTaskTypes();
displayHistory();
drawStackedChart();
startBackgroundTimer();
