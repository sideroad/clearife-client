/*!
 * sideroad.js 
 * http://sideroad.secret.jp/
 *
 * Copyright (c) 2009 sideroad
 *
 * licensed under the MIT licenses.
 * Date: 2009-03-01
 * Revision: 1
 */

//bind function
jQuery.scope = function(target,arg ,func){ return function() { func.apply(target,arg);}};

//object copy
(function($){
    $.clone = function(source,isDeep) {
        if(isDeep) return $.extend(true,{},source);
        return $.extend({},source);
    }
})(jQuery);


var sideroad = {};
var instance = {};
instance.components = {};


//env
sideroad.env = {
    url : {
		user   : "/cgi-bin/user.cgi",
		friend : "/cgi-bin/friend.cgi",
		team   : "/cgi-bin/team.cgi",
		address: "/cgi-bin/address.cgi",
		message: "/cgi-bin/message.cgi",
		floating:"/cgi-bin/floating.cgi",
		task   : "/cgi-bin/task.cgi",
        routine: "/cgi-bin/routine.cgi",
        remind : "/cgi-bin/remind.cgi",
		storage: "/storage/"
	},
    uniq : "Guest",
    dialog : {
        width: 400,
        resizable: false,
        close: function(e,ui){
            $(this).parents(".ui-dialog").remove();
            $(this).appendTo("#storage");
        },
        open: function(){
            
            //tabs
            $(".tabs").tabs();
			
            
            //date picker
            var clear = sideroad.localize.button.clear;
            var today = sideroad.localize.button.today;
            $(".datepicker")
            .not(".hasDatepicker")
            .each(function(){
                var datepicker = $(this);
                $("<input type='button' value='"+clear+"' />").click(function(){
                    datepicker.val("");
                }).insertAfter(datepicker);
                $("<input type='button' value='"+today+"' />").click(function(){
                    datepicker.datepicker("setDate",new Date());
                }).insertAfter(datepicker);
            }).datepicker({
                changeMonth: true,
                changeYear: true,
                dateFormat: 'yy/mm/dd'
            })
            .datepicker("setDate",new Date());
            
            var dialog = $(this);
            setTimeout(function(){
                dialog.find("input:first").focus();
            },400);
        },
        
        show: "drop",
		bgiframe: true
    },
    task : 
        "yellow " +
        "blue " +
        "green " +
        "red " +
        "skyblue "
    ,
    validate : {
        user_id : {
            name  : "ID",
            accept  : "a-zA-Z0-9",
            accept_message: "alphabet or number",
            maxLength : 10,
            minLength : 4
        } ,
        user_password : {
            name  : "Password",
            maxLength : 16,
            minLength : 4
        } ,
        user_nickname : {
            name  : "Nickname",
            maxLength : 10,
            minLength : 4
        } ,
        user_address : {
            name  : "Mail Address",
            maxLength : 10,
            minLength : 1
        } ,
        task_title : {
            name : "Task Name",
            maxLength : 40,
            minLength : 1
        } ,
        task_begin : {
            name : "Task Begin",
            format : "^([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})||()$",
            format_message: "2000/01/01"
        } ,
        task_remind_to : {
            name : "Task Remind To",
            minLength : 1,
            format_message: "xxxxxxxx@yyyy.com"
        } ,
        task_remind_date : {
            name : "Task Remind Date",
            format : "^([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})$",
            format_message: "2000/01/01"
        } ,
        routine_title : {
            name : "Routine Name",
            maxLength : 40,
            minLength : 1
        } ,
        routine_base : {
            format : "^([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})$",
            format_message: "2000/01/01"
        } ,
        routine_end : {
            format : "^([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})$",
            format_message: "2000/01/01"
        } ,
        team_name : {
            name : "Team Name",
            maxLength : 20,
            minLength : 1
        } ,
        send_to : {
            name : "To",
            minLength : 1
        },
        address_name : {
            name : "Address Name",
            minLength : 1
        },
        address_address : {
            name : "Address Name",
            minLength : 1
        },
        message_to : {
            name : "To",
            minLength : 1
        },
        message_subject : {
            name : "Subject",
            minLength : 1
        },
        message_message : {
            name : "To",
            minLength : 1
        }
    },
	cache_seq : 0
};

//data
sideroad.initData = {
    form : {} ,
    task : {} ,
    routine : {} ,
    friend : {
        requested:{},
        accepted: {},
        waiting : {}
    } ,
    team : {} ,
    message : {},
	floatingMessage : {},
    active_task_id : "" ,
    active_routine_id : "",
    active_team_id : "",
    start: {
        future:0,
        current:0,
        results:0,
        trash:0
    },
    amount: {
		results:30
	},
    chain:{
        future:"current",
        current:"results",
        results:"trash"
    },
    box : {
        someday:"future",
        definite:"future",
        tomorrow:"future",
        todo:"current",
        doing:"current",
        done:"current",
        results:"results",
        trash:"trash"
    }
}

sideroad.data = $.clone(sideroad.initData,true);

//queue
sideroad.queue = [];

//utils
sideroad.util = function() {};
sideroad.util.prototype = {
    contentHide : function(element) {
        if(!element) element = $("div#contentArea");
        element.hide("blind");
    } ,
    
    setForm : function(data) {
        sideroad.data.form = {};
        this.appendForm(data);
    } ,
    
    appendForm : function(data){
        for(key in data) {
            var t = typeof(data[key]);
            if(t == "function" || t == "object") continue;
            var val = (data[key]) ? data[key] : "";
            sideroad.data.form[key] = val;
        }
        
    } ,
    
    brToLf : function(str) {
        if(!str) return "";
        return str.replace(/<br \/>/g,"\n").replace(/\&lt;/g,"<").replace(/\&gt;/g,">");
    } ,
    
    lfToBr : function(str) {
        if(!str) return "";
        return str.replace(/\n/g,"<br />").replace(/\<script/g,"&lt;script").replace(/\<\/\s*script\s*\>/g,"&lt;/script&gt;");
    } ,
    
    sanitize : function(str) {
        if(!str) return "";
        return str.replace(/\&/g,"&amp;").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/'/g,"&#39;");
    } ,
    
    unsanitize : function(str) {
        if(!str) return "";
        return str.replace(/\&lt;/g,"<").replace(/\&gt;/g,">").replace(/\&#39;/g,"'").replace(/\&amp;/g,"&");
    } ,
    
    msecToSec : function(time) {
        return parseInt((time) / 1000);
    } ,
    
    getCheckedValue : function(name){
        var values = [];
        $("input[name="+name+"]:checked").each(function(){
            values.push($(this).val());
        });
        return values.join(",");
        
    } ,
    
    get_today_time : function(mode) {
        
        var today_time = new Date(this.get_today()).getTime();
        if (mode && mode == "sec") {
            return this.msecToSec(today_time);
        }
        else {
            return today_time;
        }
    },
    
    get_today : function() {
        return this.dateObjToDate(new Date());
    },
    
    get_tomorrow : function() {
        var tomorrow_time = this.get_today_time() + 86400000;
        return this.timeToDay(tomorrow_time);
    },
    
    get_day_after_tomorrow : function() {
        var tomorrow_time = this.get_today_time() + 172800000;
        return this.timeToDay(tomorrow_time);
    },
	
	get_utc_time : function(){
		var d = new Date();
        d.setTime(d.getTime()+d.getTimezoneOffset()*60*1000);
        d.getTime();
	},
    
    dayToTime : function(day,mode) {
        if(day == "") {
            return "";
        }
        var time = new Date(day).getTime();
        if(mode && mode == "sec") {
            return this.msecToSec(time);
        } else {
            return time;
        }
    } ,
    
    dateObjToDate : function(date) {
        var month = date.getMonth()+1;
        var day   = date.getDate();
        return ""+date.getFullYear()+"/"+(month < 10 ? "0"+month : month)+"/"+(day < 10 ? "0"+day : day);
        
    },
    
    dateObjToHrMinTr : function(date) {
        var hr = date.getHours() || 12;
        var tr = "AM";
        if(hr > 12) {
            hr = hr%12;
            tr = "PM";
        }
        var min   = date.getMinutes() || 0;
        return ""+(hr < 10 ? "0"+hr : hr)+":"+(min < 10 ? "0"+min : min) + " " + tr;
        
    },
    
    timeToDay : function(time,mode) {
        if(time == "") {
            return "";
        }
        
        time = 0 + time;
        if(mode && mode == "sec") {
            time *= 1000;
        }
        return this.dateObjToDate(new Date(time));
    } ,
    
    timeToHrMinTr : function(time,mode) {
        if(time == "") {
            return "";
        }
        
        time = 0 + time;
        if(mode && mode == "sec") {
            time *= 1000;
        }
        return this.dateObjToHrMinTr(new Date(time));
    } ,
    
    clear : function(id) {
        var e = $("#"+id);
        e.find("input[type=text],textarea").val("");
        e.find("input[type=checkbox]:checked").removeAttr("checked");
        e.find("input[type=radio]:checked").removeAttr("checked");
        e.find("input[type=radio]:first").attr("checked",true).click();
        e.find("input[type=file]").each(function(){
            var t = $(this);
            var a = {
                id    : t.attr("id"),
                name  : t.attr("name"),
                "class" : t.attr("class"),
                type  : t.attr("type"),
                style : t.attr("style")
            };
            var f = $("<input />").attr(a);
            $(this).replaceWith(f);
        });
        e.find("input.hasDatepicker").datepicker("setDate",new Date());
        
        
    } ,
    
    flexiExtraction : function(colModel,gDiv){
        var s = $(gDiv).find(".trSelected");
                           
        var obj;
        if(s.length) obj={};
        for (var tr = 0; tr < s.length; tr++) {
            var id = s[tr].id.replace(/^row/, "");
            obj[id] = {};
            for (var i = 0; i < colModel.length; i++) {
                obj[id][colModel[i].name] = s[tr].cells[i].firstChild.innerHTML;
            }
            obj[id].id = id;
        }
        s.removeClass("trSelected");
        return obj;
    },
    
    flexiExtractionTr : function(colModel,tr){
                           
        var obj = {};
        var id = tr.id.replace(/^row/, "");
        for (var i = 0; i < colModel.length; i++) {
            obj[colModel[i].name] = tr.cells[i].firstChild.innerHTML;
        }
        obj.id = id;
        return obj;
    },
    
    extraction : function(options) {
        options = options || {};
        var extract = {};
        if(options.target == "routine") {
            var base = $("#routine_base").val() || this.get_today();
            var end = $("#routine_end").val();
            base = this.dayToTime(base,"sec");
            end  = this.dayToTime(end,"sec");
                                   
            extract = {
                title : $("#routine_title").val(),
                team_id : $("#routine_team").val(),
                detail : $("#routine_detail").val(),
                type : $("input[name=routine_type]:checked").val(),
                base : base,
                end : end,
                interval : 0 + $("#routine_interval").val() * 86400 ,
                week : this.getCheckedValue("routine_week") ,
                weekday : this.getCheckedValue("routine_weekday") ,
                day : $("#routine_day").val() ,
                month_day : $("#routine_month_day").val() 
            };
            
            if(options.isNew) {
                extract.generate = 0 + base - 86400; //set yesterday time.
            } else {
                extract.generate = this.get_today_time("sec") - 86400;
            }
        } else if(options.target == "team") {
            var team_member = [];
            $("#create_team_member_list div.piece").each(function(){
                team_member.push(this.id.replace(/^element_user_create_team_member_list_/,""));
            });
            
            extract = {
                name : $("#create_team_name").val(),
                team_member : team_member.join(","),
                description : $("#create_team_description").val(),
                image : $("#create_team_image_file").val(),
				image_delete : $("#create_team_image_delete").attr("checked")
            };
            
        } else if(options.target == "address") {
            var d = options.dialog;
            extract = {
                name : d.find("input[name=create_address_name]").val(),
                address : d.find("input[name=create_address_address]").val()
            };
        } else if(options.target == "message") {
            var d = options.dialog;
            extract = {
                receive_id : d.find("input.send_message_receive_id").val() || d.find("select.send_message_receive_id").val(),
                team_id : d.find("input.send_message_team_id").val(),
                subject : d.find("input.send_message_subject").val(),
                message : d.find("textarea.send_message_message").val()
            };
        }
        
        return extract;
        
    } ,
    
    infuse : function(options) {
        options = options || {};
        if (options.target == "routine") {
            var routine = sideroad.data.routine[options.id];
            
            $("#routine_title").val(routine.title);
            $("#routine_team").val(routine.team_id);
            $("#routine_detail").val(this.unsanitize(routine.detail));
            $("#routine_base").val(this.timeToDay(routine.base, "sec"));
            $("#routine_end").val(this.timeToDay(routine.end, "sec"));
            $("input[name=routine_type][value=" + routine.type + "]").attr("checked", true).click();
            $("#routine_interval").val(0 + routine.interval / 86400);
            
            $("input[name=routine_week]").removeAttr("checked");
            if (routine.week) {
                var week = routine.week.split(/,/);
                for (var i = 0; i < week.length; i++) {
                    $("input[name=routine_week][value=" + week[i] + "]").attr("checked", true);
                }
            }
            
            $("input[name=routine_weekday]").removeAttr("checked");
            if (routine.weekday) {
                var weekday = routine.weekday.split(/,/);
                for (var i = 0; i < weekday.length; i++) {
                    $("input[name=routine_weekday][value=" + weekday[i] + "]").attr("checked", true);
                }
            }
            
            $("#routine_day").val(routine.day);
            $("#routine_month_day").val(routine.month_day);
        } else if(options.target == "team") {
            var team = sideroad.data.team[options.id];
            
            $("#create_team_name").val(team.name);
            $("#create_team_description").val(this.unsanitize(team.description));
			$("#create_team_image").attr("src","/img/team/"+team.team_img_seq+".png?_="+sideroad.env.cache_seq)
			
            sideroad.core.exec("load_member",{team_id:options.id});
        } else if(options.target == "address") {
            var d = options.dialog;
            d.find("input[name=create_address_name]").val(options.address.name);
            d.find("input[name=create_address_address]").val(options.address.address);
            
        }
        
    } ,
    
    validate : function(list){
                
        var errors = []
        for(var i=0;i<list.length;i++) {
            var error = [];
            var vali = sideroad.env.validate[list[i][0]];
            var value = list[i][1];
            
            // accept charactor type
            if(vali.accept && value.match("[^"+vali.accept+"]")) {
                error.push("permit charactor is "+vali.accept_message);
            }
            
            // full match
            if(vali.format && !value.match(vali.format)) {
                error.push("format is "+vali.format_message);
            }
            
            // charactor length
            if(vali.minLength && vali.minLength > value.length) {
                error.push("permit length is over "+vali.minLength);
            }
            
            if(error.length != 0) {
                errors.push(vali.name + " : " + error.join(" and ") + ".");
            }
            
        }
        
        if(errors.length != 0) {
            throw errors.join("\n");
        }
        
    } ,
    
    create_random_key : function(){
        return sideroad.data.user.id+"_"+Math.floor( Math.random() * 10000 ) + "_" + new Date().getTime();
    } ,
    
    setStyle : function(s) {
        $("link#ui_style").attr("href","http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/"+s+"/jquery-ui.css");
    } ,
	
    _get_parallel_dialog : function(base,id) {
        var did = base+"-"+id;
        var o = {};
        o.isExists = true;
        var d = $("#"+did);
        if (d.length == 0) {
            d = $("div#" + base).clone(true).attr("id", did);
            
			//reindex elements id
            this._reindex(d,id);
			
			//date picker
			this.set_datepicker(d);
			
			//timestomper
			this.set_timestomper(d);
			
			//mail address
            this.set_address_book(d);
			
            o.isExists = false;
            d.find(".close_button").click(function(){instance.callback.close_dialog({},this)});
        }
        o.dialog = d;
        
        
        return o;
    } , 
	
	set_timestomper : function(d){
        var datepickers = this.set_datepicker_events(d,"paralleltimestomper");
		datepickers.each(function(){
			var datepicker = $(this);
            datepicker.addClass("hasTimestomper");
			var defaultTime = "08:00 AM"
			

            var timepickerImg = $("<img></img>").attr("src","images/clock.png")
			                                    .attr("alt","Clock");
	        var timepicker = $("<span/>").text(defaultTime)
                                         .attr("class","timepicker")
                                         .insertAfter(datepicker);
			
			timepicker.ptTimeSelect({
				popupImage: 'Select Time'
			});
		
		});
	} ,
	
	set_datepicker: function(d){
		var datepickers = this.set_datepicker_events(d);
		this.set_datepicker_button(datepickers);
	} ,
	
	set_datepicker_events : function(d,className) {
		className = className || "paralleldatepicker";
        var datepickers = d.find("."+className).not(".hasDatepicker").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: 'yy/mm/dd'
        }).datepicker("setDate", new Date());
		return datepickers;
	} ,
	
	set_datepicker_button : function(datepickers) {
        var today = sideroad.localize.button.today;
        var clear = sideroad.localize.button.clear;
        datepickers.each(function(){
            var datepicker = $(this);
            $("<input type='button' value='" + clear + "' />").click(function(){
                datepicker.val("");
            }).insertAfter(datepicker);
            $("<input type='button' value='" + today + "' />").click(function(){
                datepicker.datepicker("setDate", new Date());
            }).insertAfter(datepicker);
        });
	} ,
	
    set_address_book : function(d){
        d.find("input.mailAddress").not(".hasAddressBook").each(function(){
            var mailAddress= $(this);
            mailAddress.addClass("hasAddressBook");
            var addressBook = $("<img></img>").attr("src","img/address_book.png")
                                              .attr("alt","Address Book");
            
            addressBook.insertAfter(mailAddress);
            addressBook.click(function(){
                instance.callback.open_list_address_dialog({id:mailAddress.attr("id")});
            });
        });
    } ,
   
    close_dialog : function(req,self) {
        $(self).parents(".dialog").dialog("close");
    } ,
	
    _reindex : function(e,id) {
        e.find("*[id]").each(function(){
            $(this).attr("id",this.id+"-"+id);
        });
		e.find("*[for]").each(function(){
            $(this).attr("for",$(this).attr("for")+"-"+id);
		});
    }
}

