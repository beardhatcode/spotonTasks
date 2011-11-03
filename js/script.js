/* Author: Gar_onn


*/

function spotonTasks(element, list) {

	// get a temporary ID
	var newId = 0,
	i = - 1;

	while (newId === 0) {
		if (localStorage.getItem('tasks' + i) === null) {
			// just to be shure
			localStorage.removeItem('serverBuffer' + i);
			newId = i;
		} else {
			i--;
		}
	}

	// A standard task to start with
    if(newId == -1 && user.id === 0){
        //verry first
    this.tasks = {"n":"L.I.F.E.G.O.E.S.O.N","online":false,"id":0,"s":100,"g":30,"listId":newId,"c":[{"n":"Friends","g":25,"s":28,"c":[{"g":"70","n":"Have fun","s":20,"id":2,"p":1},{"g":"22","n":"Heve even more fun","s":50,"id":3,"p":1},{"n":"Delete your facebook","g":"0","s":30,"id":14,"p":1}],"id":1,"p":0},{"n":"Food/Drink","g":"25","s":29,"id":4,"p":0},{"n":"Work","s":20,"g":50,"c":[{"g":"100","n":"get things done","s":33.333,"id":6,"p":5},{"n":"Call client","g":0,"s":33.333,"id":12,"p":5},{"n":"Make Tasklist","g":50,"s":33.333,"id":13,"p":5}],"id":5,"p":0},{"g":"25","n":"Sleep","s":23,"id":11,"p":0}]};
    }else{
        this.tasks = {"n":"Unnamed List"+ -newId,"online":false,"id":0,"s":100,"g":0,"listId":newId,"c":[{"n":"First Task","g":"0","s":100,"id":2,"p":0}]};
    }
	//not static data
	this.data = {
		buffer: {},
		blankTask: {
			n: 'New subtask',
			g: 0,
			s: 0
		},
		maxId: 0,
		curTask: 0,
		tasksById: [],
		changesMade: [],

		screenD: {
			sizeMiddle: 50,
			sizeA: 50,
			maxA: 3,
			sizeB: 10
		},

		screen: {
			centerX: 200,
			centerY: 200,
			sizeMiddle: 30,
			canvasX: 400,
			canvasY: 400,
			sizeA: 50,
			maxA: 3,
			sizeB: 45,
			offset: 30
		},

		colorScheme: {
			hover: ['hsl(0,0%,50%)', 'hsl(0,0%,70%)'],
			normal: ['hsl(0,0%,75%)', 'hsl(0,0%,95%)'],
			normal_selected: ['hsl(60,100%,75%)', 'hsl(50,100%,50%)'],
			hover_selected: ['hsl(50,100%,75%)', 'hsl(40,100%,50%)']
		}
	};

	this.display = {
		full: {
			startDeg: 1.5 * Math.PI,
			endDeg: 3.5 * Math.PI
		},
		half: {
			startDeg: 1.0 * Math.PI,
			endDeg: 2.0 * Math.PI
		},
		current: 'full'
	};

	// run the init
	this.init(element, list);
	return this;
}

/*****************************************************************************
 * start of prototype
 * 
 * Constructors (init,init2)
 ****************************************************************************/


