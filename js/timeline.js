/**
 * @author t-yoko
 */

var tl;
var eventSource;
var bandInfos;

sideroad.initData.amount = 100;
delete sideroad.initData.chain.results;

sideroad.data = $.clone(sideroad.initData,true);

function setupFilterHighlightControls(timeline, bandIndices, theme){

	var handler = function(elmt, evt, target){
		if (evt.keyCode == 13) 
			filterTimeline(timeline, bandIndices);
	};
	
	var filter = document.getElementById("timeline_filter_text");
	SimileAjax.DOM.registerEvent(filter, "keydown", handler);
	
	var button = document.getElementById("timeline_clear_button");
	SimileAjax.DOM.registerEvent(button, "click", function(){
		clearAll(timeline, bandIndices);
	});
}

var timerID = null;
function filterTimeline(timeline, bandIndices){
	if (timerID != null) {
		window.clearTimeout(timerID);
	}
	timerID = window.setTimeout(function(){
		performFiltering(timeline, bandIndices);
	}, 300);
}
	     
function cleanString(s){
	return s.replace(/^\s+/, '').replace(/\s+$/, '');
}
	     
function performFiltering(timeline, bandIndices){
	timerID = null;
	
	var text = document.getElementById("timeline_filter_text").value;
	
	var filterMatcher = null;
	if (text.length > 0) {
		var regex = new RegExp(text, "i");
		filterMatcher = function(evt){
			return regex.test(evt.getText()) || regex.test(evt.getDescription());
		};
	}
	
	
	for (var i = 0; i < bandIndices.length; i++) {
		var bandIndex = bandIndices[i];
		timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(filterMatcher);
	}
	timeline.paint();
}   
		     
function clearAll(timeline, bandIndices){
	document.getElementById("timeline_filter_text").value = "";
	
	for (var i = 0; i < bandIndices.length; i++) {
		var bandIndex = bandIndices[i];
		timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(null);
	}
	timeline.paint();
}
	     
function nowDate(){
	var date = new Date();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	return "" + date.getFullYear() + "/" + (month < 10 ? "0" + month : month) + "/" + (day < 10 ? "0" + day : day);	
}

function clearDate(){	
	for (var i = 0; i < bandInfos.length; i++) {
		if (bandInfos[i].decorators[3]) 
			bandInfos[i].decorators.pop();
	}
	
	tl = Timeline.create(document.getElementById("my-timeline"), bandInfos, Timeline.HORIZONTAL);
	centerTimeline(nowDate() + " 12:00:00");
}

function setupDateCenterTimeline(timeline, bandInfos, theme){

	var func = function(){
		var date = document.getElementById("timeline_date_text").value;
		for (var i = 0; i < bandInfos.length; i++) {
			bandInfos[i].decorators[3] = new Timeline.SpanHighlightDecorator({
				startDate: date + " 00:00:00",
				endDate: date + " 23:59:59",
				color: "#FFBBBB",
				opacity: 65,
				// theme:      theme,
				cssClass: 't-highlight1'
			});
		}
		tl = Timeline.create(document.getElementById("my-timeline"), bandInfos, Timeline.HORIZONTAL);
		centerTimeline(date + " 12:00:00");
		
	};
	
	var date_text = document.getElementById("timeline_date_text");
	date_text.value = nowDate();
	$(date_text).datepicker({
		changeMonth: true,
		changeYear: true,
		dateFormat: 'yy/mm/dd',
		onSelect: func
	});
	
	var handler = function(elmt, evt, target){
		if (evt.keyCode == 13) 
			func();
	};
	SimileAjax.DOM.registerEvent(date_text, "keydown", handler);
}

function centerTimeline(date){
	tl.getBand(0).setCenterVisibleDate(new Date(date));
}
	     
$.extensionInitialize = function(){
    eventSource = new Timeline.DefaultEventSource();
	var theme = Timeline.ClassicTheme.create();
	theme.autoWidth = true; // Set the Timeline's "width" automatically.
	// Set autoWidth on the Timeline's first band's theme,
	// will affect all bands.
	theme.ether.backgroundColors = ["#6666cc", "#6666cc", "#6666cc"];
	bandInfos = [Timeline.createBandInfo({
		eventSource: eventSource,
		date: nowDate() + " 12:00:00",
		width: "50%",
		intervalUnit: Timeline.DateTime.DAY,
		intervalPixels: 200,
		theme: theme,
		timeZone: 9,
		layout: 'original' // original, overview, detailed
	}), Timeline.createBandInfo({
		overview: true,
		eventSource: eventSource,
		date: nowDate() + " 12:00:00",
		width: "30%",
		intervalUnit: Timeline.DateTime.MONTH,
		intervalPixels: 400,
		timeZone: 9,
		layout: 'original' // original, overview, detailed
	}), Timeline.createBandInfo({
		overview: true,
		eventSource: eventSource,
		date: nowDate() + " 12:00:00",
		width: "20%",
		intervalUnit: Timeline.DateTime.MONTH,
		intervalPixels: 100,
		timeZone: 9,
		layout: 'original' // original, overview, detailed
	})];
	bandInfos[1].syncWith = 0;
	bandInfos[2].syncWith = 0;
	
	for (var i = 0; i < bandInfos.length; i++) {
		bandInfos[i].decorators = [new Timeline.SpanHighlightDecorator({
			startDate: "1970/1/1 00:00:00",
			endDate: nowDate() + " 00:00:00",
			color: "#DFFFFE",
			opacity: 65,
			// theme:      theme,
			cssClass: 't-highlight1'
		}), new Timeline.SpanHighlightDecorator({
			startDate: nowDate(),
			endDate: nowDate() + " 23:59:59",
			color: "#C2FFBF",
			opacity: 65,
			// theme:      theme,
			cssClass: 't-highlight2'
		}), new Timeline.SpanHighlightDecorator({
			startDate: nowDate() + " 23:59:59",
			endDate: "2100/12/31 00:00:00",
			color: "#FFFFDF",
			opacity: 65,
			// theme:      theme,
			cssClass: 't-highlight3'
		})];
	}
	
    tl = Timeline.create(document.getElementById("my-timeline"), bandInfos, Timeline.HORIZONTAL);
	
	setupFilterHighlightControls(tl, [0, 1, 2], theme);
	setupDateCenterTimeline(tl, bandInfos, theme);		
	
}


$(document).ready(function(){
	
    instance.components = {
        user : true,
		timeline : true,
        message : true,
        floating : true
    };
    
    sideroad.create();
	        
});