//overlay
sideroad.overlay = function() {};
sideroad.overlay.prototype = {
    start : function(isFront){

        if(this.isOberlay && isFront) this.overlayObj.css({zIndex:9998});
        if(this.isOverlay) return;
        this.isOverlay = true;  
        
        //reffered by ui.dialog.js
        this.overlayObj = $('<div></div>').appendTo(document.body)
            .addClass('ui-widget-overlay').css({
                width: $.ui.dialog.overlay.width(),
                height: $.ui.dialog.overlay.height()
            });
        if(isFront) this.overlayObj.css({zIndex:9998});
        
        var overlay = this.overlayObj;
        $(window).bind('resize',function(){ 
            overlay.css({
                width: 0,
                height: 0
            }).css({
                width: $.ui.dialog.overlay.width(),
                height: $.ui.dialog.overlay.height()
            });
        });
        
    } ,
    
    finish : function() {
        
        if(!this.isOverlay) return;
        this.isOverlay = false;
        
        this.overlayObj.remove();
        this.overlayObj = false;
        
    }
};

//loading
sideroad.loading = function(){};
sideroad.loading.prototype = {
    start : function() {
        
        if(!this.isLoading) this.isLoading = [];
        this.isLoading.push(1);
        if(instance.overlay.overlayObj) return;
        
        instance.overlay.start(true);
        
        var overlayObj = instance.overlay.overlayObj;
        
        var left = 0 + $.ui.dialog.overlay.width().replace("px","") / 2 - 75;
        var ground = 0 + $.ui.dialog.overlay.height().replace("px","") / 2;
        
        var loadingAnimation = function(){
            $("<div id='nowLoading' class='nowLoadings'><img src='/img/loading.png' alt='Now Loading' /></div>").css({
                position : "absolute",
                left : left,
                top : 0,
                zIndex : 9999
            }).appendTo(document.body)
              .animate({top:ground},3000,"easeOutBounce")
              .fadeOut("slow",function(){$(this).remove();});
        };
        
        loadingAnimation();
        this.loadingTimer = setInterval(loadingAnimation,3000);
        
        
    } ,
    
    finish : function() {
        if(!this.isLoading || this.isLoading.length == 0) return;
        this.isLoading.shift();
        if(this.isLoading.length > 0) return;
        
        clearInterval(this.loadingTimer);
        $("div.nowLoadings").stop().fadeOut("fast",function(){$(this).remove();});
        instance.overlay.finish();       
    }
}

//setup
sideroad.setup = {};

sideroad.setup.user = function(){}
sideroad.setup.user.prototype = {
    login : function() {
        
        var id = $("#login_user_id").val();
        var pw = $("#login_user_password").val();
        
        //validate
        this.validate([
            ["user_id",id],
            ["user_password",pw]
        ]);    
        
        this.setForm({
            user_id      : id,
            user_password: pw
        });
    } ,
    
    register : function() {
                
        var id = $("#register_user_id").val();
        var pw = $("#register_user_password").val();
        var ad = $("#register_user_address").val();
        var repw = $("#register_user_repassword").val();
        
        //validate
        this.validate([
            ["user_id",id],
            ["user_password",pw],
            ["user_address",ad]
        ]); 
        
        if(pw != repw) {
            throw "Not same Password with Re-type Password\nPlease verify your password again";
        }
        
        this.setForm({
            user_id       : id,
            user_password : pw,
            user_address  : ad
        });
    } ,
    
    edit : function() {
        instance.loading.start();
                
        var nn = $("#edit_user_nickname").val();
        var pr = $("#edit_user_profile").val();
        var im = $("#edit_user_image_file").val();
        var ta = $("#edit_user_time_adjust").val();
        var st = $("#edit_user_style").val();
        var la = $("#edit_user_language").val();
        var imd = $("#edit_user_image_delete").attr("checked");
        
        //validate
        this.validate([
            ["user_nickname",nn]
        ]); 
        
        var elements = ["edit_user_nickname",
                        "edit_user_image_file"];

        this.setForm({
            user_nickname    : nn,
            user_profile     : pr,
            user_image_file  : im,
            user_time_adjust : ta,
            user_style       : st,
            user_image_delete : imd
        });
        
        $.cookie("lang",la);
    } ,
    
    load : function() {
        instance.loading.start();
    } ,
    
    search : function() {
        this.setForm({
            nickname:$("#search_user_nickname").val()
        });
        
    }
}

//exec
sideroad.exec = {};

//user
sideroad.exec.user = function(){}
sideroad.exec.user.prototype = {
    
    //user login
    open_login_dialog : function() {
        $("div.dialog").dialog('close');
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.login_user,
            width : 500,
            modal: true,
            draggable:false
        });
        
        $("div#login_user_dialog").dialog(options);
    },
    
    logout : function() {
        this.initialize();
                
        this.login({
            uniq: "Guest"
        });
        $("#timeline_div").hide();
        $("#logout_user_div").hide();
        $("#edit_user_div").hide();
        $("#login_user_div").show();
        
        
    } ,
    
    initialize : function() {
        $.cookie('uniq',null,{path:"/"});
        $.cookie('style',null,{path:"/"});
        sideroad.data = $.clone(sideroad.initData,true);
        if(window.eventSource) window.eventSource.clear();
    },
    
    //user register
    open_register_dialog : function() {
        $("div.dialog").dialog('close');
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.register_user,
            width : 500,
            modal: true,
            draggable:false
        });
        
        var d = $("#register_user_dialog");
        d.dialog(options);
        
        //passroids plugin
        d.find("#psr_score").remove();
        d.not(".passroided").passroids({
            main: "#register_user_password",
            verify: "#register_user_repassword",
            button: "#register_user_button",
            minimum : 2
        }).addClass("passroided");
    },
    
    //user edit
    open_edit_dialog : function() {
        $("div.dialog").dialog('close');
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.edit_user,
            width : 620,
            modal: true,
            draggable:false
        });
        
        $("#edit_user_language").val($.cookie("lang"));
        $("div#edit_user_dialog").dialog(options);
        
        $("input#edit_user_image_delete").not(".isEvented").change(function(){
            if ($(this).attr("checked")) {
                $("input#edit_user_image_file").hide();
            } else {
                $("input#edit_user_image_file").show();
                
            }
        });
        $("input#edit_user_image_delete").addClass("isEvented");
    },
    
    
    _append_users : function(mode,values,state) {
      
        var div = $("#"+mode);
        div.html("");
        
        for(var i=0;i<values.length;i++) {
            var obj = values[i];
            if(obj.id == "guest") continue;
            if(state) {
                sideroad.data.friend[state][obj.id] = obj;
            }
            obj.mode = mode;
            this._append_user(div,obj);
        }
    } ,
    
    _append_user : function(div,obj){
        
        var id = "element_user_"+div.attr("id")+"_"+obj.id;
        var e = $("#default_element_user").clone(true)
                                           .attr("id",id)
                                           .addClass("element_user_"+obj.id);
        e.find(".element_user_nickname").text(obj.nickname);
        e.find(".element_user_image").attr("src","/img/users/"+obj.user_img_seq+".png?_="+ new Date().getTime());
        
        if(div.find("#"+id).length != 0) return; 
        e.appendTo(div)
         .click(function(){
           instance.callback.open_browse_user_dialog(obj);
         })
         .show("drop");
    } ,
    
    _remove_user : function(div,obj){
        div.find("#element_user_"+div.attr("id")+"_"+obj.id).hide("drop",function(){$(this).remove()});
    },
    
    _create_select : function(object,display_key,selectbox,noselect,ignore) {
        
        //make team friend selectbox;
        var selectarray = [];
        if(noselect) {
            selectarray.push("<option value=\""+noselect.id+"\">"+noselect.value+"</option>");
        }
        for(var index in object) {
            var id = index;
            if(object[index].id) id = object[index].id;
            if(ignore && id === ignore) continue;
            selectarray.push("<option value=\""+id+"\">"+object[index][display_key]+"</option>");
        }
        selectbox.html(selectarray.join());
    },
    
    
    
    open_browse_dialog : function(user) {
        var friend = sideroad.data.friend;

        var mode = user.mode;
        
        var p = this._get_parallel_dialog("browse_user_dialog",user.id+"-"+mode);
        var d = p.dialog;
        d.find("input[type=button]").hide();
        d.find("."+mode).show();
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: user.nickname,
            close: function(e,ui){
                $(this).parents(".ui-dialog").remove();
                $(this).remove();
            }
        });
        d.find("#browse_user_profile-"+user.id+"-"+mode).html(this.lfToBr(user.profile));
        d.find("#browse_user_image-"+user.id+"-"+mode).attr("src","/img/users/"+user.user_img_seq+".png?_="+sideroad.env.cache_seq);
        
        //add event
        if (!p.isExists) {
            d.find("#request_friend_button-" + user.id + "-" + mode).click(function(){
                sideroad.core.exec("request_friend", {
                    id: user.id,
                    mode: mode
                })
            });
            d.find("#accept_friend_button-" + user.id + "-" + mode).click(function(){
                sideroad.core.exec("accept_friend", {
                    id: user.id,
                    mode: mode
                })
            });
            d.find("#deny_friend_button-" + user.id + "-" + mode).click(function(){
                sideroad.core.exec("deny_friend", {
                    id: user.id,
                    mode: mode
                })
            });
            d.find("#remove_friend_team_button-" + user.id + "-" + mode).click(function(){
                instance.callback.remove_friend_team({
                    id: user.id,
                    mode: mode
                })
            });    
            d.find("input.send_message_button").click(function(){
                instance.callback.open_send_message_dialog({
                    id: user.id,
                    nickname: user.nickname
                })
            });
        }
        d.dialog(options);
        
    }
};

