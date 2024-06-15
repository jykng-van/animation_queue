# Animation Queue <br>
This takes a JSON script and translates it into a timeline object for the library [Anime.js](https://animejs.com/). It was originally a work project used in a SPA written for Vue.js, this version the main Animation class is more platform independent. <br>

But was designed to work with an React.js app for this example. It's was made for a CMS and where implementing animation scripts was something to use along with the html content. This example uses some hardcoded HTML, and just loads different animation scripts to show off some of the capabilities. <br>

## The scripts <br>
There's 2 properties that are central to Animation Queue, **start** which establishes a starting state for the animations. This is an array with objects which have *selector* a css selector string and *style* which is written as a css properties string. These apply css style properties or sets attributes (if an embedded SVG). <br>

The **animations** property describes the steps in the animation. Theses are an array of regions, if there's no *trigger* and *threshold* in the first region it's the "default" region which runs without scrolling. The properties *trigger* and *threshold* are for regions is scrolled to past a certain threshold. <br>

Each region has *steps* this is an array of animation steps, steps have a *duration* like `1s` and are assumed to run directly after previous step durations are complete. The prop *offset* changes when the step executes, it's a relative value for the step, *timing* is a css timing type many of them work and but it'll linear by default. <br>

Each step contains the array *elements* which have *selector* and *style* just like start, and can also contain *substeps* for staggered delay animation of multiple objects, which should be the number elements animated. <br>

There's a [schema](https://github.com/jykng-van/animation_queue/blob/main/public/AnimationSchema.json) for this json script. <br>

## Special Exceptions <br>
There's a custom animation for Pie/Clock Reveal, it's presented as something like `pie: 0 360` where the first number is the start angle and the second is the end angle of a circular clip-path arc. Pie/Clock Reveal has calculations that depend on the size of the element, so make sure to set that after anything that changes the size of an element. <br>

The prop *stroke-dashoffset* is only concerned with drawing lines, any value can be used of *stroke-dashoffset* in start and *stroke-dasharray* will be added to the starting state, and then animations should use `stroke-dashoffset:0` <br>

## Difference between Start and Animations <br>

The same types of units and same number of props (example `padding:5% 10%` and `padding:10% 2%`) between **start** **and animations** should be used. **animations** uses css transform as individual properties (like `rotate:90deg`), but **start** uses css transforms (example `transform:rotate(45deg)`).