spotonTasks.prototype = {
	mouse: {
		x: 0,
		y: 0,
		hover: 0,
		lastClicked: 0
	},


/*
 * init (constructor function)
 * 
 * function
 *   bind functions, map Id, ...
 *
 * args:
 *   canvasIdentifier : jQuery selector for the canvas
 *   list: listID of the current list
 *
 */
	init: function(canvasIdentifier, list) {

		//get canvas and context
		this.$canvas = $(canvasIdentifier);
		this.ctx = this.$canvas[0].getContext('2d');

		//load data from localstorage or server
		if (Modernizr.localstorage === true && 
            typeof(localStorage.getItem('tasks' + list)) == 'string' && 
            localStorage.getItem('tasks' + list).length > 10) 
               {
		    	this.tasks = localStorage.getObject('tasks' + list);
		    	this.buffer = localStorage.getObject('serverBuffer' + (list || 0));
		    	this.init2();
		} else {
			user.AJAX("list&listId=" + list, {},
			function(data, that) {
				if (data.succes === true && typeof(data.list) == "object") {
					that.tasks = data.list;
					that.tasks.online = true;
					that.store();
				}
				that.init2();
			},
			this);
		}
	},
    


/*
 * initi2 (helper function)
 *  finishes the job of init
 */
    init2: function() {
		//enable resizer
		this.resize();

		//create a quik tasklistAccespoint
		this.inTasksId();

		//fill the screen with data
		this.buildTaskList();
		this.fillSidebar(0);
		this.draw();

		return this;
	},

/*
 * inTasksId
 *
 * function
 *   fill this.data.tasksById for quiker acces
 *   to the tasks and get the highest Id and store it in
 *   this.data.maxId
 * args
 *   data	-	a task to map
 */

	'inTasksId': function(data) {
		var i, tasks;

		if (arguments.length === 0) {
			// set base task to id  zero
			data = this.tasks;
			this.data.tasksById = {};
			this.data.tasksById[0] = this.tasks;
		}

		for (i in data.c) {
			tasks = data.c[i];
			if (typeof this.data.tasksById[tasks.id] == "undefined") {
				this.data.tasksById[tasks.id] = tasks;
				this.data.maxId = Math.max(this.data.maxId, tasks.id);
			}
			// repeat for childs
			this.inTasksId(tasks);
		}

		return this.data.tasksById;
	},

/*
 * hasChild
 *
 * function:
 *  returns TRUE if {data} has a child
 *  returns FALSE if {data} has no childs
 *
 * arguments:
 *   data: task OBJECT
 * 
 */
    'hasChild': function(data) {
		if (typeof data.c == 'object' && data.c !== null && data.c.length > 0) {
			return true;
		} else {
			return false;
		}
	},

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *                     start of task changing methods                        *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* updateValue (setter)
 *
 * function
 *   set values
 *        > localStorage
 *        > to DB
 *
 * args
 *   value - the new value
 *   id    - the attribute to chaneg
 *               > n (name)
 *               > s (size)
 *               > g (gain/progress)
 *
 */
	'updateValue': function(value, type) {
		switch (type) {
		case 'n': // change name
			var task = this.data.tasksById[this.data.curTask];
			task.n = value;
			this.buildTaskList();
			break;
		case 's': // change size
			this.updateS(this.data.curTask, value);
			break;
		case 'g': // change completion
			this.updateG(this.data.curTask, value);
			break;
		default:
			log('unknown updatevalue', argumenuts);
			break;

		}

		this.store({type: type,	id: this.data.curTask});
	},

	/* Updaters 
 * 
 * change the value of a task and sync the other tasks
 *     > change DB
 *     > change localStorage
 * 
 * args
 *    taskId	-	id of the task
 *    newVal	-	new value
 *
 * */
	'updateS': function(taskId, newVal) {
		var i, task = this.data.tasksById[taskId];

		if (typeof this.data.tasksById[task.p] == "undefined") {
		    messageBox({
                title: 'Could not modify',
                html:'You man not resize the main task' 
            });
			return;
		}

		var group = this.data.tasksById[task.p].c,
		    otherTot = 0,
		    notLocked = [];

		// find neighbour tasks to fill the gap
		for (i in group) {
			if (group[i].l != 1 && group[i].id != taskId) {
				notLocked.push(group[i]);
				otherTot += group[i].s;
			}
		}

		if (notLocked.length === 0) {
		    messageBox({
                title: 'Could not modify',
                html:'We could not modify the size of the selected task(group). This could be due: <ul><LI>This is the only tasks</LI></UL>' 
            });
            return; 
		}

		// update task
		task.s = newVal * 1;

		var curTot = newVal * 1 + otherTot,
		    change = (100 - curTot);

		for (i in notLocked) {
			var t = notLocked[i];
			t.s += (t.s / otherTot) * change;
			t.s = Math.round(1000 * t.s) / 1000;

		}

		// update gain/progress of parrent task since this will be modified
		// do this by (re)updateing the gain to current value, so parrent will 
		// recalculate
		this.updateG(taskId, task.g);
	},

	'updateG': function(taskId, newVal) {
		var task = this.data.tasksById[taskId];
		task.g = newVal;
		pTask = this.data.tasksById[task.p];

		//recalculate parent if there is a one
		if (typeof pTask != 'undefined') {
			var gain = 0,i;
			for (i in pTask.c) {
				gain += (pTask.c[i].g * (pTask.c[i].s / 100));
			}

			$('.isDone[data-id=' + task.id + ']').attr('checked', (task.g == 100 ? true: false));
			this.updateG(task.p, gain);
		}

		$('span[data-id=' + task.id + ']').attr('data-g', Math.round(task.g));
	},


/* add
 *
 * function
 *   add a new task based on the default task (data.blankTask)
 *
 * args
 *   type	-	"child" or "neighbour"
 *   			where to append new task
 */
	'add': function(type) {
		var parent = this.data.tasksById[this.data.curTask];

		if (type == 'neighbour') {
			parent = this.data.tasksById[parent.p];
		}

		var blankTask = $.extend(true, {}, this.data.blankTask);
		this.data.maxId += 1;
		blankTask.id = this.data.maxId;
		blankTask.p = parent.id;
		blankTask.g = parent.g;
		this.data.tasksById[blankTask.id] = blankTask;
		if (!this.hasChild(parent)) {
			// subtask of 100%	
			blankTask.s = 100;
			parent.c = [blankTask];
		} else {
			//extra task, resize from 0
			parent.c.push(blankTask);
			this.updateS(blankTask.id, 100 / parent.c.length);
		}

		this.mouse.lastClicked = blankTask.id;
		this.buildTaskList();
		this.fillSidebar(blankTask.id);
		this.store({id: blankTask.id,type: 'add'});
	},

/* remove
 *
 * function
 *   - remove the current selected task afterconfirming
 *   - remove task based on its id (no confirmation)
 *
 * args
 * [id]		-	Id of the task that should be deleted
 * 				id none given, current selected task will be removed
 *
 */
	'remove': function(id) {
		if (typeof id == 'undefined') {
			var Dtask = this.data.tasksById[this.data.curTask];

			messageBox({
				title: 'Are you shure',
				html: 'You are about to delete \'' + Dtask.n + '\'  and all it\'s childs:<br>This action can <strong>not be undone</stong>',
				buttons: [{
					name: 'Delete',
					type: 'delete',
					act: function(that) {
						that.remove(Dtask.id);
					},
					arg: this
				},
				{
					name: 'Cancel',
					type: 'cancel'
				}]
			});

		} else {
			var task = this.data.tasksById[id],
			    parent = this.data.tasksById[task.p],
			    i;

			if (typeof parent == 'undefined') {
				log('ERR: could not remove , because base task');
				//TODO alert user
				return;
			}
			for (i in parent.c) {
				if (parent.c[i] == task) {
					this.updateS(task.id, 0);
					parent.c.splice(i, 1);
					break;
				}
			}
			this.mouse.lastClicked = parent.id;
			this.buildTaskList();
			this.fillSidebar(parent.id);
			this.store({id: id,type: "del"});
		}
	},

	/*
 * store
 *
 * function 
 *   store tasks in localstorage and makes a buffer to
 *   send to the server 
 * 
 * Args
 *  [ChangeData]: a obj {id: ...,type: ...}
 *                  where id is the ID of the task to change
 *                  and type is n,g,s,add or del
 *
 *          if omited only localstorage
 */
	'store': function(changeData) {
		localStorage.setObject('tasks' + (this.tasks.listId || 0), this.tasks);

		if (arguments.length === 0) {
			//only update the setObject tasks
			return;
		}

		if (typeof this.data.buffer[changeData.id] == "undefined") {
			this.data.buffer[changeData.id] = [changeData.type];
		} else {
			if ($.inArray(changeData.type, this.data.buffer[changeData.id]) == - 1) {
				this.data.buffer[changeData.id].push(changeData.type);
			}
		}

		localStorage.setObject('serverBuffer' + (this.tasks.listId || 0), this.data.buffer);

	},


/*
 * push 
 *
 * function
 * 		push buffer data to server
 *
 */

	'push': function() {
		if (this.tasks.online === false) {
			this.pushNew();
			return;
		}

		var buffer = this.data.buffer;
		var sender = {};
		for (i in buffer) {
			for (j in buffer[i]) {
				switch (buffer[i][j]) {
				case "del":
					sender["del|" + i] = 'y';
					break;
				case "add":
					sender["add|" + i] = this.data.tasksById[i].p;
					sender['n|' + i] = this.data.tasksById[i].n;
					sender['g|' + i] = this.data.tasksById[i].g;
					sender['s|' + i] = this.data.tasksById[i].s;
					break;
				case 'n':
					sender['n|' + i] = this.data.tasksById[i].n;
					break;
				case 'g':
					sender['g|' + i] = this.data.tasksById[i].g;
					break;
				case 's':
					sender['s|' + i] = this.data.tasksById[i].s;
					break;
				default:
					log('unexpected in buffer', buffer[i][j]);
					break;
				}
			}

		}

		var that = this;
		user.AJAX('list&listId=' + (this.tasks.listId || "null"), {
			data: sender
		},
		function(data, that) {
			if (data.succes === true) {
				that.data.buffer = {};
				localStorage.setObject('serverBuffer' + (that.tasks.listId || 0), that.data.buffer);
				that.tasks = data.list;
				that.data.tasksById = {
					0: that.tasks
				};
				that.inTasksId();
				that.buildTaskList();
				//TODO:visualize confiramtion
			} else {
				messageBox({
					title: 'Error',
					type: 'error',
					html: 'An error occured pushing data to server!<br><ul><li>' + data.warnings.join('<LI>') + '</ul>',
					buttons: [{
						name: 'Cancel',
						type: 'close'
					}],
					extra: data.requestedActions.join(" ")
				}

				);
			}
		},
		this);

	},

    
/*
 * pushNew 
 *
 * function
 * 		push a new list to the server
 *
 */
	'pushNew': function() {

		var that = this;
		user.AJAX("list&listId=null", {
			data: JSON.stringify(this.data.tasksById)
		},
		function(data, that) {
			if (data.succes === true) {
				that.data.buffer = {};

				//clear buffer and delete  ofline localstorage list
				localStorage.setObject('serverBuffer' + (that.tasks.listId || 0), that.data.buffer);
				localStorage.removeItem('tasks' + that.tasks.listId);
				log('removed', 'tasks' + that.tasks.listId);

				that.tasks = data.list;
				//srore the new list in localStorage
				that.store();

				that.data.tasksById = {
					0: that.tasks
				};
				that.inTasksId();
				that.buildTaskList();
			} else {
				messageBox({
					title: 'Error',
					type: 'error',
					html: 'An error occured while creating a new list!<br><ul><li>' + data.warnings.join('<LI>') + '</ul>',
					buttons: [{
						name: 'Cancel',
						type: 'close'
					}],
					extra: data.requestedActions.join(" ")
				}

				);
			}
		},
		that);

	},
    
    

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *                      end of task changing methods                         *
 *                                                                           *
 *                     start of HTML edits (sidebar)                         *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* fillSidebar
 *
 * function
 *   set the ranges an the inputs of the sidebar
 *
 * args
 *   taskId	-	task to edit
 */

	'fillSidebar': function(taskId) {
		this.data.curTask = taskId;
		this.mouse.lastClicked = taskId;
		
        $("#taskList .selected").removeClass('selected');
		$('#taskList span[data-id=' + taskId + ']').addClass('selected');

		var task = this.data.tasksById[taskId];
		$('#n').val(task.n);
		$('.s').val(Math.round(task.s)).attr('value', Math.round(task.s));
		$('.g').val(Math.round(task.g)).attr('value', Math.round(task.g));

		// you can't change the gain of a task that has childs
		var $completedEditor = $('#completedEditor'),
            $completedControls = $('input',$completedEditor);
        
        if (!this.hasChild(task)) {
			$completedEditor.removeClass('disabled');
            $completedControls.removeAttr('disabled');
		} else {
			$completedEditor.addClass('disabled');
            $completedControls.attr('disabled', 'disabled');
		}
        
		var $inportanceEditor = $('#inportanceEditor'),
            $inportanceControls = $('input',$inportanceEditor);
        
        //log(task.p != null ? this.data.tasksById[task.p].c.length:"baseTask");

        if( task.id > 0 && this.data.tasksById[task.p].c.length > 1 ){
            $inportanceEditor.removeClass('disabled');
            $inportanceControls.removeAttr('disabled');
		} else {
			$inportanceEditor.addClass('disabled');
            $inportanceControls.attr('disabled', 'disabled');
        }

	},

/*
 * buildTasksList
 *
 * function
 *   make the DOM elements for the tasklist
 *
 * args
 *   data	-	self-filled (parrent)
 */

	'buildTaskList': function(data) {
		var i;
		if (arguments.length === 0) {
			data = this.tasks;
		}

		if (!this.hasChild(data)) {
			return $('<LI></LI>').append(
			$('<span></span>').addClass(((this.mouse.lastClicked == data.id) ? 'selected': null)).attr({
				'data-id': data.id,
				'data-g': Math.round(data.g)
			}).text(data.n||"...").append(
			$('<input type=checkbox>').attr({
				'data-id': data.id,
				'checked': (data.g == 100 ? true: false)
			}).addClass('isDone')));
		} else {
			var $tList = $('<UL></UL>');
			for (i in data.c) {
				$tList.append(this.buildTaskList(data.c[i]));
			}
			$tList = $('<LI></LI>').append(
			$('<span></span>').addClass(((this.mouse.lastClicked == data.id) ? 'selected': null)).attr({
				'data-id': data.id,
				'data-g': Math.round(data.g)
			}).text(data.n||"...")).append($tList);

			if (arguments.length === 0) {
				$tList = $('<ul></ul>').append($tList);
				$('#taskList').empty().append($tList);
			}
			return $tList;

		}

	},

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *                       end of HTML edits                                   *
 *                                                                           *
 *                       start of drawing on canvas                          *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
 * drawPart (helper method)
 *
 * function
 *   the method that actualy draws the tasks on the canvas
 *
 *   args
 *     R	-	The maximum radius
 *     prevR-	The radius of the previous circle
 *     startP-	Degree to start drawing
 *     endP	-	Degree to stop drawing
 *     task	-	the task object that will be drawn
 */
	'drawPart': function(R, prevR, startP, endP, task) {

		var screen = this.data.screen,
		fillStyle = 'normal';

		this.ctx.beginPath();
		this.ctx.moveTo(screen.centerX, screen.centerY);
		this.ctx.arc(screen.centerX, screen.centerY, R, startP, endP, false);

		if (this.mouse.r > prevR && this.ctx.isPointInPath(this.mouse.x, this.mouse.y)) {
			fillStyle = 'hover';
			this.mouse.hover = task.id;
			this.mouse.isHovering = true;
		}

		if (this.mouse.lastClicked == task.id) {
			fillStyle += '_selected';
		}

		this.ctx.fillStyle = this.generateGradient(prevR, R, task.g, fillStyle, screen);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.stroke();
	},

/*
 * generateGradient (helper method)
 *
 * function
 *   return a gradient that fills a certain task for x%
 *	 with a color depending on the state
 *
 * args
 *  rMin	-	pervious radius
 *  rMax	-	max radius
 *  gain	-	the gain of the taskt where the gradient is for
 *  state	-	hover|normal|normal_selected|hover_selected
 *
 * return
 *  a radialGradient
 */
	'generateGradient': function(rMin, rMax, gain, state, screen) {
		var radgrad = this.ctx.createRadialGradient(
		screen.centerX, screen.centerY, rMin, screen.centerX, screen.centerY, rMax);
		gain = (gain < 100 ? gain: 100);
		// add a color stop at 'gain%'
		radgrad.addColorStop(gain / 100, this.data.colorScheme[state][0]);
		radgrad.addColorStop(gain / 100, this.data.colorScheme[state][1]);
		return radgrad;
	},

/*
 * drawCalc (helper Method)
 *
 * function
 *   calculate parameters for drawing the right size at the right spot
 *
 * args
 *   data	-	the task object
 *   startDeg	-	the start degree of the parts
 *   endDed		-	the endo of the parts
 *   subLvl		-	current depth
 *   screen		-	the this.data.screen obj
 * 
 */
	'drawCalc': function(data, startDeg, endDeg, subLvl, screen) {
		var curStart = startDeg,
		curEnd = endDeg;

		for (i in data.c) {
			var tasks = data.c[i],
			r,
			prevR;

			// TOTAL ANGLE SIZE * size%
			var angleSize = (endDeg - startDeg) * (tasks.s / 100);
			curEnd = curStart + angleSize;

			//calculate and draw childs first
			this.drawCalc(tasks, curStart, curEnd, subLvl + 1, screen);

			//calculate radius
			//TODO: mutch easier method
			if (subLvl - 1 >= screen.maxA) {
				prevR = ((subLvl - screen.maxA) * screen.sizeB) + (screen.maxA * screen.sizeA);
			} else {
				prevR = (subLvl) * screen.sizeA;
			}
			if (subLvl >= screen.maxA) {
				r = prevR + screen.sizeB;
			} else {
				r = prevR + screen.sizeA;
			}

			r += screen.sizeMiddle;
			prevR += screen.sizeMiddle;

			this.drawPart(r, prevR, curStart, curEnd, tasks);

			curStart = curEnd;

		}

	},

	/*
 * draw 
 *
 * function
 *   start drawing all tasks on the canvas by caling the helper func
 *   and draw the bas task circle
 *   
 *  arg
 *   data	-	data to print out
 *   			if 'AF' or none is supplied base will be done
 */

	'draw': function(data) {
		var i, 
            screen = this.data.screen;
        
        // default value for data
		data = ((arguments.length === 0 || data == "AF") ? this.tasks: data);

		var startDeg = this.display.startDeg,
		    endDeg = this.display.endDeg,
		    subLvl = 0;
		
        //clear canvas
        this.ctx.clearRect(0, 0, screen.canvasX, screen.canvasY, 1000);

		this.mouse.isHovering = false;

		this.drawCalc(data, startDeg, endDeg, subLvl, screen);

		// if mouse is not hovering set hover to base task
		if (this.mouse.isHovering === false) {
			this.mouse.hover = 0;
		}

		//draw center Bol
		var middleStatus = (this.mouse.r < screen.sizeMiddle ? 'hover': 'normal');
		/*jsl:ignore*/
		//== instead of === becouse lastClicked could be a string
		middleStatus += (this.mouse.lastClicked == 0 ? '_selected': '');
		/*jsl:end*/

		this.ctx.fillStyle = this.generateGradient(0, screen.sizeMiddle, data.g, middleStatus, screen);

		this.ctx.beginPath();
		this.ctx.arc(screen.centerX, screen.centerY, screen.sizeMiddle, this.display.startDeg, this.display.endDeg);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.stroke();
	},

/*
 * resize (called at resize)
 *
 * function
 *   recalculate scale and possition of
 *   the circle
 *
 * TODO
 *   figure out if scale and translate is a better option
 *
 */

	'resize': function() {
		var screen = this.data.screen;
		var $sideBar = $('#sideBar');
		switch (this.display.current) {
		case 'half':

			this.$canvas.attr('width', ($(window).width())).attr('height', $(window).height() - $sideBar.height());

			screen.canvasX = this.$canvas.attr('width');
			screen.canvasY = this.$canvas.attr('height');
			screen.centerX = Math.floor(screen.canvasX / 2);
			screen.centerY = Math.floor(screen.canvasY);
			break;
		case 'full':
			/*jsl:fallthru*/
		default:
			this.$canvas.attr('width', ($(window).width() - $sideBar.width()) - $('#taskList').width() - 5).attr('height', $(window).height() - $('header').height() - $('footer').height() - 5);

			screen.canvasX = this.$canvas.attr('width');
			screen.canvasY = this.$canvas.attr('height');
			screen.centerX = Math.floor(screen.canvasX / 2);
			screen.centerY = Math.floor(screen.canvasY / 2);
			break;

		}

		var ratio = (Math.min(screen.canvasX, screen.canvasY) / 500);
		screen.sizeA = this.data.screenD.sizeA * ratio;
		screen.sizeB = this.data.screenD.sizeB * ratio;
		screen.sizeMiddle = this.data.screenD.sizeMiddle * ratio;

		this.display.startDeg = this.display[this.display.current].startDeg;
		this.display.endDeg = this.display[this.display.current].endDeg;

		this.ctx.lineStyle = '#032349';
		this.ctx.lineWidth = 3;

		this.draw();
	},

	/* keyboardNav
 *
 * function
 *   navrigate using the keyboard
 * 
 * args
 *   what	-	what to do
 *				+lvlUp
 *				+lvlDown
 *				+turnCCW
 *				+turnCW
 *				+goHome
 *   
 */
	'keyboardNav': function(what) {
		var task = this.data.tasksById[this.data.curTask],
		curId = this.data.curTask,
		i,
		parrent;
		switch (what) {
		case 'lvlUp':
			if (this.hasChild(task)) {
				curId = task.c[0].id;
			}
			break;
		case 'lvlDown':
			if (typeof task.p == 'number') {
				curId = task.p;
			} else {
				curId = 0;
			}
			break;
		case 'turnCCW':
			if (typeof task.p == 'number') {
				parent = this.data.tasksById[task.p];
				for (i in parent.c) {
					if (parent.c[i] === task && i !== 0) {
						break;
					}
					curId = parent.c[i].id;
				}
			} else {
				curId = 0;
			}
			break;
		case 'turnCW':
			if (typeof task.p == 'number') {
				parent = this.data.tasksById[task.p];
				for (i in parent.c) {
					if (parent.c[i] == task) {
						var a = ((i * 1) + 1) % parent.c.length;
						curId = parent.c[a].id;
						break;
					}

				}

			} else {
				curId = 0;
			}
			break;
		case 'goHome':
			curId = 0;
			break;
		default:
			break;
		}
		this.mouse.lastClicked = curId;
		this.fillSidebar(curId);

	}

};

