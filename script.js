 
	var STAGE_WIDTH = 900;
	var STAGE_HEIGHT = 600;
	
	var RADIUS = 110; //110
	
	var RADIUS_SCALE = 1;
	var RADIUS_SCALE_MIN = 1;
	var RADIUS_SCALE_MAX = 15; //1.5
	
	// The number of particles that are used to generate trails
	var QUANTITY = 3;

	var particles, baseCanvas, baseCtx, hGrid, hGridCtx, vGrid, vGridCtx;
	
	var mouseX = (window.innerWidth - STAGE_WIDTH);
	var mouseY = (window.innerHeight - STAGE_HEIGHT);
	var mouseIsDown = false;

	//edge fade vars
	var lastX, lastY;
	var edgeFade = 0.2; // 0 - 1, 0.1 = lots of edge fade, 1 = no edge fade.
	var w = 10;
	var radius = w/2;

	//grid shifting - these are used in mouseMove and loop.
	var degX, radX, degY, radY;
	var fgSpacer = 0; // foreground spacing between lines (X & Y)
	var bgSpacer = 0; // background spacing between lines (X & Y
	var scaleFactor = 10; // the current zoom level.
	var fgXShift = 0; //foreground grid x-axis shift amount per frame.
	var bgXShift = 0; //background grid x-axis shift amount per frame.
	var fgYShift = 0; //foreground grid y-axis shift amount per frame.
	var bgYShift = 0; //background grid y-axis shift amount per frame.
	
	var allowPanning = true;
	var allowZooming = false;
	var allowParticles = false;
	var allowPen = false;
	var allowBackGrid = true;
	var allowFrontGrid = true;
	var txt = ""; //the text used to label lines.
	var currentRow =0;
	var currentCol =0;
	var baseDirty = false;
	var backForceDraw = false;
	var occupiedCells = [];
	var activeCells =[];
	var colSet = [];
	var rowSet =[];
	var fgHLines = []; //foreground Horizontal Lines
	var fgVLines = []; //foreground Verical Lines
	var bgHLines = []; //background Horizontal Lines
	var bgVLines = []; //background vertical Lines
	var gridTile = new Image();
	//gridTile.src = '../../_/images/gridTile.png';
	gridTile.src = 'elements/grass.png';
	var currCol = function(o) {
	    for (var i = 0; i < fgVLines.length; i++) {
	        if (fgVLines[i].val === o) return i;
	    }
	    return -1;
	}
	var currRow = function(o) {
	    for (var i = 0; i < fgHLines.length; i++) {
	    	////console.log (i + ") " + fgHLines[i].val + " <--- " + o + " ?");
	        if (fgHLines[i].val === o) return i;
	    }
	    return -1;
	}


$(document).ready(function() {
	$('canvas').addClass('canvasAway');
	// make #canvas listen for mousewheel events
	$('#logo').hover(function() {
		$('#logoImage').attr({src: '../../_/images/tronText.gif'});
	});
	document.getElementById("audio-player").volume = 0;
	//$('#hGrid1').hide();
	//$('#vGrid1').hide();
	$('.checkOptions').change(function(event) {
		//console.log ($(this).attr('id') + ": " + $(this).prop('checked'));
		if ($(this).attr('id') === "particles") allowParticles = $(this).prop('checked');
		if ($(this).attr('id') === "pen") allowPen = $(this).prop('checked');
		if ($(this).attr('id') === "backGrid") {
			allowBackGrid = $(this).prop('checked');
			createLines();
		} 
	});

	$('#canvasText').fadeIn(2000);

	$('#hGrid1').mousewheel(function(event) {
	    //scale the canvas...
	    if (allowZooming) {
	    	
	    	scaleFactor += (event.deltaY * -0.1);
	    	//console.log ("*" + scaleFactor);
	    	if (scaleFactor < 0.01) scaleFactor = 0.01; //prevent this from reaching zero!
	    	backForceDraw = true; // force a redraw in function loop().
	    }

	    return false //prevent default (page scroll)
	});

	$("#slider").slider({
		//orientation: "horizontal",
	    value : 0,
	    step  : 1,
	    range : 'min',
	    min   : 0,
	    max   : 100,
	    slide : function(){
	        var value = $("#slider").slider("value");
	        document.getElementById("audio-player").volume = value / 100;
	        //console.log ($("#audio-player").attr('volume').value);
			//console.log ("slider value = " + value + ", volume: " + document.getElementById("audio-player").volume);
	    }
	});

	init();
});