//friend
sideroad.setup.friend = function(){};
sideroad.setup.friend.prototype = {
    load_requested : function() {
    } ,
    load_accepted : function() {
        instance.loading.start();
    } ,
    
    accept : function(values) {
        if(!window.confirm(sideroad.localize.confirm.accept_friend)) {
            throw "";
        }
        
        this.setForm({
            id : values.id
        });
    },
    
    request : function(values) {
        if(values.id == sideroad.data.user.id) {
            throw "You can't friend-request to yourself.";
        }
        if("guest"   == sideroad.data.user.id) {
            throw "Guest can't friend-request.";
        }
        if(!window.confirm(sideroad.localize.confirm.request_friend)) {
            throw "";
        }
        this.setForm({
            id : values.id
        });
    },
    
    deny : function(values) {
        if(!window.confirm(sideroad.localize.confirm.deny_friend)) {
            throw "";
        }
        this.setForm({
            id : values.id
        });
    }
};


//friend
sideroad.exec.friend = function(){};
sideroad.exec.friend.prototype = {
	
    open_friend_dialog : function() {
        $("div.dialog").dialog('close');
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.friend,
            width : 500,
            modal: true,
            draggable:false
        });
        $("div#friend_dialog").dialog(options);
        
        $(".search_user").hide();
        $(".list_friend").show();
        
       
    } ,
    
    list_friend : function(){
        $(".search_user").hide();
        $(".list_friend").show();
    } , 
    
    open_requested_dialog: function(){
        var options = $.clone(sideroad.env.dialog);
        $.extend(options, {
            title: sideroad.localize.dialog.friend_accept,
            width: 500,
            modal: true,
            draggable: false
        });
        $("div#accept_friend_dialog").dialog(options);
        
    }
}

//team
sideroad.exec.team = function(){}
sideroad.exec.team.prototype = {
    load_team : function() {
        instance.loading.start();
    },
    
    create_team : function() {
        if(!window.confirm(sideroad.localize.confirm.create_team)) {
            throw "";
        }
        
        this._team({id:"team_" + this.create_random_key(),validate:true});
    },
    
    edit_team : function() {
        if(!window.confirm(sideroad.localize.confirm.edit_team)) {
            throw "";
        }
        
        // restore active routine_id
        var team_id = sideroad.data.active_team_id;
        this._team({id:team_id,validate:true});
    },
    
    delete_team : function(values) {
        if(!window.confirm(sideroad.localize.confirm.delete_team)) {
            throw "";
        }
        this._team(values);
        
    },
    
    _team : function(values) {
        var team_id = values.id;
                
        //validate
        if(values.validate) {
            var name  = $("#create_team_name").val();
            this.validate([
                ["team_name",name]
            ]);
        }
        
        sideroad.data.team[team_id] = this.extraction({target:"team"});
        var data = sideroad.data.team[team_id];
        data.id = team_id;
        this.setForm(data);
        
    }
};

//address
sideroad.exec.address = function(){}
sideroad.exec.address.prototype = {
    create_address : function(req) {
        req = req || {};
        
        var address = this.extraction({
            target: "address",
            dialog: req.dialog
        });
        
        //validate
        this.validate([
            ["address_name",address.name],
            ["address_address",address.address]
        ]); 
        address.id = req.id;
        
        this.setForm(address);
    },
    
    edit_address :function(req) {
        this.create_address(req);
    },
    
    delete_address :function(req) {
        if(!window.confirm(sideroad.localize.confirm.delete_address + "\n"+req.names.join("\n"))) {
            throw "";
        }
    }
};

//message
sideroad.exec.message = function(){}
sideroad.exec.message.prototype = {
    send_message : function(req) {
        req = req || {};
        
        var message = this.extraction({
            target: "message",
            dialog: req.dialog
        });
        
        //validate
        this.validate([
            ["message_to",message.receive_id],
            ["message_subject",message.subject],
            ["message_message",message.message]
        ]); 
        message.id = "mess_"+this.create_random_key();
        
        this.setForm(message);
    }
};

//floating
sideroad.exec.floating = function(){}
sideroad.exec.floating.prototype = {
	
};

//task
sideroad.exec.task = function(){}
sideroad.exec.task.prototype = {
    //task
    load_task : function(values) {
        var today_time = this.get_today_time("sec");
        
        this.setForm({
            amount:sideroad.data.amount[values.state],
            start:sideroad.data.start[values.state],
            today_time : today_time
        });
    } ,
    
    create_task : function(req){   
        req = req || {};
        var task;
        if(req.task) {
            task = $.clone(req.task);
        } else {
            var d = $("div#create_task_dialog-undefined");
			
            var title  = d.find("input[name=create_task_title]").val();
            var detail = d.find("textarea[name=create_task_detail]").val();
            var begin  = d.find("input[name=create_task_begin]").val() || "";
            var due    = d.find("input[name=create_task_due]").val() || begin;
            var team_id = d.find("select[name=create_task_team]").val() || "";
            var state = "todo";
            var finish = "";
			var validates = [
                ["task_title",title],
                ["task_begin",begin]
            ];
			
			//remind
            var remind_id;
			var remind_to;
			var remind_time;
            var is_remind = d.find(".create_task_remind_on:checked").length;
			if (is_remind) {
				var remind_date = d.find("input[name=create_task_remind_date]").val();
				var remind_datetime = d.find("span.timepicker").text();
				
                remind_id = "remind_" + this.create_random_key();
				remind_to = d.find("input[name=create_task_remind_to]").val() || "";
				remind_time = new Date(remind_date + " " + remind_datetime).getTime()/1000;
				
                validates.push(["task_remind_to",remind_to]);
                validates.push(["task_remind_date",remind_date]);
			}
			
            //validate
            this.validate(validates);
            
            task = {
                title : title,
                detail : detail,
                due : due,
                begin : begin,
                state : state,
                finish : finish,
                team_id : team_id,
				remind_id : remind_id,
				remind_to : remind_to,
				remind_time : remind_time
            };
        }
        var task_id = "task_" + this.create_random_key();
        task.id = task_id;
        sideroad.data.task[task_id] = task;

        this.setForm(task);

    },
    
    change_task: function(values){
		var task_id = values.id;
		var data = sideroad.data.task[task_id];
		data.id = task_id;
		this.setForm(data);
	} ,
    
    change_task_state: function(values){
		var task_id = values.id;
		var task = sideroad.data.task[task_id];
		this.setForm({
			id: task_id,
			state: task.state,
			finish : task.finish
		})
		
	} ,
    
    erase_task : function(values) {
        
        // restore active task_id
        var task_id = values.id;
        var data = sideroad.data.task[task_id];
        data.id = task_id;
        this.setForm(data);
    },
    
    entrust_task : function(){
        if(!window.confirm(sideroad.localize.confirm.entrust_task)) {
            throw "";
        }
    },
    
    send_task : function(values){
        
        //validate
        this.validate([
            ["send_to",values.to]
        ]); 
        
        if(!window.confirm(sideroad.localize.confirm.send_task)) {
            throw "";
        }
    },
        
    //trash
    erase_trash: function(){
        
        $("div#trash .task").each(function(){
            var task_id = $(this).attr("id");
            delete sideroad.data.task[task_id];
            $(this).hide("drop",{},"slow",function(){$(this).remove();instance.callback.trash_observe();});
        });
    }
	
};

//routine
sideroad.exec.routine = function(){}
sideroad.exec.routine.prototype = {    
    load_routine : function() {
        instance.loading.start();
    } ,
    
    create_routine : function(values){
        values = values || {};
        var title  = $("#routine_title").val();
        var base = $("#routine_base").val();
        
        routine_id = values.id || "routine_" + this.create_random_key();
                
        //validate
        this.validate([
            ["routine_title",title],
            ["routine_base",base]
        ]); 
        
        var isNew = true;
        if(values.id) isNew = false;
        sideroad.data.routine[routine_id] = this.extraction({
            target: "routine",
            isNew: isNew
        });
        var data = sideroad.data.routine[routine_id];
        data.id = routine_id;
        this.setForm(data);

    },
    
    edit_routine : function(){
        // restore active routine_id
        var routine_id = sideroad.data.active_routine_id;
        this.create_routine({id:routine_id});

    },
    
    erase_routine : function() {
        // restore active routine_id
        var routine_id = sideroad.data.active_routine_id;
        var data = sideroad.data.routine[routine_id];
        data.id = routine_id;
        this.setForm(data);
    }
};


//remind
sideroad.exec.remind = function(){}
sideroad.exec.remind.prototype = {};

//timeline
sideroad.exec.timeline = function(){}
sideroad.exec.timeline.prototype = {};

//language
sideroad.exec.language = function(){};
sideroad.exec.language.prototype = {};

//callback
sideroad.callback = {};


//user
sideroad.callback.user = function(){}
sideroad.callback.user.prototype = {
    
    login : function(res) {
        instance.exec.initialize();
        
        //login failed
        if(!res || res.error || !res.uniq) {
            window.alert(sideroad.localize.alert.login_user_failed);
            return;
        }
        
        //uniq setting
        $.cookie('uniq',res.uniq,{ expires: 365 , path : "/"});
        sideroad.env.uniq = res.uniq;
        
        //close dialog
        $("div.dialog").dialog('close');
        
        
        $("#login_user_div").hide();
        $("#logout_user_div").show();
        $("#edit_user_div").show();
        $("#timeline_div").show();
        
        sideroad.core.exec("load_user",{chain:true});
    } ,
    
    load : function(res,req) {
        
        $("span.user_id").text(res.id);
        $("span.user_nickname").text(res.nickname);
        $("input.user_id").val(res.id);
        $("input.user_nickname").val(res.nickname);
        $("textarea.user_profile").val(this.unsanitize(res.profile));
        $(".user_time_adjust").val(res.time_adjust);
        $(".user_style").val(res.style);
        $("img.user_image").attr("src","/img/users/"+res.user_img_seq+".png?_=" + new Date().getTime());
        
        this.setStyle(res.style);
        sideroad.data.user = res;
        
        if(req.chain) {
            if(instance.components.friend) sideroad.core.exec("load_requested_friend",{chain:true});
            if(instance.components.timeline) instance.callback.get_event_timeline({state:"future",chain:true});
        }
        instance.loading.finish();
        
    } ,
    
    register : function(res) {        

        if(res.success) {
            window.alert(sideroad.localize.alert.register_user_success);
            $("div.dialog").dialog('close');
            
        } else {
            if(res.error && res.error == "idAlreadyExists") {
                window.alert(sideroad.localize.alert.id_already_exists);
            } else if(res.error && res.error == "addressAlreadyUsed") {
                window.alert(sideroad.localize.alert.address_already_used);
            } else  {
                window.alert(sideroad.localize.alert.register_user_failed)
            }
            return;
            
        }
        return;

    } ,
	
    edit : function(res,req,form) {
        
        //edit failed
        if(res.error) {
            if(res.error == "nicknameAlreadyExists") {
                window.alert(sideroad.localize.alert.nickname_already_exists);
            } else {
                window.alert(sideroad.localize.alert.edit_user_failed);
            }
            instance.loading.finish();
            return;
        }
        $("div.dialog").dialog('close');
        
        //edit success
        if(!form.user_image_delete) {
            $.fileUpload({
                url : sideroad.env.url.user,
                file   : "edit_user_image_file",
                params : {
                    method: "edit_user_image"
                },
                callback : function() {
                    instance.callback.clear("edit_user_dialog");
                    sideroad.core.exec("load_user");
                    instance.loading.finish();
                }
            });
        } else {
            this.clear("edit_user_dialog");
            sideroad.core.exec("load_user");
            instance.loading.finish();
            
        }
        $("input#edit_user_image_file").show();
        
    },
	
    
    search : function(res) {
        $(".list_friend").hide();
        $(".search_user").show();
        
        this._append_users("user_list",res);
        
    }
	
};

//friend
sideroad.callback.friend = function(){}
sideroad.callback.friend.prototype = {
    
    accept : function(res) {
        if(!sideroad.data.friend.accepted) sideroad.data.friend.accepted = {};
        sideroad.data.friend.accepted[res.id] = "accepted";
        delete sideroad.data.friend.requested[res.id];
        this._remove_user($("#accept_list"),res);
        $("#browse_user_dialog-"+res.id+"-accept_list").dialog('close');
        sideroad.core.exec("load_accepted_friend");
    } ,
    
    deny : function(res) {
        if(!sideroad.data.friend.accepted) sideroad.data.friend.accepted = {};
        delete sideroad.data.friend.accepted[res.id];
        this._remove_user($("#accept_list"),res);
        $("#browse_user_dialog-"+res.id+"-friend_list").dialog('close');
        sideroad.core.exec("load_accepted_friend");
    } ,
    
    request : function(res) {
        $("#browse_user_dialog-"+res.id+"-user_list").dialog('close');
    } ,
	
    
    load_requested : function(res,req) {
        
        if(res.length > 0) {
        var f = $("<div></div>");
            f.html(sideroad.localize.floating.get_friend_request);
            this._append_users("accept_list", res, "requested");
			f.floatingMessage();
        }
        
        if(req.chain) {
            sideroad.core.exec("load_accepted_friend",{chain:true});
        }
		
    } ,
    
    load_accepted : function(res,req) {
        $(".search_user").hide();
        $(".list_friend").show();
        
        this._append_users("friend_list",res,"accepted");
        
        var accepted = sideroad.data.friend.accepted;
        this._create_select(accepted,"nickname",$("select.select_friend"));
        
        if(req.chain) {
            sideroad.core.exec("load_team",{chain:true});
        }
        instance.loading.finish();
    }
};

