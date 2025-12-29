const options = document.querySelectorAll( ".activity-option"  );

//all elements for designer
const designers = document.querySelectorAll('.designer');

//all elements for simulator
const simulators = document.querySelectorAll('.simulator');

//all buttons
const dbutton = document.getElementById('d-button');
const sbutton = document.getElementById('s-button');

//choose dbutton
sbutton.classList.add('chosen');

//hide simulators at start
designers.forEach(  (thing) => {  thing.classList.add('hidden') } );

options.forEach(   (opt) => {

	opt.addEventListener( "mousedown", (e) => {
		options.forEach(  (other) => {  other.classList.remove("chosen");  }   );
		opt.classList.add("chosen");

		if(  opt.id == 'd-button' ) {
			designers.forEach( (x) => { x.classList.remove('hidden'); }  );
			simulators.forEach( (x) => { x.classList.add('hidden'); }  );

		} else if(opt.id == 's-button') {
			designers.forEach( (x) => { x.classList.add('hidden'); }  );
			simulators.forEach( (x) => { x.classList.remove('hidden'); }  );

		} else if(opt.id == 'a-button') {

		}
	});
});
