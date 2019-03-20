let MessageEnum = {
    SETVALUE: 0,
    REMOVEVALUE: 1,
    DRAW: 2,
    CLEAR: 3,
    DISPLAY: 4,
    VAL: 5,
    OVER: 6,
    OVER_CLOSE: 7,
    COUNT: 8,
    COUNT_CLOSE: 9,
};
let openDataContext = {
    _isWX: function () {
        return cc.sys.platform == cc.sys.WECHAT_GAME;

    },
    addValue: function (k, v) {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.SETVALUE,
            key: k,
            value: v
        });
    },

    removeValue: function (k, v) {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.REMOVEVALUE,
            key: k,
            value: v
        });
    },

    draw: function () {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.DRAW
        });
    },

    clear: function () {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.CLEAR
        });
    },
    display: function (sts,val) {
        if (!this._isWX()) {
            return;
        }
        // 向主线程/Worker 线程发送的消息。
        wx.postMessage({
            type: MessageEnum.DISPLAY,
            status: sts,
            value: val,
        });
    },

    beyond: function (val) {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.VAL,
            value: val,
        });
    },

    overBeyond: function (val) {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.OVER,
            value: val,
        });
    },

    overClose() {
        if (!this._isWX()) {
            return;
        }
        wx.postMessage({
            type: MessageEnum.OVER_CLOSE,
        });
    },
    showCount(val) {
        console.log("showCount消息打印", this._isWX())
        if (!this._isWX()) {
            return;
        }

        wx.postMessage({
            type: MessageEnum.COUNT,
            value: val,
        });
    },
    closeCount() {
        if (!this._isWX()) {
            return;
        }

        wx.postMessage({
            type: MessageEnum.COUNT_CLOSE,
        });
    },

};

export default openDataContext;
