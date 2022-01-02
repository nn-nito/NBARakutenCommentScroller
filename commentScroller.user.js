// ==UserScript==
// @name        NBA楽天 コメントをニコニコ風に流す
// @namespace   nn-nito
// @description NBA楽天のライブ配信時のコメントをニコニコ風に流す
// @include     https://nba.rakuten.co.jp/games/*
// @version     1.0.0
// @grant       none
// @noframes
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TimelineMax.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/velocity/1.5.0/velocity.min.js
// ==/UserScript==

(() => {
	//=======================================================================
	/** ユーザーカスタム */

	/**
	 * 行に並べられる最大数
	 * ※ここをいじるとコメントの大きさを変えることができます
	 */
	const MAX_LINE_COUNT = 13;

	/**
	 * コメントの生存時間
	 * ※ここをいじるとコメントの流れる速さを変えることができます
	 * 例）8000ミリ秒=8秒
	 */
	const DURATION = 6000;

	/**
	 * コメントの不透明度
	 * 0.0（完全に透明）～1.0（完全に不透明)
	 */
	const OPACITY = 0.40;

	/**
	 * コメントの色
	 * デフォルトは白
	 */
	const FONT_COLOR = '#ffffff';
	//=======================================================================

	/** メンバ変数 */
	const dataKey = 'nbacomment';
	let retry = 1000, $screen;

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
		});
		comment.show();

		var completeHandler = function (thd, ind) {
			comment.remove();
			if (typeof thd === 'function') return;
			if (data1.rows[ind] == comment) {
				data1.rows[ind] = null;
				own.data(dataKey, data1);
			}
		};

		// cssアニメーション
		// TweenMax.to(comment[0], time / 1000, {
		// 	css: { left: (-comment.width()) + 'px' },
		// 	// css: { left: (-comment.width() - 10) + 'px' },
		// 	onComplete: completeHandler,
		// 	onCompleteParams: [this.data, index],
		// 	ease: Linear.easeNone,
		// });

		// trasrate
		// TweenMax.to(comment[0], time / 1000, {
		// 	x: -(this.width() + comment.width()),
		// 	// css: { left: (-comment.width() - 10) + 'px' },
		// 	onComplete: completeHandler,
		// 	onCompleteParams: [this.data, index],
		// 	ease: Linear.easeNone,
		// });

		// timeline
		// var timeline = new TimelineMax({onComplete:completeHandler, onCompleteParams: [this.data, index],});
		// timeline.to(comment[0], time / 1000, { x: -(this.width() + comment.width()), ease: Linear.easeNone,});
		// 良さそう
		// timeline.to(comment[0], time / 1000, { x: -(this.width() + comment.width()), ease: Strong.easeIn,});


		// velocity
		comment.velocity(
			{
				translateX: -(this.width() + comment.width()) + 'px',
			},
			{
				// Option
				duration: time, // アニメーション時間
				easing: 'linear', // イージング : linear, swing, ease, ease-in, ease-out, ease-in-out, [200, 15]
				complete: function (elements) {
					comment.remove();
				},
			}
		);

		// data属性設定
		this.data(dataKey, data);
	}

	function main() {
		//=======================================
		// テスト用
		let $screen = $('.pGamesDetail-video-container.video-fullscreen');
		// let b = document.querySelector('#mainContainer');
		let $a = $('#mainContainer');
		if (!$screen.length || !$a.length || retry > 800) {
			window.setTimeout(function () {
				if (retry--) main();
			}, 10);
			return;
		}

		// screen.style.whiteSpace = 'nowrap';
		// screen.style.overflow = 'hidden';
		// screen.style.position = 'relative';
		$screen.css({
			'white-space': 'nowrap',
			'overflow': 'hidden',
			'position': 'relative',
		});

		// var $a = $('#mainContainer');
		updateStyle($a.height() / MAX_LINE_COUNT);
		// console.log($a.height() / MAX_LINE_COUNT)

		var i = 0;
		var interval = window.setInterval(function () {
			// console.log($a.height());
			i++;
			$a.comment('ああああかきくけこさしす' + i);
		}, 1000 / 3);

		$(window).resize(function () {
			$('.nba-comment').remove();
			updateStyle($a.height() / MAX_LINE_COUNT);
		});
		//=======================================



		// document.body.addEventListener('DOMNodeInserted', function (e) {
		// 	if (e.target.className == 'pGamesDetail-video-chat slide-enter slide-enter-active') {
		// 		window.setTimeout(function () {
		// 			$screen = $('#mainContainer');
		// 			$screen.css({
		// 				'white-space': 'nowrap',
		// 				'overflow': 'hidden',
		// 				'position': 'relative',
		// 			});

		// 			updateStyle($screen.height() / MAX_LINE_COUNT);

		// 			var chatContainer = document.querySelector('.ChatList-container');
		// 			chatContainer.addEventListener('DOMNodeInserted', function (e) {
		// 				let comment = e.target;
		// 				if (comment.className != 'ChatCard') return;
		// 				let c = comment.querySelector('.bTypography__variant_body2');
		// 				$screen.comment(c.textContent);
		// 			});
		// 		}, 1000);
		// 	}
		// });

		// $(window).resize(function () {
		// 	if ($screen.length === 0) return;
		// 	// リサイズしたらコメント全て削除
		// 	$('.nba-comment').remove();
		// 	updateStyle($screen.height() / MAX_LINE_COUNT);
		// });
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