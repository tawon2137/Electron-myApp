const {ipcRenderer, clipboard, shell} = require("electron");

class RendererMain {
    constructor() {
        this._btnHome = document.getElementById('btn_home');
        this._btnGithub = document.getElementById('btn_github');
        this._dataDom = document.getElementById('data-content');


        this._bindDomEvent();
        this._bindIpcEvent();
    }

    _bindDomEvent() {
        this._btnHome.addEventListener('click', this._changeType);
        this._btnGithub.addEventListener('click',this._changeType);
        document.addEventListener('paste', this._paste.bind(this));
    }

    _bindIpcEvent() {
        ipcRenderer.on('data', (event, data) => {
            console.log(data);
            this._dataDom.innerHTML = this._getHtml(data);
            this._setItemDom();
        });
    }
    _changeType(event) {
        console.log(this);
        const parentElemet = this.parentElement;
        if ( !parentElemet ) return false
        const activeElement = parentElemet.getElementsByClassName('active');
        if ( activeElement !== null ){
            activeElement[0].classList.remove('active');
        }

        this.classList.add('active');
        // Data 변경
        ipcRenderer.send('type', this.getAttribute('data-type'));
    }

    _paste(event) {
        const text = clipboard.readText();
        ipcRenderer.send('paste', text);
    }

    _getHtml(data) {
        const html = data.map(item => {
            console.log(item);
            return `
            <div class="card">
                <div class="card-content">
                <a class="tw-btn waves-effect remove-btn" data-waveColor="red" style="float : right;">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </a>
                </div>
                <div class="card-title clickLink">${item.url}</div>
                <div class="card-content">${item.title}</div>
            </div>
            `;
        });


        return html.join('');
    }

    _setItemDom() {
        const removeDoms = this._dataDom.querySelectorAll('.remove-btn');
        removeDoms.forEach((removeDoms, index) => {
            removeDoms.addEventListener('click', () => {
                ipcRenderer.send('remove', index);
            });
        });

        const clickDoms = this._dataDom.querySelectorAll('.clickLink');
        clickDoms.forEach( clickDom => {
            clickDom.addEventListener('click', e => {
                shell.openExternal(e.target.innerText);
            });
        });
    }
}

new RendererMain();