/*
 * messageBox (human interaction function)
 *
 * function 
 *     displays a box with text a title and buttons
 *
 * arguments
 *   data: object with:
 *      {title : "Message",
 *       type: 'normal',
 *       html: '',
 *       buttons: {...}
 *       extra= 'space seperated extra data-specialfunction'
 *
 *       buttons= array of: {
 *          name: "test",
 *          type: "data-btn-type arg",
 *          act: function(arg){},
 *          agr: 'agument for act'
 *
 *
 *       }
 */


function messageBox(data) {
	var $message = $('#message'),
	    $buttons = $('<div id="buttonContainer"></div>'),
        $buttonContainer = $('#buttonContainer');
	$message.attr('data-type', data.type || 'normal');
	$message.find('h1').html(data.title || 'Message');
	$message.find('#inMessage').html(data.html);

	if (typeof data.buttons == 'undefined') {
		data.buttons = [{
			name: 'ok',
			type: 'ok'
		}];
	}

	for (var btnId in data.buttons) {
		var btn = data.buttons[btnId];
		
        $('<button>').text(btn.name).click({btn: btn},
		            function(e) {
                    //try-catch to catch act not defined
                    try {
			        	e.data.btn.act(e.data.btn.arg);
			        } catch(e) {}
        		}).attr('data-type', btn.type).appendTo($buttons);
	}

	if (typeof data.extra == "string") {
		$message.attr('data-specialfunction', data.extra);
	} else {
		$message.attr('data-specialfunction', 'none');
	}

	$buttonContainer.replaceWith($buttons);
    //TODO a nicer way
    setTimeout(function(){ $('button',$buttons).first().focus();},1);
	$('#messageOverlay').addClass('show');
	$('#messageClose , #buttonContainer>button').click(function() {
		$('#messageOverlay').removeClass('show messageOnly');
	});
}


