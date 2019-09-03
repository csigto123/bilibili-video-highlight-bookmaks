var aid;
var cid;
var index;
var hltime;
var hltext;
var highlight;
var obj;

// 设置高亮点信息
const setStorage = () => {
	chrome.storage.sync.set({
		highlight: highlight
	}, function() {});
};

// 重置高亮点信息后进行新数据存入
const resetStorage = (highlight) => {
	chrome.storage.sync.set(highlight, function() {});
};

// 清空数据
const clearStorage = () => {
	chrome.storage.sync.clear(function() {});
};

// 读取高亮点信息
const getStorage = () => {
	return new Promise(function(resolve, reject) {
		chrome.storage.sync.get(null, function(data) {
			if (chrome.runtime.error) {
				console.err("Runtime error");
				reject(chrome.runtime.error);
			} else {
				resolve(data);
			}
		});
	});
};

// 点击添加高亮事件
$(document).keydown(function(e) {
	if (e.keyCode == 65) {
		e.preventDefault();
		var currentTime = $('video')[0].currentTime
		var videotime = $('.bilibili-player-video-time-total').text();
		var minute = +videotime.slice(0, videotime.indexOf(':'));
		var second = +videotime.slice(videotime.indexOf(':') + 1);
		var duration = minute * 60 + second;
		var tmpobj = {};
		tmpobj.index = index;
		tmpobj.time = currentTime;
		tmpobj.totaltime = duration;
		obj.timeandtext.push(tmpobj);
		setStorage();
		addHightLight(currentTime, duration);
		index += 1;
	}
})

const addHightLight = (currentTime, duration) => {
	if (isNaN(currentTime)) {
		var loadLeftPercent = (currentTime.time / currentTime.totaltime) * 100;
		var highlightElem = $('<div></div>').addClass('bilibili-video-highlight').attr({
			'data-hltext': currentTime.text,
			'data-hlid': currentTime.index
		}).css('left', loadLeftPercent + '%');
		$('.bilibili-player-video-progress-slider.bui.bui-slider').append(highlightElem);
	} else {
		var leftPercent = (currentTime / duration) * 100;
		var highlightElem = $('<div></div>').addClass('bilibili-video-highlight').attr('data-hlid', index).css('left',
			leftPercent + '%');
		$('.bilibili-player-video-progress-slider.bui.bui-slider').append(highlightElem);
	}
}


const addHighLightText = (text) => {
	$("[data-hlselect='selected']").attr('data-hltext', text);
}

const creatSpanText = (text) => {
	$('.bilibili-player-video-progress-detail-container span').text(text).stop().hide().fadeIn(500);
}

const deleSpanText = (text) => {
	$('.bilibili-player-video-progress-detail-container span').stop().hide().text(text);
}

// 等待加载完成
const waitLoaded = () => {
	$('.bilibili-player-video-progress-detail-container').append('<span></span>');
	$('.bilibili-player-video-progress-slider.bui.bui-slider').on('mouseenter', '.bilibili-video-highlight', function(e) {
		$(e.target).attr('data-hlselect', 'selected');
		creatSpanText($(e.target).attr('data-hltext'));
	});
	$('.bilibili-player-video-progress-slider.bui.bui-slider').on('mouseleave', '.bilibili-video-highlight', function(e) {
		$(e.target).attr('data-hlselect', '');
		deleSpanText('');
	});
};

//删除		
$(document).keydown(function(e) {
	if (e.keyCode == 68) {
		e.preventDefault();
		deleid = +$("[data-hlselect='selected']").attr('data-hlid');
		for (var l = 0; l < obj.timeandtext.length; l++) {
			if (deleid == obj.timeandtext[l].index) {
				obj.timeandtext.splice(l, 1);
				setStorage();
				$("[data-hlselect='selected']").remove();
				deleSpanText('');
			}
		}

	}
})

//添加文本		
$(document).keydown(function(e) {
	// 必须满足按键81和当前元素才弹窗
	if (e.keyCode == 83 && $("[data-hlselect='selected']")[0]) {
		e.preventDefault();
		var hlText = prompt('请输入高亮注释', '当前时间：' + $('.bilibili-player-video-progress-detail-time').text());
		if (hlText != null) {
			textid = +$("[data-hlselect='selected']").attr('data-hlid');
			for (var k = 0; k < obj.timeandtext.length; k++) {
				if (textid == obj.timeandtext[k].index) {
					obj.timeandtext[k].text = hlText;
					setStorage();
				}
			}
			addHighLightText(hlText);
		}
	}
});

// 重置storage数据的函数
const reNewStorage = () => {
	getStorage().then(function(storage) {
		highlight = storage.highlight;
		clearStorage();
		highlight = {
			highlight
		};
		resetStorage(highlight);
	})
}

const ReceiveMessageStart = (start) => {
	highlight = [];
	obj = {
		timeandtext: []
	};
	getStorage().then(function(storage) {
		highlight = storage.highlight;
		const firstOrNoHighlight = () => {
			obj.aid = start.av.aid;
			obj.cid = start.av.cid;
			highlight.push(obj);
			index = 0;
		}
		// 判断是否为首次安装。
		if (highlight.length == 0) {
			firstOrNoHighlight();
		} else {
			for (var i = 0; i < highlight.length; i++) {
				if (start.av.aid == highlight[i].aid && start.av.cid == highlight[i].cid) {
					obj = highlight[i];
					if (highlight[i].timeandtext.length == 0) {
						index = 0;
						return;
					}
					var max = obj.timeandtext[0].index;
					for (var j = 0; j < obj.timeandtext.length; j++) {
						addHightLight(obj.timeandtext[j]);
						if (obj.timeandtext[j].index > max) {
							max = obj.timeandtext[j].index
							index = max + 1;
						}
					}
					return;
				}
			}
			obj.aid = start.av.aid;
			obj.cid = start.av.cid;
			index = 0;
			highlight.push(obj);
		}
	})
}

// 判断是否载入视频和元素,并且返回resolve(msg)
const isLoaded = (start) => {
	return new Promise(function(resolve, reject) {
		if ($('video')[0].readyState == 4 && $('.bilibili-player-video-progress-slider').length > 0) {
			resolve(start);
		} else {
			reject();
		}
	})
}

// 将消息传入isLoaded的Promise进行判断,返回resolve(msg)
const onMessage = function(msg) {
	isLoaded(msg).then(function(value) {
		waitLoaded();
		reNewStorage();
		ReceiveMessageStart(value);
	});
}

// 监听bck消息
chrome.runtime.onMessage.addListener(
	onMessage
);
