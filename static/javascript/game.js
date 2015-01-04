// global namespace
var global_namespace = {};

// determine and instantiate device's screen size
(function () {
	global_namespace["screen_height"] = screen.height;
	global_namespace["screen_width"] = screen.width;
	global_namespace["default_height"] = 500;
	global_namespace["default_width"] = 320;
	global_namespace["game_link_url"] = "http://www.aijunyc.com/zhs/youxi/index.min.html";
})();

//图片地址
var share_imgurl = 'https://s3.amazonaws.com/aiju-halloween-game-bucket/game/static/image/background.png';
//分享地址
var link =global_namespace["game_link_url"];
//分享内容
var content = "👿[爱聚万圣打魔鬼]排名前10名能得到免费party票哦。👼";
//分享标题
var title  = "[爱聚]你能在90秒内击败到多少个南瓜？打到天使就输哦。🎃🎃🎃";
window.shareData = {
"imgUrl": share_imgurl,
"timeLineLink": link,
"sendFriendLink": link,
"weiboLink": link,
"tTitle": title,
"tContent": content,
"fTitle": title,
"fContent": content,
"wContent": content
};

document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {	 
// 发送给好友
WeixinJSBridge.on('menu:share:appmessage', function (argv) {
WeixinJSBridge.invoke('sendAppMessage', { 
"img_url": window.shareData.imgUrl,
"img_width": "640",
"img_height": "640",
"link": window.shareData.sendFriendLink,
"desc": window.shareData.fContent,
"title": window.shareData.fTitle
}, function (res) {
	_report('send_msg', res.err_msg);
})
});
// 分享到朋友圈
WeixinJSBridge.on('menu:share:timeline', function (argv) {
WeixinJSBridge.invoke('shareTimeline', {
"img_url": window.shareData.imgUrl,
"img_width": "640",
"img_height": "640",
"link": window.shareData.timeLineLink,
"desc": window.shareData.tContent,
"title": window.shareData.tTitle
}, function (res) {
_report('timeline', res.err_msg);
});
});
// 分享到微博
WeixinJSBridge.on('menu:share:weibo', function (argv) {
WeixinJSBridge.invoke('shareWeibo', {
"content": window.shareData.wContent,
"url": window.shareData.weiboLink
}, function (res) {
		_report('weibo', res.err_msg);
	});
});
}, false);

// update share message
global_namespace["update_share_msg_function"] = function (hit, game_time_remaining, game_time){

if(game_time_remaining == 90){
  document.title = window.shareData.tTitle = window.shareData.fTitle = "你能在90秒内击下到多少个恶魔南瓜？打到天使就输哦。🎃🎃🎃"
}
else if(game_time_remaining == 1){
  document.title = window.shareData.tTitle = window.shareData.fTitle = "我活过90秒其间打下了" + hit + "个南瓜。你能超过我吗？"
}
else {
  document.title = window.shareData.tTitle = window.shareData.fTitle = "我在" + (game_time - game_time_remaining) + "秒内打下" + hit + "个南瓜就输了，你能活下90秒吗？"
}
}