function init() {

	hGrid = document.getElementById('hGrid1');
	vGrid = document.getElementById('vGrid1');
	baseCanvas = document.getElementById('world');
	
	if (hGrid && hGrid.getContext && baseCanvas && baseCanvas.getContext) {
		hGridCtx = hGrid.getContext('2d');
		vGridCtx = vGrid.getContext('2d');
		baseCtx = baseCanvas.getContext('2d');		

		// Register event listeners
		document.addEventListener('mousemove', documentMouseMoveHandler, false); //false denotes bubbling scope.
		document.addEventListener('mousedown', documentMouseDownHandler, false);
		document.addEventListener('mouseup', documentMouseUpHandler, false);
		hGrid.addEventListener('touchstart', canvasTouchStartHandler, false);
		hGrid.addEventListener('touchmove', canvasTouchMoveHandler, false);
		window.addEventListener('resize', windowResizeHandler, false);
		
		createParticles();
		windowResizeHandler();
		createLines();
		
		setInterval( loop, 1000 / 60 );
	} else alert ("Couldn't find canvas Grid and canvas World.");
}

function createParticles() {

	particles = [];
	
	for (var i = 0; i < QUANTITY; i++) {
		var particle = {
			position: { x: mouseX, y: mouseY },
			shift: { x: mouseX, y: mouseY },
			size: 1,
			angle: 0,
			speed: 0.01+Math.random()*0.04,
			targetSize: 1,
			fillColor: '#' + (Math.random() * 0x404040 + 0xaaaaaa | 0).toString(16),
			orbit: RADIUS*.5 + (RADIUS * .5 * Math.random())
		};
		
		particles.push( particle );
	}
}
function createLines() {

	fgSpacer = hGrid.height / scaleFactor; //10 default
	bgSpacer = hGrid.height / (scaleFactor*3); //default 30

	for (var idxH=0; idxH*fgSpacer-fgSpacer/2 < hGrid.height + fgSpacer ; idxH++) { //idxH*step-step/2 < hGrid.height + step
		
		var hline = {
			//this (and the other three) places the 'expansion point' at 0,0. It needs to be on the center point of the canvas.
			y: fgSpacer*idxH-fgSpacer/2,
			//y: (hGrid.height - (hGrid.height + fgSpacer*2)) / 2,
			x: hGrid.width,
			val: idxH
		};
		fgHLines.push (hline);
		if (idxH === 0) console.log ("fgHLines[" + idxH + "].y : " + fgHLines[idxH].y);
	}
	////console.log ("----------------------------------------");

	for (var idxH=0; idxH*bgSpacer-bgSpacer/2 < hGrid.height + bgSpacer ; idxH++) { //idxH*step-step/2 < hGrid.height + step
		var hline = {
			y: bgSpacer*idxH-bgSpacer/2, //this anchors zooming at 0,0
			x: hGrid.width,
			val: idxH
		};
		bgHLines.push (hline);
		////console.log ("bgHLines[" + idxH + "].y : " + bgHLines[idxH].y);
	}
	////console.log ("----------------------------------------");

	for (var idxV=0; idxV*fgSpacer-fgSpacer/2 < vGrid.width + fgSpacer ; idxV++) {
		var vline = {
			x: fgSpacer*idxV-fgSpacer/2,
			//x: (vGrid.height - (fgSpacer * scaleFactor + 2))  / 2 + (fgSpacer*idxV),
			//x: (hGrid.width - (hGrid.width + fgSpacer*2)) / 2 + (fgSpacer*idxH-fgSpacer/2),
			y: vGrid.height,
			val: idxV
		};		
		fgVLines.push(vline);
		////console.log ("fgVLines[" + idxV + "].x : " + fgVLines[idxV].x);
	}
	////console.log ("----------------------------------------");
	
	for (var idxV=0; idxV*bgSpacer-bgSpacer/2 < vGrid.width + bgSpacer ; idxV++) {
		var vline = {
			x: bgSpacer*idxV-bgSpacer/2,
			// x: (vGrid.height - (bgSpacer * scaleFactor + 2))  / 2 + (bgSpacer*idxV),
			y: vGrid.height,
			val: idxH
		};		
		bgVLines.push(vline);
		////console.log ("bgVLines[" + idxV + "].x : " + bgVLines[idxV].x);
		
	}
	////console.log ("----------------------------------------");
	loop();
}

