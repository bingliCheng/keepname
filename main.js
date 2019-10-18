const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const regedit = require('regedit')
const regeditPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'
const filePath = './database.json'

let mainWindow

// 最终注册表里的数据汇集的地方
let regData = []

ipcMain.on('getRegedit', (event, arg) => {

  fs.exists(path.join(__dirname, filePath), (exists) => {
    if (exists) { // 如果已经读取过注册表就不再读取，以免造成二次堵塞进程
      
    } 
    else { // 如果是第一次进来则生成文件
      console.log('writting file...')
      let tmpText = `{"data" : [`
      
      for (let item in regData) {
        tmpText += '"' + regData[item] + '",'
      }
      tmpText = tmpText.substr(0, tmpText.length - 1) //删除拼接后的最后一个逗号
      tmpText += `]}`

      fs.writeFile(filePath, tmpText, err => {
        if (err) {
          console.log(`err: ${err}`)
        }
        console.log('Write successfully ')
      })
    }
  })

  event.sender.send('getRegedit-reply', regData)
})

function getRegedit() {
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
              regData.push(tmpValues['DisplayName']['value'])
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

  fs.exists(path.join(__dirname, filePath), (exists) => { // 如果已经读取过注册表就不再读取，以免造成二次堵塞进程
    if (!exists) getRegedit()
  })

  mainWindow.webContents.openDevTools();

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
