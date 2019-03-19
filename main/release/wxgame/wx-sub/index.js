let Consts = {
    OpenDataKeys: {
        ScoreKey: "xScore", // 存储在微信云端的分数数据字段

    },
    DomainAction: { //对应主域的消息字段
        //上传新分数
        UpdateScore: "UpdateScore",
        //打开好友排行榜
        FriendRank: "FriendRank",
        //翻页
        Paging: "Paging",
    },
}

const PAGE_SIZE = 7;
const ITEM_HEIGHT = 75;
const ITEM_WIDTH = 530;

/**
 * 从高到低排序函数
 * @param {存储在微信云端的数据} gameDatas 
 * @param {依照本字段进行排序} field 
 */
const dataSorter = (gameDatas, field = Consts.OpenDataKeys.ScoreKey) => {
    return gameDatas.sort((a, b) => {
        const kvDataA = a.KVDataList.find(kvData => kvData.key === Consts.OpenDataKeys.ScoreKey);
        const kvDataB = b.KVDataList.find(kvData => kvData.key === Consts.OpenDataKeys.ScoreKey);
        const gradeA = kvDataA ? parseInt(kvDataA.value || 0) : 0;
        const gradeB = kvDataB ? parseInt(kvDataB.value || 0) : 0;
        return gradeA > gradeB ? -1 : gradeA < gradeB ? 1 : 0;
    });
}

class RankListRenderer {
    constructor() {
        this.totalPage = 0;
        this.currPage = 0;
        this.gameDatas = [];    //https://developers.weixin.qq.com/minigame/dev/document/open-api/data/UserGameData.html
        this.myRank = 0;
        this.init();
    }

    init() {
        this.canvas = wx.getSharedCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";
    }

    listen() {
        //监听主域发来的消息
        //msg -> {action, data}
        wx.onMessage(msg => {
            console.log("ranklist wx.onMessage", msg);
            switch (msg.action) {
                case Consts.DomainAction.FriendRank:
                    this.fetchFriendData();
                    break;

                case Consts.DomainAction.UpdateScore:
                    this.updateScore(parseInt(msg.score));
                    break;

                case Consts.DomainAction.Paging:
                    if (!this.gameDatas.length) {
                        return;
                    }
                    const delta = msg.data;
                    const newPage = this.currPage + delta;
                    if (newPage < 0) {
                        console.log("已经是第一页了");
                        return;
                    }
                    if (newPage + 1 > this.totalPage) {
                        console.log("没有更多了");
                        return;
                    }
                    this.currPage = newPage;
                    this.showPagedRanks(newPage);
                    break;

                default:
                    console.log(`未知消息类型:msg.action=${msg.action}`);
                    break;
            }
        });
    }


    //上传分数，如果分数比云端高则更新云端分数
    updateScore(score) {
        wx.getUserCloudStorage({
            keyList: [Consts.OpenDataKeys.ScoreKey],
            success: res => {
                let dList = res.KVDataList;
                console.log("getUserCloudStorage success", res);
                let cloudScore = 0;
                if (dList) {
                    for (let i = 0; i < dList.length; ++i) {
                        if (dList[i].key == Consts.OpenDataKeys.ScoreKey) {
                            cloudScore = parseInt(dList[i].value);
                            break;
                        }
                    }
                }
                if (score > cloudScore) {
                    let kvDataList = new Array();
                    kvDataList.push({ key: Consts.OpenDataKeys.ScoreKey, value: score.toString() });
                    wx.setUserCloudStorage({ KVDataList: kvDataList });
                }
            }
        });
    }

    fetchGroupData(shareTicket) {
        if (this.gameDatas.length <= 0) {
            //取出群同玩成员数据
            wx.getGroupCloudStorage({
                shareTicket,
                keyList: [
                    Consts.OpenDataKeys.ScoreKey,
                ],
                success: res => {
                    console.log("wx.getGroupCloudStorage success", res);
                    const dataLen = res.data.length;
                    this.gameDatas = dataSorter(res.data);
                    this.currPage = 0;
                    this.totalPage = Math.ceil(dataLen / PAGE_SIZE);
                    if (dataLen) {
                        this.showPagedRanks(0);
                    }
                },
                fail: res => {
                    console.log("wx.getGroupCloudStorage fail", res);
                },
            });
        }
    }

