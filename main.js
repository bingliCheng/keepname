const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const regedit = require('regedit')
const regeditPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'

let mainWindow

let regArr = []

ipcMain.on('getRegedit', (event, arg) => {
  event.sender.send('getRegedit-reply', regArr)
})

function getRegedit(cb) {
  // 开始获取注册表
  regedit.list([regeditPath], function (err, data) {
    if (err) {
      console.log('err' + err)
    }
    // 遍历目录
    for (let item in data) {
      // data[item].keys.length 长度
      let keys = data[item].keys
      // 获取相对应的项目名字
      // keys.length
      for (let i = 0; i <= keys.length; i++) {
        let keyName = keys[i]
        // console.log(keys[i])

        // 防止空项目报错
        if (keyName === undefined) {
          break
        }

        regedit.list([regeditPath + keyName], function (err, data) {
          if (err) {
            console.log('err' + err)
          }
          // 将当前数据存放到数组
          let tmpArr = []
          for (let i in data) {
            tmpArr.push(data[i])
          }

          let tmpValues = tmpArr[0].values
          if (tmpValues !== undefined) {
            // 首先，数据数量必须大于5，过滤无效注册表
            // 其次，我们要取的程序名字不能为空，也是防止报错
            if (Object.keys(tmpValues).length >= 5 && tmpValues['DisplayName'] !== undefined) {
              regArr.push(tmpValues['DisplayName']['value'])
            }
          }
        })
      }
    }
  })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './renderer.js'),
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')

  getRegedit()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
