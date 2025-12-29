const d_canvas = document.getElementById('d-canvas');
const dctx = d_canvas.getContext("2d");

//for clipboard button
let clipt0 = -501;

//vertices
let vertexPos = [];
let vertexLabel = [];
let vertexType = [];

//edges
let edgeAnchor = [];
let edgeLabel = [];
let edgeType = [];
let edgeCenter = [];
let edgeOrient = [];

//caret
let caretVisible = 0;
let caretID = 0;

//selection
let select = ["none", -1];
let selectAnchor = -1;
let offset = [-1, -1];

//remember mouse
let mouseX = -1;
let mouseY = -1;

//key stuff
let shift = 0;
let allowedLetters = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUWXYZ1234567890`~!@#$%^&*()-_+={}|[]\\;':\",./<>?";

function getMousePos(e) {

	let rect = d_canvas.getBoundingClientRect();

	mouseX = (e.clientX - rect.left) / (rect.right - rect.left) * d_canvas.width;
	mouseY = (e.clientY - rect.top) / (rect.bottom - rect.top) * d_canvas.height;
}

d_canvas.addEventListener("dblclick", (e) => {

	getMousePos(e);

	let i = findVertex( mouseX, mouseY );

	if( i == -1) {
		vertexPos.push(  [mouseX, mouseY]  );
		vertexLabel.push(  "" );
		vertexType.push( 0  );
	} else {
		vertexType[  i  ] = ( ++vertexType[i] ) & 3;
	}

	requestAnimationFrame(d_draw);
});


d_canvas.addEventListener("mousedown", (e) => {

	getMousePos(e);
	
	if(caretID) clearInterval( caretID );
	caretID = 0;

	select = ["none", -1];

	if(  e.button == 0) {
	
		let i = findVertex(  mouseX,  mouseY);
		if(i != -1) {
			//set anchor
			if(  shift  ) {
				selectAnchor = i;

			//select new vertex
			} else {

				caretID = setInterval( () => {
						caretVisible = !caretVisible;
						requestAnimationFrame(d_draw);
						}, 500);

				select = ["vertex", i];
				offset = [mouseX - vertexPos[i][0], mouseY - vertexPos[i][1]];
			}

			requestAnimationFrame(d_draw);
			return;
		}

		i = findEdge(mouseX, mouseY);
		if(i != -1 && !shift) {
			select = ["edge", i];
			
			caretID = setInterval( () => {
					caretVisible = !caretVisible;
					requestAnimationFrame(d_draw);
					}, 500);
			requestAnimationFrame(d_draw);
			return;
		}

		if(mouseX > 763 && mouseX < 770 + 17 && mouseY > 17 && mouseY < 49) {
			                
			navigator.clipboard.writeText( getMachine()  );

			clipt0 = performance.now();
			setTimeout( draw, 150);
		}
	}

	requestAnimationFrame(d_draw);
});

d_canvas.addEventListener("mouseup", (e) => {

	getMousePos(e);
	
	if(  selectAnchor != -1) {
		let i = findVertex(  mouseX , mouseY );

		if(i == selectAnchor) {

			let dirX = (mouseX - vertexPos[  selectAnchor  ][0] );
			let dirY = (mouseY - vertexPos[  selectAnchor  ][1] );

			let d = Math.sqrt(dirX * dirX + dirY * dirY );

			edgeAnchor.push( [i, i] );
			edgeCenter.push( [ dirX / d, dirY / d  ] );
			edgeType.push("curved");
			edgeOrient.push( 0 );
			edgeLabel.push("");

		} else if(i != -1 && i != selectAnchor  ) {
			edgeAnchor.push( [selectAnchor, i] );
			edgeCenter.push([ -1  , -1  ]);
			edgeType.push("straight");
			edgeOrient.push( 0 );
			edgeLabel.push( "" );
		} 
		
		selectAnchor = -1;
	}

});

d_canvas.addEventListener("mousemove", (e) => {

	getMousePos(e);

	if(  e.buttons != 0) {
		if( select[0] == "vertex"  ) {
			
			vertexPos[select[1]] = [mouseX - offset[0], mouseY - offset[1]];

		} else if(select[0] == "edge" ) {
			let anch1 = edgeAnchor[select[1]][0];
			let anch2 = edgeAnchor[select[1]][1];

			if( anch1 == anch2 ) {

				let dirX = mouseX - vertexPos[  anch1  ][0];
				let dirY = mouseY - vertexPos[  anch1  ][1];

				let d = Math.sqrt( dirX * dirX + dirY * dirY );

				edgeCenter[ select[1]] = [dirX / d, dirY / d];

			} else {

				let res = circleFrom3Points( [mouseX, mouseY],
						vertexPos[ anch1 ],
						vertexPos[ anch2 ] );

				let x0 = vertexPos[ anch1 ][0];
				let y0 = vertexPos[ anch1 ][1];

				let x1 = vertexPos[ anch2 ][0];
				let y1 = vertexPos[ anch2 ][1];

				let d2 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);

				//get parallel component
				let c0 = ((x1 - x0) * (res[0][0] - x0) + (y1 - y0) * (res[0][1] - y0)) / d2;

				//get perpendicular component for x
				let perp = ( (res[0][0] - x0) * (y0 - y1) + (res[0][1] - y0) * (x1 - x0) )
					/ Math.sqrt(d2);

				edgeCenter[select[1]] = [ c0, perp ];

				edgeOrient[ select[1] ] = ( (x1 - x0) * (mouseY - y0)
							- (y1 - y0) * (mouseX - x0) ) > 0;

				edgeType[select[1]] = (Math.abs(perp) > 500)? "straight" : "curved";
			}
		}
	}

	requestAnimationFrame(d_draw);
});

d_canvas.addEventListener("keydown", (e) => {

	e.preventDefault();

	shift = e.shiftKey;

	if(  select[0] == "vertex"  ) {
		
		if(e.key == "Delete") {

			vertexPos.splice(  select[1], 1);
			vertexLabel.splice( select[1], 1);
			vertexType.splice(  select[1], 1);

			select = ["none", -1];

			if(caretID) clearInterval(caretID);
			caretID = 0;

		} else if( vertexType[  select[1] ] == 0) {
			if(e.key == "Backspace") {

				vertexLabel[  select[1]  ] = vertexLabel[  select[1]  ].slice(0, -1);

			} else if( allowedLetters.indexOf(e.key) != -1) {
				vertexLabel[ select[1]  ] += e.key;
			}
		}
	}

	else if( select[0] == "edge" ) {

		if(e.key == "Delete") {

			edgeAnchor.splice(  select[1], 1);
			edgeLabel.splice(  select[1], 1);
			edgeType.splice(  select[1], 1);
			edgeCenter.splice( select[1], 1);
			edgeOrient.splice( select[1], 1);

			select = ["none", -1];

			if(caretID) clearInterval(caretID);
			caretID = 0;

		} else if(e.key == "Backspace") {

			edgeLabel[  select[1]  ] = edgeLabel[  select[1]  ].slice(0, -1);

		} else if( allowedLetters.indexOf(e.key) != -1) {
			edgeLabel[ select[1]  ] += e.key;
		}
	}

	requestAnimationFrame(d_draw);
});

d_canvas.addEventListener("keyup", (e) => {

	shift = e.shiftKey;

});

function findVertex(x, y) {
	for(let i = 0; i < vertexPos.length; ++i) {
		let oX = x - vertexPos[i][0];
		let oY = y - vertexPos[i][1];

		if(  oX * oX + oY * oY <= 900) return i;
	}
	return -1;
}

function findEdge(x, y) {
	
	for(let i = 0; i < edgeAnchor.length; ++i) {

		let vx1 = vertexPos[ edgeAnchor[i][0] ][0];
		let vy1 = vertexPos[ edgeAnchor[i][0] ][1];
		let vx2 = vertexPos[ edgeAnchor[i][1] ][0];
		let vy2 = vertexPos[ edgeAnchor[i][1] ][1];

		if( edgeType[i] == "straight" ) {
			let dx = x - vx1;
			let dy = y - vy1;

			let lx = vx2 - vx1;
			let ly = vy2 - vy1;

			//perp comp
			let dsquared = (dx * ly - dy * lx) * (dx * ly - dy * lx) / (lx * lx + ly * ly);

			//par comp
			let par = (dx * lx + dy * ly) / (lx * lx + ly * ly);

			if( dsquared < 25 && Math.abs(par) <= 1) return i;

		} else if( edgeAnchor[i][0] != edgeAnchor[i][1] ) {
			let res = getCircleFromComponents(  i  );

			let d = Math.sqrt((x - res[0]) * (x - res[0]) + (y - res[1]) * (y - res[1] ) );

			let o = (vx2 - vx1) * (y - vy1) - (vy2 - vy1) * (x - vx1) > 0;

			if(d < res[2] + 5 && d > res[2] - 5  && o == edgeOrient[i] ) {
				return i;
			}

		} else {
			let cx = vx1 + 40 * edgeCenter[i][0];
			let cy = vy1 + 40 * edgeCenter[i][1];

			let d = Math.sqrt(  (x - cx) * (x - cx) + (y - cy) * (y - cy) );

			if( d < 25 + 5 && d > 25 - 5) return i;
		}
	}

	return -1;
}

function circleFrom3Points(a, b, c) {
	let bis0x = (a[0] + b[0])/2;
	let bis0y = (a[1] + b[1])/2;
	let m0 = -(a[0] - b[0]) / (a[1] - b[1]);

	let bis1x = (b[0] + c[0])/2;
	let bis1y = (b[1] + c[1])/2;
	let m1 = -(b[0] - c[0]) / (b[1] - c[1]);

	let det = (m0 * -1) - (-1 * m1);

	let c0 = 1/det * (-1 * (m0 * bis0x - bis0y) + 1 * (m1 * bis1x - bis1y) );
	let c1 = 1/det * (-m1 * (m0 * bis0x - bis0y) + m0 * (m1 * bis1x - bis1y) );

	let r = Math.sqrt( (a[0] - c0) * (a[0] - c0) + (a[1] - c1) * (a[1] - c1) );

	return [ [c0, c1], r];
};

function getCircleFromComponents( i ) {

	let anch1 = edgeAnchor[i][0];
	let anch2 = edgeAnchor[i][1];

	let x0 = vertexPos[anch1][0];
	let y0 = vertexPos[anch1][1];

	let x1 = vertexPos[anch2][0];
	let y1 = vertexPos[anch2][1];

	let d = Math.sqrt( (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) );

	//parallel
	let p0 = edgeCenter[i][0] * (x1 - x0);
	let p1 = edgeCenter[i][0] * (y1 - y0);

	//perpendicular
	let p00 = edgeCenter[i][1] * (y0 - y1) / d;
	let p11 = edgeCenter[i][1] * (x1 - x0) / d;

	p0 += p00;
	p1 += p11;

	p0 += x0;
	p1 += y0;

	let r = Math.sqrt((x0 - p0) * (x0 - p0) + (y0 - p1) * (y0 - p1));

	return [p0, p1, r];
}

function drawArrow( a, b, flip) {

	let centD = Math.sqrt( (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) );

	let transX0 = (  a[2] * a[2] - b[2] * b[2] + centD * centD ) / (2 * centD) ;
	let transY0 = Math.sqrt(  a[2] * a[2] - transX0 * transX0 ) * (flip? -1 : 1);

	let transX1 = (  (a[2] + 10)  *  (a[2] + 10) - b[2] * b[2] + centD * centD) / (2 * centD );
	let transY1 = Math.sqrt( (a[2] + 10) * (a[2] + 10) - transX1 * transX1 ) * (flip? -1 : 1);

	let arrX0 = a[0] + transX0 * (b[0] - a[0]) / centD + transY0 * (a[1] - b[1]) / centD;
	let arrY0 = a[1] + transX0 * (b[1] - a[1]) / centD + transY0 * (b[0] - a[0]) / centD;

	let arrX1 = a[0] + transX1 * (b[0] - a[0]) / centD + transY1 * (a[1] - b[1]) / centD;
	let arrY1 = a[1] + transX1 * (b[1] - a[1]) / centD + transY1 * (b[0] - a[0]) / centD;

	let arrD = Math.sqrt( (arrX1 - arrX0) * (arrX1 - arrX0)
			+ (arrY0 - arrY1) * (arrY0 - arrY1) );

	let cornX0 = arrX0 + 15 * (arrX1 - arrX0) / arrD + 7 * (arrY0 - arrY1) / arrD;
	let cornY0 = arrY0 + 15 * (arrY1 - arrY0) / arrD + 7 * (arrX1 - arrX0) / arrD;

	let cornX1 = arrX0 + 15 * (arrX1 - arrX0) / arrD - 7 * (arrY0 - arrY1) / arrD;
	let cornY1 = arrY0 + 15 * (arrY1 - arrY0) / arrD - 7 * (arrX1 - arrX0) / arrD;

	dctx.beginPath();
	dctx.moveTo( arrX0, arrY0);
	dctx.lineTo( cornX0, cornY0);
	dctx.lineTo( cornX1, cornY1 );
	dctx.fill();
}

function drawCaret( text, textX, textY ) {

	if( !caretVisible ) return;

	let labelMeasure = dctx.measureText(  text  );

	let r = labelMeasure.actualBoundingBoxRight;
	let u = labelMeasure.fontBoundingBoxAscent;
	let d = labelMeasure.fontBoundingBoxDescent;

	dctx.strokeStyle = "blue";
	dctx.beginPath();
	dctx.moveTo(textX + r + 2, textY - u);
	dctx.lineTo(textX + r + 2, textY + d);
	dctx.stroke();
}

function d_draw(timestamp) {

	dctx.clearRect(0, 0, 800, 600);

	//-------------- draw select edge
	dctx.strokeStyle = "black";
	dctx.fillStyle = "black";

	let potAnchor = findVertex( mouseX, mouseY );
	if(  selectAnchor != -1 && potAnchor != selectAnchor) {
		//start x, y
		let sx = vertexPos[ selectAnchor][0];
		let sy = vertexPos[ selectAnchor][1];

		//destination x, y
		let destX = mouseX; 
		let destY = mouseY;

		//check if vertex
		if(  potAnchor != -1) {

			let vx0 = vertexPos[potAnchor][0];
			let vy0 = vertexPos[potAnchor][1];

			let d = Math.sqrt( (vx0 - sx) * (vx0 - sx) + (vy0 - sy) * (vy0 - sy) );

			destX = vx0 + 30 * (sx - vx0) / d;
			destY = vy0 + 30 * (sy - vy0) / d;
		}

		dctx.beginPath();
		dctx.moveTo(  sx, sy);
		dctx.lineTo(  destX, destY );
		dctx.stroke();

		//draw straight arrow
		let d = Math.sqrt( (sx - destX) * (sx - destX) + (sy - destY) * (sy - destY) );

		let cornX0 = destX + 15 * (sx - destX) / d + 7 * (destY - sy) / d;
		let cornY0 = destY + 15 * (sy - destY) / d + 7 * (sx - destX) / d;

		let cornX1 = destX + 15 * (sx - destX) / d - 7 * (destY - sy) / d;
		let cornY1 = destY + 15 * (sy - destY) / d - 7 * (sx - destX) / d;

		dctx.beginPath();
		dctx.moveTo( destX, destY );
		dctx.lineTo( cornX0, cornY0 );
		dctx.lineTo( cornX1, cornY1 );
		dctx.fill();
	} else if(selectAnchor != -1) {
		let cx = vertexPos[selectAnchor][0];
		let cy = vertexPos[selectAnchor][1];

		let dirX = (mouseX - cx);
		let dirY = (mouseY - cy);

		let d = Math.sqrt( dirX * dirX + dirY * dirY);

		dirX /= d;
		dirY /= d;

		let destX = cx + 40 * dirX;
		let destY = cy + 40 * dirY;

		dctx.beginPath();
		dctx.arc(  destX, destY, 25, 0, 2 * Math.PI);
		dctx.stroke();

		//arrow
		drawArrow(  [cx, cy, 30], [destX, destY, 25], 0);
	}

	//-------------- - - -- - - - draw edges
	for(let i = 0; i < edgeAnchor.length; ++i) {

		let x0 = vertexPos[  edgeAnchor[i][0]  ][0];
		let y0 = vertexPos[  edgeAnchor[i][0]  ][1];

		let x1 = vertexPos[  edgeAnchor[i][1]  ][0];
		let y1 = vertexPos[  edgeAnchor[i][1]  ][1];

		if(edgeType[i] == "straight") {
			dctx.strokeStyle = (select[0] == "edge" && select[1] == i)? "blue" : "black";

			dctx.beginPath();
			dctx.moveTo( x0, y0);
			dctx.lineTo( x1, y1);
			dctx.stroke();

			let d = Math.sqrt( (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1) );

			let textX = (x0 + x1)/2 + (20 * (y0 - y1) / d) * (edgeOrient[i]? 1 : -1);
			let textY = (y0 + y1)/2 + (20 * (x1 - x0) / d) * (edgeOrient[i]? 1 : -1);

			dctx.fillStyle = "black";
			dctx.fillText(  edgeLabel[i], textX, textY );

			//arrow (circ has rad 30, arrow has len 15, width 20)
			let cornX0 = x1 + (15 + 30)  * (x0 - x1) / d + 7 * (y1 - y0) / d;
			let cornY0 = y1 + (15 + 30)  * (y0 - y1) / d + 7 * (x0 - x1) / d;

			let cornX1 = x1 + (15 + 30)  * (x0 - x1) / d - 7 * (y1 - y0) / d;
			let cornY1 = y1 + (15 + 30)  * (y0 - y1) / d - 7 * (x0 - x1) / d;

			dctx.beginPath();
			dctx.moveTo( x1 + 30 * (x0 - x1) / d, y1 + 30 * (y0 - y1) / d);
			dctx.lineTo( cornX0, cornY0);
			dctx.lineTo( cornX1, cornY1);
			dctx.fill();

			if( select[0] == "edge" && select[1] == i) {
				drawCaret(  edgeLabel[i], textX, textY);
			}

		} else if(  edgeAnchor[i][0] != edgeAnchor[i][1]) {
			dctx.strokeStyle = (select[0] == "edge" && select[1] == i)? "blue" : "black";

			res = getCircleFromComponents( i );

			let angle1 = Math.atan2( 1 * (y0 - res[1]), x0 - res[0]  );
			if(angle1 < 0) angle1 += 2 * Math.PI;

			let angle2 = Math.atan2( 1 * (y1 - res[1]), x1 - res[0]  );
			if(angle2 < 0) angle2 += 2 * Math.PI;

			let angle3 = (angle1 + angle2)/2;
			if( edgeOrient[i] && (angle1 < angle3 && angle3 < angle2) ) angle3 += Math.PI;
			else if( !edgeOrient[i] && (angle2 < angle3 && angle3 < angle1) ) angle3 += Math.PI;

			//arrow
			dctx.beginPath();
			dctx.arc( res[0], res[1], res[2], angle1, angle2, edgeOrient[i] );
			dctx.stroke();

			//arrow head
			drawArrow( [ x1, y1, 30  ], [res[0], res[1], res[2]], edgeOrient[i] );

			//text
			let textX = (res[2] + 15) * Math.cos(angle3) + res[0];
			let textY = (res[2] + 15) * Math.sin(angle3) + res[1];

			dctx.fillStyle = "black";
			dctx.fillText(  edgeLabel[i], textX, textY );

			if(  select[0] == "edge" && select[1] == i) {
				drawCaret(  edgeLabel[i], textX,  textY  );
			}

		} else {
			dctx.strokeStyle = (select[0] == "edge" && select[1] == i)? "blue" : "black";

			let cx = vertexPos[edgeAnchor[i][0]][0];
			let cy = vertexPos[edgeAnchor[i][0]][1];

			let destX = 40 * edgeCenter[i][0] + cx;
			let destY = 40 * edgeCenter[i][1] + cy;

			dctx.beginPath();
			dctx.arc(  destX, destY, 25, 0, 2 * Math.PI);
			dctx.stroke();

			//draw arrow
			drawArrow(  [ cx, cy, 30], [ destX, destY, 25], 0);

			//draw text
			let textX = cx + (40 + 25 + 15) * edgeCenter[i][0];
			let textY = cy + (40 + 25 + 15) * edgeCenter[i][1];

			dctx.fillStyle = "black";
			dctx.fillText(  edgeLabel[i], textX, textY );

			if(select[0] == "edge" && select[1] == i) {
				drawCaret(  edgeLabel[i], textX,  textY  );
			}
		}
	}

	//---------------------- draw vertices
	dctx.textAlign = "center";
	dctx.textBaseline = "middle";

	for(let i = 0; i < vertexPos.length; ++i) {

		dctx.font = (vertexType[i] == 0) ? "20px serif" : "12px serif";

		if(   vertexType[i] == 0) {
			dctx.strokeStyle = (select[0] == "vertex" && select[1] == i)? "blue" : "black";
		} else if(  vertexType[i] == 1 ) {
			dctx.strokeStyle = "black";
		} else if(  vertexType[i] == 2) {
			dctx.strokeStyle = "green";
		} else if(  vertexType[i] == 3) {
			dctx.strokeStyle = "red";
		}

		dctx.beginPath();
		dctx.arc( vertexPos[i][0], vertexPos[i][1], 30, 0, 2*Math.PI );
		dctx.fillStyle = "white";
		dctx.fill();
		dctx.stroke();

		if(  vertexType[i] > 1 ) {
			dctx.beginPath();
			dctx.arc( vertexPos[i][0], vertexPos[i][1], 25, 0, 2*Math.PI );
			dctx.fillStyle = "white";
			dctx.fill();
			dctx.stroke();
		}

		dctx.fillStyle = "black";

		let texts = [  vertexLabel[i], "START", "ACCEPT", "REJECT" ];

		dctx.fillText(  texts[ vertexType[i]  ], vertexPos[i][0], vertexPos[i][1] );
	}
	dctx.font = "20px serif";

	//draw caret for vertices
	if(  select[0] == "vertex" && vertexType[select[1]] == 0 ) {
		drawCaret( vertexLabel[ select[1] ], vertexPos[ select[1] ][0], vertexPos[ select[1] ][1]);
	}

	// ----------- CLIPBOARD
	dctx.strokeStyle = "black";
	if(mouseX > 763 && mouseX < 770 + 17 && mouseY > 17 && mouseY < 49) dctx.strokeStyle = "gray";

	//if(  timestamp - clipt0 < 150 ) dctx.strokeStyle = "green";

	dctx.beginPath();
	dctx.roundRect(770, 10, 17, 22, 3);
	dctx.stroke();

	dctx.beginPath();
	dctx.roundRect(763, 17, 17, 22, 3);
	dctx.stroke();

}



// GET TURING MACHINE

//encoding works as list of states

//[  [P*A|Q*B*D]    ]

function getMachine() {

	let encoding = "[";

	for( let i = 0; i < edgeAnchor.length; ++i) {

		let trans = edgeLabel[i].split(";");

		for(let j = 0; j < trans.length; ++j) {

			let rule = "[";

			let anch1 = edgeAnchor[i][0];
			let anch2 = edgeAnchor[i][1];

			let strs = [ vertexLabel[anch1], "START", "na", "na" ];
			if( vertexType[anch1] > 1 ) {
				alert("HALT states must have out-degree 0");
				return "";
			}
			rule += strs[ vertexType[anch1] ] + "*";

			trans[j] = trans[j].replace(" ", "");
			let pred = trans[j].split("/");
			if( pred.length != 2) {
				alert("Edge '" + edgeLabel[i] + "' formatted wrong");
				return "";
			}
			rule += pred[0] + "|";

			strs = [  vertexLabel[anch2], "START", "ACCEPT", "REJECT" ];
			rule += strs[ vertexType[anch2] ] + "*";
			rule += pred[1].substring(0, 1) + "*";

			rule += trans[j].slice(-1);
			//rule += (trans[j].slice(-1) == "+")? "1" : "0" ;

			rule += "]";

			encoding += rule;
		}
	}

	encoding += "]";

	return encoding;
}
