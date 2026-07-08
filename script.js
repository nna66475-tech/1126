// 状態管理用データ配列
let membersData = [];
// 保存トグルのON/OFF状態（LocalStorageに以前の保存データがあれば初期ON）
let isSaveOn = false;

// 画面ロード時の初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // LocalStorageからデータを読み込む
  const savedData = localStorage.getItem('koma_members_data');
  if (savedData) {
    try {
      membersData = JSON.parse(savedData);
      isSaveOn = true;
    } catch (e) {
      membersData = [];
      isSaveOn = false;
    }
  }

  // トグルスイッチの初期画像設定
  updateSaveToggleUI();

  renderAll();

  // イベントリスナー登録
  document.getElementById('btnHaneiKoma').addEventListener('click', handleKomaInput);
  document.getElementById('btnHaneiHeight').addEventListener('click', handleHeightInput);
  document.getElementById('btnSaveToggle').addEventListener('click', handleStorageSaveToggle);
});

// 保存トグルのUI画像更新
function updateSaveToggleUI() {
  const imgBtn = document.getElementById('imgSaveBtn');
  if (isSaveOn) {
    imgBtn.src = 'button_hozon_on.png';
  } else {
    imgBtn.src = 'bottun_hozon_off.png';
  }
}

// 保存完了トースト通知表示
function triggerSaveNotification() {
  const toast = document.getElementById('saveToast');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// トグルスイッチクリック時の処理
function handleStorageSaveToggle() {
  isSaveOn = !isSaveOn;
  updateSaveToggleUI();

  if (isSaveOn) {
    // ONの場合は現在のデータを保存し、通知を表示
    localStorage.setItem('koma_members_data', JSON.stringify(membersData));
    triggerSaveNotification();
  } else {
    // OFFの場合はLocalStorageからデータをクリア
    localStorage.removeItem('koma_members_data');
  }
}

// データ変更時の自動保存処理
function autoSaveIfEnabled() {
  if (isSaveOn) {
    localStorage.setItem('koma_members_data', JSON.stringify(membersData));
    triggerSaveNotification();
  }
}

// ココフォリア/いあきゃら駒データのパース
function handleKomaInput() {
  const rawText = document.getElementById('txtKomaData').value.trim();
  if (!rawText) return;

  try {
    const parsed = JSON.parse(rawText);
    if (!parsed.data || !parsed.data.name) {
      alert('正しい駒データの形式ではありませんでした。');
      return;
    }

    const charData = parsed.data;
    const params = charData.params || charData.parameters || [];
    const getParam = (label) => {
      const p = params.find(item => item.label === label);
      return p ? Number(p.value) || 0 : 0;
    };

    // キャラクター画像の抽出
    let avatarUrl = '';
    if (charData.image) {
      avatarUrl = charData.image;
    } else if (charData.faces && charData.faces.length > 0 && charData.faces[0].iconUrl) {
      avatarUrl = charData.faces[0].iconUrl;
    }

    const newMember = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: charData.name,
      avatar: avatarUrl,
      str: getParam('STR'),
      con: getParam('CON'),
      pow: getParam('POW'),
      siz: getParam('SIZ'),
      app: getParam('APP'),
      dex: getParam('DEX'),
      int: getParam('INT'),
      edu: getParam('EDU'),
      height: null
    };

    membersData.push(newMember);
    
    renderAll();
    autoSaveIfEnabled();
    document.getElementById('txtKomaData').value = '';
    
  } catch (e) {
    alert('データのパースに失敗しました。正しいJSON形式か確認してください。');
  }
}

// 身長データの紐付け反映
function handleHeightInput() {
  let isUpdated = false;

  const processInput = (nameId, heightId) => {
    const nameInput = document.getElementById(nameId);
    const heightInput = document.getElementById(heightId);
    if (!nameInput || !heightInput) return;

    const name = nameInput.value.trim();
    const height = heightInput.value.trim();

    if (name && height) {
      const member = membersData.find(m => m.name === name);
      if (member) {
        member.height = Number(height) || null;
        nameInput.value = '';
        heightInput.value = '';
        isUpdated = true;
      } else {
        alert(`「${name}」と一致する登録メンバーが見つかりませんでした。`);
      }
    } else if (name || height) {
      alert('名前と身長の両方を入力してください。');
    }
  };

  processInput('inputName1', 'inputHeight1');
  processInput('inputName2', 'inputHeight2');

  if (isUpdated) {
    renderAll();
    autoSaveIfEnabled();
  }
}