function documentMouseMoveHandler(event) {

	mouseX = event.clientX - (window.innerWidth - STAGE_WIDTH) * .5;
	mouseY = event.clientY - (window.innerHeight - STAGE_HEIGHT) * .5;

	// I need the X and Y to be between -1, 0 , +1 (cosine of 180 will give me this). Express x (0-STAGE_WIDTH) as 180-0 =
	if (mouseX > 0 && mouseX < STAGE_WIDTH && mouseY > 0 && mouseY < STAGE_HEIGHT) {
		degX = (mouseX / STAGE_WIDTH) * 180; //works
		degY = (mouseY / STAGE_HEIGHT) * 180; //works
		
		radX = degX * (Math.PI/180); //works
		radY = degY * (Math.PI/180); //works

		fgXShift = Math.round(Math.cos(radX) * 10); //works. 10 (10 * 100 = 1000) is the grid 'speed' multiplier
		fgYShift = Math.round(Math.cos(radY) * 10);

		bgXShift = Math.round(Math.cos(radX) * 6);  //works. 6 (6 * 100 = 600) is the grid 'speed' multiplier
		bgYShift = Math.round(Math.cos(radY) * 6);
		
		//which row and column is the mouse in?
		fgVLines.sort(function(a, b){
	 		return a.x-b.x
		})
		fgHLines.sort(function(a, b){
	 		return a.y-b.y
		})
		
		currentCol = Math.floor((mouseX - 5.5 - fgVLines[0].x) / fgSpacer); // -5.5 is the tip of the mouse pointer (x).
		currentRow = Math.floor((mouseY - 5.5 - fgHLines[0].y) / fgSpacer); // -5.5 is the tip of the mouse pointer (y).
	}

    if(mouseIsDown & allowPen){
        // the distance the mouse has moved since last mousemove event
        var dis = Math.sqrt(Math.pow(lastX-mouseX, 2)+Math.pow(lastY-mouseY, 2));
        
        // for each pixel distance, draw a circle on the line connecting the two points
        // to get a continous line.
        for (i=0; i<dis; i+=1) {
            var s = i/dis;
            draw(lastX*s + mouseX*(1-s), lastY*s + mouseY*(1-s), w, 255, 255, 255, edgeFade);
        }
	    lastX = mouseX;
	    lastY = mouseY;        
    };

}

function documentMouseDownHandler(event) {
	//mouseIsDown = true;
	$('#canvasText').fadeOut(2000);
	
	//if ($('canvas').hasClass('canvasHome')) $('canvas').removeClass('canvasHome').removeClass('canvasAway')
	//else $('canvas').addClass('canvasHome');
	$('canvas').addClass('canvasHome');
	lastX = event.clientX - (window.innerWidth - STAGE_WIDTH) * .5;
	lastY = event.clientY - (window.innerHeight - STAGE_HEIGHT) * .5;
	if (lastX <= STAGE_WIDTH && lastX >= 0 && lastY<= STAGE_HEIGHT && lastY >= 0) {
		mouseIsDown = true;
	}

    if (allowPen) draw(lastX, lastY,w,100,100,100, 0.5);	
	// $('#hGrid1').fadeTo(2000, 1);
	// $('#vGrid1').fadeTo(2000, 1);
}

function documentMouseUpHandler(event) {
	mouseIsDown = false;

	//$('#hGrid1').fadeTo(2000, 0.5); //works, but is called continuously even if element is at 0.5;
	//$('#vGrid1').fadeTo(2000, 0.5);
}

