//based on sideroad.js
//document ready

    
sideroad.extention.initialize = function() {
        
        var tomorrow = instance.callback.get_today_time()+86403000;
        var rest = tomorrow - new Date().getTime();
        setTimeout(function(){
            instance.callback.load_all_task();
        },rest);        
        
        //set rotate effect for icon image
        if(!$.browser.msie) {
            $("img.icon_img").each(function(){
                var rot = $(this).rotate({
                    angle: 5,
                    maxAngle: 5,
                    minAngle: -5,
                    bind: [{
                        "mouseover": function(){
                            rot[0].rotateAnimation(-5);
                        }
                    }, {
                        "mouseout": function(){
                            rot[0].rotateAnimation(5);
                        }
                    }]
                });
            });
        }

        //tabs
        $(".tabs").tabs();
		                   
        //lane droppable
        $("div.lane_contents").sortable({
			connectWith:".lane_contents",
			receive: function(ev, ui){
				var task_id = ui.item.attr("style","").attr("id");
				var task = sideroad.data.task[task_id];
				var state = $(this).attr("id");
				task.state = state;
				
				if (state == "tomorrow") {
					task.begin = instance.callback.get_tomorrow();
					if (!task.due) 
						task.due = task.begin;
				}
				else 
					if (state == "definite") {
						task.begin = instance.callback.get_day_after_tomorrow();
						if (!task.due) 
							task.due = task.begin;
					}
					else 
						if (state == "someday") {
							task.begin = "";
						}
						else 
							if (state == "done") {
								task.finish = instance.callback.get_today();
							}
							else {
								task.finish = "";
							}
				instance.callback.active_lane({
					lane: state + "_lane"
				});
				$.doPost("change_task_state", {
					id: task_id
				});
			}

            
		}).disableSelection();

        
        
        //current box droppable
        $("div#current_box_a").droppable(
            {
                drop:function(ev,ui){
                    var task_id = ui.draggable.attr("id");
                    
                    sideroad.data.task[task_id].begin = instance.callback.get_today();
                    sideroad.data.task[task_id].due   = instance.callback.get_today();
                    sideroad.data.task[task_id].finish = "";
                    instance.callback._move_task("todo",task_id);       
                },
                accept: ".task"
            }
        );   
        
        //future box droppable
        $("div#future_box_a").droppable(
            {
                drop:function(ev,ui){
                    var task_id = ui.draggable.attr("id");
                    
                    sideroad.data.task[task_id].begin = instance.callback.get_tomorrow();
                    sideroad.data.task[task_id].due   = instance.callback.get_tomorrow();
                    sideroad.data.task[task_id].finish = "";
                    instance.callback._move_task("tomorrow",task_id);       
                },
                accept: ".task"
            }
        );  
		
        //trash_icon droppable
        $("div#trash_div").droppable(
            {
                drop:function(ev,ui){
                    var task_id = ui.draggable.attr("id");
                    instance.callback.delete_task({id:task_id});       
                },
                accept: ".task"
            }
        );            

        //active first lane
        instance.callback.active_lane({
            lane: $("div.lane:first").attr("id")
        });
        
        //trash
        instance.callback.trash_observe();
        
}

$(document).ready(function(){
	
    instance.components = {
        user : true,
        task : true,
        routine : true,
        friend : true,
        team : true,
        address : true,
        message : true,
        floating : true,
		language : true
    };
	
	sideroad.create();
    
});