(function( q ){
    var v = q.view;
        
	v.config( "task", {
	   browseDialog : {
            button : true,
            dialog : {
                singleton : false,
                width : 600,
                close : "task.closeBrowseDialog"
            }
        }
	});

})( quark );
