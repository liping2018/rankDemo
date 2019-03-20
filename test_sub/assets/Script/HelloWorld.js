cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        ndOpenNode: cc.Node,
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!',
        ndUpPage: cc.Node,
        ndDownPage: cc.Node,
        ndClose: cc.Node,
        ndFriendRank: cc.Node,
        ndBackground: cc.Node,
    },

    ctor() {
        this._mCurrentPage = 0;


    },
    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;
    },

    //上一页
    upPage() {
        if (this._mCurrentPage > 0) {
            this._mCurrentPage--;
        } else if (this._mCurrentPage < 0) {
            this._mCurrentPage = 0;
        }
        wx.postMessage({
            action: "Paging",
            data: this._mCurrentPage
        });
    },

    //下一页
    downPage() {
        if (this._mCurrentPage < 0) {
            this._mCurrentPage = 0;
        } else {
            this._mCurrentPage++;
        }
        wx.postMessage({
            action: "Paging",
            data: this._mCurrentPage
        });
    },
    //关闭排行榜
    closeRank() {
        console.log("关闭排行榜");
        this.ndOpenNode.active = false;
        this.ndUpPage.active = false;
        this.ndDownPage.active = false;
        this.ndClose.active = false;
        this.ndBackground.active = false;
    },
    //打开排行榜
    openRank() {
        wx.postMessage({
            action: "UpdateScore",
            score: "10086000",
        });
        wx.postMessage({
            action: "FriendRank",
            score: "10086",
        });
        console.log("这里是主域");
        this.ndOpenNode.active = true;
        this.ndClose.active = true;
        this.ndUpPage.active = true;
        this.ndDownPage.active = true;
        this.ndBackground.active = true;

    },
    // called every frame
    update: function (dt) {

    },
});
