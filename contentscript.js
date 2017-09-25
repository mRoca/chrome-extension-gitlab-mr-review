function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

window.addEventListener("message", function(event) {
    if (event.source !== window || !event.data.type || 'GON_VAR' !== event.data.type)
        return;

    window.gon = event.data.gon;
    boot();
}, false);


injectScript(chrome.extension.getURL('windowvar.js'), 'body');

function boot() {
    if (typeof window.gon !== 'object') {
        return;
    }

    if (window.gon.api_version !== 'v4') {
        return console.error('Invalid gitlab api version.');
    }

    if (!window.gon.current_username) {
        return console.error('No found username.');
    }

    parseMrLists();
}

function parseMrLists() {
    var lists = document.getElementsByClassName('mr-list');
    var mrs = [];
    for (var i = 0; i < lists.length; i++) {
        for (var j = 0; j < lists[i].children.length; j++) {
            mrs.push({
                'id': parseInt(lists[i].children[j].getAttribute('data-id')),
                'iid': parseInt(lists[i].children[j].getElementsByClassName('issuable-reference')[0].innerText.replace('!', ''))
            });
        }
    }

    parseMrs(mrs);
}

function parseMrs(mrs) {
    if (!mrs.length) {
        return
    }

    const projectId = document.querySelectorAll('[data-project-id]')[0].getAttribute('data-project-id'); // No sure it will work for future versions
    const baseProjectUrl = '/api/v4/projects/' + projectId + '/merge_requests';

    for (var i = 0; i < mrs.length; i++) {
        const mrIid = mrs[i].iid;
        const mrId = mrs[i].id;
        const approvedCacheKey = window.gon.current_username + '_approved_' + mrs[i].iid;
        const commentedCacheKey = window.gon.current_username + '_commented_' + mrs[i].iid;

        chrome.storage.local.get([approvedCacheKey, commentedCacheKey], function(cachedValues) {
            if (cachedValues[approvedCacheKey]) {
                identifyMr(mrId, 'approved');
            } else {
                getJson(baseProjectUrl + '/' + mrIid + '/award_emoji').then(function(res) {
                    const userHasApproved = res.filter(function(emojiRes) {
                        return emojiRes.name === 'thumbsup' && emojiRes.user.username === window.gon.current_username;
                    }).length > 0;

                    if (userHasApproved) {
                        identifyMr(mrId, 'approved');
                        setLocalCacheValue(approvedCacheKey, true);
                    }
                });
            }

            if (cachedValues[commentedCacheKey]) {
                identifyMr(mrId, 'commented');
            } else {
                getJson(baseProjectUrl + '/' + mrIid + '/notes').then(function(res) {
                    const userHasCommented = res.filter(function(comment) {
                        return comment.author.username === window.gon.current_username;
                    }).length > 0;

                    if (userHasCommented) {
                        identifyMr(mrId, 'commented');
                        setLocalCacheValue(commentedCacheKey, true);
                    }
                });
            }
        });
    }

}

function identifyMr(id, status) {
    const el = document.getElementById('merge_request_' + id);
    if ('approved' === status && el.getElementsByClassName('issuable-upvotes').length) {
        el.getElementsByClassName('issuable-upvotes')[0].style.color = 'red';
    } else if ('commented' === status && el.getElementsByClassName('issuable-comments').length) {
        el.getElementsByClassName('issuable-comments')[0].getElementsByTagName('a')[0].style.color = 'red';
    }
}

function getJson(url) {
    return fetch(window.gon.gitlab_url + url, {
        method: 'GET',
        credentials: 'include'
    }).then(function(res) {
        return res.json();
    });
}

function setLocalCacheValue(key, value) {
    var cache = {};
    cache[key] = value;
    chrome.storage.local.set(cache)
}