//team
sideroad.callback.team = function(){}
sideroad.callback.team.prototype = {
	
    //team
    load_team : function(res,req) {
        this._append_teams("team_list",res);
        this._create_select(sideroad.data.team,"name",$("select.select_team"),{id:"",value:"-- No team --"});
        this._create_select(sideroad.data.team,"name",$("select.narrow_team"),{id:"",value:"-- Display all team --"});
        
		//narrow team events
		$("select.narrow_team").not(".hasNarrowTeam").change(function(){
			if($(this).val()) {
                $(".task").hide();
                $(".task_narrow_"+$(this).val()).show(200);
			} else {
                $(".task").show();
				
			}
			
		})
		//.selectmenu({style:'dropdown'})
		.addClass("hasNarowTeam");
		
        if(req.chain) {
            instance.callback.load_all_task();
        }
        instance.loading.finish();
        
    },
    
    _append_teams : function(mode,values) {
      
        var div = $("#"+mode);
        div.html("");
        sideroad.data.team = {};
        for(var i=0;i<values.length;i++) {
            var obj = values[i];
            if(obj.id == "guest") continue;
            sideroad.data.team[obj.id] = obj;
            
            this._append_team(div,obj);
        }
    } ,
    
    _append_team : function(div,obj){
        
        var id = "element_team_"+div.attr("id")+"_"+obj.id;
        var e = $("#default_element_team").clone(true)
                                           .attr("id",id)
                                           .addClass("element_team_"+obj.id);
        e.find(".element_team_name").text(obj.name);
        e.find(".element_team_image").attr("src","/img/team/"+obj.team_img_seq+".png?_="+ new Date().getTime());
        
        if(div.find("#"+id).length != 0) return; 
        e.appendTo(div)
         .click(function(){
           instance.callback.open_browse_team_dialog({id:obj.id});
         })
         .show("drop");
    } ,
    
    _remove_team : function(div,obj){
        div.find("#element_team_"+div.attr("id")+"_"+obj.id).hide("drop",function(){$(this).remove()});
    },
    
    open_team_dialog : function(res) {
        res = res || {};
        if(res.load) sideroad.core.exec("load_team");
        $("div.dialog").dialog('close');
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.team,
            width: 550,
            modal: true,
            draggable: false
        });
        $("div#team_dialog").dialog(options);
    } ,
	
	open_browse_team_dialog : function(res) {
        var p = this._get_parallel_dialog("browse_team_dialog",res.id);
        var d = p.dialog;
        var team = sideroad.data.team[res.id];
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.browse_team,
            width: 550
        });
        d.find("#browse_team_name-"+res.id).text(team.name);
        d.find("#browse_team_description-"+res.id).html(this.lfToBr(team.description) || "");
        d.find("#browse_team_image-"+res.id).attr("src","/img/team/"+team.team_img_seq+".png?_="+ new Date().getTime());
        
        var dgb = d.find(".delete_team_button");
        dgb.hide();
        if(team.master_id == sideroad.data.user.id) dgb.show();

        //add event
        if (!p.isExists) {
            d.find("#delete_team_button-" + res.id).click(function(){
                sideroad.core.exec("delete_team", {
                    id: res.id
                })
            });
            d.find("#edit_team_button-" + res.id).click(function(){
                instance.callback.open_create_team_dialog({
                    id: res.id
                })
            });
            d.find("#list_team_task_button-" + res.id).click(function(){
                instance.callback.open_list_team_task_dialog({
                    id: res.id
                })
            });
            d.find("input.send_message_button").click(function(){
                instance.callback.open_send_message_dialog({
                    team_id : res.id
                })
            });
        }
        d.find(".member_list").html("Now Loading...");
        sideroad.core.exec("load_member",{team_id:res.id,browse:true});
        
        d.dialog(options);
    } ,
    
    load_member : function(res,req) {
        if(req.browse) {
            res.mode = "browse_team_member";
            this._append_users("browse_team_member_list-"+req.team_id,res);
        } else if (req.select) {
            this._create_select(res,"nickname",req.select,false,sideroad.data.user.id);
        } else {
            res.mode = "create_team_member";
            this._append_users("create_team_member_list", res);
        }
    },
    
    open_create_team_dialog : function(res) {
        $("div.dialog").dialog('close');
        var d = $("div#create_team_dialog");
        res = res || {};
        if(!res.id) {
            this.clear("create_team_dialog");
            var options = $.clone(sideroad.env.dialog);
            $.extend(options,{
                title: sideroad.localize.dialog.create_team,
                width: 550,
                modal: true,
                draggable: false
            });
            d.dialog(options);
            d.find(".edit_team").hide();
            d.find(".create_team").show();
            var u = $.clone(sideroad.data.user);
            u.mode = "create_team_member_list";
            this._append_users("create_team_member_list",[u]);
        } else {
            sideroad.data.active_team_id = res.id;
            res.target = "team";
            d.find(".member_list").html("Now Loading...");
            this.infuse(res);
            var options = $.clone(sideroad.env.dialog);
            $.extend(options,{
                title: sideroad.localize.dialog.edit_team,
                width: 550,
                modal: true,
                draggable: false
            });
            d.dialog(options);
            d.find(".create_team").hide();
            d.find(".edit_team").show();
            
            $("input#create_team_image_delete").not(".isEvented").change(function(){
                if ($(this).attr("checked")) {
                    $("input#create_team_image_file").hide();
                } else {
                    $("input#create_team_image_file").show();
                    
                }
            });
            $("input#create_team_image_delete").addClass("isEvented");
        }
    } ,
	
	add_team_member : function() {
        var id = $("#create_team_member").val();
        if(!id || id == "") return;
        var values = sideroad.data.friend.accepted[id];
        values.mode = "create_team_member_list";
        this._append_user($("#create_team_member_list"),values);
    } ,
    
    remove_friend_team : function(res) {
        $("#create_browse_user_dialog-"+res.id).dialog('close');

        this._remove_user($("#create_team_member_list"),res);
    } ,
    
    create_team : function(res) {
        $.fileUpload({
            url : sideroad.env.url.team,
            file : "create_team_image_file",
            params : {
                id : res.id,
                method : "upload_team_image"
            }
        });
        this.open_team_dialog({load:true});
        this.clear("create_team_dialog");
    } ,
    
    edit_team : function(res,req) {
        
        if(!req.image_delete) {
            $.fileUpload({
				url : sideroad.env.url.team,
                file : "create_team_image_file",
                params : {
                    id : res.id,
                    method : "upload_team_image"
                },
                callback:function() {
                    instance.callback.open_team_dialog({load:true});
                }
            });
        } else {
            instance.callback.open_team_dialog({load:true});
        }
        this.clear("create_team_dialog");
        $("input#create_team_image_file").show();
    } ,
    
    delete_team : function(res) {
        this.open_team_dialog({load:true});
    }
};

//address
sideroad.callback.address = function(){}
sideroad.callback.address.prototype = {
	open_create_address_dialog: function(res){
        res = res || {};
        
        var p = this._get_parallel_dialog("create_address_dialog",res.id);
        var d = p.dialog;
        if (!res.id) {
            this.clear("create_address_dialog-undefined");
            var options = $.clone(sideroad.env.dialog);
            $.extend(options, {
                title: sideroad.localize.dialog.create_address,
                width: 650,
                modal: true,
                draggable: false
            });
            
            if(!p.isExists) {
                d.find("input.create_address_button").click(function(){
                    sideroad.core.exec("create_address",{id:"",dialog:d});
                });
            }
            d.dialog(options);
            d.find(".edit_address").hide();
            d.find(".create_address").show();
        }
        else {
            res.target = "address";
            res.dialog = d;
            this.infuse(res);
            var options = $.clone(sideroad.env.dialog);
            $.extend(options, {
                title: sideroad.localize.dialog.edit_address,
                width: 650,
                modal: true,
                draggable: false
            });
            if(!p.isExists) {
                d.find("input.edit_address_button").click(function(){
                    sideroad.core.exec("edit_address",{id:res.id,dialog:d});
                });
            }
            d.dialog(options);
            d.find(".create_address").hide();
            d.find(".edit_address").show();
        }
    },
    
    create_address : function(res,req) {
        req.dialog.dialog("close");
        $(".list_address_table").flexReload();
    },
    
    edit_address : function(res,req) {
        req.dialog.dialog("close");
        $(".list_address_table").flexReload();
    },
    
    delete_address : function(res,req) {
        $(".list_address_table").flexReload();
    },
    
    open_list_address_dialog : function(req) {
        req = req || {};
        var id = req.id;
        var p = this._get_parallel_dialog("list_address_dialog",id);
        var d = p.dialog;
        var colModel = [
            {display: sideroad.localize.column.name, name : 'name', width : 100, sortable : true, align: 'left'},
            {display: sideroad.localize.column.address, name : 'address', width : 300, sortable : true, align: 'left'}
        ];
        var params = [
                    {name:"method",value:"list_address"},
                    {name:"uniq",value:sideroad.env.uniq}
                ];
        
        if(!p.isExists) {
            var to_element = $("input#"+id);
            var t = d.find("table");
            t.flexigrid({
                url : sideroad.env.url.address,
                dataType: 'json',
                title : sideroad.localize.flexigrid.list_address,
                colModel : colModel,
                buttons : [
                    {
                        name: sideroad.localize.button.select,
                        bclass: 'select',
                        onpress: function(name,gDiv){
                            t.noSelect();
                            var obj = instance.callback.flexiExtraction(colModel,gDiv);
                            var to_array = [];
                            for(var id in obj) {
                                to_array.push('"'+obj[id].name+'"<'+obj[id].address+">");
                            }
                            to_element.val(to_array.join(","));
                            d.dialog("close");
                        }
                                
                    },{separator:true},
                    {
                        name: sideroad.localize.button.create,
                        bclass: 'add',
                        onpress: function(name,gDiv){
                            t.noSelect();
                            instance.callback.open_create_address_dialog();
                            
                        }      
                    },{separator:true},
                    {
                        name: sideroad.localize.button.edit,
                        bclass: 'edit',
                        onpress: function(name,gDiv){
                            t.noSelect();
                            var obj = instance.callback.flexiExtraction(colModel,gDiv);
                            if (!obj) {
                                window.alert(sideroad.localize.alert.select_rows);
                                return;
                            }
                            var to_array = [];
                            for(var id in obj) {
                                instance.callback.open_create_address_dialog({id:id,address:obj[id]});
                            }
                            
                        }      
                    },{separator:true},
                    {
                        name: sideroad.localize.button.del,
                        bclass: 'delete',
                        onpress: function(name,gDiv){
                            var obj = instance.callback.flexiExtraction(colModel,gDiv);
                            if (!obj) {
                                window.alert(sideroad.localize.alert.select_rows);
                                return;
                            }
                            var ids = [];
                            var names = [];
                            for(var id in obj) {
                                ids.push(id);
                                names.push(obj[id].name);
                            }
                            sideroad.core.exec("delete_address",{ids:ids.join(","),names:names});
                        }      
                    },{separator:true}
                ],
                searchitems : [
                    {display: sideroad.localize.column.name, name : 'name', isdefault:true},
                    {display: sideroad.localize.button.address, name : 'address' }
                ],
                params: params,
                rp:25,
                rpOptions:[10,25,50,100],
                useRp: true,
                sortname : "name",
                sortorder: "desc",
                width : 550,
                height : 400,
                usepager: true
            });
            
        } else {
            d.find("table").flexOptions({params:params}).flexReload();
            
        }
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.list_address,
            width : 600
        });
        
        d.dialog(options);
        
    } 
};