function canvasTouchStartHandler(event) {
	if(event.touches.length == 1) {
		event.preventDefault();

		mouseX = event.touches[0].pageX - (window.innerWidth - STAGE_WIDTH) * .5;
		mouseY = event.touches[0].pageY - (window.innerHeight - STAGE_HEIGHT) * .5;
	}
}

function canvasTouchMoveHandler(event) {
	if(event.touches.length == 1) {
		event.preventDefault();

		mouseX = event.touches[0].pageX - (window.innerWidth - STAGE_WIDTH) * .5;
		mouseY = event.touches[0].pageY - (window.innerHeight - STAGE_HEIGHT) * .5;
	}
}

function windowResizeHandler() {
	//STAGE_WIDTH = window.innerWidth - 60;
	//STAGE_HEIGHT = window.innerHeight - 60;
	
	vGrid.width = STAGE_WIDTH;
	vGrid.height = STAGE_HEIGHT;
	
	vGrid.style.position = 'absolute';
	vGrid.style.left = (window.innerWidth - STAGE_WIDTH) * .5 + 'px';
	vGrid.style.top =  (window.innerHeight - STAGE_HEIGHT) * .5 + 'px';

	// --------------------------------------------------------------------------

	hGrid.width = STAGE_WIDTH;
	hGrid.height = STAGE_HEIGHT;
	
	hGrid.style.position = 'absolute';
	hGrid.style.left = (window.innerWidth - STAGE_WIDTH) * .5 + 'px';
	hGrid.style.top = (window.innerHeight - STAGE_HEIGHT) * .5 + 'px';

	// --------------------------------------------------------------------------

	baseCanvas.width = STAGE_WIDTH;
	baseCanvas.height = STAGE_HEIGHT;
	
	baseCanvas.style.position = 'absolute';
	baseCanvas.style.left = (window.innerWidth - STAGE_WIDTH) * .5 + 'px';
	baseCanvas.style.top = (window.innerHeight - STAGE_HEIGHT) * .5 + 'px';
	
	// --------------------------------------------------------------------------
	
	canvasText.style.position = 'absolute';
	canvasText.style.left = (window.innerWidth - STAGE_WIDTH) * .5 + (STAGE_WIDTH-500)/2 + 'px';
	canvasText.style.top = (window.innerHeight - STAGE_HEIGHT) * .5 + (STAGE_HEIGHT-82)/2 + 'px';	
	
	// --------------------------------------------------------------------------

	logo.style.position = 'absolute';
	logo.style.left = (window.innerWidth - STAGE_WIDTH) * .5 + 'px';
}

function draw(x,y,w,r,g,b,a){
    var gradient = baseCtx.createRadialGradient(x, y, 0, x, y, w);
    gradient.addColorStop(0, 'rgba('+r+', '+g+', '+b+', '+a+')');
    gradient.addColorStop(1, 'rgba('+r+', '+g+', '+b+', 0)');
    
    baseCtx.beginPath();
    baseCtx.arc(x, y, w, 0, 2 * Math.PI);
    baseCtx.fillStyle = gradient;
    baseCtx.fill();
    baseCtx.closePath();
};