    fetchFriendData() {
        if (this.gameDatas.length <= 0) {
            //取出所有好友数据
            wx.getFriendCloudStorage({
                keyList: [
                    Consts.OpenDataKeys.ScoreKey,
                ],
                success: res => {
                    console.log("wx.getFriendCloudStorage success", res);
                    const dataLen = res.data.length;
                    this.gameDatas = dataSorter(res.data);
                    this.currPage = 0;
                    this.totalPage = Math.ceil(dataLen / PAGE_SIZE);
                    if (dataLen) {
                        this.showPagedRanks(0);
                    }
                },
                fail: res => {
                    console.log("wx.getFriendCloudStorage fail", res);
                },
            });
        }
    }

    showPagedRanks(page) {
        const pageStart = page * PAGE_SIZE;
        const pagedData = this.gameDatas.slice(pageStart, pageStart + PAGE_SIZE);
        // const pageLen = pagedData.length;
        const pageLen = 20;

        this.ctx.clearRect(0, 0, 530, 750); //清空渲染区域，准备渲染数据


        let img = wx.createImage();
        let promise = this._setPromise(img, "wx-sub/image/bg_main.png");
        Promise.all([promise]).then(() => {
            this.ctx.drawImage(img, 0, 0, 530, 750);
            for (let i = 0, len = PAGE_SIZE; i < len; i++) {
                this.drawRankItem(this.ctx, i, pageStart + i + 1, pagedData[0], pageLen);
                console.log("好友数据信息", pagedData[0]);
            }
        });
    }

    //canvas原点在左上角
    drawRankItem(ctx, index, rank, data, pageLen) {
        const avatarUrl = data.avatarUrl;
        //玩家名字超过6个字符则将多余的字符替换为...
        const nick = data.nickname.length <= 6 ? data.nickname : data.nickname.substr(0, 6) + "...";
        const kvData = data.KVDataList.find(kvData => kvData.key === Consts.OpenDataKeys.ScoreKey);
        const score = kvData ? kvData.value : 0;
        const itemGapY = ITEM_HEIGHT * (index + 1);

        //绘制单项背景
        let img = wx.createImage();
        let promise = this._setPromise(img, "wx-sub/image/item.png");
        Promise.all([promise]).then(() => {
            this.ctx.drawImage(img, 0, itemGapY, ITEM_WIDTH, ITEM_HEIGHT);
            //名次
            if (rank < 4) {
                const rankImg = wx.createImage();
                rankImg.src = `wx-sub/image/icon${rank}.png`;
                rankImg.onload = () => {
                    ctx.drawImage(rankImg, 50, 20 + itemGapY, 30, 38);
                };
            } else {
                ctx.fillStyle = "#A53838";
                ctx.textAlign = "right";
                ctx.baseLine = "middle";
                ctx.font = "35px Helvetica";
                ctx.fillText(`${rank}`, 65 + (10 * index / 10), 44 + itemGapY);
            }

            //头像
            const avatarX = 100;
            const avatarY = 10 + itemGapY;
            const avatarW = 48;
            const avatarH = 48;
            this.drawAvatar(ctx, avatarUrl, avatarX, avatarY, avatarW, avatarH);

            //名字
            ctx.fillStyle = "#A53838";
            ctx.textAlign = "middle";
            ctx.baseLine = "middle";
            ctx.font = "20px Helvetica";

            ctx.fillText(nick, 300, 40 + itemGapY);

            //分数
            ctx.fillStyle = "#A53838";
            ctx.textAlign = "middle";
            ctx.baseLine = "middle";
            ctx.font = "24px Arial";
            ctx.fillText(`${score}分`, 400, 40 + itemGapY);

            // //分隔线
            // const lineImg = wx.createImage();
            // lineImg.src = 'subdomain/images/llk_x.png';
            // lineImg.onload = () => {
            //     if(index + 1 > pageLen)
            //     {
            //         return;
            //     }
            //     ctx.drawImage(lineImg, 14, 120 + itemGapY, 720, 1);
            // };
        });
    }
    _setPromise(img, src) {
        return new Promise((resolve, reject) => {
            img.src = src;
            if (!src) {
                resolve()
            }
            img.onload = () => {
                resolve();
            }
        }).then(() => {
            console.log('背景图加载完毕');
        }).catch((err) => {
            console.log('背景图加载失败：', err);
        });

    }
    //绘制头像
    drawAvatar(ctx, avatarUrl, x, y, w, h) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 5, y - 5, w + 10, h + 10);

        const avatarImg = wx.createImage();
        avatarImg.src = avatarUrl;
        avatarImg.onload = () => {
            ctx.drawImage(avatarImg, x, y, w, h);
        };
    }
}

const rankList = new RankListRenderer();
rankList.listen();