//message
sideroad.callback.message = function(){}
sideroad.callback.message.prototype = {
    open_send_message_dialog: function(req){
        
        req = req || {};
        
        var p = this._get_parallel_dialog("send_message_dialog","undefined");
        var d = p.dialog;
        
        this.clear("send_message_dialog-undefined");
        var options = $.clone(sideroad.env.dialog);
        $.extend(options, {
            title: sideroad.localize.dialog.send_message,
            width: 650,
            modal: true,
            draggable: false
        });
            
        if(!p.isExists) {
            d.find("input.send_message_button").click(function(){
                sideroad.core.exec("send_message",{dialog:d});
            });
        }
        
        d.find(".send_message_receive_id").hide();
        d.find("input.send_message_receive_id").val("");
        d.find("input.send_message_team_id").val("");
        
        //from browse user dialog
        if(req.id) {
            d.find("span.send_message_receive_id").show().text(req.nickname);
            d.find("input.send_message_receive_id").val(req.id);
            
        //from browse team dialog
        } else if(req.team_id) {
            var team = sideroad.data.team[req.team_id]
            d.find("span.send_message_receive_id").show().text(team.name + sideroad.localize.text.member);
            d.find("input.send_message_team_id").val(req.team_id);
        
        //from message box
        } else {
            d.find("select.send_message_receive_id").show();
        }
		
		//set subject
		if(req.subject) {
			d.find("input.send_message_subject").val(req.subject);
		}
        
        d.dialog(options);
        
    },
    
    send_message : function(res,req) {
        req.dialog.dialog("close");
        $("#list_sended_box_table").flexReload();
    },
    
    open_message_box_dialog : function(){
        var d= $("div#message_box_dialog");
        
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.message_box,
            width : 850,
            modal:true,
            draggable:false
        });
        this.list_inbox_box();
        d.dialog(options);
    },
    
    list_inbox_box : function() {
        var d= $("div#message_box_dialog");
        d.find(".message_box").hide();
        d.find("#list_inbox_box_div").show();
        
        var colModel = [
            {display: sideroad.localize.column.from, name : 'from', width : 100, sortable : true, align: 'left'},
            {display: sideroad.localize.column.user_id, name : 'user_id', width : 100, sortable : true, align: 'center', hide : true},
            {display: sideroad.localize.column.subject, name : 'subject', width : 300, sortable : true, align: 'left'},
            {display: sideroad.localize.column.date, name : 'date', width : 100, sortable : true, align: 'center'},
            {display: sideroad.localize.column.state, name : 'state', width : 100, sortable : true, align: 'center', hide : true}
        ];
        var params = [
                {name:"method",value:"list_message"},
                {name:"type",value:"receive"},
                {name:"uniq",value:sideroad.env.uniq}
            ];
            
        var t = $("#list_inbox_box_table");
        t.flexigrid({
            url : sideroad.env.url.message,
            dataType: 'json',
            title : sideroad.localize.flexigrid.list_inbox,
            colModel : colModel,
            buttons : [
			    {
					name: sideroad.localize.button.reply,
					bclass: 'reply',
					onpress: function(name, gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel, gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var ids = [];
                        var subjects = [];
                        for (var id in obj) {
                            instance.callback.open_send_message_dialog({
								id:obj[id].user_id,
								nickname:obj[id].from,
								subject:"Re:"+obj[id].subject
							});
							break;
                        } 
					} 
				},
                {
                    name: sideroad.localize.button.del,
                    bclass: 'delete',
                    onpress: function(name, gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel, gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var ids = [];
                        var subjects = [];
                        for (var id in obj) {
                            ids.push(id);
                            subjects.push(obj[id].subject);
                        }
                        if(!window.confirm(sideroad.localize.confirm.delete_message+"\n"+subjects.join("\n"))) {
                            return;
                        }
                        instance.loading.start();
                        sideroad.core.exec("delete_message",{
                            ids: ids.join(","),
                            afterCallback:function(){
                                t.flexReload();
                                instance.loading.finish();
                            }
                        });                        
                    }
                },{separator:true}
            ],
            searchitems : [
                {display: sideroad.localize.column.from, name : 'from', isdefault:true},
                {display: sideroad.localize.column.subject, name : 'subject' },
                {display: sideroad.localize.column.date, name : 'date' }
            ],
            params : params,
            rp:25,
            rpOptions:[10,25,50,100],
            useRp: true,
            sortname : "date",
            sortorder: "desc",
            width : 550,
            height : 150,
            usepager: true,
			showToggleBtn : false,
            onSuccess : function() {
                var trs = t.find("tr");
                var state;
                for(var i=0;i<trs.length;i++) {
                    state = trs[i].cells[4].firstChild.innerHTML;
                    if(state == "unread") {
                        $(trs[i]).addClass("bold");
                    }
                }
            },
            onSelect : function(tr){
                var obj = instance.callback.flexiExtractionTr(colModel,tr);
                $(tr).removeClass("bold");
                var message = sideroad.data.message[obj.id];
                if(message) {
                    $("#browse_message_message").html(message.message); 
                    return;
                }
                $("#browse_message_message").html("Now Loading.....");

                sideroad.core.exec("select_message",{
                    id: obj.id,
                    afterCallback:function(res,req){
                        res.message = instance.callback.lfToBr(res.message);
                        sideroad.data.message[res.id] = res;
                        $("#browse_message_message").html(res.message);
                    }
                });
            }
        });
        t.flexOptions({params:params}).flexReload();
    } , 
    
    list_sent_box : function() {
        var d= $("div#message_box_dialog");
        d.find(".message_box").hide();
        d.find("#list_sent_box_div").show();
        
        var colModel = [
            {display: sideroad.localize.column.to, name : 'to', width : 100, sortable : true, align: 'left'},
            {display: sideroad.localize.column.subject, name : 'subject', width : 300, sortable : true, align: 'left'},
            {display: sideroad.localize.column.date, name : 'date', width : 100, sortable : true, align: 'center'}
        ];
        var params =  [
                {name:"method",value:"list_message"},
                {name:"type",value:"sended"},
                {name:"uniq",value:sideroad.env.uniq}
            ];
        var t = $("#list_sent_box_table");
        t.flexigrid({
            url : sideroad.env.url.message,
            dataType: 'json',
            title : sideroad.localize.flexigrid.list_sent,
            colModel : colModel,
            buttons : [
                {
                    name: sideroad.localize.button.del,
                    bclass: 'delete',
                    onpress: function(name, gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel, gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var ids = [];
                        var subjects = [];
                        for (var id in obj) {
                            ids.push(id);
                            subjects.push(obj[id].subject);
                        }
                        if(!window.confirm(sideroad.localize.confirm.delete_message+"\n"+subjects.join("\n"))) {
                            return;
                        }
                        instance.loading.start();
                        sideroad.core.exec("delete_message",{
                            ids: ids.join(","),
                            afterCallback:function(){
                                t.flexReload();
                                instance.loading.finish();
                            }
                        });
                    }
                },{separator:true}
            ],
            searchitems : [
                {display: sideroad.localize.column.to, name : 'to', isdefault:true},
                {display: sideroad.localize.column.subject, name : 'subject' },
                {display: sideroad.localize.column.date, name : 'date' }
            ],
            params : params,
            rp:25,
            rpOptions:[10,25,50,100],
            useRp: true,
            sortname : "date",
            sortorder: "desc",
            width : 550,
            height : 150,
            usepager: true,
            showToggleBtn : false,
            onSelect : function(tr){
                var obj = instance.callback.flexiExtractionTr(colModel,tr);
                
                var message = sideroad.data.message[obj.id];
                if(message) {
                    $("#browse_message_message").html(message.message); 
                    return;
                }
                $("#browse_message_message").html("Now Loading.....");
                
                sideroad.core.exec("select_message",{
                    id: obj.id,
                    afterCallback:function(res,req){
                        res.message = instance.callback.lfToBr(res.message);
                        sideroad.data.message[res.id] = res;
                        $("#browse_message_message").html(res.message);
                    }
                });
            }
        });
        t.flexOptions({params:params}).flexReload();
    } ,
	
	select_message: function(){},
	delete_message: function(){}
	
};

//floating
sideroad.callback.floating = function(){}
sideroad.callback.floating.prototype = {
    load_floating_message : function(res) {
        var data = res.data;
        for (var i = 0; i < data.length; i++) {
            var floatingMessage = sideroad.data.floatingMessage[data[i].id];
            if(sideroad.data.floatingMessage[data[i].id]) continue;
            sideroad.data.floatingMessage[data[i].id] = true;
            (function(floating){
				var contents = floating.content.split("\r\n");
				var content = sideroad.localize.floating[contents[0]];
				for(var i=1;i<contents.length;i++) {
					content = content.replace(/%/,contents[i]);
				}
				
                $.floatingMessage(content, {
                    onClose: function(){
                        sideroad.core.exec("read_floating_message", {
                            id: floating.id
                        });
                    }
                });
            })(data[i]);
        }
    },
	
	read_floating_message : function(){}
	
};