// すべての表示要素の統合描画
function renderAll() {
  renderMembers();
  renderRankings();
}

// 登録メンバー一覧の描画
function renderMembers() {
  const grid = document.getElementById('memberGrid');
  grid.innerHTML = '';

  if (membersData.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-member-message';
    emptyMsg.innerText = '誰も登録してないときは、上に駒データを貼り付けてね！';
    grid.appendChild(emptyMsg);
    return;
  }

  membersData.forEach((member, index) => {
    const card = document.createElement('div');
    card.className = 'member-card';
    
    // アバター画像がある場合は表示
    let avatarHTML = '';
    if (member.avatar) {
      avatarHTML = `<img src="${member.avatar}" alt="${member.name}" class="member-avatar">`;
    } else {
      // 画像がない場合はダミー領域を表示
      avatarHTML = `<div class="member-avatar" style="display: flex; align-items: center; justify-content: center; font-size: 60px; color: #81736d; font-weight: bold; border: 3px dashed rgba(129,115,109,0.3); box-sizing: border-box;">？</div>`;
    }

    // 画像追加ボタンのHTML（画像がない場合のみ表示）
    let tuikaBtnHTML = '';
    if (!member.avatar) {
      tuikaBtnHTML = `
        <button type="button" class="btn-tuika btn-tuika-card" data-index="${index}">
          <img src="buttun_tuika.png" alt="画像を追加する">
        </button>
      `;
    }

    card.innerHTML = `
      ${avatarHTML}
      <div class="member-name">${member.name}</div>
      <div class="member-stats">
        <div class="member-stat-row"><span>STR</span><strong>${member.str}</strong></div>
        <div class="member-stat-row"><span>CON</span><strong>${member.con}</strong></div>
        <div class="member-stat-row"><span>POW</span><strong>${member.pow}</strong></div>
        <div class="member-stat-row"><span>SIZ</span><strong>${member.siz}</strong></div>
        <div class="member-stat-row"><span>APP</span><strong>${member.app}</strong></div>
        <div class="member-stat-row"><span>DEX</span><strong>${member.dex}</strong></div>
        <div class="member-stat-row"><span>INT</span><strong>${member.int}</strong></div>
        <div class="member-stat-row"><span>EDU</span><strong>${member.edu}</strong></div>
        <div class="member-stat-row member-height-row"><span>身長</span><strong>${member.height ? member.height + 'cm' : '--'}</strong></div>
      </div>
      ${tuikaBtnHTML}
    `;

    grid.appendChild(card);
  });

  // 画像追加ボタンのイベントリスナー設定
  grid.querySelectorAll('.btn-tuika-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      handleImageUpload(idx);
    });
  });
}

// キャラクター画像追加のハンドラ
function handleImageUpload(index) {
  const url = prompt('キャラクター画像のURLを入力してください：');
  if (url && url.trim()) {
    membersData[index].avatar = url.trim();
    renderAll();
    autoSaveIfEnabled();
  }
}

// 各種ランキングと平均値の計算・描画
function renderRankings() {
  const stats = ['str', 'con', 'pow', 'siz', 'app', 'dex', 'int', 'edu', 'height'];

  stats.forEach(stat => {
    const listBox = document.getElementById(`rank-${stat}`);
    const avgBox = document.getElementById(`avg-${stat}`);
    listBox.innerHTML = '';

    // ランキング対象データのフィルタリング（身長のみnullを除外）
    let validMembers = membersData.filter(m => m[stat] !== null && m[stat] !== undefined);

    if (validMembers.length === 0) {
      listBox.innerHTML = '<div style="text-align:center; padding-top:200px; font-size:24px; color:#81736d;">データなし</div>';
      avgBox.innerText = '平均: --';
      return;
    }

    // 数値の高い順にソート
    validMembers.sort((a, b) => b[stat] - a[stat]);

    // ランキングテキストを構築して挿入
    validMembers.forEach((member, index) => {
      const item = document.createElement('div');
      item.className = 'ranking-item';
      
      const unit = stat === 'height' ? 'cm' : '';
      item.innerHTML = `
        <span>${index + 1}位 ${member.name}</span>
        <strong>${member[stat]}${unit}</strong>
      `;
      listBox.appendChild(item);
    });

    // 平均値の計算
    const sum = validMembers.reduce((acc, m) => acc + m[stat], 0);
    const avg = (sum / validMembers.length).toFixed(1);
    const unit = stat === 'height' ? 'cm' : '';
    avgBox.innerText = `平均: ${avg}${unit}`;
  });
}