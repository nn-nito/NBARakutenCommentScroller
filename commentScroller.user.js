// ==UserScript==
// @name        NBA楽天 コメントをニコニコ風に流す
// @namespace   nn-nito
// @description NBA楽天のライブ配信時のコメントをニコニコ風に流す
// @include     https://nba.rakuten.co.jp/games/*
// @version     1.1.2
// @grant       none
// @noframes
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/move.js/0.5.0/move.min.js
// ==/UserScript==

(() => {
	//=======================================================================
	/** ユーザーカスタム */

	/**
	 * 行に並べられる最大数
	 * ※ここをいじるとコメントの大きさを変えることができます
	 */
	const MAX_LINE_COUNT = 14;

	/**
	 * コメントの生存時間(ミリ秒)
	 * ※ここをいじるとコメントの流れる速さを変えることができます
	 */
	const DURATION = 5000;

	/**
	 * コメントの不透明度
	 * 0.0（完全に透明）～1.0（完全に不透明)
	 */
	const OPACITY = 0.50;

	/**
	 * コメントの色
	 * デフォルトは白
	 */
	const FONT_COLOR = '#ffffff';
	//=======================================================================

	/** メンバ変数 */
	const dataKey = 'nbacomment';
	let retry = 1000, $screen;

	/** コメント処理 */
	$.fn.comment = function (message) {
		if (message == null || message == '') {
			return;
		}
		var data = this.data(dataKey);
		if (!data) {
			data = {
				rows: [],
			};
		}

		var comment = $('<span>', { 'class': 'nba-comment' })
			.addClass('nba-comment-custom')
			.text(message)
			.hide();
		this.append(comment);

		var cmHeight = comment.height();
		var numOfRow = Math.max(Math.floor(this.height() / cmHeight) - 1, 0);
		var time = DURATION;

		var oldestLeft = this.width();
		var index = 0;
		for (var i = 0; i < numOfRow; i++) {
			if (data.rows[i] != null) {
				var older = data.rows[i];
				var deltaV = (comment.width() - older.width()) / time;
				var olderT = ((older.position().left + older.width()) * time) / (this.width() + older.width());
				var deltaD = this.width() - older.position().left - older.width();
				if (deltaD < 0 || deltaV * olderT > deltaD) {
					if (older.position().left < oldestLeft) {
						oldestLeft = older.position().left;
						index = i;
					}
					continue;
				}
			}
			index = i;
			break;
		}
		data.rows[index] = comment;
		comment.css({
			'top': cmHeight * index,
			'left': this.width(),
			'padding': '5px',
			'pointer-events': 'none',
		});
		comment.show();

		move(comment[0])
        .to(-(this.width() + comment.width()))
        .duration(time)
		.ease('linear')
        .end(
			() => comment.remove()
		);

		// data属性設定
		this.data(dataKey, data);
	}

	/** メイン処理 */
	function main() {
		let ps = $('.pGamesDetail-video-container')[0];
		if (!ps) {
			window.setTimeout(function () {
				if (retry--) main();
			}, 100);
			return;
		}

		const pObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes.length == 0) return;
				if (mutation.addedNodes[0].className == 'pGamesDetail-video-chat slide-enter slide-enter-active') {
					// 初回読み込みで多量にコメントを検知してしまうので初回はsetTimeout使用
					window.setTimeout(function () {
						$screen = $('#mainContainer');
						$screen.css({
							'white-space': 'nowrap',
							'overflow': 'hidden',
							'position': 'relative',
						});

						updateStyle($screen.height() / MAX_LINE_COUNT);

						const chatContainer = document.querySelector('.ChatList-container');
						const cObserver = new MutationObserver((mutations) => {
							mutations.forEach((mutation) => {
								if (mutation.addedNodes.length == 0) return;
								let comment = mutation.addedNodes[0];
								if (comment.className != 'ChatCard') return;
								const text = comment.children[1].innerText;
								$screen.comment(text);
							});
						});

						cObserver.observe(chatContainer, { childList: true });
					}, 1000);
				}
			});
		});
		pObserver.observe(ps, { childList: true });

		$(window).resize(function () {
			if ($screen.length === 0) return;
			// リサイズしたらコメント全て削除
			$('.nba-comment').remove();
			updateStyle($screen.height() / MAX_LINE_COUNT);
		});
	}

	/** スタイルを更新 */
	function updateStyle(size) {
		let style = '';
		style += '<style type="text/css">';
		style +=
			'.nba-comment' +
			'{' +
			' position: absolute;' +
			' white-space: nowrap;' +
			' color:' + FONT_COLOR + ';' +
			' height: ' + size + 'px;' +
			' font-size: ' + size + 'px;' +
			' font-family: sans-serif;' +
			' font-weight: bold;' +
			' opacity:' + OPACITY + ';' +
			' pointer-events: none;' +
			'}';
		style += '</style>';
		$('head').append(style);
	}

	$(document).ready(function () {
		main();
	})
})();