/*
 * oUser
 *
 * defaults
 */

function oUser() {
	this.id = 0;
	this.sid = 0;
	this.lists = 0;

	if (Modernizr.localstorage === true) {
		var userdata = localStorage.getObject('user');
		if (typeof(userdata) == "object" && userdata !== null) {
			$.extend(this, userdata);
		}
	}
}

/*
 * login
 *
 * function
 *   check login, get lists, save sid
 *
 */
oUser.prototype.login = function() {
	var that = this,
	userdata = {};

	$.post('ajax.php?action=login', $('#loginForm').serialize(), function(data) {
		if (data.user.logged === true) {
			userdata = data;
			that.lists = data.lists;
			that.logged = data.logged;
			$.extend(that, data.user);
	        messageBox({
	        	title: 'Login succesfull',
	         	html: 'You are logged in!'
	        });
		}else{
			messageBox({
				title: 'Login',
				extra: 'login',
				html: 'Username and password did not match please try again:',
				buttons: [{
					name: "cancel",
					type: "cancel"
				}]
			});
		}

		if (Modernizr.localstorage === true) {
			that.store();
		}
	},
	'json');

};

/*
 * showLogin
 *
 * function
 *   shows login screen
 *
 */

oUser.prototype.showLogin = function() {
	messageBox({
		title: 'Login',
		extra: 'login',
		html: 'To login please enter your username and password',
		buttons: [{
			name: "cansel",
			type: "cansel"
		}]
	});
};


