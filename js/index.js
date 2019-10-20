/* Index Javascript */
const $readRegeditBtn = $('#readRegeditBtn');
const $displayBtn = $('#displayBtn');
const $reloadBtn = $('#reloadBtn');

$displayBtn.attr('disabled', 'true');

const $regedit = $('#readReditBtn');
const $tips = $('.tips');
const $tbody = $('.tbody');
const $count = $tips.find('.count');

function replaceTipsHTML(content) {
  $tips.find('.tips-left').html(content);
}

let countNum = parseInt($count.text()) + 1;

function addClickCount() { // 增加按钮点击数
  $count.text(countNum++);
}

function cloneTemplate(parent, index, data) { // 克隆模板
  let template = $('.template').clone();
  template.children('.num').html(index);
  template.children('.product').html(data);
  template.removeClass('template').addClass('block');
  parent.append(template);
}

let tmpData;

function setTempData(data) { // 临时存储所有数据在当前全局变量（游览器内存）
  tmpData = data;
}

$readRegeditBtn.on('click', () => {
  $displayBtn.removeAttr('disabled');
  addClickCount();
  ipcRenderer.send('getRegedit', 'ping');
})


ipcRenderer.on('getRegedit-reply', (event, arg) => {
  setTempData(arg);

  replaceTipsHTML(`已经成功读取到注册表数据，请点击显示信息按钮。`);
  
})

$displayBtn.on('click', () => {
  addClickCount();
  ipcRenderer.send('readRegedit', 'ping');
})

ipcRenderer.on('readRegedit-reply', (event, arg) => {
  replaceTipsHTML(`本次已读取到${tmpData.length}个软件名字。`);

  $tbody.children('tr.block').remove();

  for (let i = 0; i < tmpData.length; i++) { // 生成table
    cloneTemplate($tbody, (i + 1), tmpData[i]);
  }
})

$reloadBtn.on('click', () => {
  addClickCount();
  ipcRenderer.send('reloadRegedit', 'ping');
})

$('.fix-bar span.glyphicon').on('click', function () {
  let $this = $(this);

  if ($this.hasClass('glyphicon-arrow-up'))
    $('html, body').animate({ scrollTop: '0px' }, 500);
  else
    $('html, body').animate({ scrollTop: $(document).height() + 'px' }, 500);
})