//task
sideroad.callback.task = function(){}
sideroad.callback.task.prototype = {
    open_create_task_dialog : function(res){
		var that = this;
        res = res || {};
        var p = this._get_parallel_dialog("create_task_dialog",res.id);
        var d = p.dialog;
        $("div#browse_task_dialog-"+res.id).dialog('close');
        if(res.id) {
            // restore target's task_id
            var task_id = res.id;
            var task = sideroad.data.task[task_id];
            			
			var f = function(){
                var task = sideroad.data.task[task_id];
                d.find("input#create_task_title-"+task_id).val(task.title);
                d.find("textarea#create_task_detail-"+task_id).val(that.unsanitize(task.detail));
                d.find("input#create_task_begin-"+task_id).val(task.begin);
                d.find("input#create_task_due-"+task_id).val(task.due);
                d.find("input#create_task_finish-"+task_id).val(task.finish);
                d.find("select#create_task_team-"+task_id).val(task.team_id);
            
                //set remind
                if(task.remind_id) {
                    var remind_date     = this.timeToDay(task.remind_time,"sec");
                    var remind_datetime = this.timeToHrMinTr(task.remind_time,"sec");
                    d.find("input#create_task_remind_date-"+res.id).val(remind_date);
                    d.find("input#create_task_remind_to-"+res.id).val(this.unsanitize(task.remind_to));
                    d.find("span.timepicker").text(remind_datetime);
                    d.find(".create_task_remind_off").removeAttr("checked");
                    d.find(".create_task_remind_on").attr("checked",true);
                } else {
                    d.find(".create_task_remind_on").removeAttr("checked");
                    d.find(".create_task_remind_off").attr("checked",true);
                }
			}
			
			if (task.detail === undefined) {
                d.find("textarea#create_task_detail-"+task_id).val("Now Loading...");
                sideroad.core.exec("load_task", {
                    ids: task_id,
                    detail: true,
                    afterCallback: f
                });
            } else {
                f();
            }
			           
            
            
            var options = $.clone(sideroad.env.dialog);
            $.extend(options,{
                title: sideroad.localize.dialog.edit_task,
                width: 550
            });
            d.find(".toggle").hide();
            d.find(".edit_task").show();
            d.find(".state").hide();
            d.find("."+task.state).show();
  
        } else {
            
            var options = $.clone(sideroad.env.dialog);
            $.extend(options,{
                title: sideroad.localize.dialog.create_task,
                width : 550
            });
            d.find(".toggle").hide();
            d.find(".create_task").show();
            d.find(".state").hide();
            d.find(".todo").show();
			d.find(".create_task_remind_on").removeAttr("checked");
            d.find(".create_task_remind_off").attr("checked",true);
            
        }
		
		//remind initialize
		if(d.find(".create_task_remind_on:checked").length) {
			d.find(".remind_set").show();
		} else {
            d.find(".remind_set").hide();
		}
		
		//dialog initialize
		if(!p.isExists) {
            d.find(".create_task_remind_on").click(function(){d.find(".remind_set").show(250)});
            d.find(".create_task_remind_off").click(function(){d.find(".remind_set").hide(250)});
            d.find("#save_task_button-"+res.id).click(function(){instance.callback.edit_task({id:task_id})});
            d.find("#create_task_button-"+res.id).click(function(){sideroad.core.exec("create_task")});
        }
        d.dialog(options);
    },

    create_task : function(res){
        this.create_task_div(res.id,true);
        this.clear("create_task_dialog-undefined");
		var d = $("div#create_task_dialog-undefined");
        d.find(".create_task_remind_on").removeAttr("checked");
		d.find(".create_task_remind_off").attr("checked",true).click();
        
        $("#list_task_table:visible").flexReload();
    },
    
    create_task_div : function(task_id,is_active) {
        if($("div#"+task_id).length != 0) return;
        var task = sideroad.data.task[task_id];
        var t = $("div#default_task")
                    .clone(true)
                    .attr({
                        "id": task_id
                    })
                    .dblclick(function(){
                        var task = sideroad.data.task[task_id];
                        instance.callback.open_browse_task_dialog(task_id);
                    })
                    .appendTo("#"+task.state);
        t.find(".title").text(task.title);
        
        if(task.team_id) {
            t.find(".team_image").append("<img src='/img/team/"+sideroad.data.team[task.team_id].team_img_seq+".png?_="+sideroad.env.cache_seq+"' width='20' height='20' />");
			t.addClass("task_narrow_"+task.team_id);
        }

        if (is_active) {
            this.time_observe(task_id);
            var box = this.get_box_name_by_state(task.state);
            this.active_box({
                box: box
            });
            this.active_lane({
                lane: task.state + "_lane"
            });
        }
        
        
    },
    
    replicate_task : function(res) {
        var task = sideroad.data.task[res.id];
        sideroad.core.exec("create_task",{task:task});
    },
    
    open_browse_task_dialog : function(task_id){
		var that = this;
        var p = this._get_parallel_dialog("browse_task_dialog",task_id);
        var d = p.dialog;
 
        // get task data
        var task = sideroad.data.task[task_id];
        var team = sideroad.data.team[task.team_id] || {name : "-- No team --",team_img_seq:0};
        
		// initialize dialog		
        d.find(".state").hide();
        d.find("."+task.state).show();
        d.find(".remind_set").hide();
		
		// insert detail and remind
		var f = function(){
			var task = sideroad.data.task[task_id];
			d.find("div#browse_task_detail-" + task_id).hide().html(that.lfToBr(that.sanitize(task.detail)) || "").show("blind");
			
			//remind
			if (task.remind_id) {
				d.find(".remind_set").show();
				d.find("p#browse_task_remind_to-" + task_id).text(that.unsanitize(task.remind_to));
				d.find("p#browse_task_remind_time-" + task_id).text(that.timeToDay(task.remind_time, "sec") + " " + that.timeToHrMinTr(task.remind_time, "sec"));
			}
			else {
				d.find(".remind_set").hide();
			}
		};
		
		if (task.detail === undefined) {
			d.find("div#browse_task_detail-" + task_id).html("Now Loading...");
			sideroad.core.exec("load_task", {
				ids: task_id,
				detail: true,
				afterCallback: f
			});
		} else {
			f();
		}
		
        d.find("div#browse_task_title-"+task_id).text(task.title || "");
        d.find("div#browse_task_begin-"+task_id).text(task.begin || "");
        d.find("div#browse_task_due-"+task_id).text(task.due || "");
        d.find("div#browse_task_finish-"+task_id).text(task.finish || "");
        d.find("div#browse_task_team-"+task_id).text(team.name);
        d.find("img#browse_task_team_img-"+task_id).attr("src","/img/team/"+team.team_img_seq+".png?_="+sideroad.env.cache_seq);
        

        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.browse_task,
            width: 550
        });
        
        if (!p.isExists) {
            d.find("#edit_task_button-" + task_id).click(function(){
                instance.callback.open_create_task_dialog({
                    id: task_id
                })
            });
            d.find("#delete_task_button-" + task_id).click(function(){
                instance.callback.delete_task({
                    id: task_id
                })
            });
            d.find("#put_back_task_button-" + task_id).click(function(){
                instance.callback.put_back_task({
                    id: task_id
                })
            });
            d.find("#erase_task_button-" + task_id).click(function(){
                sideroad.core.exec("erase_task", {
                    id: task_id
                })
            });
            d.find("#open_entrust_task_dialog_button-" + task_id).click(function(){
                var tasks = {};
                task.holder = sideroad.data.user.nickname;
                tasks[task_id] = task;
                instance.callback.open_entrust_task_dialog(tasks,task.team_id,"browse_task_dialog-"+task_id);
            });
            d.find("#open_send_task_dialog_button-" + task_id).click(function(){
                var tasks = {};
                tasks[task_id] = task;
                instance.callback.open_send_task_dialog(tasks,"browse_task_dialog-"+task_id);
            });
            d.find("#replicate_task_button-" + task_id).click(function(){
                instance.callback.replicate_task({
                    id: task_id
                })
            });
        }
        
        d.dialog(options);
    },    
    
    edit_task : function(res) {
        var d = $("div#create_task_dialog-"+res.id);
        
        var title   = d.find("input[name=create_task_title]").val();
        var detail  = d.find("textarea[name=create_task_detail]").val();
        var begin   = d.find("input[name=create_task_begin]").val() || "";
        var due     = d.find("input[name=create_task_due]").val() || begin;
        var finish  = d.find("input[name=create_task_finish]").val() || due;
        var team_id = d.find("select[name=create_task_team]").val() || "";
        
        var validates = [
            ["task_title",title],
            ["task_begin",begin]
        ];
            
        //remind
		var remind_id;
		var remind_to;
		var remind_time;
        var remind_date = d.find("input[name=create_task_remind_date]").val();
        var remind_datetime = d.find("span.timepicker").text();
            
        remind_id = "remind_" + this.create_random_key();
        remind_to = d.find("input[name=create_task_remind_to]").val() || "";
        remind_time = new Date(remind_date + " " + remind_datetime).getTime()/1000;
        
		
        // value setting
        $.extend(sideroad.data.task[res.id],{
            title : title ,
            detail: detail,
            begin : begin ,
            due   : due ,
            finish : finish,
            team_id : team_id,
			remind_id : remind_id,
			remind_to : remind_to,
			remind_time : remind_time
        });
        
		var task = sideroad.data.task[res.id];
		
		//
        var state = task.state;
        if(state != "done" && state != "results") {
            task.finish = "";
        }
        
		//
        var is_remind = d.find(".create_task_remind_on:checked").length;
        if (is_remind && state != "trash") {
            d.find(".create_task_remind_on").attr("checked",true);
            d.find(".create_task_remind_off").removeAttr("checked");
            validates.push(["task_remind_to",remind_to]);
            validates.push(["task_remind_date",remind_date]);
        } else {
            task.remind_id = null;
            task.remind_to = null;
            task.remind_time = null;
			d.find(".create_task_remind_on").removeAttr("checked");
            d.find(".create_task_remind_off").attr("checked",true);
        }
        
        sideroad.core.exec("change_task",{
            id : res.id
        });
		
		
        d.dialog("close");
        this.open_browse_task_dialog(res.id);
    },
    
    change_task : function(res) {
        var task_id = res.id;
        var task = sideroad.data.task[task_id];
        
        // update task div
        var t = $("div#"+task_id);
        t.find(".title").text(task.title);
        
        var g = t.find(".team_image");
        g.html("");
        if(task.team_id) {
            g.append("<img src='/img/team/"+sideroad.data.team[task.team_id].team_img_seq+".png?_="+sideroad.env.cache_seq+"' width='20' height='20' />");
        }
        
        $("#list_task_table:visible").flexReload();
        this.time_observe(task_id);
        
    },
	
	change_task_state : function(res){
		var task_id = res.id;
        $("#list_task_table:visible").flexReload();
        this.time_observe(task_id);
	},
    
    delete_task : function(res){
        this._move_task("trash",res.id);
    },
    
    put_back_task : function(res) {
        this._move_task("todo",res.id);    
    },
    
    erase_task : function(res) {
        
        var task_id = res.id;
        var self = this;
        // erase task
        $("div#"+task_id).hide(
            "drop",{},"normal",function(){
                $(this).remove();
                self.trash_observe();
                delete sideroad.data.task[task_id];
            }
        );
        
        $("div.dialog").dialog('close');
        
    },
    
    _move_task : function(state,task_id) {
        var self = this;
        
        // move task
        $("div#"+task_id).hide(
            "drop",{},"fast",function(){
                $(this).attr("style","")
					   .appendTo($("div#"+state))
                       .show("drop");
                var task_id = $(this).attr("id");
                sideroad.data.task[task_id].state = state;
                
                self.trash_observe();
                var box = self.get_box_name_by_state(state);
				
                sideroad.core.exec("change_task_state",{
                    id : task_id
                });
                self.active_lane({
                    lane: state + "_lane"
                });
                $(".ui-effects-wrapper").remove();
                
            }
        );
        if($("#browse_task_dialog-"+task_id).length) {
            $("#browse_task_dialog-"+task_id).dialog("close");
        }
    },
    
    //trash
    erase_trash: function(){
        $("#list_task_table:visible").flexReload();
        
    },
    
    //lane
    active_lane: function(res) {
        $("div#"+res.lane).parent()
                         .find("div.lane")
                         .each(
                             function(){
                                 var l = $(this);
                                 var id = l.attr("id");
                                
                                // is active lane?
								var tasks = l.find("div.task");
                                var lane_width = 120;
                                if(id == res.lane) {
                                    lane_width = lane_width*3.5;
									tasks.removeClass("mini");
                                } else {
									tasks.addClass("mini");
								}
								                                
                                // lane animate
                                 l.stop().animate(
                                    {
                                        width: lane_width
                                    },
                                500);
                                
                                
                             }
                         );
    },
    
    //boxes
    active_box: function(res){
        
        $(".box:visible").hide();
        $("#"+res.box+"_box").show();
        
        $(".menu:visible").hide();
        $("#"+res.box+"_menu").show();
    },
    
    get_box_name_by_state : function(state){
        var box = $("#"+state).parents(".box").get(0).id.replace("_box","");
        return box;
    },
    
    //data load
    load_all_task : function() {
        
        instance.loading.start();
        
        //initialize task
        $("div.task").not("#default_task").remove();
        
        sideroad.data.start.future = 0;
        sideroad.data.start.current = 0;
        sideroad.data.start.results = 0;
        sideroad.data.start.trash = 0;
        
        sideroad.core.exec("load_task",{state:"future"});
        sideroad.core.exec("load_task",{state:"current"});
        sideroad.core.exec("load_task",{state:"results"});
        sideroad.core.exec("load_task",{state:"trash",chain:true});
        
    } ,
    
    load_task : function(res,req) {
        var state = req.state;
        sideroad.data.start[state] += sideroad.data.amount[state];
        $.extend(sideroad.data.task,res.data);
        
        for (var task_id in res.data) {
            this.create_task_div(task_id);
        }
        
        var lane;
        if(state == "current") {
            lane = "todo";
        } else if(state == "future") {
            lane = "someday";
        } else {
            lane = state;
        }
        
        
        if(!res.isFinish) {
            $("div#"+state+"_more").appendTo("div#"+lane);
        } else {
            $("div#"+state+"_more").appendTo("div#storage");
        }
        
        if(req.chain){
            if(sideroad.data.chain[state]) {
                sideroad.core.exec("load_task",{
                    state:sideroad.data.chain[state],
                    chain:true
                });
            } else {
                this.time_observe();
                this.trash_observe();
                this.active_lane({
                    lane: "todo_lane"
                });
                this.active_lane({
                    lane: "someday_lane"
                });
                instance.loading.finish();
                sideroad.core.exec("load_routine",{chain:true});
            }
            
        } else {
            this.time_observe();
            this.active_lane({
                lane: lane+"_lane"
            });
        }
    } ,    
    
    //observes
    time_observe : function(id){
        //change box by time, future <=> todo
        //change color
        //  no due : yellow
        //  2day ago: blue
        //  today   : green
        //  overdue : red
        
        
        //time setting
        var today = this.get_today_time();
        var tomorrow   = today + 86400000;
        var yesterday  = today - 86400000;
        var week_after = today + 604800000;
        var three_day_after = today + 259200000;
        
        var tasks = {};
        if(id) {
            tasks[id] = sideroad.data.task[id];
        } else {
            tasks = sideroad.data.task;
        }
        var boxs  = sideroad.data.box;
                
        for(var task_id in tasks){
            var task = tasks[task_id];
            var state = task.state;
            var begin = (task.begin == "") ? "" : new Date(task.begin).getTime();
            var due = (task.due == "") ? "" : new Date(task.due).getTime();
            var finish = (task.finish == "") ? "" : new Date(task.finish).getTime();
            var task_class;
            var task_div = $("div#"+task_id);
            var box = boxs[state];
            
            //change color
			task_div.removeClass(sideroad.env.task);
            if (box == "future" || state == "todo" || state == "doing") {
                if (due && due == today) {
                    task_class = "green";
                } else if (due && due > today) {
                    task_class = "yellow";
                } else if (due && due < today) {
                    task_class = "red";
                } else if (!due) {
                    task_class = "yellow";
                }
            } else {
                task_class = "skyblue";
            }
            task_div.addClass(task_class);
            
            //change box and lane
            if(box == "future" || box == "current" || box == "results") {
                if (state != "tomorrow" && begin && begin == tomorrow) {
                    task.state = "tomorrow";
                } else if (state != "someday" && !begin) {
                    task.state = "someday";
                } else if (state != "definite" && begin && begin > tomorrow) {
                    task.state = "definite";
                } else if (box == "future" && begin && begin <= today) {
                    task.state = "todo";
                } else if(state == "done" && finish &&  finish <= yesterday) {
                    task.state = "results";
                } else  {
                    continue;
                }
            } else {
                continue;
            };
            
            task_div.appendTo("#"+task.state);
            sideroad.core.exec("change_task_state",{
                id : task_id
            });
        }
        if(id) {
            sideroad.data.task[id] = task;
        }
        
    } ,
    
    trash_observe : function(){
        if($("div#trash").find(":first").size() > 0){
            $("div#trash_empty").hide();
            $("div#trash_full").show();
        } else {
            $("div#trash_empty").show();
            $("div#trash_full").hide();
        }
    } ,
    
    open_list_team_task_dialog : function(res) {
        
        var p = this._get_parallel_dialog("list_team_task_dialog",res.id);
        var d = p.dialog;
        
        var colModel = [
            {display: sideroad.localize.column.holder, name : 'holder', width : 100, sortable : true, align: 'left'},
            {display: sideroad.localize.column.title, name : 'title', width : 100, sortable : true, align: 'left'},
            {display: sideroad.localize.column.state, name : 'state', width : 50, sortable : true, align: 'center'},
            {display: sideroad.localize.column.detail, name : 'detail', width : 200, sortable : false, align: 'left' ,hide:true},
            {display: sideroad.localize.column.begin, name : 'begin', width : 75, sortable : true, align: 'center' },
            {display: sideroad.localize.column.due, name : 'due', width : 75, sortable : true, align: 'center'},
            {display: sideroad.localize.column.finish, name : 'finish', width : 75, sortable : true, align: 'center'}
        ];
        
        var params = [
                    {name:"method",value:"list_team_task"},
                    {name:"today_time",value:this.get_today_time("sec")},
                    {name:"uniq",value:sideroad.env.uniq},
                    {name:"team_id",value:res.id}
                ];


        if (!p.isExists) {
            var t = d.find("table");
            t.flexigrid({
                url : sideroad.env.url.task,
                dataType: 'json',
                title : sideroad.data.team[res.id].name,
                colModel : colModel,
                buttons : [
                    {
                        name: sideroad.localize.button.entrust,
                        bclass: 'entrust',
                        onpress: function(name,gDiv){
                            t.noSelect();
                            var obj = instance.callback.flexiExtraction(colModel,gDiv);
                            if (!obj) {
                                window.alert(sideroad.localize.alert.select_rows);
                                return;
                            }
                            instance.callback.open_entrust_task_dialog(obj,res.id);
                            
                        }
                    },{separator:true},
                    {
                        name: sideroad.localize.button.undertake,
                        bclass: 'undertake',
                        onpress: function(name,gDiv){
                            t.noSelect();
                            var obj = instance.callback.flexiExtraction(colModel,gDiv);
                            if (!obj) {
                                window.alert(sideroad.localize.alert.select_rows);
                                return;
                            }
                            instance.callback.open_undertake_task_dialog(obj,res.id);
                            
                        }
                    },{separator:true}
                ],
                searchitems : [
                    {display: sideroad.localize.column.title, name : 'title', isdefault:true},
                    {display: sideroad.localize.column.detail, name : 'detail' }
                ],
                params : params,
                rp:25,
                rpOptions:[10,25,50,100],
                useRp: true,
                sortname : "begin",
                sortorder: "desc",
                width : 800,
                height : 400,
                usepager: true
            });
        } else {
            d.find("table").flexOptions({params:params}).flexReload();
        }
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.team_task_list,
            width : 850,
            modal :true,
            draggable : false
        });
        
        d.dialog(options);
    } , 
	
    open_entrust_task_dialog : function(res,team_id,task_dialog_id) {
        var id = team_id + (new Date().getTime());
        var p = this._get_parallel_dialog("entrust_task_dialog",id);
        var d = p.dialog;
        var tt = d.find("div.task_titles");
        tt.html("");
        var ids = [];
        for(task_id in res) {
            var div = $("<div></div>");
            var task = res[task_id];
            if(task.holder != sideroad.data.user.nickname) {
                window.alert(sideroad.localize.alert.cant_entrust_task + " ["+task.title+ "]\n" + sideroad.localize.alert.not_task_holder + " ["+task.holder+"]");
                continue;
            }
            div.text(task.title);
            tt.append(div);
            ids.push(task_id);
            if(task.team_id) team_id = task.team_id;
        }
        if(!ids.length) return;
        var select = d.find("select");
        
        // create member list selectbox , if task belong in team.
        if(team_id) {
            sideroad.core.exec("load_member",{team_id:team_id,select:select});
        } else {
            // create friend list selectbox , if task not belong in team.
            var accepted = sideroad.data.friend.accepted;
            this._create_select(accepted,"nickname",select);
        }
        
        if(!p.isExists) d.find("#entrust_task_button-"+id).click(function(){sideroad.core.exec("entrust_task",{
            team_id: team_id,
            to_id: select.val(),
            task_ids: ids.join(","),
            dialog_id : "entrust_task_dialog-"+id,
            task_dialog_id : task_dialog_id
        })});
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.entrust_task,
            width: 550
        });
        d.dialog(options);
        
    },
    
    open_undertake_task_dialog : function(res,team_id) {
        var id = team_id + (new Date().getTime());
        var p = this._get_parallel_dialog("undertake_task_dialog",id);
        var d = p.dialog;
        var tt = d.find("div.task_titles");
        tt.html("");
        var ids = [];
        for(task_id in res) {
            var div = $("<div></div>");
            var task = res[task_id];
            if(task.holder == sideroad.data.user.nickname) {
                window.alert(sideroad.localize.alert.already_holded_task + " ["+task.title+ "].");
                continue;
            }
            div.text(task.title);
            tt.append(div);
            ids.push(task_id);
            if(task.team_id) team_id = task.team_id;
        }
        if(!ids.length) return;
        
        if(!p.isExists) d.find("#undertake_task_button-"+id).click(function(){sideroad.core.exec("undertake_task",{
            team_id: team_id,
            task_ids: ids.join(","),
            dialog_id : "undertake_task_dialog-"+id
        })});
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.undertake_task,
            width: 550
        });
        d.dialog(options);
        
    },
    
    open_send_task_dialog : function(res,task_dialog_id) {
        var id = new Date().getTime();
        var p = this._get_parallel_dialog("send_task_dialog",id);
        var d = p.dialog;
        
        var tt = d.find("div.task_titles");
        tt.html("");
        var ids = [];
        for(task_id in res) {
            var div = $("<div></div>");
            var task = res[task_id];
            div.text(task.title);
            tt.append(div);
            ids.push(task_id);
        }
        if(!ids.length) return;
        
        if (!p.isExists) {
            d.find("#send_task_button-" + id).click(function(){
                sideroad.core.exec("send_task", {
                    to: d.find("input[name=send_task_to]").val(),
                    note: d.find("textarea[name=send_task_note]").val(),
                    task_ids: ids.join(","),
                    dialog_id: "send_task_dialog-" + id,
                    task_dialog_id: task_dialog_id
                })
            });
        }
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.send_task,
            width: 550
        });
        d.dialog(options);
        
    } ,
    
    entrust_task : function(res,req) {
        $("#"+req.dialog_id).dialog("close");
        if(req.task_dialog_id) {
            $("#"+req.task_dialog_id).dialog("close");
        } else {
            this.open_list_team_task_dialog({id:req.team_id});
        }
        
        var task_id_array = req.task_ids.split(/\,/);
        for(var i=0;i<task_id_array.length;i++) {
            var task_id = task_id_array[i];
            $("div#"+task_id).hide("drop",function(){$(this).remove();});
        }
        
    },
    
    undertake_task : function(res,req) {
        $("#"+req.dialog_id).dialog("close");
        this.open_list_team_task_dialog({id:req.team_id});
        
        var task_id_array = req.task_ids.split(/\,/);
        
        sideroad.core.exec("load_task",{ids:req.task_ids,detail:true});        
    },
    
    send_task : function(res,req) {
        $("#"+req.dialog_id).dialog("close");
        if(req.task_dialog_id) {
            $("#"+req.task_dialog_id).dialog("close");
        }
        
    },    
    
    //table
    list_task : function(){
        var column = sideroad.localize.column;
        var button = sideroad.localize.button;
        var colModel = [
            {display: column.title, name : 'title', width : 150, sortable : true, align: 'left'},
            {display: column.team, name : 'name', width : 75, sortable : true, align: 'center'},
            {display: column.state, name : 'state', width : 50, sortable : true, align: 'center'},
            {display: column.detail, name : 'detail', width : 200, sortable : false, align: 'left' ,hide:true},
            {display: column.begin, name : 'begin', width : 75, sortable : true, align: 'center' },
            {display: column.due, name : 'due', width : 75, sortable : true, align: 'center'},
            {display: column.finish, name : 'finish', width : 75, sortable : true, align: 'center'}
        ];
        
        var params = [
            {name:"method",value:"list_task"},
            {name:"today_time",value:this.get_today_time("sec")},
            {name:"uniq",value:sideroad.env.uniq}
        ];
        var t = $("#list_task_table");
        t.flexigrid({
            url : sideroad.env.url.task,
            dataType: 'json',
            title : sideroad.localize.flexigrid.list_task,
            colModel : colModel,
            buttons : [
                {
                    name: button.create,
                    bclass: 'add',
                    onpress: function(name,gDiv){
                        instance.callback.open_create_task_dialog();
                    }
                            
                },{
                    name: button.browse,
                    bclass: 'browse',
                    onpress: function(name,gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel,gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var task = sideroad.data.task;
                        var load_ids = [];
                        for(var id in obj) {
                            if(!task[id]) load_ids.push(id);
                        }
                        instance.loading.start();
                        sideroad.core.exec("load_task",{ids:load_ids.join(","),detail:true,afterCallback:function(){
                            for(var id in obj) {
                                instance.callback.open_browse_task_dialog(id);
                            }
                            instance.loading.finish();
                        }});
                    }
                            
                },{separator:true},{
                    name: button.edit,
                    bclass: 'edit',
                    onpress: function(name,gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel,gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var task = sideroad.data.task;
                        var load_ids = [];
                        for(var id in obj) {
                            if(!task[id]) load_ids.push(id);
                        }
                        instance.loading.start();
                        sideroad.core.exec("load_task",{ids:load_ids.join(","),detail:true,afterCallback:function(){
                            for(var id in obj) {
                                instance.callback.open_create_task_dialog({id:id});
                            }
                            instance.loading.finish();
                        }});
                        
                    }
                            
                },{separator:true},{
                    name: button.del,
                    bclass: 'delete',
                    onpress: function(name, gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel, gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var task = sideroad.data.task;
                        var load_ids = [];
                        for (var id in obj) {
                            if (!task[id]) 
                                load_ids.push(id);
                        }
                        instance.loading.start();
                        sideroad.core.exec("load_task", {
                            ids: load_ids.join(","),
							detail:true,
                            afterCallback: function(){
                                instance.loading.finish();
                                var titles = [];
                                for (var id in obj) {
                                    titles.push(obj[id].title);
                                }
                                if (!window.confirm(sideroad.localize.confirm.delete_task + "\n" + titles.join("\n"))) 
                                    return;
                                for (var id in obj) {
                                    instance.callback.delete_task({
                                        id: id
                                    });
                                }
                                
                            }
                        });
                        
                    }
                },{separator:true},{
                    name: button.replicate,
                    bclass: 'replicate',
                    onpress: function(name, gDiv){
                        t.noSelect();
                        var obj = instance.callback.flexiExtraction(colModel, gDiv);
                        if (!obj) {
                            window.alert(sideroad.localize.alert.select_rows);
                            return;
                        }
                        var task = sideroad.data.task;
                        var load_ids = [];
                        for (var id in obj) {
                            if (!task[id]) 
                                load_ids.push(id);
                        }
                        instance.loading.start();
                        sideroad.core.exec("load_task", {
                            ids: load_ids.join(","),
							detail:true,
                            afterCallback: function(){
                                instance.loading.finish();
                                var titles = [];
                                for (var id in obj) {
                                    titles.push(obj[id].title);
                                }
                                if (!window.confirm(sideroad.localize.confirm.replicate_task+"\n" + titles.join("\n"))) 
                                    return;
                                for (var id in obj) {
                                    instance.callback.replicate_task({
                                        id: id
                                    });
                                }
                                
                            }
                        });
                        
                    }
                },{separator:true}
            ],
            searchitems : [
                {display: column.title, name : 'title' },
                {display: column.team, name : 'name',isdefault:true },
                {display: column.detail, name : 'detail' }
            ],
            params : params,
            rp:25,
            rpOptions:[10,25,50,100],
            useRp: true,
            sortname : "begin",
            sortorder: "desc",
            width : 800,
            height : 400,
            usepager: true
        });
        t.flexOptions({params:params}).flexReload();
        instance.loading.finish();
        $("div.dialog").dialog('close');
        
        var options = $.clone(sideroad.env.dialog);
        $.extend(options,{
            title: sideroad.localize.dialog.list_task,
            width : 850,
            modal :true,
            draggable : false
        });
        
        $("div#list_task_dialog").dialog(options);
        
    }
    
};

