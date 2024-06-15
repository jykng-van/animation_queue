import anime from 'animejs';

export default class Animation{
	animatedRegions = {}; //scroll regions for animations
	specialAnimations = {}; //collections of special animations: SVG attribute changes and the Pie Reveal animation

	observer = null; //observer class for the scrolling triggers

	animatedElements = {}; //elements (by selectors) and their scripted animations
	initializedElements = []; //elements that were changed on Start
	animationStep =  0; //current animation step number
	animationDelay = 0; //culumative animation delay with each step

	animationDone = false; //if the animation is done or not


	constructor(){
		console.log('Animation class constructed');
	}
	async Prepare(animations, initialState, container, scrollarea=null){
		//get regions
		if(this.observer != null){
			this.observer.disconnect();
		}
		this.animatedRegions = {};
		animations.forEach(r=>{
			let start_obj = {
				animationStep:0,
				animationDelay:0,
			};

			if (r.trigger){
				console.log(r);
				this.animatedRegions[r.trigger] = Object.assign(start_obj, r);
			}else{
				this.animatedRegions.default = Object.assign(start_obj, r);
			}
		});

		console.log('prepareAnimation!!');
		console.log(this.animatedRegions);
		await this.Start(initialState);

		let target = document.querySelector(scrollarea);
		console.log(target);

		console.log(this.animatedRegions.default!==null, Object.entries(this.animatedRegions).length===1);
		if (this.animatedRegions.default!==null && Object.entries(this.animatedRegions).length===1){
			console.log('default animation!');
			this.Animate('default');
		}else{
			console.log('Not default', Object.keys(this.animatedRegions));
			let opt = {
				root: document.querySelector(container),
				threshold: Array.from({length:21},(x,i)=>i/20),
			};
			let regions = [];
			this.observer = new IntersectionObserver(
				(entries)=>{
					entries.forEach(e=>{
						if (e.isIntersecting){
							let target = regions.find(n=>n.el === e.target);

							if (!target.triggered && e.intersectionRatio >= target.threshold){
								console.log('observer entry', e.intersectionRatio, target.selector, target.threshold);

								console.log(`${target.selector} threshold start animation!`);
								this.Animate(target.selector);
								target.triggered = true;
							}
						}
					});

				},
				opt
			);


			Object.entries(this.animatedRegions).forEach(([k,val])=>{
				console.log(k, val);
				if (k !== 'default'){
					let entry = document.querySelector(k);
					regions.push({
						el:entry,
						selector:k,
						threshold:val.threshold,
						triggered:false
					});

					this.observer.observe(entry);
				}

			});
			console.log(this.animatedRegions);
			console.log(regions);

		}

	}
	async Start(initialState){
		this.animationDone = false;

		this.clearStyles(); //clear the styles and restart animatedElements

		console.log('Start!');

		console.log(initialState);
		for (let n in initialState) { //for each grouping of initialized Elements
			let element = initialState[n];
			let selector = element.selector;
			let selected = Array.from(document.querySelectorAll(selector)); //all elements selected
			console.log(selected);

			let start_styles = element.style.trim().split(/;\s?/);
			for (let s of start_styles) { //for each starting style of the elements
				if (!s) continue;
				let [style_prop, style_val] = s.split(/:\s?/);
				style_prop = style_prop.toLowerCase();
				console.log(style_prop, style_val);
				for (let el of selected) { //each selected element
					console.log(el);

					let is_svg = el instanceof SVGElement; //will also include <svg></svg>
					let svgprops = ['d', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height','transform','stroke'];
					//not an exhaustive list of svg attributes that might be used

					if (style_prop === 'stroke-dashoffset' && is_svg) { //stroke-dashoffset is a special case, but we only care about going none to line fully drawn
						console.log('stroke-dashoffset');
						let length = el.getTotalLength() + Number(el.getAttribute('stroke-width'));
						console.log(length);
						style_val = length;
						el.style.setProperty('stroke-dasharray', length + ' ' + length);
					} else if (style_prop === 'pie') { //set pie reveal start
						this.startPie(el.id);
						let angles = style_val.split(/\s+/);
						this.specialAnimations[el.id].startAngle = Number(angles[0]);
						this.specialAnimations[el.id].endAngle = Number(angles[1]);
						console.log(el.id, angles[0], angles[1]);
						this.setPie(el.id);
					}
					//setting SVG attributes here
					if (is_svg && el.tagName !== 'svg' && svgprops.includes(style_prop)) {
						let original = `${style_prop}:${el.getAttribute(style_prop)}`; //preserve original
						el.setAttribute(style_prop, style_val);
						if (!this.specialAnimations[el.id]){
							this.specialAnimations[el.id] = {original:[original]};
						}else{
							this.specialAnimations[el.id].original.push(original);
						}
						console.log('specialAnimations', this.specialAnimations[el.id]);
					} else {
						el.style.setProperty(style_prop, style_val);
					}
					this.initializedElements.push(el);
				}
			}
		}

	}
	Animate(regionname){
		console.log('Animate!', regionname);
		let region = this.animatedRegions[regionname];
		if (!region) return;
		console.log(regionname, region);
		console.log(region.animationStep);

		if (region.animationStep > 0) {
			let prevstep = region.steps[region.animationStep - 1];
			region.animationDelay += this.cssTimeToMS((prevstep && prevstep.duration) || 0) + (prevstep && prevstep.offset ? this.cssTimeToMS(prevstep.offset) : 0);
		}

		if (region.steps.length) {
			let commands = region.steps[region.animationStep];
			console.log(commands);
			let elements = commands ? (commands.elements || []) : [];
			let duration = commands ? this.cssTimeToMS(commands.duration) : 0;
			let timing = this.getTimingFunc(commands?.timing);

			let stepoffset = commands && commands.offset ? this.cssTimeToMS(commands.offset) : 0;

			for (var n in elements) {
				let styles = this.stylestringToObj(elements[n].style, true) || {};
				console.log(styles);
				let selector = elements[n].selector;
				let el = elements[n];
				let substeps = elements[n].substeps;
				console.log(selector);

				//animeJS
				if (!this.animatedElements[selector]) {
					this.animatedElements[selector] = [];
				}
				let step = {
					duration,
					offset: region.animationDelay + stepoffset, //absolute offset, kept here to be in the loop
					easing: timing,
				};

				if (substeps) { //substeps is for staggered delay animations
					step.delay = (el, i, l) => i * duration / substeps;
					step.duration = duration / substeps;
				}

				console.log(this.specialAnimations);
				if (styles['pie']) { //pie, because it's a special animation
					console.log('pie!', el.selector);
					let pies = Array.from(document.querySelectorAll(el.selector));
					step.targets = [];
					pies.forEach((p, n) => {
						let id = p.id;
						console.log(id, this.specialAnimations[id]);
						step.targets.push(this.specialAnimations[id]);
					});
					let angles = styles['pie'].split(' ');
					step.startAngle = Number(angles[0]);
					step.endAngle = Number(angles[1]);
					console.log('startAngle', step.startAngle, 'endAngle', step.endAngle);
					step.update = () => { //custom function for anime JS
						console.log('step.update', step.startAngle, step.endAngle);
						let pies = Array.from(document.querySelectorAll(el.selector));
						pies.forEach((p) => {
							let id = p.id;
							if (this.specialAnimations[id]) this.setPie(id);
						});
					};
					delete styles['pie'];
					step = Object.assign(step, styles);
					console.log(step);
					this.animatedElements[selector].push(step);
				}
				for (let s in styles) {
					console.log(styles[s]);
					if (styles[s] === 'original' && this.specialAnimations) { //this was for things drawn by generated svg
						console.log('ORIGINAL SVG!');
						let selected = Array.from(document.querySelectorAll(elements[n].selector));
						selected.forEach((sel, n) => {
							let id = sel.id;
							console.log(id);
							if (this.specialAnimations[id] && this.specialAnimations[id].original) {
								styles[s] = this.specialAnimations[id].original;
							}
						});
					}
				}
				console.log(styles);
				step = Object.assign(step, styles);
				this.animatedElements[selector].push(step);
			}
			region.animationStep++;
			console.log('step:', region.animationStep, 'total steps:', region.steps.length);
			if (region.animationStep < region.steps.length) {
				this.Animate(regionname);
			} else if (region.animationStep === region.steps.length) { //prevent double animation
				this.executeAnimationTimeline();
			} else {
				console.log('Not Animating step:', region.animationStep, 'total steps:', region.steps.length);
			}
		}
	}
	//Do the actual anime.js stuff here
	executeAnimationTimeline(){
		//animeJS
		console.log('start anime timeline');
		let timeline = anime.timeline({ complete: (anim) => this.animationDone = true });

		console.log(this.animatedElements);
		for (let e in this.animatedElements) {
			let selector_steps = this.animatedElements[e];
			console.log(selector_steps);
			for (let s in selector_steps) {
				let step = selector_steps[s];
				if (!step.targets) step.targets = e;
				console.log(step, step.offset);
				try {
					timeline = timeline.add(step, step.offset);
				} catch (ex) {
					console.log(ex.message);
				}
			}
		}
		console.log(timeline);
	}
	cssTimeToMS(time){
		if (time && time.match(/s$/)) { //seconds
			return parseFloat(time) * 1000;
		} else {
			return parseInt(time);
		}
	}
	getTimingFunc(timing){
		if(!timing){
			return 'linear';
		} else {
			timing = this.toCamelCase(timing);
			switch(timing){
				case 'ease':
				case 'easeInOut':
					timing = 'easeInOutCubic';
					break;
				case 'easeIn':
					timing = 'easeInCubic';
					break;
				case 'easeOut':
					timing = 'easeOutCubic';
					break;
				default:
			}
		}
		return timing;
	}
	stylestringToObj(styles, camelCase){
		let obj = {};
		if (typeof styles == 'string'){
			let rules = styles.trim().split(/;\s?/);
			for(var r in rules){
				let rule = rules[r];
				if (rule){
					let parts = rule.split(/\s?:\s?/);
					console.log(parts);
					let prop = parts[0].trim();
					if (camelCase) prop = this.toCamelCase(prop);
					if (parts.length === 2) obj[prop] = parts[1].trim();
				}
			}
			styles = obj;
		}
		return styles;
	}
	toCamelCase(str){
		return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
	}
	//clear the style properties from elements
	clearStyles(){
		console.log('clearStyles animatedElements', this.animatedElements);
		for(let sel in this.animatedElements){
			let elements = Array.from(document.querySelectorAll(sel));
			for(let el of elements){
				console.log('clearing', el);
				el.removeAttribute('style');
			}
		}
		this.animatedElements = {};

		console.log('clearStyles initializedElements', this.initializedElements);
		for (let el of this.initializedElements) {
			el.removeAttribute('style');
		}

		console.log('clearStyles specialAnimations', this.specialAnimations);
		//restore originals svg attributes
		for(let id in this.specialAnimations){
			let el = document.getElementById(id);
			if (this.specialAnimations[id] && this.specialAnimations[id].original){
				for(let s of this.specialAnimations[id].original){
					let [attr, val] = s.split(':');
					el.setAttribute(attr, val);
				}
			}
		}
		this.specialAnimations = {};
	}
	//setup for the "pie" animation
	startPie(id){
		console.log('starting pie');
		let element = document.getElementById(id);
		if (element) {
			let  dims;
			let is_svg = element instanceof SVGElement && element.tagName!=='svg';
			if (is_svg) {
				console.log('svg element');
				if (element.querySelector('clipPath')) {
					dims = element.querySelector('clipPath').getBBox();
					//TODO the parameter {stroke:true} whenever most browsers except parameters fro getBBox
				} else {
					dims = element.getBBox();
				}

			} else {
				console.log('not svg element');
				dims = element.getBoundingClientRect();
			}

			console.log('Dimensions', dims);
			let width = dims.width;
			let height = dims.height;
			if (is_svg && element.getAttribute('stroke-width')){ //because stroke-width throws off the real dimensions
				width += Number(element.getAttribute('stroke-width'))*3;
				height += Number(element.getAttribute('stroke-width'))*3;
			}
			console.log('Width', width, 'Height',height);
			let center = { x: width / 2, y: height / 2 };
			let radius = Math.sqrt(Math.pow(center.x, 2) + Math.pow(center.y, 2));


			if (!this.specialAnimations[id]) this.specialAnimations[id] = {};
			console.log(center, radius);
			this.specialAnimations[id].center = center;
			this.specialAnimations[id].radius = radius;
			this.specialAnimations[id].startAngle = 0;
			this.specialAnimations[id].endAngle = 0;
			console.log('specialAnimations', id, this.specialAnimations);
			//arc
			let path = this.drawPie(center.x, center.y, radius, 0, 0);
			//element.style.clipPath = `path('${path}')`;
			element.style.setProperty('clip-path', `path('${path}')`);
			console.log(element);
		}
	}
	//sets the values for the pie animation clip-path
	setPie(id){
		//console.log('setPie');
		let center = this.specialAnimations[id].center;
		let radius = this.specialAnimations[id].radius;
		let start = this.specialAnimations[id].startAngle;
		let end = this.specialAnimations[id].endAngle;
		//console.log(id, start, end);
		try {
			let path = this.drawPie(center.x, center.y, radius, start, end);
			document.getElementById(id).style.setProperty('clip-path',`path('${path}')`);
		} catch (ex) {
			console.log(ex.message);
		}
	}
	//gets the values for the path properties for "pie" animation
	drawPie(x, y, radius, startAngle, endAngle){
		var arc = this.arcValues(x, y, radius, startAngle, endAngle);

		var d = [
			"M", x, y,
			"L", arc.start.x, arc.start.y,
			"A", radius, radius, 0, arc.largeArcFlag, 1, arc.start2.x, arc.start2.y,
			"A", radius, radius, 0, arc.largeArcFlag, 1, arc.end.x, arc.end.y,
			"Z"
		].join(" ");
		//console.log(startAngle, endAngle, d);
		return d;
	}
	//does the calculation for an arc path in "pie" animation
	arcValues(x, y, radius, startAngle, endAngle){
        if (startAngle > endAngle){ //switch if startAngle bigger than endAngle
            let tempAngle = startAngle;
            startAngle = endAngle;
            endAngle = tempAngle;
        }
        if (startAngle >= 360){
            let times = Math.floor(startAngle/360);
            startAngle -= times*360;
            endAngle -= times*360;
        }
        let arcAngle = endAngle - startAngle;
        if (arcAngle > 360){
            let times = Math.floor(arcAngle/360);
            endAngle -= times*360;
            arcAngle -= times*360;
        }

        //half arcs needed because it won't draw 360
        var start = this.polarToCartesian(x, y, radius, startAngle);
        var start2 = this.polarToCartesian(x, y, radius, (endAngle+startAngle)/2);
        var end = this.polarToCartesian(x, y, radius, endAngle > 360 ? endAngle-360 : endAngle);

        var largeArcFlag = arcAngle/2 <= 180 ? "0" : "1";
        return {start, start2, end, largeArcFlag};
    }
	//converts polar to cartesian
	polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = this.radians(angleInDegrees-90);

        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        };
    }
	//converts degree angles to radians
	radians(deg){
        return deg * Math.PI / 180.0;
    }
}