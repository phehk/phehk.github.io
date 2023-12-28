main();

function main () {
    $("#header").html(`
        <div class="w3-top">
            <div class="w3-bar w3-theme-d2 w3-left-align" style="font-size: 20px; display: flex;">
                <div style="margin-right: auto;">
                    <a href="./" class="w3-bar-item w3-button w3-teal" style="display: flex; padding: 10px;">
                        <img src="./images/512x512.png" style="width: 30px; margin-top: auto; margin-bottom: auto; margin-right: 10px;">
                        香港地
                    </a>
                </div>
            </div>
        </div>
    `);
    browser = getBrowser();
    installModal(browser.system, browser.supporter, browser.shell);    
    $("#content").html([
        formHTML("請輸入地段簡稱編號及選擇地段簡稱", { content: inputHTML("lotAbbr", "text"), width: "s12" }),
        formHTML("請輸入地段編號的數字部分", { content: inputHTML("lotNum", "number"), width: "s12" }),
        btnHTML("chooseLot", "確認", "changeLot()"),
        "<div class='lotInfo' style='padding-top: 10px;'></div>",
        "<div class='display' style='padding-top: 10px;'></div>"
    ].join(""));
    initAutocompleteLotAbbr();
    initArcGIS(getLotID(), displayLotInfo());
}

// GENERAL FUNCTIONS