//routine
sideroad.callback.routine = function(){}
sideroad.callback.routine.prototype = {
    open_create_routine_dialog : function(res){
        $("div.dialog").dialog('close');
        
        var options;
        if(!res.id) {
            options = sideroad.env.dialog;
            $.extend(options,{
                title: sideroad.localize.dialog.create_routine,
                width: 550
            });
            
            $(".create_routine").show();
            $(".edit_routine").hide();
            
            //clear res
            this.clear("create_routine_dialog");
        } else {
            options = sideroad.env.dialog;
            $.extend(options,{
                title: sideroad.localize.dialog.edit_routine,
                width: 550
            });
            
            $(".edit_routine").show();
            $(".create_routine").hide();
            
            //set res
            res.target = "routine";
            this.infuse(res);
            
            // store active routine_id
            sideroad.data.active_routine_id = res.id;
        }

        $("div#create_routine_dialog").dialog(options);        
    },
    
    create_routine : function(res){
        this.create_routine_div(res.id,true);
        this.clear("create_routine_dialog");
    },
    
    create_routine_div : function(routine_id,is_active) {
        var routine = sideroad.data.routine[routine_id];
        var self = this;
        var r = $("div#default_routine")
            .clone(true)
            .attr({
                "id": routine_id
            })
            .dblclick(function(){
                var routine = sideroad.data.routine[routine_id];
                self.open_create_routine_dialog({
                    id: routine_id
                });
            })
            .appendTo("#routine");
        r.find(".title").text(routine.title);
        
        if(routine.team_id) {
            r.find(".team_image").append("<img src='/img/team/"+sideroad.data.team[routine.team_id].team_img_seq+".png?_="+sideroad.env.cache_seq+"' width='20' height='20' />");
        }
    },
    
    edit_routine : function(res) {
        $("div.dialog").dialog('close');   
        var routine = sideroad.data.routine[res.id];
        
        // update task div
        var r = $("div#"+res.id);
        r.find(".title").text(routine.title);
        
        var g = r.find(".team_image");
        g.html("");
        if(routine.team_id) {
            g.append("<img src='/img/team/"+sideroad.data.team[routine.team_id].team_img_seq+".png?_="+sideroad.env.cache_seq+"' width='20' height='20' />");
        }
                            
        
    },
    
    erase_routine : function(res) {
        
        var routine_id = res.id;
        // erase task
        $("div#"+routine_id).hide(
            "drop",{},"normal",function(){
                $(this).remove();
                delete sideroad.data.routine[routine_id];
            }
        );
        
        $("div.dialog").dialog('close');
        
    } ,
    
    load_routine : function(res,req) {
        
        //initialize routine
        $("div.routine").not("#default_routine").remove();
                
        sideroad.data.routine = res.routine;
        
        var routines = sideroad.data.routine;
        
        for (var routine_id in routines) {
            this.create_routine_div(routine_id);
        }
        instance.loading.finish();
    }
};

//remind
sideroad.callback.remind = function(){};
sideroad.callback.remind.prototype = {};

//timeline
sideroad.callback.timeline = function(){}
sideroad.callback.timeline.prototype = {
    get_event_timeline: function(options){
		options = options || {};
		
		var state = options.state;
		var chain = options.chain;
		var today_date = nowDate();
		var params = {
            today_date: today_date,
            uniq: sideroad.env.uniq,
            method: "timeline_task",
            state: state,
            start: sideroad.data.start[state],
            amount: sideroad.data.amount
        };
		$.post(sideroad.env.url.task, params, function(result){
			if (!result) {
				window.alert(sideroad.localize.alert.traffic_problem);
				return;
			}
			
			sideroad.data.start[state] += sideroad.data.amount;
			result = window["eval"]("(" + result + ")");
			
			if (result.error && result.error == "SYSTEM ERROR") {
				window.alert(sideroad.localize.alert.system_error);
				return;
			}
			
			eventSource.loadJSON(result, "/img/");
            tl.layout();
			
			if (!result.isFinish) {
				instance.callback.get_event_timeline({
					state: state,
					chain: chain
				});
			} else if (chain && sideroad.data.chain[state]) {
				instance.callback.get_event_timeline({
					state: sideroad.data.chain[state],
					chain: true
				});
			} else {
			}
			
		});
	}
};

//language
sideroad.callback.language = function(){};
sideroad.callback.language.prototype = {
	set_language:function(options){
    $.cookie("lang", options.lang, {
        expires: 365,
        path: "/"
    });
    
    if(window.confirm(sideroad.localize.confirm.reload)){
        location.reload(true);
        
    }
}
};

