fetch("https://google.com", { mode: "cors" }).then(function (resp) {
	console.log(resp)
})

function main () {
	$("#header").html(`
		<div class="w3-top">
			<div class="w3-bar w3-theme-d2 w3-left-align" style="font-size: 20px; display: flex;">
				<div style="margin-right: auto;">
					<a href="./" class="w3-bar-item w3-button w3-teal" style="display: flex; padding: 10px;">
						<img src="./images/512x512.png" style="width: 30px; margin-top: auto; margin-bottom: auto; margin-right: 10px;">
						公共房屋
					</a>
				</div>
			</div>
		</div>
	`);
	browser = getBrowser()
	installModal(browser.system, browser.supporter, browser.shell) 
	$("#content").html([
	
	].join(""))
}

function addModal (id, title, content) {
	$(".w3-modal").remove()
	$("#content").after(`
		<div class="w3-modal" id="` + id + `">
			<div class="w3-modal-content w3-card-4 w3-animate-top">
				<div class="w3-container w3-teal w3-display-container">
					<span onclick="removeModal()" class="w3-button w3-teal w3-display-topright"><i class="fa fa-remove"></i></span>
					<h4 class="w3-center">` + title + `</h4>
				</div>
				<div class="w3-container w3-card-4 w3-padding-16 w3-white">` + content + `</div>
			</div>
		</div>
	`)
	$(".w3-modal").css("display", "block")
}

function ajaxGet (url) {
    return $.ajax({
        "url": url,
        "async": false,
	"crossDomain": true,
    }).responseText
}

function btnHTML (id, text, onclick) {
	return "<button onclick='" + onclick + "' class='w3-button w3-theme' id='" + id + "'>" + text + "</button>"
}

function center (element) {
	return "<div class='w3-center'>" + element + "</div>"
}

function formHTML (label, ...elements) {
    html = ""
    for (let element of elements) {
        // element = { content: "...", width: "s2 m1" }
        html = html + "<div class='w3-col " + element.width + "' style='margin-top: auto; margin-bottom: auto;'>" + element.content + "</div>"
    }
	return `
		<div class="w3-section">
			<label>` + label + `</label>
			<div class="w3-row" style="display: flex;">` + html + `</div>
		</div>
	`
}

function getBrowser () {
	system = "unknown"
	if (testUA(/windows|win32|win64|wow32|wow64/ig)) {
		system = "windows"
	} else if (testUA(/macintosh|macintel/ig)) {
		system = "macos"
	} else if (testUA(/x11/ig)) {
		system = "linux"
	} else if (testUA(/android|adr/ig)) {
		system = "android"
	} else if (testUA(/ios|iphone|ipad|ipod|iwatch/ig)) {
		system = "ios"
	}
	supporter = "unknown"
	if (testUA(/applewebkit/ig) && testUA(/safari/ig)) {
		if (testUA(/edge/ig)) {
			supporter = "edge"
		} else if (testUA(/opr/ig)) {
			supporter = "opera"
		} else if (testUA(/chrome/ig)) {
			supporter = "chrome"
		} else {
			supporter = "safari"
		}
	} else if (testUA(/gecko/ig) && testUA(/firefox/ig)) {
		supporter = "firefox"
	} else if (testUA(/presto/ig)) {
		supporter = "opera"
	} else if (testUA(/trident|compatible|msie/ig)) {
		supporter = "iexplore"
	}
	shell = "none"
	if (testUA(/micromessenger/ig)) {
		shell = "wechat"
	} else if (testUA(/qqbrowser/ig)) {
		shell = "qq"
	} else if (testUA(/ucbrowser/ig)) {
		shell = "uc"
	} else if (testUA(/2345explorer/ig)) {
		shell = "2345"
	} else if (testUA(/metasr/ig)) {
		shell = "sogou"
	} else if (testUA(/lbbrowser/ig)) {
		shell = "liebao"
	} else if (testUA(/maxthon/ig)) {
		shell = "maxthon"
	} else if (testUA(/baidubrowser/ig)) {
		shell = "baidu"
	}
	return { system: system, supporter: supporter, shell: shell }
}

function inputHTML (id, type, onchange="") {
	return "<input class='w3-input " + id + "' type='" + type + "' style='border: solid;' onchange='" + onchange + "'>"
}

function installModal (system, supporter, shell) {
	if (system == "android" && supporter == "chrome" && shell == "none") {
		window.addEventListener("beforeinstallprompt", function (e) {
			e.preventDefault()
			deferredPrompt = e
			addModal("a2hs", "加至主畫面", center(btnHTML("add", "加入", "")))
			$("#add").click(function () {
				$("#a2hs").remove()
				deferredPrompt.prompt()
				deferredPrompt.userChoice.then(function () {
					deferredPrompt = null
				})
			})
		})
	}
	if (system == "ios" && supporter == "safari" && shell == "none") {
		if (!window.navigator.standalone) {
			$(function () {
				addModal("a2hs", "加至主畫面", `
					<ol>
						<li>按 <img src="./images/share.png" style="height: 1rem; padding-bottom: 0.2rem;"></li>
						<li>按「加至主畫面」</li>
						<li>按「加入」</li>
					</ol>
				`)
			})
		}
	}
}

function removeModal () {
	$(".w3-modal").remove()
}

function selectHTML (id, options, onchange="") {
    optionsHTML = "<option value=''></option>"
    for (let option of options) {
        // option = { val: "...", text: "..." }
        optionsHTML = optionsHTML + "<option value='" + option.val + "'>" + option.text + "</option>"
    }
    return "<select class='w3-input " + id + "' style='border: solid;' onchange='" + onchange + "'>" + optionsHTML + "</select>"
}

function testUA (regexp) {
	return regexp.test(navigator.userAgent.toLowerCase())
}
