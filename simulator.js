const s_canvas = document.getElementById('s-canvas');
const sctx = s_canvas.getContext("2d");

// (state, cursor pos);
let config = ["START", 0];

let accepted = 0;
let rejected = 0;

let tape = [];
let rules = new Map();

let PERIOD = 500;

function parseRules(x) {
	rules.clear();

	//get rid of the first + last bracket
	x = x.slice(1, -1);

	//eliminate [ (it's redundant for splitting)
	x = x.replaceAll("[", "");
	let xs = x.split("]");

	for (const y of xs) {
		if(y == "") break;

		let inout = y.split("|");

		if(inout.length < 2) {
			alert('Machine Encoding incorrectly formatted');
			return 1;
		}

		rules.set(  inout[0], inout[1] );
	}

	return 0;
}


sctx.textAlign = "center";
sctx.textBaseline = "middle";

let transX = 0;

let s_t0 = 0;
let s_operate = 0;
let s_update = 0;
let head_h = 0;

let reset_head = 0;

//set up button
const s_begin = document.getElementById('s-begin');
const m_form = document.getElementById('m-form');
const i_form = document.getElementById('i-form');
const s_form = document.getElementById('s-form');
s_begin.onclick = function() {

	if( !parseRules(m_form.value) ) {

		s_update = 1;	
		s_operate = 1;
		s_t0 = performance.now();

		accepted = 0;
		rejected = 0;
		config = ["START", 0];

		reset_head = 1;

		tape = [];
		for(let i = 0; i < i_form.value.length; ++i) tape.push(i_form.value.charAt(i) );

		PERIOD = 1000 / s_form.value;

	}
};

function s_draw(timestamp) {

	if(reset_head) s_t0 = performance.now();

	let t = (timestamp - s_t0);
	if(t > PERIOD) {
		s_t0 = timestamp;
		t = (timestamp - s_t0);
	}

	// ------------------ updating
	if( !reset_head && s_operate && s_update && t < PERIOD / 4) {

		while(config[1] >= tape.length) tape.push('_');
		let k = config[0] + "*" + tape[config[1]];

		if( rules.has(k) ) {
			let v = rules.get( k  ).split("*");

			tape[  config[1] ] =  v[1];

			config[0] = v[0];
			
			if(  v[2] == "1" ) config[1] ++;
			else config[1] --;

			if(  config[0] == "ACCEPT" ) {
				accepted = 1;
				s_operate = 0;
			}
		} else {
			rejected = 1;
			s_operate = 0;
		}

		s_update = 0;
	}


	// ------------------ drawing
	sctx.resetTransform();
	sctx.clearRect(0, 0, 800, 600);


	if( reset_head || (t > PERIOD / 2 && !accepted && !rejected)) {

		if( PERIOD < 200 ) {
			transX = 50 * config[1];
			reset_head = 0;
		} else {
			transX += (50 * config[1] - transX) * 0.4;
			if( Math.abs(transX - config[1] * 50) < 1) {
				transX = config[1] * 50;
				reset_head = 0;
			}
		}
	}

	sctx.translate(-transX, 0);

	//draw tape alphabet
	sctx.fillStyle = "black";
	sctx.font = "24px sans-serif";
	for(let i = Math.max(0, Math.floor( (transX - 225) / 50)); 100 + 50 * i < transX + 850; i ++) {

		sctx.fillText( (i >= tape.length)? "_" : tape[i], 200 + i * 50, 200 + 25);

		sctx.beginPath();
		sctx.moveTo(  175 + (i + 1) * 50, 200);
		sctx.lineTo( 175 + (i + 1) * 50, 250);
		sctx.stroke();
	}

	//draw tape outline
	sctx.strokeRect(  Math.max(175, transX - 10), 200, 800 + 20, 50  );

	//draw start triangle
	sctx.beginPath();
	sctx.moveTo(163, 225);
	sctx.lineTo(145, 212);
	sctx.lineTo(145, 238);
	sctx.lineTo(163, 225);
	sctx.stroke();

	//draw turing head
	sctx.resetTransform();
	sctx.fillStyle = "#DCDCDC";

	sctx.beginPath();
	//body
	sctx.moveTo(150, 100);
	sctx.lineTo(250, 100);
	sctx.lineTo(250, 175);
	sctx.lineTo(235, 200);
	sctx.lineTo(235, 260);
	sctx.lineTo(165, 260);
	sctx.lineTo(165, 200);
	sctx.lineTo(150, 175);
	sctx.closePath();
	//hole
	sctx.moveTo(175, 200);
	sctx.lineTo(175, 250);
	sctx.lineTo(225, 250);
	sctx.lineTo(225, 200);
	sctx.closePath();
	//draw
	sctx.fill();
	sctx.stroke();

	//draw bumps
	sctx.fillStyle = (accepted)? "#75FF42" : "#6F8F6A";
	sctx.beginPath();
	sctx.arc(175, 100, 20, Math.PI, 0);
	sctx.closePath();
	sctx.fill();
	sctx.stroke();

	sctx.fillStyle = (rejected)? "#FF0000" : "#8F6A6A";
	sctx.beginPath();
	sctx.arc(225, 100, 20, Math.PI, 0);
	sctx.closePath();
	sctx.fill();
	sctx.stroke();

	sctx.font = "18px sans-serif";
	sctx.fillStyle = "black";
	sctx.translate(175, 150);
	sctx.rotate(-Math.PI/2);
	sctx.fillText("ACCEPT", 0, 0);

	sctx.resetTransform();
	sctx.translate(225, 150);
	sctx.rotate(-Math.PI/2);
	sctx.fillText("REJECT", 0, 0);

	//draw the slide that overwrites
	sctx.resetTransform();
	sctx.fillStyle = "rgba(220, 220, 220, 1)";


	if(!reset_head && s_operate) {

		if( t < PERIOD / 4) {
			head_h += (50 - head_h) * 0.8;
		} else if(t < PERIOD / 2) {
			head_h += (0 - head_h) * 0.6;
		} else {
			s_update = 1;
		}

		if(PERIOD > 200) sctx.fillRect(175, 200, 50, head_h);
	}

	requestAnimationFrame(s_draw);
}


s_draw();
