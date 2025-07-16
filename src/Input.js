class Input {
    constructor() {
        this._keyMap = {};
        this._wheelDelta = 0;
        this.events = [];

        this.AddKeyDownListner(this._onKeyDown);
        this.AddKeyUpListner(this._onKeyUp);
        this.AddWheelListner(this._onWheel);
    }

    _addEventListner(element, type, callback) {
        element.addEventListener(type, callback);
        this.events.push({ element, type, callback });
    }

    AddKeyDownListner(callback) {
        this._addEventListner(document, 'keydown', callback);
    }

    AddKeyUpListner(callback) {
        this._addEventListner(document, 'keyup', callback);
    }

    AddMouseMoveListner(callback) {
        this._addEventListner(document, 'mousemove', callback);
    }

    AddClickListner(callback) {
        this._addEventListner(document.body, 'click', callback);
    }

    AddMouseDownListner(callback) {
        this._addEventListner(document.body, 'mousedown', callback);
    }

    AddMouseUpListner(callback) {
        this._addEventListner(document.body, 'mouseup', callback);
    }

    AddWheelListner(callback) {
        this._addEventListner(document, 'wheel', callback);
    }

    _onKeyDown = (event) => {
        this._keyMap[event.code] = 1;
    }

    _onKeyUp = (event) => {
        this._keyMap[event.code] = 0;
    }

    _onWheel = (event) => {
        this._wheelDelta = event.deltaY;
    }

    GetKeyDown(code) {
        return this._keyMap[code] === undefined ? 0 : this._keyMap[code];
    }

    GetWheelDelta() {
        const delta = this._wheelDelta || 0;
        this._wheelDelta = 0;
        return delta;
    }

    ClearEventListners() {
        this.events.forEach(e => {
            e.element.removeEventListener(e.type, e.callback);
        });

        this.events = [];
        this.AddKeyDownListner(this._onKeyDown);
        this.AddKeyUpListner(this._onKeyUp);
        this.AddWheelListner(this._onWheel);
    }
}

const inputInstance = new Input();
export default inputInstance;
