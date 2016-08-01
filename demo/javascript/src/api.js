var React = require("react");
var ReactDOM = require('react-dom');

var Webim = require('./components/webim');

var textMsg = require('./components/message/txt');
var imgMsg = require('./components/message/img');
var fileMsg = require('./components/message/file');
var locMsg = require('./components/message/loc');
var audioMsg = require('./components/message/audio');
var videoMsg = require('./components/message/video');

module.exports = {
    log: function () {
        console.log(arguments);
    },

    render: function ( node, change ) {
        this.node = node;

        var props = {};
        switch ( change ) {
            case 'roster':
                props.rosterChange = true;
                break;
            case 'group':
                props.groupChange = true;
                break;   
            case 'chatroom':
                props.chatroomChange = true;
                break;
            default: 
                props = null;
                break;
        };

        if ( props ) {
            ReactDOM.render(<Webim config={WebIM.config} close={this.logout} {...props} />, this.node);
        } else {
            ReactDOM.render(<Webim config={WebIM.config} close={this.logout} />, this.node);
        }
    },

    logout: function () {
        Demo.conn.close();
        ReactDOM.unmountComponentAtNode(this.node);
        this.render(this.node);
    },

    appendMsg: function ( msg, type ) {
        if ( !msg ) {
            return;
        }
        msg.from = msg.from || Demo.user;
        msg.type = msg.type || 'chat';

        this.sentByMe = msg.from === Demo.user;

        var brief = '',
            data = msg.data || msg.msg || '',
            name = this.sendByMe ? Demo.user : msg.from,
            targetId = this.sentByMe || msg.type !== 'chat' ? msg.to : msg.from,
            targetNode = document.getElementById('wrapper' + targetId);

        if ( msg.type !== 'chat' && !targetNode ) {
            return;
        }

        switch ( type ) {
            case 'txt':
                brief = WebIM.utils.parseEmoji(this.encode(data).replace(/\n/mg, ''));
                textMsg({
                    wrapper: targetNode,
                    name: name,
                    value: brief,
                }, this.sentByMe);
                break;
            case 'emoji':
                for ( var i = 0, l = data.length; i < l; i++ ) {
                    brief += data[i].type === 'emoji' 
                        ? '<img src="' + WebIM.utils.parseEmoji(this.encode(data[i].data)) +'" />'
                        : this.encode(data[i].data);
                }
                textMsg({
                    wrapper: targetNode,
                    name: name,
                    value: brief,
                }, this.sentByMe);
                break;
            case 'img':
                brief = '[' + Demo.lan.image + ']';
                imgMsg({
                    wrapper: targetNode,
                    name: name,
                    value: data || msg.url,
                }, this.sentByMe);
                break;
            case 'aud':
                brief = '[' + Demo.lan.audio + ']';
                audioMsg({
                    wrapper: targetNode,
                    name: name,
                    value: data || msg.url,
                    length: msg.length,
                    id: msg.id
                }, this.sentByMe);
                break;
            case 'cmd':
                brief = '[' + Demo.lan.cmd + ']';
                log(msg);
                break;
            case 'file':
                brief = '[' + Demo.lan.file + ']';
                fileMsg({
                    wrapper: targetNode,
                    name: name,
                    value: data || msg.url,
                    filename: msg.filename
                }, this.sentByMe);
                break;
            case 'loc':
                brief = '[' + Demo.lan.location + ']';
                locMsg({
                    wrapper: targetNode,
                    name: name,
                    value: data || msg.addr
                }, this.sentByMe);
                break;
            case 'video':
                brief = '[' + Demo.lan.video + ']';
                videoMsg({
                    wrapper: targetNode,
                    name: name,
                    value: data || msg.url,
                    length: msg.length,
                    id: msg.id
                }, this.sentByMe);
                break;
            default: break;
        };

        // show brief
        this.appendBrief( targetId, brief);

        if ( msg.type === 'cmd' ) {
            return;
        }

        // show count
        switch ( msg.type ) {
            case 'chat':
                if ( this.sentByMe ) { return; }
                var contact = document.getElementById(msg.from),
                    cate = contact ? 'friends' : 'strangers';
                
                this.addCount(msg.from, cate);
                break;
            case 'groupchat':
                var cate = msg.roomtype ? 'chatrooms' : 'groups';

                this.addCount(msg.to, cate);
                break;
        };
        
    },

    appendBrief: function ( id, value ) {
        var cur = document.getElementById(id);
        cur.querySelector('em').innerHTML = value;
    },

    addCount: function ( id, cate ) {
        if ( Demo.selectedCate !== cate ) {
            var curCate = document.getElementById(cate).getElementsByTagName('i')[1];
            curCate.style.display = 'block';

            var cur = document.getElementById(id).querySelector('i');
            var curCount = cur.getAttribute('count') / 1;
            curCount++;
            cur.setAttribute('count', curCount);
            cur.innerText = curCount > 999 ? '...' : curCount + '';
            cur.style.display = 'block';
        } else {
            if ( !this.sentByMe && id !== Demo.selected ) {
                var cur = document.getElementById(id).querySelector('i');
                var curCount = cur.getAttribute('count') / 1;
                curCount++;
                cur.setAttribute('count', curCount);
                cur.innerText = curCount > 999 ? '...' : curCount + '';
                cur.style.display = 'block';
            }    
        }

    },

    updateChatroom: function () {
        this.render(this.node, 'chatroom');
    },

    updateRoster: function () {
        this.render(this.node, 'roster');
    },

    updateGroup: function ( groupId ) {
        this.render(this.node, 'group');
    },

    deleteFriend: function ( username ) {
        Demo.conn.removeRoster({
			to: username,
			success: function () {
				Demo.conn.unsubscribed({
					to: username
				});

                var dom = document.getElementById(username);
                dom && dom.parentNode.removeChild(dom);
			},
			error : function() {}
		});
    },

    encode: function ( str ) {
        if ( !str || str.length === 0 ) {
            return '';
        }
        var s = '';
        s = str.replace(/&amp;/g, "&");
        s = s.replace(/<(?=[^o][^)])/g, "&lt;");
        s = s.replace(/>/g, "&gt;");
        s = s.replace(/\"/g, "&quot;");
        s = s.replace(/\n/g, "<br>");
        return s;
    },

    scrollIntoView: function ( node ) {
        setTimeout(function () {
            node.scrollIntoView(true);
        }, 50);
    }
};
