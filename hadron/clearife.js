var hadron = {
	
    name : "clearife",    
        
    // url
    url : "http://sideroad.secret.jp/cgi-bin/${quark}.cgi?method=${method}_${quark}",
    
    dataType: "json",
        
    // controllers    
    controller : [
        "user",
		"task" /*,
		"routine",
        "friend",
        "message",
        "team",
		"address" */
    ],
	
	model : [
        "user"  ,
        "task"/*,
        "routine",
        "friend",
        "message",
        "team",
        "address" */
	],
    
    lang : [
        "en",
        "ja"
    ],
    
    init : [
        "user.load"
    ],
	
	mock : false
	
};


quark.model.interceptBefore = function( data ){
    data.uniq = $.cookie("uniq") || "Guest";
};

