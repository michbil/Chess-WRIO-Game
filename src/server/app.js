var _ = require('lodash');
var bigInt = require("big-integer");

var TitterClient = require('./utils/titterClient.js');
var Chess = new (require('./persistent/controller.js'))();
var appData = require('./appData');


function dumpError(err) {
    if (!err) return;
    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message);
        }
        if (err.stack) {
            console.log('\nStacktrace:');
            console.log('====================');
            console.log(err.stack);
        }
    }
}


async function wrapError(p) {
    try {
        await p();
    } catch (e) {
        console.log(e);
    }
}

class ChessService {
    constructor() {
        this.db = {};
        this.CHESS_QUERY = '"#chess"';
    }

    init(args, cb) {
        var args = args || {},
            db = args.db || {};
        this.db = db;
        appData.init({
            db: this.db
        }, function (err) {
            cb(err);
        });
    }


    async mapStatus(status) {
        try {
            var query = {
                start: status.text.match(/start/),
                chess: status.text.match(/\#chess/),
                opponent: status.text.match(/\@([^\s]+)/i),
                move: status.text.match(/([a-hA-H][0-9])\-([a-hA-H][0-9])/i),
                command: status.text.match(/(refresh|help|end)/i)
            };
            if (query.chess && query.start && query.opponent) {
                if (status.text.replace(/(\#chess|start|\@[^\s]+|[^\w\sА-Яа-яЁё]|_|\s)/ig, '') === "") {
                    console.log(status.user.screen_name, query.opponent)
                    let message = await Chess.startGame({
                        status: status,
                        opponent: query.opponent[1]
                    });
                    console.log(message);
                }
            } else if (query.chess && query.move) {
                if (status.text.replace(/(\#chess|\@[^\s]+|[a-hA-H][0-9]\-[a-hA-H][0-9]|[^\w\sА-Яа-яЁё]|_|\s)/ig, '') === "") {
                    console.log(status.user.screen_name, query.move);
                    let message = await Chess.move({
                        status: status,
                        move: {
                            from: query.move[1],
                            to: query.move[2]
                        }
                    });
                    console.log(message);
                }
            } else if (query.chess && query.command) {
                if (status.text.replace(/(\#chess|refresh|help|end|[^\w\sА-Яа-яЁё]|_|\s)/ig, '') === "") {
                    console.log(status.user.screen_name, query.command[1])
                    let message = await Chess[query.command[1]]({
                        status: status
                    });
                    console.log(message);
                }
            }
        } catch (e) {
            console.log("Error during mapStatus",e);
            dumpError(e);
        }
    }

    async searchAndReply() {
        try {
            const query = {
                q: this.CHESS_QUERY,
                since_id: appData.getSinceId()
            };
            console.log(query);
            await Chess.init({
                db: this.db
            });
            let statuses = await TitterClient.search({
                query: query
            });
            if (statuses.length > 0) {
                console.log('Titter:', 'Found', statuses.length, 'statuses');
                var lastStatus = _.max(statuses, (status) => bigInt(status.id_str));

                console.log("NR",lastStatus.id_str);
                appData.setSinceId(lastStatus.id_str);
                console.log("MAX",appData.getSinceId());
                statuses.map(this.mapStatus);
            }


        } catch (e) {
            console.log("Error during searchAndReply",e);
        }

    }
}

export default ChessService;