/* 
 * listSwitch
 *
 *  function
 *    show listSwitsher and updates it with offline data
 */
oUser.prototype.listSwitch = function() {

	var offlineLists = [];
	// max ofline lists: 50
	for (i = - 1; i >= - 50; i--) {
		if (typeof(localStorage.getItem('tasks' + i)) == 'string' && localStorage.getItem('tasks' + i).length > 10) {
			offlineLists.push(localStorage.getObject('tasks' + i));
		}
	}

	listSwitcherHTML = $.map(user.lists, function(item, i) {
		return '<LI data-listId="' + item.id + '">' + item.name + "</LI>";
	}).join("");

	listSwitcherHTML += $.map(offlineLists, function(item, i) {
		return '<LI data-listId="' + item.listId + '" class="offline">' + item.n + "()</LI>";
	}).join("");

	listSwitcherHTML += '<LI data-listId="new" class="new">New List</LI>';

	$('#listSwitcher').html(listSwitcherHTML);
	messageBox({
		title: 'Change list',
		html: 'Please selsect one of the folowing lists:<UL>',
		buttons: [{
			name: "cancel",
			type: "cansel"
		}],
		extra: 'listSwitcher'
	});
};


/*
 * openList
 *
 * function
 *  starts a list (and creates it if not eexists)
 *
 * arguments
 *  listId - listid (omitit: last from localstorage)
 */
