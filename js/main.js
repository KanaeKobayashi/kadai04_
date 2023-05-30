let currentTask = null;

function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function addProject() {
  const newProject = document.getElementById('newProject').value;
  if (!newProject) {
    return;
  }
  const projects = JSON.parse(localStorage.getItem('projects')) || [];
  projects.push(newProject);
  localStorage.setItem('projects', JSON.stringify(projects));
  document.getElementById('newProject').value = '';
  displayProjects();
}

function displayProjects() {
  const projects = JSON.parse(localStorage.getItem('projects')) || [];
  const projectElement = document.getElementById('project');
  projectElement.innerHTML = '';
  for (let project of projects) {
    const option = document.createElement('option');
    option.value = project;
    option.textContent = project;
    projectElement.appendChild(option);
  }
}

function addTaskType() {
  const newTaskType = document.getElementById('newTaskType').value;
  if (!newTaskType) {
    return;
  }
  const taskTypes = JSON.parse(localStorage.getItem('taskTypes')) || [];
  taskTypes.push(newTaskType);
  localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
  document.getElementById('newTaskType').value = '';
  displayTaskTypes();
}

function displayTaskTypes() {
  const taskTypes = JSON.parse(localStorage.getItem('taskTypes')) || [];
  const taskTypeElement = document.getElementById('taskType');
  taskTypeElement.innerHTML = '';
  for (let taskType of taskTypes) {
    const option = document.createElement('option');
    option.value = taskType;
    option.textContent = taskType;
    taskTypeElement.appendChild(option);
  }
}

function startTask() {
  const project = document.getElementById('project').value;
  const taskType = document.getElementById('taskType').value;
  const startTime = getCurrentTime();
  currentTask = {
    id: new Date().getTime(), // 現在のタイムスタンプをユニークなIDとして使用
    project,
    taskType,
    startTime
  };
  displayCurrentStatus();
}

function removeTask(id) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  history = history.filter(item => item.id !== id); // IDが一致するアイテムをフィルタリング
  localStorage.setItem('history', JSON.stringify(history));
  displayHistory();
  drawChart();
}

function calculateMinutesWorked(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutesWorked = (end - start) / 1000 / 60;
  return minutesWorked;
}

function endTask() {
  const endTime = getCurrentTime();
  currentTask.endTime = endTime;
  currentTask.minutesWorked = calculateMinutesWorked(currentTask.startTime, currentTask.endTime);

  let history = JSON.parse(localStorage.getItem('history')) || [];
  history.push(currentTask);
  localStorage.setItem('history', JSON.stringify(history));

  currentTask = null;
  displayHistory();
  drawChart();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('history')) || [];
    const historyTable = document.getElementById('history');
    historyTable.innerHTML = '';
  
    // ヘッダー行を作成
    const headerRow = document.createElement('tr');
    const headers = ['日付', 'プロジェクト', '仕事', '開始時間', '終了時間', '作業時間'];
    for (let header of headers) {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    }
    historyTable.appendChild(headerRow);
  
    // 各アイテムを表に追加
    for (let item of history) {
        const itemRow = document.createElement('tr');
  
      const dateCell = document.createElement('td');
      dateCell.textContent = item.startTime.substring(0, 10);
      itemRow.appendChild(dateCell);
  
      const projectCell = document.createElement('td');
      projectCell.textContent = item.project;
      itemRow.appendChild(projectCell);
  
      const taskCell = document.createElement('td');
      taskCell.textContent = item.taskType;
      itemRow.appendChild(taskCell);
  
      const startCell = document.createElement('td');
      const startTime = item.startTime.substring(11); // 時刻部分のみ抽出
      startCell.textContent = startTime;
      itemRow.appendChild(startCell);
    
      const endCell = document.createElement('td');
      const endTime = item.endTime.substring(11); // 時刻部分のみ抽出
      endCell.textContent = endTime;
      itemRow.appendChild(endCell);
  
      const minutesCell = document.createElement('td');
      if (item.minutesWorked !== undefined) {
        const minutesWorked = item.minutesWorked.toFixed(2);
        minutesCell.textContent = minutesWorked;
      }
      itemRow.appendChild(minutesCell);
  
      const deleteCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '削除';
      deleteButton.addEventListener('click', function () {
        removeTask(item.id);
      });
      deleteCell.appendChild(deleteButton);
      itemRow.appendChild(deleteCell);
  
      historyTable.appendChild(itemRow);
    }
  }
  

function displayCurrentStatus() {
  if (currentTask) {
    const historyElement = document.getElementById('history');
    historyElement.innerHTML = `プロジェクト: ${currentTask.project}, 仕事: ${currentTask.taskType}, 開始時間: ${currentTask.startTime} - 終了待ち...`;
  }
}

function drawChart() {
    const history = JSON.parse(localStorage.getItem('history')) || [];

    let labels = [];
    let data = [];
    let backgroundColors = [];
  
    for (let item of history) {
      const label = `${item.project} - ${item.taskType}`;
      if (!labels.includes(label)) {
        labels.push(label);
        data.push(item.hoursWorked);
        // グラフの要素ごとに異なる色を設定する
        const color = getRandomColor();
        backgroundColors.push(color);
      } else {
        const index = labels.indexOf(label);
        data[index] += item.hoursWorked;
      }
    }
  
    const ctx = document.getElementById('chart').getContext('2d');
    
    // 既存のチャートを破棄する
    if (Chart.instances.length > 0) {
      Chart.instances.forEach(chart => {
        chart.destroy();
      });
    }
  
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: '作業時間 (時間)',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

function getRandomColor() {
  // ランダムなRGB値を生成する
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  // CSSカラー文字列に変換して返す
  return `rgba(${r}, ${g}, ${b}, 0.2)`;
}

function convertToCSV(data) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const field = row[header];
      const escaped = ('' + field).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function downloadCSV(filename, data) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToCSV() {
  const history = JSON.parse(localStorage.getItem('history')) || [];
  const csvData = convertToCSV(history);
  downloadCSV('history.csv', csvData);
}

function changeBackgroundColor() {
  const currentHour = new Date().getHours();

  let backgroundColor = '';

  if (currentHour >= 6 && currentHour < 12) {
    backgroundColor = 'lightblue'; // 朝は青
  } else if (currentHour >= 12 && currentHour < 18) {
    backgroundColor = 'lightyellow'; // 昼は薄い黄色
  } else {
    backgroundColor = 'lightbrown'; // 夜は薄い茶色
  }

  document.body.style.backgroundColor = backgroundColor;
}

function startBackgroundTimer() {
  changeBackgroundColor(); // 初回の実行

  setInterval(changeBackgroundColor, 60000); // 1分ごとに実行
}

displayProjects();
displayTaskTypes();
displayHistory();
drawChart();
startBackgroundTimer();
