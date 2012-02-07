(function( q ){
    var c = q.controller,
	    v = q.view;
        
	c.define( "task", {
		postit: function(arg){
			
			var states = [ "future", "current", "results", "trash" ];
			
			for (i = 0; i < states.length; i++) {
			
				task.load({
					state: states[ i ],
					today_time: +new Date()
				}, function( res ){
				
					var task, tasks = {},state, id;
					
					for (id in res) {
						task = res[id];
						state = task.state;
						if (!tasks[state]) tasks[state] = [];
						tasks[state].push(task);
					}
					
					for( state in tasks ){
						v.render( "task."+state, tasks[state] );
					}
					
				});
			}
		},
		
		changeLane : function( arg ){
			
			
			
		},
		
		browseDialog : function( arg ){
			
			task.load( arg.data, function( res ){
				for( id in res ){
					arg.render( res[ id ] );
				}
			} );
			
		},
		closeBrowseDialog : function(){}
	});

})( quark );