oUser.prototype.openList = function(listId) {
	var ilistId = parseInt(listId, 10);
	if (!isNaN(ilistId)) {
		this.currentList = ilistId;
	}

	if (typeof this.currentList == 'number' && listId != 'new') {
		this.list = new spotonTasks("canvas", this.currentList);
		this.store();
	} else {
		//unrecognized curretlist or givenlist or request for new
		this.list = new spotonTasks("canvas");
	}

	this.store();
	this.list.buildTaskList();
	this.AF();
	log(this.list);
};

/*
 * store
 *
 * function
 *   save the users data in localstorage
 *
 */
oUser.prototype.store = function() {
	localStorage.setObject('user', {
		currentList: user.currentList,
		id: user.id,
		lists: user.lists,
		logged: user.logged,
		name: user.name,
		sid: user.sid
	});
};

/*
 * AF
 *
 * stat animation frame for current list
 *
 */
oUser.prototype.AF = function() {
	window.requestAnimFrame(user.AF, user.list.ctx.canvas);
	user.list.draw('AF');

};

/*
 *  AJAX (prototype)
 *  a function to connect to server
 *
 *  arguments:
 *   action:    the 'action='... part may contain '&listID'
 *   data:      data to be posted to server
 *   callback(data,that): callback function
 *   that: the 'that' argument send to the function
 *
 *  Why:
 *   To fetch userdata as it comes in, and send sessionId (DRI DIE)
 */

