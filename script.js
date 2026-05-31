// 全局变量和常量
const STORAGE_KEY = 'headerGeneratorFields';
const LANG_KEY = 'headerGeneratorLang';

// 获取当前格式化的日期时间
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 默认的基础条目
const defaultFields = [
    { key: 'Description', value: '一段内容描述...' },
    { key: 'CreatedDate', value: getCurrentDateTime() },
    { key: 'Version', value: '[版本]' }
];

let fields = [];
let sortableInstance = null;

// 初始化页面
window.onload = function() {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang) {
        document.getElementById('languageSelect').value = savedLang;
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            fields = JSON.parse(savedData);
        } catch (e) {
            fields = JSON.parse(JSON.stringify(defaultFields));
        }
    } else {
        fields = JSON.parse(JSON.stringify(defaultFields));
    }

    renderFields();
    initSortable();
    generateHeader();
};

// 初始化 Sortable.js 拖拽功能
function initSortable() {
    const container = document.getElementById('fieldsContainer');
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function (evt) {
            const item = fields.splice(evt.oldIndex, 1)[0];
            fields.splice(evt.newIndex, 0, item);
            renderFields();
            initSortable();
            saveToCache();
            generateHeader();
        }
    });
}

// 渲染输入框列表
function renderFields() {
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';
    fields.forEach((field, index) => {
        const div = document.createElement('div');
        div.className = 'field-item';
        
        const isDateField = field.key.toLowerCase().includes('date') || field.key.includes('日期');
        
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = '条目名称...';
        keyInput.value = field.key;
        keyInput.oninput = () => updateField(index, 'key', keyInput.value);

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = '请输入条目内容...';
        valueInput.value = field.value;
        valueInput.oninput = () => updateField(index, 'value', valueInput.value);

        if (isDateField) {
            valueInput.className = 'date-value-input';
            valueInput.title = '双击可快速更新为当前时间';
            valueInput.placeholder = '双击可自动填入当前时间...';
            valueInput.ondblclick = () => refreshDate(valueInput, index);
        } else {
            valueInput.className = '';
            valueInput.title = '';
            valueInput.ondblclick = null;
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger';
        delBtn.innerText = '×';
        delBtn.onclick = () => removeField(index);

        div.appendChild(keyInput);
        div.appendChild(valueInput);
        div.appendChild(delBtn);
        container.appendChild(div);
    });
}

// 双击刷新日期
function refreshDate(inputElement, index) {
    const newTime = getCurrentDateTime();
    fields[index].value = newTime;
    inputElement.value = newTime;
    inputElement.style.backgroundColor = '#2ecc71';
    setTimeout(() => {
        inputElement.style.backgroundColor = '';
        generateHeader();
        saveToCache();
    }, 300);
}

// 更新字段数据并保存缓存
function updateField(index, type, val) {
    fields[index][type] = val;
    generateHeader();
    saveToCache();
}

// 添加新字段
function addField() {
    fields.push({ key: 'NewItem', value: '' });
    renderFields();
    initSortable(); 
    generateHeader();
    saveToCache();
}

// 删除字段
function removeField(index) {
    if (fields.length <= 1) {
        alert("至少保留一个条目哦！");
        return;
    }
    fields.splice(index, 1);
    renderFields();
    initSortable();
    generateHeader();
    saveToCache();
}

// 核心生成逻辑（已修改：当 key 为空时不显示冒号）
function generateHeader() {
    const lang = document.getElementById('languageSelect').value;
    localStorage.setItem(LANG_KEY, lang);

    let header = '';
    const separator = '====================================';

    if (lang === 'c-style') {
        header += `/**\n * ${separator}\n`;
        fields.forEach(f => {
            // 如果 key 为空，只输出值；否则输出 "key : value"
            if (!f.key.trim()) {
                header += ` *  ${f.value}\n`;
            } else {
                header += ` *  ${f.key.padEnd(1)} : ${f.value}\n`;
            }
        });
        header += ` * ${separator}\n */`;
    } 
    else if (lang === 'python' || lang === 'shell') {
        header += `# ${separator}\n`;
        fields.forEach(f => {
            if (!f.key.trim()) {
                header += `#  ${f.value}\n`;
            } else {
                header += `#  ${f.key.padEnd(1)} : ${f.value}\n`;
            }
        });
        header += `# ${separator}`;
    } 
    else if (lang === 'html') {
        header += `<!--\n * ${separator}\n`;
        fields.forEach(f => {
            if (!f.key.trim()) {
                header += ` *  ${f.value}\n`;
            } else {
                header += ` *  ${f.key.padEnd(1)} : ${f.value}\n`;
            }
        });
        header += ` * ${separator}\n-->`;
    }
    else if (lang === 'lua') {
        header += `--[[\n    ${separator}\n`;
        fields.forEach(f => {
            if (!f.key.trim()) {
                header += `    ${f.value}\n`;
            } else {
                header += `    ${f.key.padEnd(1)} : ${f.value}\n`;
            }
        });
        header += `    ${separator}\n]]`;
    }

    document.getElementById('outputArea').value = header;
}

function saveToCache() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

function clearCache() {
    if(confirm('确定要清除所有缓存并恢复默认设置吗？')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LANG_KEY);
        fields = JSON.parse(JSON.stringify(defaultFields));
        document.getElementById('languageSelect').value = 'c-style';
        renderFields();
        initSortable();
        generateHeader();
    }
}

document.getElementById('languageSelect').addEventListener('change', generateHeader);

function copyToClipboard() {
    const copyText = document.getElementById("outputArea");
    copyText.select();
    copyText.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(copyText.value).then(() => {
        const btn = document.querySelector('.btn-success');
        const originalText = btn.innerText;
        btn.innerText = '复制成功！';
        setTimeout(() => {
            btn.innerText = originalText;
        }, 2000);
    });
}