function addModal (id, title, content) {
	$(".w3-modal").remove();
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
	`);
	$(".w3-modal").css("display", "block");
}

function ajaxGet (url) {
    return $.ajax({
        "url": url,
        "async": false
    }).responseText;
}

function arrToRGB (arr) {
	return "rgb(" + arr.join(", ") + ")";
}

function btnHTML (id, text, onclick) {
	return "<button onclick='" + onclick + "' class='w3-button w3-theme' id='" + id + "'>" + text + "</button>";
}

function center (element) {
	return "<div class='w3-center'>" + element + "</div>";
}

function changeLot () {
	$(".lotinfo, .display").html("");
	displayLot($(".lotAbbr").val(), $(".lotNum").val().toString());
}

function coordToDeg (x, y) {
	proj4.defs("EPSG:2326", "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs");
	return proj4("EPSG:2326", "EPSG:4326", [x, y]); // [long, lat]
}

function displayLot (lotAbbr, lotNumStr) {
	sectionsObj = JSON.parse(ajaxGet("https://raw.githubusercontent.com/dbobj/dbobj/main/lot/" + lotAbbr + ".json"))[lotNumStr];
	if (sectionsObj) {
		keys = Object.keys(sectionsObj);
		if (keys.length > 1) {
            keys.sort(function (key1, key2) {
                return (sectionsObj[key1].name > sectionsObj[key2].NAME) - 0.5;
            });
            options = keys.map(function (key) {
                return { val: key, text: lotAbbr + " " + sectionsObj[key].NAME };
            });
            $(".lotInfo").html(formHTML("請選擇分段編號", {
                content: selectHTML("lotName", options, "redirect($(this).val())"),
                width: "s12"
            }));
		} else if (keys[0] == getLotID()) {
		    $(".lotInfo").html(formHTML("請選擇分段編號", {
                content: selectHTML("lotName", [ { val: keys[0], text: lotAbbr + " " + sectionsObj[keys[0]].NAME } ], "redirect($(this).val())"),
                width: "s12"
            }));
            $(".lotName").val(keys[0]);
		} else {
            redirect(keys[0]);
		}
	} else {
		$(".display").html("<div>沒有相關土地</div>");
	}
	return sectionsObj;
}

function displayLotInfo () {
	lotID = getLotID();
	if (lotID) {
	    lotArr = JSON.parse(ajaxGet("https://raw.githubusercontent.com/dbobj/dbobj/main/id.json"))[lotID].split(" ");
		$(".lotAbbr").val(lotArr[0]);
		$(".lotNum").val(Number(lotArr[1]));
		sectionsObj = displayLot(...lotArr);		
		$(".lotName").val(lotID);
		lotObj = sectionsObj[lotID];
		lotUse = lotObj.COORD;
		lotPRN = lotObj.PRN;
		if (!lotPRN) {
		    lotPRN = "不存在";
		}
		files = Object.keys(lotUse);
		if (files[files.length - 1] == "Z") {
		    files.pop();
		}
		if (files.length > 0) {
			fileHTML = files.map(function (file) {
				return "<a href='https://raw.githubusercontent.com/dbobj/dbobj/main/pdf/" + file + ".pdf'>按此</a>";
			}).join(" ");
		} else {
			fileHTML = "未規劃";
		}
		placesJSON = JSON.parse(ajaxGet("https://raw.githubusercontent.com/dbobj/dbobj/main/places.json"));
		places = files.map(function (file) {
			return placesJSON[file];
		}).join("、");
		if (places) {
			placesHTML = "<div>土地位處地點: " + places + "</div>";
		} else {
			placesHTML = "";
		}
		htmlMemorial = memorialHTML(lotObj.MEMORIAL.split(", "));
		$(".display").html([
			`
			    <div>
			        <h4>地段</h4>
				    <div>下載土地資料: ` + fileHTML + `</div>
				    ` + placesHTML + `
				    <div>物業參考編號: ` + lotPRN + `</div>
				</div>
				<div>
					<h4>用途</h4>
					<div class="area"></div>
				</div>
				<div class="map" style="margin-top: 10px; margin-bottom: 10px;">
					<div id="mapWrapper" style="width: 320px; height: 320px; position: relative; overflow: hidden;">
					    <div id="map" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>
					</div>
				</div>
			`,
			btnHTML("share", "分享", "share()"),
			htmlMemorial,
			landDocHTML(lotObj.DOC)
		].join(""));
		return sectionsObj;
	}
}

function formHTML (label, ...elements) {
    html = "";
    for (let element of elements) {
        // element = { content: "...", width: "s2 m1" }
        html = html + "<div class='w3-col " + element.width + "' style='margin-top: auto; margin-bottom: auto;'>" + element.content + "</div>";
    }
	return `
		<div class="w3-section">
			<label>` + label + `</label>
			<div class="w3-row" style="display: flex;">` + html + `</div>
		</div>
	`;
}

function getBrowser () {
	system = "unknown";
	if (testUA(/windows|win32|win64|wow32|wow64/ig)) {
		system = "windows";
	} else if (testUA(/macintosh|macintel/ig)) {
		system = "macos";
	} else if (testUA(/x11/ig)) {
		system = "linux";
	} else if (testUA(/android|adr/ig)) {
		system = "android";
	} else if (testUA(/ios|iphone|ipad|ipod|iwatch/ig)) {
		system = "ios";
	}
	supporter = "unknown";
	if (testUA(/applewebkit/ig) && testUA(/safari/ig)) {
		if (testUA(/edge/ig)) {
			supporter = "edge";
		} else if (testUA(/opr/ig)) {
			supporter = "opera";
		} else if (testUA(/chrome/ig)) {
			supporter = "chrome";
		} else {
			supporter = "safari";
		}
	} else if (testUA(/gecko/ig) && testUA(/firefox/ig)) {
		supporter = "firefox";
	} else if (testUA(/presto/ig)) {
		supporter = "opera";
	} else if (testUA(/trident|compatible|msie/ig)) {
		supporter = "iexplore";
	}
	shell = "none";
	if (testUA(/micromessenger/ig)) {
		shell = "wechat";
	} else if (testUA(/qqbrowser/ig)) {
		shell = "qq";
	} else if (testUA(/ucbrowser/ig)) {
		shell = "uc";
	} else if (testUA(/2345explorer/ig)) {
		shell = "2345";
	} else if (testUA(/metasr/ig)) {
		shell = "sogou";
	} else if (testUA(/lbbrowser/ig)) {
		shell = "liebao";
	} else if (testUA(/maxthon/ig)) {
		shell = "maxthon";
	} else if (testUA(/baidubrowser/ig)) {
		shell = "baidu";
	}
	return { system: system, supporter: supporter, shell: shell }
}

function getLotID () {
    urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id")
}

function initArcGIS (lotID, obj) {
	if (lotID) {
		colors = [
			{ color: [ 148, 252, 52 ], useEN: "AGR", useZH: "農業" },
			{ color: [ 244, 76, 76 ], useEN: "C", useZH: "商業" },
			{ color: [ 148, 148, 20 ], useEN: "CA", useZH: "自然保育區" },
			{ color: [ 244, 20, 28 ], useEN: "CDA", useZH: "綜合發展區" },
			{ color: [ 236, 252, 15 ], useEN: "CP", useZH: "郊野公園" },
			{ color: [ 204, 252, 20 ], useEN: "CPA", useZH: "海岸保護區" },
			{ color: [ 186, 252, 252 ], useEN: "G/IC", useZH: "政府、機構或社區" },
			{ color: [ 204, 252, 148 ], useEN: "GB", useZH: "綠化地帶" },
			{ color: [ 228, 12, 180 ], useEN: "I", useZH: "工業" },
			{ color: [ 252, 132, 204 ], useEN: "I(D)", useZH: "工業(丁類)" },
			{ color: [ 84, 252, 20 ], useEN: "O", useZH: "休憩用地" },
			{ color: [ 189, 18, 88 ], useEN: "OS", useZH: "露天貯物" },
			{ color: [ 252, 180, 12 ], useEN: "OU", useZH: "其他用途" },
			{ color: [ 150, 24, 16 ], useEN: "R(A)", useZH: "住宅(甲類)" },
			{ color: [ 188, 108, 12 ], useEN: "R(B)", useZH: "住宅(乙類)" },
			{ color: [ 228, 180, 28 ], useEN: "R(C)", useZH: "住宅(丙類)" },
			{ color: [ 252, 220, 12 ], useEN: "R(D)", useZH: "住宅(丁類)" },
			{ color: [ 172, 20, 36 ], useEN: "R(E)", useZH: "住宅(戊類)" },
			{ color: [ 148, 156, 12 ], useEN: "REC", useZH: "康樂" },
			{ color: [ 204, 252, 148 ], useEN: "SSSI", useZH: "具特殊科學價值地點" },
			{ color: [ 196, 180, 12 ], useEN: "V", useZH: "鄉村式發展" },
			{ color: [ 228, 228, 236 ], useEN: "Z", useZH: "未規劃"}
		]
		allLotData = obj[lotID]
		lotUses = allLotData.COORD
		x = []
		y = []
		for (let plan in lotUses) {
		    for (let lotUse of lotUses[plan]) {
			    for (let polygon of lotUse.coord) {
				    for (let simplePolygon of polygon) {
					    for (let vertex of simplePolygon) {
					    	x.push(vertex[0])
					    	y.push(vertex[1])
					    }
					}
				}
			}
		}
		xMax = Math.max(...x)
		yMax = Math.max(...y)
		xMin = Math.min(...x)
		yMin = Math.min(...y)
		range = Math.max(xMax - xMin, yMax - yMin)
		center = coordToDeg((xMax + xMin) / 2, (yMax + yMin) / 2)
		modules = [
		    "esri/config",
		    "esri/Map",
		    "esri/views/MapView",
		    "esri/Graphic",
		    "esri/layers/GraphicsLayer",
		    "esri/intl"
		]
		require(modules, function (config, Map, MapView, Graphic, GraphicsLayer, intl) {
			config.apiKey = "AAPK124ec7aac2d1448da3129c242530ffe7bzmv_cB3GKPr_hfC1O4j3-JXEQlM6jNYqcqoJO-cHFpjnf4aHNVJfJKaK7MCWeZC"
			intl.setLocale("zh-HK")
			map = new Map({
				basemap: "arcgis/topographic",
                style: {
                    language: "zh-HK"
				}
			})
			view = new MapView({
				map: map,
				center: center,
				zoom: Math.floor(26 - Math.log2(range)),
				container: "map"
			})
			graphicsLayer = new GraphicsLayer()
			map.add(graphicsLayer)
			colorObjs = []
			for (let plan in lotUses) {
                for (let lotUse of lotUses[plan]) {
                    colorObj = null
                    for (let color of colors) {
                        if (color.useEN == lotUse.use) {
                            colorObj = color
                            colorObj.area = lotUse.area
                            colorObjs.push(colorObj)
                            break
                        }
                    }
                    for (let polygon of lotUse.coord) {
                        paths = polygon.map(function (boundary) {
                            return boundary.map(function (pair) {
                                return coordToDeg(...pair)
                            })
                        })
                        shape = {
                            type: "polygon",
                            rings: paths
                        }
                        simpleFillSymbol = {
                            type: "simple-fill",
                            color: colorObj.color.concat([ 0.5 ])
                        }
                        polygonGraphic = new Graphic({
                            geometry: shape,
                            symbol: simpleFillSymbol
                        })
                        graphicsLayer.add(polygonGraphic)
                    }
                }
			}
			html = ""
			colorsMentioned = [ ...new Set(colorObjs) ]
			colorsMentioned.sort(function (obj1, obj2) {
			    if (obj1.useEN == "Z") {
			        return 1
			    }
			    if (obj2.useEN == "Z") {
			        return -1
			    }
			    if (obj1.useEN == "OU") {
			        return 1
			    }
			    if (obj2.useEN == "OU") {
			        return -1
			    }
			    return (obj1.useEN > obj2.useEN) - 0.5
			})
			for (let colorMentioned of colorsMentioned) {
				if (colorMentioned.useEN == "Z") {
					colorHTML = "<span>未規劃</span>"
				} else {
					colorHTML = "<span>" + colorMentioned.useZH + " </span><span>" + colorMentioned.useEN + "</span>"
				}
				html = html + `
					<div>
						<div style="margin-right: 5px; float: left; height: 25px; width: 25px; clear: both; background-color: ` + arrToRGB(colorMentioned.color) + `;"></div>
						`+ colorHTML + `
						<br>
						<span>面積 </span>
						<span>` + colorMentioned.area.toFixed(1) + ` 平方米 </span>
						<span>(` + (colorMentioned.area / 0.09290304).toFixed(0) + ` 平方呎)</span>
					</div>
				`
			}
			$(".area").html(html)
		})
	}
}

function initAutocompleteLotAbbr () {
    $(".lotAbbr").prop("disabled", true)
    lotAbbr = JSON.parse(ajaxGet("https://raw.githubusercontent.com/dbobj/dbobj/main/abbr.json"))
	$(".lotAbbr").autocomplete({
		source: lotAbbr
	})
	$(".lotAbbr").prop("disabled", false)
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

function landDocHTML (doc) {
	if (doc) {
	    arr = doc.split(", ")
		return `
			<div><h4>樹木保育條款</h4><span id="tree">` + translateYesNo(arr[0]) + `</span></div>
			<div><h4>建築物類型限制</h4><span id="buildingType">` + translateYesNo(arr[1]) + `</span></div>
			<div><h4>單位數量限制</h4><span id="numOfUnits">` + translateYesNo(arr[2]) + `</span></div>
			<div><h4>單位面積限制</h4><span id="unitSize">` + translateYesNo(arr[3]) + `</span></div>
			<div><h4>設計 / 規劃 / 高度條款</h4><span id="ddh">` + translateYesNo(arr[4]) + `</span></div>
			<div><h4>公共休憩用地規定</h4><span id="public">` + translateYesNo(arr[5]) + `</span></div>
			<div><h4>提供政府地方規定</h4><span id="gov">` + translateYesNo(arr[6]) + `</span></div>
			<div><h4>運作需達致主管當局滿意規定</h4><span id="satisfaction">` + translateYesNo(arr[7]) + `</span></div>
			<div><h4>轉讓限制</h4><span id="alienation">` + translateYesNo(arr[8]) + `</span></div>
			<div><h4>非牟利限制</h4><span id="profit">` + translateYesNo(arr[9]) + `</span></div>
			<div><h4>提交賬目要求</h4><span id="accounting">` + translateYesNo(arr[10]) + `</span></div>
			<div><h4>不容許利潤分配限制</h4><span id="profitDistribution">` + translateYesNo(arr[11]) + `</span></div>
			<div><h4>終止或縮減土地用途條件</h4><span id="cassation">` + translateYesNo(arr[12]) + `</span></div>
		`
	} else {
		return ""
	}
}

function memorialHTML (idArr) {
    allMemorials = JSON.parse(ajaxGet("https://raw.githubusercontent.com/dbobj/dbobj/main/memorials.json"))
	corrID = idArr
	corrID.sort(function (a, b) {
		if (allMemorials[a][0] == allMemorials[b][0]) {
			return (a > b) - 0.5
		} else {
			return (allMemorials[a][0] < allMemorials[b][0]) - 0.5
		}
	})
	html = ""
	for (let id of corrID) {
        if (allMemorials[id]) {
            if (allMemorials[id][2]) {
                consideration = "(" + allMemorials[id][2] + ")"
            } else {
                consideration = ""
            }
            html = html + `
                <div style="padding: 5px;">
                    <div>` + id + `</div>
                    <div>` + allMemorials[id][0].substr(0, 4) + " 年 " + Number(allMemorials[id][0].substr(4, 2)).toString() + " 月 " + Number(allMemorials[id][0].substr(6, 2)).toString() + " 日" + `</div>
                    <div>` + allMemorials[id][1] + " " + consideration + `</div>
                </div>
            `
        }
	}
	if (html) {
		return "<div><h4>土地註冊摘要</h4><div id='memorial'>" + html + "</div></div>"
	} else {
		return ""
	}
}

function redirect (lotID) {
    location.href = location.href.replace(location.search, "") + "?id=" + lotID
}

function removeModal () {
	$(".w3-modal").remove();
}

function selectHTML (id, options, onchange="") {
    optionsHTML = "<option value=''></option>"
    for (let option of options) {
        // option = { val: "...", text: "..." }
        optionsHTML = optionsHTML + "<option value='" + option.val + "'>" + option.text + "</option>"
    }
    return "<select class='w3-input " + id + "' style='border: solid;' onchange='" + onchange + "'>" + optionsHTML + "</select>"
}

function share () {
    console.log($("option[value=" + getLotID() + "]").text())
	navigator.share({
		title: "MDN",
		text: $("option[value=" + getLotID() + "]").text(),
		url: location.href
	})
}

function testUA (regexp) {
	return regexp.test(navigator.userAgent.toLowerCase())
}

function translateYesNo (eng) {
	if (eng == "Yes") {
		return "有"
	}
	if (eng == "No") {
		return "沒有"
	}
}