oUser.prototype.AJAX = function(action, data, callback, that) {
	var obj = that;
	$.post('ajax.php?action=' + action, $.extend(data, {
		uSid: this.sid || null,
		uId: this.id
	}), function(d) {
		if (user.logged === true) {
			$.extend(user, d.user);
		}

		callback(d, obj);
	},
	'JSON');
};

/******************************************************************************
* Bindings for clicks and stuff                                                                            
******************************************************************************/
$(function() {

    //resizer
	$(window).resize(function(e) {
		user.list.resize();
	});
   

    // Keyboard navrigation
	$(document.documentElement).keyup(function(e) {
      switch(true){
        // Dont do things on an input
          case  (e.target.nodeName.toLowerCase() == 'input'):
              log("input");
			switch (e.keyCode) {
				case 27://esc
					$("input").blur();
					break;
				default:
					break;
				}
        break;
        // If a message box is displayed
        case $('#messageOverlay').hasClass('show'):
			switch (e.keyCode) {
				case 27://esc
		            $('#messageOverlay').removeClass('show messageOnly');
					break;
				case 37:	// Arrow left
					if(e.target.nodeName.toLowerCase() == 'button'){
                        setTimeout(function(){$(e.target).prev('button').focus();},1);
                    }
                    break;
				case 39:	// Arrow right
					if(e.target.nodeName.toLowerCase() == 'button'){
					    setTimeout(function(){$(e.target).next('button').focus();},1);
                    }
                    break;
				default:
					break;
				}
        break;
        // standard Keyboard interaction
        default:
            switch ((e.shiftKey ? "+": "-") + e.keyCode) {
				case '-46': // del
				case '+46': // shift + del
					user.list.remove();
					break;
				case '-45':	// ins
					user.list.add('neighbour');
					break;
				case '+45':	// shift + ins
					user.list.add('child');
					break;
				case '-38':	// Arrow Up
					user.list.keyboardNav('turnCCW');
					break;
				case '-40':	// Arrow Down
					user.list.keyboardNav('turnCW');
					break;
				case '-33':	//pageUp
				case '-37':	// Arrow left
					user.list.keyboardNav('lvlDown');
					break;
				case '-34':	// Page Down
				case '-39':	// Arrow right
					user.list.keyboardNav('lvlUp');
					break;
				case '-36': //home
					user.list.keyboardNav('goHome');
					break;
				case '-68':	// d
					//TODO: direct G not better?
                    $('.isDone[data-id=' + user.list.data.curTask + ']').click();
					break;
				case '-67':	//c
				case '-71':	//g
					$('.g[type=range]').focus();
					break;
				case '-83':	//s
					$('.s[type=range]').focus();
					break;
				case '-78':	//n
					$('#n').select().focus();
					break;
				default:
					break;
                }
            break;
		    }
        });

    // mouse on <canvas> navrigation
	user.list.$canvas.mousemove(function(e) {
			var screen = user.list.data.screen,
			boundingRect = user.list.ctx.canvas.getBoundingClientRect();
			user.list.mouse.x = e.clientX - boundingRect.left;
			user.list.mouse.y = e.clientY - boundingRect.top;
			user.list.mouse.r = Math.sqrt(
			Math.pow((screen.centerX - e.pageX), 2) + Math.pow((screen.centerY - e.pageY), 2));
		}).click(	function(e) {
			user.list.mouse.lastClicked = user.list.mouse.hover;
			user.list.fillSidebar(user.list.mouse.lastClicked);
		});


    $('#loginForm').submit(
	function(e) {
		e.preventDefault();
		user.login();
	});

	$('#listSwitcher > li').live('click', function() {
		newId = $(this).attr('data-listId');
		user.openList(newId);
	});

	//enable mouse interaction
	$("#taskList li span").live('click', function(e) {
		user.list.fillSidebar($(this).attr('data-id'));
	});

	$(".isDone").live('change', function(e) {
		var id = $(this).attr('data-id');
		user.list.updateG(id, ($(this).is(':checked') ? 100: 0));
		user.list.store({type: 'g',	id: id});
	});

	//handle updates
	$('#n,.s,.g').bind("keyup change keydown", {
		o: this
	},
	function(e) {
		user.list.updateValue($(this).val(), $(this).attr('class'));
	});

	//handle edits
	$('#removeTask').click({
		o: this
	},
	function(e) {
		user.list.remove();
	});
	$('#addNeighbour').click({
		o: this
	},
	function(e) {
		user.list.add("neighbour");
	});
	$('#addChild').click({
		o: this
	},
	function(e) {
		user.list.add("child");
	});

});

// crossbrowser rquestAnimation frame
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(
	/* function */
	callback,
	/* DOMElement */
	element) {
		window.setTimeout(callback, 1000 / 60);

	};
})();

// store objects in localstorage with great ease
Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
	return JSON.parse(this.getItem(key));
};

// must be called user for animation frame
var user = new oUser();
user.openList();

// verry bad things to get the CSS attr(value) working for the rages
$(".g,.s").change(function() {
	var a = $(this).val();
	$("." + this.className).attr('value', a);
});

