const {app, BrowserWindow, ipcMain, dialog, Tray, Menu, clipboard} = require('electron');
const request = require('superagent');
const getTitle = require('get-title');
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, 'data.json');
const data = [];
let type = 'home';
let win = null;

const template = [
    {
        label : 'Open',
        click : () => win.show()
    },
    {
        label : "Save",
        submenu : [
            {
                label : 'Home',
                click : () => saveUrl('home', clipboard.readText())
            },
            {
                label : 'Github',
                click : () => saveUrl('github', clipboard.readText())
            }
        ]
    },
    {
        type : 'separator'
    },
    {
        label : 'Quit',
        click : () => app.quit()
    }
];


app.on('ready', () => {
   initData();

   const tray = new Tray(path.join(__dirname, '/image/icon/myapp-logo.png'));

   const menu = Menu.buildFromTemplate(template);

   tray.setContextMenu(menu);

   const bounds = tray.getBounds();
   
   win = new BrowserWindow({
       width : 400,
       height : 400,
       x : Math.round(bounds.x - 200 + (bounds.width / 2)),
       y : (process.platform === 'darwin' ) ? bounds.y + bounds.height + 10 : bounds.y - 400 - 10,
       show : false,
       resizable : false,
       movable : false,
       acceptFirstMouse : true,
       frame : false,
       icon : path.join(__dirname,`/image/icon/icon.png`)
   });

   

    win.loadURL(`file://${__dirname}/index.html`);
    
    win.once('ready-to-show', () => update());
    
    if (process.platform === 'darwin') {
        win.on('blur', () => win.hide());
        tray.on('right-click', () => toggle());
    }else{
        tray.on('click', () => toggle());
    }


    ipcMain.on('type', (event, _type) => {
        console.log(_type);
        type = _type;
        update();
    });

    ipcMain.on('paste', (event, url) => saveUrl(type, url));
    ipcMain.on('remove', (event, index) => removeUrl(index));

});


function update() {

    const updateData = data.filter(item => item.type === type);
    console.log(updateData);
    if ( win !== null ){
        win.webContents.send('data', updateData);
    }
}

function initData() {
    const File_YN = fs.existsSync(DATA_PATH);
    
    if ( !File_YN ){
        fs.writeFileSync(path.join(__dirname, '/data.json'), '[]');
    }

    const fileData = JSON.parse(fs.readFileSync(DATA_PATH).toString());
    console.log(fileData);
    fileData.forEach(item => {
        data.push(item);
    });
}



function saveUrl(_type, _url) {
    if ( _url.indexOf('http://') > -1 || _url.indexOf('https://') > -1){
        request.get(_url)
            .end((error, response) => {
                getTitle(response.res.text).then(_title => {
                    data.push({type : _type, url : _url, title : _title});
                    fs.writeFileSync(DATA_PATH, JSON.stringify(data));

                    if ( type === _type) {
                        update();
                    }
                })
            })
    } else {
        dialog.showErrorBox('경고 메세지', 'url 양식이 아니거나, 프로토콜이 존재하지않습니다.');
    }
}


function removeUrl(index) {
    const currentData = data.filter((item, i) => {
        item.index = i;
        return item.type === type;
    });

    let removeId = null;

    currentData.forEach((item, i) => {
        if ( i === index ){
            removeId = item.index
        }
    });

    data.splice(removeId, 1);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data));
    update();
}


function toggle() {
    if ( win.isVisible() ){
        win.hide();
    } else {
        win.show();
    }
}