function loop() {
	var arrayString;
	if (allowParticles) {	//sort out the particles
		if( mouseIsDown ) {
			// Scale upward to the max scale
			RADIUS_SCALE += ( RADIUS_SCALE_MAX - RADIUS_SCALE ) * (0.01); //0.02
		} else {
			// Scale downward to the min scale
			RADIUS_SCALE -= ( RADIUS_SCALE - RADIUS_SCALE_MIN ) * (0.01); //0.02
		}
				
		RADIUS_SCALE = Math.min( RADIUS_SCALE, RADIUS_SCALE_MAX );
		//if (RADIUS_SCALE === RADIUS_SCALE_MAX) allowParticles = false;
				
		//sort out the particles
		for (i = 0, len = particles.length; i < len; i++) {
			var particle = particles[i];
			
			var lp = { x: particle.position.x, y: particle.position.y };
			
			// Offset the angle to keep the spin going
			particle.angle += particle.speed;
			
			// Follow mouse with some lag
			particle.shift.x += ( mouseX - particle.shift.x) * (particle.speed);
			particle.shift.y += ( mouseY - particle.shift.y) * (particle.speed);
			
			// Apply position
			particle.position.x = particle.shift.x + Math.cos(i + particle.angle) * (particle.orbit*RADIUS_SCALE);
			particle.position.y = particle.shift.y + Math.sin(i + particle.angle) * (particle.orbit*RADIUS_SCALE);
			
			// Limit to screen bounds
			particle.position.x = Math.max( Math.min( particle.position.x, STAGE_WIDTH + 100 ), -100 ); //+/- 100 to extend past edges
			particle.position.y = Math.max( Math.min( particle.position.y, STAGE_HEIGHT + 100), -100 );
			
			particle.size += ( particle.targetSize - particle.size ) * 0.05;
			
			// If we're at the target size, set a new one. Think of it like a regular day at work.
			if( Math.round( particle.size ) == Math.round( particle.targetSize ) ) {
				particle.targetSize = 1 + Math.random() * 7;
			}
			
			baseCtx.beginPath();
			baseCtx.fillStyle = particle.fillColor;
			baseCtx.strokeStyle = particle.fillColor;
			baseCtx.lineWidth = particle.size;
			baseCtx.moveTo(lp.x, lp.y);
			baseCtx.lineTo(particle.position.x, particle.position.y);
			baseCtx.stroke();
			baseCtx.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
			baseCtx.fill();
		}

	}

	if (!mouseIsDown) {
		// Fade out the highlighted cells slowly by drawing a rectangle over the entire canvas
		baseCtx.fillStyle = 'rgba(0,0,0,0.05)';
		baseCtx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
		baseCtx.fill();
		baseCtx.beginPath(); // <--- IMPORTANT NOTE: take away this line and the screen fades away, as expected, but they ALL come back. Something profound going on with stoke() ???
		baseCtx.stroke();
		baseDirty = true;

		//highlight the cell under the mouse...
		baseCtx.lineWidth=0;
	    baseCtx.fillStyle="rgba(0,200,200,.8)";
	    baseCtx.rect(fgVLines[currentCol].x + 3, fgHLines[currentRow].y + 3, fgSpacer - 6, fgSpacer - 6); //original (50,50,100,50)
	    baseCtx.fill();
	
		//add some text to the square.
		baseCtx.font="14px Arial";
		baseCtx.fillStyle="black";//"rgba(0,200,200,.5)";
		txt = fgVLines[currentCol].val + ", " + fgHLines[currentRow].val;
		baseCtx.textBaseline="middle";
		baseCtx.fillText(txt, fgVLines[currentCol].x + (fgSpacer/2) - (baseCtx.measureText(txt).width / 2), fgHLines[currentRow].y + fgSpacer/2);
	}

	//Sort out the grids
	if (mouseIsDown || backForceDraw) {
		if (backForceDraw) {
			fgXShift = 0; //foreground grid x-axis shift amount per frame.
			bgXShift = 0; //background grid x-axis shift amount per frame.
			fgYShift = 0; //foreground grid y-axis shift amount per frame.
			bgYShift = 0; //background grid y-axis shift amount per frame.
			backForceDraw = false;
		}
		if (baseDirty) { 
			//clear the base canvas 1 time, per mouse down, to wipe any highlighted cells.
			baseCtx.fillStyle = 'rgba(0,0,0,1)';
			baseCtx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
			baseCtx.fill();

			//...and store the current cell (will also happen 1 time per mouse down, not each loop.)
			if (myIndexOf({x: fgVLines[currentCol].val, y:fgHLines[currentRow].val}) === -1) {
				occupiedCells.push({x:fgVLines[currentCol].val, y:fgHLines[currentRow].val});
				activeCells.push({x:fgVLines[currentCol].val, y:fgHLines[currentRow].val});
			} else {
				//alert ("Already stored.");
				occupiedCells.splice(myIndexOf({x:fgVLines[currentCol].val, y:fgHLines[currentRow].val}),1);
				activeCells.splice(myIndexOf({x:fgVLines[currentCol].val, y:fgHLines[currentRow].val},"activeCells"),1);
			}
			////console.log (occupiedCells);
			baseDirty = false; //prevent coming back here until next mouseIsDown.
		}
		// gridActivated = true;
	
		//clear the grids
		vGridCtx.clearRect(0,0,vGrid.width,vGrid.height);
		hGridCtx.clearRect(0,0,hGrid.width,hGrid.height);

		vGridCtx.beginPath();
		hGridCtx.beginPath();
		vGridCtx.font="8px Arial";
		vGridCtx.fillStyle="white";
		vGridCtx.textBaseline="middle";
		hGridCtx.font="8px Arial";
		hGridCtx.fillStyle="white";
		hGridCtx.textBaseline="middle";		
		vGridCtx.lineWidth=2;
		hGridCtx.lineWidth=2;
		vGridCtx.strokeStyle = "rgba(0,200,200,.5)";
		hGridCtx.strokeStyle = "rgba(0,200,200,.5)";
		
		var entering, leaving;

		for (i=0;i<fgVLines.length;i++) {
			fgVLines[i].x += fgXShift;
			txt=fgVLines[i].val;
			vGridCtx.fillText(txt, fgVLines[i].x - (vGridCtx.measureText(txt).width / 2), 20);
			if (fgVLines[i].x >= STAGE_WIDTH + fgSpacer) {
				fgVLines[i].x -= STAGE_WIDTH + fgSpacer*2;
				leaving = fgVLines[i].val;
				fgVLines[i].val -= STAGE_WIDTH / fgSpacer + 2;
				entering = fgVLines[i].val;
				//col change - check the occupiedCells array for arriving/leaving guests...
				updateActiveCells("cols", entering, leaving);

			} else if (fgVLines[i].x <= fgSpacer * -1.5) {
				fgVLines[i].x += STAGE_WIDTH + fgSpacer*2;
				leaving = fgVLines[i].val;
				fgVLines[i].val += STAGE_WIDTH / fgSpacer + 2;
				entering = fgVLines[i].val;
				//col change - check the occupiedCells array for arriving/leaving guests...
				updateActiveCells("cols", entering, leaving);
			}

			vGridCtx.moveTo(fgVLines[i].x,0);
			vGridCtx.lineTo(fgVLines[i].x, fgVLines[i].y);

			if (typeof fgHLines[i] != "undefined") {
				fgHLines[i].y += fgYShift;
				txt=fgHLines[i].val;
				hGridCtx.fillText(txt, 20, fgHLines[i].y, 20);
				if (fgHLines[i].y >= STAGE_HEIGHT + fgSpacer) {
					fgHLines[i].y -= STAGE_HEIGHT + fgSpacer*2;
					leaving = fgHLines[i].val;
					fgHLines[i].val -= STAGE_HEIGHT / fgSpacer + 2;
					entering = fgHLines[i].val;
					//row change - check the occupiedCells array for arriving/leaving guests...
					updateActiveCells("rows", entering, leaving);

				} else if (fgHLines[i].y <= fgSpacer * -1.5) {
					fgHLines[i].y += STAGE_HEIGHT + fgSpacer*2;
					leaving = fgHLines[i].val;
					fgHLines[i].val += STAGE_HEIGHT / fgSpacer + 2;
					entering = fgHLines[i].val;
					//row change - check the activeCells array for arriving/leaving guests...
					updateActiveCells("rows", entering, leaving);
				}

				hGridCtx.moveTo(0,fgHLines[i].y);
				hGridCtx.lineTo(fgHLines[i].x, fgHLines[i].y);
			}
		}
		if(allowFrontGrid) {
			vGridCtx.stroke();
			hGridCtx.stroke();
		}


		if (allowBackGrid) {
			vGridCtx.beginPath();
			hGridCtx.beginPath();
			vGridCtx.lineWidth=1;
			hGridCtx.lineWidth=1;
			vGridCtx.strokeStyle = "rgba(0,200,200,.2)";
			hGridCtx.strokeStyle = "rgba(0,200,200,.2)";		

			for (i=0;i<bgVLines.length;i++) {
				bgVLines[i].x += bgXShift;	
				if (bgVLines[i].x >= STAGE_WIDTH + bgSpacer) bgVLines[i].x -= STAGE_WIDTH + bgSpacer*2;
				else if (bgVLines[i].x <= bgSpacer * -1.5) bgVLines[i].x += STAGE_WIDTH + bgSpacer * 2;
				vGridCtx.moveTo(bgVLines[i].x,0);
				vGridCtx.lineTo(bgVLines[i].x, bgVLines[i].y);
				if (typeof bgHLines[i] != "undefined") {
					bgHLines[i].y += bgYShift;	
					if (bgHLines[i].y >= STAGE_HEIGHT + bgSpacer) bgHLines[i].y -= STAGE_HEIGHT + bgSpacer*2;
					else if (bgHLines[i].y <= bgSpacer * -1.5) bgHLines[i].y += STAGE_HEIGHT + bgSpacer * 2;
					hGridCtx.moveTo(0,bgHLines[i].y);
					hGridCtx.lineTo(bgHLines[i].x, bgHLines[i].y);
				} // else //console.log ("Caught an undefined safely.");		
			}
			vGridCtx.stroke();
			hGridCtx.stroke();
		}
		//draw all the activeCells squares (from the array activeCells) here (AFTER lines have been redrawn)...
		var col, row;
		for (idx = 0; idx<activeCells.length;idx++) {
			col = currCol(activeCells[idx].x);
			row = currRow(activeCells[idx].y);
			
			if (col === -1 || row === -1) {
				//console.log ("Problem in loop.");
			} else {
				vGridCtx.drawImage(gridTile,fgVLines[col].x+3,fgHLines[row].y+3);
			}
		}		
	}
}
function myIndexOf(o,b) {
    if (typeof b === "undefined") {
	    for (var i = 0; i < occupiedCells.length; i++) {
	        if (occupiedCells[i].x == o.x && occupiedCells[i].y == o.y) return i;
	    }
	    return -1;
	}else if (b === "activeCells") {
	    for (var i = 0; i < activeCells.length; i++) {
	        if (activeCells[i].x == o.x && activeCells[i].y == o.y) return i;
	    }
	    return -1;
	} else if (b === "x"){
		colSet.length = 0; //empty the array
		for (var i = 0; i < occupiedCells.length; i++) {
	        if (occupiedCells[i].x == o.x) colSet.push({x: occupiedCells[i].x, y: occupiedCells[i].y});
	    }
	    if (colSet.length === 0) return -1;
	    else return 1;
	} else if (b === "y") { //b = "y"
		rowSet.length = 0; //empty the array
		for (var i = 0; i < occupiedCells.length; i++) {
	        if (occupiedCells[i].y == o.y) rowSet.push({x: occupiedCells[i].x, y: occupiedCells[i].y});
	    }
	    if (rowSet.length === 0) return -1;
	    else return 1;
	} else alert ("Invalid 'b' passed to function myIndexOf().")
}
function updateActiveCells(type, entering, leaving) {
	var itm;
	if (type === "cols") {
		if (myIndexOf({x: entering},"x") != -1) {
			for (idx = 0; idx < colSet.length;idx++) {
				activeCells.push({x: colSet[idx].x, y: colSet[idx].y});
			}
		}
		if (myIndexOf({x: leaving},"x") != -1) {
			for (idx = 0; idx < colSet.length;idx++) {
				itm = myIndexOf({x: colSet[idx].x, y: colSet[idx].y },"activeCells");
				if (itm != -1) activeCells.splice(itm,1);
			}
		}
	} else {
		if (myIndexOf({y: entering},"y") != -1) {
			for (idx = 0; idx < rowSet.length;idx++) {
				activeCells.push({x: rowSet[idx].x, y: rowSet[idx].y});
			}
		}
		if (myIndexOf({y: leaving},"y") != -1) {
			for (idx = 0; idx < rowSet.length;idx++) {
				itm = myIndexOf({x: rowSet[idx].x, y: rowSet[idx].y },"activeCells");
				if (itm != -1) activeCells.splice(itm,1);
			}
		}
	}
}
