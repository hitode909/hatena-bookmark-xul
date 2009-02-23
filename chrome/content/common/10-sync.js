// リモートのブックマークと同期をとる

const EXPORT = ["Sync"];

var Sync = {};

extend(Sync, {
    createDataStructure: function Sync_createDataStructure (text) {
        let infos = text.split("\n");
        let bookmarks = infos.splice(0, infos.length * 3/4);
        return [bookmarks, infos];
    },
    fetchAll: function Sync_fetchAll () {
    },
    all: function Sync_all (url) {
        return;
        if (this._syncing) return;
        p('res start');
        net.get(url, method(this, 'allCallback'), null, true);
        p('res async');
    },
    allCallback: function Sync_allCallback (req)  {
        var BOOKMARK  = model('Bookmark');

        // XXX 初期化処理
        hBookmark.Model.resetAll();

        let [bookmarks, infos] = this.createDataStructure(req.responseText);
        let now = Date.now();
        p(sprintf('start: %d data', infos.length));

       BOOKMARK.db.beginTransaction();
       async.splitExecuter(Iterator(infos, true), 50, function([bookmark, info], i) {
            let bi = i * 3;
            let timestamp = infos[i].split("\t", 2)[1];
            let title = bookmarks[bi];
            let comment = bookmarks[bi+1];
            let url = bookmarks[bi+2];
            let b = new BOOKMARK;
            b.title = title;
            b.comment = comment;
            b.url = url;
            b.search = [title, comment, url].join("\0");
            b.date = parseInt(timestamp);
            if (url) {
                try {
                    b.save();
                } catch(e) {
                    p('error: ' + [url, title, comment, timestamp].toString());
                }
            } else {
                //
            }
        }, function() {
            // finish
            BOOKMARK.db.commitTransaction();
            p('sync finish time: ' + (Date.now() - now));
        });
    }
});


EventService.createListener('firstPreload', function() {
    if (User.user) {
        Sync.all(User.user.dataURL);
    }
});