// game controller
$(document).ready(function() {

	// variables
	var screen_height = global_namespace['screen_height'];
	var screen_width = global_namespace['screen_width'];
	var default_height = global_namespace['default_height'];
	var default_width = global_namespace['default_width'];
	var game_time = 90; // 90 seconds
	var timers = {};
	var stage_timer = "stage_timer";
	var game_timer = "game_timer";
	var demon_img_src = "https://s3.amazonaws.com/aiju-halloween-game-bucket/game/static/image/demon.gif";
	var angel_img_src = "https://s3.amazonaws.com/aiju-halloween-game-bucket/game/static/image/angel.gif";
	var dead_angel_src = "https://s3.amazonaws.com/aiju-halloween-game-bucket/game/static/image/angel_out.png";
	var hit = 0;
	var first_game = true;

	if (screen_height < 800 && screen_width < 600) {
		$("#game_container").attr("height", screen_height);
		$("#game_container").attr("width", screen_width);
	}

	// author & desiger
	(function () {
		$("#ad").html("Author: Jusan Ng, Designer: 谢珺璐, Copyright: 爱聚纽约");
	})();

	// listeners
	/// listener for click demon
	$("div.game_container").on('vclick', 'div.show_demon', function () {
		$(this).children().hide("puff", 200); // the image element
		$(this).removeClass("show_demon");
		$("#score_area").val(++hit);
	});

	/// listener for click angel
	$("div.game_container").on("vclick", 'div.show_angel',function() {
		$(this).children().attr("src", dead_angel_src); // the image element
		lost();
	});

	/// restart angel game
	$('area[href="#start_game"]').on("click", function() {
		show_landing_page(false);
		show_result_page(false);
		start_game();
	});

	/// redirect to website
	$('area[href="#redirect_to_aiju"]').on("click", function() {
		window.location.replace("http://www.aijunyc.com/zhs/target?type=event&g=wansheng");
	});

	// redirect to the score board 
	$("p#rank_result").on("click", function() {
		window.location.replace("http://www.aijunyc.com/zhs/youxi/wansheng_fenshu");
	});

	/// show share box
	$('area[href="#share"]').on("click", function() {
		$(".share_page").show("clip", "slow");
	});

	/// hide share box
	$(".share_page").on("click", function() {
		$(this).hide("puff", "slow");
	});

	function disable_all_demon_click() {
		$("div.show_demon").removeClass("show_demon");
	}

	function show_landing_page(show) {
		if (show)
			$(".start_page").show("clip", "slow");
		else
			$(".start_page").hide("puff", "slow");
	}

	function show_result_page(show) {
		if (show) {
			var timestamp = global_namespace["ts_gen"];
			var time_remains = $("#timer_area").val();
			get_rank_from_server(hit, timestamp, game_time - time_remains);				
			$("#ts").html(timestamp);

			// remind user to share when they are playing first game
			if (first_game){
				$(".share_page").show("clip", "slow");
				first_game = false;
				setTimeout(function(){
				$(".share_page").hide("puff", "fast");
				},6000);
			}
				
			$(".result_page").show("clip", "slow");
			$("#hit_result").html(hit);
		}
		else {
			$(".result_page").hide("puff", "slow");
			$("#hit_result").html("");
			$("#rank_result").html("");
		}
	}

	function start_game() {
		reset_game();
		count_down_timer(game_time, "恶魔!");		
	}

	function reset_game() {
		hit = 0;
		global_namespace["update_share_msg_function"](hit, game_time, game_time);
		$("rank_result").html("");
		$("#score_area").val(hit);

		for(var i = 1; i<=9; i++) {
			remove_demon(i);
			remove_angel(i);
		}
	}

	function end_game(seconds) {
		clear_intervals([timers[game_timer],timers[stage_timer]]);
		disable_all_demon_click();
		var game_time_remaining = $("#timer_area").val();
		global_namespace["update_share_msg_function"](hit, game_time_remaining, game_time);
			
		// delay 3 seconds
		setTimeout(function() {
			show_result_page(true);	
		},1500);
	}

	function lost() {
		end_game();
	}

	function win() {
		end_game();
	}

	// game mechanic logic
	function run(difficulty_interval, num_demon, angel_prob, stage_timer) {
		
		var positions_arr = [];
		timers[stage_timer] = setInterval(function() {

			// remove any existing demon/angel group
			if (positions_arr.length > 0) {
				for (var i = 0; i < positions_arr.length; i++) {
					remove_angel(positions_arr[i]);
					remove_demon(positions_arr[i]);
				}
			}

			// generate new demon group
			positions_arr = generate_unique_n_random(num_demon);
		
			for (var i = 0; i < positions_arr.length; i++) {
				if (Math.random() < angel_prob)
					show_angel(positions_arr[i]);
				else
					show_demon(positions_arr[i]);		
			}
		
		},difficulty_interval);
	}

	function count_down_timer(seconds, end_message) {
		timers[game_timer] = setInterval(function(){

			// game difficulty control
			if (seconds == 90) 
				run(1100, 4, 0.25,stage_timer);
			else if (seconds == 62 || seconds == 61)
				$("div.game_container").effect("pulsate", "fast");
			else if (seconds == 60) {
				clearInterval(timers[stage_timer]); // reset interval
				run(1000, 5, 0.3,stage_timer);
			}
			else if (seconds == 32 || seconds == 31)
				$("div.game_container").effect("pulsate", "fast");
			else if (seconds == 30) {
				clearInterval(timers[stage_timer]); // reset interval
				run(1000, 6, 0.35,stage_timer);
			}
			// game time control
			if (seconds == 3 || seconds == 2 || seconds == 1 )
				$("div.game_container").effect("pulsate", "fast");
			
			if (seconds > 0) {
				$("#timer_area").val(seconds--);
			}
			else {
				win();
			}
		}, 1000);	
  }

	function generate_unique_n_random(n) {					
		var pool = [1,2,3,4,5,6,7,8,9];
		var out_arr = [];

		if (n >= pool.length || n < 1) {
			throw "error input";
		}
		var i = n
		while (i >= 1) {	
			var idx = Math.floor(pool.length * Math.random());
			var drawn = pool.splice(idx, 1); // pop ele in pool[idx] and add to drawn
			out_arr.push(drawn[0]);
			i--;
		}
		if (out_arr.length != n) {
			throw "error output";
		}
		return out_arr;
	}

	function show_demon(demon_position) {
		var click_img = "#img" + demon_position;
		var click_div = "#position" + demon_position;
		$(click_div).addClass("show_demon");
		$(click_img).attr("src", demon_img_src);
		$(click_img).show("fade", 300);
	}

	function show_angel(angel_position) {
		var click_img = "#img" + angel_position;
		var click_div = "#position" + angel_position;
		$(click_div).addClass("show_angel");
		$(click_img).attr("src", angel_img_src);
		$(click_img).show("fade", 300);	
	}

	function remove_demon(demon_position) {
		var click_div = "#position" + demon_position;
		$(click_div).removeClass("show_demon");
		var click_img = "#img" + demon_position;
		$(click_img).hide("fade", 200);
	}

	function remove_angel(angel_position) {
		var click_div = "#position" + angel_position;
		$(click_div).removeClass("show_angel");
		var click_img = "#img" + angel_position;
		$(click_img).hide("fade", 200);
	}

	function clear_intervals(interval_arr) {
		if (interval_arr instanceof Array) {
			while (interval_arr.length > 0)
				clearInterval(interval_arr.pop());
		}
	}

	// RUN!
	show_landing_page(true);
});

global_namespace["ts_gen"] = function () {
	var timestamp = new Date().getTime();
	return timestamp;
}

function get_rank_from_server (hit, ts, elapse_game_time) {
	
	$.post('http://www.aijunyc.com/zhs/youxi/wansheng',{score:hit,timestamp:ts,game_time:elapse_game_time},function(data) {
		$("#rank_result").html(data);
	},"Json");
}