//sideroad. core
sideroad.core = {
	exec : function(method,values,self){
        if(!values) values={};
        if(!values.enable) $("input[type=button]").attr("disabled",true);
                
        //exec
        var w = instance.exec;
        if(w[method]) {
            try {
                w[method].apply(instance.exec,[values]);
            } catch(e){
                if(e != "") window.alert(e);
                $("input[type=button]").removeAttr("disabled");
                return;
            }
        }
        
        //callback
        var callback = instance.callback;
        if(!callback[method]) return;
        var url;
        for(var u in callback) {
            if(callback[u].prototype[method]) {
                url = sideroad.env.url[u];
                break;
            }
        }
        url = (values.url) || url;
        if(!url) return;
                    
        //form setting
        instance.callback.appendForm(values);
        var form = sideroad.data.form;
        form.method = method;
                            
        //uniq append
        form.uniq = sideroad.env.uniq;
        
        $.ajax({
            url: url,
            data: form,
            format: "json",
            type : "POST",
            success: function(result){
                if (!result) {
                    if (!values.enable) {
                        window.alert(sideroad.localize.alert.traffic_problem);
                        instance.loading.finish();
                    }
                    return;
                }
                
                var data = window["eval"]("(" + result + ")");
                
                if (data.error && data.error == "SYSTEM ERROR") {
                    window.alert(sideroad.localize.alert.system_error);
                    instance.loading.finish();
                    return;
                }
                
                if (values.beforeCallback) 
                    values.beforeCallback(data, values);
                
                //do callback
                var c = instance.callback;
                if (c[method]) {
                    c[method].apply(c, [data, values, form]);
                }
                if (values.afterCallback) 
                    values.afterCallback(data, values);
                sideroad.data.form = {};
                if (!values.enable) 
                    $("input[type=button]").removeAttr("disabled");
            },
            error: function(){
                if (!values.enable) {
                    window.alert(sideroad.localize.alert.traffic_problem);
                    instance.loading.finish();
                }
                return;
                
            }
        });
        
    } ,
	setEvent : function() {
        $("[class*='exec-']").each(function(){
            var className = this.className.match(/exec-([^ ]*)/)[1];
            this.className = this.className.replace(/exec-[^ ]+/,"");
            var value_array = className.split(/-/);
            var method = value_array.shift();
            
            //method setting
            var self = this;
            
            //values setting
            var values = {};
            for (var j = 0; j < value_array.length; j++) {
                if(!value_array[j].match(/=/)) continue;
                values[value_array[j].split(/=/)[0]] = value_array[j].split(/=/)[1];
            }
            
            if(instance.exec[method]) {
                $(this).click($.scope(instance.exec,[values],instance.exec[method]));
            } else {
                $(this).click($.scope(instance.callback,[values],instance.callback[method]));
            }
        });
    } ,
	initialize : function(){
        this.setToggle();
        this.setHint();
        this.setEvent();
        
        //set puff effect for text and textarea
        $("input[type='text'],textarea").not(".datepicker,.paralleldatepicker").focus(function() {
            $(this).css({"background-color":"#DFF2FF","border":"1px solid #009EFF"});
            if($.browser.msie) return;
            if(this.___is_focusing) return;
            this.___is_focusing = true;
            var self = this.___is_focusing;
            var position = $(this).position();
            var self = this;

            $(this).clone().attr("id","").insertBefore(this)
                                          .css({
                                            "position":"absolute", 
                                            "left":position.left+"px",
                                            "top":position.top+"px"
                                           })
                                          .hide("puff",function(){$(this).remove();self.___is_focusing=false;})
                                          .focus(function(){$(self).focus();});
        })
        .blur(function() {  
            $(this).css({
                "background-color": "",
                "border": "1px solid gray"
            });  
        });
        
        //execute method by pathname
        var path = location.href;
        if(path.match(/\#/)) {
            var method = path.split(/\#/)[1];
            var c = instance.callback[method];
            if(c) c();
        }
        
        //user component initialize
        if (instance.components.user) {
            
            // open user login dialog unless unread cookie uniq 
            var uniq = $.cookie('uniq');
            sideroad.env.uniq = (uniq) ? uniq : "Guest";
            if (sideroad.env.uniq == "Guest") {
                instance.callback.logout();
                instance.callback.open_login_user_dialog();
            }
            else {
                instance.callback.login({
                    uniq: sideroad.env.uniq
                });
            }
            
            $("select.user_style").change(function(){
                instance.callback.setStyle($(this).val());
            });
        }
        
        //floating component initialize
        if (instance.components.floating) {
            sideroad.core.exec("load_floating_message", {
                enable: true
            });
            setInterval(function(){
                sideroad.core.exec("load_floating_message", {
                    enable: true
                })
            }, 60000);
        }
        
        sideroad.extention.initialize();
    } , 
	setToggle : function(){
        var isChecked = [];
        var toggle = function(e){
            var target = $("."+e.data.id+"_toggle");
            if(target.is(":visible")) return;
            
            $("."+e.data.className).hide();
            target.show();
        };
        
        $("[class*='toggle-']").each(function(){
            var className = this.className.match(/toggle-([^ ]*)/)[1];
            this.className = this.className.replace(/toggle-[^ ]+/,"");
            $("."+className).hide();
            
            if ($(this).is(":checked")) {
                isChecked.push({
                    id: this.id,
                    className: className
                });
            }
            $(this).bind("click",{id:this.id,className:className},toggle);
        });
        
        for(var i=0;i<isChecked.length;i++) {
            toggle({
                data: isChecked[i]
            });
        }
    } , 
	setHint : function(){
        $("input[title]").each(function(){
            var title = this.title;
            $(this).removeAttr("title");
            var hint = $("<div>"+title+"</div>");
            $(this).parent().append(hint);
            hint.hide();
            
            $(this).focus(function(){
                hint.show("drop","fast");
            }).blur(function(){
                hint.hide("drop","fast");
                
            });
        });
    } ,
	fileUpload : function (options){
       
        /*
            prepareing ajax file upload
            url: the url of script file handling the uploaded files
                        fileElementId: the file type of input element id and it will be the index of  $_FILES Array()
            dataType: it support json, xml
            secureuri:use secure protocol
            success: call back function when the ajax complete
            error: callback function when the ajax failed
           
                */
                
        if(!options.params) options.params = {};
        options.params.uniq = sideroad.env.uniq;
        
        $.ajaxFileUpload
        (
            {
                url:options.url,
                secureuri:false,
                fileElementId:options.file,
                dataType: 'json',
                params : options.params,
                error: function (data, status, e){
                    alert(e);
                },
                success : options.callback
            }
        )
        sideroad.env.cache_seq++;
        return false;

    }
}

sideroad.marge = function(target){
	var o = function(){};
    $.extend(o.prototype, new sideroad.util());
	
	for(var component in instance.components) {
		$.extend(o.prototype,new sideroad[target][component]());
	}
	var marge = new o;
    return marge;
}

sideroad.read = function(f) {
	
	var stack = [];
	var components = instance.components;
	var lang = sideroad.env.lang;
	
	for(var component in components) {
        stack.push(true);
	}
	
    for(var component in components) {
        (function(c){
            $.get(sideroad.env.url.storage + c + "-" + lang, function(result){
                $("<div></div>").attr("id", c + "-component").html(result).appendTo($("#storage"));
				stack.shift();
				if(!stack.length) f();
            }); 
        })(component);
    }
}

sideroad.getLanguage = function(){
    var lang = $.cookie("lang") || (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2) || "en";
    	
	var localize = {
		ja : {
			dialog : {
				login_user : "ログインする",
                register_user : "アカウントを登録する",
                edit_user: "ユーザ情報を変更する",
                friend: "友達リスト",
                friend_accept: "友達になる",
				create_task : "タスクを作成する",
				edit_task : "タスク内容を変更する",
                browse_task : "タスクを参照する",
                list_task : "タスク一覧",
                team_task_list : "チームタスクの一覧",
                entrust_task : "タスクを委譲する" ,
                undertake_task : "タスクを引受ける" ,
                send_task : "タスクの内容をEメールに送信する",
				team : "チームリスト",
				browse_team : "チーム情報を参照する",
				create_team : "チームを作成する",
				edit_team : "チーム情報を変更する",
                create_address : "新規アドレスの登録",
                edit_address : "アドレスの変更",
                list_address : "アドレス帳",
				send_message : "メッセージを送信する",
				message_box : "メッセージBOX"
			} ,
            flexigrid : {
                list_address : "行を選択して、「選択する」を押してください",
                list_inbox : "受信箱",
                list_sent : "送信済み",
                list_task : "タスク一覧"
            } ,
			confirm : {
				reload: "画面を更新しますがよろしいですか？\n編集途中のデータは保存されません。",
                delete_message : "以下のメッセージを削除しても良いですか？",
                delete_task : "以下のタスクを削除しても良いですか？",
                replicate_task : "以下のタスクを複製しても良いですか？",
                entrust_task : "タスクを委譲しても良いですか？",
                send_task : "タスク内容をEメールに送信しても良いですか？",
                accept_friend : "このユーザを友達にしても良いですか？",
                request_friend: "友達申請をしても良いですか？",
                deny_friend: "友達申請を拒否しても良いですか？",
                create_team: "チームを作成しても良いですか？",
                edit_team: "チーム情報を変更しても良いですか？",
                delete_team: "チームを削除しても良いですか？",
                delete_address: "アドレスを削除しても良いですか？"
			} ,
			alert : {
                register_user_success:"まだ登録は完了していません。メールを確認し、本登録を完了してください。",
                register_user_failed: "[エラー] アカウントの登録に失敗しました。",
                login_user_failed: "[エラー] ログインに失敗しました。\nユーザID、パスワードを確認してください。",       
                id_already_exists: "[エラー] 入力したユーザIDは既に存在しています。\n違うユーザIDを入力してください。",
                address_already_used: "[エラー] 入力したメールアドレスは既に使われています。\n違うメールアドレスを入力してください。",
                nickname_already_exists: "[エラー] 入力したニックネームは既に存在しています。\n違うニックネームを入力してください。",
                edit_user_failed: "[エラー] ユーザ情報の変更に失敗しました。",
                select_rows : "行を選択してください。",
                already_holded_task : "あなたは既にタスクを持っています",
                cant_entrust_task : "他人のタスクを委譲することはできません。" ,
                not_task_holder : "現在の持ち主は",
                traffic_problem : "[エラー] サーバ通信エラーが発生しました。",
                system_error : "[エラー] システムエラー"
			} ,
            floating: {
                get_friend_request: "<p>友達申請を受け取りました。</p><p><input type='button' value='確認する' onClick='instance.callback.open_requested_friend_dialog()' /></p>",
                get_new_message : "<p>新着メッセージを受信しました。</p><p><input type='button' value='受信箱を開く' onClick='instance.callback.open_message_box_dialog()' /></p>",
                entrusted_task : "<p>次のタスクを委譲されました[%]。</p><p>委譲したユーザは[%]です。</p>",
                undertaked_task : "<p>次のタスクが引取られました[%]。</p><p>引取ったユーザは[%]です。</p>"
            },
			button : {
				today : "今日",
				clear : "クリア",
				check : "確認する",
                entrust : "委譲する",
                undertake : "引受ける",
				select : "選択する",
				create : "新規登録",
                browse : "参照する",
				edit : "変更する",
				del : "削除する",
				reply : "返信する",
                replicate : "複製する"
			},
			column : {
				title : "タイトル",
                holder : "担当",
				detail : "詳細",
				state : "状態",
				begin : "開始日",
				due : "期日",
				finish : "完了日",
				team : "チーム名",
                name : "名前",
                address : "Eメールアドレス",
                from : "差出人",
                to : "宛先",
                user_id : "ユーザID",
                subject : "件名",
                date : "日付"
			} ,
            text : {
                member : "のメンバー"
            }
			
		} ,
		en: {
			dialog: {
				login_user: "Login",
				register_user: "Temporary User Register",
				edit_user: "Edit User Information",
				friend: "Friend",
				friend_accept: "Friend Accept",
				create_task: "Create New Task",
				edit_task: "Edit Task",
				browse_task: "Browse Task",
				list_task : "Task List",
				team_task_list: "Team Task List",
				entrust_task: "Entrust Task",
				undertake_task: "Undertake Task",
				send_task: "Send Email Task",
				create_routine: "Create New Routine",
				edit_routine: "Edit Routine",
				team: "Team List",
				browse_team: "Browse Team Information",
				create_team: "Create Team",
				edit_team: "Edit Team Information",
				create_address: "Register New Address",
				edit_address: "Edit Address",
				list_address: "Address Book",
				send_message: "Send Message",
				message_box: "Message Box"
			},
			flexigrid : {
				list_address : "Select rows and Press Select.",
				list_inbox : "Inbox",
				list_sent : "Sent",
				list_task : "Task List"
			} ,
			confirm: {
				reload: "Are you sure to reload window?\nDont preserved data during edit.",
				delete_message: "Are you sure to delete message?",
				delete_task: "Are you sure to delete task?",
				replicate_task: "Are you sure to replicate task?",
				entrust_task: "Are you sure to entrust task?",
				send_task: "Are you sure to send Email?",
				accept_friend: "Are you sure to accept friend?",
				request_friend: "Are you sure to friend request?",
				deny_friend: "Are you sure to deny friend?",
				create_team: "Are you sure to create team?",
				edit_team: "Are you sure to change team information?",
				delete_team: "Are you sure to delete team?",
				delete_address: "Are you sure to delete address?"
			},
			alert: {
				register_user_success: "Registration has not been completed yet.\nCheck Mail to complete register.",
				register_user_failed: "[Error] Register failed",
				login_user_failed: "Login failed. \nPlease confirm UserID or Password.",
				id_already_exists: "[Error] UserID already exists, input another UserID",
				address_already_used: "[Error] Email address was already used. input another Email address.",
				nickname_already_exists: "[Error] Nickname was already exists, input another Nickname",
				edit_user_failed: "[Error] Edit user information was failed",
				select_rows: "Please select rows before",
				already_holded_task: "You are already holded task",
				cant_entrust_task : "You can't entrust task" ,
				not_task_holder : "Because you are not task holder. current holder is",
				traffic_problem: "[Error] Server traffic problem occured.",
				system_error: "[Error] System Error"
			},
			floating: {
				get_friend_request: "<p>New friend request was arrived.</p><p><input type='button' value='Check' onClick='instance.callback.open_requested_friend_dialog()' /></p>",
				get_new_message : "<p>New message was arrived.</p><p><input type='button' value='Open Message Box' onClick='instance.callback.open_message_box_dialog()' /></p>",
				entrusted_task : "<p>You get entrusted task[%].</p><p>Entrusted user [%].</p>",
				undertaked_task : "<p>Your task was undertake [%].</p><p>Undertake user [%]</p>"
			},
			button: {
				today: "Today",
				clear: "Clear",
				check: "Check",
				entrust : "Entrust",
				undertake : "Undertake",
                select : "Select",
                create : "New",
				browse : "Browse",
                edit : "Edit",
                del : "Delete",
				reply : "Reply",
				replicate : "Replicate"
			},
            column : {
                title : "Title",
				holder : "Holder",
                detail : "Detail",
                state : "State",
                begin : "Begin",
                due : "Due",
                finish : "Finish",
                team : "Team",
				name : "Name",
				address : "Email Address",
				from : "From",
				to : "To",
				user_id : "UserID",
				subject : "Subject",
				date : "Date"
            } ,
			text: {
				member: "'s member"
			}
		}
	};

    if(!localize[lang]) lang = "en";
    sideroad.localize = localize[lang];
    return lang;
}

sideroad.create = function(){
	
	//set language
	sideroad.env.lang = sideroad.getLanguage();
	
    //create instance
    instance.overlay = new sideroad.overlay();
    instance.loading = new sideroad.loading();
    
    $("<div></div>").attr("id","storage").hide().appendTo(document.body);
	sideroad.read(function(){
		instance.exec = sideroad.marge("exec");
		instance.callback = sideroad.marge("callback");
		
		//initialize
		sideroad.core.initialize();
		
	});
}

sideroad.extention = {
	//override this function, if u want
	initialize : function(){}
}
